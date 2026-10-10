import { prisma } from "@/lib/db/prisma";
import catalogo from "./catalogo.json";
import versoes from "./versoes.json";

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

/** Só entra no corte o modelo vertical que roda inteiro sem ninguém de fora. */
export function modeloServeNoCorte(id: string | null | undefined): ModeloDoCurso | null {
  const m = MODELOS_DO_CURSO.find((x) => x.id === id);
  return m && m.automatico && m.formato === "9:16" ? m : null;
}

export async function modeloDoCursoDoProjeto(projectId: string): Promise<string | null> {
  const linha = await prisma.projectMemory.findUnique({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
    select: { value: true },
  });
  const v = linha?.value as { modelo?: string } | null;
  return modeloServeNoCorte(v?.modelo)?.id ?? null;
}

/** Grava (ou apaga, com `null`) o modelo do curso do projeto. */
export async function escolherModeloDoCurso(projectId: string, modelo: string | null): Promise<void> {
  if (!modelo) {
    await prisma.projectMemory.delete({ where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } } }).catch(() => {});
    return;
  }
  if (!modeloServeNoCorte(modelo)) throw new Error(`modelo do curso indisponível no corte: ${modelo}`);
  const value = { modelo, em: new Date().toISOString() };
  await prisma.projectMemory.upsert({
    where: { projectId_type_key: { projectId, type: TIPO, key: CHAVE } },
    create: { projectId, type: TIPO, key: CHAVE, value },
    update: { value },
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
 * completo do YouTube sai numa VERSÃO DEITADA (16:9) do modelo escolhido no
 * projeto, com o estilo do modelo e a cor da marca, como os cortes. Cada
 * modelo ganha a versão deitada à mão (worker/modelos/<id>-16x9, aula 9 do
 * curso); versoes.json (VERSOES_DOS_MODELOS, gerado do disco) diz quais já têm.
 *
 * A trava é COMPLETO_PELO_MODELO=1 (desligada por padrão). Sem ela, sem modelo
 * no projeto, sem versão deitada, com a gravação em pé ou depois de o caminho
 * do curso desistir neste completo, vale o editor de sempre (a reserva).
 */
export function versaoDeitadaDoModelo(id: string | null | undefined): string | null {
  return versaoNoFormato(id, "16:9");
}

export function completoPeloModeloLigado(): boolean {
  return process.env.COMPLETO_PELO_MODELO === "1";
}

export type CaminhoDoCompleto = { caminho: "curso"; modelo: string; versao: string } | { caminho: "reserva"; motivo: string };

/** Curso ou reserva para o completo. Puro: a trava, o modelo do projeto, a desistência anterior e o quadro da gravação (quando já se sabe). */
export function caminhoDoCompleto(p: {
  ligado: boolean;
  modelo: string | null | undefined;
  desistiu?: string | null;
  quadro?: { largura: number; altura: number } | null;
}): CaminhoDoCompleto {
  if (!p.ligado) return { caminho: "reserva", motivo: "a trava COMPLETO_PELO_MODELO está desligada" };
  if (!p.modelo) return { caminho: "reserva", motivo: "o projeto não tem modelo do curso" };
  if (p.desistiu) return { caminho: "reserva", motivo: `o modelo do curso desistiu deste completo: ${p.desistiu}` };
  const versao = versaoDeitadaDoModelo(p.modelo);
  if (!versao) return { caminho: "reserva", motivo: `o modelo ${p.modelo} ainda não tem a versão deitada (16:9)` };
  if (p.quadro && p.quadro.altura > p.quadro.largura) return { caminho: "reserva", motivo: "a gravação é em pé: a versão deitada não serve" };
  return { caminho: "curso", modelo: p.modelo, versao };
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
