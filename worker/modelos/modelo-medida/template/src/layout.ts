// Gramática de layout do Medida.
// - Tela cheia: a pessoa ocupa o quadro (abertura, virada, objeto nas mãos, falas soltas).
// - Papel + moldura: quando entra informação, o vídeo se recolhe numa MOLDURA embaixo (cartão
//   arredondado, borda fina, sombra suave, fundo natural) e o papel creme aparece em cima, onde
//   ficam o palco 3D e os blocos. A troca leva 0,52 s.
// - Punch de corte: a cada corte o zoom alterna (1,00 ↔ 1,12 na tela cheia; 1,00 ↔ 1,07 na
//   moldura), com um empurrão lento de 1,5% dentro de cada trecho.
import type { Caixa, Rosto } from "./motor/caixa";
import { enquadrar, rostoNoTempo } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { EASE_INOUT, EASE_SOFT, clamp01, lerp, prog } from "./tema";

export const W = 1080;
export const H = 1920;
// a moldura da pessoa sobre o papel
export const CARD = { x: 54, y: 852, w: 972, h: 1014, r: 48 };
// centro do rosto dentro da moldura (px de tela)
export const ROSTO_NA_MOLDURA = 1228;
// área do papel acima da moldura (onde os blocos desenham)
export const PALCO = { x: 72, y: 150, w: 936, h: 670 };
const TRANSICAO = 0.52;

// os tipos que desenham por cima da pessoa em tela cheia (o resto usa papel + moldura)
const CHEIOS = new Set(["virada", "abertura"]);

type Evento = { t: number; moldura: boolean };
const cacheEventos = new WeakMap<Plano, Evento[]>();

/** a abertura cabe acima da cabeça? (senão vai para o papel) */
export const cabeAcimaDaCabeca = (plano: Plano) => {
  const largura = (plano.rosto as Rosto).rastro?.largura ?? 0.3;
  const topoCabeca = plano.rosto.y * H - largura * W * 0.8;
  return topoCabeca - 120 >= 200;
};

export const usaPapel = (m: Momento, plano: Plano) => {
  if (m.tipo === "abertura") return !cabeAcimaDaCabeca(plano);
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

/** a caixa da pessoa no instante t (tPunch: de que instante tirar o punch — usado na virada) */
export const caixaDaPessoa = (plano: Plano, t: number, tPunch = t): Caixa & { p: number } => {
  const p = molduraNoTempo(plano, t);
  const { zoom, empurra } = punchNoTempo(plano, tPunch);
  const videoAltura = plano.videoAltura ?? H;
  const zCheio = zoom * (1 + 0.015 * empurra);
  // na moldura o vídeo fica na largura do quadro (escala 1) e o punch vira 1,07
  const zMold = (W / CARD.w) * (1 + (zoom - 1) * 0.58);
  const ancoraCheio = clamp01((plano.rosto.y * H) / videoAltura);
  const ancoraMold = (ROSTO_NA_MOLDURA - CARD.y) / CARD.h;
  return {
    p,
    x: lerp(0, CARD.x, p),
    y: lerp(0, CARD.y, p),
    w: lerp(W, CARD.w, p),
    h: lerp(Math.min(H, videoAltura), CARD.h, p),
    raio: lerp(0, CARD.r, p),
    zoom: lerp(zCheio, zMold, p),
    ancoraY: lerp(ancoraCheio, ancoraMold, p),
  };
};

/** ponto do vídeo de trabalho (frações) → tela (px), com a caixa da pessoa naquele instante */
export const videoParaTela = (plano: Plano, fx: number, fy: number, t: number) => {
  const c = caixaDaPessoa(plano, t);
  const videoAltura = plano.videoAltura ?? H;
  const e = enquadrar(c, plano.rosto as Rosto, videoAltura, t);
  return { x: c.x + e.esquerda + fx * e.lv, y: c.y + e.topo + ((fy * H) / videoAltura) * e.av, escala: e.escala };
};

/** o rosto na tela (px) e a largura dele */
export const rostoNaTelaAgora = (plano: Plano, t: number) => {
  const r = plano.rosto as Rosto;
  const f = rostoNoTempo(r, t);
  const v = videoParaTela(plano, f.x, f.y, t);
  return { x: v.x, y: v.y, largura: (r.rastro?.largura ?? 0.3) * W * v.escala };
};

/** altura (centro, px) da legenda: abaixo do queixo; na tela cheia, à altura do peito */
export const alturaDaLegenda = (plano: Plano, t: number, objetoNasMaos: boolean) => {
  const p = molduraNoTempo(plano, t);
  const cheio = objetoNasMaos ? 1236 : 1330;
  if (p <= 0) return cheio;
  const r = rostoNaTelaAgora(plano, t);
  const mold = Math.max(1380, Math.min(1640, r.y + r.largura * 0.62 + 72));
  return lerp(cheio, mold, p);
};
