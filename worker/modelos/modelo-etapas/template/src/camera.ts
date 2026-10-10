// A câmera do Etapas: reenquadramento em SALTO, nunca zoom animado. Cada trecho tem um multiplicador
// de escala (8–15% de diferença entre trechos vizinhos, nunca igual ao anterior) sobre o zoom base do
// modo (tema.ts). Os pontos de troca são: os cortes do motor, o começo e o fim de cada momento, cada
// troca de etapa, os itens de `plano.camera` e, em rosto parado, um salto a cada ~3 s.
import type { Plano } from "./plano";

export type Trecho = { de: number; ate: number; mult: number };

const CICLO = [1, 1.1, 0.96, 1.15, 1.04, 1.12];
const PARADO_MAX = 3.2;

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const dur = plano.duracao;
  const extras = plano.camera ?? [];
  const base = new Set<number>([0]);
  (plano.cortesEm ?? []).forEach((c) => base.add(c));
  extras.forEach((c) => base.add(c.em));
  plano.momentos.forEach((m) => {
    base.add(m.de);
    if (m.ate < dur - 0.2) base.add(m.ate);
  });
  let pontos = [...base].filter((t) => t >= 0 && t < dur - 0.2).sort((a, b) => a - b).filter((t, i, l) => i === 0 || t - l[i - 1] > 0.5);
  // rosto parado por muito tempo: salto extra no meio
  const cheio: number[] = [];
  pontos.forEach((de, i) => {
    cheio.push(de);
    const ate = pontos[i + 1] ?? dur;
    const n = Math.floor((ate - de) / PARADO_MAX);
    for (let k = 1; k <= n; k++) cheio.push(de + ((ate - de) * k) / (n + 1));
  });
  pontos = cheio;
  const trechos: Trecho[] = [];
  let k = 0;
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1] ?? dur;
    const pedido = extras.find((c) => Math.abs(c.em - de) <= 0.25 && c.zoom);
    let mult = i === 0 ? CICLO[0] : CICLO[++k % CICLO.length];
    if (pedido?.zoom) mult = pedido.zoom;
    const anterior = trechos[trechos.length - 1]?.mult;
    if (anterior !== undefined && Math.abs(mult - anterior) < 0.05) mult = CICLO[++k % CICLO.length];
    trechos.push({ de, ate, mult });
  });
  guardados.set(plano, trechos);
  return trechos;
};

export const multNoTempo = (plano: Plano, t: number) => {
  const trechos = trechosDaCamera(plano);
  return (trechos.find((x) => t >= x.de && t < x.ate) ?? trechos[trechos.length - 1])?.mult ?? 1;
};
