import { prisma } from "@/lib/db/prisma";
import { temaDoVideo } from "@/lib/media/dados-da-arte";

/**
 * O VÍDEO INTEIRO PARA QUEM ESCREVE A CENA (11/10, observação do Bruno sobre a aula 8.1):
 * o trecho da tenda só diz "aumenta a casa, estica a corda, finca a estaca, a cortina",
 * mas o vídeo inteiro fala "alargue o lugar da sua tenda" (Isaías 54) seis vezes. O agente
 * da aula leu a transcrição inteira e desenhou a tenda; a esteira só mandava a fala do
 * corte, e o Sonnet desenhou potes e casas. Aqui vai a fala do vídeo todo e o tema.
 */
export type VideoInteiro = { texto: string; tema: string | null };

/** Até ~9 mil palavras (um vídeo de uma hora fala umas 9 mil): o resto é cortado no fim, com aviso. Puro. */
export function falaDoVideoParaACena(texto: string, maxPalavras = 9000): string {
  const ws = texto.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (ws.length <= maxPalavras) return ws.join(" ");
  return `${ws.slice(0, maxPalavras).join(" ")} [...]`;
}

/** A transcrição completa e o tema do vídeo do corte, ou null (sem vídeo, sem transcrição). */
export async function videoInteiroDoCorte(videoJobId: string | null | undefined): Promise<VideoInteiro | null> {
  if (!videoJobId) return null;
  const v = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { transcript: true, radar: true } });
  const texto = String((v?.transcript as { text?: string } | null)?.text ?? "").trim();
  if (!texto) return null;
  const tema = temaDoVideo(v?.radar as Parameters<typeof temaDoVideo>[0]) || null;
  return { texto: falaDoVideoParaACena(texto), tema };
}
