import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

// Movimento de objeto em cima da mesa: cai acelerando, pousa com um assentar curto; a câmera
// desliza com começo e fim macios.
export const pousa = Easing.bezier(0.55, 0, 0.85, 0.55);
export const desliza = Easing.bezier(0.65, 0, 0.35, 1);
export const rapido = Easing.bezier(0.16, 1, 0.3, 1);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = rapido) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Queda vista de cima: o objeto começa maior (mais perto da câmera) com a sombra longe e difusa,
// e pousa no instante `em` (sombra curta e firme), com um assentar de 0,12 s.
// Devolve `p` (1 no alto, 0 pousado) para a sombra, e o transform. Depois de pousado, o transform
// é só a inclinação de repouso (o texto fica desenhado limpo).
export const QUEDA = 0.3;
export const queda = (t: number, em: number, giro = 0) => {
  const inicio = em - QUEDA;
  if (t < inicio) return { visivel: false, p: 1, opacity: 0, transform: `rotate(${giro}deg)` };
  if (t >= em + 0.14) return { visivel: true, p: 0, opacity: 1, transform: giro ? `rotate(${giro}deg)` : undefined };
  if (t < em) {
    const k = pousa(clamp((t - inicio) / QUEDA, 0, 1));
    const p = 1 - k;
    return { visivel: true, p, opacity: clamp((t - inicio) / 0.08, 0, 1), transform: `scale(${1 + 0.24 * p}) rotate(${giro + 5 * p}deg)` };
  }
  const d = (t - em) / 0.14;
  const s = 1 - 0.022 * Math.sin(Math.PI * d);
  return { visivel: true, p: 0, opacity: 1, transform: `scale(${s}) rotate(${giro}deg)` };
};

// ——— tempo das palavras faladas, para textos que se montam no ritmo da fala ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Instante de cada palavra de `texto`: procura a mesma sequência na fala a partir de `em`;
// palavra que não foi dita igual entra logo depois da anterior (ritmo de 0,14 s).
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
    } else ultimo = tempos.length ? ultimo + 0.14 : em;
    tempos.push(ultimo);
  }
  return tempos;
};

// Número em pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
