// A gramática da Etiqueta no quadro deitado (16:9, 1920×1080): dois lugares para a pessoa, com a
// composição da aula 9 do curso (editar uma aula horizontal).
//  1. quadro cheio: a pessoa inteira (o vídeo 16:9 como foi gravado), com o texto em etiquetas de
//     papel numa fileira larga na altura do peito; é a base;
//  2. a parede da loja à esquerda, a pessoa na moldura da direita: quando um bloco pede apoio visual
//     (a prateleira, as listas, a comparação, o gráfico, a definição, a pergunta), a parede verde
//     entra pela esquerda empurrando a pessoa para a moldura da direita, com o rosto centralizado
//     nela e acompanhado com suavidade (rosto.rastro), e o bloco ocupa o quadro da esquerda.
// No vertical a parede descia por cima e a pessoa ia para a metade de baixo; no deitado não cabe
// uma pilha alta, e a emenda vira um traço de tarja vertical.
import { Easing, interpolate } from "remotion";
import type { Caixa } from "./motor/caixa";
import { noPlacar, type Momento, type Plano } from "./plano";

// --- Medidas do quadro (16:9, 1920×1080) ---
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_APP = 984;
// base do conteúdo (textos do peito, quadro da esquerda)
export const BASE_UTIL = 948;
// onde a parede da loja (o quadro da esquerda) encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1180;
// a moldura da pessoa: a faixa da direita, na altura toda (o rosto centralizado nela)
export const MOLDURA = { x: COSTURA, y: 0, w: QUADRO.w - COSTURA, h: QUADRO.h };
// área de conteúdo do quadro da esquerda (abaixo do título do player, acima dos controles)
export const AREA = { x: MARGEM, y: 120, w: 1010, base: BASE_UTIL };
// o placar da Etiqueta (a prateleira, as listas...) é o quadro da esquerda
export const PLACAR = AREA;
export const TOPO = AREA;
// centro vertical da legenda: no terço de baixo, acima dos controles do player
export const LEGENDA_Y = 900;
// largura máxima da legenda no quadro cheio e na moldura
export const LEGENDA_CHEIO = 1240;
export const LEGENDA_MOLDURA = MOLDURA.w - 80;
// zona padrão (sem `zona` no plano): o queixo em ~580
export const ZONA_PADRAO = { topo: 640, altura: 368 };

// zoom da pessoa na moldura: um pouco mais perto que o quadro cheio, para o rosto ficar no centro
const ZOOM_MOLDURA = 1.12;
// altura do centro do rosto dentro da moldura (0 = topo, 1 = base)
const ANCORA_MOLDURA = 0.4;

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

// a prateleira mostra a legenda por padrão (o produto é apoio da fala, não substitui o texto)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "etiqueta" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// trechos com a pessoa na moldura (momentos de placar com menos de 0,4 s entre eles viram um trecho só)
const trechosNoPlacar = (plano: Plano) => {
  const lista: [number, number][] = [];
  for (const m of ordenar(plano).filter(noPlacar)) {
    const u = lista[lista.length - 1];
    if (u && m.de - u[1] < 0.4) u[1] = Math.max(u[1], m.ate);
    else lista.push([m.de, m.ate]);
  }
  return lista;
};

// A faixa do peito: abaixo do queixo até a base útil. Os textos de quadro cheio ficam nela.
export type Faixa = { topo: number; base: number };
export const faixaDoPeito = (plano: Plano): Faixa => {
  const zona = plano.zona ?? ZONA_PADRAO;
  // o cortar.mjs do 16:9 põe a zona ~60 px abaixo do queixo
  const queixo = zona.topo - 60;
  return { topo: clamp(queixo + 16, 560, 720), base: BASE_UTIL };
};

// Onde fica o centro de um bloco de altura `altura` na faixa do peito: logo abaixo do queixo (o
// centro a ~45% da faixa), nunca abaixo da base; se não couber, sobe (nunca sai do quadro).
// `largura` e `giro`: o bloco inclinado desce na ponta (um bloco de 1400 px a 3° desce ~37 px):
// a ponta também fica acima da base.
export const centroNoPeito = (f: Faixa, altura: number, largura = 0, giro = 0) => {
  const h = f.base - f.topo;
  const ponta = (largura / 2) * Math.sin((Math.abs(giro) * Math.PI) / 180);
  const ideal = f.topo + Math.max(altura / 2, h * 0.45);
  return Math.max(altura / 2 + ponta + 24, Math.min(f.base - altura / 2 - ponta, ideal));
};

// Onde fica a borda esquerda de um bloco de largura `largura` centrado em `cx`, sem sair das margens.
export const esquerdaCentrada = (cx: number, largura: number) => clamp(cx - largura / 2, MARGEM, QUADRO.w - MARGEM - largura);

export type Layout = {
  // 0 = quadro cheio, 1 = pessoa na moldura da direita
  naMoldura: (t: number) => number;
  caixa: (t: number) => Caixa;
  // centro da legenda (x e y) e a largura máxima dela
  legenda: (t: number) => { x: number; y: number; largura: number };
  // a faixa do peito (textos de quadro cheio) e o centro horizontal deles (o rosto)
  peito: Faixa;
  centroX: number;
  caixaMoldura: Caixa;
  livreDesde: (de: number) => number;
};

export const prepararLayout = (plano: Plano): Layout => {
  const trechos = trechosNoPlacar(plano);
  const rostoX = plano.rosto.x;
  const rostoY = plano.rosto.y;

  // a moldura da direita: o rosto centralizado na largura dela, a ~40% da altura
  const caixaMoldura: Caixa = { ...MOLDURA, raio: 0, zoom: ZOOM_MOLDURA, ancoraX: 0.5, ancoraY: ANCORA_MOLDURA };

  const naMoldura = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      const entra = interpolate(t, [a, a + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      const sai = interpolate(t, [b - 0.02, b + 0.36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };

  const caixa = (t: number): Caixa => {
    const p = naMoldura(t);
    // quadro cheio: o vídeo 16:9 inteiro, como foi gravado (sem zoom)
    const cheio: Caixa = { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h, raio: 0, zoom: 1, ancoraX: rostoX, ancoraY: rostoY };
    if (p <= 0) return cheio;
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: mix(0, caixaMoldura.x),
      y: 0,
      w: mix(QUADRO.w, caixaMoldura.w),
      h: QUADRO.h,
      raio: 0,
      zoom: mix(1, caixaMoldura.zoom ?? 1),
      ancoraX: mix(rostoX, caixaMoldura.ancoraX ?? 0.5),
      ancoraY: mix(rostoY, caixaMoldura.ancoraY ?? 0.4),
    };
  };

  // a legenda fica sempre no terço de baixo; com a pessoa na moldura, centrada nela
  const legenda = (t: number) => {
    const p = naMoldura(t);
    return {
      x: QUADRO.w / 2 + (MOLDURA.x + MOLDURA.w / 2 - QUADRO.w / 2) * p,
      y: LEGENDA_Y,
      largura: LEGENDA_CHEIO + (LEGENDA_MOLDURA - LEGENDA_CHEIO) * p,
    };
  };

  // primeiro instante (a partir de `de`) em que a pessoa já voltou quase toda para o quadro cheio:
  // os textos do peito esperam por ele, para nunca caírem em cima do rosto que ainda está voltando
  const livreDesde = (de: number) => {
    for (let x = de; x < de + 0.6; x += 0.02) if (naMoldura(x) < 0.22) return x;
    return de + 0.6;
  };

  return { naMoldura, caixa, legenda, peito: faixaDoPeito(plano), centroX: rostoX * QUADRO.w, caixaMoldura, livreDesde };
};

// --- tempos de cada momento na tela ---

export type Vizinhanca = {
  // o placar que entra cruza com o placar que sai (o novo espera o velho sumir)
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
  // o placar fica embaixo da pessoa enquanto ela volta para o quadro cheio por cima dele, ou embaixo
  // do próximo placar
  else if (noPlacar(m)) fim = vaiParaOutro ? m.ate + 0.5 : m.ate + 0.42;
  return { vemDeOutro, vaiParaOutro, fim };
};
