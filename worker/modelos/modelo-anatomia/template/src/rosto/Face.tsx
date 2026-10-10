import React from "react";
import { type Cam, type P3, type Pt, ellipse, outline, proj, smoothPath, taper } from "./geom";
import {
  ALA, BROW_HAIRS, BROW_L, BROW_U, BUILT, CHIN, CREASE, EYE_C, GALEA, LASHES, LID_L, LID_U, LIGHTS, LIP_BOT, LIP_LINE, LIP_TOP,
  NASOLAB, NOSE_BRIDGE, NOSTRIL, PHILTRUM, SHADOWS, TEAR, TIP, WR_11, WR_CROW_L, WR_CROW_R, WR_FOREHEAD, WR_LABIAL, WR_MARIONETE_L,
  WR_MARIONETE_R, WR_SULCO_L, WR_SULCO_R, type Built, type MuscleKey,
} from "./desenho";
import type { Rugas } from "./catalogo";
import { K, MUS, mix } from "../tema";

/* Anatomia — rosto em ilustração médica 2.5D (SVG em espaço de tela, recalculado por quadro).
   Camadas: pele com volume (gradiente + sombras desfocadas) → músculos anatômicos (fibras, tendões, volume) revelados
   por uma linha de varredura → véu de pele translúcida → traços do rosto → rugas (vinco + luz). */
export type Trio = { fr: number; co: number; or: number };
export type FaceState = {
  cam: Cam;
  // traço se desenhando (0→1), traço azul-fantasma da entrada, opacidade geral
  draw: number;
  ghost: number;
  alpha: number;
  // varredura que revela os músculos (0→1) e a camada de músculos (0→1)
  wipe: number;
  muscles: number;
  // quanto cada músculo (chave do desenho) está aceso
  act: Record<string, number>;
  // os músculos de contexto apagam enquanto uma estrutura está em foco
  dim: number;
  // deformação: frontal levanta, corrugador franze, orbicular aperta
  pull: Trio;
  // rugas por conjunto: [desenho 0→1, intensidade 0→1]
  wr: Partial<Record<Rugas, [number, number]>>;
  // traços da pele em azul (olheira, lábios, nariz)
  tracos: Partial<Record<"olheira" | "labios" | "nariz", number>>;
  flow: number;
  id: string;
};

const sm = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** deformação muscular: frontal levanta a sobrancelha, corrugador puxa para o meio e para baixo, orbicular aperta */
const deform = (x: number, y: number, pl: Trio): [number, number] => {
  let X = x;
  let Y = y;
  if (pl.fr > 0) {
    const m = (y < -0.17 ? sm(-0.62, -0.17, y) : 1 - sm(-0.17, 0.0, y)) * (1 - sm(0.36, 0.5, Math.abs(x)));
    Y -= 0.02 * pl.fr * m;
  }
  if (pl.co > 0) {
    const m = Math.exp(-(((Math.abs(x) - 0.1) / 0.09) ** 2 + ((y + 0.16) / 0.065) ** 2));
    X -= Math.sign(x) * 0.022 * pl.co * m;
    Y += 0.012 * pl.co * m;
  }
  if (pl.or > 0) {
    const ex = Math.sign(x || 1) * EYE_C[0];
    const ey = EYE_C[1];
    const m = Math.exp(-1.6 * (((x - ex) / 0.21) ** 2 + ((y - ey) / 0.17) ** 2));
    X -= (x - ex) * 0.05 * pl.or * m;
    Y -= (y - ey) * 0.2 * pl.or * m;
  }
  return [X, Y];
};

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const Face: React.FC<{ s: FaceState }> = ({ s }) => {
  const c = s.cam;
  const id = s.id;
  const P = (pts: P3[], dz = 0.006): Pt[] =>
    pts.map(([x, y, z]) => {
      const [X, Y] = deform(x, y, s.pull);
      return proj(X, Y, (z ?? 0) + dz, c);
    });
  const A = (pts: Pt[]) => pts.map((p) => ({ ...p, v: true }));
  const mir = (pts: P3[]): P3[] => pts.map(([x, y, z]) => [-x, y, z]);
  const both = (pts: P3[]) => [pts, mir(pts)];
  const pt = (x: number, y: number, dz = 0.01) => {
    const [X, Y] = deform(x, y, s.pull);
    return proj(X, Y, dz, c);
  };

  const ol = outline(c);
  const head = smoothPath(ol.poly, true);
  const crownY = Math.min(...ol.poly.map((p) => p.y));
  const chinY = Math.max(...ol.poly.map((p) => p.y));
  const ink = mix(K.ink, K.acc, s.ghost);
  const sw = Math.max(1.5, Math.min(2.8, c.S / 200));
  const dash = (d: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - d });
  const blurPx = Math.max(4, c.S * 0.03);
  const reveal = s.muscles;
  const ell = (cx: number, cy: number, rx: number, ry: number, n = 28) => smoothPath(A(P(ellipse(cx, cy, rx, ry, n), 0.004)), true);

  /* ---------- orelhas ---------- */
  const ear = (side: 1 | -1) => {
    const k = Math.max(0, Math.min(1.6, 1 - side * 2.3 * Math.sin(c.yaw)));
    if (k < 0.08) return { outer: "", inner: "" };
    const arr = side > 0 ? ol.R : ol.L;
    const atY = (yy: number) => {
      const sy0 = c.oy + yy * Math.cos(c.pitch) * c.S;
      let best = arr[0];
      for (const p of arr) if (Math.abs(p.y - sy0) < Math.abs(best.y - sy0)) best = p;
      return best.x;
    };
    const outer: Pt[] = [];
    const inner: Pt[] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const yy = -0.1 + 0.33 * t;
      const lobe = t < 0.75 ? 1 : 1 - (t - 0.75) * 2.6;
      const pr = 0.078 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.62) * lobe * k;
      const sy1 = c.oy + yy * Math.cos(c.pitch) * c.S;
      outer.push({ x: atY(yy) + side * (pr * c.S - 2), y: sy1, v: true });
      if (t > 0.1 && t < 0.7) inner.push({ x: atY(yy) + side * (pr * 0.55 * c.S), y: sy1 + 2, v: true });
    }
    return { outer: smoothPath(outer), inner: k > 0.45 ? smoothPath(inner) : "" };
  };
  const neck = (side: 1 | -1) => {
    const pts: Pt[] = [];
    const arr = side > 0 ? ol.R : ol.L;
    for (let i = 0; i <= 12; i++) {
      const yy = 0.42 + (0.62 * i) / 12;
      const X = side * (0.235 + 0.03 * sm(0.75, 1.05, yy)) * Math.cos(c.yaw) - 0.06 * Math.sin(c.yaw);
      const sx = c.ox + X * c.S;
      const sy0 = c.oy + yy * c.S;
      let ox = side > 0 ? -1e9 : 1e9;
      for (const p of arr) if (Math.abs(p.y - sy0) < c.S * 0.012) ox = p.x;
      const outside = yy > 0.625 || (side > 0 ? sx >= ox - 1 : sx <= ox + 1);
      pts.push({ x: sx, y: sy0, v: outside });
    }
    return smoothPath(pts);
  };

  /* ---------- olhos ---------- */
  const eye = (side: 1 | -1, key: string) => {
    const f = (pts: P3[]) => (side > 0 ? pts : mir(pts));
    const up = P(f(LID_U), -0.006);
    const lo = P(f(LID_L), -0.006);
    if (!up.every((p) => p.v)) return null;
    const open = smoothPath(A([...up, ...lo.slice().reverse()]), true);
    const ex = side * EYE_C[0];
    const ic = pt(ex, EYE_C[1] - 0.004, -0.004);
    const ir = 0.036 * c.S;
    const lid = taper(up, sw * 1.5, 1);
    return (
      <g key={key}>
        <defs>
          <clipPath id={`${id}-eye${key}`}>
            <path d={open} />
          </clipPath>
          <radialGradient id={`${id}-iris${key}`} cx={ic.x} cy={ic.y} r={ir} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8A9BB0" />
            <stop offset="0.55" stopColor="#5D6F86" />
            <stop offset="1" stopColor="#2E3B4C" />
          </radialGradient>
        </defs>
        <path d={open} fill="#FFFFFF" />
        <g clipPath={`url(#${id}-eye${key})`}>
          <path d={open} fill="none" stroke="#9AA8B8" strokeWidth={ir * 0.5} opacity={0.35} />
          <circle cx={ic.x} cy={ic.y} r={ir} fill={`url(#${id}-iris${key})`} />
          <circle cx={ic.x} cy={ic.y} r={ir * 0.4} fill="#141C26" />
          <circle cx={ic.x - ir * 0.32} cy={ic.y - ir * 0.34} r={ir * 0.17} fill="#FFFFFF" opacity={0.9} />
          <path d={smoothPath(up)} fill="none" stroke="#5A6878" strokeWidth={ir * 0.35} opacity={0.25} />
        </g>
        <path d={lid} fill={ink} {...dash(s.draw)} />
        <path d={smoothPath(up)} fill="none" stroke={ink} strokeWidth={sw * 1.1} strokeLinecap="round" {...dash(s.draw)} />
        <path d={LASHES.map((l) => smoothPath(P(f(l), -0.004))).join("")} fill="none" stroke={ink} strokeWidth={sw * 0.7} strokeLinecap="round" opacity={0.8 * s.draw} />
        <path d={smoothPath(lo)} fill="none" stroke={ink} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.6} {...dash(s.draw)} />
        <path d={smoothPath(P(f(CREASE), -0.004))} fill="none" stroke={ink} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.5} {...dash(s.draw)} />
        <path d={smoothPath(P(f(TEAR), 0))} fill="none" stroke={ink} strokeWidth={sw * 0.5} strokeLinecap="round" opacity={0.18} />
        <circle cx={pt(side * 0.107, -0.048).x} cy={pt(side * 0.107, -0.048).y} r={0.008 * c.S} fill="#C99B98" opacity={0.7 * s.draw} />
      </g>
    );
  };
  const brow = (side: 1 | -1) => {
    const f = (pts: P3[]) => (side > 0 ? pts : mir(pts));
    const u = P(f(BROW_U), 0.012);
    const l = P(f(BROW_L), 0.012);
    if (!u.every((p) => p.v)) return null;
    const shape = smoothPath(A([...u, ...l.slice().reverse()]), true);
    const hairs = BROW_HAIRS.map((h) => smoothPath(P(f(h), 0.012))).join("");
    return (
      <g opacity={Math.min(1, s.draw * 1.4)}>
        <path d={shape} fill={ink} opacity={0.32} />
        <path d={hairs} fill="none" stroke={ink} strokeWidth={Math.max(1, sw * 0.55)} strokeLinecap="round" opacity={0.75} />
      </g>
    );
  };

  /* ---------- músculos ---------- */
  const actOf = (k: MuscleKey) => s.act[k] ?? 0;
  const ctxLevel = 0.9 - 0.74 * s.dim;
  const muscle = (m: Built, i: number, onTop: boolean) => {
    const a = actOf(m.key);
    const base = m.key === "procero" ? Math.max(ctxLevel, 0.55 * actOf("corrugador")) : ctxLevel;
    const op = onTop ? a : Math.max(base, 0);
    if (op <= 0.01) return null;
    const fibers = m.fibers.map((f) => P(f, 0.004));
    const n = fibers.length;
    const q = m.ring ? 0 : Math.floor(fibers[0].length / 2);
    const spacing = n > 1 ? dist(fibers[0][q], fibers[1][q]) : 6;
    const fw = Math.max(0.7, Math.min(10, spacing * 0.72));
    const shape = smoothPath(A(P(m.outline, 0.004)), true) + (m.inner ? smoothPath(A(P(m.inner, 0.004)), true) : "");
    const caps = m.caps.map((cp) => smoothPath(A(P(cp, 0.004)), true)).join("");
    return (
      <g key={`${i}${onTop ? "t" : ""}`} opacity={op}>
        <path d={shape} fillRule="evenodd" fill={MUS.base} />
        {fibers.map((f, k) => {
          const fk = n === 1 ? 0.5 : k / (n - 1);
          const l = 1 - Math.pow(Math.abs(2 * fk - 1), 1.5);
          return <path key={k} d={smoothPath(f, m.ring)} fill="none" stroke={mix(MUS.dark, MUS.light, 0.15 + 0.85 * l)} strokeWidth={fw} strokeLinecap="round" />;
        })}
        {caps ? <path d={caps} fill={MUS.tendon} opacity={0.92} /> : null}
        <path d={shape} fillRule="evenodd" fill="none" stroke={MUS.edge} strokeWidth={1.1} strokeOpacity={0.75} />
        {onTop && a > 0.01 ? (
          <>
            <path d={shape} fillRule="evenodd" fill="none" stroke={K.acc} strokeWidth={9} strokeOpacity={0.14} />
            <path d={shape} fillRule="evenodd" fill="none" stroke={K.acc} strokeWidth={2.6} />
            {fibers.map((f, j) => (
              <path key={`w${j}`} d={smoothPath(f, m.ring)} fill="none" stroke="#FFFFFF" strokeWidth={Math.min(2.2, fw * 0.5)} strokeLinecap="round" pathLength={1} strokeDasharray="0.1 0.9" strokeDashoffset={-((s.flow * 0.7 + j * 0.137) % 1)} opacity={0.6} />
            ))}
          </>
        ) : null}
      </g>
    );
  };
  const muscleLayer = () => {
    if (reveal <= 0.001) return null;
    const galea = GALEA.map((g) => smoothPath(P(g, 0.004))).join("");
    return (
      <g opacity={reveal}>
        <path d={galea} fill="none" stroke="#D9C5BE" strokeWidth={Math.max(1, c.S * 0.006)} opacity={ctxLevel * 0.8} strokeLinecap="round" />
        {BUILT.map((m, i) => muscle(m, i, false))}
      </g>
    );
  };

  /* ---------- rugas: vinco escuro + luz embaixo ---------- */
  const hw = 1.1 + c.S / 420;
  const wrinkles = (list: P3[][], w?: [number, number]) => {
    if (!w || w[0] <= 0 || w[1] <= 0) return null;
    return list.map((l, i) => {
      const d = Math.max(0, Math.min(1, w[0] * 1.25 - i * 0.08));
      const pp = P(l, 0.01);
      const lo = pp.map((p) => ({ ...p, y: p.y + hw * 1.3 }));
      return (
        <g key={i}>
          <path d={taper(pp, hw * 2.6 * (0.5 + 0.5 * w[1]), d)} fill={K.ink} opacity={0.12 * w[1]} filter={`url(#${id}-soft)`} />
          <path d={taper(lo, hw * 0.55, d)} fill="#FFFFFF" opacity={0.9 * w[1]} />
          <path d={taper(pp, hw * (0.55 + 0.45 * w[1]), d)} fill={K.ink} opacity={0.4 + 0.55 * w[1]} />
        </g>
      );
    });
  };

  const wipeY = crownY - 30 + (chinY - crownY + 160) * s.wipe;
  const lc = pt(-0.12, -0.3, 0.05);
  const shade = (list: Array<[number, number, number, number, number, boolean]>, color: string) =>
    list.flatMap(([x, y, rx, ry, o, m], i) =>
      (m ? [1, -1] : [1]).map((sg) => <path key={`${color}${i}${sg}`} d={ell(sg * x, y, rx, ry)} fill={color} opacity={o} />),
    );
  const featA = 1 - 0.12 * reveal;
  const veil = 0.1 + 0.5 * s.dim;

  return (
    <g opacity={s.alpha}>
      <defs>
        <clipPath id={`${id}-head`}>
          <path d={head} />
        </clipPath>
        <clipPath id={`${id}-wipe`}>
          <rect x={-3000} y={-3000} width={9000} height={wipeY + 3000} />
        </clipPath>
        <radialGradient id={`${id}-skin`} cx={lc.x} cy={lc.y} r={c.S * 0.98} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#F5F8FB" />
          <stop offset="0.8" stopColor="#E6ECF2" />
          <stop offset="1" stopColor="#D2DCE6" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={blurPx} />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={Math.max(1.5, blurPx * 0.25)} />
        </filter>
        <linearGradient id={`${id}-lipU`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#C99A96" />
          <stop offset="1" stopColor="#B4807C" />
        </linearGradient>
        <linearGradient id={`${id}-lipL`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#D2A6A2" />
          <stop offset="1" stopColor="#E3C3BF" />
        </linearGradient>
      </defs>
      {/* pescoço */}
      <path d={neck(1) + neck(-1)} fill="none" stroke={ink} strokeWidth={sw} strokeLinecap="round" {...dash(s.draw)} />
      {/* pele com volume */}
      <path d={head} fill={`url(#${id}-skin)`} opacity={Math.min(1, s.draw * 1.4) * (1 - 0.7 * s.ghost)} />
      <g clipPath={`url(#${id}-head)`} opacity={Math.min(1, s.draw * 1.2) * (1 - s.ghost)}>
        <g filter={`url(#${id}-blur)`}>
          {shade(SHADOWS, "#6F8299")}
          {shade(LIGHTS, "#FFFFFF")}
        </g>
      </g>
      {/* músculos, revelados de cima para baixo */}
      <g clipPath={`url(#${id}-head)`}>
        <g clipPath={`url(#${id}-wipe)`}>
          {muscleLayer()}
          <path d={head} fill="#FFFFFF" opacity={veil * reveal} />
        </g>
        {s.wipe > 0 && s.wipe < 1 ? (
          <g>
            <rect x={-3000} y={wipeY - 30} width={9000} height={30} fill={`url(#${id}-scan)`} />
            <line x1={-3000} x2={6000} y1={wipeY} y2={wipeY} stroke={K.acc} strokeWidth={2.5} />
            <defs>
              <linearGradient id={`${id}-scan`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={K.acc} stopOpacity={0} />
                <stop offset="1" stopColor={K.acc} stopOpacity={0.22} />
              </linearGradient>
            </defs>
          </g>
        ) : null}
      </g>
      {/* traços da pele */}
      <g opacity={featA}>
        <path d={head} fill="none" stroke={ink} strokeWidth={sw * 1.2} strokeLinejoin="round" {...dash(s.draw)} />
        {[1, -1].map((sd) => {
          const e = ear(sd as 1 | -1);
          return (
            <g key={`e${sd}`}>
              <path d={e.outer} fill="#F1F4F8" stroke={ink} strokeWidth={sw} strokeLinecap="round" {...dash(s.draw)} />
              <path d={e.inner} fill="none" stroke={ink} strokeWidth={sw * 0.7} strokeLinecap="round" opacity={0.6} {...dash(s.draw)} />
            </g>
          );
        })}
        {both(NOSE_BRIDGE).map((a, i) => (
          <path key={`b${i}`} d={smoothPath(P(a))} fill="none" stroke={ink} strokeWidth={sw * 0.6} strokeLinecap="round" opacity={0.28} {...dash(s.draw)} />
        ))}
        {both(ALA).map((a, i) => (
          <path key={`a${i}`} d={smoothPath(P(a))} fill="none" stroke={ink} strokeWidth={sw * 1.05} strokeLinecap="round" {...dash(s.draw)} />
        ))}
        <path d={smoothPath(P(TIP))} fill="none" stroke={ink} strokeWidth={sw * 0.75} strokeLinecap="round" opacity={0.55} {...dash(s.draw)} />
        {both(NOSTRIL).map((a, i) => (
          <path key={`n${i}`} d={smoothPath(A(P(a)), true)} fill={ink} opacity={0.82 * Math.min(1, s.draw * 1.4)} />
        ))}
        {both(PHILTRUM).map((a, i) => (
          <path key={`p${i}`} d={smoothPath(P(a))} fill="none" stroke={ink} strokeWidth={sw * 0.5} strokeLinecap="round" opacity={0.22} />
        ))}
        {/* lábios */}
        <g opacity={Math.min(1, s.draw * 1.4) * (1 - s.ghost)}>
          <path d={smoothPath(A([...P(LIP_TOP), ...P(LIP_LINE).slice().reverse()]), true)} fill={`url(#${id}-lipU)`} opacity={0.9} />
          <path d={smoothPath(A([...P(LIP_LINE), ...P(LIP_BOT)]), true)} fill={`url(#${id}-lipL)`} opacity={0.9} />
        </g>
        <path d={smoothPath(P(LIP_LINE))} fill="none" stroke={ink} strokeWidth={sw * 1.05} strokeLinecap="round" {...dash(s.draw)} />
        <path d={smoothPath(P(LIP_TOP))} fill="none" stroke={ink} strokeWidth={sw * 0.55} strokeLinecap="round" opacity={0.45} {...dash(s.draw)} />
        <path d={smoothPath(P(LIP_BOT))} fill="none" stroke={ink} strokeWidth={sw * 0.45} strokeLinecap="round" opacity={0.3} {...dash(s.draw)} />
        <path d={smoothPath(P(CHIN))} fill="none" stroke={ink} strokeWidth={sw * 0.55} strokeLinecap="round" opacity={0.35} {...dash(s.draw)} />
        {both(NASOLAB).map((a, i) => (
          <path key={`f${i}`} d={smoothPath(P(a))} fill="none" stroke={ink} strokeWidth={sw * 0.55} strokeLinecap="round" opacity={0.3} {...dash(s.draw)} />
        ))}
      </g>
      {/* músculo em destaque: por cima do véu e dos traços */}
      {reveal > 0.001 ? (
        <g clipPath={`url(#${id}-head)`}>
          <g clipPath={`url(#${id}-wipe)`} opacity={reveal}>
            {BUILT.map((m, i) => (actOf(m.key) > 0.01 ? muscle(m, i, true) : null))}
          </g>
        </g>
      ) : null}
      <g opacity={featA}>
        {eye(1, "r")}
        {eye(-1, "l")}
        <g opacity={1 - 0.6 * actOf("corrugador")}>
          {brow(1)}
          {brow(-1)}
        </g>
      </g>
      {/* rugas */}
      <g clipPath={`url(#${id}-head)`}>
        {wrinkles(WR_FOREHEAD, s.wr.testa)}
        {wrinkles(WR_11, s.wr.glabela)}
        {wrinkles(WR_CROW_R, s.wr.pes)}
        {wrinkles(WR_CROW_L, s.wr.pes)}
        {wrinkles(WR_SULCO_R, s.wr.sulco)}
        {wrinkles(WR_SULCO_L, s.wr.sulco)}
        {wrinkles(WR_LABIAL, s.wr.labial)}
        {wrinkles(WR_MARIONETE_R, s.wr.marionete)}
        {wrinkles(WR_MARIONETE_L, s.wr.marionete)}
      </g>
      {/* traços da pele citados (olheira, lábios, nariz): contorno azul que se desenha */}
      {(s.tracos.olheira ?? 0) > 0.01 ? (
        <path d={both(TEAR).map((a) => smoothPath(P(a, 0))).join("")} fill="none" stroke={K.acc} strokeWidth={sw * 1.6} strokeLinecap="round" opacity={s.tracos.olheira} />
      ) : null}
      {(s.tracos.labios ?? 0) > 0.01 ? (
        <path d={smoothPath(A([...P(LIP_TOP), ...P(LIP_BOT)]), true)} fill="none" stroke={K.acc} strokeWidth={sw * 1.4} strokeLinejoin="round" opacity={s.tracos.labios} />
      ) : null}
      {(s.tracos.nariz ?? 0) > 0.01 ? (
        <path d={both(ALA).map((a) => smoothPath(P(a))).join("") + smoothPath(P(TIP))} fill="none" stroke={K.acc} strokeWidth={sw * 1.4} strokeLinecap="round" opacity={s.tracos.nariz} />
      ) : null}
    </g>
  );
};

/** ponto da cabeça → tela, com a deformação atual (para âncoras de rótulos) */
export const facePoint = (s: FaceState, x: number, y: number, dz = 0.01) => {
  const [X, Y] = deform(x, y, s.pull);
  return proj(X, Y, dz, s.cam);
};
