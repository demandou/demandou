// A câmera do Demo não anda: não há zoom animado nem punch-in. O plano da pessoa só muda por
// LAYOUT (split / cheio / eu), em corte seco, junto com o insert. Este arquivo decide o layout de
// cada instante a partir dos momentos do plano.
import type { Momento, Plano } from "./plano";
import type { Layout } from "./tema";

const BLOCOS = new Set(["topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta"]);

// o layout de um momento: o que o plano pede, ou o padrão do tipo
export const layoutDoMomento = (m: Momento): Layout => {
  if (m.tipo === "cta") return m.layout === "split" ? "split" : "eu";
  // os blocos desenhados são do palco de cima: não existem em tela cheia
  if (BLOCOS.has(m.tipo)) return m.layout === "eu" ? "eu" : "split";
  return m.layout ?? "split";
};

export const momentoNoTempo = (plano: Plano, t: number): Momento | undefined => {
  const lista = plano.momentos.filter((m) => m.tipo !== "abertura").sort((a, b) => a.de - b.de);
  let achado: Momento | undefined;
  for (const m of lista) if (t >= m.de) achado = m;
  return achado ?? lista[0];
};

export const layoutNoTempo = (plano: Plano, t: number): Layout => {
  const m = momentoNoTempo(plano, t);
  return m ? layoutDoMomento(m) : "eu";
};
