import { put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { lerMidia, midiaProduzida } from "@/lib/media/storage";
import { comporCapa, type Expressao } from "@/lib/media/capa-e-titulo";
import { dataUrlToBuffer } from "@/lib/media/nano-banana";
import { baseDaCapaDoCorte, type FotoDaCapa, type TrechoDaCapa } from "@/lib/media/capa-pelo-modelo";

export { baseDaCapaDoCorte };

/**
 * A CAPA DE UM CORTE PELO CAMINHO DE HOJE (a composição em código sobre o
 * fundo gerado), com a regra do quadro nítido (11/10/2026). É a capa do
 * projeto sem modelo do curso e a reserva de quem tem.
 *
 * A foto da pessoa:
 * - o quadro do PRÓPRIO corte, quando ele chegou com o recorte (o worker só
 *   recorta quadro que passou no crivo: olho aberto, rosto inteiro e grande,
 *   sem borrão);
 * - senão, o quadro nítido do vídeo inteiro (ou a foto da Biblioteca), pedido
 *   uma vez para todos os cortes;
 * - senão, nenhuma: a capa sai só com a frase. Nunca o quadro fixo do trecho
 *   nem o quadro-fonte antigo, que não passaram por crivo nenhum.
 */

/** Compõe a capa 9:16 de um corte e devolve a URL, ou null. */
export async function comporCapaDoCorte(o: {
  videoJobId: string;
  projectId: string;
  nicho: string | null;
  indice: number;
  trecho: TrechoDaCapa;
  doVideo: FotoDaCapa | null;
  ajuste?: string;
}): Promise<string | null> {
  const frase = o.trecho.texto?.fraseDaCapa;
  if (!frase) return null;
  const { quadroUrl, recorteUrl } = baseDaCapaDoCorte(o.trecho, o.doVideo);
  const bytes = quadroUrl ? await lerMidia(quadroUrl) : null;
  const arte = await comporCapa(bytes ? bytes.toString("base64") : "", frase, {
    expressao: o.trecho.texto?.expressao as Expressao | undefined,
    cenario: o.trecho.texto?.cenario,
    nicho: o.nicho,
    usageCtx: { projectId: o.projectId },
    formato: "9:16",
    ajuste: o.ajuste,
    quadroUrl: bytes ? quadroUrl : null,
    recorteUrl: bytes ? recorteUrl : null,
    chaveDoRecorte: `cortes/${o.videoJobId}/recorte-capa-${o.indice}.png`,
  });
  if (!arte) return null;
  const { url } = await put(`cortes/${o.videoJobId}/capa-arte-${o.indice}.jpg`, dataUrlToBuffer(arte), {
    // Capa é mídia PRODUZIDA: vai para o store público, que entrega cache e Range.
    ...midiaProduzida(),
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });
  return url;
}

/** A foto do vídeo para os cortes que não têm quadro próprio: pedida só se algum precisar. */
export async function fotoDoVideoSePrecisar(videoJobId: string, projectId: string, trechos: TrechoDaCapa[]): Promise<FotoDaCapa | null> {
  if (trechos.every((t) => t.midia?.recorte?.url && t.midia?.capa?.url)) return null;
  const { fotoDaCapa } = await import("@/lib/media/capa-pelo-modelo-servidor");
  return fotoDaCapa(videoJobId, projectId, { largura: 1080, altura: 1920 });
}

/** A reserva das capas dos cortes: compõe pelo caminho de hoje e grava `capaArte` em cada um. */
export async function comporCapasDosCortes(videoJobId: string, indices: number[]): Promise<number> {
  const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { id: true, projectId: true, clips: true, project: { select: { niche: true } } } });
  if (!video) return 0;
  const trechos = (video.clips as unknown as TrechoDaCapa[]) ?? [];
  const alvos = indices.filter((i) => trechos[i]?.texto?.fraseDaCapa);
  if (!alvos.length) return 0;
  const doVideo = await fotoDoVideoSePrecisar(video.id, video.projectId, alvos.map((i) => trechos[i]));
  const { fundirNoTrecho } = await import("@/lib/media/revisao-do-corte");
  let feitas = 0;
  await Promise.all(
    alvos.map(async (i) => {
      const url = await comporCapaDoCorte({ videoJobId: video.id, projectId: video.projectId, nicho: video.project.niche, indice: i, trecho: trechos[i], doVideo }).catch((e) => {
        console.error(`[capa-do-corte][${video.id}] corte ${i}:`, e);
        return null;
      });
      if (!url) return;
      await fundirNoTrecho(video.id, i, {}, { capaArte: { url } });
      feitas++;
    })
  );
  return feitas;
}
