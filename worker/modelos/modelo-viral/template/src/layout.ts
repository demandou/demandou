// A gramática do Viral: três lugares para a pessoa e a imagem, alternando.
//  1. quadro cheio: a pessoa inteira, com zoom de impacto nos cortes e nas palavras fortes;
//  2. imagem em cima, pessoa embaixo: a pessoa desce para a metade de baixo (pop, listas…);
//  3. imagem em tela cheia (corte): cobre tudo por ~1 s, a legenda continua.
import { Easing, interpolate } from "remotion";
import { CHEIO, type Caixa } from "./motor/caixa";
import { pessoaEmbaixo, telaCheia, type Momento, type Plano } from "./plano";

// onde a metade de cima encontra a pessoa (px). A legenda fica em cima desta emenda.
export const COSTURA = 820;
// área de conteúdo da metade de cima (a interface do Reels ocupa ~110 px no topo)
export const TOPO = { x: 60, y: 128, w: 960, base: 752 };

const suave = Easing.bezier(0.65, 0, 0.35, 1);
const sobe = Easing.bezier(0.16, 1, 0.3, 1);
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

// corte e pop mostram a legenda por padrão (a imagem é apoio da fala, não substitui o texto)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => ((m.tipo === "corte" || m.tipo === "pop") && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// trechos com a pessoa embaixo (momentos seguidos com menos de 0,4 s entre eles viram um trecho só)
const trechosEmbaixo = (plano: Plano) => {
  const lista: [number, number][] = [];
  for (const m of ordenar(plano).filter(pessoaEmbaixo)) {
    const u = lista[lista.length - 1];
    if (u && m.de - u[1] < 0.4) u[1] = Math.max(u[1], m.ate);
    else lista.push([m.de, m.ate]);
  }
  return lista;
};

// instantes de zoom de impacto: palavras fortes dos blocos de quadro cheio + `impactos` do plano
const impactosDo = (plano: Plano) => {
  const lista: number[] = [...(plano.impactos ?? [])];
  for (const m of plano.momentos) {
    if (m.tipo === "abertura") lista.push(m.em ?? m.de);
    if ((m.tipo === "destaque" || m.tipo === "numero") && !m.imagem) lista.push(m.em);
    if (m.tipo === "cta") lista.push(m.em ?? m.de);
  }
  return lista.sort((a, b) => a - b);
};

// fronteiras de tomada: cortes do vídeo e a volta de cada imagem em tela cheia
const tomadasDo = (plano: Plano) => {
  const lista = [...(plano.cortesEm ?? [])];
  for (const m of plano.momentos) if (telaCheia(m)) lista.push(m.ate);
  return lista.sort((a, b) => a - b);
};

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.14) return sobe(d / 0.14);
  if (d < 0.5) return 1;
  return 1 - suave(clamp((d - 0.5) / 0.9, 0, 1));
};

export type Layout = {
  // 0 = quadro cheio, 1 = pessoa embaixo
  embaixo: (t: number) => number;
  zoom: (t: number) => number;
  caixa: (t: number) => Caixa;
  // centro vertical da legenda
  yLegenda: (t: number) => number;
  // centro vertical dos textos de quadro cheio (altura do peito)
  yPeito: number;
  caixaEmbaixo: Caixa;
  livreDesde: (de: number) => number;
};

export const prepararLayout = (plano: Plano): Layout => {
  const trechos = trechosEmbaixo(plano);
  const impactos = impactosDo(plano);
  const tomadas = tomadasDo(plano);
  const rostoY = plano.rosto.y;
  const zona = plano.zona ?? { topo: 976, altura: 465 };

  // pessoa embaixo: o topo da cabeça fica logo abaixo da legenda da emenda
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.32) * 1080;
  const alturaEmbaixo = 1920 - COSTURA;
  const alvoRosto = COSTURA + 70 + 1.06 * larguraRosto;
  const caixaEmbaixo: Caixa = { x: 0, y: COSTURA, w: 1080, h: alturaEmbaixo, raio: 0, zoom: 1, ancoraY: clamp((alvoRosto - COSTURA) / alturaEmbaixo, 0.28, 0.5) };

  const embaixo = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      const entra = interpolate(t, [a, a + 0.38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      const sai = interpolate(t, [b - 0.02, b + 0.34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };

  const zoom = (t: number) => {
    const k = tomadas.filter((c) => c <= t + 1e-4).length;
    let z = k % 2 === 1 ? 1.09 : 1;
    for (const e of impactos) z += 0.11 * pulso(t, e);
    return Math.min(1.3, z);
  };

  const caixa = (t: number): Caixa => {
    const p = embaixo(t);
    const cheio: Caixa = { ...CHEIO, zoom: zoom(t), ancoraY: rostoY };
    if (p <= 0) return cheio;
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: 0,
      y: mix(0, caixaEmbaixo.y),
      w: 1080,
      h: mix(1920, caixaEmbaixo.h),
      raio: 0,
      zoom: mix(cheio.zoom ?? 1, 1),
      ancoraY: mix(rostoY, caixaEmbaixo.ancoraY ?? 0.37),
    };
  };

  const yCheio = zona.topo + 96;
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

  return { embaixo, zoom, caixa, yLegenda, yPeito: zona.topo + Math.min(zona.altura, 520) * 0.44, caixaEmbaixo, livreDesde };
};

// ——— tempos de cada momento na tela ———

export type Vizinhanca = {
  // o conteúdo da metade de cima que sai cruza com o que entra: o novo espera o velho sumir
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
  const vemDeOutro = !!anterior && pessoaEmbaixo(m) && pessoaEmbaixo(anterior) && m.de - anterior.ate < 0.4;
  const vaiParaOutro = !!proximo && pessoaEmbaixo(m) && pessoaEmbaixo(proximo) && proximo.de - m.ate < 0.4;
  let fim = m.ate;
  if (!proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) fim = plano.duracao + 1;
  // a metade de cima fica embaixo da pessoa enquanto ela cresce por cima dela
  else if (pessoaEmbaixo(m)) fim = vaiParaOutro ? m.ate + 0.2 : m.ate + 0.42;
  return { vemDeOutro, vaiParaOutro, fim };
};
