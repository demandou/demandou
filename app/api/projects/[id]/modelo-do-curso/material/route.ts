import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { prisma } from "@/lib/db/prisma";
import { pedidoDeMaterialNaTela, situacaoDoMaterial } from "@/lib/media/editor-do-curso/material-do-modelo";
import { gravarMaterialDoModelo, lerMaterialDoModelo } from "@/lib/media/editor-do-curso/material-do-modelo-servidor";

/**
 * O MATERIAL DO CLIENTE PARA UM MODELO DO CURSO (10/10/2026,
 * lib/media/editor-do-curso/material-do-modelo.ts).
 *
 * GET ?modelo=<id> devolve o pedido do modelo (o que ele usa, quantos, a dica),
 * os arquivos marcados para ele (com a miniatura pela rota da Biblioteca, nunca
 * a URL do store) e a situação: se a edição pode começar e o que falta.
 *
 * PUT { modelo, itens: [{ materialId, nome, descricao, papel? }] } grava a
 * escolha. Só fotos da Biblioteca deste projeto; acima do máximo, 400.
 */
export const dynamic = "force-dynamic";

async function podeUsar(id: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const p = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  return podeUsarProjeto(userId, p);
}

const miniatura = (projectId: string, materialId: string) => `/api/projects/${projectId}/materiais/${materialId}/arquivo?v=mini`;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const modelo = req.nextUrl.searchParams.get("modelo") ?? "";
  const pedido = pedidoDeMaterialNaTela(modelo);
  if (!pedido) return NextResponse.json({ error: "Este modelo não usa material seu." }, { status: 400 });
  const itens = await lerMaterialDoModelo(id, modelo);
  const limpos = itens.map((i) => ({ materialId: i.materialId, nome: i.nome, descricao: i.descricao, ...(i.papel !== undefined ? { papel: i.papel } : {}) }));
  return NextResponse.json({
    pedido,
    situacao: situacaoDoMaterial(modelo, limpos),
    itens: limpos.map((i) => ({ ...i, miniatura: miniatura(id, i.materialId) })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const corpo = (await req.json().catch(() => null)) as { modelo?: unknown; itens?: unknown } | null;
  if (!corpo || typeof corpo.modelo !== "string" || !Array.isArray(corpo.itens)) {
    return NextResponse.json({ error: "Diga o modelo e a lista de arquivos." }, { status: 400 });
  }
  const r = await gravarMaterialDoModelo(id, corpo.modelo, corpo.itens);
  if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 });
  return NextResponse.json({ ok: true, situacao: r.situacao, itens: r.situacao.itens.map((i) => ({ ...i, miniatura: miniatura(id, i.materialId) })) });
}
