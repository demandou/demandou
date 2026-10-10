import { prisma } from "@/lib/db/prisma";
import { modeloGravadoNoProjeto, modeloPodeSerEscolhido, modeloServeNoCorte } from "./no-corte";
import {
  idsDosArquivos,
  normalizarItens,
  pedeMaterial,
  situacaoDoMaterial,
  type ItemDoMaterial,
  type PapelDoMaterial,
  type SituacaoDoMaterial,
} from "./material-do-modelo";

/**
 * O MATERIAL DO CLIENTE NOS MODELOS DO CURSO, no servidor (10/10/2026). As
 * regras puras estão em material-do-modelo.ts; aqui, o que lê e grava.
 *
 * O material de um modelo é um conjunto de fotos da Biblioteca de materiais do
 * projeto (MaterialDoCliente), marcadas para ele com o nome e a descrição do
 * cliente, em `ProjectMemory` (tipo "editor", chave `material-do-modelo:<id>`).
 * Cada modelo guarda o seu: trocar de modelo e voltar não perde o que foi
 * marcado. Foto apagada da Biblioteca sai sozinha (a leitura cruza com ela).
 */

const TIPO = "editor";
const chave = (modelo: string) => `material-do-modelo:${modelo}`;

/** Um item com o arquivo da Biblioteca por trás (a URL fica no servidor; a tela vê pela rota do projeto). */
export type ItemComArquivo = ItemDoMaterial & { url: string; largura: number | null; altura: number | null };

async function itensGuardados(projectId: string, modelo: string): Promise<ItemDoMaterial[]> {
  const linha = await prisma.projectMemory.findUnique({
    where: { projectId_type_key: { projectId, type: TIPO, key: chave(modelo) } },
    select: { value: true },
  });
  return normalizarItens(modelo, (linha?.value as { itens?: unknown } | null)?.itens);
}

/** Os itens marcados para o modelo que ainda existem na Biblioteca (só fotos do projeto). */
export async function lerMaterialDoModelo(projectId: string, modelo: string): Promise<ItemComArquivo[]> {
  const itens = await itensGuardados(projectId, modelo);
  if (!itens.length) return [];
  const linhas = await prisma.materialDoCliente.findMany({
    where: { projectId, tipo: "foto", id: { in: itens.map((i) => i.materialId) } },
    select: { id: true, url: true, largura: true, altura: true },
  });
  const porId = new Map(linhas.map((l) => [l.id, l]));
  return itens.flatMap((i) => {
    const l = porId.get(i.materialId);
    return l ? [{ ...i, url: l.url, largura: l.largura, altura: l.altura }] : [];
  });
}

export async function situacaoDoMaterialNoProjeto(projectId: string, modelo: string): Promise<SituacaoDoMaterial> {
  const itens = await lerMaterialDoModelo(projectId, modelo);
  return situacaoDoMaterial(
    modelo,
    itens.map(({ materialId, nome, descricao, papel }) => ({ materialId, nome, descricao, ...(papel !== undefined ? { papel } : {}) }))
  );
}

/**
 * Grava o material do modelo. Só entram fotos do próprio projeto; acima do
 * máximo, recusa (a tela diz quantos). Devolve a situação, com o que falta.
 */
export async function gravarMaterialDoModelo(
  projectId: string,
  modelo: string,
  bruto: unknown
): Promise<{ ok: true; situacao: SituacaoDoMaterial } | { ok: false; erro: string }> {
  if (!modeloPodeSerEscolhido(modelo) || !pedeMaterial(modelo)) return { ok: false, erro: "Este modelo não usa material seu." };
  const itens = normalizarItens(modelo, bruto);
  const situacaoCrua = situacaoDoMaterial(modelo, itens);
  if (itens.length > situacaoCrua.maximo) return { ok: false, erro: `Este modelo usa no máximo ${situacaoCrua.maximo}. Tire ${itens.length - situacaoCrua.maximo}.` };
  const doProjeto = await prisma.materialDoCliente.findMany({
    where: { projectId, tipo: "foto", id: { in: itens.map((i) => i.materialId) } },
    select: { id: true },
  });
  const validos = new Set(doProjeto.map((m) => m.id));
  const fora = itens.filter((i) => !validos.has(i.materialId)).length;
  if (fora) return { ok: false, erro: fora === 1 ? "Uma das imagens não é uma foto da biblioteca deste projeto." : `${fora} imagens não são fotos da biblioteca deste projeto.` };
  const value = { itens, em: new Date().toISOString() };
  await prisma.projectMemory.upsert({
    where: { projectId_type_key: { projectId, type: TIPO, key: chave(modelo) } },
    create: { projectId, type: TIPO, key: chave(modelo), value },
    update: { value },
  });
  return { ok: true, situacao: situacaoDoMaterial(modelo, itens) };
}

/** O modelo serve nos cortes deste projeto agora (o automático, ou o que pede material com o material que basta)? */
export async function modeloServeNoProjeto(projectId: string, modelo: string | null | undefined): Promise<boolean> {
  if (modeloServeNoCorte(modelo)) return true;
  if (!modelo || !pedeMaterial(modelo)) return false;
  return Boolean(modeloServeNoCorte(modelo, await situacaoDoMaterialNoProjeto(projectId, modelo)));
}

/** O modelo escolhido no projeto (o que serve sozinho ou o que pede material, mesmo esperando por ele), ou null. */
export async function modeloEscolhidoDoProjeto(projectId: string): Promise<string | null> {
  const modelo = await modeloGravadoNoProjeto(projectId);
  return modeloPodeSerEscolhido(modelo) ? modelo : null;
}

/**
 * O CORTE ESPERA O MATERIAL? Com o modelo do corte (o fixo do "refazer neste
 * estilo", ou o do projeto) pedindo material que ainda não basta: o que falta,
 * na frase da tela. Null: não espera (o modelo não pede, ou o material basta).
 */
export async function faltaDoMaterialNoCorte(projectId: string, fixo?: string | null): Promise<{ modelo: string; falta: string } | null> {
  const modelo = fixo ?? (await modeloEscolhidoDoProjeto(projectId));
  if (!modelo || !pedeMaterial(modelo) || !modeloPodeSerEscolhido(modelo)) return null;
  const s = await situacaoDoMaterialNoProjeto(projectId, modelo);
  return s.basta ? null : { modelo, falta: s.falta ?? "Falta o material do modelo." };
}

/** O que vai ao worker: cada arquivo com o id que o plano cita, a URL, o nome, a descrição e o papel. */
export type MaterialParaOWorker = { itens: Array<{ id: string; url: string; nome: string; descricao: string; papel: PapelDoMaterial | null }> };

/**
 * O material do modelo para o pedido do worker. Null quando o modelo não pede
 * material. Sem o material que basta, lança: a esteira não manda o corte sem
 * ele (quem chama já esperou por ele).
 */
export async function materialParaOWorker(projectId: string, modelo: string): Promise<MaterialParaOWorker | null> {
  if (!pedeMaterial(modelo)) return null;
  const itens = await lerMaterialDoModelo(projectId, modelo);
  const s = situacaoDoMaterial(modelo, itens);
  if (!s.basta) throw new Error(`o material do modelo ${modelo} não basta: ${s.falta}`);
  const ids = idsDosArquivos(modelo, itens);
  const { marcarUso } = await import("@/lib/materiais/servidor");
  await Promise.all(itens.map((i) => marcarUso(i.materialId)));
  return { itens: itens.map((i, k) => ({ id: ids[k], url: i.url, nome: i.nome, descricao: i.descricao, papel: i.papel ?? null })) };
}
