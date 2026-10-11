import { prisma } from "@/lib/db/prisma";
import { assinarCorpo, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";

/**
 * OS QUADROS NÍTIDOS DA GRAVAÇÃO (11/10/2026), pedidos ao worker
 * (POST /melhor-quadro). A escolha é do worker (worker/src/quadro-nitido.mjs:
 * olho aberto, rosto inteiro e grande, sem borrão, sem ampliar mais de 2x para
 * o destino); aqui só o pedido e a resposta. Sem custo de IA: MediaPipe e
 * ffmpeg no worker.
 *
 * Serve à capa (um quadro, com a pessoa recortada) e às artes da campanha (um
 * quadro diferente por peça, para a janela da pessoa do modelo). Devolve [] em
 * qualquer falha: quem chama segue sem a foto, nunca com um quadro ruim.
 */

export type QuadroNitido = {
  url: string;
  instante: number | null;
  /** A pessoa recortada (PNG), só no pedido de um quadro. */
  recorteUrl?: string | null;
  largura?: number;
  altura?: number;
};

/** Instantes espalhados pela gravação, fugindo das bordas (entrada e despedida). Puro. */
export function instantesDaGravacao(duracaoSec: number, quantos = 30): number[] {
  const d = Math.max(1, duracaoSec);
  const n = Math.max(1, Math.min(40, quantos));
  return Array.from({ length: n }, (_, i) => Math.round(d * (0.03 + (0.94 * i) / Math.max(1, n - 1)) * 100) / 100);
}

export async function quadrosNitidosDoVideo(
  videoJobId: string,
  o: { quantos?: number; alvo?: { largura: number; altura: number } | null; chave?: string } = {}
): Promise<QuadroNitido[]> {
  const base = (process.env.VIDEO_WORKER_URL ?? "").replace(/\/$/, "");
  if (!base) return [];
  const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { blobUrl: true, durationSec: true } }).catch(() => null);
  if (!video?.blobUrl) return [];
  const quantos = Math.max(1, Math.min(12, o.quantos ?? 1));
  const corpo = JSON.stringify({
    sourceUrl: video.blobUrl,
    instantes: instantesDaGravacao(video.durationSec ?? 60, Math.min(40, Math.max(24, quantos * 4))),
    chave: o.chave ?? `cortes/${videoJobId}/quadro-nitido-${Date.now().toString(36)}`,
    quantos,
    ...(o.alvo ? { alvo: o.alvo } : {}),
  });
  try {
    const r = await fetch(`${base}/melhor-quadro`, {
      method: "POST",
      headers: { "content-type": "application/json", [CABECALHO_ASSINATURA]: assinarCorpo(corpo) },
      body: corpo,
      // Baixa a gravação (o cache dos cortes) e mede até 40 quadros: minutos no pior caso.
      signal: AbortSignal.timeout(5 * 60_000),
    });
    if (r.status === 422) {
      console.log(`[quadros-nitidos][${videoJobId}] nenhum quadro nítido: a peça sai sem a foto da gravação`);
      return [];
    }
    if (!r.ok) {
      console.warn(`[quadros-nitidos][${videoJobId}] worker respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return [];
    }
    const d = (await r.json()) as {
      quadro?: { url?: string };
      recorte?: { url?: string };
      instante?: number;
      largura?: number;
      altura?: number;
      quadros?: Array<{ url?: string; instante?: number; largura?: number; altura?: number }>;
    };
    if (Array.isArray(d.quadros)) {
      return d.quadros.filter((q) => q.url).map((q) => ({ url: q.url!, instante: q.instante ?? null, largura: q.largura, altura: q.altura }));
    }
    return d.quadro?.url ? [{ url: d.quadro.url, instante: d.instante ?? null, recorteUrl: d.recorte?.url ?? null, largura: d.largura, altura: d.altura }] : [];
  } catch (e) {
    console.warn(`[quadros-nitidos][${videoJobId}] falhou: ${e instanceof Error ? e.message : e}`);
    return [];
  }
}
