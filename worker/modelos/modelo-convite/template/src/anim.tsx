import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de papelaria: o papel pousa decidido e assenta, sem quicar.
export const pousa = Easing.bezier(0.16, 1, 0.3, 1);
// troca de layout (o convite encolhe para o canto, a foto troca de lado): curva simétrica e firme
export const troca = Easing.bezier(0.65, 0, 0.3, 1);
// a pena escrevendo: começa e termina macio
export const pena = Easing.bezier(0.45, 0.05, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = pousa) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// ruído determinístico (sem Math.random: cada quadro renderiza igual em qualquer máquina)
export const ruido = (x: number) => {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---------- texto falado ----------

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma", "primeiro", "primeira"],
  "2": ["dois", "duas", "segundo", "segunda"],
  "3": ["tres", "terceiro", "terceira"],
  "4": ["quatro", "quarto"],
  "5": ["cinco", "quinto"],
  "6": ["seis", "sexto"],
  "7": ["sete", "setimo"],
  "8": ["oito", "oitavo"],
  "9": ["nove", "nono"],
  "10": ["dez", "decimo"],
  "12": ["doze"],
  "15": ["quinze"],
  "18": ["dezoito"],
  "20": ["vinte"],
  "24": ["vinte"],
  "30": ["trinta"],
};
// formas faladas que a transcrição escreve diferente ("pro" ↔ "para", "pra" ↔ "para")
const EQUIVALENTES: string[][] = [
  ["pra", "para"],
  ["pro", "para"],
  ["pros", "para"],
  ["pras", "para"],
  ["ta", "esta"],
  ["ce", "voce"],
];

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pro" ↔ "para")
export const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  return EQUIVALENTES.some((par) => (par[0] === a && par[1] === b) || (par[1] === a && par[0] === b));
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo da fala).
export const temposDoTexto = (txt: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of txt.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
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

// ---------- escrita ----------

// Tinta que corre da esquerda para a direita, como a pena no papel. `p` de 0 a 1.
// Com `esboco`, o texto já está escrito a lápis (cor clara) antes de ganhar tinta.
export const Tinta: React.FC<{
  p: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  esboco?: string;
}> = ({ p, children, style, esboco }) => {
  const recorte = p < 0.999 ? `inset(-0.4em ${((1 - p) * 104).toFixed(2)}% -0.4em -0.3em)` : undefined;
  if (!esboco) {
    return <span style={{ display: "inline-block", clipPath: recorte, opacity: p <= 0.001 ? 0 : 1, ...style }}>{children}</span>;
  }
  // terminada a escrita, só o texto final, sem a camada de máscara por cima (nada some num quadro)
  if (p >= 0.999) {
    return (
      <span style={{ display: "inline-block", position: "relative" }}>
        <span style={style}>{children}</span>
      </span>
    );
  }
  return (
    <span style={{ display: "inline-block", position: "relative" }}>
      <span style={{ ...style, color: esboco }}>{children}</span>
      <span
        style={{
          ...style,
          position: "absolute",
          left: 0,
          top: 0,
          whiteSpace: "nowrap",
          clipPath: recorte,
          opacity: p <= 0.001 ? 0 : 1,
        }}
      >
        {children}
      </span>
    </span>
  );
};

// Linha de palavras que se escrevem, cada uma no seu instante. A margem entre palavras é fixa
// (nunca o espaço dentro de um span animado). `estiloDe` muda o estilo de uma palavra (índice).
export const Escrita: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  estiloDe?: (i: number) => React.CSSProperties | undefined;
  dur?: number;
  esboco?: string;
  espaco?: string;
  alinhar?: "center" | "flex-start";
}> = ({ palavras, tempos, t, style, estiloDe, dur = 0.32, esboco, espaco = "0.26em", alinhar = "center" }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar, alignItems: "baseline", columnGap: espaco, ...style }}>
    {palavras.map((w, i) => (
      <Tinta key={`${w}-${i}`} p={prog(t, tempos[i] ?? 0, dur, pena)} esboco={esboco} style={estiloDe?.(i)}>
        {w}
      </Tinta>
    ))}
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
