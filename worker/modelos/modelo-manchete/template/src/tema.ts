// Identidade da Manchete: a de um Reel de notícia. Fundo preto (as bordas ao redor do B-roll), a foto
// é o assunto, e UM destaque: o rosa-vermelho da tarja (que também pinta as marcas dos blocos
// universais). Texto branco bold sobre a pessoa, sem caixa. Nada muda a cor do vídeo.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO, enquadrar, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  palco: "#050505",
  palco2: "#15171B",
  osso: "#FFFFFF",
  apagado: "#9AA0A8",
  fio: "rgba(255,255,255,0.18)",
  // o destaque (um só): a tarja
  cobalto: "#F2305B",
  tarja: "#F2305B",
  claro: "#F4F1EA",
  tinta: "#0B0B0D",
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.7)";

// ——— a grade ———
export const LARGURA = 1080;
// A faixa do B-roll: de borda a borda e do topo até a pessoa, sem preto em volta e sem vão. A imagem
// (ou vídeo) a PREENCHE (cover, com foco); nunca letterbox. Só o texto respeita a margem segura.
// ~31% da altura, como no Reel original (a faixa termina em y ≈ 0,31 da tela).
export const BANDA = { x: 0, y: 0, w: 1080, h: 600 };
// Os blocos são desenhados numa área de 1080 × PALCO_H e reduzidos à largura da faixa
export const PALCO_H = Math.round((BANDA.h * LARGURA) / BANDA.w);
export const PESSOA_Y = BANDA.y + BANDA.h;
export const PESSOA_H = 1920 - PESSOA_Y;
// margem segura (revisão do Tiago): texto ≥ 64 px nas laterais, ≥ 120 px do topo, nada importante abaixo de y 1700
export const MARGEM = 72;
export const TOPO_SEGURO = 124;
// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;

// A tarja (px no quadro 1080×1920): pílula baixa, CENTRADA, que MONTA na borda de baixo da faixa
// (metade na foto, metade na pessoa), como no Reel original. Sem selo.
export const TARJA = { y: BANDA.y + BANDA.h - 40, altura: 84, raio: 18, max: 50, min: 34, padding: 34 };

// A pessoa: plano FIXO (um zoom só, o vídeo inteiro). O rosto fica na linha central, com os olhos em
// y = OLHOS_Y e a largura do rosto ~36% do quadro (plano médio-peito). O topo da cabeça fica abaixo da tarja.
export const OLHOS_Y = 1070;
const LARGURA_ROSTO = 0.36;
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;
const LEGENDA_ALTURA = 70;

export type Medidas = { zooms: number[]; zoomMax: number; rostoL: number; queixo: number; legTopo: number };

const zoomFixo = (plano: Plano) => {
  const largura = plano.rosto.rastro?.largura ?? 0.3;
  return Math.min(1.4, Math.max(1, LARGURA_ROSTO / largura));
};

export const caixaDaPessoa = (plano: Plano, _zoom?: number): Caixa => ({
  ...CHEIO,
  x: 0,
  y: PESSOA_Y,
  w: LARGURA,
  h: PESSOA_H,
  zoom: zoomFixo(plano),
  ancoraY: (OLHOS_Y - PESSOA_Y) / PESSOA_H,
  raio: 0,
});

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const largura = plano.rosto.rastro?.largura ?? 0.3;
  const z = zoomFixo(plano);
  const L = largura * 1080 * enquadrar(caixaDaPessoa(plano), plano.rosto, vh, plano.rosto.rastro ? 0 : null).escala;
  const queixo = OLHOS_Y + ATE_QUEIXO * L;
  // a legenda fica logo abaixo do queixo (o Reel original: ~80% da altura, sobre o peito)
  const legTopo = Math.round(Math.min(UI_BASE - LEGENDA_ALTURA, queixo + 22));
  const m = { zooms: [z], zoomMax: z, rostoL: L, queixo, legTopo };
  guardadas.set(plano, m);
  return m;
};
export const topoDaCabeca = (plano: Plano) => OLHOS_Y - ATE_TOPO * medidas(plano).rostoL;

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
