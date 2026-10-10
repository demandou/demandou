import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { fonte as fonteDoTexto } from "./tema";

// Movimento de carrossel: o deslize arranca rápido e assenta devagar, sem quique.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// o deslize de página: começa macio, corre no meio e freia longo (como um dedo que solta a página)
export const deslize = Easing.bezier(0.62, 0, 0.18, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

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
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra" ↔ "para")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
export const Palavras: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // cor por palavra (ênfase), opcional
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center";
}> = ({ palavras, tempos, t, style, corDe, alinhar = "left" }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", ...style }}>
    {palavras.map((w, i) => {
      const p = prog(t, tempos[i] ?? 0, 0.42);
      // terminada a entrada, a palavra é texto simples: sem a máscara (overflow) e sem o deslocamento
      const pronta = p >= 0.999;
      return (
        <span
          key={`${w}-${i}`}
          style={{
            display: "inline-block",
            overflow: pronta ? "visible" : "hidden",
            paddingBottom: "0.12em",
            marginBottom: "-0.12em",
            marginRight: i < palavras.length - 1 ? "0.24em" : 0,
          }}
        >
          <span style={{ display: "inline-block", translate: pronta ? undefined : `0 ${(1 - p) * 108}%`, color: corDe?.(i) }}>{w}</span>
        </span>
      );
    })}
  </div>
);

// Índices (nas palavras de um texto) do trecho exato `trecho` (destaque, risco), ou vazio.
export const marcar = (palavras: string[], trecho?: string) => {
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Texto já quebrado em linhas (medida.ts), montado palavra por palavra na fala. Cada linha fica
// numa linha só (a quebra é a da medida, nunca a do navegador). Opcional: cor por palavra e um
// sublinhado coral nas palavras de `sublinhado`, que corre da esquerda para a direita a partir de
// `sublinhadoEm`.
export const TextoFalado: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  peso: number;
  cor: string;
  entrelinha?: number;
  espacamento?: string;
  corDe?: (i: number) => string | undefined;
  sublinhado?: Set<number>;
  sublinhadoEm?: number;
  corSublinhado?: string;
  alinhar?: "left" | "center";
  style?: React.CSSProperties;
}> = ({ linhas, tempos, t, tamanho, peso, cor, entrelinha = 1.06, espacamento = "-0.02em", corDe, sublinhado, sublinhadoEm, corSublinhado, alinhar = "left", style }) => {
  const ordem = sublinhado ? [...sublinhado].sort((a, b) => a - b) : [];
  const pSub = ordem.length && sublinhadoEm !== undefined ? prog(t, sublinhadoEm, 0.45, Easing.inOut(Easing.cubic)) : 0;
  let cursor = 0;
  return (
    <div style={style}>
      {linhas.map((l, k) => {
        const ws = l.split(/\s+/).filter(Boolean);
        const base = cursor;
        cursor += ws.length;
        return (
          <div
            key={`${l}-${k}`}
            style={{
              display: "flex",
              flexWrap: "nowrap",
              justifyContent: alinhar === "center" ? "center" : "flex-start",
              fontFamily: fonteDoTexto,
              fontWeight: peso,
              fontSize: tamanho,
              lineHeight: entrelinha,
              height: tamanho * entrelinha,
              letterSpacing: espacamento,
              color: cor,
              whiteSpace: "nowrap",
            }}
          >
            {ws.map((w, j) => {
              const i = base + j;
              const p = prog(t, tempos[i] ?? 0, 0.42);
              const pronta = p >= 0.999;
              const sub = sublinhado?.has(i) ? Math.min(1, Math.max(0, pSub * ordem.length - ordem.indexOf(i))) : 0;
              return (
                <span key={`${w}-${j}`} style={{ position: "relative", display: "inline-block", marginRight: j < ws.length - 1 ? "0.24em" : 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      overflow: pronta ? "visible" : "hidden",
                      paddingBottom: "0.12em",
                      marginBottom: "-0.12em",
                      verticalAlign: "top",
                    }}
                  >
                    <span style={{ display: "inline-block", translate: pronta ? undefined : `0 ${(1 - p) * 108}%`, color: corDe?.(i) }}>{w}</span>
                  </span>
                  {sub > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: j < ws.length - 1 && sublinhado?.has(i + 1) ? "-0.24em" : 0,
                        top: tamanho * 0.98,
                        height: Math.max(7, Math.round(tamanho * 0.085)),
                        borderRadius: 99,
                        background: corSublinhado ?? "#E9684C",
                        transformOrigin: "left center",
                        scale: `${sub} 1`,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho). `largura` em unidades do viewBox.
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
