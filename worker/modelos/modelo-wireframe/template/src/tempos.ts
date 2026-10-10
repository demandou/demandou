import type { Palavra } from "./plano";

const NUMEROS: Record<string, string> = {
  "1": "um",
  "2": "dois",
  "3": "tres",
  "4": "quatro",
  "5": "cinco",
  "6": "seis",
  "7": "sete",
  "8": "oito",
  "9": "nove",
  "10": "dez",
};

export const normalizar = (w: string) => {
  const n = w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return NUMEROS[n] ?? n;
};

// Instante em que cada palavra de um texto da tela é dita: procura, em ordem, cada palavra entre as
// faladas no trecho (aceita "3" = "três", "uma" = "1"…). Palavra não falada entra logo depois da anterior.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number) => {
  const falado = palavras.filter((p) => p.em >= de - 0.3 && p.em < ate);
  const alvo = texto.split(/\s+/).filter(Boolean);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of alvo) {
    const n = normalizar(w);
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, de);
    const achou = falado.findIndex((p, k) => k >= cursor && k < cursor + 4 && (normalizar(p.w) === n || (n === "um" && normalizar(p.w) === "uma")));
    if (achou >= 0) {
      tempos.push(Math.max(anterior, falado[achou].em - 0.06));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.22);
  }
  return tempos;
};
