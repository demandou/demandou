import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento editorial: entra decidido e assenta, sem quique.
export const suave = Easing.bezier(0.16, 1, 0.3, 1);
// trocas de layout: curva firme e simétrica
export const firme = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = suave) =>
  interpolate(t, [inicio, inicio + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.24) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;

// mistura de cores hex que devolve hex (para usar dentro de outra mistura)
export const misturaHex = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(mistura(v, pb[i], p)).toString(16).padStart(2, "0")).join("")}`;
};

// mistura de cores hex (#RRGGBB)
export const misturaCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mistura(v, pb[i], p))).join(",")})`;
};

// ---------- casar o texto da tela com a fala ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro"],
  "2": ["dois", "duas", "segundo"],
  "3": ["tres", "terceiro"],
  "4": ["quatro"],
  "5": ["cinco"],
  "6": ["seis"],
  "7": ["sete"],
  "8": ["oito"],
  "9": ["nove"],
  "10": ["dez"],
  "12": ["doze"],
  "14": ["catorze", "quatorze"],
  "15": ["quinze"],
  "20": ["vinte"],
  "30": ["trinta"],
};
export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}%]+/gu, "");
const formas = (w: string) => {
  const n = normalizar(w);
  const lista = [n];
  if (NUMEROS[n]) lista.push(...NUMEROS[n]);
  if (n === "pra" || n === "pro") lista.push("para");
  if (n === "para") lista.push("pra", "pro");
  if (n === "%") lista.push("por", "porcento");
  return lista;
};

// Para cada palavra de `texto`, o instante em que ela é dita (a partir de `inicio`).
// Palavra que não se acha na fala herda o tempo da anterior + um passo curto.
export const temposDoTexto = (texto: string, palavras: Palavra[], inicio: number, fim = Infinity): number[] => {
  const alvo = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= inicio - 0.3 && p.em < fim + 0.3);
  let cursor = 0;
  let ultimo = inicio;
  return alvo.map((w) => {
    const f = formas(w);
    for (let k = cursor; k < Math.min(fala.length, cursor + 6); k++) {
      if (f.includes(normalizar(fala[k].w))) {
        cursor = k + 1;
        ultimo = Math.max(inicio, fala[k].em);
        return ultimo;
      }
    }
    ultimo += 0.12;
    return ultimo;
  });
};

// ---------- texto que passa de lápis a tinta, palavra por palavra ----------

// Uma linha de palavras. Cada palavra já está escrita a lápis e ganha tinta quando é dita,
// abrindo da esquerda para a direita. O espaço entre palavras é margem fixa (nunca o caractere).
export const Escrita: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  estilo: React.CSSProperties;
  // cor final de cada palavra (padrão: tinta)
  tintaDe?: (i: number) => string;
  italicoDe?: (i: number) => boolean;
  espaco?: number;
  lapis?: string;
}> = ({ palavras, tempos, t, estilo, tintaDe, italicoDe, espaco, lapis = cor.lapis }) => {
  const tam = Number(estilo.fontSize ?? 48);
  const gap = espaco ?? tam * 0.26;
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "baseline", whiteSpace: "nowrap", ...estilo }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.32);
        const it = italicoDe?.(i) ?? false;
        return (
          <span
            key={`${w}-${i}`}
            style={{ position: "relative", display: "inline-block", marginRight: i < palavras.length - 1 ? gap : 0, fontStyle: it ? "italic" : undefined }}
          >
            {/* terminada a entrada, só o texto final, sem a camada a lápis nem a máscara */}
            <span style={{ color: p >= 1 ? (tintaDe?.(i) ?? cor.tinta) : lapis }}>{w}</span>
            {p > 0 && p < 1 ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  color: tintaDe?.(i) ?? cor.tinta,
                  // a máscara anda da esquerda (−12%) até passar da direita (+12%): cobre a inclinação do itálico
                  clipPath: `inset(-40% ${(1 - p) * 124 - 12}% -40% -12%)`,
                }}
              >
                {w}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// índices das palavras de `linhas` que pertencem ao trecho `destaque` (busca simples, por palavras)
export const indicesDoDestaque = (palavras: string[], destaque?: string) => {
  const set = new Set<number>();
  if (!destaque) return set;
  const d = destaque.split(/\s+/).map(normalizar);
  for (let i = 0; i + d.length <= palavras.length; i++) {
    if (d.every((w, k) => normalizar(palavras[i + k]) === w)) {
      for (let k = 0; k < d.length; k++) set.add(i + k);
      break;
    }
  }
  return set;
};

// Traço SVG que se desenha (use com pathLength={1}).
export const tracado = (p: number): { strokeDasharray: string; strokeDashoffset: number } => ({
  strokeDasharray: "1 1",
  strokeDashoffset: 1 - p,
});

// Número no formato brasileiro: 83.000 · 1,5 · 0,25
export const numeroBR = (v: number, casas = 0) => {
  const fixo = Math.abs(v).toFixed(casas);
  const [inteiro, decimal] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "−" : ""}${milhar}${decimal ? `,${decimal}` : ""}`;
};
