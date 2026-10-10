import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de revista se remontando: sai decidido e assenta devagar, sem quique.
export const assenta = Easing.bezier(0.16, 1, 0.3, 1);
// Remontagem do mosaico: todos os blocos andam juntos, com a mesma curva simétrica.
export const remonta = Easing.bezier(0.7, 0, 0.2, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = assenta) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #RRGGBB
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mistura(v, pb[i], limitar(p)))).join(",")})`;
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo da fala).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.4 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? de;
    if (achou >= 0 && achou - cursor <= 8) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos;
};

// índices das palavras de `texto` que pertencem ao trecho `trecho` (primeira ocorrência)
export const indicesDoTrecho = (palavras: string[], trecho?: string) => {
  const marcadas = new Set<number>();
  if (!trecho) return marcadas;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Uma palavra que se revela da esquerda para a direita (uma cortina que abre, lendo-se na ordem)
// e assenta subindo de leve. Margem fixa entre palavras (nunca depende do espaço em branco).
export const PalavraQueEncaixa: React.FC<{
  w: string;
  p: number;
  ultima: boolean;
  style?: React.CSSProperties;
}> = ({ w, p, ultima, style }) => (
  <span
    style={{
      display: "inline-block",
      verticalAlign: "top",
      marginRight: ultima ? 0 : "0.24em",
      // terminada a entrada, a palavra é desenhada simples (sem máscara nem deslocamento)
      clipPath: p < 0.999 ? `inset(-0.3em ${((1 - p) * 104).toFixed(2)}% -0.3em -0.1em)` : undefined,
      translate: p < 0.999 ? `0 ${((1 - p) * 0.14).toFixed(3)}em` : undefined,
      opacity: p <= 0.001 ? 0 : 1,
      ...style,
    }}
  >
    {w}
  </span>
);

// Número que conta, com vírgula decimal
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
