import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { DADOS, type Palavra } from "./dados";

/**
 * O TEMPO DA CENA: todo movimento sai do quadro da composição (aulas 7, 8.1 e
 * 8.2 e remotion-best-practices): nada de CSS animation, transition, useFrame
 * ou relógio próprio. E todo instante sai da FALA: `dito("palavra")` devolve
 * o segundo em que a palavra começa a ser dita no corte, e a cena entra nele.
 */

/** As curvas da casa (as mesmas das provas das aulas). */
export const SAIDA = Easing.bezier(0.16, 1, 0.3, 1);
export const ENTRADA = Easing.bezier(0.7, 0, 0.84, 0);
export const MEIO = Easing.bezier(0.65, 0, 0.35, 1);
/** Empurrão sem quique (remotion-best-practices: spring com damping 200). */
export const MOLA = Easing.spring({ damping: 200 });

/** O quadro e o segundo atuais. */
export function useTempo() {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { f, t: f / fps, fps };
}

/** 0 → 1 entre os instantes a e b (segundos), preso nas pontas, com a curva dada. */
export const k = (t: number, a: number, b: number, curva: (x: number) => number = SAIDA) =>
  interpolate(t, [a, Math.max(a + 1e-3, b)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Entrada, permanência e saída de um elemento entre `de` e `ate` (segundos):
 * `entrada` vai de 0 a 1 em `entra` s, `saida` de 0 a 1 nos últimos `sai` s,
 * e `visivel` é o produto (0 fora da janela). A aula 8.2 pede preparação,
 * entrada, permanência e saída com tempo de leitura.
 */
export function janela(t: number, de: number, ate: number, entra = 0.4, sai = 0.35) {
  const entrada = k(t, de, de + entra, SAIDA);
  const saida = k(t, ate - sai, ate, ENTRADA);
  return { entrada, saida, visivel: t < de || t > ate ? 0 : entrada * (1 - saida) };
}

/** Média móvel centrada de uma série (rastro do rosto ou da cabeça). */
export const suavizar = (serie: number[], meia: number) =>
  serie.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - meia); j <= Math.min(serie.length - 1, i + meia); j++) {
      s += serie[j];
      n++;
    }
    return s / n;
  });

// ─────────────────────────── a fala ───────────────────────────

/** A palavra sem acento, sem pontuação e em minúscula ("Excelência," vira "excelencia"). */
export function normalizar(w: string): string {
  return w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A n-ésima vez (1, 2, ...) em que a frase é dita: o índice da primeira palavra e o da última. */
export function acharNaFala(palavras: Palavra[], frase: string, n = 1): { i: number; j: number } | null {
  const alvo = normalizar(frase).split(" ").filter(Boolean);
  if (!alvo.length) return null;
  const ditas = palavras.map((p) => normalizar(p.w).split(" ").filter(Boolean));
  // a fala achatada em tokens, lembrando de qual palavra veio cada um
  const tokens: { t: string; i: number }[] = [];
  ditas.forEach((ts, i) => ts.forEach((t) => tokens.push({ t, i })));
  let vez = 0;
  for (let a = 0; a + alvo.length <= tokens.length; a++) {
    let ok = true;
    for (let b = 0; b < alvo.length; b++) {
      if (tokens[a + b].t !== alvo[b]) {
        ok = false;
        break;
      }
    }
    if (ok && ++vez === n) return { i: tokens[a].i, j: tokens[a + alvo.length - 1].i };
  }
  return null;
}

/**
 * O segundo em que a frase COMEÇA a ser dita (a n-ésima vez). A frase pode ter
 * mais de uma palavra ("estica a corda"); acento, caixa e pontuação não contam.
 * Frase que não está na fala é erro (o portão do worker confere antes do render).
 */
export function dito(frase: string, n = 1): number {
  const r = acharNaFala(DADOS.palavras, frase, n);
  if (!r) throw new Error(`"${frase}" (vez ${n}) não está na fala do corte`);
  return DADOS.palavras[r.i].de;
}

/** O segundo em que a frase TERMINA de ser dita (a n-ésima vez). */
export function ditoAte(frase: string, n = 1): number {
  const r = acharNaFala(DADOS.palavras, frase, n);
  if (!r) throw new Error(`"${frase}" (vez ${n}) não está na fala do corte`);
  return DADOS.palavras[r.j].ate;
}

/** As palavras ditas entre dois instantes (para a legenda ou um título que repete a fala). */
export function falaEntre(de: number, ate: number): string {
  return DADOS.palavras
    .filter((p) => p.de >= de - 0.02 && p.de < ate)
    .map((p) => p.w)
    .join(" ");
}
