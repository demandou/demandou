import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

// O movimento do Reação é o de um feed: desliza e assenta, sem quicar.
export const desliza = Easing.bezier(0.22, 1, 0.36, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const rolagem = Easing.bezier(0.7, 0, 0.2, 1);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = desliza) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Entrada de uma linha/item: sobe 24 px e aparece. Terminada, devolve estilo vazio
// (o texto fica desenhado simples, sem camada de animação por cima).
export const entrada = (t: number, em: number, dur = 0.3): React.CSSProperties | null => {
  if (t < em) return null;
  if (t >= em + dur) return {};
  const p = prog(t, em, dur);
  return { opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 24}px)` };
};

// ——— tempo das palavras faladas, para textos que se montam no ritmo da fala ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Instante de cada palavra de `texto`: procura a mesma sequência na fala a partir de `em`;
// palavra que não foi dita igual entra logo depois da anterior (ritmo de 0,16 s).
export const temposDoTexto = (texto: string, em: number, palavras: Palavra[], ate = Infinity): number[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= em - 0.3 && p.em < ate + 0.3);
  const tempos: number[] = [];
  let cursor = 0;
  let ultimo = em;
  for (const w of ws) {
    const alvo = nucleo(w);
    let achou = -1;
    for (let k = cursor; k < Math.min(fala.length, cursor + 4); k++) {
      if (nucleo(fala[k].w) === alvo) {
        achou = k;
        break;
      }
    }
    if (achou >= 0) {
      ultimo = Math.max(ultimo, fala[achou].em);
      cursor = achou + 1;
    } else ultimo = tempos.length ? ultimo + 0.16 : em;
    tempos.push(ultimo);
  }
  return tempos;
};

// Número em pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
