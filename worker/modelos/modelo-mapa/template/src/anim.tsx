import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de caderno: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// a câmera deslizando pelo papel e o cartão da pessoa mudando de lugar: macio nas duas pontas
export const desliza = Easing.bezier(0.65, 0, 0.35, 1);
// traço de caneta: começa rápido e termina devagar
export const caneta = Easing.bezier(0.33, 0, 0.2, 1);
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
  "15": ["quinze"],
  "20": ["vinte"],
  "30": ["trinta"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("7" ↔ "sete", "pra" ↔ "para")
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
  // com `inicio` depois do `de` (o `em` do bloco), só valem as palavras ditas a partir dele
  const desde = Math.max(de, inicio) - 0.35;
  const faladas = palavras.filter((p) => p.em >= desde && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
    const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(Math.max(inicio, anterior + 0.12));
  }
  return tempos;
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

// ---------- escrita ----------
// Texto que se escreve palavra por palavra: cada palavra já está no papel "a lápis" (esboço claro) e a
// tinta passa por cima, da esquerda para a direita, no instante em que é dita. O trecho em destaque
// ganha o marca-texto logo depois; o trecho `apagado` fica a lápis; o `riscado` leva um traço por cima.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro de um span animado).
export const Escrita: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  estilo: React.CSSProperties;
  tamanho: number;
  alinhar?: "left" | "center";
  destaque?: Set<number>;
  apagado?: Set<number>;
  riscado?: Set<number>;
  riscaEm?: number;
  // opacidade do esboço a lápis antes da fala (0 = sem esboço)
  esboco?: number;
  entrelinha?: number;
}> = ({ linhas, tempos, t, estilo, tamanho, alinhar = "left", destaque, apagado, riscado, riscaEm, esboco = 1, entrelinha = 1.08 }) => {
  const espaco = tamanho * 0.26;
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start" }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += ws.length;
        // o risco atravessa as palavras riscadas desta linha, da primeira à última
        const riscadas = ws.map((_, j) => riscado?.has(inicio + j) ?? false);
        return (
          <div key={`${linha}-${li}`} style={{ display: "flex", alignItems: "baseline", height: tamanho * entrelinha, position: "relative" }}>
            {ws.map((w, j) => {
              const i = inicio + j;
              const em = tempos[i] ?? 0;
              const p = prog(t, em, 0.3, caneta);
              const marcada = destaque?.has(i);
              const pm = marcada ? prog(t, em + 0.12, 0.32, caneta) : 0;
              // o marca-texto emenda com a próxima palavra marcada (cobre o espaço entre elas)
              const emenda = marcada && destaque?.has(i + 1) && j < ws.length - 1;
              const lapis = apagado?.has(i);
              const pr = riscadas[j] && riscaEm !== undefined ? prog(t, riscaEm + j * 0.06, 0.24, caneta) : 0;
              // terminada a escrita, a palavra é desenhada uma vez só, sem a camada de esboço nem a máscara
              const pronta = p >= 0.999;
              return (
                <span key={`${w}-${j}`} style={{ position: "relative", display: "inline-block", marginRight: j < ws.length - 1 ? espaco : 0, whiteSpace: "nowrap" }}>
                  {marcada ? (
                    <span
                      style={{
                        position: "absolute",
                        left: -tamanho * 0.08,
                        right: emenda ? -espaco - 1 : -tamanho * 0.08,
                        top: "18%",
                        bottom: "2%",
                        background: cor.marca,
                        borderRadius: tamanho * 0.06,
                        transformOrigin: "left center",
                        transform: `scaleX(${pm}) skewX(-4deg)`,
                        mixBlendMode: "multiply",
                      }}
                    />
                  ) : null}
                  {pronta ? (
                    <span style={{ ...estilo, fontSize: tamanho, color: lapis ? cor.lapis : (estilo.color ?? cor.tinta), position: "relative" }}>{w}</span>
                  ) : (
                    <>
                      {/* esboço a lápis: o lugar da palavra já está no papel */}
                      <span style={{ ...estilo, fontSize: tamanho, color: cor.esboco, opacity: esboco * (1 - p), position: "relative" }}>{w}</span>
                      {/* a tinta passa por cima, da esquerda para a direita */}
                      {p > 0 ? (
                        <span
                          style={{
                            ...estilo,
                            fontSize: tamanho,
                            position: "absolute",
                            left: 0,
                            top: 0,
                            color: lapis ? cor.lapis : (estilo.color ?? cor.tinta),
                            clipPath: `inset(-20% ${((1 - p) * 104).toFixed(2)}% -20% -4%)`,
                            translate: `0 ${(1 - p) * tamanho * 0.06}px`,
                          }}
                        >
                          {w}
                        </span>
                      ) : null}
                    </>
                  )}
                  {pr > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: -tamanho * 0.04,
                        width: `calc(${pr * 100}% + ${(riscadas[j + 1] ? espaco : tamanho * 0.08) * pr}px)`,
                        top: "56%",
                        height: Math.max(5, tamanho * 0.075),
                        background: cor.tinta,
                        borderRadius: 4,
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

// Curva suave de um ponto a outro (ramo de mapa mental): sai na horizontal e chega na horizontal,
// ou na vertical quando `vertical` for true.
export const ramo = (x1: number, y1: number, x2: number, y2: number, vertical = false) => {
  if (vertical) {
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

// ---------- números em pt-BR ----------

// 83000 → "83.000"; 1.5 com 1 casa → "1,5"
export const formatarNumero = (valor: number, casas = 0) => {
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteiro, decimal] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "−" : ""}${milhar}${decimal ? `,${decimal}` : ""}`;
};

// casas decimais de um número escrito no plano (1.5 → 1)
export const casasDe = (valor: number) => {
  const s = String(valor);
  const i = s.indexOf(".");
  return i < 0 ? 0 : Math.min(3, s.length - i - 1);
};
