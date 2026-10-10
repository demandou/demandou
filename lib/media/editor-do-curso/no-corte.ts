import { prisma } from "@/lib/db/prisma";
import catalogo from "./catalogo.json";

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
