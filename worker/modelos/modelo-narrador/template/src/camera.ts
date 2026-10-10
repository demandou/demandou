// A câmera do Narrador sobre a pessoa: um zoom por trecho entre cortes, alternando 1,0 / 1,12 / 1,25
// (nunca o mesmo duas vezes seguidas). Isso esconde o pulo do corte. Toda volta de uma imagem em
// tela cheia também troca o enquadramento: a pessoa reaparece "noutra câmera". Trechos longos
// ganham uma aproximação lenta (no máximo ~6% em 2 s). O rosto continua sendo seguido pela VideoNaCaixa.
import type { Momento, Plano } from "./plano";
import { ZOOMS } from "./tema";

// Momentos que cobrem a tela inteira (a pessoa fica por baixo, sem aparecer)
const PRANCHAS = new Set(["numero", "topicos", "passos", "comparacao", "grafico", "definicao"]);
export const ePrancha = (m: Momento) => PRANCHAS.has(m.tipo);
export const cobreATela = (m: Momento) => m.tipo === "cena" || ePrancha(m) || (m.tipo === "abertura" && !!m.imagem);

// Intervalos (unidos) em que a tela está coberta por imagem ou prancha
const cobertos = new WeakMap<object, [number, number][]>();
export const faixasCobertas = (plano: Plano): [number, number][] => {
  const salvo = cobertos.get(plano);
  if (salvo) return salvo;
  const uniao: [number, number][] = [];
  for (const m of [...plano.momentos].filter(cobreATela).sort((a, b) => a.de - b.de)) {
    const u = uniao[uniao.length - 1];
    if (u && m.de <= u[1] + 0.05) u[1] = Math.max(u[1], m.ate);
    else uniao.push([m.de, m.ate]);
  }
  cobertos.set(plano, uniao);
  return uniao;
};
export const cobertoEm = (plano: Plano, t: number) => faixasCobertas(plano).some(([a, b]) => t >= a && t < b);

export type Trecho = { de: number; ate: number; zoom: number; aproximar: number };

const CICLO = [1, 2, 0, 2, 1, 0];

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const extras = plano.camera ?? [];
  const voltas = faixasCobertas(plano).map(([, b]) => b);
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
