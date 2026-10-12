// A onda do áudio. Os valores de verdade vêm de src/onda.json, gerado por `node ferramentas/onda.mjs`
// a partir do vídeo de trabalho (20 valores por segundo, 0 a 1). Se o arquivo não existir ou for de
// outro corte (duração ou número de palavras diferente), a onda é estimada pelas palavras do plano: sobe onde há fala e
// desce nas pausas — funciona, mas é menos viva que a medida.
import ondaMedida from "./onda.json";
import type { Plano } from "./plano";

export type Onda = { porSegundo: number; valores: number[]; medida: boolean };

// ruído determinístico (o mesmo valor em todo render)
const ruido = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const ondaDoPlano = (plano: Plano): Onda => {
  const dados = ondaMedida as { duracao?: number; palavras?: number; porSegundo?: number; valores?: number[] };
  const mesmoCorte = Math.abs((dados.duracao ?? 0) - plano.duracao) < 0.15 && (dados.palavras === undefined || dados.palavras === plano.palavras.length);
  if (dados.valores?.length && dados.porSegundo && mesmoCorte) {
    return { porSegundo: dados.porSegundo, valores: dados.valores, medida: true };
  }
  const porSegundo = 20;
  const n = Math.ceil(plano.duracao * porSegundo) + 1;
  const valores = Array.from({ length: n }, (_, i) => {
    const t = i / porSegundo;
    const p = plano.palavras.find((w) => t >= w.em && t <= w.ate);
    if (!p) return 0.02 + ruido(i) * 0.03;
    const meio = Math.sin(Math.PI * Math.min(1, (t - p.em) / Math.max(0.08, p.ate - p.em)));
    return Math.min(1, 0.35 + 0.45 * meio + 0.25 * ruido(i));
  });
  return { porSegundo, valores, medida: false };
};

// valor da onda num instante (interpolado entre as amostras)
export const valorEm = (onda: Onda, t: number) => {
  const x = t * onda.porSegundo;
  const i = Math.floor(x);
  const a = onda.valores[Math.max(0, Math.min(onda.valores.length - 1, i))] ?? 0;
  const b = onda.valores[Math.max(0, Math.min(onda.valores.length - 1, i + 1))] ?? 0;
  return a + (b - a) * (x - i);
};
