/* Anatomia — geometria do rosto (e do esquema) em line-art 2.5D (unidades de cabeça: x direita, y para baixo, z para o espectador).
   A superfície frontal é uma superelipse por fatia horizontal; cada traço (pele, músculo, ruga) é uma polilinha
   (x, y, dz) projetada com yaw/pitch → por isso o rosto gira de 3/4 para frente de verdade. */

export type Pt = { x: number; y: number; v: boolean };
export type Cam = { yaw: number; pitch: number; S: number; ox: number; oy: number };
export type P3 = [number, number, number?];

const WK: Array<[number, number]> = [
  [-0.8, 0], [-0.797, 0.06], [-0.789, 0.112], [-0.775, 0.16], [-0.755, 0.205], [-0.725, 0.25], [-0.685, 0.295], [-0.62, 0.343],
  [-0.53, 0.386], [-0.42, 0.418], [-0.32, 0.432], [-0.22, 0.436], [-0.12, 0.444], [-0.03, 0.456], [0.05, 0.458], [0.14, 0.447],
  [0.23, 0.43], [0.31, 0.414], [0.37, 0.4], [0.42, 0.378], [0.465, 0.338], [0.505, 0.284], [0.54, 0.226], [0.572, 0.168],
  [0.597, 0.112], [0.615, 0.065], [0.626, 0.028], [0.63, 0],
];
export const Wf = (y: number) => {
  if (y <= WK[0][0] || y >= WK[WK.length - 1][0]) return 0;
  for (let i = 1; i < WK.length; i++)
    if (y <= WK[i][0]) {
      const [y0, w0] = WK[i - 1];
      const [y1, w1] = WK[i];
      return w0 + (w1 - w0) * ((y - y0) / (y1 - y0));
    }
  return 0;
};
const PE = 2.35;
const se = (u: number) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), PE)), 1 / PE);
const DK = 0.9;

/** projeta um ponto da superfície (x, y) + relevo dz */
export type Perfil = (y: number) => number;
export const proj = (x: number, y: number, dz: number, c: Cam, wf: Perfil = Wf): Pt => {
  const w = Math.max(1e-4, wf(y));
  const d = w * DK;
  const u = Math.max(-0.999, Math.min(0.999, x / w));
  const z = d * se(u) + dz;
  const au = Math.abs(u);
  const dzdx = -(d / w) * Math.sign(u) * Math.pow(au, PE - 1) * Math.pow(Math.max(1e-6, 1 - Math.pow(au, PE)), (1 - PE) / PE);
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const X = x * cy + z * sy;
  const Z = -x * sy + z * cy;
  const cp = Math.cos(c.pitch);
  const sp = Math.sin(c.pitch);
  const Y = y * cp - Z * sp;
  const nZ = (dzdx * sy + cy) / Math.hypot(dzdx, 1);
  return { x: c.ox + X * c.S, y: c.oy + Y * c.S, v: nZ > -0.03 };
};
/** posição de tela (S=1, origem 0) de um ponto — usada para mirar a câmera num ponto do rosto */
export const projUnit = (x: number, y: number, dz: number, yaw: number, pitch: number, wf: Perfil = Wf) => proj(x, y, dz, { yaw, pitch, S: 1, ox: 0, oy: 0 }, wf);

/** contorno da cabeça (silhueta) para o yaw atual: lado direito de cima para baixo + lado esquerdo de baixo para cima */
export const outline = (c: Cam, wf: Perfil = Wf, y0 = -0.8, y1 = 0.63) => {
  const R: Pt[] = [];
  const L: Pt[] = [];
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  for (let i = 0; i <= 64; i++) {
    const y = y0 + ((y1 - y0) * i) / 64;
    const w = wf(y);
    const d = w * DK;
    const db = w * (y < 0.15 ? 1.15 : y > 0.45 ? 0.7 : 1.15 - ((y - 0.15) / 0.3) * 0.45);
    let mn = 1e9;
    let mx = -1e9;
    for (let k = 0; k <= 40; k++) {
      const a = -Math.PI / 2 + (Math.PI * k) / 40;
      const xf = w * Math.sin(a);
      const zf = d * se(Math.sin(a));
      const xb = w * Math.sin(a);
      const zb = -db * Math.cos(a);
      for (const [x, z] of [[xf, zf], [xb, zb]]) {
        const X = x * cy + z * sy;
        if (X < mn) mn = X;
        if (X > mx) mx = X;
      }
    }
    R.push({ x: c.ox + mx * c.S, y: c.oy + y * Math.cos(c.pitch) * c.S, v: true });
    L.push({ x: c.ox + mn * c.S, y: c.oy + y * Math.cos(c.pitch) * c.S, v: true });
  }
  return { R, L, poly: [...R, ...L.slice().reverse()] };
};

/* ---------- traçados ---------- */
export const mirror = (pts: P3[]): P3[] => pts.map(([x, y, z]) => [-x, y, z]);
export const projPts = (pts: P3[], c: Cam, dz0 = 0.004, wf: Perfil = Wf) => pts.map(([x, y, z]) => proj(x, y, (z ?? 0) + dz0, c, wf));

/** reamostra uma polilinha 2D (cabeça) para n pontos por comprimento */
export const resample = (pts: P3[], n: number): P3[] => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1] || 1;
  const out: P3[] = [];
  for (let k = 0; k < n; k++) {
    const s = (tot * k) / (n - 1);
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const f = (s - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    const a = pts[i - 1];
    const b = pts[i];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * f]);
  }
  return out;
};

/** músculo em faixa: fibras interpoladas entre duas bordas (mesmo sentido) */
export type Strip = { e1: P3[]; e2: P3[]; n: number; bulge?: number };
export const stripFibers = (m: Strip, samples = 18) => {
  const a = resample(m.e1, samples);
  const b = resample(m.e2, samples);
  const fibers: P3[][] = [];
  const bul = m.bulge ?? 0;
  const at = (f: number) =>
    a.map((p, i): P3 => {
      const s = i / (samples - 1);
      return [p[0] + (b[i][0] - p[0]) * f, p[1] + (b[i][1] - p[1]) * f - bul * Math.sin(Math.PI * f) * s * s * s, 0];
    });
  for (let k = 0; k < m.n; k++) fibers.push(at(m.n === 1 ? 0.5 : k / (m.n - 1)));
  if (!bul) return { fibers, outline: [...a, ...b.slice().reverse()] };
  const top: P3[] = [];
  for (let k = 1; k < 12; k++) top.push(at(k / 12)[samples - 1]);
  return { fibers, outline: [...a, ...top, ...b.slice().reverse()] };
};
/** músculo em anel (orbicular): elipses concêntricas entre interna e externa */
export type Ring = { c: [number, number]; ci?: [number, number]; ri: [number, number]; ro: [number, number]; n: number };
export const ellipse = (cx: number, cy: number, rx: number, ry: number, n = 48): P3[] => {
  const o: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a), 0]);
  }
  return o;
};
export const ringFibers = (r: Ring) => {
  const fibers: P3[][] = [];
  const ci = r.ci ?? r.c;
  for (let k = 0; k < r.n; k++) {
    const f = k / (r.n - 1);
    fibers.push(ellipse(r.c[0] + (ci[0] - r.c[0]) * (1 - f), r.c[1] + (ci[1] - r.c[1]) * (1 - f), r.ri[0] + (r.ro[0] - r.ri[0]) * f, r.ri[1] + (r.ro[1] - r.ri[1]) * f));
  }
  return { fibers, outer: ellipse(r.c[0], r.c[1], r.ro[0], r.ro[1]), inner: ellipse(ci[0], ci[1], r.ri[0], r.ri[1]) };
};

/* ---------- caminhos SVG ---------- */
/** Catmull-Rom → Bézier, quebrando onde o ponto não é visível */
export const smoothPath = (pts: Pt[], closed = false) => {
  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of pts) {
    if (p.v) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  let d = "";
  for (const r of runs) {
    if (r.length < 2) continue;
    d += `M${r[0].x.toFixed(1)},${r[0].y.toFixed(1)}`;
    for (let i = 0; i < r.length - 1; i++) {
      const p0 = r[Math.max(0, i - 1)];
      const p1 = r[i];
      const p2 = r[i + 1];
      const p3 = r[Math.min(r.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    if (closed && runs.length === 1) d += "Z";
  }
  return d;
};
export const polyPath = (pts: Array<{ x: number; y: number }>) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("") + "Z";
/** traço afilado (ruga): polígono com meia-largura máxima hw no meio, zero nas pontas */
export const taper = (pts: Pt[], hw: number, draw = 1) => {
  const vis = pts.filter((p) => p.v);
  if (vis.length < 2 || draw <= 0) return "";
  const n = Math.max(2, Math.round(vis.length * Math.min(1, draw)));
  const P = vis.slice(0, n);
  const A: Array<{ x: number; y: number }> = [];
  const B: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    const s = (i / (vis.length - 1)) * 1;
    const w = hw * Math.pow(Math.sin(Math.PI * Math.min(1, s)), 0.55);
    A.push({ x: P[i].x - (dy / l) * w, y: P[i].y + (dx / l) * w });
    B.push({ x: P[i].x + (dy / l) * w, y: P[i].y - (dx / l) * w });
  }
  return polyPath([...A, ...B.reverse()]);
};
