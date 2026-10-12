import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { criarLugarNovo } from "@/lib/publish/lugar-novo";
import { podeUsarProjeto } from "@/lib/equipe/conta";

/**
 * MAIS UM LUGAR NA MESMA REDE para uma peça que já existe (item 13, 29/09).
 *
 * O modelo da esteira desde 28/09 é UM POST POR LUGAR: quem marca feed, reel
 * e story no Instagram recebe três posts com o mesmo texto e a mesma mídia,
 * cada um com o seu `metadata.formato`, porque é assim que o publicador lê.
 * O card do dia passou a deixar marcar o lugar depois da campanha pronta, e
 * marcar um lugar novo é exatamente isso: mais um post irmão.
 *
 * NÃO COBRA, e é de propósito: não chama IA nenhuma. É o mesmo texto e a
 * mesma mídia com outro destino; cobrar aqui seria cobrar por um clique.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { formato, accountId } = (await req.json()) as { formato?: unknown; accountId?: unknown };

  const original = await prisma.post.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });
  if (!original || !(await podeUsarProjeto(userId, { id: original.projectId, userId: original.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = await criarLugarNovo(original, formato, accountId);
  return NextResponse.json(r.corpo, { status: r.status });
}
