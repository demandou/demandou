// A câmera do modo (a): um zoom por trecho entre cortes, alternando 1,0 / 1,12 / 1,24 (nunca o
// mesmo duas vezes seguidas). Isso esconde o pulo do corte. Trechos longos ganham uma aproximação
// lenta (no máximo ~6% em 2 s). Os pontos de troca são os cortes do motor, a volta do palco e os
// itens de `plano.camera`. O rosto continua sendo seguido pela VideoNaCaixa.
import { cenasDoPlano } from "./cenas";
import { ZOOMS } from "./tema";
import type { Plano } from "./plano";

export type Trecho = { de: number; ate: number; zoom: number; aproximar: number };

const CICLO = [1, 2, 1, 0, 2, 0];

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const extras = plano.camera ?? [];
  // a volta do palco é um corte: a pessoa volta noutro enquadramento
  const voltas = cenasDoPlano(plano).map((c) => c.ate);
  const pontos = [0, ...(plano.cortesEm ?? []), ...voltas, ...extras.map((c) => c.em)]
    .filter((t) => t >= 0 && t < dur - 0.2)
    .sort((a, b) => a - b)
    .filter((t, i, l) => i === 0 || t - l[i - 1] > 0.25);
  const trechos: Trecho[] = [];
  let k = 0;
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1] ?? dur;
    const pedido = extras.find((c) => Math.abs(c.em - de) <= 0.25);
    const anterior = trechos[trechos.length - 1]?.zoom;
    let zoom = pedido?.zoom ?? (i === 0 ? ZOOMS[0] : ZOOMS[CICLO[k % CICLO.length]]);
    if (!pedido?.zoom && i > 0) {
      while (Math.abs(zoom - (anterior ?? 0)) < 0.01) zoom = ZOOMS[CICLO[++k % CICLO.length]];
      k++;
    }
    const longo = ate - de >= 2.4;
    // aproximação lenta: ~3% num trecho longo; 5% quando pedida (ênfase); nunca mais de 6% em 2 s
    const alvo = pedido?.aproximar ? 0.05 : longo ? 0.03 : 0;
    const aproximar = Math.min(alvo, (0.06 * (ate - de)) / 2);
    trechos.push({ de, ate, zoom, aproximar });
  });
  guardados.set(plano, trechos);
  return trechos;
};

export const zoomNoTempo = (plano: Plano, t: number) => {
  const trechos = trechosDaCamera(plano);
  const tr = trechos.find((x) => t >= x.de && t < x.ate) ?? trechos[trechos.length - 1];
  if (!tr) return 1;
  const p = Math.min(1, Math.max(0, (t - tr.de) / Math.max(0.01, tr.ate - tr.de)));
  // seno: começa e termina macio
  const suave = 0.5 - Math.cos(Math.PI * p) / 2;
  return tr.zoom * (1 + tr.aproximar * suave);
};
