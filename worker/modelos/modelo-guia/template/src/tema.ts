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

// Limites da interface do app (Reels/TikTok/Shorts)
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const MARGEM = 64;

export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
export const SOMBRA_TEXTO = "none";
