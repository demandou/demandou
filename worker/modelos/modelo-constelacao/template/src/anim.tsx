import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de observação: entra decidido e assenta (sem quique). `gira` é o movimento longo da
// câmera e da ocular — sai devagar, anda, chega devagar, como um telescópio sendo apontado.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const gira = Easing.bezier(0.55, 0, 0.25, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing: (x: number) => number = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #rrggbb
export const misturarCor = (a: string, b: string, p: number) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * limitar(p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Ruído determinístico 0–1 (cintilação das estrelas, campo de fundo)
export const ruido = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// algarismos e formas curtas casam com a palavra falada ("4" ↔ "quatro", "pra" ↔ "para")
const EQUIVALENTES: Record<string, string[]> = {
  "1": ["um", "uma"],
  "2": ["dois", "duas"],
  "3": ["tres"],
  "4": ["quatro"],
  "5": ["cinco"],
  "6": ["seis"],
  "7": ["sete"],
  "8": ["oito"],
  "9": ["nove"],
  "10": ["dez"],
  pra: ["para"],
  para: ["pra"],
};
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  return a === b || (EQUIVALENTES[a]?.includes(b) ?? false);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra que não foi dita (texto reescrito) entra logo depois da anterior.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = normalizar(w) ? faladas.findIndex((p, k) => k >= cursor && casa(w, p.w)) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.1);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.1);
  }
  return tempos;
};

// Texto que "acende" palavra por palavra, como estrelas aparecendo: cada palavra sai do quase
// apagado (rascunho) para a tinta cheia no instante em que é dita. Margem fixa entre palavras.
export const TextoAceso: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  // cor final e cor do rascunho
  cor: string;
  rascunho?: number;
  estilo?: React.CSSProperties;
  // índices de palavras com estilo próprio (ênfase)
  enfase?: Set<number>;
  estiloEnfase?: React.CSSProperties;
  // índice da primeira palavra deste trecho dentro de `tempos`
  offset?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
}> = ({ texto, tempos, t, cor: corFinal, rascunho = 0, estilo, enfase, estiloEnfase, offset = 0, alinhar = "flex-start" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: alinhar, whiteSpace: "nowrap", ...estilo }}>
      {palavras.map((w, i) => {
        const k = i + offset;
        const p = prog(t, (tempos[k] ?? 0) - 0.02, 0.32);
        // acabada a entrada, a palavra é desenhada simples (sem opacidade nem deslocamento)
        const pronta = p >= 1;
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              marginRight: i < palavras.length - 1 ? "0.25em" : 0,
              color: corFinal,
              opacity: pronta ? undefined : rascunho + (1 - rascunho) * p,
              translate: pronta ? undefined : `0 ${(1 - p) * 0.12}em`,
              ...(enfase?.has(k) ? estiloEnfase : null),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
