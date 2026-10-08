export const dynamic = "force-dynamic";
/** A derivação do design mestre passa pelo JEV e pelo redator da biblioteca: até um minuto. */
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { soODono } from "@/lib/equipe/permissoes";
import { estadoDoMestre, garantirDesignMestre, salvarModoDosPosts } from "@/lib/estilo-dos-posts/design-mestre";
import { estadoDoEstiloDosPosts } from "@/lib/estilo-dos-posts/servidor";

/**
 * O ESTILO MESTRE DOS POSTS (08/10/2026). Ver lib/estilo-dos-posts/estilo-mestre.ts.
 *
 * POST: prepara o design mestre (o design de arte que sai do estilo do vídeo).
 *   Só chama a biblioteca (JEV e redator) quando o estilo do vídeo mudou desde
 *   o último design mestre; com ele em dia, devolve o gravado sem IA. Qualquer
 *   pessoa que usa o projeto pode pedir: o membro da equipe também gera
 *   campanha, e o design mestre sai do estilo que o dono já escolheu.
 * PUT: o dono volta o padrão dos posts do projeto para o estilo mestre (a
 *   primeira opção de Configurações > Estilo dos posts).
 */

async function projetoDoUsuario(id: string) {
  const { userId } = await auth();
  if (!userId) return { erro: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!project || !(await podeUsarProjeto(userId, project))) return { erro: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { project, userId };
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await projetoDoUsuario(id);
  if (r.erro) return r.erro;
  const feito = await garantirDesignMestre(id, { userId: r.userId });
  return NextResponse.json({ refeito: feito.refeito, erro: feito.erro ?? null, mestre: await estadoDoMestre(id) });
}

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await projetoDoUsuario(id);
  if (r.erro) return r.erro;
  const recusa = await soODono(r.userId, r.project, "escolher o estilo dos posts");
  if (recusa) return recusa;
  try {
    await salvarModoDosPosts(id, "mestre");
    return NextResponse.json({ ok: true, estado: await estadoDoEstiloDosPosts(id, true) });
  } catch (e) {
    console.error("[estilo-dos-posts][mestre]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não consegui voltar ao estilo mestre agora. Tente de novo." }, { status: 500 });
  }
}
