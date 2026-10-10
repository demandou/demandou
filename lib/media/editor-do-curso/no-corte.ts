import { prisma } from "@/lib/db/prisma";
import catalogo from "./catalogo.json";
import { editorAvancadoLigado, ID_SOB_MEDIDA } from "@/lib/media/editor-avancado/no-corte";

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

export type ModeloDoCurso = {
  id: string;
  nome: string;
  descricao: string;
  formato: "9:16" | "16:9";
  assinatura: string[];
  /** O que ainda pede um passo fora do fluxo automático (imagens, 3D, capturas...). */
  pede: string[];
  automatico: boolean;
};

export const MODELOS_DO_CURSO = catalogo as ModeloDoCurso[];

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
  return { escolhido: v?.modelo ?? null, reserva: v?.reserva ?? null };
}

/**
 * O MODELO DO CURSO cujo ESTILO vale no projeto (os cortes, as peças e as
 * artes). Com a edição sob medida escolhida (10/10), é o modelo de reserva
 * dela: as peças e as artes seguem nele, e os cortes vão pela edição sob
 * medida (montagem-nos-cortes.ts decide por `escolhaDoEditorDoProjeto`).
 */
export async function modeloDoCursoDoProjeto(projectId: string): Promise<string | null> {
  const { escolhido, reserva } = await escolhaDoEditorDoProjeto(projectId);
  return modeloServeNoCorte(escolhido === ID_SOB_MEDIDA ? reserva : escolhido)?.id ?? null;
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
  if (modelo === ID_SOB_MEDIDA) {
    if (!editorAvancadoLigado()) throw new Error("a edição sob medida ainda não está ligada");
    const antes = await escolhaDoEditorDoProjeto(projectId);
    const reserva = modeloServeNoCorte(antes.escolhido === ID_SOB_MEDIDA ? antes.reserva : antes.escolhido)?.id ?? null;
    value = { modelo, reserva, em: new Date().toISOString() };
  } else {
    if (!modeloServeNoCorte(modelo)) throw new Error(`modelo do curso indisponível no corte: ${modelo}`);
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
