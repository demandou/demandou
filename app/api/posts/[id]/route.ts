import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { esconderDiaSemPosts, reabrirDia } from "@/lib/posts/espelhar-no-gestor";
import { formatoValido } from "@/lib/publish/formato-de-destino";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { registrarAtoNaPeca } from "@/lib/cerebro/captura";
import type { AtoDaPeca } from "@/lib/cerebro/tipos";
import { arteCoerenteComOTexto } from "@/lib/squad/coerencia-da-arte";
import { avisarArteDaLegenda } from "@/lib/credits/ajuste-servidor";
import { frasesDoClienteNaEdicao } from "@/lib/squad/guarda-do-conteudo-proprio";

/**
 * O CLIENTE EDITOU A LEGENDA E A ARTE FICOU DE OUTRO ASSUNTO? (05/10, noite)
 * O JEV confere a frase desenhada na imagem contra o texto novo.
 *
 * DESDE 09/10 (decisão do Bruno) A ARTE NÃO É MAIS REFEITA DE GRAÇA: a edição
 * é da pessoa, então refazer é "pedi diferente" e cobra. O pedido fica
 * guardado no card do dia (o do Paulo, que o quadro abre), e o chat e o sino
 * dizem o custo e o saldo antes (lib/credits/ajuste-servidor.ts,
 * `avisarArteDaLegenda`); nada é refeito até a pessoa tocar em Refazer a arte.
 * Nada aqui segura a resposta.
 */
async function arteAcompanhaOTexto(post: { id: string; projectId: string; runId: string | null; dayOfWeek: number | null; mediaType: string | null; metadata: unknown; scheduledAt: Date | null }, userId: string, texto: string): Promise<void> {
  try {
    if (post.mediaType !== "image" || !post.runId || !post.dayOfWeek) return;
    const frase = (post.metadata as { frase?: unknown } | null)?.frase;
    if (typeof frase !== "string" || !frase.trim() || !texto.trim()) return;
    const c = await arteCoerenteComOTexto({ projectId: post.projectId, texto, arte: { frase }, etapa: "arte-coerencia" });
    if (c.coerente !== false) return;
    // O card do dia (o do Paulo) primeiro: é ele que o quadro abre e que refaz a arte de todas as redes do dia.
    const incluir = { metadata: true, agentName: true, projectId: true, scheduledDate: true, project: { select: { userId: true } } } as const;
    const card =
      (await prisma.campaignCard.findFirst({ where: { runId: post.runId, dayOfWeek: post.dayOfWeek, cardType: "publish", NOT: { status: "archived" } }, select: { id: true, ...incluir }, orderBy: { createdAt: "desc" } })) ??
      (await prisma.campaignCard.findFirst({ where: { postId: post.id, runId: post.runId, cardType: { notIn: ["media", "publish", "preview", "research"] }, NOT: { status: "archived" } }, select: { id: true, ...incluir }, orderBy: { createdAt: "desc" } }));
    if (!card) return;
    const postsDoDia = await prisma.post.findMany({ where: { runId: post.runId, dayOfWeek: post.dayOfWeek, status: { notIn: ["published", "publishing", "cancelled"] } }, select: { platform: true } });
    const quando = (post.scheduledAt ?? card.scheduledDate)?.toISOString().slice(0, 10);
    await avisarArteDaLegenda({
      card: { id: card.id, projectId: card.projectId, projectUserId: card.project.userId, metadata: card.metadata, agentName: card.agentName },
      userId,
      postId: post.id,
      frase,
      redes: [...new Set(postsDoDia.map((p) => p.platform))],
      formato: "image",
      link: `/projects/${post.projectId}/live?card=${card.id}${quando ? `&semana=${quando}` : ""}`,
    });
  } catch (e) {
    console.warn("[posts] arte acompanha o texto:", e instanceof Error ? e.message : e);
  }
}

const PAST_TOLERANCE_MS = 60_000;

function isPastDate(d: Date): boolean {
  return d.getTime() < Date.now() - PAST_TOLERANCE_MS;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });

  if (!post || !(await podeUsarProjeto(userId, { id: post.projectId, userId: post.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const post = await prisma.post.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });

  if (!post || !(await podeUsarProjeto(userId, { id: post.projectId, userId: post.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  if (body.content !== undefined) updateData.content = body.content;

  // A conta pela qual o post sai. O card do Paulo manda junto com "deixar
  // agendado" porque o cron publica pela conta gravada no post, e um post de
  // vídeo nasce sem conta quando a rede foi conectada depois da esteira: sem
  // isto ele entrava na fila e falhava na hora com "No account".
  if (typeof body.socialAccountId === "string" && body.socialAccountId) {
    const conta = await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } });
    if (!conta || conta.projectId !== post.projectId) {
      return NextResponse.json({ error: "Esta conta não pertence a este projeto." }, { status: 403 });
    }
    updateData.socialAccountId = conta.id;
  }

  // ONDE A PEÇA CAI NA REDE (item 13, 29/09): o card do dia troca o lugar
  // de um post que ainda não saiu. Mora em `metadata.formato`, que é o que o
  // publicador lê (`formatoDoPost`); o valor passa por `formatoValido`, então
  // pedido de lugar que a rede não tem vira feed em vez de gravar lixo.
  if (typeof body.formato === "string") {
    if (post.status === "published" || post.status === "publishing") {
      return NextResponse.json({ error: "Este post já saiu: o lugar dele não muda mais." }, { status: 409 });
    }
    updateData.metadata = {
      ...((post.metadata as Record<string, unknown> | null) ?? {}),
      formato: formatoValido(post.platform, body.formato),
    };
  }

  // AS FRASES DO CLIENTE (08/10): o que ele escreve na edição é a palavra
  // dele, e a guarda do conteúdo próprio na publicação não tira
  // (lib/squad/guarda-do-conteudo-proprio.ts). A regra vale para texto gerado.
  if (typeof body.content === "string" && body.content !== post.content) {
    const base = (updateData.metadata as Record<string, unknown> | undefined) ?? ((post.metadata as Record<string, unknown> | null) ?? {});
    updateData.metadata = { ...base, frasesDoCliente: frasesDoClienteNaEdicao(post.content, body.content, base.frasesDoCliente) };
  }

  if (body.cancelSchedule) {
    // Volta a rascunho NO MESMO DIA (03/10): com a data apagada, o post saía
    // de todos os dias do quadro e o card ficava vazio. Aprovar de novo leva
    // ao próximo horário livre quando este já passou.
    updateData.status = "draft";
  } else if (body.scheduledAt !== undefined) {
    const d = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (d && isPastDate(d)) {
      return NextResponse.json(
        { error: "Não é possível agendar no passado. Escolha data e hora atuais ou futuras." },
        { status: 400 }
      );
    }
    updateData.scheduledAt = d;
    // Reagendar: mantém fila se já estava scheduled; senão permanece rascunho até aprovação
    if (d && post.status === "scheduled") {
      updateData.status = "scheduled";
    } else if (d && post.status !== "published") {
      updateData.status = "draft";
    }
  }

  if (body.status !== undefined) {
    // REPROVAR PEDE MOTIVO (08/10): o caminho é POST /api/posts/[id]/reprovar,
    // que grava a categoria, confere e decide a devolução. Sem motivo, nada é reprovado.
    if (body.status === "rejected") {
      return NextResponse.json({ error: "Reprovar pede o motivo: use a janela de reprovação." }, { status: 400 });
    }
    if (body.status === "scheduled") {
      const at = (updateData.scheduledAt as Date | undefined) ?? post.scheduledAt;
      if (!at) {
        return NextResponse.json(
          { error: "Defina data e hora de publicação antes de aprovar o agendamento." },
          { status: 400 }
        );
      }
      if (isPastDate(new Date(at))) {
        return NextResponse.json(
          { error: "Não é possível agendar no passado." },
          { status: 400 }
        );
      }
      updateData.status = "scheduled";
    } else {
      updateData.status = body.status;
    }
  }

  // Um post que FOI AO AR e está arquivado só sai do arquivo como publicado
  // (01/10): virar rascunho ou agendado faria a mesma peça sair duas vezes na
  // rede, e o publishedAt continua dizendo que ela já saiu.
  if (post.status === "cancelled" && post.publishedAt && typeof updateData.status === "string" && updateData.status !== "cancelled") {
    updateData.status = "published";
    delete updateData.scheduledAt;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: updateData,
  });

  // A aba de posts e o Gestor falam de objetos diferentes (posts e cards), e
  // esta é a tradução entre eles. Arquivar o último post vivo do dia esconde o
  // dia da agenda; um post que volta de arquivado reabre o dia. Ver
  // lib/posts/espelhar-no-gestor.ts.
  // O TEXTO EDITADO É O MESMO NO CARD (03/10): o quadro titula a peça pelo
  // card do redator, e editar só o post deixava o título antigo no quadro.
  if (typeof body.content === "string" && body.content !== post.content) {
    await prisma.campaignCard.updateMany({
      where: { postId: id, cardType: { notIn: ["media", "publish", "preview", "research"] } },
      data: { content: body.content },
    });
    const texto = body.content;
    after(() => arteAcompanhaOTexto({ id: post.id, projectId: post.projectId, runId: post.runId, dayOfWeek: post.dayOfWeek, mediaType: post.mediaType, metadata: post.metadata, scheduledAt: post.scheduledAt }, userId, texto));
  }

  const virouArquivado = updated.status === "cancelled" && post.status !== "cancelled";
  const saiuDoArquivo = post.status === "cancelled" && updated.status !== "cancelled";
  if (virouArquivado) await esconderDiaSemPosts(updated.runId, updated.dayOfWeek);
  if (saiuDoArquivo) await reabrirDia(updated.runId, updated.dayOfWeek);

  // O SEGUNDO CÉREBRO (06/10): editar, agendar, voltar a rascunho e arquivar
  // viram a nota da peça, depois da resposta. A edição vem antes, para o
  // estado da nota ser o do último gesto.
  const atos: AtoDaPeca[] = [];
  if (typeof body.content === "string" && body.content !== post.content) atos.push("editou_texto");
  if (updated.status === "scheduled" && post.status !== "scheduled") atos.push("agendou");
  if (body.cancelSchedule && post.status === "scheduled") atos.push("voltou_rascunho");
  if (virouArquivado) atos.push("arquivou");
  if (saiuDoArquivo) atos.push("desarquivou");
  if (atos.length) {
    after(async () => {
      for (const ato of atos) await registrarAtoNaPeca({ projectId: post.projectId, ato, postId: id });
    });
  }

  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { project: { select: { userId: true } } },
  });

  if (!post || !(await podeUsarProjeto(userId, { id: post.projectId, userId: post.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Post que foi ao ar não se apaga (01/10), mesmo arquivado: apagar o
  // registro não tira a publicação da rede, só faz a plataforma esquecer que
  // ela existe e leva junto o histórico dos números. Arquivar é o caminho.
  if (post.publishedAt || post.status === "published") {
    return NextResponse.json(
      { error: "Este post já foi publicado na rede e não pode ser apagado daqui. Arquive para tirá-lo da tela; os números continuam contando." },
      { status: 409 }
    );
  }

  await prisma.post.delete({ where: { id } });
  // O Gestor desenha cards, não posts, e a relação card -> post não tem
  // cascade. Sem isto o post some da aba de posts e continua na agenda da
  // semana (aconteceu em 14/09). O porquê inteiro está em espelhar-no-gestor.
  await esconderDiaSemPosts(post.runId, post.dayOfWeek);
  return NextResponse.json({ ok: true });
}
