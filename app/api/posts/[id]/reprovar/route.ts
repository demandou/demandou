import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import { reprovarPeca } from "@/lib/credits/reprovacao-servidor";
import { NOME_DA_CATEGORIA } from "@/lib/credits/reprovacao";
import { registrarAtoNaPeca } from "@/lib/cerebro/captura";
import { prisma } from "@/lib/db/prisma";

/**
 * REPROVAR UMA PEÇA COM MOTIVO (decisão do Bruno em 08/10/2026).
 *
 * O corpo traz { categoria, texto }. A regra e o fluxo moram em
 * lib/credits/reprovacao*.ts: a categoria decide se é gosto (crédito fica) ou
 * erro da plataforma (o JEV confere contra as provas; confirmado devolve na
 * hora; não confirmado vai ao admin). A resposta traz a situação para o card.
 *
 * Até 120 s: a conferência roda as provas da arte (régua, formato e o olho
 * barato) e a guarda do conteúdo próprio pelo JEV.
 */
export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const corpo = (await req.json().catch(() => ({}))) as { categoria?: unknown; texto?: unknown };

  const r = await reprovarPeca({ postId: id, userId, categoria: corpo.categoria, texto: corpo.texto });
  if (!r.ok) {
    switch (r.erro) {
      case "nao_encontrado":
        return NextResponse.json({ error: "Peça não encontrada." }, { status: 404 });
      case "ja_publicado":
        return NextResponse.json({ error: "Esta peça já foi publicada e não pode ser reprovada. Arquive para tirá-la da tela." }, { status: 409 });
      case "motivo_invalido":
        return NextResponse.json({ error: r.mensagem }, { status: 400 });
    }
  }

  const estado = r.estado;
  after(async () => {
    // O ato no cérebro do cliente (06/10), com o motivo por extenso, depois da resposta.
    const p = await prisma.post.findUnique({ where: { id }, select: { projectId: true } });
    if (p) await registrarAtoNaPeca({ projectId: p.projectId, ato: "recusou", postId: id, detalhe: `${NOME_DA_CATEGORIA[estado.categoria]}${estado.texto ? `: ${estado.texto}` : ""}` });
  });
  return NextResponse.json({ ok: true, estado, frase: r.frase });
}
