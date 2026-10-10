// A câmera e os lugares do Criativo.
// A pessoa fica sempre em quadro cheio, com o rosto onde foi gravado (no eixo do meio). A câmera
// troca de escala em corte seco a cada tomada (100% ↔ 107%, cobre o salto dos cortes e a emenda
// gancho → corpo), aproxima ~1,5% devagar dentro da tomada e dá um soco curto (+4%) nas palavras
// de impacto (número, selo, toque no botão). O rosto é seguido pela VideoNaCaixa.
// A legenda fica logo abaixo do queixo (já contando a maior aproximação); o palco começa abaixo
// dela e vai até a base segura do Ads.
import { Easing } from "remotion";
import { CHEIO, type Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { PALCO_BASE, PALCO_W, PALCO_X } from "./tema";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sobe = Easing.bezier(0.16, 1, 0.3, 1);
const desce = Easing.bezier(0.65, 0, 0.35, 1);

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Num plano de variante, o vídeo da pessoa toca em `trechos` (gancho + corpo): o tempo na tela
// vira o tempo no vídeo cortado. Sem trechos, é o mesmo tempo.
export const tempoNoVideo = (plano: Plano, t: number) => {
  if (!plano.trechos?.length) return t;
  let acc = 0;
  for (const tr of plano.trechos) {
    const d = tr.ate - tr.de;
    if (t < acc + d || tr === plano.trechos[plano.trechos.length - 1]) return tr.de + Math.min(t - acc, d);
    acc += d;
  }
  return t;
};
// instantes de emenda entre trechos (na linha do tempo da variante): contam como cortes
export const emendas = (plano: Plano) => {
  const lista: number[] = [];
  let acc = 0;
  (plano.trechos ?? []).forEach((tr, i) => {
    acc += tr.ate - tr.de;
    if (i < (plano.trechos?.length ?? 0) - 1) lista.push(acc);
  });
  return lista;
};

// palavras de impacto: soco curto de câmera
const impactos = (plano: Plano) =>
  (plano.momentos as Momento[])
    .flatMap((m) => {
      if (m.tipo === "numero") return [m.em];
      if (m.tipo === "selo") return [m.em];
      if (m.tipo === "prova" && m.numero) return [m.numero.em];
      if (m.tipo === "destaque") return [m.em];
      if (m.tipo === "cta") return [m.toqueEm ?? m.em ?? m.de];
      return [];
    })
    .sort((a, b) => a - b);

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.14) return sobe(d / 0.14);
  if (d < 0.45) return 1;
  return 1 - desce(clamp((d - 0.45) / 0.8, 0, 1));
};

export type Layout = {
  caixa: (t: number) => Caixa;
  yLegenda: number;
  yBotao: number;
  palco: { x: number; y: number; w: number; h: number };
  // o palco quando o botão está na tela (fica abaixo dele)
  palcoCta: { x: number; y: number; w: number; h: number };
  queixo: number;
};

const ZOOM_MAX = 1.12;

export const prepararLayout = (plano: Plano): Layout => {
  const rostoY = plano.rosto.y;
  const largura = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.3) * 1080;
  const vh = plano.videoAltura ?? 1920;
  // o rosto na tela (quadro cheio, zoom 1): centro em rostoY×1920 (o vídeo cobre o quadro)
  const escala = Math.max(1, 1920 / vh);
  const yRosto = rostoY * 1920;
  // queixo ~0,66 largura de rosto abaixo do centro, já com a maior aproximação
  const queixo = yRosto + 0.66 * largura * escala * ZOOM_MAX;
  const yLegenda = Math.round(clamp(queixo + 74, 700, 1180));
  const yBotao = yLegenda + 112;
  const topoPalco = yLegenda + 66;
  const palco = { x: PALCO_X, y: topoPalco, w: PALCO_W, h: PALCO_BASE - topoPalco };
  const topoCta = yBotao + 84;
  const palcoCta = { x: PALCO_X, y: topoCta, w: PALCO_W, h: PALCO_BASE - topoCta };

  const tomadas = [0, ...(plano.cortesEm ?? []), ...emendas(plano)].sort((a, b) => a - b).filter((c, i, l) => i === 0 || c - l[i - 1] > 0.3);
  const socos = impactos(plano);
  const caixa = (t: number): Caixa => {
    const k = tomadas.filter((c) => c <= t + 1e-4).length - 1;
    const inicio = tomadas[Math.max(0, k)] ?? 0;
    let z = k % 2 === 1 ? 1.07 : 1.0;
    // aproxima devagar dentro da tomada (1,5% a cada 3 s, no máximo 3%)
    z += Math.min(0.03, ((t - inicio) / 3) * 0.015);
    for (const e of socos) z += 0.04 * pulso(t, e);
    return { ...CHEIO, zoom: Math.min(ZOOM_MAX, z), ancoraY: rostoY };
  };
  return { caixa, yLegenda, yBotao, palco, palcoCta, queixo };
};

// O momento que ocupa o palco em cada instante: cada um sai quando o próximo entra.
// `selo` não ocupa o palco (é uma camada por cima do cartão da vez).
export const ocupaPalco = (m: Momento) => m.tipo !== "selo";
