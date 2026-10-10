// A gramática do Versus: a tela é sempre dividida. Em cima, a ARENA (onde a luta e os blocos
// acontecem); embaixo, a pessoa numa moldura larga, de ponta a ponta. A pessoa nunca sai de lá:
// o que muda é a arena. Cada golpe (VS, rodada, ponto, carimbo) dá um soco curto de zoom no rosto.
import { Easing } from "remotion";
import type { Caixa } from "./motor/caixa";
import { type Momento, type Plano } from "./plano";

// onde a arena encontra a pessoa (px)
export const COSTURA = 960;
// a arena: a interface do Reels ocupa ~110 px no topo
export const ARENA = { x: 44, y: 128, w: 992, base: COSTURA - 52 };
// área dos blocos universais (listas, comparação, gráfico, definição, pergunta)
export const TOPO = { x: 60, y: 132, w: 960, base: COSTURA - 56 };
// o placar fica no alto da arena durante a luta; os blocos da luta usam o espaço abaixo dele
export const HUD = { y: 124, h: 92 };
// centro vertical dos textos do "peito" (abertura, número, destaque, frase, chamada): o meio da arena
export const Y_PEITO = (ARENA.y + ARENA.base) / 2;
// a legenda fica logo abaixo do queixo, dentro da moldura da pessoa
export const Y_LEGENDA = 1540;

const sobe = Easing.bezier(0.16, 1, 0.3, 1);
const suave = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

// a rodada mostra a legenda por padrão (a fala tem mais do que as barras escrevem)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "rodada" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// instantes de golpe: cada um dá um soco de zoom na pessoa
export const golpesDo = (plano: Plano): number[] => {
  const lista: number[] = [];
  for (const m of plano.momentos as Momento[]) {
    if (m.tipo === "versus") lista.push(Math.max(m.lados[0].em, m.lados[1].em) + 0.12);
    if (m.tipo === "rodada") {
      lista.push(m.de);
      if (m.vencedor === 0 || m.vencedor === 1) lista.push(m.vencedorEm ?? m.ate - 0.5);
    }
    if (m.tipo === "veredito") lista.push(m.placarEm ?? m.de);
    if (m.tipo === "destaque" || m.tipo === "numero") lista.push(m.em);
    if (m.tipo === "abertura" || m.tipo === "cta") lista.push(m.em ?? m.de);
  }
  return lista.sort((a, b) => a - b);
};

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.12) return sobe(d / 0.12);
  if (d < 0.35) return 1;
  return 1 - suave(clamp((d - 0.35) / 0.8, 0, 1));
};

export type Layout = { caixa: (t: number) => Caixa; ancoraY: number; yLegenda: (t: number) => number; yPeito: number };

export type Vizinhanca = { vemDeOutro: boolean; vaiParaOutro: boolean; fim: number };
// quando cada momento desmonta: o último segue até o fim do vídeo; os outros saem quando acabam
export const vizinhanca = (m: Momento, plano: Plano): Vizinhanca => {
  const ordem = ordenar(plano);
  const proximo = ordem[ordem.indexOf(m) + 1];
  const fim = !proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3) ? plano.duracao + 1 : m.ate;
  return { vemDeOutro: false, vaiParaOutro: false, fim };
};

export const prepararLayout = (plano: Plano): Layout => {
  const golpes = golpesDo(plano);
  const cortes = plano.cortesEm ?? [];
  // a cabeça inteira logo abaixo da costura (queixo a ~1470 px): sobra o espaço da legenda embaixo
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.3) * 1080;
  const h = 1920 - COSTURA;
  const ancoraY = clamp((34 + 0.74 * larguraRosto) / h, 0.2, 0.46);
  const caixa = (t: number): Caixa => {
    // cada corte do vídeo alterna 100% e 106% (um corte seco de câmera), cada golpe soma 7%
    const k = cortes.filter((c) => c <= t + 1e-4).length;
    let z = k % 2 === 1 ? 1.06 : 1;
    for (const g of golpes) z += 0.07 * pulso(t, g);
    return { x: 0, y: COSTURA, w: 1080, h, raio: 0, zoom: Math.min(1.25, z), ancoraY };
  };
  return { caixa, ancoraY, yLegenda: () => Y_LEGENDA, yPeito: Y_PEITO };
};
