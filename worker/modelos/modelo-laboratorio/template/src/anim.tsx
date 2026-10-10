import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de caderno: a caneta corre decidida, a página desliza e assenta, sem quique.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const vaiVem = Easing.bezier(0.65, 0, 0.35, 1);
export const caneta = Easing.bezier(0.35, 0.05, 0.45, 1);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos;
};

// Gerador pseudoaleatório fixo (o mesmo desenho em todo quadro: nada "ferve")
export const sorteio = (semente: number) => {
  let s = semente * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// Nenhum tempo antes de `minimo`; os que ficaram presos nele saem em cascata rápida
export const emCascata = (tempos: number[], minimo: number, passo = 0.09) => {
  const saida: number[] = [];
  for (const x of tempos) saida.push(Math.max(x, minimo, (saida[saida.length - 1] ?? -1) + (x < minimo ? passo : 0)));
  return saida;
};
