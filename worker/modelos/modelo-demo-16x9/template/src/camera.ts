// A câmera do Demo não anda: não há zoom animado nem punch-in. O plano da pessoa só muda por
// LAYOUT (split / cheio / eu), em corte seco, junto com o insert. Este arquivo decide o layout de
// cada instante a partir dos momentos do plano.
//
// No quadro deitado (o vídeo longo do YouTube) a base é a pessoa em tela cheia, pela regra da aula 9
// do curso: um momento fica na tela do `de` ao `ate` e, quando acaba a ideia, ela volta para a tela
// cheia (layout eu). Um vão curto até o próximo momento (até 0,4 s) é emendado, para não piscar.
import type { Momento, Plano } from "./plano";
import type { Layout } from "./tema";

const BLOCOS = new Set(["topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta"]);
// vão entre dois momentos que ainda conta como "um depois do outro" (s)
const EMENDA = 0.4;

// o layout de um momento: o que o plano pede, ou o padrão do tipo
export const layoutDoMomento = (m: Momento): Layout => {
  if (m.tipo === "cta") return m.layout === "split" ? "split" : "eu";
  // os blocos desenhados são do quadro do insert: não existem em tela cheia
  if (BLOCOS.has(m.tipo)) return m.layout === "eu" ? "eu" : "split";
  return m.layout ?? "split";
};

const ordenados = new WeakMap<object, Momento[]>();
const momentosDoInsert = (plano: Plano) => {
  let lista = ordenados.get(plano);
  if (!lista) {
    lista = plano.momentos.filter((m) => m.tipo !== "abertura").sort((a, b) => a.de - b.de);
    ordenados.set(plano, lista);
  }
  return lista;
};

// O momento na tela no instante t e até quando ele fica (o `ate` dele, ou o `de` do seguinte quando
// o vão é curto). Fora de qualquer momento: undefined (a pessoa em tela cheia).
export const momentoNoTempo = (plano: Plano, t: number): { m: Momento; fim: number } | undefined => {
  const lista = momentosDoInsert(plano);
  let achado: { m: Momento; fim: number } | undefined;
  lista.forEach((m, k) => {
    const prox = lista[k + 1];
    const fim = prox && prox.de - m.ate <= EMENDA ? prox.de : m.ate;
    // o primeiro momento perto do começo já está na tela no quadro 0 (o primeiro quadro é o layout final)
    const de = k === 0 && m.de <= EMENDA ? 0 : m.de;
    if (t >= de && t < fim) achado = { m, fim };
  });
  return achado;
};

export const layoutNoTempo = (plano: Plano, t: number): Layout => {
  const atual = momentoNoTempo(plano, t);
  return atual ? layoutDoMomento(atual.m) : "eu";
};
