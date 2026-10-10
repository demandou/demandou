// Onde a pessoa fica em cada instante (versão deitada, 16:9).
// - Fora do espaço: quadro cheio (a base da aula 9), com o "punch" de corte (o zoom alterna
//   1,00 / 1,12 a cada corte, mais um empurrão de 1,5% dentro do trecho), aproximando em volta do
//   rosto: ele não sai do lugar em que foi gravado.
// - No espaço: a moldura do lado direito (cantos arredondados, borda fina, sombra suave, fundo
//   natural), com o rosto centralizado nela e acompanhado suavemente pelo rastro; o quadro inteiro
//   encolhe para a moldura em 0,9 s quando o espaço entra e volta quando ele sai.
// - Com `plano.recorte` (vídeo com transparência), no espaço ela aparece recortada, sem moldura,
//   na frente das estrelas, no lugar da moldura (à direita).
import type { Caixa, Rosto } from "./motor/caixa";
import type { Plano, Virada } from "./plano";
import { janelaEm } from "./espaco/camera";
import { EASE_INOUT, EASE_SOFT, H, LEGENDA, MOLDURA, MOLDURA_ANCORA_Y, MOLDURA_ZOOM_MAX, ROSTO_NA_MOLDURA, W, clamp01, lerp, prog } from "./tema";

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

// o rosto do plano, sempre com o quadro em que foi medido (o cortar.mjs do 16:9 grava
// `rosto.quadro`; um plano sem ele vale o tamanho da composição)
const comQuadro = new WeakMap<object, Rosto>();
export const rostoDo = (plano: Plano): Rosto => {
  const r = plano.rosto as Rosto;
  if (r.quadro) return r;
  let pronto = comQuadro.get(r);
  if (!pronto) comQuadro.set(r, (pronto = { ...r, quadro: { largura: plano.largura || W, altura: plano.altura || H } }));
  return pronto;
};
export const alturaDoVideo = (plano: Plano) => plano.videoAltura ?? plano.altura ?? H;

const cheia = (plano: Plano, t: number): Caixa => {
  const cs = cortesDo(plano);
  const tr = trechoEm(cs, t, plano.duracao);
  const punch = tr.i % 2 === 1 ? 1.12 : 1.0;
  const empurra = 1 + 0.015 * EASE_SOFT(clamp01((t - tr.a) / Math.max(0.3, tr.b - tr.a)));
  // o punch aproxima em volta do rosto (ancoraX/ancoraY no lugar dele): a pessoa não pula de lado
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom: punch * empurra, ancoraY: plano.rosto.y, ancoraX: plano.rosto.x };
};

// A moldura da direita: o vídeo cobre a moldura (zoom 1) e aproxima até o rosto ocupar ~27% da
// largura dela (gravação de longe), com o rosto no meio e o rastro acompanhando.
const zoomDaMoldura = (plano: Plano) => {
  const largura = rostoDo(plano).rastro?.largura ?? 0.13;
  const W0 = rostoDo(plano).quadro?.largura ?? W;
  const s0 = Math.max(MOLDURA.w / W0, MOLDURA.h / alturaDoVideo(plano));
  return Math.max(1, Math.min(MOLDURA_ZOOM_MAX, (ROSTO_NA_MOLDURA * MOLDURA.w) / Math.max(1, largura * W0 * s0)));
};
const naMoldura = (plano: Plano, t: number): Caixa => {
  const tr = trechoEm(cortesDo(plano), t, plano.duracao);
  return { ...MOLDURA, zoom: zoomDaMoldura(plano) * (tr.i % 2 === 1 ? 1.06 : 1.0), ancoraY: MOLDURA_ANCORA_Y, ancoraX: 0.5 };
};

// recortada: a pessoa sem fundo, um pouco maior que o quadro, com o rosto no meio da moldura
// (à direita), na altura em que ele fica na moldura
const recortada = (plano: Plano): Caixa => {
  const s = 1.04;
  const w = W * s;
  const h = H * s;
  const alvo = { x: MOLDURA.x + MOLDURA.w / 2, y: MOLDURA.y + MOLDURA.h * MOLDURA_ANCORA_Y + 30 };
  const x = alvo.x - plano.rosto.x * w;
  const y = Math.max(0, alvo.y - plano.rosto.y * h);
  return { x, y, w, h, raio: 0, zoom: 1, ancoraY: plano.rosto.y, ancoraX: plano.rosto.x };
};

const misturar = (a: Caixa, b: Caixa, p: number): Caixa => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p),
  raio: lerp(a.raio ?? 0, b.raio ?? 0, p),
  zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, p),
  ancoraY: lerp(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3, p),
  ancoraX: lerp(a.ancoraX ?? 0.5, b.ancoraX ?? 0.5, p),
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

// onde a legenda fica em t: no quadro cheio, embaixo no meio; com a pessoa na moldura (ou
// recortada à direita), no peito dela, dentro da moldura
export const lugarDaLegenda = (plano: Plano, t: number) => {
  const { p } = noEspaco(plano, t);
  const a = LEGENDA.cheia;
  const b = LEGENDA.moldura;
  return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), largura: lerp(a.largura, b.largura, p), tamanho: lerp(a.tamanho, b.tamanho, p) };
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
