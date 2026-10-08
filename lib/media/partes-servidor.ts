import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MAX_TENTATIVAS } from "@/lib/media/video-state";
import { assinarCorpo, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { MENSAGEM_DA_JUNCAO_FALHOU, partesPorJuntar, type PartesDaGravacao } from "@/lib/media/partes-da-gravacao";

/**
 * A GRAVAÇÃO EM PARTES NO SERVIDOR (08/10/2026): a coluna `partes` e o pedido
 * de junção ao worker. A regra pura mora em lib/media/partes-da-gravacao.ts.
 *
 * A coluna fica FORA do schema do Prisma e é lida e gravada só por SQL cru
 * (migração 20261008120000_partes_da_gravacao). Assim o código tolera a coluna
 * ainda não existir: a leitura vira "sem partes" (o vídeo de arquivo único
 * segue igual) e só o registro em partes recusa, com a frase para o cliente.
 * Com ela no schema, toda consulta do Prisma sem `select` passaria a pedir a
 * coluna e quebraria antes da migração.
 */

type Leitor = typeof prisma | Prisma.TransactionClient;

/** As partes de vários vídeos. Erro (coluna ainda não criada) vira mapa vazio. */
export async function lerPartes(ids: string[], db: Leitor = prisma): Promise<Map<string, PartesDaGravacao>> {
  const mapa = new Map<string, PartesDaGravacao>();
  if (!ids.length) return mapa;
  try {
    const linhas = await db.$queryRaw<Array<{ id: string; partes: PartesDaGravacao | null }>>`
      SELECT id, partes FROM video_jobs WHERE id = ANY(${ids}) AND partes IS NOT NULL`;
    for (const l of linhas) if (l.partes && Array.isArray(l.partes.itens)) mapa.set(l.id, l.partes);
  } catch (e) {
    console.warn("[partes] leitura falhou (a coluna existe?):", e instanceof Error ? e.message.slice(0, 160) : e);
  }
  return mapa;
}

export async function lerPartesDe(id: string): Promise<PartesDaGravacao | null> {
  return (await lerPartes([id])).get(id) ?? null;
}

/** Os ids, entre estes, que ainda têm partes por juntar. */
export async function idsComPartesPorJuntar(ids: string[]): Promise<Set<string>> {
  const mapa = await lerPartes(ids);
  return new Set([...mapa].filter(([, p]) => partesPorJuntar(p)).map(([id]) => id));
}

/**
 * Grava a lista na criação do vídeo, DENTRO da transação de
 * `registrarGravacao`: o vídeo em partes nunca existe sem a lista. Sem a
 * coluna, lança, e a transação desfaz o registro inteiro.
 */
export async function gravarPartes(db: Leitor, videoId: string, partes: PartesDaGravacao): Promise<void> {
  await db.$executeRaw`UPDATE video_jobs SET partes = ${JSON.stringify(partes)}::jsonb WHERE id = ${videoId}`;
}

export type RespostaDaJuncao = { status: number; corpo: Record<string, unknown> };

/**
 * PEDE A JUNÇÃO ao worker. Usada pela rota /juntar (o piloto, o vigia, o
 * botão de tentar de novo) e pela rota /transcribe, que manda para cá o vídeo
 * em partes ainda não juntado: todo caminho que começava a transcrição (a
 * cura da aba, a nova tentativa da falha) passa pela junção primeiro.
 *
 * Mesmo contrato das outras etapas: aceita "uploaded" ou "failed", toma o
 * trabalho de forma atômica (dois cliques não viram duas junções), conta a
 * tentativa e grava a falha com a frase do cliente.
 */
export async function pedirJuncao(videoId: string): Promise<RespostaDaJuncao> {
  const video = await prisma.videoJob.findUnique({
    where: { id: videoId },
    select: { id: true, status: true, attempts: true, projectId: true },
  });
  if (!video) return { status: 404, corpo: { error: "Vídeo não encontrado" } };
  const partes = await lerPartesDe(videoId);
  if (!partes || !partesPorJuntar(partes)) {
    return { status: 409, corpo: { error: "Este vídeo não tem partes por juntar.", semPartes: true } };
  }
  if (video.status !== "uploaded" && video.status !== "failed") {
    return { status: 409, corpo: { error: `Vídeo já está em "${video.status}"`, jaEmAndamento: true } };
  }
  if (video.attempts >= MAX_TENTATIVAS) {
    return { status: 409, corpo: { error: "Esta etapa já falhou vezes demais. Fale com o suporte antes de tentar outra vez." } };
  }

  const tomado = await prisma.videoJob.updateMany({
    where: { id: videoId, status: video.status },
    data: { status: "juntando-partes", startedAt: new Date(), attempts: { increment: 1 }, error: null },
  });
  if (tomado.count === 0) return { status: 409, corpo: { error: "A junção das partes já começou.", jaEmAndamento: true } };

  const falhar = async (motivo: string) => {
    console.error(`[juntar][${videoId}] ${motivo}`);
    await prisma.videoJob.updateMany({
      where: { id: videoId, status: "juntando-partes" },
      data: { status: "failed", startedAt: null, error: MENSAGEM_DA_JUNCAO_FALHOU },
    });
    return { status: 500, corpo: { error: MENSAGEM_DA_JUNCAO_FALHOU } };
  };

  const base = process.env.VIDEO_WORKER_URL;
  if (!base) return falhar("o worker de vídeo não está configurado (VIDEO_WORKER_URL)");
  const corpo = JSON.stringify({
    videoJobId: videoId,
    // Na ordem confirmada pela pessoa: o worker junta exatamente nesta ordem.
    partes: partes.itens.map((p) => ({ url: p.url, nome: p.nome })),
    // Na pasta do projeto, como a gravação original (e no store privado).
    chave: `videos/${video.projectId}/juntado-${videoId}.mp4`,
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://demandou.com"}/api/videos/${videoId}/juntar-callback`,
  });
  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/juntar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CABECALHO_ASSINATURA]: assinarCorpo(corpo) },
      body: corpo,
      signal: AbortSignal.timeout(30_000),
    });
    if (r.status !== 202) return falhar(`o worker recusou a junção (${r.status})`);
  } catch (e) {
    return falhar(`o worker não respondeu ao pedido de junção: ${e instanceof Error ? e.message : e}`);
  }
  return {
    status: 200,
    corpo: { ok: true, modo: "juntar", partes: partes.itens.length, mensagem: "Juntando as partes da gravação. O status muda sozinho." },
  };
}
