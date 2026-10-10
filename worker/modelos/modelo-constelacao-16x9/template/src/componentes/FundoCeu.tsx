import { ruido } from "../anim";
import { cor, H, W } from "../tema";

// O céu de fundo dos blocos universais (quando o plano não traz um céu real): uma carta sem fim,
// com grade de coordenadas (círculos em volta de um polo distante e meridianos), a faixa da Via
// Láctea e estrelinhas fixas. `pan` é onde a "luneta" está apontada (px): quando a carta passa de
// um bloco para outro, o céu inteiro desliza junto, como um telescópio sendo reapontado.

type P = { x: number; y: number };

// polo da grade, no espaço do céu (px)
const POLO: P = { x: W / 2, y: -5400 };
const PASSO_ANEL = 430;
const PASSO_MERIDIANO = 0.072;
// a faixa da Via Láctea: uma reta inclinada pelo céu
const VIA_PONTO: P = { x: 300, y: 900 };
const VIA_DIR = { x: Math.cos(-1.08), y: Math.sin(-1.08) };
const VIA_LARGURA = 330;
const CELULA = 512;

const distVia = (p: P) => {
  // distância (com sinal) até a linha central da faixa
  const nx = -VIA_DIR.y;
  const ny = VIA_DIR.x;
  return (p.x - VIA_PONTO.x) * nx + (p.y - VIA_PONTO.y) * ny;
};

type Estrelinha = { x: number; y: number; r: number; a: number; fase: number; k: number };

const estrelasDaCelula = (cx: number, cy: number): Estrelinha[] => {
  const lista: Estrelinha[] = [];
  const base = cx * 92821 + cy * 68917;
  for (let i = 0; i < 44; i++) {
    const q = ruido(base + i * 9.13);
    lista.push({
      x: (cx + ruido(base + i * 1.37)) * CELULA,
      y: (cy + ruido(base + i * 2.71)) * CELULA,
      r: q < 0.72 ? 1.1 + q * 0.7 : q < 0.95 ? 1.7 + (q - 0.72) * 3 : 2.6 + (q - 0.95) * 14,
      a: q < 0.72 ? 0.32 + q * 0.3 : q < 0.95 ? 0.55 + (q - 0.72) : 0.8,
      fase: ruido(base + i * 4.4) * 6.28,
      k: base + i,
    });
  }
  // pontilhado da Via Láctea: mais denso perto do meio da faixa
  for (let i = 0; i < 150; i++) {
    const p = { x: (cx + ruido(base + i * 3.1 + 11)) * CELULA, y: (cy + ruido(base + i * 7.7 + 3)) * CELULA };
    const d = Math.abs(distVia(p)) / VIA_LARGURA;
    if (d > 1 || ruido(base + i * 5.3 + 9) > (1 - d) * (1 - d)) continue;
    const q = ruido(base + i * 3.3 + 1);
    lista.push({ ...p, r: 0.9 + q * 0.8 + (q > 0.97 ? 1.2 : 0), a: (0.22 + 0.3 * q) * (1 - d), fase: ruido(base + i * 1.1) * 6.28, k: base + 500 + i });
  }
  return lista;
};

export const FundoCeu: React.FC<{ pan: P; t: number }> = ({ pan, t }) => {
  const tela = (p: P) => ({ x: p.x - pan.x, y: p.y - pan.y });

  // estrelinhas das células visíveis
  const estrelas: React.ReactNode[] = [];
  for (let cy = Math.floor(pan.y / CELULA) - 1; cy <= Math.floor((pan.y + H) / CELULA); cy++) {
    for (let cx = Math.floor(pan.x / CELULA) - 1; cx <= Math.floor((pan.x + W) / CELULA); cx++) {
      for (const s of estrelasDaCelula(cx, cy)) {
        const q = tela(s);
        if (q.x < -6 || q.x > W + 6 || q.y < -6 || q.y > H + 6) continue;
        estrelas.push(<circle key={`f-${s.k}`} cx={q.x} cy={q.y} r={s.r} opacity={s.a * (0.82 + 0.18 * Math.sin(t * 2.3 + s.fase)) * (0.75 + 0.25 * ruido(s.k))} />);
      }
    }
  }

  // grade: anéis em volta do polo e meridianos
  const polo = tela(POLO);
  const dists = [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
  ].map(([x, y]) => Math.hypot(x - polo.x, y - polo.y));
  const rMin = Math.max(0, Math.min(...dists) - 40);
  const rMax = Math.max(...dists) + 40;
  const angulos = [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
  ].map(([x, y]) => Math.atan2(y - polo.y, x - polo.x));
  const aMin = Math.min(...angulos) - 0.02;
  const aMax = Math.max(...angulos) + 0.02;
  const grade: string[] = [];
  for (let k = Math.ceil(rMin / PASSO_ANEL); k * PASSO_ANEL <= rMax; k++) {
    const r = k * PASSO_ANEL;
    const pts: string[] = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const a = aMin + ((aMax - aMin) * i) / n;
      pts.push(`${i ? "L" : "M"}${(polo.x + Math.cos(a) * r).toFixed(1)} ${(polo.y + Math.sin(a) * r).toFixed(1)}`);
    }
    grade.push(pts.join(" "));
  }
  for (let j = Math.ceil((aMin + Math.PI / 2) / PASSO_MERIDIANO); -Math.PI / 2 + j * PASSO_MERIDIANO <= aMax; j++) {
    const a = -Math.PI / 2 + j * PASSO_MERIDIANO;
    grade.push(`M${(polo.x + Math.cos(a) * rMin).toFixed(1)} ${(polo.y + Math.sin(a) * rMin).toFixed(1)} L${(polo.x + Math.cos(a) * rMax).toFixed(1)} ${(polo.y + Math.sin(a) * rMax).toFixed(1)}`);
  }

  // faixa da Via Láctea: camadas sobrepostas (borda macia)
  const centro = tela(VIA_PONTO);
  const nx = -VIA_DIR.y;
  const ny = VIA_DIR.x;
  // ponto da linha central mais perto do meio da tela
  const s0 = (W / 2 - centro.x) * VIA_DIR.x + (H / 2 - centro.y) * VIA_DIR.y;
  const meio = { x: centro.x + VIA_DIR.x * s0, y: centro.y + VIA_DIR.y * s0 };
  const L = 2600;
  const faixas = [1, 0.86, 0.72, 0.58, 0.44, 0.3, 0.16].map((f) => {
    const w = VIA_LARGURA * f;
    const a = { x: meio.x - VIA_DIR.x * L + nx * w, y: meio.y - VIA_DIR.y * L + ny * w };
    const b = { x: meio.x + VIA_DIR.x * L + nx * w, y: meio.y + VIA_DIR.y * L + ny * w };
    const c = { x: meio.x + VIA_DIR.x * L - nx * w, y: meio.y + VIA_DIR.y * L - ny * w };
    const d = { x: meio.x - VIA_DIR.x * L - nx * w, y: meio.y - VIA_DIR.y * L - ny * w };
    return `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y} L${d.x} ${d.y} Z`;
  });

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <rect width={W} height={H} fill={cor.ceu} />
      {faixas.map((d, i) => (
        <path key={`via-${i}`} d={d} fill={cor.via} />
      ))}
      <g stroke={cor.grade} strokeWidth={1.6} fill="none">
        {grade.map((d, i) => (
          <path key={`g-${i}`} d={d} />
        ))}
      </g>
      <g fill={cor.estrela}>{estrelas}</g>
    </svg>
  );
};
