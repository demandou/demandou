import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento do Manifesto: entra decidido, assenta seco. Sem elástico, sem quique.
export const firme = Easing.bezier(0.16, 1, 0.3, 1);
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
export const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = firme) =>
  interpolate(t, [inicio, inicio + Math.max(0.001, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// Tempo de cada palavra de uma linha escrita no plano, a partir das palavras faladas.
// A linha começa em `em`; a k-ésima palavra escrita bate na k-ésima palavra falada dali em diante.
// Palavra escrita que não foi falada (ou passou do limite) entra logo depois da anterior.
export const temposDaLinha = (texto: string, em: number, palavras: Palavra[], limite = Infinity): number[] => {
  const escritas = texto.trim().split(/\s+/).filter(Boolean);
  const inicio = palavras.findIndex((p) => p.em >= em - 0.08);
  let anterior = em;
  return escritas.map((_, k) => {
    const falada = inicio >= 0 ? palavras[inicio + k] : undefined;
    const t = falada && falada.em < limite ? falada.em : anterior + 0.12;
    anterior = Math.max(em, t);
    return anterior;
  });
};

// Como `temposDaLinha`, mas acha cada palavra escrita pelo conteúdo: o texto de tela pode resumir a
// fala ("Aula gratuita: como eu analiso" para "gravei uma aula gratuita… como eu analiso"). Cada
// palavra escrita procura a mesma palavra falada (sem acento de caixa nem pontuação) depois da
// anterior, entre `em` e `limite`; a que não foi falada entra logo depois da anterior.
const limparFala = (w: string) => w.toLocaleUpperCase("pt-BR").replace(/[^\p{L}\p{N}]/gu, "");
export const temposPorConteudo = (texto: string, em: number, palavras: Palavra[], limite = Infinity): number[] => {
  const escritas = texto.trim().split(/\s+/).filter(Boolean);
  const sequencia = temposDaLinha(texto, em, palavras, limite);
  const faladas = palavras.filter((p) => p.em >= em - 0.12 && p.em < limite);
  let cursor = 0;
  let anterior = em;
  return escritas.map((w, k) => {
    const alvo = limparFala(w);
    let achou = -1;
    for (let j = cursor; j < faladas.length && alvo; j++) {
      if (limparFala(faladas[j].w) === alvo) {
        achou = j;
        break;
      }
    }
    let t: number;
    if (achou >= 0) {
      t = faladas[achou].em;
      cursor = achou + 1;
    } else t = Math.max(anterior + 0.1, Math.min(sequencia[k], anterior + 0.5));
    anterior = Math.max(anterior, t);
    return anterior;
  });
};
