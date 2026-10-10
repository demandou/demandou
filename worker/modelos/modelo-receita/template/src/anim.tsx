import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de cozinha bem-feita: entra decidido e assenta devagar, sem quique.
export const assenta = Easing.bezier(0.16, 1, 0.3, 1);
// troca de layout (a janela da pessoa muda de canto, a ficha sobe): curva simétrica e firme
export const troca = Easing.bezier(0.7, 0, 0.22, 1);
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

// Progresso de uma saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #RRGGBB
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(mistura(v, pb[i], limitar(p)))).join(",")})`;
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
  "12": ["doze"],
  "15": ["quinze"],
  "20": ["vinte"],
  "30": ["trinta"],
  "100": ["cem"],
  "200": ["duzentos", "duzentas"],
};
// formas faladas que a transcrição escreve por extenso ("pra" ↔ "para", "pro" ↔ "para o")
const EQUIVALENTES: string[][] = [
  ["pra", "para"],
  ["pro", "para"],
  ["pros", "para"],
  ["pras", "para"],
  ["ta", "esta"],
  ["to", "estou"],
  ["ce", "voce"],
];

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra" ↔ "para")
export const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  return EQUIVALENTES.some((par) => par[0] === a && par[1] === b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo da fala).
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

// índices das palavras que pertencem ao trecho (primeira ocorrência)
export const indicesDoTrecho = (palavras: string[], trecho?: string) => {
  const marcadas = new Set<number>();
  if (!trecho) return marcadas;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Uma palavra que se escreve: abre da esquerda para a direita (como a mão escrevendo na ficha)
// e assenta descendo um fio. A margem entre palavras é fixa (nunca o espaço dentro do span).
// Com `esboco`, a palavra já está escrita "a lápis" (cor clara) antes de ser dita.
export const PalavraEscrita: React.FC<{
  w: string;
  p: number;
  ultima: boolean;
  style?: React.CSSProperties;
  esboco?: string;
}> = ({ w, p, ultima, style, esboco }) => {
  const margem = ultima ? 0 : "0.24em";
  // terminada a entrada, o texto final é simples: um span só, sem máscara e sem a camada do esboço
  if (p >= 0.999) return <span style={{ display: "inline-block", marginRight: margem, ...style }}>{w}</span>;
  // antes de ser dita: só o esboço a lápis (ou o lugar vazio, do mesmo tamanho)
  if (p <= 0.001) {
    return <span style={{ display: "inline-block", marginRight: margem, ...style, ...(esboco ? { color: esboco, backgroundImage: "none" } : { opacity: 0 }) }}>{w}</span>;
  }
  const tinta = (
    <span
      style={{
        display: "inline-block",
        clipPath: p < 0.999 ? `inset(-0.35em ${((1 - p) * 104).toFixed(2)}% -0.35em -0.12em)` : undefined,
        translate: `0 ${((1 - p) * -0.06).toFixed(3)}em`,
        opacity: p <= 0.001 ? 0 : 1,
        ...style,
        ...(esboco ? { position: "absolute", left: 0, top: 0 } : {}),
      }}
    >
      {w}
    </span>
  );
  if (!esboco) return <span style={{ display: "inline-block", marginRight: ultima ? 0 : "0.24em" }}>{tinta}</span>;
  return (
    <span style={{ display: "inline-block", position: "relative", marginRight: ultima ? 0 : "0.24em" }}>
      <span style={{ ...style, color: esboco, opacity: 1 - p, backgroundImage: "none" }}>{w}</span>
      {tinta}
    </span>
  );
};

// Linhas de texto que se escrevem palavra por palavra no tempo da fala.
// `tempos` tem um instante por palavra (todas as linhas, na ordem).
export const Escrita: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // estilo extra por palavra (índice global)
  estiloDe?: (i: number) => React.CSSProperties | undefined;
  alinhar?: "left" | "center" | "right";
  dur?: number;
  // cor do esboço a lápis (o texto inteiro aparece claro antes de ser dito)
  esboco?: string;
}> = ({ linhas, tempos, t, style, estiloDe, alinhar = "left", dur = 0.34, esboco }) => {
  let k = 0;
  const alinhamento = alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhamento, ...style }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        return (
          <div key={`${li}-${linha}`} style={{ display: "flex", whiteSpace: "nowrap" }}>
            {ws.map((w, wi) => {
              const i = k++;
              return (
                <PalavraEscrita
                  key={`${w}-${wi}`}
                  w={w}
                  p={prog(t, tempos[i] ?? 0, dur)}
                  ultima={wi === ws.length - 1}
                  style={estiloDe?.(i)}
                  esboco={esboco}
                />
              );
            })}
          </div>
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

// ruído determinístico (sem Math.random: cada quadro renderiza igual em qualquer máquina)
export const ruido = (x: number) => {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
