import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de impressora: decidido e assentado, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// trocas de quadro (a pessoa e o cupom trocando de lado): macias nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const sai = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  // instante que nunca chega (Infinity) = 0; que já passou desde sempre (−Infinity) = 1
  !Number.isFinite(inicio)
    ? inicio > 0
      ? 0
      : 1
    : interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// ---------- dinheiro em formato brasileiro ----------

// 2112 → "2.112,00"; -30 → "30,00" (o sinal é desenhado à parte)
export const reais = (valor: number) => {
  const centavos = Math.round(Math.abs(valor) * 100);
  const inteiro = Math.floor(centavos / 100);
  const resto = String(centavos % 100).padStart(2, "0");
  const milhar = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${milhar},${resto}`;
};

// 83000 → "83.000"; (1.5, 1) → "1,5"; (-30, 2) → "−30,00"
export const numeroBR = (valor: number, casas = 0) => {
  const fator = 10 ** Math.max(0, Math.min(4, Math.round(casas)));
  const total = Math.round(Math.abs(valor) * fator);
  const inteiro = Math.floor(total / fator);
  const resto = fator > 1 ? `,${String(total % fator).padStart(String(fator).length - 1, "0")}` : "";
  return `${valor < 0 && total > 0 ? "−" : ""}${String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${resto}`;
};

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "0": ["zero"],
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto", "quarta"],
  "5": ["cinco", "quinto", "quinta"],
  "6": ["seis", "sexto", "sexta"],
  "7": ["sete", "setimo", "setima"],
  "8": ["oito", "oitavo", "oitava"],
  "9": ["nove", "nono", "nona"],
  "10": ["dez", "decimo", "decima"],
  "12": ["doze"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra impressa corresponde à falada? ("1" ↔ "uma", "pra" ↔ "para")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas a partir de
// `de` (até `ate`). Palavra não achada entra logo depois da anterior (texto enxugado continua no
// ritmo). Nada entra antes de `inicio`.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.1;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.12));
  }
  return tempos;
};

// índices (na sequência de palavras do texto) que pertencem a um trecho
export const indicesDoTrecho = (texto: string, trecho?: string) => {
  if (!trecho) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  }
  return new Set<number>();
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho).
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number } & Omit<React.SVGProps<SVGPathElement>, "d" | "stroke" | "strokeWidth">
> = ({ d, p = 1, cor, largura, ...resto }) => {
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
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={parcial ? `${p} 1` : undefined}
      {...resto}
    />
  );
};
