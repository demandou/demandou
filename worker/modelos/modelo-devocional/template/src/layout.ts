// A moldura da pessoa e a área da página ao longo do tempo.
// A pessoa fica numa moldura larga embaixo (x 36 a 1044, a partir de y 1000), com a cabeça inteira e
// folga acima do cabelo. No versículo a página fica cheia: a moldura se recolhe num medalhão no
// centro de baixo (a cabeça inteira, menor) e o texto ocupa a tela; no fim do versículo ela volta.
// A câmera troca de escala em corte seco (100% ↔ 104%) só quando o trecho anterior durou mais de
// ~1 s. O rosto é seguido pela VideoNaCaixa.
import { Easing, interpolate } from "remotion";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COSTURA, MARGEM, MOLDURA, TOPO, VIRADA } from "./tema";

const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const suave = Easing.bezier(0.65, 0, 0.35, 1);

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Cada momento fica na página até o próximo entrar (o último, até o fim do vídeo).
export const fimDe = (plano: Plano, ordem: Momento[], i: number) => {
  const prox = ordem[i + 1];
  return prox ? prox.de : plano.duracao + 1;
};

// O medalhão do versículo (centro de baixo, acima da interface do app)
export const MEDALHAO = { x: 330, y: 1190, w: 420, h: 500 };

// A tarja do nome: logo acima da moldura, à esquerda, nos primeiros segundos
export const TARJA = { x: MARGEM, h: 124, y: COSTURA - 34 - 124 };

// `abre`: é o primeiro bloco e começa no quadro 0 — a primeira palavra dele já aparece no quadro 0
export type Area = { x: number; y: number; w: number; base: number; abre?: boolean };

export type Layout = {
  caixa: (t: number) => Caixa;
  // 0 = moldura larga, 1 = página cheia (medalhão)
  cheia: (t: number) => number;
  // topo da pessoa na tela (a página e a poeira ficam acima disto)
  topoPessoa: (t: number) => number;
  yLegenda: number;
  tarja: { de: number; ate: number };
  areaDe: (m: Momento) => Area;
};

export const prepararLayout = (plano: Plano): Layout => {
  const ordem = ordenar(plano);
  const vh = plano.videoAltura ?? 1920;
  const largRosto = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.3;
  const rostoPx = (w: number, h: number, zoom: number) => largRosto * 1080 * Math.max(w / 1080, h / vh) * zoom;

  // moldura larga: o rosto com ~28% da largura (sem aproximar além do necessário), 52 px de folga acima do cabelo
  const hN = 1920 - COSTURA + 60;
  const zN = limitar((0.28 * MOLDURA.w) / Math.max(1, rostoPx(MOLDURA.w, hN, 1)), 1, 1.5);
  const lrN = rostoPx(MOLDURA.w, hN, zN);
  const NORMAL = { x: MOLDURA.x, y: COSTURA, w: MOLDURA.w, h: hN, raio: MOLDURA.raio, zoom: zN, ancoraY: limitar((52 + 1.15 * lrN) / hN, 0.2, 0.55) };
  // medalhão: o rosto com ~44% da largura do medalhão, 34 px de folga acima do cabelo
  const zM = limitar((0.44 * MEDALHAO.w) / Math.max(1, rostoPx(MEDALHAO.w, MEDALHAO.h, 1)), 1, 2.4);
  const lrM = rostoPx(MEDALHAO.w, MEDALHAO.h, zM);
  const CHEIA = { ...MEDALHAO, raio: MEDALHAO.w / 2, zoom: zM, ancoraY: limitar((34 + 1.15 * lrM) / MEDALHAO.h, 0.25, 0.6) };

  // trechos de página cheia: cada versículo, do `de` até o próximo bloco entrar
  const trechos: [number, number][] = [];
  ordem.forEach((m, i) => {
    if (m.tipo !== "versiculo") return;
    const fim = fimDe(plano, ordem, i);
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && m.de - ultimo[1] < 0.05) ultimo[1] = fim;
    else trechos.push([m.de, fim]);
  });
  const cheia = (t: number) => {
    let v = 0;
    for (const [a, b] of trechos) {
      // um versículo no quadro 0 já começa com a página cheia
      const sobe = a <= 0.05 ? 1 : interpolate(t, [a, a + VIRADA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      const desce = interpolate(t, [b, b + VIRADA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      v = Math.max(v, sobe - desce);
    }
    return v;
  };

  // escala por trecho: troca só em cortes com mais de 1 s desde a última troca
  const trocas: number[] = [];
  let ultima = 0;
  for (const c of plano.cortesEm ?? []) {
    if (c - ultima >= 1) {
      trocas.push(c);
      ultima = c;
    }
  }
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  const caixa = (t: number): Caixa => {
    const k = cheia(t);
    const passo = trocas.filter((c) => c <= t + 1e-4).length % 2 === 1 ? 1.04 : 1;
    return {
      x: mix(NORMAL.x, CHEIA.x, k),
      y: mix(NORMAL.y, CHEIA.y, k),
      w: mix(NORMAL.w, CHEIA.w, k),
      h: mix(NORMAL.h, CHEIA.h, k),
      raio: mix(NORMAL.raio, CHEIA.raio, k),
      zoom: mix(NORMAL.zoom, CHEIA.zoom, k) * passo,
      ancoraY: mix(NORMAL.ancoraY, CHEIA.ancoraY, k),
    };
  };
  const topoPessoa = (t: number) => caixa(t).y;

  // a legenda logo abaixo do queixo (o queixo fica ~0,7 largura de rosto abaixo do centro)
  const queixo = NORMAL.y + NORMAL.ancoraY * NORMAL.h + 0.7 * lrN * 1.04;
  const yLegenda = Math.round(limitar(queixo + 58, NORMAL.y + 420, 1652));

  // a tarja: de 0,25 s até ~3,6 s (sai antes se um versículo encher a página)
  const nome = plano.marca?.nome?.trim();
  let fimTarja = nome ? Math.min(3.6, plano.duracao - 0.5) : 0;
  for (const m of ordem) if (m.tipo === "versiculo" && m.de < fimTarja) fimTarja = Math.max(0.3, m.de - 0.1);
  const tarja = { de: 0.25, ate: fimTarja };

  const areaDe = (m: Momento): Area => {
    const base = m.tipo === "versiculo" ? MEDALHAO.y - 44 : COSTURA - 44;
    const comTarja = nome && m.tipo !== "versiculo" && m.de < tarja.ate;
    return { x: MARGEM, y: TOPO, w: 1080 - 2 * MARGEM, base: comTarja ? TARJA.y - 30 : base, abre: m === ordem[0] && m.de <= 0.05 };
  };

  return { caixa, cheia, topoPessoa, yLegenda, tarja, areaDe };
};
