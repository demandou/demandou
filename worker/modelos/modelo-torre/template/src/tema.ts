// Identidade do modelo Torre: lançamento imobiliário à noite.
// Azul-noite e grafite no fundo, marfim no texto, UM acento champanhe (dourado claro) nos traços,
// pinos, etiquetas e rotas. Serifa elegante só nos números grandes e no nome do empreendimento;
// Manrope nos rótulos (caixa alta espaçada) e Sora nos títulos e na legenda.
import { loadFont as carregarSerifa } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as carregarManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";

const serifa = carregarSerifa("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
const manrope = carregarManrope("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const sora = carregarSora("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });

export const FONTE = { serifa: serifa.fontFamily, sans: manrope.fontFamily, sora: sora.fontFamily };

export const K = {
  noite: "#070C17",
  navy: "#0E1729",
  tinta: "#0A1120",
  marfim: "#F5F0E6",
  marfimSuave: "rgba(245,240,230,0.72)",
  ouro: "#D9BE8A",
  ouroClaro: "#F1DFB6",
  ouroFundo: "#A7884F",
  linha: "rgba(236,242,255,0.85)",
  // cor de problema (destaque "alerta", lado perdedor): coral queimado, nunca vermelho puro
  alerta: "#E58A6E",
  vidro: "rgba(9,15,28,0.82)",
};

export const W = 1080;
export const H = 1920;

// ---------- a pessoa ----------
// Ponte (começo do vídeo): moldura grande, título por cima da cabeça.
export const PONTE = { x: 44, y: 476, w: 992, h: 1380, raio: 48 };
// Palco (depois da divisão): moldura larga embaixo, o mundo 3D ocupa a metade de cima.
export const CARTAO = { x: 76, y: 984, w: 928, h: 872, raio: 46 };
// rosto dentro das molduras (centro, px na tela) e a escala do vídeo (1 = largura do quadro)
export const ROSTO_PONTE_Y = 868;
export const ROSTO_CARTAO_Y = 1316;

// ---------- legenda ----------
// no palco: abaixo do queixo (padrão) ou na costura, logo acima da moldura de baixo (o exemplo; seguro
// para anúncio). Rosto grande demais para caber a legenda embaixo → costura.
export const LEG_COSTURA = 934;

// ---------- área do mundo / dos blocos (metade de cima no palco) ----------
export const AREA = { x: 64, y: 290, w: 952, base: 930 };
export const MARGEM = 64;
export const TOPO = 120;
