// Identidade do Guia: tela clara de aula. Fundo branco (infográficos, prints, diagramas), tinta preta,
// UM laranja de marca (estrela, números, grifo) e vermelho só para setas e CTA. Pílula preta com texto
// branco rotula arquivo/ferramenta. Nada sobre a pessoa: ela é um recorte sem fundo, sem filtro.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { loadFont as loadScript } from "@remotion/google-fonts/Caveat";
import { Easing, interpolate } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const script = loadScript("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;
export const FONTE_SCRIPT = script.fontFamily;

export const COR = {
  papel: "#FFFFFF",
  tinta: "#141414",
  cinza: "#8C8C92",
  cinzaClaro: "#E9E8E4",
  linha: "#D9D8D3",
  // a marca: estrela, números, grifo, item da vez
  laranja: "#D97757",
  laranjaClaro: "#F6DFD5",
  // só para setas de "clique aqui" e para o CTA
  seta: "#E5322D",
  cta: "#F0405A",
  estrada: "#2B2B2E",
};

export const SOMBRA_CARTAO = "0 18px 44px rgba(20,20,20,0.16), 0 2px 8px rgba(20,20,20,0.10)";

// ——— o quadro deitado (16:9, 1920×1080, o vídeo longo do YouTube) ———
// A regra da aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é a base; quando
// um bloco pede apoio visual, abre a tela de aula (o QUADRO branco, à esquerda) e a pessoa vai para
// uma MOLDURA do lado direito, com o rosto centralizado e acompanhado. Ao fim da ideia, volta à tela
// cheia. As trocas são em corte seco, como no vertical.
//
//   [ QUADRO: as telas de aula, x 36–1164, y 40–1000 | MOLDURA: x 1240–1840, y 96 até a borda de baixo ]
//
// Sem legenda (o Guia não tem). Nada importante abaixo de y 1000 (controles do player) e nada a
// menos de 64 px das laterais.
export const QUADRO = { w: 1920, h: 1080 };
// a moldura da pessoa: retrato do lado direito; ela sangra pela borda de baixo (o corpo chega à
// borda, como no vertical) e só os cantos de cima ficam à vista
export const MOLDURA = { x: 1240, y: 96, w: 600, h: 1080 - 96 + 48, raio: 28 };
// o rosto ocupa ~38% da largura da moldura (cabeça e ombros) e fica a ~34% da altura visível
export const ROSTO_NA_MOLDURA = { largura: 0.38, altura: 0.34 };
// a área da tela de aula, à esquerda da moldura (px do quadro)
export const AREA = { x: 0, y: 40, w: 1200, h: 960 };
// nada importante abaixo daqui (controles do player do YouTube)
export const BASE_SEGURA = 1000;

// As telas são desenhadas numa CAMADA LÓGICA com as medidas do vertical (1080 de largura; o conteúdo
// vive entre y 40 e 960, que no vertical é a metade de cima, acima da cabeça) e ampliadas pela ESCALA
// até encher a área do quadro. Por isso as telas (Telas.tsx, Print.tsx, Mapa.tsx) usam px lógicos:
// a margem de 64 px, o cartão de 936 px do print, os corpos de texto, tudo é medido nessa camada.
export const LOGICO = { w: 1080, y0: 40, h: 920 };
export const ESCALA = Math.min(AREA.w / LOGICO.w, AREA.h / LOGICO.h);
// onde a origem da camada lógica cai no quadro (a camada fica centrada na largura da área)
export const ORIGEM = { x: AREA.x + (AREA.w - LOGICO.w * ESCALA) / 2, y: AREA.y - LOGICO.y0 * ESCALA };
// a base útil das telas, em px lógicos (o que passar dela sai da área segura)
export const BASE_LOGICA = LOGICO.y0 + LOGICO.h - 30;

// Margem lateral das telas (px lógicos; no quadro, a área ainda fica a ≥ 36 px da borda)
export const MARGEM = 64;

export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
export const SOMBRA_TEXTO = "none";
