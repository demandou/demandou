import sharp from "sharp";

/**
 * A ARTE DO STORY NA DIMENSÃO CERTA (08/10/2026, pedido do Bruno).
 *
 * O "postar também no story" cria um post irmão com a MESMA mídia do feed
 * (4:5, 1:1 ou paisagem), e o story do Instagram e do Facebook é 9:16: a
 * rede cortava a arte, com título e texto fora da tela. "Sempre tem que
 * postar na dimensão certa."
 *
 * Aqui a arte vira 1080x1920 sem perder nada: ela entra INTEIRA, centrada,
 * dentro da área segura do story (as faixas de 250 px no alto e embaixo ficam
 * sob o nome da conta e a caixa de resposta), e o fundo é a própria arte
 * ampliada, desfocada e escurecida, para a peça continuar com as cores dela.
 * Sem IA e sem custo: é ajuste de formato, não arte nova.
 */
export const STORY = { largura: 1080, altura: 1920, faixaSegura: 250 } as const;

/** Proporção já de story (9:16, com folga de 2%): não mexe. */
export function jaEhStory(largura: number, altura: number): boolean {
  if (!largura || !altura) return false;
  return Math.abs(largura / altura - 9 / 16) <= (9 / 16) * 0.02;
}

/** A caixa da arte dentro do story: largura cheia ou altura da área segura, o que couber. */
export function caixaDaArte(largura: number, altura: number): { w: number; h: number; x: number; y: number } {
  const maxW = STORY.largura;
  const maxH = STORY.altura - 2 * STORY.faixaSegura;
  const escala = Math.min(maxW / largura, maxH / altura);
  const w = Math.round(largura * escala);
  const h = Math.round(altura * escala);
  return { w, h, x: Math.round((STORY.largura - w) / 2), y: Math.round((STORY.altura - h) / 2) };
}

export async function arteParaStory(imagem: Buffer): Promise<{ buffer: Buffer; mime: string; ajustada: boolean }> {
  const meta = await sharp(imagem).rotate().metadata();
  const largura = meta.width ?? 0;
  const altura = meta.height ?? 0;
  if (!largura || !altura || jaEhStory(largura, altura)) {
    return { buffer: imagem, mime: meta.format === "png" ? "image/png" : "image/jpeg", ajustada: false };
  }
  const caixa = caixaDaArte(largura, altura);
  const fundo = await sharp(imagem)
    .rotate()
    .resize(STORY.largura, STORY.altura, { fit: "cover" })
    .blur(40)
    .modulate({ brightness: 0.55 })
    .toBuffer();
  const frente = await sharp(imagem).rotate().resize(caixa.w, caixa.h, { fit: "fill" }).toBuffer();
  const buffer = await sharp(fundo)
    .composite([{ input: frente, left: caixa.x, top: caixa.y }])
    .jpeg({ quality: 90 })
    .toBuffer();
  return { buffer, mime: "image/jpeg", ajustada: true };
}
