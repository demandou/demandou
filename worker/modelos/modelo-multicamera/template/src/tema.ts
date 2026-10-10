// Identidade do Multicâmera: a mesa de corte de um estúdio. Duas câmeras na pessoa (aberta e
// fechada) e uma terceira, a "câmera C", que mostra a imagem ou o gráfico. O pacote gráfico é o
// de um canal bem editado: tarjas grafite, texto branco em Onest e um único destaque, o vermelho
// da luz de "no ar" (tally) da câmera. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Onest";
import { Easing, interpolate } from "remotion";
import { CHEIO, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // tarjas e painéis
  grafite: "#16181D",
  trilho: "#2A2E36",
  // texto
  branco: "#FFFFFF",
  apoio: "#A7ADB7",
  // o único destaque: a luz vermelha da câmera que está no ar
  tally: "#FF4A3D",
};

export const RAIO = 10;
export const SOMBRA = "0 12px 32px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.18)";
export const SOMBRA_TEXTO = "0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";

// As duas câmeras virtuais (1 = quadro como foi gravado) e um plano médio de reserva
export const ABERTO = 1;
export const FECHADO = 1.3;
export const MEDIO = 1.15;

// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const MARGEM = 64;
export const LARGURA_UTIL = UI_DIREITA - MARGEM; // 896

// A legenda mínima fica presa embaixo (a última linha termina aqui)
export const LEG_BASE = 1446;
export const LEG_LINHA = 62;

// ——— onde as coisas ficam, a partir do rosto ———
// As tarjas e painéis ficam no terço de baixo: do queixo no plano fechado (com folga) até a
// legenda, ou até o limite da interface quando o painel mostra a própria fala.
export type Medidas = { rostoX: number; rostoY: number; rostoL: number; queixo: number; zonaTopo: number; baseComLegenda: number; baseSemLegenda: number };

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const ancoraY = ancoraDo(plano);
  // plano fechado + folga de seguir o rosto + aproximação de ênfase
  const fechado = rostoNaTela({ ...CHEIO, zoom: FECHADO * 1.08 * 1.05, ancoraY }, plano.rosto, vh, 0, false);
  const aberto = rostoNaTela({ ...CHEIO, ancoraY }, plano.rosto, vh, 0, false);
  const queixo = fechado.y + fechado.largura * 0.7;
  const zonaTopo = Math.round(Math.min(1080, Math.max(900, queixo + 36)));
  const m = {
    rostoX: aberto.x,
    rostoY: aberto.y,
    rostoL: aberto.largura,
    queixo,
    zonaTopo,
    baseComLegenda: LEG_BASE - LEG_LINHA * 2 - 28,
    baseSemLegenda: UI_BASE - 24,
  };
  guardadas.set(plano, m);
  return m;
};

// o rosto fica na mesma altura nas duas câmeras (a linha dos olhos não pula no corte)
export const ancoraDo = (plano: Plano) => Math.min(0.4, Math.max(0.24, plano.rosto.y));

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
