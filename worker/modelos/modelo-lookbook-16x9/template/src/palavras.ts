// Acha, na fala, o instante de cada palavra de um título escrito no plano,
// para o título se montar no ritmo da voz (cada palavra entra quando é dita).
import { corrigirPalavras } from "./motor/frases";
import type { Plano } from "./plano";

const NUMEROS: Record<string, string> = {
  "1": "um", uma: "um", "2": "dois", duas: "dois", "3": "tres", "4": "quatro", "5": "cinco",
  "6": "seis", "7": "sete", "8": "oito", "9": "nove", "10": "dez",
};
const canon = (w: string) => {
  const n = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  return NUMEROS[n] ?? n;
};
const parecida = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4));

export const separar = (texto: string) => texto.split(/\s+/).filter(Boolean);

// Um instante para cada palavra de `textos` (na ordem), procurando entre `de` e `ate`.
// Palavra que não aparece na fala ganha um instante entre as vizinhas.
export const temposDoTexto = (textos: string[], plano: Plano, de: number, ate: number): number[] => {
  const faladas = corrigirPalavras(plano.palavras, plano.correcoes).filter((p) => p.em >= de - 0.2 && p.em <= ate + 0.05);
  const saida: (number | null)[] = [];
  let j = 0;
  for (const w of textos) {
    const c = canon(w);
    let achou: number | null = null;
    for (let k = j; k < faladas.length; k++) {
      if (parecida(canon(faladas[k].w), c)) {
        achou = k;
        break;
      }
    }
    if (achou !== null) {
      saida.push(Math.max(de, faladas[achou].em));
      j = achou + 1;
    } else saida.push(null);
  }
  // preenche os buracos entre vizinhas conhecidas
  return saida.map((v, i) => {
    if (v !== null) return v;
    let a = i - 1;
    while (a >= 0 && saida[a] === null) a--;
    let b = i + 1;
    while (b < saida.length && saida[b] === null) b++;
    const ta = a >= 0 ? (saida[a] as number) : de + 0.1;
    const tb = b < saida.length ? (saida[b] as number) : Math.min(ate - 0.2, ta + 0.25 * (i - a + 1));
    return ta + ((tb - ta) * (i - a)) / (b - a);
  });
};
