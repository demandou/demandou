import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento de cinema: lento para começar, assenta devagar. Nada de quique.
export const assenta = Easing.bezier(0.22, 1, 0.36, 1);
// para a câmera e as barras: acelera e desacelera como um carrinho de travelling
export const travelling = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
// (um `inicio` infinito — um passo que não existe — nunca acontece: devolve 0)
export const prog = (t: number, inicio: number, dur: number, easing = assenta) => {
  if (!Number.isFinite(inicio)) return inicio < 0 ? 1 : 0;
  return interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
};

// Progresso da saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.35) => prog(t, ate - dur, dur, saida);

// "Foco": a palavra entra desfocada e ganha nitidez, como um ajuste de foco da lente.
export const foco = (p: number, desfoque = 8, subida = 10): React.CSSProperties => ({
  opacity: p,
  filter: p >= 0.999 ? undefined : `blur(${((1 - p) * desfoque).toFixed(2)}px)`,
  translate: `0 ${((1 - p) * subida).toFixed(2)}px`,
});

// ——— tempo das palavras faladas, para textos que se montam no ritmo da fala ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Núcleo de uma palavra, para comparar a escrita da tela com a transcrição.
const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");

// Para um texto de n palavras que começa a ser falado em `em`: o instante de cada palavra.
// Casa as palavras da tela com as faladas a partir de `em` (pela ordem, tolerando uma palavra
// escrita diferente, como "dez" para "10"); as que sobram entram logo depois da anterior.
export const temposDasPalavras = (palavras: Palavra[], em: number, textos: string[], limite = Infinity) => {
  const faladas = palavras.filter((p) => p.em >= em - 0.15 && p.em < limite);
  const tempos: number[] = [];
  let j = 0;
  for (let i = 0; i < textos.length; i++) {
    const anterior = tempos[i - 1] ?? em;
    // procura a mesma palavra logo adiante (até 2 à frente); senão, usa a próxima da fila
    let achou = -1;
    for (let k = j; k < Math.min(faladas.length, j + 3); k++) {
      if (nucleo(faladas[k].w) === nucleo(textos[i])) {
        achou = k;
        break;
      }
    }
    const k = achou >= 0 ? achou : j < faladas.length ? j : -1;
    if (k >= 0) {
      tempos.push(Math.max(faladas[k].em, anterior));
      j = k + 1;
    } else tempos.push(anterior + 0.14);
  }
  if (tempos.length) tempos[0] = Math.min(tempos[0], Math.max(em, tempos[0] - 0.05));
  return tempos;
};
