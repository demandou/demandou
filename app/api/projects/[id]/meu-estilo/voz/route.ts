import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { transcreverFalaCurta } from "@/lib/media/fala-curta";

/**
 * O MEU ESTILO FALADO (08/10/2026): o microfone da caixa "descreva o seu
 * estilo" grava no navegador, o áudio vem para cá, a Deepgram transcreve
 * (lib/media/fala-curta.ts, a mesma do comando do vídeo) e o texto volta
 * para a caixa, que o manda pelo MESMO caminho do texto escrito.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!project || !(await podeUsarProjeto(userId, project))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const audio = Buffer.from(await req.arrayBuffer());
  const r = await transcreverFalaCurta(audio, req.headers.get("content-type"), { alternativa: "Escreva o seu estilo", onde: "meu estilo falado" });
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
  return NextResponse.json({ texto: r.texto });
}
