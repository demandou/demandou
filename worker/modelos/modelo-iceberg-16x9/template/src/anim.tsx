import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { nucleo } from "./medida";
import type { Palavra } from "./plano";

// Movimento do Iceberg: as coisas sobem da água e assentam; saem afundando rápido.
export const rapido = Easing.bezier(0.16, 1, 0.3, 1);
export const salto = Easing.bezier(0.34, 1.45, 0.5, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = rapido) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu), terminando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.16) => prog(t, ate - dur, dur, saida);

// Entrada de adesivo: escala e opacidade. Terminada a entrada, devolve transform vazio
// (o texto fica desenhado simples, sem camada de animação por cima).
export const entradaAdesivo = (t: number, em: number, { dur = 0.26, de = 0.6, giro = 0 } = {}) => {
  const p = prog(t, em, dur, salto);
  const o = prog(t, em, Math.min(0.1, dur));
  if (t >= em + dur) return { opacity: 1, transform: giro ? `rotate(${giro}deg)` : undefined, visivel: true };
  return {
    opacity: o,
    transform: `scale(${de + (1 - de) * p}) rotate(${giro}deg)`,
    visivel: t >= em,
  };
};

// "Carimbo": chega maior e assenta (destaques, números)
export const carimbo = (t: number, em: number, giro = 0, dur = 0.2) => {
  if (t >= em + dur) return { opacity: 1, transform: giro ? `rotate(${giro}deg)` : undefined, visivel: true };
  const p = prog(t, em, dur, rapido);
  return { opacity: prog(t, em, 0.06), transform: `scale(${1.45 - 0.45 * p}) rotate(${giro}deg)`, visivel: t >= em };
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
