// Passos em ordem, no mapa: a pessoa é o avatar no canto; uma rota se desenha de parada em parada
// (cada parada é um pino numerado que acende quando o passo é dito, com o ponto correndo na ponta
// do traço) e, embaixo do mapa, a lista dos passos acompanha (lista.tsx). O mapa encolhe para a
// lista caber: 2 a 5 passos, com ou sem detalhe.
import { mistura, prog, trava } from "../anim";
import { MAPA } from "../layout";
import type { Palavra, Passos } from "../plano";
import { cor, mostrador, zonaCor } from "../tema";
import { Lista, medirLista } from "./Lista";

type P = [number, number];

// curva suave pelos pontos (Catmull-Rom) amostrada, com o comprimento acumulado
const amostrar = (pts: P[]) => {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = i === 0 ? 0 : 1; k <= 30; k++) {
      const s = k / 30;
      const s2 = s * s;
      const s3 = s2 * s;
      const f = (a: number, b: number, c: number, e: number) =>
        0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - e) * s2 + (-a + 3 * b - 3 * c + e) * s3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const acum = [0];
  for (let i = 1; i < out.length; i++) acum.push(acum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, acum, total: acum[acum.length - 1] };
};
type Amostra = ReturnType<typeof amostrar>;

const noComprimento = (c: Amostra, frac: number): P => {
  const alvo = c.total * Math.min(1, Math.max(0, frac));
  for (let i = 1; i < c.pts.length; i++) {
    if (c.acum[i] >= alvo) {
      const k = (alvo - c.acum[i - 1]) / Math.max(0.0001, c.acum[i] - c.acum[i - 1]);
      return [mistura(c.pts[i - 1][0], c.pts[i][0], k), mistura(c.pts[i - 1][1], c.pts[i][1], k)];
    }
  }
  return c.pts[c.pts.length - 1];
};
const ateFrac = (c: Amostra, frac: number) => {
  const alvo = c.total * Math.min(1, Math.max(0, frac));
  const out: P[] = [];
  for (let i = 0; i < c.pts.length; i++) {
    if (c.acum[i] <= alvo) out.push(c.pts[i]);
    else {
      out.push(noComprimento(c, frac));
      break;
    }
  }
  return out;
};
const dd = (ps: P[], ox: number, oy: number) => ps.map((p, i) => `${i ? "L" : "M"}${(p[0] + ox).toFixed(1)} ${(p[1] + oy).toFixed(1)}`).join("");

// a rota dos passos num mapa de altura h: sai de baixo, à esquerda (abaixo do avatar), vai pela rua
// e sobe pelo parque até o canto de cima, à direita
const rotaDe = (h: number): P[] => [
  [80, h - 74],
  [300, h - 74],
  [480, h - 120],
  [590, Math.max(300, h * 0.56)],
  [700, Math.max(190, h * 0.32)],
  [770, 96],
];

// a altura do mapa: a maior em que a lista ainda cabe com letra boa
export const alturaDoMapa = (m: Passos) => {
  for (const minimo of [58, 46]) {
    for (let h = 760; h >= 520; h -= 20) {
      const md = medirLista(m.itens.slice(0, 5), m.titulo, 840, MAPA.y + h + 34, 1520);
      if (md.tam >= minimo) return h;
    }
  }
  return 520;
};

export const Caminho: React.FC<{ m: Passos; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const z = zonaCor(m.zona);
  const itens = m.itens.slice(0, 5);
  const h = alturaDoMapa(m);
  const ox = MAPA.x;
  const oy = MAPA.y;
  const w = MAPA.w;
  const c = amostrar(rotaDe(h));
  const n = itens.length;
  const fracDe = (i: number) => (n <= 1 ? 1 : i / (n - 1));
  // a caneta: chega à parada i no `em` do passo i (a parada 1 acende no começo)
  let frac = 0;
  for (let i = 1; i < n; i++) frac = Math.max(frac, mistura(fracDe(i - 1), fracDe(i), prog(t, itens[i].em - 0.35, 0.7, trava)));
  const comecou = t >= itens[0].em - 0.05;
  const feito = comecou ? ateFrac(c, frac) : [];
  const ponta = feito[feito.length - 1];
  // decoração do mapa (determinística)
  const lotes: [number, number, number, number][] = [];
  const grade = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0, j = 0; y < y1; j++) {
      const hh = Math.min([84, 64, 96][j % 3], y1 - y);
      for (let x = x0, i = j; x < x1; i++) {
        const ww = Math.min([90, 70, 98][i % 3], x1 - x);
        if (ww > 24 && hh > 24) lotes.push([x, y, ww, hh]);
        x += ww + 16;
      }
      y += hh + 16;
    }
  };
  grade(24, 420, 380, h - 112);
  grade(24, h - 44, w, h + 60);
  grade(630, h * 0.62, w, h - 112);
  const parque = `M430 0 L840 0 L840 ${h * 0.58} C760 ${h * 0.64}, 640 ${h * 0.6}, 560 ${h * 0.66} C500 ${h * 0.7}, 450 ${h * 0.6}, 430 ${h * 0.5} Z`;
  const arvores: [number, number, number][] = [
    [470, 60, 13], [520, 40, 10], [800, 210, 12], [470, 250, 11], [500, 300, 9], [810, 300, 13], [640, 40, 10], [460, 170, 12], [560, 330, 10],
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="recortePassos">
            <rect x={ox} y={oy} width={w} height={h} rx={MAPA.raio} />
          </clipPath>
          <filter id="sombraPassos" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#101412" floodOpacity="0.12" />
          </filter>
        </defs>
        <rect x={ox} y={oy} width={w} height={h} rx={MAPA.raio} fill={cor.mapa} filter="url(#sombraPassos)" />
        <g clipPath="url(#recortePassos)">
          {lotes.map(([x, y, ww, hh], i) => (
            <rect key={i} x={ox + x} y={oy + y} width={ww} height={hh} rx={10} fill="#D8DDD3" />
          ))}
          <path d={parque} transform={`translate(${ox} ${oy})`} fill={cor.parque} />
          {arvores.map(([x, y, r], i) => (
            <circle key={i} cx={ox + x} cy={oy + y} r={r} fill="#C3D7BA" />
          ))}
          <ellipse cx={ox + 600} cy={oy + 150} rx={74} ry={52} fill={cor.agua} stroke="#B9CFDF" strokeWidth={3} />
          {[`M${ox - 20} ${oy + h - 74} L${ox + w + 20} ${oy + h - 74}`, `M${ox + 405} ${oy + h + 20} L${ox + 405} ${oy + h * 0.6}`].map((r, i) => (
            <g key={i}>
              <path d={r} stroke={cor.ruaBorda} strokeWidth={30} fill="none" />
              <path d={r} stroke={cor.rua} strokeWidth={24} fill="none" />
            </g>
          ))}
          {/* a lápis: a rota inteira, tracejada */}
          <path d={dd(c.pts, ox, oy)} stroke="#AEB6AC" strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" fill="none" />
          {feito.length > 1 ? (
            <>
              <path d={dd(feito, ox, oy)} stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d={dd(feito, ox, oy)} stroke={z.cor} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </>
          ) : null}
          {ponta && frac < 0.999 && frac > 0.001 ? <circle cx={ox + ponta[0]} cy={oy + ponta[1]} r={16} fill="#FFFFFF" stroke={z.cor} strokeWidth={7} /> : null}
        </g>
        {/* as paradas: pinos numerados */}
        {itens.map((it, i) => {
          const [px, py] = noComprimento(c, fracDe(i));
          const a = prog(t, it.em - 0.05, 0.3);
          const x = ox + px;
          const y = oy + py;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={30} fill="#FFFFFF" stroke={a > 0.5 ? z.cor : "#AEB6AC"} strokeWidth={a > 0.5 ? 6 : 4} strokeDasharray={a > 0.5 ? undefined : "6 7"} />
              <circle cx={x} cy={y} r={24 * a} fill={z.cor} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={mostrador} fontWeight={700} fontSize={30} fill={a > 0.5 ? "#FFFFFF" : cor.esbocoTexto}>
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <Lista itens={itens} titulo={m.titulo} t={t} de={m.de} ate={m.ate} palavras={palavras} z={z} topo={MAPA.y + h + 34} />
    </div>
  );
};
