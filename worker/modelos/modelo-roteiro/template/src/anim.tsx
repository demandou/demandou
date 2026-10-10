import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de viagem: entra decidido e assenta (sem quique); deslocamentos longos com ida e chegada suaves.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const viaja = Easing.bezier(0.6, 0, 0.3, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing: (x: number) => number = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Mistura duas cores #rrggbb
export const misturarCor = (a: string, b: string, p: number) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * limitar(p)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// números escritos em algarismo casam com a palavra falada ("1" ↔ "um/uma", "28" ↔ "28")
const POR_EXTENSO: Record<string, string[]> = {
  "1": ["um", "uma"],
  "2": ["dois", "duas"],
  "3": ["tres"],
  "4": ["quatro"],
  "5": ["cinco"],
  "pra": ["para"],
  "para": ["pra"],
};
const casa = (escrita: string, falada: string) => {
  const a = normalizar(escrita);
  const b = normalizar(falada);
  return a === b || (POR_EXTENSO[a]?.includes(b) ?? false);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const achou = normalizar(w) ? faladas.findIndex((p, k) => k >= cursor && casa(w, p.w)) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.06));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  return tempos;
};

// Índices das palavras de `texto` que formam o trecho `trecho` (a primeira ocorrência).
export const indicesDoTrecho = (texto: string, trecho?: string) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// A assinatura do Roteiro: o texto já está escrito "a lápis" (cinza claro) e cada palavra ganha
// tinta no instante em que é dita, com um assentar curto. Sempre há o que ler; nada aparece vazio.
export const TextoALapis: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  // cor da tinta e da ênfase
  tinta: string;
  lapis: string;
  style?: React.CSSProperties;
  destaque?: Set<number>;
  estiloDestaque?: React.CSSProperties;
  corDestaque?: string;
  // 0–1: o rascunho a lápis aparece junto com o cartão
  rascunho?: number;
  // palavras riscadas (índices) e o progresso do risco (0–1), na cor `corRisco`
  risco?: Set<number>;
  riscoP?: number;
  corRisco?: string;
}> = ({ linhas, tempos, t, tinta, lapis, style, destaque, estiloDestaque, corDestaque, rascunho = 1, risco, riscoP = 0, corRisco }) => {
  let k = -1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ...style }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap" }}>
          {linha
            .split(/\s+/)
            .filter(Boolean)
            .map((w, wi, arr) => {
              k++;
              const p = prog(t, (tempos[k] ?? 0) - 0.02, 0.28);
              const marcada = destaque?.has(k);
              const riscada = risco?.has(k) && riscoP > 0;
              return (
                <span
                  key={`${w}-${wi}`}
                  style={{
                    display: "inline-block",
                    marginRight: wi < arr.length - 1 ? "0.24em" : 0,
                    color: misturarCor(lapis, marcada && corDestaque ? corDestaque : tinta, p),
                    opacity: (0.6 + 0.4 * p) * rascunho,
                    translate: `0 ${(1 - p) * 0.06}em`,
                    ...(marcada ? estiloDestaque : null),
                    ...(riscada ? { color: misturarCor(marcada && corDestaque ? corDestaque : tinta, corRisco ?? tinta, riscoP) } : null),
                    position: "relative",
                  }}
                >
                  {w}
                  {riscada ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.06em",
                        top: "54%",
                        height: "0.075em",
                        width: `${limitar(riscoP * (arr.length > 1 ? 1 : 1)) * 112}%`,
                        borderRadius: "0.04em",
                        background: corRisco ?? tinta,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
        </div>
      ))}
    </div>
  );
};
