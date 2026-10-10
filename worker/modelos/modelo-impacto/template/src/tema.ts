import { loadFont as carregarMono } from "@remotion/google-fonts/AzeretMono";
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";

// Duas famílias: Sora (palavras) e Azeret Mono (números, como o cronômetro da academia).
export const sora = carregarSora("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily;

// Quase preto, branco-gelo e UM acento elétrico. Nada de degradê.
export const cor = {
  fundo: "#0B0B0B",
  papel: "#F3F2EC",
  volt: "#C8FF2E",
  // texto apagado (o que já passou, o que foi riscado)
  apagado: "rgba(243,242,236,0.34)",
  // trilho vazio (marcadores, anel)
  trilho: "rgba(243,242,236,0.14)",
};

// ——— Medidas do quadro (1080×1920) ———
export const QUADRO = { w: 1080, h: 1920 };
// abaixo desta linha fica a interface do Instagram/TikTok
export const LIMITE_APP = 1600;
// base da assinatura no rodapé da coluna livre
export const BASE_ASSINATURA = 1548;
// largura da caixa da pessoa quando ela vai para um lado
export const LADO_W = 490;
// margem externa e respiro entre o texto e a caixa da pessoa
export const MARGEM = 48;
export const RESPIRO = 36;
// janela da pessoa no momento em tela cheia (circuito)
export const JANELA = { x: 712, y: 214, w: 308, h: 410, raio: 14, zoom: 1.8, ancoraY: 0.4 };

// Coluna livre para o texto quando a pessoa está do lado `lado`.
export const colunaLivre = (lado: "esquerda" | "direita", ladoW = LADO_W) => {
  const largura = QUADRO.w - ladoW - MARGEM - RESPIRO;
  return lado === "direita"
    ? { x: MARGEM, w: largura, alinhar: "left" as const }
    : { x: ladoW + RESPIRO, w: largura, alinhar: "left" as const };
};

// ——— A geometria se adapta ao enquadramento do vídeo ———
// Gravação comum (rosto até ~40% da largura do quadro, medido pelo rastro do motor): a coluna da
// pessoa tem 490 px e a janela aproxima 1,8×, como no exemplo. Gravação de selfie, perto da câmera:
// a coluna alarga (até 580 px) e a janela aproxima menos, para a cabeça caber inteira.
export type Geometria = {
  ladoW: number;
  zoomLado: number;
  janela: { x: number; y: number; w: number; h: number; raio: number; zoom: number; ancoraY: number };
  coluna: (lado: "esquerda" | "direita") => { x: number; w: number; alinhar: "left" };
};
export const geometria = (rosto: { x: number; y: number; rastro?: { largura?: number } }): Geometria => {
  const L = rosto.rastro?.largura;
  const perto = typeof L === "number" && L > 0.4;
  const ladoW = perto ? Math.round(Math.min(580, Math.max(LADO_W, (L as number) * 1080 * 0.86))) : LADO_W;
  const zoomJanela = typeof L === "number" && L > 0 ? Math.min(2.4, Math.max(1, (JANELA.zoom * 0.31) / L)) : JANELA.zoom;
  return {
    ladoW,
    zoomLado: perto ? 1 : 1.06,
    janela: { ...JANELA, zoom: zoomJanela, ancoraY: perto ? 0.42 : JANELA.ancoraY },
    coluna: (lado) => colunaLivre(lado, ladoW),
  };
};

// ——— Largura do texto sem medir o DOM ———
// Avanço de cada caractere da Sora (em milésimos do tamanho da fonte), tirado da própria fonte.
const CARACTERES =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÀÂÃÉÊÍÓÔÕÚÇabcdefghijklmnopqrstuvwxyzáàâãéêíóôõúç0123456789 .,:;!?%/-–—×+'\"()&@#";
const AVANCO: Record<700 | 800, number[]> = {
  700: [
    782, 692, 800, 781, 594, 560, 833, 800, 332, 643, 752, 558, 971, 876, 864, 667, 864, 730, 667, 618, 776, 740, 1071, 722, 657, 647,
    782, 782, 782, 782, 594, 594, 332, 864, 864, 864, 776, 800, 594, 703, 611, 703, 624, 382, 686, 652, 334, 339, 639, 315, 983, 652,
    681, 703, 703, 421, 556, 434, 645, 597, 922, 601, 570, 502, 594, 594, 594, 594, 624, 624, 334, 681, 681, 681, 645, 611, 763, 428,
    632, 632, 672, 644, 687, 607, 667, 687, 210, 273, 273, 273, 273, 317, 563, 891, 407, 509, 526, 914, 596, 596, 268, 495, 393, 393,
    731, 1127, 722,
  ],
  800: [
    790, 696, 802, 778, 592, 560, 833, 798, 338, 644, 777, 562, 988, 885, 864, 676, 864, 740, 659, 626, 771, 750, 1080, 730, 658, 645,
    790, 790, 790, 790, 592, 592, 338, 864, 864, 864, 771, 802, 600, 708, 613, 708, 628, 383, 690, 656, 342, 346, 661, 324, 988, 656,
    682, 708, 708, 424, 562, 436, 650, 609, 946, 614, 577, 506, 600, 600, 600, 600, 628, 628, 342, 682, 682, 682, 650, 613, 769, 430,
    636, 638, 682, 651, 696, 618, 677, 696, 204, 276, 276, 276, 276, 324, 566, 904, 428, 510, 530, 918, 598, 598, 270, 516, 398, 398,
    745, 1129, 732,
  ],
};

// Largura de um texto em "em" (multiplique pelo tamanho da fonte para ter px).
export const larguraEm = (texto: string, peso: 700 | 800 = 800, espacamento = 0) => {
  const tabela = AVANCO[peso];
  let soma = 0;
  for (const c of texto) {
    const i = CARACTERES.indexOf(c);
    soma += i >= 0 ? tabela[i] / 1000 : 0.72;
  }
  return soma + Math.max(0, [...texto].length - 1) * espacamento;
};
// Azeret Mono: todo caractere tem 0,65 em.
export const larguraMonoEm = (texto: string) => [...texto].length * 0.65;

// Tamanho que faz o texto ocupar exatamente `largura` px, sem passar de `maximo`.
export const caber = (texto: string, largura: number, maximo: number, peso: 700 | 800 = 800, espacamento = TRACKING) =>
  Math.min(maximo, Math.floor(largura / Math.max(0.5, larguraEm(texto, peso, espacamento))));

// Palavras grandes ficam um pouco mais juntas (Sora é larga).
export const TRACKING = -0.02;
export const caixaAlta = (s: string) => s.toLocaleUpperCase("pt-BR");

export const rotulo: React.CSSProperties = {
  fontFamily: sora,
  fontWeight: 600,
  fontSize: 40,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  lineHeight: 1,
};

// Sombra curta só para o texto claro continuar legível sobre o vídeo (não é contorno nem brilho).
export const sombra = "0 2px 12px rgba(0,0,0,0.55)";
