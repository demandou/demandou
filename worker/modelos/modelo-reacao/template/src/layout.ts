// A gramática do Reação: a "mesa" de cima (o feed de cartões) e a moldura larga da pessoa embaixo.
// A pessoa nunca sai da moldura; o que muda é o cartão de cima, que rola como num feed:
// o novo sobe por trás da moldura e empurra o anterior para fora (nenhum quadro vazio,
// nenhum texto fantasma: os dois andam juntos, um acima do outro).
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";

// onde a mesa encontra a moldura da pessoa (px). A legenda fica em cima desta emenda.
export const COSTURA = 960;
// a área dos cartões (a interface do Reels ocupa ~110 px no topo; a legenda, ~50 px acima da emenda)
export const MESA = { x: 60, w: 960, topo: 124, base: COSTURA - 36 };
export const CENTRO_MESA = (MESA.topo + MESA.base) / 2;
export const ALTURA_MAX = MESA.base - MESA.topo;
// duração da rolagem do feed
export const ROLA = 0.5;
const VAO = 44;

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Um momento nunca invade o seguinte (termina quando o próximo começa).
export const semSobreposicao = (plano: Plano): Plano => {
  const ordem = ordenar(plano);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// a foto de apoio mostra a legenda por padrão (a imagem acompanha a fala, não substitui o texto)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "foto" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// ——— a moldura da pessoa ———

export const caixaDaPessoa = (plano: Plano, zoom = 1): Caixa => {
  const w = 1024;
  const h = 1920 - COSTURA + 60;
  const escala = Math.max(w / 1080, h / 1920) * zoom;
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.32) * 1080 * escala;
  // o topo da cabeça fica ~70 px abaixo da emenda (a legenda passa em cima dela sem tocar no cabelo)
  const centro = 74 + 0.93 * larguraRosto;
  return { x: 28, y: COSTURA, w, h, raio: 46, zoom, ancoraY: Math.max(0.3, Math.min(0.5, centro / h)) };
};

// ——— o feed ———

export type NoFeed = {
  m: Momento | null; // null = cartão de perfil (abre o vídeo quando nenhum cartão começa no 0)
  h: number; // altura natural do cartão
  escala: number; // < 1 quando o cartão é mais alto que a mesa
  rola: number; // instante em que começa a rolagem que traz este cartão
};

export const montarFeed = (momentos: Momento[], alturas: Map<Momento | null, number>, temPerfil: boolean): NoFeed[] => {
  const lista: NoFeed[] = [];
  const add = (m: Momento | null, rola: number) => {
    const h = alturas.get(m) ?? 300;
    lista.push({ m, h, escala: Math.min(1, ALTURA_MAX / h), rola });
  };
  if (temPerfil) add(null, -1);
  for (const m of momentos) {
    const anterior = lista[lista.length - 1];
    const rola = !anterior ? (m.de <= 0.3 ? -1 : m.de - 0.12) : Math.max(anterior.rola + ROLA + 0.05, m.de - 0.12);
    add(m, rola);
  }
  return lista;
};

export type Posto = { no: NoFeed; y: number; opacidade: number; atual: boolean };

// Onde cada cartão visível está no instante t (y = topo do cartão na tela, já com a escala).
export const feedNoTempo = (feed: NoFeed[], t: number, ease: (x: number) => number): Posto[] => {
  if (!feed.length || t < feed[0].rola) return [];
  let k = 0;
  for (let i = 0; i < feed.length; i++) if (t >= feed[i].rola) k = i;
  const centrado = (n: NoFeed) => CENTRO_MESA - (n.h * n.escala) / 2;
  const atual = feed[k];
  const p = atual.rola < 0 ? 1 : ease(Math.max(0, Math.min(1, (t - atual.rola) / ROLA)));
  if (p >= 1) return [{ no: atual, y: centrado(atual), opacidade: 1, atual: true }];
  // o primeiro cartão sobe de trás da moldura
  if (k === 0) return [{ no: atual, y: centrado(atual) + (1 - p) * (COSTURA - MESA.topo), opacidade: 1, atual: true }];
  const ant = feed[k - 1];
  const S = (ant.h * ant.escala) / 2 + VAO + (atual.h * atual.escala) / 2;
  return [
    { no: ant, y: centrado(ant) - p * S, opacidade: 1 - Math.pow(p, 1.4), atual: false },
    { no: atual, y: centrado(atual) + (1 - p) * S, opacidade: 1, atual: true },
  ];
};
