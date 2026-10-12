import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento do Impacto: rápido, seco, no tempo da fala. Chega forte e para — sem quique, sem tremida.
export const seco = Easing.bezier(0.2, 0.9, 0.1, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = seco) =>
  // instante que não existe (ex.: um fim que o plano não marcou): nunca começa
  !Number.isFinite(inicio) || !Number.isFinite(dur) ? (inicio === -Infinity ? 1 : 0) : interpolate(t, [inicio, inicio + Math.max(0.001, dur)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída de um momento (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.16) => prog(t, ate - dur, dur, saida);

// A "batida": a palavra entra já grande, um pouco maior que o normal, e assenta em ~6 quadros.
// "lado": chega deslizando uns poucos px da direita para o lugar e cresce só para a direita —
// assim nunca invade a palavra de antes (o espaço entre as palavras fica sempre certo).
// "baixo": sobe uns poucos px (itens de lista).
export const batida = (t: number, em: number, de: "lado" | "baixo" = "lado"): React.CSSProperties => {
  const p = prog(t, em - 0.02, 0.24);
  const visivel = prog(t, em - 0.04, 0.06, Easing.linear);
  // terminada a entrada, o texto fica simples: sem escala nem deslocamento por cima
  if (p >= 1 && visivel >= 1) return {};
  const d = (1 - p) * 30;
  return {
    opacity: visivel,
    scale: String(1 + 0.08 * (1 - p)),
    transformOrigin: "left center",
    translate: de === "baixo" ? `0 ${d}px` : `${d}px 0`,
  };
};

// Tempo de cada palavra de uma linha escrita no plano, a partir das palavras faladas.
// A linha começa em `em`; a k-ésima palavra da linha bate na k-ésima palavra falada dali em diante.
export const temposDaLinha = (texto: string, em: number, palavras: Palavra[], limite = Infinity): number[] => {
  const escritas = texto.trim().split(/\s+/);
  const inicio = palavras.findIndex((p) => p.em >= em - 0.08);
  return escritas.map((_, k) => {
    const falada = inicio >= 0 ? palavras[inicio + k] : undefined;
    const t = falada && falada.em < limite ? falada.em : em + k * 0.14;
    return Math.max(em, t);
  });
};

// Contagem de 0 até o valor escrito, mantendo o formato ("20" → 05, 06… 20; "1.500" → 0.750…).
export const contar = (valor: string, p: number) => {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return valor;
  const alvo = Number(digitos);
  const agora = String(Math.round(alvo * p)).padStart(digitos.length, "0");
  let i = 0;
  return valor.replace(/\d/g, () => agora[i++] ?? "0");
};
