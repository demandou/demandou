import { prisma } from "@/lib/db/prisma";
import catalogo from "./catalogo.json";
import versoes from "./versoes.json";
import { materialBasta, materialDisponivel, type SituacaoDoMaterial } from "./material-do-modelo";
import { editorAvancadoLigado, ehSobMedida } from "@/lib/media/editor-avancado/no-corte";

/**
 * OS MODELOS DO CURSO NA ESTEIRA DOS CORTES (09/10/2026).
 *
 * Decisão do Bruno: os modelos do curso "Máquina de Edição IA" viram o editor
 * da Demandou, e o editor antigo (Vox, impacto, sóbrio) fica de reserva. O
 * modelo escolhido mora no PROJETO, em `ProjectMemory` (tipo "editor", chave
 * "modelo-do-curso"), do mesmo jeito que o estilo próprio do cliente: sem
 * coluna nova, e sem mexer na escolha de estilo antiga, que continua valendo
 * para a reserva.
 *
 * A trava é EDITOR_DO_CURSO=1. Ligada, só o projeto com um modelo escolhido
 * vai pelo caminho novo; os outros seguem como estão.
 */

export type FormatoDoModelo = "9:16" | "16:9";

export type ModeloDoCurso = {
  id: string;
  nome: string;
  descricao: string;
  formato: FormatoDoModelo;
  assinatura: string[];
  /** O que ainda pede um passo fora do fluxo automático (imagens, 3D, capturas...). */
  pede: string[];
  automatico: boolean;
  /** O modelo desenha em 3D (three.js no template): vai ao grupo "3D e efeitos" da grade. */
  three?: boolean;
};

export const MODELOS_DO_CURSO = catalogo as ModeloDoCurso[];

/**
 * AS VERSÕES DE CADA MODELO POR FORMATO (10/10/2026). Os modelos nascem num
 * formato só (77 verticais, o Aula e o Canal deitados) e cada um ganha à mão a
 * versão no outro formato ao lado dele (worker/modelos/<id>-16x9 e <id>-9x16).
 * A lista sai do disco (worker/modelos/versoes.mjs, `npm run modelos:versoes`)
 * para versoes.json, porque o app na Vercel não enxerga a pasta do worker; o
 * worker confere de novo pelo disco (editar-no-modelo.mjs, modeloNoFormato) e o
 * teste confere que cada pasta daqui existe lá.
 */
export const VERSOES_DOS_MODELOS = versoes as Readonly<Record<string, Readonly<Partial<Record<FormatoDoModelo, string>>>>>;

/**
 * A pasta do modelo no formato pedido: o próprio modelo no formato nativo dele,
 * a versão do versoes.json no outro; null quando ainda não há (ou o id não é do
 * catálogo).
 */
export function versaoNoFormato(id: string | null | undefined, formato: FormatoDoModelo): string | null {
  const m = id ? MODELOS_DO_CURSO.find((x) => x.id === id) : null;
  if (!m) return null;
  if (m.formato === formato) return m.id;
  return VERSOES_DOS_MODELOS[m.id]?.[formato] ?? null;
}

const TIPO = "editor";
const CHAVE = "modelo-do-curso";

export function editorDoCursoLigado(): boolean {
  return process.env.EDITOR_DO_CURSO === "1";
}

/**
 * Só entra no corte o modelo que tem a versão vertical (o próprio modelo,
 * quando nasce 9:16, ou a versão <id>-9x16 do versoes.json, quando nasce
 * deitado: o Aula e o Canal, 10/10) e que roda inteiro sem ninguém de fora, ou
 * (10/10) o que pede material do cliente quando o `material` do projeto basta
 * (material-do-modelo.ts). O pedido do corte vai sempre com `formato: "9:16"`,
 * e o worker escolhe a pasta.
 */
export function modeloServeNoCorte(id: string | null | undefined, material?: SituacaoDoMaterial | null): ModeloDoCurso | null {
  const m = MODELOS_DO_CURSO.find((x) => x.id === id);
  return m && (m.automatico || materialBasta(m.id, material)) && versaoNoFormato(m.id, "9:16") ? m : null;
}

/** Pode ser escolhido (10/10): o que serve sozinho e o que pede material do cliente, que fica escolhido esperando por ele. */
export function modeloPodeSerEscolhido(id: string | null | undefined): boolean {
  const m = MODELOS_DO_CURSO.find((x) => x.id === id);
  return Boolean(m && versaoNoFormato(m.id, "9:16") && (m.automatico || materialDisponivel(m.id)));
}

/**
 * A escolha crua do projeto: o modelo escolhido (um modelo do curso ou
 * "sob-medida", a edição sob medida do editor avançado) e a reserva gravada
 * junto com a edição sob medida (o modelo do curso que o projeto usava antes).
 */
export async function escolhaDoEditorDoProjeto(projectId: string): Promise<{ escolhido: string | null; reserva: string | null }> {
  const linha = await prisma.projectMemory.findUnique({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
    select: { value: true },
  });
  const v = linha?.value as { modelo?: string; reserva?: string | null } | null;
  return { escolhido: typeof v?.modelo === "string" ? v.modelo : null, reserva: typeof v?.reserva === "string" ? v.reserva : null };
}

/** O modelo do curso gravado no projeto, sem conferir se serve (com a edição sob medida, a reserva dela). */
export async function modeloGravadoNoProjeto(projectId: string): Promise<string | null> {
  const { escolhido, reserva } = await escolhaDoEditorDoProjeto(projectId);
  return ehSobMedida(escolhido) ? reserva : escolhido;
}

/**
 * O MODELO DO CURSO cujo ESTILO vale no projeto (os cortes, as peças e as
 * artes). Com a edição sob medida escolhida (10/10), é o modelo de reserva
 * dela: as peças e as artes seguem nele, e os cortes vão pela edição sob
 * medida (montagem-nos-cortes.ts decide por `escolhaDoEditorDoProjeto`). O que
 * pede material (10/10) só vale com o material que basta.
 */
export async function modeloDoCursoDoProjeto(projectId: string): Promise<string | null> {
  const modelo = await modeloGravadoNoProjeto(projectId);
  if (!modelo) return null;
  if (modeloServeNoCorte(modelo)) return modelo;
  const { modeloServeNoProjeto } = await import("./material-do-modelo-servidor");
  return (await modeloServeNoProjeto(projectId, modelo)) ? modelo : null;
}

/**
 * O "MEU ESTILO" CONFIRMADO VENCE O MODELO DO CURSO? (10/10, noite, bug do
 * teste do Bruno no Torre.) Só quando ele é o estilo próprio do cliente (não
 * a fala que saiu de um modelo) E foi confirmado DEPOIS da escolha do modelo:
 * escolher um modelo é pedir as peças nele. Antes, um estilo próprio antigo
 * (o de 09/10) seguia confirmado e as artes da campanha saíam nele, mesmo com
 * o Torre escolhido antes do envio.
 */
export async function estiloProprioValeSobreOModelo(projectId: string): Promise<boolean> {
  const { estadoDoMeuEstilo } = await import("@/lib/estilo-proprio/servidor");
  const { modeloDaFala } = await import("./estilo-das-pecas");
  const confirmado = (await estadoDoMeuEstilo(projectId).catch(() => null))?.confirmado ?? null;
  if (!confirmado || modeloDaFala(confirmado.falas?.[0])) return false;
  const linha = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } }, select: { value: true, updatedAt: true } });
  const escolhidoEm = (linha?.value as { em?: string } | null)?.em ?? linha?.updatedAt?.toISOString() ?? null;
  return estiloProprioDepoisDoModelo((confirmado as { em?: string }).em ?? null, escolhidoEm);
}

/** Puro: o estilo próprio só vale se foi confirmado depois da escolha do modelo (sem data do modelo, vale o estilo). */
export function estiloProprioDepoisDoModelo(confirmadoEm: string | null, modeloEscolhidoEm: string | null): boolean {
  if (!modeloEscolhidoEm) return true;
  if (!confirmadoEm) return false;
  return new Date(confirmadoEm).getTime() > new Date(modeloEscolhidoEm).getTime();
}

/**
 * Grava (ou apaga, com `null`) o modelo do curso do projeto. "sob-medida" (a
 * edição sob medida, com EDITOR_AVANCADO=1) guarda junto, como reserva, o
 * modelo do curso que estava em uso: um corte que falhar na edição sob medida
 * vai para ele.
 */
export async function escolherModeloDoCurso(projectId: string, modelo: string | null): Promise<void> {
  if (!modelo) {
    await prisma.projectMemory.delete({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } } }).catch(() => {});
    return;
  }
  let value: Record<string, unknown>;
  if (ehSobMedida(modelo)) {
    if (!editorAvancadoLigado()) throw new Error("a edição sob medida ainda não está ligada");
    const antes = await escolhaDoEditorDoProjeto(projectId);
    const reserva = modeloServeNoCorte(ehSobMedida(antes.escolhido) ? antes.reserva : antes.escolhido)?.id ?? null;
    value = { modelo, reserva, em: new Date().toISOString() };
  } else {
    if (!modeloPodeSerEscolhido(modelo)) throw new Error(`modelo do curso indisponível no corte: ${modelo}`);
    value = { modelo, em: new Date().toISOString() };
  }
  await prisma.projectMemory.upsert({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
    create: { projectId, type: TIPO, key: CHAVE, value: value as never },
    update: { value: value as never },
  });
}

/** A fala do corte no formato do curso (work/palavras.json): [{ em, ate, w }]. */
export function palavrasDoCurso(palavras: Array<{ texto: string; inicio: number; fim: number }>): Array<{ em: number; ate: number; w: string }> {
  return palavras.filter((p) => p.texto?.trim()).map((p) => ({ em: +p.inicio.toFixed(3), ate: +Math.max(p.fim, p.inicio + 0.05).toFixed(3), w: p.texto.trim() }));
}

/**
 * As cores da marca para o modelo do curso (10/10, regra do Bruno: o estilo é
 * do modelo, a cor é da marca): os papéis da identidade do projeto (aprovada,
 * ou a da paleta salva). O worker troca a cor de assinatura do modelo pelo
 * destaque (worker/src/modelo/cores-da-marca.mjs). Null sem projeto legível.
 */
export async function coresDaMarcaParaOModelo(projectId: string): Promise<{ fundo: string; titulo: string; destaque: string } | null> {
  const { estadoDaIdentidade } = await import("@/lib/modelos-de-arte/identidade-aprovada");
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { colorPalette: true } });
  const e = await estadoDaIdentidade(projectId, p?.colorPalette).catch(() => null);
  return e?.papeis ? { fundo: e.papeis.fundo, titulo: e.papeis.titulo, destaque: e.papeis.destaque } : null;
}

/**
 * Quem fala, para a etiqueta e a assinatura do modelo. O curso pede nome e
 * área; o nome é o do dono do projeto e a área fica vazia, para o redator do
 * plano resumir do assunto do perfil (sem inventar).
 */
export async function quemFalaNoProjeto(projectId: string): Promise<{ nome: string; area: string }> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { user: { select: { name: true } } } });
  return { nome: p?.user?.name?.trim() ?? "", area: "" };
}

/**
 * O VÍDEO COMPLETO NO MODELO DO CURSO (10/10/2026). Decisão do Bruno: o
 * completo sai no modelo escolhido no projeto, com o estilo do modelo e a cor
 * da marca, como os cortes, NO FORMATO DA GRAVAÇÃO:
 *   - gravação deitada: a VERSÃO DEITADA (16:9) do modelo (worker/modelos/
 *     <id>-16x9, feita à mão como na aula 9 do curso; o Aula e o Canal já
 *     nascem assim);
 *   - gravação em pé: o próprio modelo vertical (9:16), ou a versão <id>-9x16
 *     do Aula e do Canal, com o plano em blocos e o render em partes do completo
 *     deitado.
 * versoes.json (VERSOES_DOS_MODELOS, gerado do disco) diz quais versões já há.
 *
 * A trava é COMPLETO_PELO_MODELO=1 (desligada por padrão). Sem ela, sem modelo
 * no projeto, sem a versão no formato da gravação ou depois de o caminho do
 * curso desistir neste completo, vale o editor de sempre (a reserva).
 */
export function versaoDeitadaDoModelo(id: string | null | undefined): string | null {
  return versaoNoFormato(id, "16:9");
}

export function completoPeloModeloLigado(): boolean {
  return process.env.COMPLETO_PELO_MODELO === "1";
}

export type CaminhoDoCompleto = { caminho: "curso"; modelo: string; versao: string; formato: FormatoDoModelo } | { caminho: "reserva"; motivo: string };

/**
 * Curso ou reserva para o completo. Puro: a trava, o modelo do projeto, a
 * desistência anterior e o quadro da gravação (quando já se sabe). Em pé vai no
 * 9:16 do modelo, deitada no 16:9. Sem a medida do quadro, vale a deitada
 * quando o modelo tem (senão a em pé); o pedido vai com `formatoPelaGravacao` e
 * o worker, que mede a gravação, troca para a versão do formato dela.
 */
export function caminhoDoCompleto(p: {
  ligado: boolean;
  modelo: string | null | undefined;
  desistiu?: string | null;
  quadro?: { largura: number; altura: number } | null;
}): CaminhoDoCompleto {
  if (!p.ligado) return { caminho: "reserva", motivo: "a trava COMPLETO_PELO_MODELO está desligada" };
  if (!p.modelo) return { caminho: "reserva", motivo: "o projeto não tem modelo do curso" };
  if (p.desistiu) return { caminho: "reserva", motivo: `o modelo do curso desistiu deste completo: ${p.desistiu}` };
  const emPe = p.quadro && p.quadro.largura > 0 && p.quadro.altura > 0 ? p.quadro.altura > p.quadro.largura : null;
  const formato: FormatoDoModelo = emPe === null ? (versaoNoFormato(p.modelo, "16:9") ? "16:9" : "9:16") : emPe ? "9:16" : "16:9";
  const versao = versaoNoFormato(p.modelo, formato);
  if (!versao) {
    return {
      caminho: "reserva",
      motivo: emPe ? `a gravação é em pé e o modelo ${p.modelo} ainda não tem a versão em pé (9:16)` : `o modelo ${p.modelo} ainda não tem a versão deitada (16:9)`,
    };
  }
  return { caminho: "curso", modelo: p.modelo, versao, formato };
}

/**
 * O prazo do app para o callback do completo no modelo: o da montagem (render
 * de 8 s por segundo, mais a fila) e ~12 min por bloco de 150 s do plano
 * (escrita, conserto e revisão), a mesma conta do worker.
 */
export function prazoDoCompletoNoModeloMs(duracaoSeg: number | null | undefined): number {
  const dur = Number(duracaoSeg) > 0 ? Number(duracaoSeg) : 1200;
  return Math.round((20 * 60 + dur * 8) * 1000) + 45 * 60_000 + Math.ceil(dur / 150) * 12 * 60_000;
}

/**
 * O teto de IA de um corte no editor do curso. A régua da casa é US$ 1 por
 * minuto de vídeo (08/10); no editor do curso o Bruno liberou até US$ 2 por
 * corte (10/10, "pode liberar o gasto que você recomendou"), porque o fluxo
 * inteiro (imagens, plano, revisão do passo 8 e o conserto dela) custa de
 * US$ 0,70 a 1,30 num corte de 50 s, e com US$ 1 o conserto da revisão ficava
 * de fora nos modelos com imagem. EDITOR_DO_CURSO_TETO_USD troca o piso;
 * corte longo segue US$ 1 por minuto quando passa dele.
 */
export function tetoDoPlanoUsd(duracaoSeg: number): number {
  const piso = Number(process.env.EDITOR_DO_CURSO_TETO_USD) > 0 ? Number(process.env.EDITOR_DO_CURSO_TETO_USD) : 2;
  return +Math.max(piso, (duracaoSeg / 60) * 1).toFixed(2);
}
