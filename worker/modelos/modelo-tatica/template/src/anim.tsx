import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de arte de TV: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// troca de quadro (a caixa da pessoa, o empurrão de câmera para o gol): macio nas duas pontas
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
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

// ---------- tarjas de TV ----------
// Regra do modelo: texto nunca aparece cortado. A tarja entra varrendo da esquerda para a direita,
// mas só o FUNDO é recortado; o texto por cima aparece inteiro quando o fundo já abriu. Na saída a
// tarja inteira desliza e some (nada de varredura cortando letras).
export const varredura = (p: number, raio = 12) => `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0 round ${raio}px)`;
export const conteudoDaTarja = (p: number): React.CSSProperties => ({
  opacity: limitar((p - 0.5) / 0.4),
  translate: `${(1 - p) * -16}px 0`,
});
export const saidaDaTarja = (s: number): React.CSSProperties => ({
  opacity: 1 - s,
  translate: `${-56 * s}px 0`,
});

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
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Nada entra antes de `inicio` (ex.: o instante em que a prancheta aparece).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.06));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.12));
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
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  espaco?: string;
  // opacidade do "esboço": a palavra já aparece apagada antes de ser dita e acende na fala
  fantasma?: number;
  // palavras riscadas (índices locais) com um traço que cresce de 0 a 1 (`pRisco`) na cor `corRisco`
  riscadas?: Set<number>;
  pRisco?: number;
  corRisco?: string;
}> = ({ palavras, tempos, t, style, corDe, alinhar = "left", espaco = "0.26em", fantasma = 0, riscadas, pRisco = 0, corRisco }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
      ...style,
    }}
  >
    {palavras.map((w, i) => {
      const p = prog(t, tempos[i] ?? 0, 0.36);
      return (
        <span
          key={`${w}-${i}`}
          style={{
            display: "inline-block",
            overflow: "hidden",
            paddingBottom: "0.1em",
            marginBottom: "-0.1em",
            marginRight: i < palavras.length - 1 ? espaco : 0,
            position: "relative",
          }}
        >
          {riscadas?.has(i) && pRisco > 0 ? (
            <span style={{ position: "absolute", left: 0, top: "50%", height: "0.09em", width: `${pRisco * 100}%`, background: corRisco ?? "currentColor", zIndex: 2 }} />
          ) : null}
          {fantasma > 0 ? (
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ display: "inline-block", opacity: fantasma * (1 - p) }}>{w}</span>
              <span style={{ position: "absolute", left: 0, top: 0, display: "inline-block", translate: `0 ${(1 - p) * 108}%`, color: corDe?.(i) }}>{w}</span>
            </span>
          ) : (
            <span style={{ display: "inline-block", translate: `0 ${(1 - p) * 108}%`, color: corDe?.(i) }}>{w}</span>
          )}
        </span>
      );
    })}
  </div>
);

// Linhas já quebradas, cada palavra no seu tempo (os tempos seguem a ordem das palavras no texto)
export const Linhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (indiceGlobal: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  fantasma?: number;
  // índices (globais) das palavras riscadas, o progresso do risco e a cor do traço
  riscadas?: Set<number>;
  pRisco?: number;
  corRisco?: string;
}> = ({ linhas, tempos, t, style, corDe, alinhar, fantasma, riscadas, pRisco, corRisco }) => {
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", ...style }}>
      {linhas.map((linha, i) => {
        const palavras = linha.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += palavras.length;
        return (
          <Palavras
            key={`${linha}-${i}`}
            palavras={palavras}
            tempos={tempos.slice(inicio, inicio + palavras.length)}
            t={t}
            alinhar={alinhar}
            fantasma={fantasma}
            riscadas={riscadas ? new Set(palavras.map((_, j) => j).filter((j) => riscadas.has(inicio + j))) : undefined}
            pRisco={pRisco}
            corRisco={corRisco}
            corDe={corDe ? (j) => corDe(inicio + j) : undefined}
          />
        );
      })}
    </div>
  );
};

// índices (na sequência de palavras do texto) que pertencem a um trecho em destaque
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
