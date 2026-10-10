import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de laudo: entra decidido e assenta, sem quique nem elástico.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
// trocas de quadro (a pessoa mudando de lugar, a chapa deslizando): macio nas duas pontas
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

// O painel do negatoscópio acendendo: sobe com duas pequenas oscilações (como lâmpada fria), sem
// clarão cru. Devolve a intensidade 0→1.
export const acender = (t: number, inicio: number) => {
  const p = prog(t, inicio, 0.42, Easing.out(Easing.quad));
  if (p >= 1) return 1;
  const tremido = Math.sin(p * Math.PI * 3) * 0.12 * (1 - p);
  return limitar(0.28 + 0.72 * p - tremido);
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
  "30": ["trinta"],
  "45": ["quarenta", "quarentaecinco"],
  "60": ["sessenta"],
  "90": ["noventa"],
};

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// a palavra escrita na tela corresponde à falada? ("3" ↔ "três", "pra" ↔ "para", "90°" ↔ "90")
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  if (!a) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.includes(b) || NUMEROS[b]?.includes(a)) return true;
  const pra = ["pra", "para", "pro", "para o"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto enxugado continua no ritmo).
// Nada entra antes de `inicio` (ex.: o instante em que a chapa chega).
// O texto pode ser dito bem depois do começo do momento (o apoio de um título, uma frase que vem
// depois de "Agora,…"): o ponto de partida da busca é o que casa mais palavras (em empate, o primeiro).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const ws = texto.split(/\s+/).filter(Boolean);
  const casar = (partida: number) => {
    const tempos: number[] = [];
    let cursor = partida;
    let casadas = 0;
    for (const w of ws) {
      const achou = faladas.findIndex((p, k) => k >= cursor && casa(w, p.w));
      const anterior = tempos[tempos.length - 1] ?? inicio - 0.12;
      if (achou >= 0 && achou - cursor <= 6) {
        tempos.push(Math.max(anterior + 0.04, inicio, faladas[achou].em - 0.05));
        cursor = achou + 1;
        casadas++;
      } else tempos.push(Math.max(inicio, anterior + 0.12));
    }
    return { tempos, casadas };
  };
  let melhor = casar(0);
  const primeiras = ws.slice(0, 2);
  faladas.forEach((p, k) => {
    if (k === 0 || !primeiras.some((w) => casa(w, p.w))) return;
    const r = casar(Math.max(0, k - 1));
    if (r.casadas > melhor.casadas) melhor = r;
  });
  return melhor.tempos;
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

// Palavra que se "revela" como um filme no revelador: nasce apagada (esboço), e no instante falado
// acende com um leve desfoque que assenta, passando pelo ciano até a cor final.
// O espaço entre palavras é uma margem fixa (nunca o caractere de espaço dentro do span animado).
export const Palavras: React.FC<{
  palavras: string[];
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "left" | "center" | "right";
  espaco?: string;
  // opacidade do esboço antes da fala (0 = invisível até ser dita)
  fantasma?: number;
  // quanto do risco (0–1) já passou por cima da palavra i (trecho riscado da frase)
  riscoDe?: (i: number) => number;
}> = ({ palavras, tempos, t, style, corDe, alinhar = "left", espaco = "0.28em", fantasma = 0.17, riscoDe }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
      ...style,
    }}
  >
    {palavras.map((w, i) => {
      const p = prog(t, tempos[i] ?? 0, 0.42);
      const final = corDe?.(i) ?? (style?.color as string | undefined) ?? cor.texto;
      const margem = i < palavras.length - 1 ? espaco : 0;
      // revelação terminada: o texto final é desenhado simples, sem desfoque nem deslocamento
      const risco = riscoDe?.(i) ?? 0;
      if (p >= 1) {
        return (
          <span key={`${w}-${i}`} style={{ display: "inline-block", position: "relative", marginRight: margem, color: final, opacity: risco > 0 ? 1 - 0.4 * risco : undefined }}>
            {w}
            {risco > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: "-0.06em",
                  top: "54%",
                  height: "0.09em",
                  width: `calc(${(risco * 100).toFixed(1)}% + 0.12em)`,
                  background: cor.tensao,
                  borderRadius: "0.05em",
                }}
              />
            ) : null}
          </span>
        );
      }
      // passa pelo ciano no meio da revelação e assenta na cor final
      const corAgora = p > 0 && p < 0.55 ? cor.ciano : final;
      return (
        <span
          key={`${w}-${i}`}
          style={{
            display: "inline-block",
            marginRight: margem,
            color: corAgora,
            opacity: fantasma + (1 - fantasma) * p,
            filter: p > 0 ? `blur(${((1 - p) * 7).toFixed(2)}px)` : undefined,
            translate: `0 ${((1 - p) * 0.06).toFixed(3)}em`,
          }}
        >
          {w}
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
  riscoDe?: (indiceGlobal: number) => number;
}> = ({ linhas, tempos, t, style, corDe, alinhar, fantasma, riscoDe }) => {
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
            corDe={corDe ? (j) => corDe(inicio + j) : undefined}
            riscoDe={riscoDe ? (j) => riscoDe(inicio + j) : undefined}
          />
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

// ---------- números em pt-BR ----------

// 83000 → "83.000"; 1.5 → "1,5" (casas fixas); sem Intl, para dar o mesmo resultado em qualquer máquina
export const formatarNumero = (valor: number, casas = 0) => {
  const negativo = valor < 0;
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteiro, decimal] = fixo.split(".");
  const milhares = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhares}${decimal ? `,${decimal}` : ""}`;
};

// casas decimais de um número escrito no plano (1.5 → 1; 83000 → 0)
export const casasDe = (valor: number) => {
  const s = String(valor);
  return s.includes(".") ? Math.min(3, s.split(".")[1].length) : 0;
};
