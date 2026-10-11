import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento do Ao Pé da Letra: entra firme e assenta sem quicar (editorial, não elástico).
export const firme = Easing.bezier(0.2, 0.75, 0.25, 1);
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// progresso 0→1 a partir de `inicio`, durando `dur` segundos
// (um `inicio` que não existe — Infinity — fica em 0: o campo opcional não foi dado)
export const prog = (t: number, inicio: number, dur: number, easing = firme) =>
  !Number.isFinite(inicio) ? 0 : interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// progresso da saída (0 = na tela, 1 = saiu), terminando em `ate`
export const saindo = (t: number, ate: number, dur = 0.22) => prog(t, ate - dur, dur, saida);

// estilo de entrada de um elemento; quando termina, nenhum resto da animação fica no estilo
export const entra = (p: number, dy = 16): React.CSSProperties =>
  p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * dy}px` };

// ——— os textos fixos da tela (o plano pode trocar: vídeo em espanhol, outro rótulo) ———
export const ROTULOS = {
  expressoes: "expressões",
  ao: "ao pé da letra",
  querDizer: "o que quer dizer",
  certoEm: "o certo em inglês",
  nao: "NÃO",
  quer: "quer dizer",
  guarde: "guarde isto",
  atencao: "atenção",
  numero: "em número",
  numeros: "em números",
  voce: "e você?",
  ilustrativo: "ilustrativo",
  certo: "o certo",
  compare: "compare",
  naoEE: "não é · é",
};
export type Rotulos = typeof ROTULOS;
export const RotulosCtx = createContext<Rotulos>(ROTULOS);
export const useRotulos = () => useContext(RotulosCtx);

// ——— tempo das palavras faladas ———

export const PalavrasCtx = createContext<Palavra[]>([]);
export const usePalavras = () => useContext(PalavrasCtx);

// Para um texto de n palavras que começa a ser dito em `em`: o instante de cada palavra.
export const temposDasPalavras = (palavras: Palavra[], em: number, n: number, limite = Infinity) => {
  const faladas = palavras.filter((p) => p.em >= em - 0.12 && p.em < limite);
  const tempos: number[] = [];
  for (let i = 0; i < n; i++) {
    const falada = faladas[i];
    const anterior = tempos[i - 1] ?? em;
    tempos.push(falada ? Math.max(falada.em, anterior) : anterior + 0.14);
  }
  if (tempos.length) tempos[0] = Math.min(tempos[0], em);
  return tempos;
};

// índice do trecho `destaque` dentro de um texto (palavra a palavra), sem diferenciar pontuação
const limpar = (w: string) => w.toLowerCase().replace(/[.,!?;:"“”'()…]/g, "");
export const indicesDoTrecho = (texto: string, trecho?: string) => {
  if (!trecho) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(limpar);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(limpar);
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  }
  return new Set<number>();
};
