// Gramática de layout do Medida, versão deitada (16:9, 1920×1080, o vídeo completo do YouTube).
// A regra da composição é a da aula 9 do curso (editar uma aula horizontal):
// - Tela cheia é a base: a pessoa ocupa o quadro como foi gravada (abertura, virada, objeto nas
//   mãos, falas soltas), com a legenda na área segura de baixo.
// - Papel + moldura: quando entra informação, o vídeo se recolhe numa MOLDURA do lado DIREITO
//   (cartão arredondado, borda fina, sombra suave, fundo natural), com o rosto centralizado nela e
//   acompanhado de leve pelo rastro; o papel creme aparece e o QUADRO da esquerda recebe o palco 3D
//   e os blocos. A troca leva 0,52 s, como no vertical.
// - Punch de corte: a cada corte o zoom alterna (1,00 ↔ 1,12 na tela cheia; 1,00 ↔ 1,07 na
//   moldura), com um empurrão lento de 1,5% dentro de cada trecho.
//
//   [ PAPEL: x 96–1120, y 132–948 (os blocos)  |  MOLDURA: x 1184–1824, y 132–948 (a pessoa) ]
import type { Caixa, Rosto } from "./motor/caixa";
import { enquadrar, rostoNoTempo } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { EASE_INOUT, EASE_SOFT, clamp01, lerp, prog } from "./tema";

export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_PLAYER = 984;
// a moldura da pessoa, do lado direito (aula 9): o rosto fica centralizado nela
export const CARD = { x: 1184, y: 132, w: 640, h: 816, r: 44 };
// onde o centro do rosto fica na altura da moldura (0 = topo, 1 = base): cabeça inteira e ombros
const ANCORA_NA_MOLDURA = 0.4;
// quanto o rosto ocupa da largura da moldura (a mesma proporção do vertical: ~36%)
const ROSTO_NA_MOLDURA = 0.36;
// o papel (o quadro dos blocos), do lado esquerdo, com 64 px de vão até a moldura
export const PALCO = { x: MARGEM, y: 132, w: CARD.x - 64 - MARGEM, h: 816 };
const TRANSICAO = 0.52;
// largura do rosto (fração da largura do quadro) quando o plano não tem rastro: no 16:9 o rosto
// gravado ocupa bem menos da largura que no vertical
export const ROSTO_PADRAO = 0.13;

// os tipos que desenham por cima da pessoa em tela cheia (o resto usa papel + moldura)
const CHEIOS = new Set(["virada", "abertura"]);

type Evento = { t: number; moldura: boolean };
const cacheEventos = new WeakMap<Plano, Evento[]>();

/** o rosto do plano com o quadro em que foi medido (o cortar grava `rosto.quadro` no 16:9) */
export const rostoDo = (plano: Plano): Rosto => {
  const r = plano.rosto as Rosto;
  return r.quadro ? r : { ...r, quadro: { largura: W, altura: H } };
};
export const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO;
};

/** No quadro deitado não há espaço acima da cabeça: os títulos de tela cheia (a virada e a
    abertura) vão na COLUNA LIVRE ao lado da pessoa, do lado com mais espaço, da margem até perto
    do rosto, na altura dele. */
export const colunaAoLado = (plano: Plano, t: number) => {
  const r = rostoNaTelaAgora(plano, t);
  const folga = r.largura * 0.8 + 40;
  const esquerda = { x: MARGEM, w: r.x - folga - MARGEM };
  const direita = { x: r.x + folga, w: W - MARGEM - (r.x + folga) };
  const lado = esquerda.w >= direita.w ? esquerda : direita;
  return { x: lado.x, w: Math.max(0, lado.w), y: r.y, rosto: r };
};

/** a abertura cabe ao lado da cabeça? (senão vai para o papel) */
export const cabeAoLadoDaCabeca = (plano: Plano) => colunaAoLado(plano, 0).w >= 560;

export const usaPapel = (m: Momento, plano: Plano) => {
  if (m.tipo === "abertura") return !cabeAoLadoDaCabeca(plano);
  return !CHEIOS.has(m.tipo);
};

/** quando o papel entra para este momento (null = o momento fica em tela cheia) */
export const papelEm = (m: Momento, plano: Plano): number | null => {
  if (!usaPapel(m, plano)) return null;
  if (m.tipo === "medida" || m.tipo === "objeto") {
    if (m.objeto) return Math.max(m.de, m.palcoEm ?? m.objeto.em + 1.2);
    return m.palcoEm ?? m.de;
  }
  return m.de - 0.1;
};

const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

export const eventosDeLayout = (plano: Plano): Evento[] => {
  const guardado = cacheEventos.get(plano);
  if (guardado) return guardado;
  const ms = ordenar(plano);
  const ev: Evento[] = [{ t: -1, moldura: false }];
  ms.forEach((m, i) => {
    const prox = ms[i + 1];
    const papel = papelEm(m, plano);
    if (papel === null) ev.push({ t: m.de, moldura: false });
    else {
      if (papel > m.de + 0.05) ev.push({ t: m.de, moldura: false });
      ev.push({ t: papel, moldura: true });
    }
    // vão longo depois do momento: volta para a tela cheia
    if (!prox || prox.de - m.ate > 1.0) ev.push({ t: m.ate, moldura: false });
  });
  // tira os eventos que não mudam nada
  const limpo: Evento[] = [];
  for (const e of ev.sort((a, b) => a.t - b.t)) {
    if (limpo.length && limpo[limpo.length - 1].moldura === e.moldura) continue;
    limpo.push(e);
  }
  cacheEventos.set(plano, limpo);
  return limpo;
};

/** 0 = tela cheia, 1 = papel + moldura */
export const molduraNoTempo = (plano: Plano, t: number) => {
  const ev = eventosDeLayout(plano);
  let v = 0;
  for (let i = 1; i < ev.length; i++) {
    const e = ev[i];
    if (t < e.t - 0.02) break;
    const p = prog(t, e.t - 0.02, e.t - 0.02 + TRANSICAO, EASE_INOUT);
    v = lerp(v, e.moldura ? 1 : 0, p);
  }
  return clamp01(v);
};

// ---------- punch de corte ----------
type Trecho = { de: number; zoom: number };
const cacheTrechos = new WeakMap<Plano, Trecho[]>();
export const trechosDeZoom = (plano: Plano): Trecho[] => {
  const g = cacheTrechos.get(plano);
  if (g) return g;
  let lista: Trecho[];
  if (plano.enquadramentos?.length) lista = [...plano.enquadramentos].sort((a, b) => a.de - b.de);
  else {
    const cortes = [...(plano.cortesEm ?? [])];
    // sem vídeo de virada, a linha de luz troca o enquadramento: conta como corte
    if (!plano.videoVirada) for (const m of plano.momentos) if (m.tipo === "virada") cortes.push(m.trocaEm);
    lista = [{ de: 0, zoom: 1 }];
    for (const c of cortes.sort((a, b) => a - b)) {
      const u = lista[lista.length - 1];
      if (c - u.de < 1.2) continue;
      lista.push({ de: c, zoom: u.zoom === 1 ? 1.12 : 1 });
    }
  }
  if (!lista.length || lista[0].de > 0) lista.unshift({ de: 0, zoom: 1 });
  cacheTrechos.set(plano, lista);
  return lista;
};

/** punch no instante t: { zoom (1 ou 1,12), empurrão lento 0..1 } */
export const punchNoTempo = (plano: Plano, t: number) => {
  const ts = trechosDeZoom(plano);
  let i = 0;
  for (let k = 0; k < ts.length; k++) if (ts[k].de <= t) i = k;
  const fim = ts[i + 1]?.de ?? plano.duracao;
  const empurra = EASE_SOFT(clamp01((t - ts[i].de) / Math.max(0.5, fim - ts[i].de)));
  return { zoom: ts[i].zoom, empurra };
};

/** O zoom da moldura (1 = o menor enquadramento que cobre o cartão): o rosto ocupa ~36% da largura
    dela, como no vertical, seja qual for o tamanho do rosto na gravação. */
const zoomNaMoldura = (plano: Plano, videoAltura: number) => {
  const base = Math.max(CARD.w / W, CARD.h / videoAltura);
  const rostoPx = larguraDoRosto(plano) * W * base;
  return Math.max(1, Math.min(1.7, (ROSTO_NA_MOLDURA * CARD.w) / rostoPx));
};

/** a caixa da pessoa no instante t (tPunch: de que instante tirar o punch, usado na virada) */
export const caixaDaPessoa = (plano: Plano, t: number, tPunch = t): Caixa & { p: number } => {
  const p = molduraNoTempo(plano, t);
  const { zoom, empurra } = punchNoTempo(plano, tPunch);
  const videoAltura = plano.videoAltura ?? H;
  const zCheio = zoom * (1 + 0.015 * empurra);
  // na moldura o punch vira 1,07
  const zMold = zoomNaMoldura(plano, videoAltura) * (1 + (zoom - 1) * 0.58);
  const ancoraCheio = clamp01((plano.rosto.y * H) / videoAltura);
  return {
    p,
    x: lerp(0, CARD.x, p),
    y: lerp(0, CARD.y, p),
    w: lerp(W, CARD.w, p),
    h: lerp(Math.min(H, videoAltura), CARD.h, p),
    raio: lerp(0, CARD.r, p),
    zoom: lerp(zCheio, zMold, p),
    ancoraY: lerp(ancoraCheio, ANCORA_NA_MOLDURA, p),
  };
};

/** ponto do vídeo de trabalho (frações) → tela (px), com a caixa da pessoa naquele instante */
export const videoParaTela = (plano: Plano, fx: number, fy: number, t: number) => {
  const c = caixaDaPessoa(plano, t);
  const videoAltura = plano.videoAltura ?? H;
  const e = enquadrar(c, rostoDo(plano), videoAltura, t);
  return { x: c.x + e.esquerda + fx * e.lv, y: c.y + e.topo + ((fy * H) / videoAltura) * e.av, escala: e.escala };
};

/** o rosto na tela (px) e a largura dele */
export const rostoNaTelaAgora = (plano: Plano, t: number) => {
  const r = rostoDo(plano);
  const f = rostoNoTempo(r, t);
  const v = videoParaTela(plano, f.x, f.y, t);
  return { x: v.x, y: v.y, largura: larguraDoRosto(plano) * W * v.escala };
};

// ---------- legenda ----------
// Na tela cheia, na área segura de baixo (o terço de baixo, acima dos controles do player); na
// moldura, dentro dela, logo abaixo do queixo (como no vertical). A caixa e o corpo da letra passam
// de um lugar para o outro junto com a moldura.
export const LEGENDA_CHEIA = { x: MARGEM, w: W - 2 * MARGEM, y: 918 };
export const LEGENDA_CORPO = 60;
export type CaixaDaLegenda = { x: number; w: number; y: number };

/** onde a legenda fica no instante t: centro vertical (y) e a faixa horizontal (x, w) */
export const legendaNoTempo = (plano: Plano, t: number): CaixaDaLegenda => {
  const p = molduraNoTempo(plano, t);
  if (p <= 0) return LEGENDA_CHEIA;
  const r = rostoNaTelaAgora(plano, t);
  const mold = Math.max(CARD.y + CARD.h * 0.56, Math.min(CARD.y + CARD.h - 64, r.y + r.largura * 0.62 + 64));
  return {
    x: lerp(LEGENDA_CHEIA.x, CARD.x + 20, p),
    w: lerp(LEGENDA_CHEIA.w, CARD.w - 40, p),
    y: lerp(LEGENDA_CHEIA.y, mold, p),
  };
};
