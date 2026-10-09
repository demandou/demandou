import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { transcreverFalaCurta } from "@/lib/media/fala-curta";

/**
 * O AJUSTE FALADO NO CHAT DO CARD (09/10/2026): o chat só aceitava texto. O
 * áudio curto gravado no navegador vai à mesma transcrição do motivo da
 * reprovação e do comando do vídeo (lib/media/fala-curta.ts) e volta como
 * texto no campo, que a pessoa ainda edita antes de clicar em "Pedir ajuste".
 * Nada é gerado aqui. Até 4 MB (~2 min).
 */
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const card = await prisma.campaignCard.findUnique({ where: { id }, select: { projectId: true, project: { select: { userId: true } } } });
  if (!card || !(await podeUsarProjeto(userId, { id: card.projectId, userId: card.project.userId }))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const audio = Buffer.from(await req.arrayBuffer());
  const r = await transcreverFalaCurta(audio, req.headers.get("content-type"), { alternativa: "Escreva o ajuste", onde: "ajuste falado no chat do card" });
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
  return NextResponse.json({ texto: r.texto });
}
