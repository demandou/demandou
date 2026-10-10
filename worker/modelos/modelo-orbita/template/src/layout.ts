// Onde a pessoa fica em cada instante.
// - Fora do espaço: quadro cheio, rosto no eixo do meio, com o "punch" de corte (o zoom alterna
//   1,00 / 1,12 a cada corte, mais um empurrão de 1,5% dentro do trecho).
// - No espaço: a moldura embaixo (cantos arredondados, borda fina, sombra suave, fundo natural);
//   o quadro inteiro encolhe para a moldura em 0,9 s quando o espaço entra e volta quando ele sai.
// - Com `plano.recorte` (vídeo com transparência), no espaço ela aparece recortada, sem moldura,
//   na frente das estrelas (como no exemplo original).
import type { Caixa, Rosto } from "./motor/caixa";
import type { Plano, Virada } from "./plano";
import { janelaEm } from "./espaco/camera";
import { EASE_INOUT, EASE_SOFT, LEGENDA_Y, LEGENDA_Y_MOLDURA, MOLDURA, clamp01, lerp, prog } from "./tema";

export const ENTRA = 0.9;
export const SAI = 0.6;

export const viradaDo = (plano: Plano) => plano.momentos.find((m): m is Virada => m.tipo === "virada") ?? null;

// os cortes que trocam o zoom (com a virada sem vídeo, ela também troca)
const cortesDo = (plano: Plano) => {
  const v = viradaDo(plano);
  const cs = [...(plano.cortesEm ?? [])];
  if (v && !v.video && !cs.some((c) => Math.abs(c - v.trocaEm) < 0.2)) cs.push(v.trocaEm);
  return cs.filter((c) => c > 0.05 && c < plano.duracao - 0.05).sort((a, b) => a - b);
};
const trechoEm = (cortes: number[], t: number, dur: number) => {
  let i = 0;
  for (const c of cortes) if (t >= c) i++;
  const a = i === 0 ? 0 : cortes[i - 1];
  const b = i < cortes.length ? cortes[i] : dur;
  return { i, a, b };
};

// progresso da moldura (0 = quadro cheio, 1 = pessoa na moldura / recortada) em t
export const noEspaco = (plano: Plano, t: number) => {
  const j = janelaEm(plano, t, 0, SAI + 0.05);
  if (!j) return { p: 0, janela: null };
  const entra = EASE_INOUT(clamp01((t - j.de) / ENTRA));
  const sai = EASE_INOUT(clamp01((t - j.ate) / SAI));
  return { p: Math.min(entra, 1 - sai), janela: j };
};

const cheia = (plano: Plano, t: number): Caixa => {
  const cs = cortesDo(plano);
  const tr = trechoEm(cs, t, plano.duracao);
  const punch = tr.i % 2 === 1 ? 1.12 : 1.0;
  const empurra = 1 + 0.015 * EASE_SOFT(clamp01((t - tr.a) / Math.max(0.3, tr.b - tr.a)));
  return { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: punch * empurra, ancoraY: plano.rosto.y };
};

const naMoldura = (plano: Plano, t: number): Caixa => {
  const tr = trechoEm(cortesDo(plano), t, plano.duracao);
  return { ...MOLDURA, zoom: tr.i % 2 === 1 ? 1.06 : 1.0, ancoraY: 0.3 };
};

// recortada: um pouco maior que o quadro e mais baixa (o rosto perto de y 985), como no original
const recortada = (plano: Plano): Caixa => {
  const s = 1.04;
  const fy = plano.rosto.y * 1920 * s;
  const y = Math.max(0, 985 - fy);
  return { x: (1080 - 1080 * s) / 2, y, w: 1080 * s, h: 1920 * s, raio: 0, zoom: 1, ancoraY: plano.rosto.y };
};

const misturar = (a: Caixa, b: Caixa, p: number): Caixa => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  raio: lerp(a.raio ?? 0, b.raio ?? 0, p),
  zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, p),
  ancoraY: lerp(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3, p),
});

export const caixaDaPessoa = (plano: Plano, t: number) => {
  const { p } = noEspaco(plano, t);
  const c = cheia(plano, t);
  if (p <= 0) return { caixa: c, p: 0 };
  return { caixa: misturar(c, plano.recorte ? recortada(plano) : naMoldura(plano, t), p), p };
};

// a caixa "de antes" da virada (o enquadramento que a linha de luz substitui)
export const caixaAntesDaVirada = (plano: Plano): Caixa | null => {
  const v = viradaDo(plano);
  return v ? cheia(plano, v.trocaEm - 0.02) : null;
};

export const legendaY = (plano: Plano, t: number) => {
  const { p } = noEspaco(plano, t);
  return lerp(LEGENDA_Y, plano.recorte ? LEGENDA_Y : LEGENDA_Y_MOLDURA, p);
};

// o rosto de um vídeo que começa em `de` na linha do tempo (o rastro recomeça junto)
const deslocados = new WeakMap<object, Map<number, Rosto>>();
export const rostoDesde = (rosto: Rosto, de: number): Rosto => {
  const r = rosto.rastro;
  if (!r || de <= 0) return rosto;
  let m = deslocados.get(rosto);
  if (!m) deslocados.set(rosto, (m = new Map()));
  const pronto = m.get(de);
  if (pronto) return pronto;
  const k = Math.round(de / r.passo);
  const novo: Rosto = { ...rosto, rastro: { ...r, x: r.x.slice(k), y: r.y.slice(k), cx: r.cx.slice(k), cy: r.cy.slice(k) } };
  m.set(de, novo);
  return novo;
};

export const progLinha = (t: number, de: number, dur = 0.6) => EASE_INOUT(prog(t, de, de + dur, (x) => x));
