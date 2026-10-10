// Identidade do Níveis: faixa preta no topo, cartões de cantos suaves, rótulos brancos em caixa alta
// sem caixa, pílula branca no fechamento. Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing, interpolate } from "remotion";
import { CHEIO, rostoNaTela, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // cartões
  papel: "#FFFFFF",
  tinta: "#111111",
  apagado: "#6B6B6B",
  linha: "#E4E4E4",
  // o destaque (tarja da palavra falada, marcadores)
  lima: "#FFFFFF",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

// sombra discreta dos cartões e do texto sobre o vídeo (legível em qualquer gravação)
export const SOMBRA_CARTAO = "0 16px 40px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18)";
export const SOMBRA_TEXTO = "0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)";
export const RAIO = 24;

// Zooms da câmera nos cortes (1 = quadro como foi gravado)
// (variação mínima, como no Reel de origem: no máximo ~6%)
export const ZOOMS = [1, 1.03, 1.05];
export const ZOOM_MAX = 1.05;

// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const MARGEM = 64;

// ——— onde as coisas ficam, a partir do rosto ———
// Os cartões ficam por cima do fundo da própria cena, acima da cabeça: a pessoa desce até a
// cabeça (no zoom mais fechado) ficar logo abaixo dos rótulos e o topo é completado com o reflexo
// do próprio topo do vídeo (como o Reel de origem, que tem a cena inteira atrás dos cartões).
// O rosto tem sempre ~32% da largura.
// Os blocos universais (lista, número, comparação…) ficam abaixo do queixo, na altura do peito.
export type Medidas = {
  rostoY: number; rostoX: number; rostoL: number; queixo: number; legTopo: number; zonaTopo: number; zonaBase: number;
  desloca: number; zoomBase: number; cabeca: number;
  // a faixa dos cartões
  cartaoTopo: number; cartaoAlt: number; cartaoLar: number; rotuloY: number;
};

export const CARTAO_TOPO = 70;
export const CARTAO_LAR = 320;
export const CARTAO_ALT = 440;
export const CARTAO_X = [40, 380, 720];
export const ROTULO_Y = CARTAO_TOPO + CARTAO_ALT + 12;
const CABECA_ALVO = 700; // onde o topo do cabelo fica (no zoom mais fechado), abaixo dos rótulos
const ROSTO_LARGURA = 0.32; // largura do rosto na tela (fração de 1080)

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const r0 = rostoNaTela(CHEIO, plano.rosto, vh, 0, false);
  const zoomBase = Math.max(1, Math.min(1.5, (ROSTO_LARGURA * 1080) / r0.largura));
  const zMax = zoomBase * ZOOM_MAX;
  const desloca = Math.round(Math.max(0, Math.min(CABECA_ALVO - r0.y + 1.0 * r0.largura * zMax, 640)));
  const caixa = caixaDaPessoa(plano, desloca, zMax);
  const r = rostoNaTela(caixa, plano.rosto, vh, 0, false);
  const r1 = rostoNaTela(caixaDaPessoa(plano, desloca, zoomBase), plano.rosto, vh, 0, false);
  const queixo = r.y + r.largura * 0.7;
  const cabeca = r.y - r.largura * 1.0;
  const legTopo = Math.round(Math.min(1250, Math.max(760, queixo + 34)));
  const zonaTopo = legTopo + 60;
  const m = { rostoY: r1.y, rostoX: r1.x, rostoL: r1.largura, queixo, legTopo, zonaTopo, zonaBase: UI_BASE, desloca, zoomBase, cabeca, cartaoTopo: CARTAO_TOPO, cartaoAlt: CARTAO_ALT, cartaoLar: CARTAO_LAR, rotuloY: ROTULO_Y };
  guardadas.set(plano, m);
  return m;
};

// A pessoa: caixa que começa `desloca` px abaixo do topo (o vídeo desce junto), com o rosto
// parado no mesmo lugar do quadro em qualquer zoom.
export const caixaDaPessoa = (plano: Plano, desloca: number, zoom: number): Caixa => {
  const h = 1920 - desloca;
  const vh = plano.videoAltura ?? 1920;
  const faceY = (plano.rosto.y * 1920) / vh;
  return { x: 0, y: desloca, w: 1080, h, raio: 0, zoom, ancoraY: Math.min(0.95, (faceY * vh) / h) };
};

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
