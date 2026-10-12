import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ESPACO } from "./medidas";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de instrumento: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// troca de modo do painel (as peças deslizam juntas): macio nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
// ponteiro: acelera e freia como um ponteiro de verdade (sem passar do ponto)
export const ponteiro = Easing.bezier(0.45, 0, 0.2, 1);
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

// Pisca de luz de painel: acesa/apagada com borda macia (nunca um corte seco de 1 quadro)
export const pisca = (t: number, inicio: number, periodo = 0.8) => {
  if (t < inicio) return 0;
  const fase = ((t - inicio) % periodo) / periodo;
  // 55% acesa, 45% apagada, com 0,06 s de rampa
  const r = 0.06 / periodo;
  if (fase < r) return fase / r;
  if (fase < 0.55) return 1;
  if (fase < 0.55 + r) return 1 - (fase - 0.55) / r;
  return 0;
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
  "11": ["onze"],
  "12": ["doze"],
  "15": ["quinze"],
  "20": ["vinte"],
  "30": ["trinta"],
  "50": ["cinquenta"],
  "100": ["cem"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita corresponde à falada? ("3" ↔ "três", "pra" ↔ "para", "pro" ↔ "para o")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para", "pro"];
  if (pra.includes(a) && pra.includes(b)) return true;
  // flexões ("encosta" ↔ "encoste", "acesos" ↔ "acesa")
  return a.length >= 5 && b.length >= 5 && a.slice(0, -1) === b.slice(0, -1);
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

// a primeira palavra falada (dentro do trecho) que casa com uma das opções
export const quandoDiz = (palavras: Palavra[], opcoes: string[], de: number, ate: number) =>
  palavras.find((p) => p.em >= de - 0.05 && p.em <= ate && opcoes.some((o) => normalizar(o) === normalizar(p.w)))?.em;

// Índices das palavras de `texto` que formam o trecho `trecho` (destaque, risco), comparando sem
// acento e sem pontuação. Trecho não achado = nenhuma palavra.
export const palavrasDoTrecho = (texto: string, trecho?: string): number[] => {
  if (!trecho) return [];
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar).filter(Boolean);
  if (!alvo.length) return [];
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return alvo.map((_, k) => i + k);
  }
  return [];
};

export type Marca = { tipo: "sublinha" | "risca"; em: number; continua: boolean };

// Texto que se ACENDE palavra por palavra, como letreiro de painel: cada palavra já está lá apagada
// (o "esboço" atrás do vidro fumê) e acende no instante em que é dita, com um assentamento curto.
// O espaço entre palavras é margem fixa (nunca o caractere de espaço dentro do span animado).
// Terminada a entrada, a palavra é desenhada simples (sem deslocamento): o texto final fica limpo.
// `marcas`: sublinhado (destaque) ou risco (o trecho riscado apaga) que se desenha no instante dado.
export const Acende: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  alinhar?: "left" | "center" | "right";
  // opacidade da palavra ainda não dita
  fantasma?: number;
  corDe?: (i: number) => string | undefined;
  entrelinha?: number;
  marcas?: (i: number) => Marca | undefined;
}> = ({ linhas, tempos, t, style, alinhar = "left", fantasma = 0.2, corDe, entrelinha, marcas }) => {
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start", ...style }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += ws.length;
        return (
          <div key={`${linha}-${li}`} style={{ display: "flex", whiteSpace: "nowrap", lineHeight: entrelinha }}>
            {ws.map((w, j) => {
              const i = inicio + j;
              const p = prog(t, tempos[i] ?? 0, 0.26);
              const pronta = p >= 0.999;
              const marca = marcas?.(i);
              const pm = marca ? prog(t, marca.em, 0.32) : 0;
              const riscada = marca?.tipo === "risca" ? pm : 0;
              const continua = marca?.continua && j < ws.length - 1;
              return (
                <span
                  key={`${w}-${j}`}
                  style={{
                    position: marca ? "relative" : undefined,
                    display: "inline-block",
                    marginRight: j < ws.length - 1 ? `${ESPACO}em` : 0,
                    opacity: pronta ? 1 : mistura(fantasma, 1, p),
                    translate: pronta ? undefined : `0 ${(1 - p) * 0.12}em`,
                    color: p > 0.02 ? corDe?.(i) : undefined,
                  }}
                >
                  {riscada > 0 ? <span style={{ opacity: 1 - 0.58 * riscada }}>{w}</span> : w}
                  {marca && pm > 0.001 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        width: `calc(${pm * 100}% + ${continua ? pm * ESPACO : 0}em)`,
                        height: marca.tipo === "risca" ? "0.085em" : "0.075em",
                        top: marca.tipo === "risca" ? "47%" : undefined,
                        bottom: marca.tipo === "sublinha" ? "-0.1em" : undefined,
                        borderRadius: 3,
                        background: cor.marfim,
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

// As marcas de um texto: o destaque sublinha quando é dito; o risco risca em `riscoEm` (ou quando é dito)
export const marcasDe = (texto: string, tempos: number[], destaque?: string, risco?: string, riscoEm?: number) => {
  const d = palavrasDoTrecho(texto, destaque);
  const r = palavrasDoTrecho(texto, risco);
  return (i: number): Marca | undefined => {
    const ir = r.indexOf(i);
    if (ir >= 0) return { tipo: "risca", em: (riscoEm ?? tempos[r[r.length - 1]] ?? 0) + ir * 0.06, continua: ir < r.length - 1 };
    const id = d.indexOf(i);
    if (id >= 0) return { tipo: "sublinha", em: (tempos[i] ?? 0) + 0.05, continua: id < d.length - 1 };
    return undefined;
  };
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
