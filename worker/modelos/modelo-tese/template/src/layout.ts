// Os dois enquadramentos da Tese. O vídeo começa e fica em "split": a informação em cima (45%
// da altura), a pessoa embaixo, bem centralizada. Só nas viradas e na pergunta direta
// o plano pede "fechado": a pessoa em tela cheia, rosto grande. Não há B-roll em tela cheia.
// Quem decide é o plano: `fechado` = rosto fechado; todo o resto (`cena` e os blocos de texto) e
// o tempo sem momento = split.
import type { Momento, Plano } from "./plano";

export type Layout = "split" | "fechado";

export const layoutDoMomento = (m: Momento): Layout => (m.tipo === "fechado" ? "fechado" : "split");

export const layoutEm = (plano: Plano, t: number): Layout => {
  // vale o momento que começou por último
  let achado: Momento | undefined;
  for (const m of plano.momentos) {
    if (t >= m.de - 0.001 && t < m.ate - 0.001 && (!achado || m.de >= achado.de)) achado = m;
  }
  return achado ? layoutDoMomento(achado) : "split";
};
