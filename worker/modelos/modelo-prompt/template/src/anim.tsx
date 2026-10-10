import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de peça: chega decidida e assenta, sem quique nem elástico.
export const chega = Easing.bezier(0.16, 1, 0.3, 1);
// troca de layout: arranca e freia por igual
export const desliza = Easing.bezier(0.65, 0, 0.35, 1);
const sai = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = chega) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso de uma saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.25) => prog(t, ate - dur, dur, sai);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export type Ret = { x: number; y: number; w: number; h: number };
export const misturaRet = (a: Ret, b: Ret, p: number): Ret => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

// Mistura de duas cores hex (#RRGGBB)
export const misturaCor = (a: string, b: string, p: number) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = ca.map((v, i) => Math.round(mistura(v, cb[i], limitar(p))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
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
  if (NUMEROS[a]?.includes(b)) return true;
  const pra = ["pra", "para"];
  return pra.includes(a) && pra.includes(b);
};

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas do trecho.
// A primeira palavra pode estar em qualquer ponto do trecho (o texto pode começar no meio da fala);
// entre ela e as seguintes, no máximo 6 palavras faladas de distância. Palavra não achada entra logo
// depois da anterior (texto enxugado continua no ritmo da fala).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.3 && p.em < ate + 0.1);
  const escritas = texto.split(/\s+/).filter(Boolean);
  const tempos: number[] = [];
  let cursor = 0;
  escritas.forEach((w, n) => {
    let achou = -1;
    if (n === 0) {
      // o primeiro lugar em que a palavra e as duas seguintes batem com a fala (ou só ela)
      let melhor = -1;
      let pontos = -1;
      faladas.forEach((p, k) => {
        if (!casa(w, p.w)) return;
        let ok = 0;
        let j = k + 1;
        for (const prox of escritas.slice(1, 3)) {
          const a = faladas.findIndex((q, i) => i >= j && i <= j + 2 && casa(prox, q.w));
          if (a < 0) break;
          ok++;
          j = a + 1;
        }
        if (ok > pontos) {
          pontos = ok;
          melhor = k;
        }
      });
      achou = melhor;
    } else {
      const k = faladas.findIndex((p, i) => i >= cursor && casa(w, p.w));
      if (k >= 0 && k - cursor <= 6) achou = k;
    }
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.03));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  });
  return tempos;
};

// Cursor de texto: um traço fino, que pisca quando ninguém está digitando.
export const Cursor: React.FC<{ cor: string; t: number; piscando: boolean; visivel?: number }> = ({ cor, t, piscando, visivel = 1 }) => {
  const aceso = piscando ? (Math.floor(t / 0.42) % 2 === 0 ? 1 : 0) : 1;
  return (
    <span style={{ display: "inline-block", width: 0, height: "1em", position: "relative", verticalAlign: "top" }}>
      <span
        style={{
          position: "absolute",
          left: "0.04em",
          top: "0.1em",
          width: "0.075em",
          height: "1.05em",
          borderRadius: 2,
          background: cor,
          opacity: aceso * visivel,
        }}
      />
    </span>
  );
};

// Texto digitado no ritmo da fala: cada palavra começa no seu tempo e as letras entram uma a uma
// (≈0,03 s por letra). O que ainda não foi digitado ocupa o lugar invisível, então nada pula de linha.
// O espaço entre palavras é uma margem fixa.
export const Digitado: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  estilo?: React.CSSProperties;
  corCursor?: string;
  // o cursor some a partir deste instante
  cursorAte?: number;
  // cor por palavra (índice), opcional
  corDe?: (i: number) => string | undefined;
  alinhar?: "flex-start" | "center" | "flex-end";
}> = ({ texto, tempos, t, estilo, corCursor, cursorAte = Infinity, corDe, alinhar = "flex-start" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  let ultima = -1;
  palavras.forEach((_, i) => {
    if (t >= (tempos[i] ?? Infinity)) ultima = i;
  });
  const fimDaUltima = ultima >= 0 ? tempos[ultima] + palavras[ultima].length * 0.03 : 0;
  const mostraCursor = corCursor && t < cursorAte && ultima >= 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar, ...estilo }}>
      {palavras.map((w, i) => {
        const inicio = tempos[i] ?? Infinity;
        const n = t < inicio ? 0 : Math.min(w.length, Math.floor((t - inicio) / 0.03) + 1);
        return (
          <span key={`${w}-${i}`} style={{ marginRight: i < palavras.length - 1 ? "0.27em" : 0, whiteSpace: "pre", color: corDe?.(i) }}>
            <span>{w.slice(0, n)}</span>
            {mostraCursor && i === ultima ? <Cursor cor={corCursor} t={t} piscando={t > fimDaUltima + 0.15} /> : null}
            <span style={{ opacity: 0 }}>{w.slice(n)}</span>
          </span>
        );
      })}
    </div>
  );
};

// Palavras que entram no seu tempo subindo de leve (títulos montados na fala).
export const PalavraPorPalavra: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  estilo?: React.CSSProperties;
  corDe?: (i: number) => string | undefined;
  alinhar?: "flex-start" | "center" | "flex-end";
}> = ({ texto, tempos, t, estilo, corDe, alinhar = "flex-start" }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar, ...estilo }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, 0.3);
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              marginRight: i < palavras.length - 1 ? "0.25em" : 0,
              whiteSpace: "pre",
              opacity: p,
              translate: `0 ${(1 - p) * 0.3}em`,
              color: corDe?.(i),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Índices das palavras de `texto` que pertencem ao trecho `destaque` (para colorir)
export const indicesDoTrecho = (texto: string, destaque?: string) => {
  if (!destaque) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  const ds = destaque.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; i + ds.length <= ws.length; i++) {
    if (ds.every((d, k) => ws[i + k] === d)) return new Set(ds.map((_, k) => i + k));
  }
  return new Set<number>();
};
