import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { prisma } from "@/lib/db/prisma";
import { editorDoCursoLigado, escolherModeloDoCurso, modeloDoCursoDoProjeto, modeloServeNoCorte } from "@/lib/media/editor-do-curso/no-corte";
import { modelosDaBiblioteca } from "@/lib/media/editor-do-curso/biblioteca";
import { recomendarModelo, situacaoDaRecomendacao } from "@/lib/media/editor-do-curso/recomendacao";

/**
 * OS MODELOS DO CURSO NA BIBLIOTECA DE ESTILOS (09/10/2026, noite).
 *
 * GET devolve o modelo escolhido no projeto, a recomendação pelo perfil que
 * ainda vale (ou null) e os cartões dos 79 modelos, os que servem no corte e
 * os que chegam em breve. Não faz chamada paga: `pendente` diz que falta
 * calcular a recomendação (sem guardada, ou o perfil mudou).
 *
 * POST calcula a recomendação quando ela está pendente (o JEV decide, o Haiku
 * escreve o motivo) e devolve a guardada nos outros casos. A tela chama logo
 * depois do GET, para a grade aparecer sem esperar.
 *
 * PUT { modelo: string | null } grava a escolha (null volta ao editor de
 * antes). 400 quando o modelo ainda não serve no corte.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function podeUsar(id: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const p = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  // Dono ou membro da equipe com o projeto liberado (01/10).
  return podeUsarProjeto(userId, p);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [modelo, s] = await Promise.all([modeloDoCursoDoProjeto(id), situacaoDaRecomendacao(id)]);
  return NextResponse.json({
    ligado: editorDoCursoLigado(),
    modelo,
    recomendacao: s.recomendacao,
    pendente: s.pendente,
    modelos: modelosDaBiblioteca(),
  });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const r = await recomendarModelo(id);
    return NextResponse.json({ recomendacao: r.recomendacao, pendente: false });
  } catch (e) {
    console.error(`[modelo-do-curso][recomendar] ${id}: ${e instanceof Error ? e.message : e}`);
    // Sem recomendação, a tela segue com a lista inteira; nada é inventado.
    return NextResponse.json({ recomendacao: null, pendente: false });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const corpo = (await req.json().catch(() => null)) as { modelo?: unknown } | null;
  if (!corpo || !("modelo" in corpo) || (corpo.modelo !== null && typeof corpo.modelo !== "string")) {
    return NextResponse.json({ error: "Diga qual modelo usar, ou null para voltar ao editor de antes." }, { status: 400 });
  }
  const modelo = corpo.modelo as string | null;
  if (modelo !== null && !modeloServeNoCorte(modelo)) {
    return NextResponse.json({ error: "Este modelo ainda não pode ser usado nos cortes." }, { status: 400 });
  }
  await escolherModeloDoCurso(id, modelo);
  return NextResponse.json({ ok: true, modelo });
}
