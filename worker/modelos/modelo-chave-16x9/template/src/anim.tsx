import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de objeto de verdade: entra decidido e assenta, sem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// trocas de quadro (a porta da pessoa muda de lugar): macio nas duas pontas
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
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate - dur, dur, sai);
// Saída que COMEÇA em `inicio` (o instante da troca): o que sai cruza com o que entra.
export const saida = (t: number, inicio: number, dur = 0.32) => prog(t, inicio, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// O balanço de uma etiqueta pendurada que acabou de ser posta no gancho: um pêndulo amortecido
// curto (duas idas e voltas visíveis, cada vez menores) que assenta em ~1 s. Graus.
export const balanco = (t: number, inicio: number, amplitude = 9, periodo = 0.62, amortece = 0.3) => {
  const d = t - inicio;
  if (d <= 0) return 0;
  return amplitude * Math.exp(-d / amortece) * Math.sin((2 * Math.PI * d) / periodo + 0.35);
};

// Número que conta de `de` até `para` entre `inicio` e `inicio + dur`.
export const contar = (t: number, inicio: number, dur: number, de: number, para: number) =>
  Math.round(mistura(de, para, prog(t, inicio, dur, Easing.out(Easing.cubic))));

export const reais = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;

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
// Nada entra antes de `inicio`.
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

// Texto que se monta palavra por palavra. Cada palavra já está escrita "a lápis" (apagada) e ganha
// tinta quando é dita, subindo um pouco. O espaço entre palavras é uma margem fixa (nunca o caractere
// de espaço dentro do span animado).
export const Palavras: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  espaco?: string;
  // opacidade do esboço antes da palavra ser dita (0 = invisível até ser dita)
  esboco?: number;
}> = ({ palavras, tempos, t, style, corDe, alinhar = "left", espaco = "0.26em", esboco = 0.22 }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
      ...style,
    }}
  >
    {palavras.map((w, i) => {
      const p = prog(t, tempos[i] ?? 0, 0.34);
      const margem = i < palavras.length - 1 ? espaco : 0;
      // terminada a entrada, a palavra é texto simples (sem a camada do esboço nem o deslocamento)
      if (p >= 1)
        return (
          <span key={`${w}-${i}`} style={{ display: "inline-block", marginRight: margem, color: corDe?.(i), whiteSpace: "nowrap" }}>
            {w}
          </span>
        );
      return (
        <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem }}>
          <span style={{ display: "inline-block", opacity: esboco * (1 - p), whiteSpace: "nowrap" }}>{w}</span>
          {p > 0 ? (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                display: "inline-block",
                opacity: p,
                translate: `0 ${(1 - p) * 0.22}em`,
                color: corDe?.(i),
                whiteSpace: "nowrap",
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

// Linhas já quebradas, cada palavra no seu tempo (os tempos seguem a ordem das palavras no texto)
export const Linhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (indiceGlobal: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  esboco?: number;
}> = ({ linhas, tempos, t, style, corDe, alinhar, esboco }) => {
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
            esboco={esboco}
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

// Quebra um texto em linhas de até `max` caracteres (sem cortar palavra).
export const quebrar = (texto: string, max: number) => {
  const linhas: string[] = [];
  let atual = "";
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    if (atual && (atual + " " + w).length > max) {
      linhas.push(atual);
      atual = w;
    } else atual = atual ? `${atual} ${w}` : w;
  }
  if (atual) linhas.push(atual);
  return linhas;
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
