// Identidade do Yap: sóbria. Papel claro + tinta grafite + um destaque lima, só na tarja da
// palavra falada e em marcas pequenas. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing, interpolate } from "remotion";
import { CHEIO, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // cartões
  papel: "#F7F6F2",
  tinta: "#15171B",
  apagado: "#6B6F76",
  linha: "#E2E0D9",
  // o destaque (tarja da palavra falada, marcadores)
  lima: "#D9F45F",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

// sombra discreta dos cartões e do texto sobre o vídeo (legível em qualquer gravação)
export const SOMBRA_CARTAO = "0 16px 40px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18)";
export const SOMBRA_TEXTO = "0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)";
export const RAIO = 30;

// Zooms da câmera nos cortes (1 = quadro como foi gravado)
export const ZOOMS = [1, 1.12, 1.22];
export const ZOOM_MAX = 1.22;

// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const MARGEM = 64;

// ——— onde as coisas ficam, a partir do rosto ———
// A legenda fica numa faixa fixa logo abaixo do queixo (calculada para o zoom mais fechado, para
// nunca encostar nele); os cartões ficam abaixo dela, na altura do peito, até o limite da interface.
export type Medidas = { rostoY: number; rostoX: number; rostoL: number; queixo: number; legTopo: number; zonaTopo: number; zonaBase: number };

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const caixa = { ...CHEIO, zoom: ZOOM_MAX * 1.04, ancoraY: ancoraDo(plano) };
  const r = rostoNaTela(caixa, plano.rosto, vh, 0, false);
  const r1 = rostoNaTela({ ...CHEIO, ancoraY: ancoraDo(plano) }, plano.rosto, vh, 0, false);
  // do centro do rosto (olhos/nariz) ao queixo: ~0,7 da largura do rosto
  const queixo = r.y + r.largura * 0.7;
  const legTopo = Math.round(Math.min(1150, Math.max(760, queixo + 34)));
  const zonaTopo = legTopo + 192;
  const m = { rostoY: r1.y, rostoX: r1.x, rostoL: r1.largura, queixo, legTopo, zonaTopo, zonaBase: UI_BASE };
  guardadas.set(plano, m);
  return m;
};

// o rosto fica na mesma altura em qualquer zoom (o reenquadramento só aproxima)
export const ancoraDo = (plano: Plano) => Math.min(0.42, Math.max(0.24, plano.rosto.y));

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// entrada (0→1) e saída (1→0) de um elemento que vive de `de` a `ate`
export const vida = (t: number, de: number, ate: number, entra = 0.32, sai = 0.22) =>
  Math.min(prog(t, de, entra), 1 - prog(t, ate - sai, sai, suave));

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
