import { prisma } from "@/lib/db/prisma";
import { MAX_TENTATIVAS } from "@/lib/media/video-state";
import { assinarCorpo, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { registrarGravacao, type RegistroDaGravacao } from "@/lib/limites-do-plano";
import {
  MENSAGEM_DA_JUNCAO_FALHOU,
  nomeDaGravacaoEmPartes,
  partesPorJuntar,
  registroDasPartes,
  somaDosBytes,
  type ParteRegistrada,
  type PartesDaGravacao,
} from "@/lib/media/partes-da-gravacao";

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

/** O erro é "a coluna `partes` ainda não existe" (antes da migração)? */
function colunaAusente(e: unknown): boolean {
  const x = e as { code?: string; meta?: { code?: string } } | null;
  const codigo = x?.meta?.code ?? x?.code;
  const texto = e instanceof Error ? e.message : String(e);
  return codigo === "42703" || (/partes/.test(texto) && /does not exist|n[aã]o existe/i.test(texto));
}

/**
 * Antes da migração, a leitura TOLERANTE para de perguntar por 5 minutos: a
 * rota de status consulta a cada 4 s por aba aberta, e cada consulta seria um
 * erro no registro do banco. A leitura ESTRITA nunca usa este atalho.
 */
let semColunaAte = 0;

/**
 * As partes de vários vídeos.
 *
 * Tolerante (o padrão, para tela, sino e vigia): qualquer erro vira mapa
 * vazio. ESTRITA (para quem decide o que fazer com a gravação: a transcrição e
 * o retorno da junção): só a coluna ausente vira vazio, porque sem coluna não
 * existe vídeo em partes; erro de rede ou de banco sobe. Senão um soluço do
 * banco faria a transcrição ouvir só a primeira parte.
 */
export async function lerPartes(ids: string[], opcoes: { estrito?: boolean } = {}): Promise<Map<string, PartesDaGravacao>> {
  const mapa = new Map<string, PartesDaGravacao>();
  if (!ids.length) return mapa;
  if (!opcoes.estrito && Date.now() < semColunaAte) return mapa;
  try {
    const linhas = await prisma.$queryRaw<Array<{ id: string; partes: PartesDaGravacao | null }>>`
      SELECT id, partes FROM video_jobs WHERE id = ANY(${ids}) AND partes IS NOT NULL`;
    for (const l of linhas) if (l.partes && Array.isArray(l.partes.itens)) mapa.set(l.id, l.partes);
  } catch (e) {
    if (colunaAusente(e)) {
      semColunaAte = Date.now() + 5 * 60_000;
      return mapa;
    }
    if (opcoes.estrito) throw e;
    console.warn("[partes] leitura falhou:", e instanceof Error ? e.message.slice(0, 160) : e);
  }
  return mapa;
}

export async function lerPartesDe(id: string, opcoes: { estrito?: boolean } = {}): Promise<PartesDaGravacao | null> {
  return (await lerPartes([id], opcoes)).get(id) ?? null;
}

/** Os ids, entre estes, que ainda têm partes por juntar. */
export async function idsComPartesPorJuntar(ids: string[], opcoes: { estrito?: boolean } = {}): Promise<Set<string>> {
  const mapa = await lerPartes(ids, opcoes);
  return new Set([...mapa].filter(([, p]) => partesPorJuntar(p)).map(([id]) => id));
}

/**
 * REGISTRA A GRAVAÇÃO EM PARTES: o mesmo `registrarGravacao` do arquivo único
 * (cota, trava, marca no extrato), com a lista na mesma transação.
 *
 * Antes, procura o vídeo destas partes pela PRIMEIRA parte guardada na lista:
 * depois da junção o `blobUrl` já é o vídeo juntado, e a restrição única
 * (projeto, blobUrl) não reconheceria mais um registro repetido (o navegador
 * que tenta de novo, o aviso do storage que chega atrasado), que viraria uma
 * segunda gravação na cota, com as partes já apagadas.
 */
export async function registrarGravacaoEmPartes(args: {
  userId: string;
  projectId: string;
  itens: ParteRegistrada[];
  criterio: unknown;
}): Promise<RegistroDaGravacao> {
  const { userId, projectId, itens } = args;
  const ja = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT id, status FROM video_jobs
    WHERE "projectId" = ${projectId} AND partes -> 'itens' -> 0 ->> 'url' = ${itens[0].url}
    LIMIT 1`.catch(() => [] as Array<{ id: string; status: string }>);
  if (ja[0]) return { ok: true, video: ja[0] };
  return registrarGravacao({
    userId,
    projectId,
    blobUrl: itens[0].url,
    originalName: nomeDaGravacaoEmPartes(itens.map((p) => p.nome)),
    sizeBytes: somaDosBytes(itens),
    partes: registroDasPartes(itens, args.criterio),
  });
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
  let partes: PartesDaGravacao | null;
  try {
    partes = await lerPartesDe(videoId, { estrito: true });
  } catch (e) {
    console.error(`[juntar][${videoId}] leitura das partes falhou:`, e);
    return { status: 503, corpo: { error: "Não consegui conferir a gravação agora. Tente de novo em instantes." } };
  }
  if (!partes || !partesPorJuntar(partes)) {
    return { status: 409, corpo: { error: "Este vídeo não tem partes por juntar.", semPartes: true } };
  }
  if (video.status !== "uploaded" && video.status !== "failed") {
    return { status: 409, corpo: { error: `Vídeo já está em "${video.status}"`, jaEmAndamento: true } };
  }
  if (video.attempts >= MAX_TENTATIVAS) {
    return { status: 409, corpo: { error: "Esta etapa já falhou vezes demais. Fale com o suporte antes de tentar outra vez." } };
  }

  const inicio = new Date();
  const tomado = await prisma.videoJob.updateMany({
    where: { id: videoId, status: video.status },
    data: { status: "juntando-partes", startedAt: inicio, attempts: { increment: 1 }, error: null },
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
    // Volta no aviso: o retorno só vale para ESTA rodada (ver o juntar-callback).
    retorno: { inicio: inicio.toISOString() },
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
