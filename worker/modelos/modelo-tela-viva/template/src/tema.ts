// Identidade da Tela Viva: quase nada de desenho. A tela de cima é uma gravação real; o que o
// modelo desenha é só o rótulo branco (caixa de cantos arredondados, texto preto em negrito) e,
// quando o vídeo pede, blocos simples dentro da moldura da tela (fundo quase preto, texto branco,
// UM destaque em roxo-neon, o mesmo roxo do estúdio). Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO, enquadrar, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // o fundo do quadro e o palco dos blocos (dentro da moldura da tela)
  fundo: "#000000",
  palco: "#0C0B12",
  palco2: "#17151F",
  // texto no palco
  osso: "#F6F5FA",
  apagado: "#9A97A8",
  fio: "rgba(246,245,250,0.18)",
  // o destaque (um só): o roxo-neon do estúdio
  neon: "#B678FF",
  // palco invertido do alerta e o rótulo
  claro: "#FFFFFF",
  tinta: "#0B0B10",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.4)";

// ——— a grade (medida do Reel original, 1080×1920) ———
export const LARGURA = 1080;
// A moldura da tela: topo a 120 px (margem segura), 64 px de cada lado, encostada na pessoa (sem vão preto)
export const TELA = { x: 64, y: 120, w: 952, h: 652, raio: 20 };
// Os blocos são desenhados num palco de 1080 px de largura que encolhe para caber na moldura
export const ESCALA_PALCO = TELA.w / LARGURA;
export const PALCO_H = Math.round(TELA.h / ESCALA_PALCO);
// O rótulo branco na junção
// (o rótulo fica sobre a parte de baixo da tela, com a captura preenchendo a moldura inteira)
export const ROTULO = { y: 650, h: 104, wFrac: 0.58 };
// A pessoa: do fim do rótulo até a base
export const PESSOA_Y = 770;
export const PESSOA_H = 1920 - PESSOA_Y;
// centro vertical da legenda (82% da altura, no peito)
export const LEGENDA_Y = 1565;
// margem interna do palco
export const MARGEM = 72;
// Limites da interface do app (Reels/TikTok/Shorts): só para as guias
export const UI_BASE = 1490;
export const UI_DIREITA = 960;

// folga acima da cabeça, dentro da moldura da pessoa (px), em qualquer zoom
const FOLGA_CABECA = 85;
// do centro do rosto (olhos/nariz) ao topo da cabeça e ao queixo, em larguras de rosto
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

export type Medidas = {
  // os dois enquadramentos do rosto (a diferença é de ~6%, só nos cortes)
  zooms: number[];
  zoomMax: number;
  // largura do rosto na tela no zoom 1 (px)
  rostoL: number;
  // queixo no zoom mais fechado (px) e onde a legenda começa
  queixo: number;
  legTopo: number;
};

// A caixa da pessoa num zoom: o topo da cabeça fica sempre na mesma linha (FOLGA_CABECA abaixo
// do rótulo); aproximar só desce o queixo. O zoom nunca é animado: troca num corte.
export const caixaDaPessoa = (plano: Plano, zoom: number): Caixa => {
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.32;
  let ancoraY = 0.32;
  for (let k = 0; k < 2; k++) {
    const caixa = { ...CHEIO, x: 0, y: PESSOA_Y, w: LARGURA, h: PESSOA_H, zoom, ancoraY };
    const esc = enquadrar(caixa, plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
    const L = largura * 1080 * esc;
    ancoraY = Math.min(0.62, Math.max(0.1, (FOLGA_CABECA + ATE_TOPO * L) / PESSOA_H));
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
  const zooms = [1, 1.06];
  const zoomMax = 1.06;
  const queixo = PESSOA_Y + FOLGA_CABECA + (ATE_TOPO + ATE_QUEIXO) * L(zoomMax);
  const m = { zooms, zoomMax, rostoL: L(1), queixo, legTopo: LEGENDA_Y - 30 };
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
