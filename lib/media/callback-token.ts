import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Autenticação do callback da transcrição.
 *
 * O endereço do callback é público por definição: a Deepgram precisa alcançar
 * ele de fora. Sem autenticação, qualquer um que descobrisse a rota poderia
 * mandar uma transcrição falsa e sobrescrever o trabalho de um cliente, ou pior,
 * plantar texto que viraria post publicado no nome dele.
 *
 * A assinatura é HMAC do id do vídeo com o segredo da aplicação. Isso dá três
 * coisas de graça: o token não é adivinhável, vale para um vídeo só, e a
 * validação não precisa de consulta ao banco.
 *
 * A comparação é em tempo constante de propósito. Comparar com `===` vaza,
 * pelo tempo de resposta, quantos caracteres do começo estavam certos, o que
 * transforma adivinhar 64 caracteres em adivinhar um de cada vez.
 */

export function assinarVideo(videoId: string): string {
  // Sem segredo não há assinatura (08/10). O padrão "demandou" que vivia aqui
  // era um segredo público: quem lesse o código assinava qualquer callback.
  const segredo = process.env.BETTER_AUTH_SECRET;
  if (!segredo) throw new Error("[callback-token] BETTER_AUTH_SECRET ausente: não dá para assinar o callback");
  return createHmac("sha256", segredo).update(`transcribe:${videoId}`).digest("hex");
}

export function assinaturaValida(videoId: string, assinatura: string): boolean {
  const esperada = assinarVideo(videoId);
  if (assinatura.length !== esperada.length) return false;
  return timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada));
}
