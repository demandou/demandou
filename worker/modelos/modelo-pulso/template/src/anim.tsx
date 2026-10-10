import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de relógio esportivo: entra decidido e trava no lugar, sem quique.
export const trava = Easing.bezier(0.16, 0.92, 0.24, 1);
// trocas de layout: arranca e freia
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
export const saida = Easing.in(Easing.cubic);
export const linear = (x: number) => x;

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing: (x: number) => number = trava) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export type Ret = { x: number; y: number; w: number; h: number };
export const misturaRet = (a: Ret, b: Ret, p: number): Ret => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

// Mistura duas cores #RRGGBB
export const misturaCor = (a: string, b: string, p: number) => {
  const c = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  const v = [0, 1, 2].map((i) => Math.round(mistura(c(a, i), c(b, i), limitar(p))));
  return `#${v.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto", "quarta"],
  "5": ["cinco", "quinto", "quinta"],
  "10": ["dez"],
  "20": ["vinte"],
  "30": ["trinta"],
  "70": ["setenta"],
  "80": ["oitenta"],
  "90": ["noventa"],
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
  // "80%" escrito casa com "80%" ou "oitenta" falado
  const semPct = (s: string) => s.replace(/pct$|porcento$/, "");
  if (semPct(a) === semPct(b)) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
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

// Texto que se monta palavra por palavra: cada palavra entra no seu tempo, subindo um pouco e
// acendendo. Antes disso ela espera "a lápis" na cor `esboco` (ou não aparece, sem esboço); na hora,
// a palavra a lápis se apaga subindo enquanto a cheia acende no lugar. Terminada a entrada, a
// palavra é desenhada como texto simples (uma camada só, sem deslocamento): o quadro capturado
// nunca pega uma palavra "acesa" pela metade. O espaço entre palavras é margem fixa.
export const Palavras: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // cor de cada palavra (índice global: `inicio` + posição na linha)
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  esboco?: string;
  // some palavra por palavra a partir deste instante (opcional)
  saiEm?: number;
  // índice global da primeira palavra desta linha
  inicio?: number;
  // risco sobre a palavra (0 = nada, 1 = riscada inteira), pelo índice global
  risco?: (i: number) => number;
  corRisco?: string;
}> = ({ texto, tempos, t, style, corDe, alinhar = "left", esboco, saiEm, inicio = 0, risco, corRisco = "#EE3D2F" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
        ...style,
      }}
    >
      {palavras.map((w, i) => {
        const g = inicio + i;
        const p = prog(t, tempos[i] ?? 0, 0.26);
        const s = saiEm === undefined ? 0 : prog(t, saiEm + i * 0.03, 0.22, saida);
        const r = risco ? limitar(risco(g)) : 0;
        const margem = i < palavras.length - 1 ? "0.24em" : 0;
        const traco =
          r > 0.001 ? (
            <span
              style={{
                position: "absolute",
                left: "-0.06em",
                right: "-0.06em",
                top: "0.56em",
                height: "0.09em",
                borderRadius: "0.05em",
                background: corRisco,
                transformOrigin: "left center",
                scale: `${r} 1`,
              }}
            />
          ) : null;
        // texto simples: antes de entrar (só o esboço) e depois de entrar (só a palavra)
        if (p >= 1 && s <= 0) {
          return (
            <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem, color: corDe?.(g) }}>
              {w}
              {traco}
            </span>
          );
        }
        if (p <= 0) {
          return (
            <span key={`${w}-${i}`} style={{ display: "inline-block", marginRight: margem, color: esboco, opacity: esboco ? 1 : 0 }}>
              {w}
            </span>
          );
        }
        // sem esboço, a palavra que ainda não foi dita não aparece
        const cheia = esboco ? Math.min(1, p * 1.8) : p;
        return (
          <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: margem }}>
            {esboco ? (
              <span style={{ display: "inline-block", color: esboco, opacity: Math.max(0, 1 - p * 2.2) * (1 - s), translate: `0 ${-p * 18}%` }}>{w}</span>
            ) : null}
            <span
              style={{
                display: "inline-block",
                position: esboco ? "absolute" : undefined,
                left: 0,
                top: 0,
                opacity: cheia * (1 - s),
                translate: `0 ${(1 - p) * 34 - s * 30}%`,
                color: corDe?.(g),
              }}
            >
              {w}
            </span>
            {traco}
          </span>
        );
      })}
    </div>
  );
};

// Um bloco de texto já encaixado (medida.ts → encaixar): uma linha por div, cada palavra no seu
// tempo. `tempos` tem um tempo por palavra do texto inteiro.
export const Linhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  x: number;
  y: number;
  largura: number;
  alturaLinha: number;
  estilo: React.CSSProperties;
  alinhar?: "left" | "center" | "right";
  esboco?: string;
  corDe?: (i: number) => string | undefined;
  risco?: (i: number) => number;
  corRisco?: string;
}> = ({ linhas, tempos, t, x, y, largura, alturaLinha, estilo, alinhar, esboco, corDe, risco, corRisco }) => {
  let cursor = 0;
  return (
    <>
      {linhas.map((l, i) => {
        const n = l.split(/\s+/).filter(Boolean).length;
        const inicio = cursor;
        cursor += n;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: x, width: largura, top: y + i * alturaLinha, lineHeight: `${alturaLinha}px`, whiteSpace: "nowrap", ...estilo }}
          >
            <Palavras
              texto={l}
              tempos={tempos.slice(inicio, inicio + n)}
              t={t}
              alinhar={alinhar}
              esboco={esboco}
              corDe={corDe}
              inicio={inicio}
              risco={risco}
              corRisco={corRisco}
              style={{ flexWrap: "nowrap" }}
            />
          </div>
        );
      })}
    </>
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

// Número de mostrador: cada caractere numa casa de largura fixa, para o contador não "dançar".
// Dígitos ocupam `casa` (em frações do corpo); ":" "," "." e espaços ocupam menos.
export const Digitos: React.FC<{ texto: string; tamanho: number; style?: React.CSSProperties; casa?: number }> = ({
  texto,
  tamanho,
  style,
  casa = 0.6,
}) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", ...style }}>
    {[...texto].map((c, i) => {
      const estreito = /[:.,\s]/.test(c);
      return (
        <span key={i} style={{ display: "inline-block", width: tamanho * (estreito ? 0.28 : /[0-9]/.test(c) ? casa : 0.62), textAlign: "center" }}>
          {c}
        </span>
      );
    })}
  </span>
);

// Divide um texto em até `n` linhas equilibradas (a mais longa o mais curta possível), sem
// deixar palavra curta ("e", "de", "na") no fim de uma linha.
const CURTAS = new Set("a o e é de da do na no em um uma pra se que com por".split(" "));
export const quebrar = (texto: string, n: number): string[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  if (n <= 1 || ws.length <= 1) return [ws.join(" ")];
  let melhor: string[] = [ws.join(" ")];
  let nota = Infinity;
  const tentar = (cortes: number[]) => {
    const linhas: string[] = [];
    let ini = 0;
    for (const c of [...cortes, ws.length]) {
      linhas.push(ws.slice(ini, c).join(" "));
      ini = c;
    }
    const pendurada = cortes.some((c) => CURTAS.has(ws[c - 1].toLowerCase()));
    // quebrar depois de vírgula ou ponto é natural: ganha folga
    const naPausa = cortes.filter((c) => /[,.;:!?]$/.test(ws[c - 1])).length;
    const v = Math.max(...linhas.map((l) => l.length)) + (pendurada ? 6 : 0) - naPausa * 5;
    if (v < nota) {
      nota = v;
      melhor = linhas;
    }
  };
  for (let a = 1; a < ws.length; a++) {
    if (n === 2) tentar([a]);
    else for (let b = a + 1; b < ws.length; b++) tentar([a, b]);
  }
  return melhor;
};

// Pace "m:ss" ↔ segundos
export const lerPace = (s?: string) => {
  const m = (s ?? "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const escreverPace = (seg: number) => {
  const total = Math.max(0, Math.round(seg));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
