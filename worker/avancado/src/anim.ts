import { Easing, interpolate } from "remotion";

/** Todo movimento sai do quadro da composição (aulas 8.1 e 8.2): nada de CSS animation nem useFrame. */
export const SAIDA = Easing.bezier(0.16, 1, 0.3, 1);
export const ENTRADA = Easing.bezier(0.7, 0, 0.84, 0);
export const MEIO = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 → 1 entre os instantes a e b (em segundos), com a curva dada. */
export const k = (t: number, a: number, b: number, curva: (x: number) => number = SAIDA) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Média móvel centrada de uma série por quadro (rastro do rosto ou da cabeça). */
export const suavizar = (serie: number[], meia: number) =>
  serie.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - meia); j <= Math.min(serie.length - 1, i + meia); j++) {
      s += serie[j];
      n++;
    }
    return s / n;
  });
