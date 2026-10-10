import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de prancha: a câmera corre pelo papel com curva simétrica; o que entra assenta sem quique.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const corre = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

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

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.28) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #RRGGBB
export const misturarCor = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * limitar(p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// Traço de pena que se desenha sozinho (p de 0 a 1 ao longo do caminho), pontas arredondadas.
// `escala` compensa o zoom da câmera: o traço fica com a mesma espessura na tela.
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number; escala?: number; tracejado?: string } & Omit<
    React.SVGProps<SVGPathElement>,
    "d" | "stroke" | "strokeWidth"
  >
> = ({ d, p = 1, cor: c, largura, escala = 1, tracejado, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999;
  return (
    <path
      d={d}
      fill="none"
      stroke={c}
      strokeWidth={largura / escala}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial && !tracejado ? 1 : undefined}
      strokeDasharray={tracejado ?? (parcial ? `${p} 1` : undefined)}
      {...resto}
    />
  );
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+]/g, "");

const NUMEROS: Record<string, string[]> = {
  "1": ["um", "uma"],
  "2": ["dois", "duas"],
  "3": ["tres"],
  "4": ["quatro"],
  "5": ["cinco"],
  "+1": ["mais"],
};

// equivalências comuns entre o que se escreve na tela e o que a transcrição devolve
const MESMA = (a: string, b: string) =>
  a === b ||
  (a === "pra" && b === "para") ||
  (a === "para" && b === "pra") ||
  (a === "pro" && b === "para") ||
  (NUMEROS[a]?.includes(b) ?? false) ||
  (NUMEROS[b]?.includes(a) ?? false);

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Palavras ditas antes de `inicio` (o texto ainda não estava legível) entram em cascata a partir dele.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.4 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && MESMA(alvo, normalizar(p.w))) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 9) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos.map((x, i) => Math.max(x, inicio + i * 0.06));
};

// índices das palavras de `palavras` que formam o trecho `destaque` (primeira ocorrência)
export const indicesDoDestaque = (palavras: string[], destaque?: string) => {
  const marcadas = new Set<number>();
  const alvo = destaque ? destaque.split(/\s+/).filter(Boolean).map(normalizar) : [];
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Texto de prancha: cada palavra já está escrita a lápis (grafite) e a tinta passa por cima,
// da esquerda para a direita, no instante em que é dita. O destaque ganha itálico verde-musgo
// e uma aguada clara por trás. O espaço entre palavras é margem fixa (não o caractere de espaço).
export const Escrita: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  peso?: number;
  italico?: boolean;
  destaque?: string;
  corTinta?: string;
  // opacidade do esboço a lápis (0 = ainda não há esboço)
  lapis?: number;
  alinhar?: "left" | "center";
  entrelinha?: number;
  familia: string;
  estilo?: React.CSSProperties;
  // trecho riscado à pena em garança, palavra por palavra, a partir de `riscoEm`
  risco?: string;
  riscoEm?: number;
}> = ({ linhas, tempos, t, tamanho, peso = 700, italico, destaque, corTinta = cor.tinta, lapis = 1, alinhar = "left", entrelinha = 1.04, familia, estilo, risco, riscoEm }) => {
  const todas = linhas.flatMap((l) => l.split(/\s+/).filter(Boolean));
  const marcadas = indicesDoDestaque(todas, destaque);
  const riscadas = [...indicesDoDestaque(todas, risco)];
  const primeiraRiscada = riscadas.length ? Math.min(...riscadas) : 0;
  let k = 0;
  return (
    <div style={{ fontFamily: familia, fontSize: tamanho, fontWeight: peso, lineHeight: entrelinha, textAlign: alinhar, ...estilo }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start" }}>
          {linha
            .split(/\s+/)
            .filter(Boolean)
            .map((w, wi, arr) => {
              const i = k++;
              const p = prog(t, tempos[i] ?? 0, 0.34, corre);
              const dest = marcadas.has(i);
              const it = italico || dest;
              const aguada = dest ? prog(t, (tempos[i] ?? 0) + 0.12, 0.5) : 0;
              const riscado = riscoEm !== undefined && riscadas.includes(i) ? prog(t, riscoEm + (i - primeiraRiscada) * 0.12, 0.3, corre) : 0;
              return (
                <span
                  key={`${w}-${wi}`}
                  style={{ position: "relative", display: "inline-block", marginRight: wi < arr.length - 1 ? "0.26em" : 0, fontStyle: it ? "italic" : "normal" }}
                >
                  {dest && aguada > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.12em",
                        right: "-0.14em",
                        top: "0.42em",
                        height: "0.5em",
                        background: cor.folha,
                        opacity: 0.32,
                        borderRadius: "0.3em 0.5em 0.4em 0.6em",
                        transformOrigin: "left center",
                        scale: `${aguada} 1`,
                      }}
                    />
                  ) : null}
                  {riscado > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.06em",
                        right: wi < arr.length - 1 && riscadas.includes(i + 1) ? "-0.3em" : "-0.06em",
                        top: "0.5em",
                        height: "0.075em",
                        background: cor.garanca,
                        borderRadius: "0.05em",
                        transformOrigin: "left center",
                        scale: `${riscado} 1`,
                        zIndex: 2,
                      }}
                    />
                  ) : null}
                  {p >= 0.999 ? (
                    // palavra pronta: só o texto final, sem a camada de lápis nem a máscara da entrada
                    <span style={{ position: "relative", color: riscado > 0.5 ? misturarCor(corTinta, cor.grafite, 0.45) : dest ? cor.musgo : corTinta }}>{w}</span>
                  ) : (
                    <>
                      <span style={{ position: "relative", color: cor.grafite, opacity: lapis * (1 - p * 0.9) }}>{w}</span>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          color: dest ? cor.musgo : corTinta,
                          clipPath: `inset(-0.3em ${(1 - p) * 104}% -0.3em -0.1em)`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w}
                      </span>
                    </>
                  )}
                </span>
              );
            })}
        </div>
      ))}
    </div>
  );
};
