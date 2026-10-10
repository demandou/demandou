import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento do Funil: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// troca de lugar (a pessoa encolhe para o bloco, o bloco desce): macio nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
// queda dos pontos: acelera como algo que cai e assenta no lugar
export const queda = Easing.bezier(0.55, 0, 0.25, 1);
// contador: acelera e desacelera como um número sendo apurado
export const apuracao = Easing.bezier(0.4, 0, 0.2, 1);
const sai = Easing.in(Easing.cubic);

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

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Pulso de alerta: 0→1→0 a cada `periodo` segundos, a partir de `inicio` (0 antes dele)
export const pulso = (t: number, inicio: number, periodo = 0.56) => {
  if (t < inicio) return 0;
  const fase = ((t - inicio) % periodo) / periodo;
  return Math.sin(fase * Math.PI) ** 2;
};

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
  "20": ["vinte"],
  "30": ["trinta"],
  "50": ["cinquenta"],
  "100": ["cem", "cento"],
  "1000": ["mil"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("10" ↔ "dez", "pra" ↔ "para")
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
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Nada entra antes de `inicio`.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.12));
  }
  return tempos;
};

// Quando um trecho (uma ou mais palavras) é dito, dentro de [de, ate]; undefined se não achar
export const quandoDiz = (trecho: string | undefined, palavras: Palavra[], de: number, ate: number) => {
  if (!trecho) return undefined;
  const alvo = trecho.split(/\s+/).filter(Boolean);
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  for (let i = 0; i + alvo.length <= faladas.length; i++) {
    if (alvo.every((w, k) => casa(w, faladas[i + k].w))) return faladas[i].em;
  }
  return undefined;
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

// Texto que se monta palavra por palavra: cada palavra sobe de trás de uma régua, no seu tempo.
// Antes de ser dita, a palavra já aparece "a lápis" (apagada), então o cartão nunca está vazio
// e o texto não pula de lugar. O espaço entre palavras é uma margem fixa.
export const Palavras: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  espaco?: string;
  fantasma?: number;
  // índice inicial (quando o texto vem quebrado em linhas)
  base?: number;
  extra?: (i: number) => React.ReactNode;
  // até este instante todas as palavras aparecem acesas (o primeiro quadro vira a capa do post)
  capa?: number;
}> = ({ palavras, tempos, t, style, corDe, alinhar = "left", espaco = "0.25em", fantasma = 0.2, base = 0, extra, capa = -1 }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
      ...style,
    }}
  >
    {palavras.map((w, j) => {
      const i = base + j;
      const p = t < capa ? 1 : prog(t, tempos[i] ?? 0, 0.34);
      // Terminada a subida, a palavra é desenhada como texto simples, sem a camada de máscara:
      // duas camadas montadas (esboço + máscara) às vezes saíam com a palavra "acesa" sumida
      // em quadros capturados. Antes da subida, só o esboço.
      const acesa = p >= 0.999;
      const subindo = p > 0.001 && !acesa;
      return (
        <span
          key={`${w}-${i}`}
          style={{
            position: "relative",
            display: "inline-block",
            marginRight: j < palavras.length - 1 ? espaco : 0,
          }}
        >
          <span style={{ display: "inline-block", opacity: acesa ? 1 : fantasma * (1 - p), color: acesa ? corDe?.(i) : undefined }}>{w}</span>
          {subindo ? (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                display: "inline-block",
                overflow: "hidden",
                paddingBottom: "0.12em",
                marginBottom: "-0.12em",
              }}
            >
              <span style={{ display: "inline-block", translate: `0 ${(1 - p) * 105}%`, color: corDe?.(i) }}>{w}</span>
            </span>
          ) : null}
          {extra?.(i)}
        </span>
      );
    })}
  </div>
);

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

// Pseudo-aleatório determinístico (o mesmo plano gera sempre o mesmo vídeo)
export const aleatorio = (semente: number) => {
  let s = Math.floor(semente * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
