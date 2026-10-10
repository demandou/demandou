import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de sistema: janelas abrem rápido e assentam macio, sem quique.
export const sistema = Easing.bezier(0.2, 0.85, 0.25, 1);
// arrasto do mouse: arranca e freia (mesma curva da caixa da pessoa no motor)
export const arrasto = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = sistema) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;

// Troca de momento sem quadro vazio e sem dupla exposição: a janela nova abre já na fronteira
// (opaca logo no começo, por cima da que sai) enquanto a pessoa muda de lugar; a que sai fecha
// por trás dela. `fim` já vem ajustado pela Edicao (fimDaJanela): quando o que entra não é uma
// janela que cobre a velha (teclas, cartão), a velha fecha antes de o novo aparecer.
export const janelaAberta = (t: number, de: number, fim: number) => prog(t, de - 0.02, 0.42) * (1 - saindo(t, fim + 0.2, 0.25));
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
      tempos.push(Math.max(anterior, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos;
};

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center";
  // cor do esboço: a frase espera "a lápis" nesta cor e cada palavra ganha corpo quando é dita
  esboco?: string;
}> = ({ texto, tempos, t, style, corDe, alinhar = "left", esboco }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", ...style }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.36);
        // terminada a animação, a palavra é desenhada simples (sem máscara nem a camada do esboço)
        if (p >= 0.999)
          return (
            <span
              key={`${w}-${i}`}
              style={{ display: "inline-block", paddingBottom: "0.14em", marginBottom: "-0.14em", marginRight: i < palavras.length - 1 ? "0.25em" : 0, color: corDe?.(i) }}
            >
              {w}
            </span>
          );
        return (
          <span
            key={`${w}-${i}`}
            style={{
              position: "relative",
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: "0.14em",
              marginBottom: "-0.14em",
              marginRight: i < palavras.length - 1 ? "0.25em" : 0,
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

// Texto digitado: cada palavra é teclada (letra a letra, rápido) a partir do instante em que é dita.
// Devolve quantos caracteres de cada palavra já apareceram.
export const digitado = (texto: string, tempos: number[], t: number, porLetra = 0.028) =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      const inicio = tempos[i] ?? 0;
      if (t < inicio) return "";
      return w.slice(0, Math.min(w.length, 1 + Math.floor((t - inicio) / porLetra)));
    });

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
