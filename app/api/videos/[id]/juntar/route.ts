export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { acessoAoVideo } from "@/lib/media/piloto-do-servidor";
import { pedirJuncao } from "@/lib/media/partes-servidor";

/**
 * JUNTAR AS PARTES DA GRAVAÇÃO (08/10/2026): pede ao worker que junte, na
 * ordem que o cliente confirmou, os arquivos de uma gravação enviada em mais
 * de um arquivo. O resultado chega pelo `juntar-callback`, que troca a
 * gravação do vídeo pelo vídeo juntado e despacha a transcrição.
 *
 * Aceita a sessão (o botão de tentar de novo, membro da equipe com o projeto
 * liberado também) e a assinatura do piloto (o aviso do upload, o vigia, a
 * nova tentativa da falha). A regra mora em `pedirJuncao`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const acesso = await acessoAoVideo(req, id);
  if (!acesso) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const visivel = await prisma.videoJob.findFirst({ where: acesso.where, select: { id: true } });
  if (!visivel) return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
  const r = await pedirJuncao(id);
  return NextResponse.json(r.corpo, { status: r.status });
}
