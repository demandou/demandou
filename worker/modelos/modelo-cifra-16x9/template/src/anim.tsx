import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";

// Movimento editorial: entra decidido e assenta, sem quique.
export const suave = Easing.bezier(0.16, 1, 0.3, 1);
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = suave) =>
  interpolate(t, [inicio, inicio + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.26) => prog(t, ate - dur, dur, saida);

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------------------------------------
// Palavras escritas na tela entram quando são faladas. Cada palavra do texto procura, em ordem,
// a palavra falada correspondente dentro da janela do momento (ignora acento, caixa e pontuação;
// "4" casa com "quatro"). A que não for achada entra logo depois da anterior.

const NUMEROS: Record<string, string> = {
  "1": "um uma", "2": "dois duas", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete",
  "8": "oito", "9": "nove", "10": "dez", "12": "doze", "15": "quinze", "20": "vinte", "30": "trinta",
  "100": "cem", "1000": "mil",
};
const normal = (w: string) =>
  w
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();

const casa = (escrita: string, falada: string) => {
  const a = normal(escrita);
  const b = normal(falada);
  if (!a || !b) return false;
  if (a === b) return true;
  if (NUMEROS[a]?.split(" ").includes(b)) return true;
  // plural/singular e pequenas diferenças ("música" × "músicas")
  return a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2;
};

// Devolve o instante de cada palavra de `texto`, procurando entre `de` e `ate`.
export const temposDasPalavras = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const escritas = texto.split(/\s+/).filter(Boolean);
  const faladas = palavras.filter((p) => p.em >= de - 0.25 && p.em <= ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  let ultimo = inicio;
  for (const w of escritas) {
    let achou = -1;
    for (let k = cursor; k < faladas.length; k++) {
      if (casa(w, faladas[k].w)) {
        achou = k;
        break;
      }
    }
    if (achou >= 0) {
      ultimo = Math.max(ultimo, faladas[achou].em);
      cursor = achou + 1;
    } else {
      ultimo += 0.12;
    }
    tempos.push(ultimo);
  }
  return { escritas, tempos };
};

// Quanto um pulso (batida do metrônomo, acorde dito) ainda "soa": 1 no instante, cai rápido.
export const pulso = (t: number, batidas: { em: number; forca: number }[], meiaVida = 0.11) => {
  let v = 0;
  for (const b of batidas) {
    const d = t - b.em;
    if (d < -0.02 || d > 0.8) continue;
    // sobe em 2 quadros e cai
    const subida = Math.min(1, (d + 0.02) / 0.06);
    v = Math.max(v, b.forca * subida * Math.exp(-Math.max(0, d) / meiaVida));
  }
  return v;
};
