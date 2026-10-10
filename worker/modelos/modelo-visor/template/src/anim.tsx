import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de câmera: entra decidido e assenta, sem quique (como um motor de foco que para no ponto).
export const assenta = Easing.bezier(0.2, 0.9, 0.22, 1);
// troca de lugar da pessoa e dos cartões: arranca e freia
export const desliza = Easing.bezier(0.65, 0, 0.35, 1);
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

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
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

const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
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
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
// Terminada a entrada, a palavra vira texto simples (sem a máscara que fez a subida).
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center";
  // cor do esboço: a frase espera "a lápis" nesta cor e cada palavra ganha corpo quando é dita
  esboco?: string;
  // instante em que a palavra i é riscada (traço que corre da esquerda para a direita)
  riscoDe?: (i: number) => number | undefined;
  corRisco?: string;
}> = ({ texto, tempos, t, style, corDe, alinhar = "left", esboco, riscoDe, corRisco = "#FF6B57" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", ...style }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.34);
        const margem = i < palavras.length - 1 ? "0.26em" : 0;
        const rEm = riscoDe?.(i);
        const risco =
          rEm !== undefined && t >= rEm ? (
            <span
              style={{
                position: "absolute",
                left: "-0.04em",
                right: i < palavras.length - 1 && riscoDe?.(i + 1) !== undefined ? "-0.3em" : "-0.04em",
                top: "54%",
                height: "0.095em",
                borderRadius: "0.05em",
                background: corRisco,
                transformOrigin: "left",
                scale: `${prog(t, rEm, 0.32)} 1`,
              }}
            />
          ) : null;
        if (p >= 1) {
          return (
            <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", paddingBottom: "0.14em", marginBottom: "-0.14em", marginRight: margem, color: corDe?.(i) }}>
              {w}
              {risco}
            </span>
          );
        }
        return (
          <span
            key={`${w}-${i}`}
            style={{
              position: "relative",
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.14em",
              marginBottom: "-0.14em",
              marginRight: margem,
            }}
          >
            {esboco ? <span style={{ display: "inline-block", color: esboco, opacity: 1 - p }}>{w}</span> : null}
            <span
              style={{
                display: "inline-block",
                position: esboco ? "absolute" : undefined,
                left: 0,
                top: 0,
                translate: `0 ${(1 - p) * 105}%`,
                color: corDe?.(i),
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
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

// Número que rola como um contador mecânico (o dígito novo sobe por baixo)
export const Rolante: React.FC<{ de: string; para: string; p: number; style?: React.CSSProperties }> = ({ de, para, p, style }) => (
  <span style={{ position: "relative", display: "inline-block", overflow: "hidden", verticalAlign: "bottom", ...style }}>
    <span style={{ display: "inline-block", visibility: "hidden" }}>{para.length >= de.length ? para : de}</span>
    <span style={{ position: "absolute", left: 0, top: 0, translate: `0 ${-p * 100}%`, opacity: 1 - p }}>{de}</span>
    <span style={{ position: "absolute", left: 0, top: 0, translate: `0 ${(1 - p) * 100}%`, opacity: p }}>{para}</span>
  </span>
);
