// Identidade do Terço: sóbria. O palco de cima é grafite (quase preto, levemente azulado), o texto
// é osso, o apoio é cinza e há UM destaque: azul-cobalto, só em marcas pequenas (número, traço,
// sublinhado da palavra falada, a linha de progresso da divisória). Nada sobre a pessoa: a cor do
// vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO, enquadrar, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // o palco
  palco: "#11151B",
  palco2: "#1A1F27",
  // texto no palco
  osso: "#F2EFE9",
  apagado: "#8A919B",
  fio: "rgba(242,239,233,0.16)",
  // o destaque (um só)
  cobalto: "#5B84FF",
  // palco invertido do alerta
  claro: "#F2EFE9",
  tinta: "#11151B",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)";

// ——— a grade: um terço em cima (palco), dois terços embaixo (pessoa) ———
export const LARGURA = 1080;
export const PALCO_H = 640;
export const PESSOA_Y = PALCO_H;
export const PESSOA_H = 1920 - PALCO_H;
// margem interna do palco
export const MARGEM = 72;
// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;

// folga acima da cabeça, dentro da moldura da pessoa (px), em qualquer zoom
const FOLGA_CABECA = 48;
// do centro do rosto (olhos/nariz) ao topo da cabeça e ao queixo, em larguras de rosto
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;
// a legenda: altura reservada (2 linhas) e o limite de baixo
const LEGENDA_ALTURA = 124;

export type Medidas = {
  // zooms da câmera nos cortes (o mais fechado garante cabeça inteira e legenda acima da interface)
  zooms: number[];
  zoomMax: number;
  // largura do rosto na tela no zoom 1 (px)
  rostoL: number;
  // queixo no zoom mais fechado (px) e onde a legenda começa
  queixo: number;
  legTopo: number;
};

// A caixa da pessoa num zoom: o topo da cabeça fica sempre na mesma linha (FOLGA_CABECA abaixo
// da divisória); aproximar só desce o queixo. Assim a cabeça nunca é cortada e o corte de zoom
// parece uma câmera de verdade.
export const caixaDaPessoa = (plano: Plano, zoom: number): Caixa => {
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.32;
  let ancoraY = 0.32;
  // duas voltas: a folga de seguir o rosto depende de onde o rosto fica
  for (let k = 0; k < 2; k++) {
    const caixa = { ...CHEIO, x: 0, y: PESSOA_Y, w: LARGURA, h: PESSOA_H, zoom, ancoraY };
    const esc = enquadrar(caixa, plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
    const L = largura * 1080 * esc;
    ancoraY = Math.min(0.62, Math.max(0.18, (FOLGA_CABECA + ATE_TOPO * L) / PESSOA_H));
  }
  return { ...CHEIO, x: 0, y: PESSOA_Y, w: LARGURA, h: PESSOA_H, zoom, ancoraY, raio: 0 };
};

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.32;
  const L = (z: number) => largura * 1080 * enquadrar(caixaDaPessoa(plano, z), plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
  const queixoEm = (z: number) => PESSOA_Y + FOLGA_CABECA + (ATE_TOPO + ATE_QUEIXO) * L(z);
  // o zoom mais fechado: até 1,2, desde que a legenda caiba abaixo do queixo e acima da interface
  const limite = UI_BASE - LEGENDA_ALTURA - 20;
  let zoomMax = 1.2;
  while (zoomMax > 1.0 && queixoEm(zoomMax) > limite) zoomMax = Math.round((zoomMax - 0.02) * 100) / 100;
  const zooms = zoomMax >= 1.08 ? [1, Math.round((1 + (zoomMax - 1) / 2) * 100) / 100, zoomMax] : [1, Math.max(1.04, zoomMax)];
  const queixo = queixoEm(zoomMax);
  const legTopo = Math.round(Math.min(UI_BASE - LEGENDA_ALTURA, Math.max(PESSOA_Y + 300, queixo + 22)));
  const m = { zooms, zoomMax, rostoL: L(1), queixo, legTopo };
  guardadas.set(plano, m);
  return m;
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
