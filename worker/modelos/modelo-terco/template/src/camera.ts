// A câmera do Terço: um zoom por trecho entre cortes, alternando entre os zooms do modelo (1,0 /
// ~1,1 / ~1,2, nunca o mesmo duas vezes seguidas). Isso esconde o pulo do corte. O topo da cabeça
// fica sempre na mesma linha (tema.ts → caixaDaPessoa): aproximar só desce o queixo, a cabeça nunca
// é cortada. Trechos longos ganham uma aproximação lenta (no máximo ~6% em 2 s). Os pontos de troca
// são os cortes do motor e os itens de `plano.camera`. O rosto continua sendo seguido pela VideoNaCaixa.
import { medidas } from "./tema";
import type { Plano } from "./plano";

export type Trecho = { de: number; ate: number; zoom: number; aproximar: number };

const CICLO = [1, 2, 1, 0, 2, 0];

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const { zooms, zoomMax } = medidas(plano);
  const dur = plano.duracao;
  const extras = plano.camera ?? [];
  const pontos = [0, ...(plano.cortesEm ?? []), ...extras.map((c) => c.em)]
    .filter((t) => t >= 0 && t < dur - 0.2)
    .sort((a, b) => a - b)
    .filter((t, i, l) => i === 0 || t - l[i - 1] > 0.25);
  const trechos: Trecho[] = [];
  let k = 0;
  const z = (i: number) => zooms[Math.min(zooms.length - 1, CICLO[i % CICLO.length])];
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1] ?? dur;
    const pedido = extras.find((c) => Math.abs(c.em - de) <= 0.25);
    const anterior = trechos[trechos.length - 1]?.zoom;
    let zoom = pedido?.zoom ? Math.min(zoomMax, Math.max(1, pedido.zoom)) : i === 0 ? zooms[0] : z(k);
    if (!pedido?.zoom && i > 0) {
      let guarda = 0;
      while (Math.abs(zoom - (anterior ?? 0)) < 0.01 && guarda++ < 8) zoom = z(++k);
      k++;
    }
    const longo = ate - de >= 2.4;
    // aproximação lenta: ~3% num trecho longo; 5% quando pedida (ênfase); nunca mais de 6% em 2 s
    // e nunca além do zoom mais fechado (a cabeça e a legenda continuam no lugar)
    const alvo = pedido?.aproximar ? 0.05 : longo ? 0.03 : 0;
    const aproximar = Math.max(0, Math.min(alvo, (0.06 * (ate - de)) / 2, zoomMax / zoom - 1));
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
