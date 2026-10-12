import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { aplicarEscolhaDaArte, modeloValido } from "@/lib/media/escolha-da-arte";
import { gerarGruposMarcados } from "@/lib/media/artes-aguardando-identidade";

/**
 * A ESCOLHA DA ARTE NO CARD (11/10, lib/media/escolha-da-arte.ts).
 *
 * Corpo: { modelo: ModeloDoPost (mestre, designId ou catalogoId), usarMateriais,
 * todas }. Grava a escolha nos posts que esperavam (o dia do post, ou todas as
 * artes da campanha que esperam), marca "gerando" e responde; o desenho roda
 * depois da resposta, como o "Aprovar e gerar" da identidade. Não cobra: a
 * arte da semana do vídeo já veio no pacote.
 */
export const maxDuration = 800;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const corpo = (await req.json().catch(() => ({}))) as { modelo?: unknown; usarMateriais?: unknown; todas?: unknown };

  const post = await prisma.post.findUnique({ where: { id }, select: { projectId: true, project: { select: { userId: true } } } });
  if (!post || !(await podeUsarProjeto(userId, { id: post.projectId, userId: post.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const modelo = modeloValido(corpo.modelo);
  if (!modelo) return NextResponse.json({ error: "Escolha como quer a arte antes de gerar." }, { status: 400 });

  try {
    const { grupos, posts } = await aplicarEscolhaDaArte({
      projectId: post.projectId,
      postId: id,
      modelo,
      usarMateriais: corpo.usarMateriais !== false,
      todas: corpo.todas === true,
    });
    const args = { projectId: post.projectId, userId: post.project.userId };
    if (grupos.length) {
      after(async () => {
        const r = await gerarGruposMarcados(args, grupos).catch((e) => ({ frase: e instanceof Error ? e.message : String(e) }));
        console.log(`[escolha-da-arte][${id}] ${r.frase}`);
      });
    }
    const frase = grupos.length === 1 ? "A arte está sendo feita e cai no quadro em alguns minutos." : `${grupos.length} artes estão sendo feitas e caem no quadro em alguns minutos.`;
    return NextResponse.json({ ok: true, posts, artes: grupos.length, frase });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não consegui aplicar a escolha." }, { status: 400 });
  }
}
