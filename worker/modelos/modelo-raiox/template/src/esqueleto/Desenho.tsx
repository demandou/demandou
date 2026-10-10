// Desenho do esqueleto e dos móveis em traço luminoso, como numa chapa de raio-x.
// Tudo é desenhado em px a partir de uma projeção (cm → px) feita pela câmera da chapa.
import { cor } from "../tema";
import { type Juntas, MESA, MONITOR, TECLADO, type V, girar, menos, mix, mixV, posCranio, soma, unit, v, vezes } from "./pose";

export type Proj = (p: V) => V;
const P = (p: V) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

// Câmera: encaixa um retângulo da cena (cm) numa área (px), centralizado, sem distorcer.
export type Recorte = { x0: number; x1: number; y0: number; y1: number };
export const camera = (r: Recorte, largura: number, altura: number) => {
  const s = Math.min(largura / (r.x1 - r.x0), altura / (r.y1 - r.y0));
  const ox = (largura - (r.x1 - r.x0) * s) / 2;
  const oy = (altura - (r.y1 - r.y0) * s) / 2;
  const proj: Proj = (p) => v(ox + (p.x - r.x0) * s, oy + (r.y1 - p.y) * s);
  // de px para cm (para saber até onde a cena vai nas bordas)
  const cena = (px: V) => v((px.x - ox) / s + r.x0, r.y1 - (px.y - oy) / s);
  return { s, proj, cena };
};

// Osso longo (fêmur, úmero, tíbia…): diáfise fina com as pontas alargadas, em px.
const ossoLongo = (A: V, B: V, r1: number, r2: number, w: number) => {
  const d = menos(B, A);
  const u = unit(d);
  const n = v(-u.y, u.x);
  const L = Math.hypot(d.x, d.y);
  const wc = Math.max(0.2, (w - 0.125 * (r1 + r2)) / 0.75);
  const c1a = soma(soma(A, vezes(u, L * 0.3)), vezes(n, wc));
  const c1b = soma(soma(B, vezes(u, -L * 0.3)), vezes(n, wc));
  const c2a = soma(soma(B, vezes(u, -L * 0.3)), vezes(n, -wc));
  const c2b = soma(soma(A, vezes(u, L * 0.3)), vezes(n, -wc));
  return [
    `M ${P(soma(A, vezes(n, r1)))}`,
    `C ${P(c1a)} ${P(c1b)} ${P(soma(B, vezes(n, r2)))}`,
    `A ${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 0 ${P(soma(B, vezes(u, r2)))}`,
    `A ${r2.toFixed(1)} ${r2.toFixed(1)} 0 0 0 ${P(soma(B, vezes(n, -r2)))}`,
    `C ${P(c2a)} ${P(c2b)} ${P(soma(A, vezes(n, -r1)))}`,
    `A ${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 0 ${P(soma(A, vezes(u, -r1)))}`,
    `A ${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 0 ${P(soma(A, vezes(n, r1)))}`,
    "Z",
  ].join(" ");
};

const circulo = (c: V, r: number) =>
  `M ${P(v(c.x + r, c.y))} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${P(v(c.x - r, c.y))} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${P(v(c.x + r, c.y))} Z`;

// polígono a partir de pontos locais (cm) num referencial (origem, eixo x, eixo y)
const local = (proj: Proj, origem: V, ex: V, ey: V) => (x: number, y: number) => proj(soma(origem, soma(vezes(ex, x), vezes(ey, y))));

// ---------- crânio (perfil, coordenadas locais em cm, origem no atlas) ----------
const CRANIO_CONTORNO: (string | [number, number])[] = [
  "M", [-5.5, 3.5],
  "C", [-9.5, 6.5], [-9, 15], [-2, 17],
  "C", [3, 18.2], [8.5, 15.5], [9.6, 11],
  "C", [10.2, 9.5], [10.4, 8.6], [10.1, 7.8],
  "L", [10.6, 6.2],
  "L", [11.6, 4.6],
  "L", [10.4, 3.8],
  "C", [10.6, 3.0], [10.7, 2.0], [10.4, 1.2],
  "L", [8.6, 1.0],
  "C", [7.5, 1.8], [5.5, 2.4], [3.6, 3.2],
  "C", [2.4, 3.4], [1.0, 2.6], [0.2, 2.0],
  "C", [-1.2, 1.6], [-3.2, 2.4], [-5.5, 3.5],
  "Z",
];
const MANDIBULA: (string | [number, number])[] = [
  "M", [2.2, 4.2],
  "L", [1.7, 0.2],
  "C", [1.5, -1.5], [2.5, -2.6], [4.0, -2.8],
  "C", [6.0, -3.4], [8.4, -4.0], [9.6, -3.4],
  "C", [10.3, -2.6], [10.4, -1.0], [10.2, 0.6],
  "L", [8.6, 0.7],
  "C", [6.5, 0.2], [4.5, 0.5], [3.4, 1.4],
  "L", [3.0, 3.6],
  "Z",
];
const caminhoLocal = (cmds: (string | [number, number])[], f: (p: V) => V) =>
  cmds.map((c) => (typeof c === "string" ? c : P(f(v(c[0], c[1]))))).join(" ");

// ---------- tecido mole: a silhueta apagada em volta dos ossos ----------
export const Tecido: React.FC<{ j: Juntas; proj: Proj; s: number; id: string; opacidade?: number }> = ({ j, proj, s, id, opacidade = 0.085 }) => {
  const traco = (pts: V[], largura: number, chave: string) => (
    <path key={chave} d={`M ${pts.map((p) => P(proj(p))).join(" L ")}`} stroke="#fff" strokeWidth={largura * s} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  );
  const centroCabeca = posCranio(j.c1, j.cabeca, v(1.5, 8.5));
  const membros = (perna: Juntas["perna"], braco: Juntas["braco"], k: string) => [
    traco([perna.quadril, perna.joelho], 15, `c${k}`),
    traco([perna.joelho, perna.tornozelo], 10, `p${k}`),
    traco([perna.calcanhar, perna.planta, perna.dedos], 6.5, `f${k}`),
    traco([braco.ombro, braco.cotovelo], 9, `b${k}`),
    traco([braco.cotovelo, braco.punho, braco.mao], 7, `a${k}`),
  ];
  return (
    <g filter={`url(#nevoa-${id})`} opacity={opacidade}>
      <defs>
        <filter id={`nevoa-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={Math.max(1.5, s * 1.4)} />
        </filter>
      </defs>
      {traco([soma(j.sacro, v(3, -4)), j.l1, soma(j.c7, v(2, -3))], 27, "tronco")}
      {traco([j.c7, j.c1], 11, "pescoco")}
      <ellipse cx={proj(centroCabeca).x} cy={proj(centroCabeca).y} rx={11 * s} ry={12.2 * s} fill="#fff" opacity={0.7} />
      {membros(j.perna2, j.braco2, "2")}
      {membros(j.perna, j.braco, "1")}
    </g>
  );
};

// ---------- ossos ----------
const PREENCHE = "rgba(228,244,251,0.10)";

const Perna: React.FC<{ p: Juntas["perna"]; proj: Proj; s: number; lw: number }> = ({ p, proj, s, lw }) => {
  const Q = proj(p.quadril);
  const J = proj(p.joelho);
  const T = proj(p.tornozelo);
  const dirCoxa = unit(menos(p.joelho, p.quadril));
  const dirCanela = unit(menos(p.tornozelo, p.joelho));
  const fibulaOff = vezes(girar(dirCanela, -90), 1.7);
  const patela = soma(soma(p.joelho, vezes(dirCoxa, 2.0)), vezes(girar(dirCoxa, 90), 1.6));
  const f = p.pe;
  const up = girar(f, 90);
  const pe = local(proj, p.tornozelo, f, up);
  return (
    <g strokeWidth={lw}>
      <path d={ossoLongo(Q, J, 2.5 * s, 2.9 * s, 1.25 * s)} />
      <path d={ossoLongo(proj(soma(p.joelho, vezes(dirCanela, 0.6))), T, 2.6 * s, 1.7 * s, 1.1 * s)} />
      <path d={ossoLongo(proj(soma(soma(p.joelho, vezes(dirCanela, 3)), fibulaOff)), proj(soma(soma(p.tornozelo, vezes(dirCanela, 0.6)), fibulaOff)), 1.0 * s, 1.1 * s, 0.45 * s)} />
      <ellipse
        cx={proj(patela).x}
        cy={proj(patela).y}
        rx={1.3 * s}
        ry={2.0 * s}
        transform={`rotate(${((Math.atan2(-dirCoxa.y, dirCoxa.x) * 180) / Math.PI).toFixed(1)} ${proj(patela).x.toFixed(1)} ${proj(patela).y.toFixed(1)})`}
      />
      {/* tálus e calcâneo */}
      <path d={`M ${P(pe(0, 0.6))} C ${P(pe(-2.2, 0.4))} ${P(pe(-5.6, -1.6))} ${P(pe(-5.6, -3.8))} C ${P(pe(-5.6, -6.0))} ${P(pe(-3.6, -6.5))} ${P(pe(-1.2, -5.9))} L ${P(pe(3.6, -4.2))} C ${P(pe(4.4, -2.6))} ${P(pe(3.0, -0.4))} ${P(pe(0, 0.6))} Z`} />
      {/* metatarsos e dedos */}
      {[-0.7, 0, 0.7].map((d, i) => (
        <path key={i} fill="none" d={`M ${P(pe(3.8, -3.4 + d * 0.6))} L ${P(soma(proj(p.planta), vezes(v(0, -d), s * 0.9)))}`} />
      ))}
      <path fill="none" d={`M ${P(proj(p.planta))} L ${P(proj(p.dedos))}`} />
    </g>
  );
};

const Braco: React.FC<{ b: Juntas["braco"]; proj: Proj; s: number; lw: number }> = ({ b, proj, s, lw }) => {
  const dirAnte = unit(menos(b.punho, b.cotovelo));
  const radioOff = vezes(girar(dirAnte, 90), 1.1);
  const mao = (k: number) => {
    const spread = vezes(girar(unit(menos(b.mao, b.punho)), 90), k * 0.7);
    return [soma(soma(b.punho, vezes(dirAnte, 1.3)), spread), soma(b.mao, spread), soma(b.dedos, vezes(spread, 1.3))];
  };
  return (
    <g strokeWidth={lw}>
      <path d={ossoLongo(proj(b.ombro), proj(b.cotovelo), 2.3 * s, 1.9 * s, 1.0 * s)} />
      <path d={circulo(proj(b.ombro), 2.5 * s)} fill="none" />
      <path d={ossoLongo(proj(soma(b.cotovelo, vezes(dirAnte, -1.2))), proj(b.punho), 1.5 * s, 0.9 * s, 0.55 * s)} />
      <path d={ossoLongo(proj(soma(soma(b.cotovelo, vezes(dirAnte, 1.2)), radioOff)), proj(soma(b.punho, radioOff)), 1.0 * s, 1.35 * s, 0.6 * s)} />
      <path d={circulo(proj(soma(b.punho, vezes(dirAnte, 1.2))), 1.3 * s)} />
      {[-1, 0, 1].map((k) => {
        const [a, m, d] = mao(k);
        return <path key={k} fill="none" d={`M ${P(proj(a))} L ${P(proj(m))} L ${P(proj(d))}`} />;
      })}
    </g>
  );
};

const Coluna: React.FC<{ j: Juntas; proj: Proj; s: number; lw: number }> = ({ j, proj, s, lw }) => {
  const TAM = { l: { h: 2.9, d: 4.4 }, t: { h: 1.95, d: 3.1 }, c: { h: 1.35, d: 2.1 } };
  return (
    <g strokeWidth={lw * 0.9}>
      {j.vertebras.map((vt, i) => {
        const { h, d } = TAM[vt.nivel];
        const c = soma(vt.p, vezes(vt.n, d * 0.55));
        const cantos = [
          soma(soma(c, vezes(vt.t, h / 2)), vezes(vt.n, d / 2)),
          soma(soma(c, vezes(vt.t, h / 2)), vezes(vt.n, -d / 2)),
          soma(soma(c, vezes(vt.t, -h / 2)), vezes(vt.n, -d / 2)),
          soma(soma(c, vezes(vt.t, -h / 2)), vezes(vt.n, d / 2)),
        ].map(proj);
        const proc = vt.nivel === "t" ? 2.6 : vt.nivel === "l" ? 2.3 : 1.6;
        const desce = vt.nivel === "t" ? 1.3 : 0.5;
        return (
          <g key={i}>
            <path d={`M ${cantos.map(P).join(" L ")} Z`} strokeLinejoin="round" />
            <path fill="none" d={`M ${P(proj(soma(vt.p, vezes(vt.n, -0.2))))} L ${P(proj(soma(soma(vt.p, vezes(vt.n, -proc)), vezes(vt.t, -desce))))}`} />
          </g>
        );
      })}
    </g>
  );
};

const Torax: React.FC<{ j: Juntas; proj: Proj; s: number; lw: number }> = ({ j, proj, lw }) => {
  const toracicas = j.vertebras.filter((x) => x.nivel === "t");
  const frentes: V[] = [];
  const costelas = toracicas.slice(1, 10).map((vt, k) => {
    const d = vt.t;
    const n = vt.n;
    const p = soma(vt.p, vezes(n, 0.6));
    const fim = soma(soma(p, vezes(n, 16.5 + 0.7 * k)), vezes(d, -(3.6 + 1.25 * k)));
    frentes.push(fim);
    const c1 = soma(soma(p, vezes(n, -3.6)), vezes(d, 0.8));
    const c2 = soma(soma(p, vezes(n, 15.5 + 0.8 * k)), vezes(d, 3.4 - 0.55 * k));
    return `M ${P(proj(p))} C ${P(proj(c1))} ${P(proj(c2))} ${P(proj(fim))}`;
  });
  const topo = frentes[0];
  const base = frentes[6];
  return (
    <g fill="none" strokeWidth={lw * 0.75} opacity={0.8}>
      {costelas.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <path d={`M ${P(proj(soma(topo, vezes(j.toracicaDir, 1.5))))} L ${P(proj(base))}`} strokeWidth={lw * 1.4} />
      {/* clavícula */}
      <path d={`M ${P(proj(j.ombro))} Q ${P(proj(soma(mixV(j.ombro, topo, 0.5), vezes(j.toracicaDir, 1.2))))} ${P(proj(soma(topo, vezes(j.toracicaDir, 1.6))))}`} strokeWidth={lw * 1.1} />
    </g>
  );
};

const Pelve: React.FC<{ j: Juntas; proj: Proj; s: number; lw: number }> = ({ j, proj, s, lw }) => {
  const ex = girar(v(1, 0), j.pelve);
  const ey = girar(v(0, 1), j.pelve);
  const L = local(proj, j.quadril, ex, ey);
  const ilio = `M ${P(L(-6.0, 7.5))} C ${P(L(-6.8, 11))} ${P(L(-4, 14.2))} ${P(L(0.5, 14.4))} C ${P(L(4, 14.4))} ${P(L(6.6, 12.5))} ${P(L(7.0, 10.0))} C ${P(L(6.4, 8.0))} ${P(L(4.5, 6.5))} ${P(L(3.6, 4.0))} L ${P(L(3.2, 2.6))} C ${P(L(4.5, 0))} ${P(L(6, -1.5))} ${P(L(6.6, -3.5))} C ${P(L(6.4, -5))} ${P(L(4, -5.2))} ${P(L(2, -4.6))} C ${P(L(0, -4.6))} ${P(L(-2, -6.5))} ${P(L(-3.6, -6.8))} C ${P(L(-5.2, -6.6))} ${P(L(-5.6, -4.5))} ${P(L(-4.6, -3.0))} C ${P(L(-3.6, -1.2))} ${P(L(-5.5, 1.5))} ${P(L(-6.6, 3.0))} C ${P(L(-7.4, 4.2))} ${P(L(-6.4, 5.6))} ${P(L(-6.0, 7.5))} Z`;
  const sacro = `M ${P(L(-5.0, 8.6))} L ${P(L(-9.0, 7.6))} C ${P(L(-11.0, 4))} ${P(L(-11.2, 0.5))} ${P(L(-10.0, -2.5))} L ${P(L(-9.0, -4.2))} C ${P(L(-8.4, -2.0))} ${P(L(-8.0, 2.0))} ${P(L(-5.0, 8.6))} Z`;
  const forame = L(2.8, -2.4);
  return (
    <g strokeWidth={lw}>
      <path d={ilio} />
      <path d={sacro} />
      <ellipse cx={forame.x} cy={forame.y} rx={1.5 * s} ry={1.1 * s} fill="none" strokeWidth={lw * 0.7} />
      <path d={circulo(proj(j.quadril), 2.7 * s)} fill="none" strokeWidth={lw * 0.8} />
    </g>
  );
};

const Cranio: React.FC<{ j: Juntas; proj: Proj; s: number; lw: number }> = ({ j, proj, s, lw }) => {
  const f = (p: V) => proj(posCranio(j.c1, j.cabeca, p));
  const orbita = f(v(7.6, 8.4));
  const ouvido = f(v(0.6, 4.6));
  return (
    <g strokeWidth={lw}>
      <path d={caminhoLocal(CRANIO_CONTORNO, f)} fill="rgba(228,244,251,0.05)" />
      <path d={caminhoLocal(MANDIBULA, f)} fill="rgba(228,244,251,0.04)" />
      <path d={circulo(orbita, 1.9 * s)} fill="none" />
      <path d={`M ${P(f(v(9.9, 6.0)))} L ${P(f(v(10.6, 4.6)))} L ${P(f(v(9.6, 4.2)))} Z`} fill="none" strokeWidth={lw * 0.8} />
      <path d={`M ${P(f(v(8.2, 6.4)))} C ${P(f(v(6.5, 5.6)))} ${P(f(v(4, 5.4)))} ${P(f(v(1.8, 5.6)))}`} fill="none" strokeWidth={lw * 0.8} />
      <path d={`M ${P(f(v(8.7, 1.0)))} L ${P(f(v(10.3, 1.05)))} M ${P(f(v(8.7, 0.7)))} L ${P(f(v(10.1, 0.65)))}`} fill="none" strokeWidth={lw * 0.7} />
      <path d={circulo(ouvido, 0.65 * s)} fill="none" strokeWidth={lw * 0.8} />
    </g>
  );
};

// O esqueleto inteiro, com brilho só no traço (o lado de lá mais apagado, como na chapa).
export const Ossos: React.FC<{ j: Juntas; proj: Proj; s: number; id: string; brilho?: number }> = ({ j, proj, s, id, brilho = 1 }) => {
  const lw = Math.max(1.1, Math.min(3.2, s * 0.36));
  return (
    <g>
      <defs>
        <filter id={`brilho-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={Math.max(1.2, s * 0.55)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#brilho-${id})`} stroke={cor.osso} fill={PREENCHE} strokeLinecap="round" strokeLinejoin="round" opacity={brilho}>
        <g opacity={0.38}>
          <Perna p={j.perna2} proj={proj} s={s} lw={lw} />
          <Braco b={j.braco2} proj={proj} s={s} lw={lw} />
        </g>
        <Pelve j={j} proj={proj} s={s} lw={lw} />
        <Torax j={j} proj={proj} s={s} lw={lw} />
        <Coluna j={j} proj={proj} s={s} lw={lw} />
        <Cranio j={j} proj={proj} s={s} lw={lw} />
        <Perna p={j.perna} proj={proj} s={s} lw={lw} />
        <Braco b={j.braco} proj={proj} s={s} lw={lw} />
      </g>
    </g>
  );
};

// ---------- móveis ----------
export const Chao: React.FC<{ proj: Proj; x0: number; x1: number; s: number; id: string }> = ({ proj, x0, x1, s, id }) => {
  const a = proj(v(x0, 0));
  const b = proj(v(x1, 0));
  return (
    <g>
      <defs>
        <linearGradient id={`chao-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E4F4FB" stopOpacity="0.16" />
          <stop offset="1" stopColor="#E4F4FB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={a.x} y={a.y} width={b.x - a.x} height={Math.max(4, s * 6)} fill={`url(#chao-${id})`} opacity={0.5} />
      <path d={`M ${P(a)} L ${P(b)}`} stroke={cor.objeto} strokeWidth={Math.max(1, s * 0.3)} />
    </g>
  );
};

export const Cadeira: React.FC<{ proj: Proj; s: number; dx?: number }> = ({ proj, s, dx = 0 }) => {
  const L = (x: number, y: number) => proj(v(x + dx, y));
  const lw = Math.max(1, s * 0.3);
  return (
    <g stroke={cor.objeto} fill="rgba(228,244,251,0.035)" strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round">
      {/* assento e encosto */}
      <path d={`M ${P(L(-21, 39.2))} L ${P(L(20, 39.2))} Q ${P(L(22, 39.6))} ${P(L(21.6, 41.4))} L ${P(L(-19, 42.4))} Q ${P(L(-21.8, 42.2))} ${P(L(-21, 39.2))} Z`} />
      <path d={`M ${P(L(-18, 41))} L ${P(L(-21.5, 46))} C ${P(L(-24.5, 62))} ${P(L(-25.5, 80))} ${P(L(-24, 94))} L ${P(L(-21, 94))} C ${P(L(-22, 80))} ${P(L(-21.5, 62))} ${P(L(-18.5, 46))} Z`} />
      {/* coluna a gás e base com rodízios */}
      <path fill="none" d={`M ${P(L(-1.5, 39))} L ${P(L(-1.5, 13))} M ${P(L(1.5, 39))} L ${P(L(1.5, 13))}`} />
      <path fill="none" d={`M ${P(L(-25, 7.5))} L ${P(L(-3, 12.5))} L ${P(L(3, 12.5))} L ${P(L(25, 7.5))}`} />
      <path d={circulo(L(-24, 3.2), 2.8 * s)} />
      <path d={circulo(L(24, 3.2), 2.8 * s)} />
    </g>
  );
};

export const Mesa: React.FC<{ proj: Proj; s: number; telaP: number; teclado: number; brilhoTela?: number }> = ({ proj, s, telaP, teclado, brilhoTela = 0 }) => {
  const L = (x: number, y: number) => proj(v(x, y));
  const lw = Math.max(1, s * 0.3);
  const base = mix(MONITOR.baseBaixa, MONITOR.baseCerta, telaP);
  // o suporte embaixo do monitor cresce quando a tela sobe
  const suporte = base - 5 - MESA.topo;
  const mx = MONITOR.x;
  // o teclado fica sob a mão (vem junto quando o braço volta para perto do corpo)
  const k = teclado - 5;
  const tela = [L(mx, base), L(mx + 2.4, base), L(mx + 2.4 + 2.2, base + MONITOR.altura), L(mx + 2.2, base + MONITOR.altura)];
  return (
    <g stroke={cor.objeto} fill="rgba(228,244,251,0.035)" strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round">
      <path d={`M ${P(L(MESA.frente, MESA.topo))} L ${P(L(MESA.fundo, MESA.topo))} L ${P(L(MESA.fundo, MESA.topo - MESA.espessura))} L ${P(L(MESA.frente, MESA.topo - MESA.espessura))} Z`} />
      <path fill="none" d={`M ${P(L(MESA.fundo - 4, MESA.topo - MESA.espessura))} L ${P(L(MESA.fundo - 4, 0))} M ${P(L(MESA.fundo - 7, MESA.topo - MESA.espessura))} L ${P(L(MESA.fundo - 7, 0))}`} />
      {/* teclado */}
      <path d={`M ${P(L(k, MESA.topo))} L ${P(L(k + TECLADO.largura, MESA.topo))} L ${P(L(k + TECLADO.largura - 0.5, MESA.topo + 1.6))} L ${P(L(k + 0.6, MESA.topo + 1.3))} Z`} />
      {/* suporte que sobe, pé e haste do monitor */}
      {suporte > 0.4 ? (
        <path d={`M ${P(L(mx - 8, MESA.topo))} L ${P(L(mx + 11, MESA.topo))} L ${P(L(mx + 11, MESA.topo + suporte))} L ${P(L(mx - 8, MESA.topo + suporte))} Z`} />
      ) : null}
      <path d={`M ${P(L(mx - 6, MESA.topo + Math.max(0, suporte)))} L ${P(L(mx + 9, MESA.topo + Math.max(0, suporte)))}`} strokeWidth={lw * 1.6} />
      <path fill="none" d={`M ${P(L(mx + 5, MESA.topo + Math.max(0, suporte)))} L ${P(L(mx + 4.6, base + 9))} L ${P(L(mx + 2.4, base + 12))}`} strokeWidth={lw * 1.3} />
      {/* a tela (a face voltada para a pessoa fica mais clara) */}
      <path d={`M ${tela.map(P).join(" L ")} Z`} />
      <path
        d={`M ${P(tela[0])} L ${P(tela[3])}`}
        stroke={cor.osso}
        strokeWidth={lw * (1.3 + brilhoTela)}
        opacity={0.75 + 0.25 * brilhoTela}
      />
    </g>
  );
};

// Porta entreaberta (o destino da caminhada, na pausa)
export const Porta: React.FC<{ proj: Proj; s: number; x: number; abre?: number }> = ({ proj, s, x, abre = 0.25 }) => {
  const L = (a: number, b: number) => proj(v(x + a, b));
  const lw = Math.max(1, s * 0.3);
  const folha = 72 * Math.cos(abre * 1.1);
  return (
    <g stroke={cor.objeto} fill="rgba(228,244,251,0.03)" strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round">
      <path fill="none" d={`M ${P(L(0, 0))} L ${P(L(0, 206))} L ${P(L(78, 206))} L ${P(L(78, 0))}`} strokeWidth={lw * 1.4} />
      <path d={`M ${P(L(3, 1))} L ${P(L(3 + folha, 1 + 6 * abre))} L ${P(L(3 + folha, 203 - 6 * abre))} L ${P(L(3, 203))} Z`} />
      <path d={circulo(L(folha - 6, 100), 1.6 * s)} />
    </g>
  );
};

// posição da tela (para destaque, linha dos olhos, rótulos)
export const centroDaTela = (telaP: number) => {
  const base = mix(MONITOR.baseBaixa, MONITOR.baseCerta, telaP);
  return { base, topo: base + MONITOR.altura, centro: v(MONITOR.x + 1.2, base + MONITOR.altura / 2), x: MONITOR.x };
};
