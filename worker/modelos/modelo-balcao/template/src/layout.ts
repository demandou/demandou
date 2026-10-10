// A moldura da pessoa (a "janela de baixo" da loja) e a câmera dela.
// A pessoa fica sempre embaixo do balcão, numa moldura larga de cantos arredondados, com a cabeça
// inteira e folga acima do cabelo. A câmera troca de escala em corte seco (100% ↔ 106%) só quando o
// trecho anterior durou mais de ~1 s, e dá um soco curto de aproximação quando o carimbo bate e
// quando o pino cai no mapa. O rosto é seguido pela VideoNaCaixa.
import { Easing } from "remotion";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { MOLDURA } from "./tema";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sobe = Easing.bezier(0.16, 1, 0.3, 1);
const desce = Easing.bezier(0.65, 0, 0.35, 1);

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// largura do rosto na tela com zoom 1 (px)
const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.28;
  const vh = plano.videoAltura ?? 1920;
  const escala = Math.max(MOLDURA.w / 1080, MOLDURA.h / vh);
  return l * 1080 * escala;
};

// instantes de soco de câmera: o carimbo do combo e o pino do mapa
const socos = (plano: Plano) =>
  (plano.momentos as Momento[])
    .flatMap((m) => (m.tipo === "combo" ? [m.valorEm ?? m.em] : m.tipo === "mapa" && m.numeroEm !== undefined ? [m.numeroEm] : []))
    .sort((a, b) => a - b);

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.14) return sobe(d / 0.14);
  if (d < 0.45) return 1;
  return 1 - desce(clamp((d - 0.45) / 0.9, 0, 1));
};

export type Layout = { caixa: (t: number) => Caixa; yLegenda: number; zoomBase: number };

export const prepararLayout = (plano: Plano): Layout => {
  // o rosto com ~29% da largura da moldura
  const l1 = larguraDoRosto(plano);
  const zoomBase = clamp((0.29 * MOLDURA.w) / Math.max(1, l1), 1, 1.5);
  const lr = l1 * zoomBase;
  // o centro do rosto fica ~1,15 largura de rosto abaixo do topo da cabeça; 56 px de folga acima do cabelo
  const ancoraY = clamp((56 + 1.15 * lr) / MOLDURA.h, 0.2, 0.55);
  const cortes = plano.cortesEm ?? [];
  const trocas: number[] = [];
  let ultima = 0;
  for (const c of cortes) {
    if (c - ultima >= 1) {
      trocas.push(c);
      ultima = c;
    }
  }
  const s = socos(plano);
  const caixa = (t: number): Caixa => {
    const k = trocas.filter((c) => c <= t + 1e-4).length;
    let z = zoomBase * (k % 2 === 1 ? 1.06 : 1);
    for (const e of s) z *= 1 + 0.04 * pulso(t, e);
    return { x: MOLDURA.x, y: MOLDURA.y, w: MOLDURA.w, h: MOLDURA.h, raio: MOLDURA.raio, zoom: Math.min(1.6, z), ancoraY };
  };
  // a legenda logo abaixo do queixo (o queixo fica ~0,7 largura de rosto abaixo do centro)
  const queixo = MOLDURA.y + ancoraY * MOLDURA.h + 0.7 * lr * 1.06;
  const yLegenda = Math.round(clamp(queixo + 64, MOLDURA.y + 420, 1650));
  return { caixa, yLegenda, zoomBase };
};
