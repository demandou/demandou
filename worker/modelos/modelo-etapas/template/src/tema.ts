// Identidade do Etapas: sóbria, a do Reel de origem. A tela do topo é uma gravação de tela real
// (clara ou escura, a que a página tiver); os blocos de texto vivem num grafite quente. Um destaque
// só: o laranja da ferramenta (#D97757), na pílula, nos círculos numerados e nas marcas pequenas.
// Nada sobre a pessoa além da legenda: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO, enquadrar, type Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // a tela escura dos blocos de texto
  palco: "#17120F",
  palco2: "#221A15",
  osso: "#F4EEE8",
  apagado: "#9C9086",
  fio: "rgba(244,238,232,0.16)",
  // o destaque (um só)
  laranja: "#D97757",
  // alerta invertido
  claro: "#F4EEE8",
  tinta: "#17120F",
  branco: "#FFFFFF",
  // o fundo atrás de tudo
  preto: "#000000",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";

// ——— a grade do modo B ———
export const CANVAS_W = 1080;
// a tela do topo: no máximo ~38% da altura (termina em y 730); margem segura de 64 px dos lados e 120 px em cima. A pessoa ocupa o resto
export const TELA = { x: 64, y: 120, w: 952, h: 610 };
// os blocos de texto são desenhados para a tela: LARGURA × PALCO_H
export const LARGURA = TELA.w;
export const PALCO_H = TELA.h;
export const MARGEM = 56;
// a pílula fica centrada na junção da tela com o rosto
export const PILULA = { w: 724, h: 84, cy: TELA.y + TELA.h + 4 };
// a legenda do modo B fica abaixo do queixo (legendaTopo); a faixa entre a pílula e a cabeça é folga
// a pessoa ocupa o quadro inteiro nos modos A e C e de y 500 para baixo no B (veja caixaBase)
// o topo da cabeça no modo B (fixo em qualquer zoom) e nos modos A e C
export const CABECA_B = 940;
export const CABECA_A = 680;
export const CABECA_C = 360;
// largura do rosto na tela (px) que cada modo quer, no zoom base
const ROSTO_B = 350;
const ROSTO_A = 460;
const ROSTO_C = 480;
// Limites da interface do app (Reels/TikTok/Shorts)
// nada importante abaixo de y 1700 (interface do app)
export const UI_BASE = 1700;
export const UI_DIREITA = 960;

const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

export type Modo = "A" | "B" | "C";

// O momento ativo em t (o último que já começou e ainda não acabou).
export const momentoEm = (plano: Plano, t: number): Momento | undefined => {
  let achado: Momento | undefined;
  for (const m of plano.momentos) if (t >= m.de && t < m.ate && (!achado || m.de >= achado.de)) achado = m;
  return achado;
};
export const modoDe = (m?: Momento): Modo => (!m || m.tipo === "cta" ? "C" : m.tipo === "abertura" ? "A" : "B");
export const modoEm = (plano: Plano, t: number): Modo => modoDe(momentoEm(plano, t));

const larguraRosto = (plano: Plano) => plano.rosto.rastro?.largura ?? 0.3;
// zoom em que o rosto tem a largura que o modo pede (o vídeo de cada pessoa é enquadrado diferente)
export const zoomBase = (plano: Plano, modo: Modo) => {
  const alvo = modo === "B" ? ROSTO_B : modo === "A" ? ROSTO_A : ROSTO_C;
  return Math.min(2, Math.max(1.05, alvo / (larguraRosto(plano) * 1080)));
};

const topoDaCabeca = (modo: Modo) => (modo === "B" ? CABECA_B : modo === "A" ? CABECA_A : CABECA_C);
// No modo B a caixa da pessoa começa em y 500: o vídeo não pode deixar borda vazia em cima, então só
// assim o rosto desce até abaixo da pílula. O que fica acima (a margem em volta da tela) é uma
// segunda cópia muda do vídeo em quadro cheio (Edicao.tsx): nunca sobra tarja preta.
export const CAIXA_B_Y = 500;
const caixaBase = (modo: Modo) => (modo === "B" ? { x: 0, y: CAIXA_B_Y, w: CANVAS_W, h: 1920 - CAIXA_B_Y } : { x: 0, y: 0, w: CANVAS_W, h: 1920 });

// A caixa da pessoa em cada modo. O topo da cabeça fica sempre na mesma linha do modo; aproximar
// só desce o queixo. `mult` é o salto de escala do trecho (camera.ts).
export const caixaDaPessoa = (plano: Plano, modo: Modo, mult = 1): Caixa => {
  const vh = plano.videoAltura ?? 1920;
  const zoom = zoomBase(plano, modo) * mult;
  const box = caixaBase(modo);
  const topo = topoDaCabeca(modo) - box.y;
  let ancoraY = 0.4;
  for (let k = 0; k < 2; k++) {
    const caixa = { ...CHEIO, ...box, zoom, ancoraY };
    const esc = enquadrar(caixa, plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
    const L = larguraRosto(plano) * 1080 * esc;
    ancoraY = Math.min(0.7, Math.max(0.15, (topo + ATE_TOPO * L) / box.h));
  }
  return { ...CHEIO, ...box, zoom, ancoraY, raio: 0 };
};

// Onde o queixo cai (px) e onde a legenda começa em cada modo.
export const queixoDe = (plano: Plano, modo: Modo, mult = 1) => {
  const vh = plano.videoAltura ?? 1920;
  const caixa = caixaDaPessoa(plano, modo, mult);
  const esc = enquadrar(caixa, plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
  const L = larguraRosto(plano) * 1080 * esc;
  return topoDaCabeca(modo) + (ATE_TOPO + ATE_QUEIXO) * L;
};
export const legendaTopo = (plano: Plano, modo: Modo, mult = 1) => Math.round(Math.min(UI_BASE - 110, queixoDe(plano, modo, mult) + 34));

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// aproximação lenta do conteúdo dos blocos de texto: ~1,2% por segundo, no máximo 6%
export const aproximacao = (t: number, de: number) => 1 + Math.min(0.06, Math.max(0, t - de) * 0.012);

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
