// A gramática do modelo (versão deitada, 16:9): onde a pessoa está em cada instante e que tela o app mostra.
//
// - "cheia": a pessoa em quadro cheio, como foi gravada (destaque, cta e trechos sem momento), com
//   UM balão ao lado do rosto. É a base do vídeo completo (aula 9 do curso).
// - "conversa": a tela do app; a pessoa vira a mensagem de vídeo redonda na MOLDURA da direita, com
//   o rosto centralizado e seguido, e a conversa ocupa o QUADRO da esquerda (uma coluna).
// - "contraste": a tela do app com duas faixas (contraste e comparacao) na coluna da esquerda; a
//   bolha fica no mesmo lugar, na moldura.
// As trocas entre quadro cheio e bolha são o mesmo gesto do app: a mensagem de vídeo que se expande.
// No quadro deitado a bolha tem tamanho fixo (a conversa e a pessoa ficam lado a lado, uma não tira
// espaço da outra).
import { Easing } from "remotion";
import { prog } from "./anim";
import { type Caixa, CHEIO_16x9 } from "./motor/caixa";
import type { MomentoInterno, PlanoInterno } from "./blocos";
import { BOLHA, QUADRO, ROSTO_LARGURA_PADRAO } from "./tema";

export type Modo = "cheia" | "conversa" | "contraste";

export const modoDoMomento = (m: MomentoInterno | undefined): Modo =>
  !m ? "cheia" : m.tipo === "conversa" ? "conversa" : m.tipo === "contraste" || m.tipo === "comparacao" ? "contraste" : "cheia";

// duração da troca de layout (s) e quanto ela começa antes da fronteira (cai em cima do corte)
export const TROCA = 0.6;
export const ADIANTA = 0.06;
const suave = Easing.bezier(0.65, 0, 0.35, 1);

// O zoom da bolha: o rosto ocupa ~42% do diâmetro (pela largura do rosto medida no rastro), sem
// ampliar o vídeo de trabalho mais que BOLHA.ampliacaoMax. A escala-base de uma caixa quadrada de
// diâmetro d sobre o vídeo 1920×1080 é d / 1080 (o vídeo cobre a caixa pela altura).
export const zoomDaBolha = (plano: Pick<PlanoInterno, "rosto" | "videoAltura">) => {
  const rastro = (plano.rosto as { rastro?: { largura?: number } }).rastro;
  const largura = rastro?.largura && rastro.largura > 0.02 ? rastro.largura : ROSTO_LARGURA_PADRAO;
  const altura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const base = Math.max(BOLHA.d / QUADRO.w, BOLHA.d / altura);
  const desejado = (BOLHA.rosto * BOLHA.d) / (largura * QUADRO.w) / base;
  const teto = BOLHA.ampliacaoMax / base;
  return Math.min(BOLHA.zoomMax, teto, Math.max(BOLHA.zoomMin, desejado));
};

// a bolha (px do quadro): a moldura da direita
export const bolha = (zoom: number): Caixa => ({
  x: BOLHA.cx - BOLHA.d / 2,
  y: BOLHA.cy - BOLHA.d / 2,
  w: BOLHA.d,
  h: BOLHA.d,
  raio: BOLHA.d / 2,
  zoom,
  ancoraY: BOLHA.ancoraY,
});

const CAIXA_CHEIA: Caixa = { ...CHEIO_16x9, zoom: 1 };

// Faixas de tempo com o modo de cada uma (os buracos entre momentos são quadro cheio)
export type Faixa = { de: number; ate: number; modo: Modo; momento?: MomentoInterno };

export const montarFaixas = (plano: PlanoInterno): Faixa[] => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  const faixas: Faixa[] = [];
  let cursor = 0;
  for (const m of ms) {
    if (m.de > cursor + 0.05) faixas.push({ de: cursor, ate: m.de, modo: "cheia" });
    faixas.push({ de: m.de, ate: m.ate, modo: modoDoMomento(m), momento: m });
    cursor = m.ate;
  }
  if (cursor < plano.duracao - 0.05) faixas.push({ de: cursor, ate: plano.duracao, modo: "cheia" });
  return faixas;
};

export const faixaEm = (faixas: Faixa[], t: number) => faixas.find((f) => t >= f.de && t < f.ate) ?? faixas[faixas.length - 1];

// índice da faixa cujo layout vale em t (a troca começa ADIANTA antes da fronteira)
const indiceDoLayout = (faixas: Faixa[], t: number) => {
  let i = 0;
  for (let k = 1; k < faixas.length; k++) if (faixas[k].de - ADIANTA <= t) i = k;
  return i;
};

const mistura = (a: Caixa, b: Caixa, p: number): Caixa => {
  const m = (x: number, y: number) => x + (y - x) * p;
  return {
    x: m(a.x, b.x),
    y: m(a.y, b.y),
    w: m(a.w, b.w),
    h: m(a.h, b.h),
    raio: m(a.raio ?? 0, b.raio ?? 0),
    zoom: m(a.zoom ?? 1, b.zoom ?? 1),
    ancoraY: m(a.ancoraY ?? 0.38, b.ancoraY ?? 0.38),
  };
};

const alvo = (f: Faixa, zoom: number): Caixa => (f.modo === "cheia" ? CAIXA_CHEIA : bolha(zoom));

// A caixa da pessoa no instante t (px do quadro)
export const caixaDaPessoa = (t: number, faixas: Faixa[], zoom: number): Caixa => {
  const i = indiceDoLayout(faixas, t);
  const atual = alvo(faixas[i], zoom);
  if (i === 0) return atual;
  const p = prog(t, faixas[i].de - ADIANTA, TROCA, suave);
  return p >= 1 ? atual : mistura(alvo(faixas[i - 1], zoom), atual, p);
};

// Quanto o quadro cheio está "aberto" (0 = bolha, 1 = quadro cheio): os balões do quadro cheio só
// aparecem com a pessoa grande, e o app só aparece com ela pequena.
export const aberturaCheia = (caixa: Caixa) => Math.min(1, Math.max(0, (caixa.w - BOLHA.d) / (QUADRO.w - BOLHA.d)));
