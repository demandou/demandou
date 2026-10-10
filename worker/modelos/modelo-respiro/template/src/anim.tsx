import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento do Respiro: tudo entra devagar e assenta, como um expirar. Nada quica, nada pisca.
// "entra" para textos e desenhos; "liquido" (simétrico e longo) para as trocas de lugar.
export const entra = Easing.bezier(0.22, 1, 0.36, 1);
export const liquido = Easing.bezier(0.55, 0, 0.25, 1);
const sai = Easing.bezier(0.5, 0, 0.75, 0);
// curva do ar: começa e termina devagar, como o peito enchendo
export const ar = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * limitar(x));

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.5) => prog(t, ate - dur, dur, sai);

// Estilo de saída líquida: some desfocando e subindo de leve (o que sai cruza com o que entra).
export const dissolver = (s: number): React.CSSProperties =>
  s <= 0.001 ? {} : { opacity: 1 - s, filter: `blur(${(s * 10).toFixed(2)}px)`, translate: `0 ${(-14 * s).toFixed(2)}px` };

// Mistura duas cores #RRGGBB
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * limitar(p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Ruído suave e determinístico (soma de senos): o "vivo" de tudo que respira.
export const ondular = (t: number, semente: number) =>
  Math.sin(t * 0.83 + semente * 1.7) * 0.55 + Math.sin(t * 1.37 + semente * 4.1) * 0.3 + Math.sin(t * 0.41 + semente * 2.3) * 0.15;

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

const EXTENSO: Record<string, string> = {
  "1": "um", "2": "dois", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete", "8": "oito", "9": "nove", "10": "dez",
};
// equivalências entre o que se escreve na tela e o que a transcrição devolve
const mesma = (a: string, b: string) =>
  a === b || (a === "pra" && b === "para") || (a === "para" && b === "pra") || EXTENSO[a] === b || EXTENSO[b] === a;

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior. Palavras ditas antes de `inicio` (o lugar
// ainda não estava livre) entram em cascata a partir dele.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.8 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && mesma(alvo, normalizar(p.w))) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.14);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos.map((x, i) => Math.max(x, inicio + i * 0.09));
};

// índices das palavras de `palavras` que formam o trecho `trecho` (primeira ocorrência)
export const indicesDoTrecho = (palavras: string[], trecho?: string) => {
  const marcadas = new Set<number>();
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean).map(normalizar) : [];
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Traço que se desenha sozinho (p de 0 a 1 ao longo do caminho), pontas arredondadas.
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number; tracejado?: string } & Omit<
    React.SVGProps<SVGPathElement>,
    "d" | "stroke" | "strokeWidth"
  >
> = ({ d, p = 1, cor, largura, tracejado, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999;
  return (
    <path
      d={d}
      fill="none"
      stroke={cor}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial && !tracejado ? 1 : undefined}
      strokeDasharray={tracejado ?? (parcial ? `${p} 1` : undefined)}
      {...resto}
    />
  );
};

// Caminho fechado e macio passando por pontos (Catmull-Rom → Bézier)
export const caminhoMacio = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
};

// Círculo orgânico: raio que ondula devagar em volta (nunca perfeito, nunca parado)
export const formaOrganica = (cx: number, cy: number, r: number, t: number, semente: number, amplitude = 1) => {
  const pts: [number, number][] = [];
  const N = 48;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k =
      1 +
      amplitude *
        (0.016 * Math.sin(2 * a + t * 0.7 + semente) +
          0.012 * Math.sin(3 * a - t * 0.52 + semente * 2.1) +
          0.006 * Math.sin(5 * a + t * 0.9 + semente * 3.7));
    pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  return caminhoMacio(pts);
};
