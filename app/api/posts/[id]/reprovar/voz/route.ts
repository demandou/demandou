import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { transcreverFalaCurta } from "@/lib/media/fala-curta";

/**
 * O MOTIVO DA REPROVAÇÃO FALADO (08/10/2026): o áudio curto gravado na janela
 * vai à Deepgram pela mesma função do comando do vídeo e do estilo falado
 * (lib/media/fala-curta.ts) e volta como texto, que o cliente ainda edita
 * antes de reprovar. Até 4 MB (~2 min).
 */
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id }, select: { projectId: true, project: { select: { userId: true } } } });
  if (!post || !(await podeUsarProjeto(userId, { id: post.projectId, userId: post.project.userId }))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const audio = Buffer.from(await req.arrayBuffer());
  const r = await transcreverFalaCurta(audio, req.headers.get("content-type"), { alternativa: "Escreva o motivo", onde: "motivo falado da reprovação" });
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
  return NextResponse.json({ texto: r.texto });
}
