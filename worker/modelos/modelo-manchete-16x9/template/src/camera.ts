// A câmera da Manchete: plano fixo. Um zoom só em cada modo (tema.ts → caixaDaPessoa), sem punch-in e
// sem reenquadramento nos cortes. O dinamismo é do B-roll.
//
// No quadro deitado (o vídeo longo do YouTube) a base é a pessoa em TELA CHEIA, pela regra da aula 9
// do curso: um momento (o B-roll ou um bloco) fica no quadro da esquerda do `de` ao `ate`, com a
// pessoa na moldura da direita; quando acaba a ideia, ela volta para a tela cheia. Um vão curto até o
// próximo momento (até 0,4 s) é emendado, para não piscar. A troca é sempre corte seco.
import type { Momento, Plano } from "./plano";
import { medidas, type Modo } from "./tema";

// vão entre dois momentos que ainda conta como "um depois do outro" (s)
const EMENDA = 0.4;

const ordenados = new WeakMap<object, Momento[]>();
const momentosDoQuadro = (plano: Plano) => {
  let lista = ordenados.get(plano);
  if (!lista) {
    lista = [...plano.momentos].sort((a, b) => a.de - b.de);
    ordenados.set(plano, lista);
  }
  return lista;
};

// O momento no quadro no instante t e até quando ele fica (o `ate` dele, ou o `de` do seguinte quando
// o vão é curto). Fora de qualquer momento: undefined (a pessoa em tela cheia).
export const momentoNoTempo = (plano: Plano, t: number): { m: Momento; fim: number } | undefined => {
  const lista = momentosDoQuadro(plano);
  let achado: { m: Momento; fim: number } | undefined;
  lista.forEach((m, k) => {
    const prox = lista[k + 1];
    const fim = prox && prox.de - m.ate <= EMENDA ? prox.de : m.ate;
    // o primeiro momento perto do começo já está na tela no quadro 0
    const de = k === 0 && m.de <= EMENDA ? 0 : m.de;
    if (t >= de && t < fim) achado = { m, fim };
  });
  return achado;
};

export const modoNoTempo = (plano: Plano, t: number): Modo => (momentoNoTempo(plano, t) ? "moldura" : "cheio");

export const zoomNoTempo = (plano: Plano, t = 0) => (modoNoTempo(plano, t) === "moldura" ? medidas(plano).zoomMax : 1);
