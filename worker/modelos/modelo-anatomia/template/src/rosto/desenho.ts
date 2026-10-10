import { type P3, type Ring, type Strip, mirror, resample, ringFibers, stripFibers } from "./geom";

/* Anatomia — o desenho do rosto (lado direito, x > 0; o esquerdo é espelhado). Coordenadas de cabeça:
   coroa y = −0.80, sobrancelha ≈ −0.17, olhos ≈ −0.06, base do nariz ≈ 0.26, boca ≈ 0.38, queixo 0.63.
   Frontal (2 ventres verticais) = linhas horizontais da testa · corrugador do supercílio (oblíquo, sob a sobrancelha)
   = "11" entre as sobrancelhas · prócero (vertical, raiz do nariz) · orbicular do olho (anel) = pés de galinha. */

/* ---------- pele: traços ---------- */
export const BROW_U: P3[] = [[0.04, -0.15], [0.085, -0.172], [0.14, -0.19], [0.2, -0.198], [0.26, -0.192], [0.31, -0.178], [0.35, -0.158]];
export const BROW_L: P3[] = [[0.04, -0.118], [0.085, -0.136], [0.14, -0.152], [0.2, -0.162], [0.26, -0.163], [0.31, -0.158], [0.35, -0.152]];
export const LID_U: P3[] = [[0.098, -0.05], [0.118, -0.072], [0.15, -0.088], [0.195, -0.095], [0.24, -0.09], [0.273, -0.077], [0.297, -0.058]];
export const LID_L: P3[] = [[0.098, -0.05], [0.13, -0.034], [0.175, -0.026], [0.225, -0.028], [0.265, -0.038], [0.297, -0.058]];
export const CREASE: P3[] = [[0.115, -0.083], [0.155, -0.108], [0.205, -0.116], [0.255, -0.106], [0.292, -0.083]];
export const TEAR: P3[] = [[0.11, -0.02], [0.15, 0.0], [0.2, 0.008], [0.25, 0.002]];
export const EYE_C: [number, number] = [0.197, -0.06];
export const NOSE_BRIDGE: P3[] = [[0.03, -0.1, 0.0], [0.036, -0.02, 0.04], [0.042, 0.07, 0.07], [0.05, 0.15, 0.09]];
export const ALA: P3[] = [[0.045, 0.172, 0.1], [0.08, 0.186, 0.075], [0.108, 0.208, 0.055], [0.116, 0.235, 0.045], [0.1, 0.256, 0.05], [0.07, 0.262, 0.07]];
export const TIP: P3[] = [[-0.05, 0.248, 0.11], [-0.026, 0.262, 0.14], [0, 0.266, 0.15], [0.026, 0.262, 0.14], [0.05, 0.248, 0.11]];
export const NOSTRIL: P3[] = [[0.018, 0.262, 0.1], [0.036, 0.254, 0.09], [0.058, 0.254, 0.08], [0.074, 0.262, 0.07], [0.056, 0.268, 0.08], [0.03, 0.268, 0.09]];
export const PHILTRUM: P3[] = [[0.016, 0.275, 0.06], [0.02, 0.31, 0.05], [0.026, 0.342, 0.045]];
export const LIP_LINE: P3[] = [[-0.172, 0.378, 0.03], [-0.12, 0.374, 0.035], [-0.06, 0.38, 0.04], [-0.022, 0.376, 0.042], [0, 0.38, 0.042], [0.022, 0.376, 0.042], [0.06, 0.38, 0.04], [0.12, 0.374, 0.035], [0.172, 0.378, 0.03]];
export const LIP_TOP: P3[] = [[-0.172, 0.378, 0.03], [-0.13, 0.36, 0.035], [-0.07, 0.346, 0.04], [-0.028, 0.34, 0.042], [0, 0.348, 0.042], [0.028, 0.34, 0.042], [0.07, 0.346, 0.04], [0.13, 0.36, 0.035], [0.172, 0.378, 0.03]];
export const LIP_BOT: P3[] = [[0.172, 0.378, 0.03], [0.13, 0.4, 0.035], [0.07, 0.418, 0.04], [0, 0.424, 0.042], [-0.07, 0.418, 0.04], [-0.13, 0.4, 0.035], [-0.172, 0.378, 0.03]];
export const CHIN: P3[] = [[-0.07, 0.468, 0.03], [0, 0.476, 0.03], [0.07, 0.468, 0.03]];
export const NASOLAB: P3[] = [[0.122, 0.235, 0.03], [0.15, 0.285, 0.02], [0.176, 0.338, 0.02], [0.194, 0.37, 0.02]];

/** pelos da sobrancelha (direita): base na borda de baixo, mediais sobem, laterais deitam */
export const BROW_HAIRS: P3[][] = (() => {
  const lo = resample(BROW_L, 26);
  const up = resample(BROW_U, 26);
  const o: P3[][] = [];
  for (let i = 0; i < 26; i++) {
    const s = i / 25;
    const ang = (-80 + 62 * Math.pow(s, 0.7)) * (Math.PI / 180);
    const h = Math.hypot(up[i][0] - lo[i][0], up[i][1] - lo[i][1]) * (1.05 - 0.25 * s);
    for (const k of [0.15, 0.55]) {
      const bx = lo[i][0] + (up[i][0] - lo[i][0]) * k * 0.4;
      const by = lo[i][1] + (up[i][1] - lo[i][1]) * k * 0.4;
      o.push([[bx, by, 0.012], [bx + Math.cos(ang) * h * 0.55, by + Math.sin(ang) * h * 0.55, 0.012], [bx + Math.cos(ang) * h * 0.95 + 0.006 * s, by + Math.sin(ang) * h * 0.95 + 0.004, 0.012]]);
    }
  }
  return o;
})();
export const LASHES: P3[][] = (() => {
  const up = resample(LID_U, 10);
  const o: P3[][] = [];
  for (let i = 3; i < 10; i++) {
    const s = i / 9;
    const [x, y] = up[i];
    o.push([[x, y, 0], [x + 0.012 + 0.012 * s, y - 0.012, 0], [x + 0.02 + 0.016 * s, y - 0.016, 0]]);
  }
  return o;
})();

/* ---------- sombreado da pele (formas desfocadas): [cx, cy, rx, ry, opacidade, espelha] ---------- */
export const SHADOWS: Array<[number, number, number, number, number, boolean]> = [
  [0.2, -0.112, 0.125, 0.04, 0.32, true],
  [0.075, -0.065, 0.032, 0.06, 0.34, true],
  [0.21, 0.01, 0.1, 0.024, 0.16, true],
  [0.06, 0.12, 0.028, 0.1, 0.22, false],
  [0, 0.29, 0.07, 0.016, 0.42, false],
  [0, 0.448, 0.085, 0.02, 0.3, false],
  [0, 0.66, 0.26, 0.05, 0.45, false],
  [0.2, 0.39, 0.03, 0.03, 0.18, true],
];
export const LIGHTS: Array<[number, number, number, number, number, boolean]> = [
  [-0.06, -0.43, 0.2, 0.11, 0.75, false],
  [-0.01, 0.06, 0.016, 0.11, 0.8, false],
  [-0.012, 0.236, 0.026, 0.02, 0.85, false],
  [0.27, 0.07, 0.075, 0.04, 0.5, true],
  [0, 0.56, 0.055, 0.03, 0.6, false],
  [-0.03, 0.4, 0.03, 0.008, 0.55, false],
];

/* ---------- músculos ---------- */
export type MuscleKey = string;
type MStrip = { key: MuscleKey; kind: "strip"; def: Strip; mirror: boolean; tendon?: [boolean, boolean] };
type MRing = { key: MuscleKey; kind: "ring"; def: Ring; mirror: boolean };
export type MuscleDef = MStrip | MRing;

const S = (e1: P3[], e2: P3[], n: number, extra: Partial<Strip> = {}): Strip => ({ e1, e2, n, ...extra });
export const MUSCLES: MuscleDef[] = [
  /* de baixo para cima na pilha: temporal, masseter, levantadores, nasal, orbicular da boca, zigomáticos, risório,
     depressores, mentual — ficam discretos (contexto) até serem citados */
  { key: "temporal", kind: "strip", mirror: true, tendon: [false, true], def: S([[0.43, -0.02], [0.415, -0.2], [0.395, -0.38]], [[0.452, -0.02], [0.458, -0.2], [0.43, -0.42]], 5) },
  { key: "masseter", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.345, 0.07], [0.335, 0.26], [0.315, 0.47]], [[0.445, 0.04], [0.432, 0.25], [0.392, 0.43]], 10) },
  { key: "levantadorLabio", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.12, 0.07], [0.125, 0.2], [0.135, 0.335]], [[0.235, 0.08], [0.2, 0.2], [0.165, 0.34]], 8) },
  { key: "levantadorAsa", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.045, -0.03], [0.06, 0.1], [0.085, 0.22], [0.1, 0.33]], [[0.068, -0.03], [0.088, 0.1], [0.118, 0.22], [0.135, 0.33]], 4) },
  { key: "nasal", kind: "strip", mirror: true, tendon: [false, false], def: S([[0.0, 0.07], [0.05, 0.11], [0.088, 0.17]], [[0.0, 0.125], [0.045, 0.152], [0.074, 0.192]], 5) },
  { key: "orbicularBoca", kind: "ring", mirror: false, def: { c: [0, 0.382], ri: [0.14, 0.032], ro: [0.24, 0.118], n: 10 } },
  { key: "zigomaticoMenor", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.268, 0.06], [0.22, 0.2], [0.172, 0.338]], [[0.308, 0.075], [0.25, 0.212], [0.19, 0.343]], 4) },
  { key: "zigomaticoMaior", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.345, 0.07], [0.28, 0.22], [0.2, 0.372]], [[0.405, 0.1], [0.322, 0.248], [0.222, 0.388]], 7) },
  { key: "risorio", kind: "strip", mirror: true, tendon: [false, false], def: S([[0.42, 0.33], [0.32, 0.356], [0.218, 0.386]], [[0.42, 0.37], [0.32, 0.38], [0.218, 0.394]], 4) },
  { key: "depressorAngulo", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.15, 0.575], [0.18, 0.48], [0.205, 0.398]], [[0.33, 0.53], [0.27, 0.46], [0.222, 0.402]], 8) },
  { key: "depressorLabio", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.04, 0.565], [0.04, 0.5], [0.036, 0.428]], [[0.15, 0.555], [0.14, 0.49], [0.12, 0.422]], 6) },
  { key: "mentual", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.0, 0.47], [0.0, 0.54], [0.0, 0.6]], [[0.045, 0.466], [0.05, 0.53], [0.056, 0.59]], 3) },
  /* os três do Botox (+ prócero) */
  { key: "orbicularOlho", kind: "ring", mirror: true, def: { c: [0.205, -0.056], ci: [0.197, -0.06], ri: [0.106, 0.042], ro: [0.198, 0.168], n: 11 } },
  { key: "frontal", kind: "strip", mirror: true, tendon: [false, true], def: S([[0.03, -0.165], [0.032, -0.26], [0.04, -0.38], [0.058, -0.5], [0.085, -0.585]], [[0.36, -0.185], [0.395, -0.28], [0.39, -0.39], [0.355, -0.49], [0.29, -0.575]], 17, { bulge: 0.04 }) },
  { key: "procero", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.0, -0.02], [0.0, -0.12], [0.0, -0.225]], [[0.032, -0.02], [0.04, -0.12], [0.052, -0.215]], 4) },
  { key: "corrugador", kind: "strip", mirror: true, tendon: [true, false], def: S([[0.03, -0.15], [0.08, -0.178], [0.13, -0.194], [0.185, -0.204], [0.25, -0.209]], [[0.03, -0.098], [0.08, -0.122], [0.13, -0.145], [0.185, -0.166], [0.248, -0.19]], 8) },
];

export type Built = { key: MuscleKey; ring: boolean; fibers: P3[][]; outline: P3[]; inner?: P3[]; caps: P3[][] };
const mirrorAll = (b: Built): Built => ({ ...b, fibers: b.fibers.map(mirror), outline: mirror(b.outline), inner: b.inner ? mirror(b.inner) : undefined, caps: b.caps.map(mirror) });
export const BUILT: Built[] = MUSCLES.flatMap((m) => {
  let b: Built;
  if (m.kind === "strip") {
    const s = stripFibers(m.def);
    const a = resample(m.def.e1, 18);
    const c = resample(m.def.e2, 18);
    const caps: P3[][] = [];
    const k = 3;
    if (m.tendon?.[0]) caps.push([...a.slice(0, k), ...c.slice(0, k).reverse()]);
    if (m.tendon?.[1] && !m.def.bulge) caps.push([...a.slice(18 - k), ...c.slice(18 - k).reverse()]);
    b = { key: m.key, ring: false, fibers: s.fibers, outline: s.outline, caps };
  } else {
    const r = ringFibers(m.def);
    b = { key: m.key, ring: true, fibers: r.fibers, outline: r.outer, inner: r.inner, caps: [] };
  }
  return m.mirror ? [b, mirrorAll(b)] : [b];
});
/** aponeurose (gálea) acima do frontal: fios pálidos */
export const GALEA: P3[][] = (() => {
  const o: P3[][] = [];
  for (let i = 0; i < 9; i++) {
    const x = -0.26 + (0.52 * i) / 8;
    o.push([[x, -0.585 - 0.06 * (1 - Math.abs(x) / 0.3), 0], [x * 0.8, -0.69, 0], [x * 0.45, -0.77, 0]]);
  }
  return o;
})();

/* ---------- rugas ---------- */
const fhLine = (y0: number, a: number, b: number, k: number): P3[] => {
  const o: P3[] = [];
  for (let i = 0; i <= 18; i++) {
    const x = a + ((b - a) * i) / 18;
    o.push([x, y0 + 0.012 * Math.cos((Math.PI * x) / 0.34) + 0.0035 * Math.sin(13 * x + k * 1.7), 0]);
  }
  return o;
};
export const WR_FOREHEAD: P3[][] = [fhLine(-0.41, -0.27, -0.03, 0), fhLine(-0.405, 0.025, 0.27, 1), fhLine(-0.345, -0.31, 0.3, 2), fhLine(-0.283, -0.26, 0.26, 3)];
export const WR_11: P3[][] = [
  [[0.038, -0.215, 0], [0.034, -0.17, 0], [0.026, -0.118, 0]],
  [[-0.038, -0.215, 0], [-0.034, -0.17, 0], [-0.026, -0.118, 0]],
];
const crow = (): P3[][] => {
  const o: P3[][] = [];
  const ang = [-36, -14, 8, 29];
  const len = [0.068, 0.088, 0.084, 0.064];
  ang.forEach((a, k) => {
    const r = (a * Math.PI) / 180;
    const pts: P3[] = [];
    for (let i = 0; i <= 6; i++) {
      const rr = 0.018 + (len[k] * i) / 6;
      pts.push([0.31 + rr * Math.cos(r), -0.06 + rr * Math.sin(r) + 0.0004 * i * i, 0]);
    }
    o.push(pts);
  });
  return o;
};
export const WR_CROW_R = crow();
export const WR_CROW_L = WR_CROW_R.map(mirror);

/* rugas novas (generalização): sulco nasogeniano, linhas acima do lábio ("código de barras") e marionete */
export const WR_SULCO_R: P3[][] = [[[0.118, 0.215, 0], [0.14, 0.262, 0], [0.163, 0.31, 0], [0.183, 0.35, 0], [0.198, 0.378, 0]]];
export const WR_SULCO_L = WR_SULCO_R.map(mirror);
export const WR_LABIAL: P3[][] = [-0.11, -0.075, -0.04, 0.04, 0.075, 0.11].map((x, i): P3[] => [
  [x + 0.004 * (i % 2 ? 1 : -1), 0.302 + 0.006 * (i % 3), 0],
  [x, 0.322, 0],
  [x - 0.003 * (i % 2 ? 1 : -1), 0.342, 0],
]);
export const WR_MARIONETE_R: P3[][] = [[[0.176, 0.39, 0], [0.184, 0.42, 0], [0.192, 0.45, 0], [0.2, 0.48, 0]]];
export const WR_MARIONETE_L = WR_MARIONETE_R.map(mirror);
