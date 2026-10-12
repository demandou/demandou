import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento do álbum: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// troca de lugar (a figurinha da pessoa muda de coluna, cresce, volta ao quadro cheio)
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
// a mão que bate o carimbo: acelera e para seco
export const batida = Easing.bezier(0.55, 0, 0.9, 0.45);
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

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra"/"pro" ↔ "para")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "pro", "para", "pras", "pros"];
  if (pra.includes(a) && pra.includes(b)) return true;
  // "uva-passa" escrita junta ↔ "uva" "passa" falados: casa pela primeira parte
  return a.length > 3 && b.length > 2 && a.startsWith(b) && /-/.test(escrita);
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

// Texto que se monta palavra por palavra, como tinta sobre o esboço a lápis: cada palavra já está
// escrita em lápis claro (nada de espaço vazio) e ganha a cor da tinta quando é dita, subindo um
// pouco. O espaço entre palavras é margem fixa (nunca o caractere de espaço no span animado).
// Terminada a entrada de uma palavra, ela é desenhada uma vez só, como texto simples (sem a camada
// do esboço por baixo). `risco`: trecho riscado à mão em framboesa a partir de `em`.
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // cor de cada palavra quando dita (índice na sequência do texto)
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  espaco?: string;
  // quebras de linha: índices das palavras que começam uma linha nova (de `encaixar`)
  quebras?: number[];
  // cor do esboço (null = sem esboço: a palavra só aparece quando é dita)
  esboco?: string | null;
  risco?: { indices: Set<number>; em: number; cor?: string };
}> = ({ texto, tempos, t, style, corDe, alinhar = "left", espaco = "0.27em", quebras = [], esboco = cor.lapisClaro, risco }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: number[][] = [[]];
  palavras.forEach((_, i) => {
    if (quebras.includes(i) && linhas[linhas.length - 1].length) linhas.push([]);
    linhas[linhas.length - 1].push(i);
  });
  const justify = alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start";
  // o risco avança palavra a palavra ao longo de 0,45 s
  const riscados = risco ? palavras.map((_, i) => i).filter((i) => risco.indices.has(i)) : [];
  const pRisco = risco ? prog(t, risco.em, 0.45, Easing.inOut(Easing.quad)) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: justify, ...style }}>
      {linhas.map((linha, n) => (
        <div key={n} style={{ display: "flex", flexWrap: quebras.length ? "nowrap" : "wrap", justifyContent: justify, whiteSpace: "nowrap" }}>
          {linha.map((i, k) => {
            const w = palavras[i];
            const p = prog(t, tempos[i] ?? 0, 0.32);
            const final = corDe?.(i);
            const margem = k < linha.length - 1 ? espaco : 0;
            const r = riscados.indexOf(i);
            const traco =
              r >= 0 && pRisco > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    left: "-0.06em",
                    top: "0.5em",
                    height: "0.11em",
                    borderRadius: "0.06em",
                    background: risco?.cor ?? cor.carimbo,
                    // o traço cobre a palavra e o espaço até a próxima riscada
                    width: `calc((100% + ${riscados.includes(i + 1) && k < linha.length - 1 ? espaco : "0.12em"}) * ${limitar(pRisco * riscados.length - r)})`,
                    rotate: "-1.2deg",
                  }}
                />
              ) : null;
            if (p >= 1)
              return (
                <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem, color: final }}>
                  {w}
                  {traco}
                </span>
              );
            if (p <= 0)
              return (
                <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem, color: esboco ?? "transparent" }}>
                  {w}
                </span>
              );
            return (
              <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem }}>
                {esboco ? <span style={{ color: esboco, opacity: 1 - p }}>{w}</span> : <span style={{ opacity: 0 }}>{w}</span>}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    color: final,
                    opacity: p,
                    translate: `0 ${(1 - p) * 0.22}em`,
                  }}
                >
                  {w}
                </span>
                {traco}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Traço SVG que se desenha (p de 0 a 1 ao longo do caminho).
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number } & Omit<React.SVGProps<SVGPathElement>, "d" | "stroke" | "strokeWidth">
> = ({ d, p = 1, cor: c, largura, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999;
  return (
    <path
      d={d}
      fill="none"
      stroke={c}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={parcial ? `${p} 1` : undefined}
      {...resto}
    />
  );
};

// Ruído determinístico (0–1) para pequenas variações fixas (inclinação das figurinhas etc.)
export const acaso = (semente: number) => {
  const x = Math.sin(semente * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
