// A gramática do modelo: onde a pessoa está em cada instante e que tela o app mostra.
//
// - "cheia": a pessoa em quadro cheio (destaque, cta e trechos sem momento), com balões por cima.
// - "conversa": a tela do app; a pessoa vira a mensagem de vídeo redonda embaixo da conversa.
//   O diâmetro dela se adapta à conversa do momento (grande quando há pouca mensagem, menor
//   quando as mensagens precisam de espaço) — a conversa e a pessoa dividem a tela inteira.
// - "contraste": a tela do app com duas faixas (contraste e comparacao); a bolha tem tamanho fixo embaixo delas.
// As trocas entre quadro cheio e bolha são o mesmo gesto do app: a mensagem de vídeo que se expande.
import { Easing } from "remotion";
import { prog } from "./anim";
import { type Caixa, CHEIO } from "./motor/caixa";
import type { MomentoInterno, PlanoInterno } from "./blocos";
import { diametroDaComparacao } from "./comparacao";
import { BOLHA, BOLHA_COMPARACAO, BOLHA_CONTRASTE, FOLGA_BOLHA, W } from "./tema";

export type Modo = "cheia" | "conversa" | "contraste";

export const modoDoMomento = (m: MomentoInterno | undefined): Modo =>
  !m ? "cheia" : m.tipo === "conversa" ? "conversa" : m.tipo === "contraste" || m.tipo === "comparacao" ? "contraste" : "cheia";

// a bolha das telas de duas faixas
const geoDasFaixas = (m: MomentoInterno | undefined) =>
  m?.tipo === "comparacao" ? { ...BOLHA_COMPARACAO, diametro: diametroDaComparacao(m) } : BOLHA_CONTRASTE;

// duração da troca de layout (s) e quanto ela começa antes da fronteira (cai em cima do corte)
export const TROCA = 0.6;
export const ADIANTA = 0.06;
const suave = Easing.bezier(0.65, 0, 0.35, 1);

// a bolha de diâmetro d, centralizada e apoiada na base da tela do app
export const bolha = (d: number, g: { zoom: number; ancoraY: number } = BOLHA): Caixa => ({
  x: (W - d) / 2,
  y: BOLHA.base - d,
  w: d,
  h: d,
  raio: d / 2,
  zoom: g.zoom,
  ancoraY: g.ancoraY,
});

const CAIXA_CHEIA: Caixa = { ...CHEIO, zoom: 1, ancoraY: 0.3 };

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
    ancoraY: m(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3),
  };
};

// `diametro(t, faixa)` diz o tamanho da bolha numa faixa de conversa (vem do fio, no Edicao)
export type Diametro = (t: number, f: Faixa) => number;

const alvo = (f: Faixa, t: number, diametro: Diametro): Caixa => {
  if (f.modo === "cheia") return CAIXA_CHEIA;
  if (f.modo === "contraste") {
    const g = geoDasFaixas(f.momento);
    return bolha(g.diametro, g);
  }
  return bolha(diametro(t, f));
};

// A caixa da pessoa no instante t
export const caixaDaPessoa = (t: number, faixas: Faixa[], diametro: Diametro): Caixa => {
  const i = indiceDoLayout(faixas, t);
  const atual = alvo(faixas[i], t, diametro);
  if (i === 0) return atual;
  const p = prog(t, faixas[i].de - ADIANTA, TROCA, suave);
  return p >= 1 ? atual : mistura(alvo(faixas[i - 1], t, diametro), atual, p);
};

// O diâmetro "do app" em t (ignora o quadro cheio): define onde a conversa termina. Num trecho de
// quadro cheio vale o da tela do app mais próxima (a que a pessoa acabou de deixar ou vai revelar).
export const diametroDoApp = (t: number, faixas: Faixa[], diametro: Diametro): number => {
  const d = (f: Faixa) => (f.modo === "contraste" ? geoDasFaixas(f.momento).diametro : diametro(t, f));
  const i = indiceDoLayout(faixas, t);
  const f = faixas[i];
  if (f.modo === "cheia") {
    const antes = [...faixas.slice(0, i)].reverse().find((x) => x.modo !== "cheia");
    const depois = faixas.slice(i + 1).find((x) => x.modo !== "cheia");
    const perto = !antes ? depois : !depois ? antes : t - f.de < f.ate - t ? antes : depois;
    return perto ? d(perto) : BOLHA.max;
  }
  const anterior = faixas[i - 1];
  if (!anterior || anterior.modo === "cheia") return d(f);
  const p = prog(t, f.de - ADIANTA, TROCA, suave);
  return d(anterior) + (d(f) - d(anterior)) * p;
};

export const baseDaConversa = (diametroApp: number) => BOLHA.base - diametroApp - FOLGA_BOLHA;

// Quanto o quadro cheio está "aberto" (0 = bolha, 1 = quadro cheio): os balões do quadro cheio só
// aparecem com a pessoa grande, e o app só aparece com ela pequena.
export const aberturaCheia = (caixa: Caixa) => Math.min(1, Math.max(0, (caixa.w - BOLHA.max) / (W - BOLHA.max)));
