// A gramática do Ranking: dois lugares para a pessoa.
//  1. quadro cheio: a pessoa inteira, com o texto em casas de placar na altura do peito;
//  2. o placar em cima, a pessoa embaixo: o placar vermelho desce empurrando a pessoa para a metade
//     de baixo (o ranking, as listas, a comparação, o gráfico, a definição, a pergunta).
// A foto do ranking toma a tela inteira por ~1 s por cima dos dois e voa para a casa dela.
import { Easing, interpolate } from "remotion";
import { CHEIO, type Caixa } from "./motor/caixa";
import { noPlacar, type Momento, type Plano } from "./plano";

// onde o placar encontra a pessoa (px)
export const COSTURA = 900;
// área de conteúdo do placar (a interface do Reels ocupa ~120 px no topo)
export const PLACAR = { x: 60, y: 132, w: 960, base: 872 };
export const TOPO = PLACAR;

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

// o ranking mostra a legenda por padrão (a foto é apoio da fala, não substitui o texto)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "ranking" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// trechos com a pessoa embaixo (momentos de placar com menos de 0,4 s entre eles viram um trecho só)
const trechosNoPlacar = (plano: Plano) => {
  const lista: [number, number][] = [];
  for (const m of ordenar(plano).filter(noPlacar)) {
    const u = lista[lista.length - 1];
    if (u && m.de - u[1] < 0.4) u[1] = Math.max(u[1], m.ate);
    else lista.push([m.de, m.ate]);
  }
  return lista;
};

export type Layout = {
  // 0 = quadro cheio, 1 = pessoa embaixo do placar
  embaixo: (t: number) => number;
  caixa: (t: number) => Caixa;
  // centro vertical da legenda
  yLegenda: (t: number) => number;
  // centro vertical dos textos de quadro cheio (altura do peito)
  yPeito: number;
  caixaEmbaixo: Caixa;
  livreDesde: (de: number) => number;
};

export const prepararLayout = (plano: Plano): Layout => {
  const trechos = trechosNoPlacar(plano);
  const rostoY = plano.rosto.y;
  const zona = plano.zona ?? { topo: 976, altura: 465 };

  // pessoa embaixo: a cabeça inteira logo abaixo da emenda (a legenda fica na emenda)
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.32) * 1080;
  const alturaEmbaixo = 1920 - COSTURA;
  const alvoRosto = COSTURA + 80 + 1.02 * larguraRosto;
  const caixaEmbaixo: Caixa = {
    x: 0,
    y: COSTURA,
    w: 1080,
    h: alturaEmbaixo,
    raio: 0,
    zoom: 1,
    ancoraY: clamp((alvoRosto - COSTURA) / alturaEmbaixo, 0.28, 0.5),
  };

  const embaixo = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      const entra = interpolate(t, [a, a + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      const sai = interpolate(t, [b - 0.02, b + 0.36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };

  const caixa = (t: number): Caixa => {
    const p = embaixo(t);
    const cheio: Caixa = { ...CHEIO, zoom: 1, ancoraY: rostoY };
    if (p <= 0) return cheio;
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: 0,
      y: mix(0, caixaEmbaixo.y),
      w: 1080,
      h: mix(1920, caixaEmbaixo.h),
      raio: 0,
      zoom: 1,
      ancoraY: mix(rostoY, caixaEmbaixo.ancoraY ?? 0.37),
    };
  };

  const yCheio = zona.topo + 90;
  const yLegenda = (t: number) => {
    const p = embaixo(t);
    return yCheio + (COSTURA - yCheio) * p;
  };

  // primeiro instante (a partir de `de`) em que a pessoa já voltou quase toda para o quadro cheio:
  // os textos do peito esperam por ele, para nunca caírem em cima do rosto que ainda está subindo
  const livreDesde = (de: number) => {
    for (let x = de; x < de + 0.6; x += 0.02) if (embaixo(x) < 0.22) return x;
    return de + 0.6;
  };

  return { embaixo, caixa, yLegenda, yPeito: zona.topo + Math.min(zona.altura, 520) * 0.42, caixaEmbaixo, livreDesde };
};

// ——— tempos de cada momento na tela ———

export type Vizinhanca = {
  // o placar que entra desce como uma cortina por cima do placar que sai (nenhum quadro misturado)
  vemDeOutro: boolean;
  vaiParaOutro: boolean;
  // instante em que o momento sai de cena (desmonta)
  fim: number;
};

export const vizinhanca = (m: Momento, plano: Plano): Vizinhanca => {
  const ordem = ordenar(plano);
  const i = ordem.indexOf(m);
  const anterior = ordem[i - 1];
  const proximo = ordem[i + 1];
  const vemDeOutro = !!anterior && noPlacar(m) && noPlacar(anterior) && m.de - anterior.ate < 0.4;
  const vaiParaOutro = !!proximo && noPlacar(m) && noPlacar(proximo) && proximo.de - m.ate < 0.4;
  let fim = m.ate;
  if (!proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) fim = plano.duracao + 1;
  // o placar fica embaixo da pessoa enquanto ela cresce por cima dele, ou embaixo da cortina do próximo
  else if (noPlacar(m)) fim = vaiParaOutro ? m.ate + 0.5 : m.ate + 0.42;
  return { vemDeOutro, vaiParaOutro, fim };
};
