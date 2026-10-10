// Identidade do Narrador: a de um documentário bem cuidado. Marfim sobre a noite, serifa nos
// letreiros e nas citações (Playfair Display), sem serifa limpa na legenda e nos rótulos (Figtree),
// e um único destaque vermelhão, de etiqueta de museu. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont as carregarFigtree } from "@remotion/google-fonts/Figtree";
import { loadFont as carregarPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { Easing, interpolate } from "remotion";
import { CHEIO, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";

const sans = carregarFigtree("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const serifa = carregarPlayfair("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
carregarPlayfair("italic", { weights: ["500"], subsets: ["latin", "latin-ext"] });
export const FONTE = sans.fontFamily;
export const SERIFA = serifa.fontFamily;

export const COR = {
  // a prancha escura e o véu sobre as imagens
  noite: "#0E1319",
  // texto
  marfim: "#F2ECE1",
  apagado: "rgba(242, 236, 225, 0.62)",
  linha: "rgba(242, 236, 225, 0.30)",
  // o destaque (um só): palavra-chave, número, traço do letreiro
  vermelhao: "#E8603C",
};

// sombra do texto sobre a pessoa e sobre a imagem (legível em qualquer gravação, sem escurecer nada)
export const SOMBRA_TEXTO = "0 2px 16px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";
export const SOMBRA_LEVE = "0 1px 10px rgba(0,0,0,0.45)";

// Zooms da câmera nos cortes e nas voltas da imagem (1 = quadro como foi gravado)
export const ZOOMS = [1, 1.12, 1.25];
export const ZOOM_MAX = 1.25;

// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const MARGEM = 76;

// Transição das imagens (s): dissolve curto, como num documentário
export const DISSOLVE = 0.18;

// ——— onde as coisas ficam, a partir do rosto ———
// A legenda fica numa faixa fixa no terço de baixo (abaixo do queixo no zoom mais fechado, acima
// da interface): a mesma altura sobre a pessoa e sobre as imagens, para o olho não procurar.
// Os textos sobre a pessoa (abertura, frase, destaque…) ocupam a faixa entre o queixo e a interface.
export type Medidas = { rostoY: number; rostoX: number; rostoL: number; queixo: number; cabeca: number; legTopo: number; textoTopo: number };

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const fechado = rostoNaTela({ ...CHEIO, zoom: ZOOM_MAX * 1.04, ancoraY: ancoraDo(plano) }, plano.rosto, vh, 0, false);
  const r1 = rostoNaTela({ ...CHEIO, ancoraY: ancoraDo(plano) }, plano.rosto, vh, 0, false);
  // do centro do rosto (olhos/nariz) ao queixo: ~0,7 da largura do rosto; ao topo da cabeça: ~0,85
  const queixo = fechado.y + fechado.largura * 0.7;
  const cabeca = r1.y - r1.largura * 0.85;
  const legTopo = Math.round(Math.min(1330, Math.max(1210, queixo + 60)));
  const textoTopo = Math.round(Math.min(1150, Math.max(900, queixo + 50)));
  const m = { rostoY: r1.y, rostoX: r1.x, rostoL: r1.largura, queixo, cabeca, legTopo, textoTopo };
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
