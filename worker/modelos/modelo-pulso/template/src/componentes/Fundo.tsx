// O fundo do app: giz claro com curvas de nível bem leves (como um mapa de trilha), desenhadas uma
// vez só. É fixo e discreto: nunca compete com a pessoa ou com os números.
import { cor, H, W } from "../tema";

// relevo suave e determinístico: alguns morros e vales espalhados
const MORROS = [
  { x: 180, y: 380, s: 330, a: 1.0 },
  { x: 900, y: 260, s: 260, a: -0.8 },
  { x: 760, y: 980, s: 420, a: 1.1 },
  { x: 160, y: 1320, s: 360, a: -0.9 },
  { x: 620, y: 1720, s: 380, a: 0.9 },
  { x: 1020, y: 1500, s: 240, a: 0.7 },
  { x: 420, y: 760, s: 220, a: -0.6 },
];
const relevo = (x: number, y: number) =>
  MORROS.reduce((s, m) => s + m.a * Math.exp(-((x - m.x) ** 2 + (y - m.y) ** 2) / (2 * m.s * m.s)), 0) +
  0.18 * Math.sin(x / 230 + y / 410) +
  0.12 * Math.cos(y / 260 - x / 520);

// marching squares: segmentos de cada nível; cada 5º nível sai um pouco mais forte (curva mestra)
const curvas = () => {
  const passo = 16;
  const nx = Math.ceil(W / passo) + 1;
  const ny = Math.ceil(H / passo) + 1;
  const v: number[][] = [];
  for (let j = 0; j < ny; j++) {
    v.push([]);
    for (let i = 0; i < nx; i++) v[j].push(relevo(i * passo, j * passo));
  }
  const finas: string[] = [];
  const mestras: string[] = [];
  const intervalo = 0.11;
  for (let n = -14; n <= 14; n++) {
    const nivel = n * intervalo + 0.03;
    const saida = n % 5 === 0 ? mestras : finas;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = v[j][i];
        const b = v[j][i + 1];
        const c = v[j + 1][i + 1];
        const d = v[j + 1][i];
        const pts: [number, number][] = [];
        const corta = (p: number, q: number, x0: number, y0: number, x1: number, y1: number) => {
          if ((p < nivel) !== (q < nivel)) {
            const k = (nivel - p) / (q - p);
            pts.push([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]);
          }
        };
        const X = i * passo;
        const Y = j * passo;
        corta(a, b, X, Y, X + passo, Y);
        corta(b, c, X + passo, Y, X + passo, Y + passo);
        corta(c, d, X + passo, Y + passo, X, Y + passo);
        corta(d, a, X, Y + passo, X, Y);
        for (let k = 0; k + 1 < pts.length; k += 2) {
          saida.push(`M${pts[k][0].toFixed(1)} ${pts[k][1].toFixed(1)}L${pts[k + 1][0].toFixed(1)} ${pts[k + 1][1].toFixed(1)}`);
        }
      }
    }
  }
  return { finas: finas.join(""), mestras: mestras.join("") };
};
const CURVAS = curvas();

export const Fundo: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect width={W} height={H} fill={cor.fundo} />
    <path d={CURVAS.finas} stroke={cor.curva} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <path d={CURVAS.mestras} stroke="#CDD2CA" strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </svg>
);
