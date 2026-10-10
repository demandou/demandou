// Curvas e utilidades de tempo (tudo em segundos, na linha do tempo do vídeo cortado).
import { Easing, interpolate } from "remotion";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.25, 1);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0→1 entre dois instantes (s) */
export const prog = (agora: number, a: number, b: number, curva: (x: number) => number = EASE_OUT) =>
  b <= a ? (agora >= b ? 1 : 0) : interpolate(agora, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });

/** interpolação por chaves [t, v] com curva em cada trecho */
export const keys = (agora: number, ks: Array<[number, number]>, curva: (x: number) => number = EASE_INOUT) => {
  if (!ks.length) return 0;
  if (agora <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++)
    if (agora <= ks[i][0]) {
      const d = ks[i][0] - ks[i - 1][0];
      return d <= 0 ? ks[i][1] : lerp(ks[i - 1][1], ks[i][1], curva((agora - ks[i - 1][0]) / d));
    }
  return ks[ks.length - 1][1];
};

/** número no formato pt-BR (83.000; 1,5) */
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
