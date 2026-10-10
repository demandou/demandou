// Identidade do Demo: quase nada de desenho. O que aparece em cima é material real (gravação de
// tela com cursor, imagem, print); o modelo só desenha a faixa-rótulo verde na emenda do split e,
// quando o vídeo pede, blocos simples no palco (verde-garrafa quase preto, texto branco, UM
// destaque em verde). A legenda é laranja-ouro, caixa-alta, fonte display condensada, a 80% da
// altura. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { Easing, interpolate } from "remotion";
import { CHEIO, enquadrar, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;
export const FONTE_LEGENDA = loadBebas("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const COR = {
  // o fundo do quadro e o palco dos blocos (verde-garrafa quase preto, o clima do estúdio)
  fundo: "#050A08",
  palco: "#0B1714",
  palco2: "#14241F",
  // texto no palco
  osso: "#F4F7F5",
  apagado: "#8FA39B",
  fio: "rgba(244,247,245,0.18)",
  // o destaque (um só): o verde da faixa-rótulo
  neon: "#4CD137",
  // palco invertido do alerta
  claro: "#F4F7F5",
  tinta: "#07100D",
  // a legenda: laranja-ouro com contorno marrom-escuro
  ouro: "#F4A53C",
  ouroContorno: "#3A1E08",
  // o rótulo
  rotulo: "#4CD137",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.4)";

// ——— a grade (medida do Reel original, 1080×1920) ———
export const LARGURA = 1080;
// Três layouts, sempre trocados em corte seco:
//  split = o insert em cima (44% da altura, colado no topo, sem borda) e a pessoa embaixo;
//  cheio = o insert na tela inteira (a pessoa some, só a voz fica);
//  eu    = a pessoa em tela cheia, mais fechada (zoom ~1,3), sem insert.
export type Layout = "split" | "cheio" | "eu";
export const ALT_SPLIT = 845;
export const PALCO_H = ALT_SPLIT;
// A faixa-rótulo verde fica centrada na emenda do split
export const ROTULO = { y: ALT_SPLIT, h: 104, wFrac: 0.44 };
export const PESSOA_Y = ALT_SPLIT;
export const PESSOA_H = 1920 - ALT_SPLIT;
// centro vertical da legenda: 80% da altura, igual em todos os layouts
export const LEGENDA_Y = 1536;
// margem interna do palco
export const MARGEM = 72;
// Limites da interface do app (Reels/TikTok/Shorts): só para as guias
export const UI_BASE = 1490;
export const UI_DIREITA = 960;

// folga acima da cabeça (px): no split, deixa o rótulo verde livre; em "eu", a cabeça respira no alto
const FOLGA_SPLIT = 140;
const FOLGA_EU = 330;
export const ZOOM_EU = 1.3;
// no split a pessoa já vem um pouco mais perto (o rosto do Reel é ~8% maior que o enquadramento solto)
export const ZOOM_SPLIT = 1.08;
// do centro do rosto (olhos/nariz) ao topo da cabeça e ao queixo, em larguras de rosto
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

// A caixa da pessoa em cada layout. A cabeça fica sempre na mesma linha; só o zoom do "eu" aproxima.
export const caixaDaPessoa = (plano: Plano, modo: Layout = "split"): Caixa => {
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.32;
  const eu = modo !== "split";
  const y = eu ? 0 : PESSOA_Y;
  const h = eu ? 1920 : PESSOA_H;
  const zoom = eu ? ZOOM_EU : ZOOM_SPLIT;
  const folga = eu ? FOLGA_EU : FOLGA_SPLIT;
  let ancoraY = 0.32;
  for (let k = 0; k < 2; k++) {
    const caixa = { ...CHEIO, x: 0, y, w: LARGURA, h, zoom, ancoraY };
    const esc = enquadrar(caixa, plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
    const L = largura * 1080 * esc;
    ancoraY = Math.min(0.62, Math.max(0.1, (folga + ATE_TOPO * L) / h));
  }
  return { ...CHEIO, x: 0, y, w: LARGURA, h, zoom, ancoraY, raio: 0 };
};

export type Medidas = { rostoL: number; queixo: number; queixoEu: number; topoCabeca: number };
const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.32;
  const L = (m: Layout) => largura * 1080 * enquadrar(caixaDaPessoa(plano, m), plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
  const r = {
    rostoL: L("split"),
    queixo: PESSOA_Y + FOLGA_SPLIT + (ATE_TOPO + ATE_QUEIXO) * L("split"),
    queixoEu: FOLGA_EU + (ATE_TOPO + ATE_QUEIXO) * L("eu"),
    topoCabeca: PESSOA_Y + FOLGA_SPLIT,
  };
  guardadas.set(plano, r);
  return r;
};

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// aproximação lenta do conteúdo do palco: ~2% por segundo, no máximo 6%
export const aproximacao = (t: number, de: number) => 1 + Math.min(0.06, Math.max(0, t - de) * 0.012);

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
