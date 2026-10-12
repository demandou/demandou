// Identidade do Multicâmera: a mesa de corte de um estúdio. Duas câmeras na pessoa (aberta e
// fechada) e uma terceira, a "câmera C", que mostra a imagem ou o gráfico. O pacote gráfico é o
// de um canal bem editado: tarjas grafite, texto branco em Onest e um único destaque, o vermelho
// da luz de "no ar" (tally) da câmera. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Onest";
import { Easing, interpolate } from "remotion";
import { CHEIO_16x9, QUADRO_16x9, rostoNaTela, type Caixa } from "./motor/caixa";
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

// ——— o quadro deitado (16:9, 1920×1080), pela aula 9 do curso (editar uma aula horizontal) ———
// A base é a pessoa em tela cheia, cortada entre as duas câmeras. Quando um bloco pede apoio
// visual (listas, comparação, gráfico, definição, pergunta), a pessoa vai para a MOLDURA da direita,
// com o rosto centralizado nela e acompanhado, e o painel ocupa o QUADRO da esquerda. As tarjas e
// os painéis curtos continuam no terço de baixo, por cima da tela cheia.
export const QUADRO = { w: 1920, h: 1080 };
// Limites do player (YouTube): nada importante abaixo da linha dos controles nem colado nas laterais
export const UI_BASE = 984;
export const MARGEM = 96;
export const UI_DIREITA = QUADRO.w - MARGEM; // 1824
// os painéis do terço de baixo: largos e baixos (no deitado não cabe uma pilha alta)
export const LARGURA_UTIL = 1100;
// onde o quadro da esquerda encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1180;
// a moldura da pessoa: a faixa da direita, na altura toda
export const MOLDURA = { x: COSTURA, y: 0, w: QUADRO.w - COSTURA, h: QUADRO.h };
// a área dos painéis no quadro da esquerda (o painel fica centrado nela)
export const AREA_QUADRO = { x: MARGEM, y: 96, w: COSTURA - 64 - MARGEM, base: 960 };

// A legenda mínima fica presa embaixo (a última linha termina aqui), acima dos controles do player
export const LEG_BASE = 966;
export const LEG_LINHA = 56;

// ——— onde as coisas ficam, a partir do rosto ———
// As tarjas e painéis ficam no terço de baixo: do queixo no plano fechado (com folga) até a
// legenda, ou até o limite do player quando o painel mostra a própria fala.
export type Medidas = { rostoX: number; rostoY: number; rostoL: number; queixo: number; zonaTopo: number; baseComLegenda: number; baseSemLegenda: number };

// a câmera em tela cheia: o rosto fica onde foi gravado na horizontal e na mesma altura nas duas câmeras
export const caixaCheia = (plano: Plano, zoom = 1): Caixa => ({ ...CHEIO_16x9, zoom, ancoraX: plano.rosto.x, ancoraY: ancoraDo(plano) });
// o rosto do plano no quadro deitado (o cortar grava `rosto.quadro`; sem ele, vale o 1920×1080)
export const rostoDeitado = (plano: Plano) => (plano.rosto.quadro ? plano.rosto : { ...plano.rosto, quadro: QUADRO_16x9 });

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? QUADRO.h;
  const rosto = rostoDeitado(plano);
  // plano fechado + folga de seguir o rosto + aproximação de ênfase
  const fechado = rostoNaTela(caixaCheia(plano, FECHADO * 1.08 * 1.05), rosto, vh, 0, false);
  const aberto = rostoNaTela(caixaCheia(plano), rosto, vh, 0, false);
  // sem rastro, a largura do rosto no deitado é ~13% do quadro (o padrão do motor é o do vertical)
  const lf = rosto.rastro?.largura ? fechado.largura : 0.13 * QUADRO.w * fechado.escala;
  const la = rosto.rastro?.largura ? aberto.largura : 0.13 * QUADRO.w * aberto.escala;
  const queixo = fechado.y + lf * 0.7;
  const zonaTopo = Math.round(Math.min(700, Math.max(560, queixo + 24)));
  const m = {
    rostoX: aberto.x,
    rostoY: aberto.y,
    rostoL: la,
    queixo,
    zonaTopo,
    baseComLegenda: LEG_BASE - LEG_LINHA * 2 - 24,
    baseSemLegenda: UI_BASE - 24,
  };
  guardadas.set(plano, m);
  return m;
};

// o rosto fica na mesma altura nas duas câmeras (a linha dos olhos não pula no corte)
export const ancoraDo = (plano: Plano) => Math.min(0.45, Math.max(0.3, plano.rosto.y));

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
