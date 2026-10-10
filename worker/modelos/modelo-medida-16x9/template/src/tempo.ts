import type { Palavra } from "./plano";

// Sem acento, sem pontuação, minúsculas: para achar na fala as palavras de um texto do plano.
export const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%$]/g, "");

/** instante de cada palavra de `texto`: procura a mesma palavra na fala a partir de `em`;
    a que não foi dita igual entra logo depois da anterior (0,12 s) */
export const temposDoTexto = (texto: string, em: number, palavras: Palavra[], ate = Infinity): number[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const fala = palavras.filter((p) => p.em >= em - 0.2 && p.em < ate + 0.5);
  let cursor = 0;
  let ultimo = em - 0.12;
  return ws.map((w) => {
    const alvo = nucleo(w);
    for (let k = cursor; k < Math.min(fala.length, cursor + 6); k++) {
      if (nucleo(fala[k].w) === alvo && alvo) {
        cursor = k + 1;
        ultimo = Math.max(ultimo + 0.04, fala[k].em);
        return ultimo;
      }
    }
    ultimo = Math.max(em, ultimo + 0.12);
    return ultimo;
  });
};

/** índices (no texto) das palavras que formam o trecho `parte` */
export const indicesDoTrecho = (texto: string, parte?: string): Set<number> => {
  const out = new Set<number>();
  if (!parte) return out;
  const ws = texto.split(/\s+/).map(nucleo);
  const ps = parte.split(/\s+/).map(nucleo).filter(Boolean);
  for (let i = 0; i + ps.length <= ws.length; i++) {
    if (ps.every((p, k) => ws[i + k] === p)) {
      ps.forEach((_, k) => out.add(i + k));
      break;
    }
  }
  return out;
};
