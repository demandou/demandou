// A gramática do Kit no quadro deitado (16:9, 1920×1080), para o vídeo completo do YouTube.
//
// No vertical a mesa fica em cima e a pessoa numa moldura larga embaixo, sempre. No quadro deitado
// não cabe uma pilha alta, e a regra é a da aula 9 do curso (editar uma aula horizontal):
//  1. a pessoa em TELA CHEIA é a base (o vídeo 16:9 inteiro, como foi gravado);
//  2. quando um momento pede apoio visual (todo bloco do Kit é uma peça na mesa), a pessoa desliza
//     para a MOLDURA do lado direito, com o rosto centralizado nela e acompanhado com suavidade
//     (o rastro do cortar.mjs), e a MESA ocupa o quadro do lado esquerdo. A borda da mesa, que no
//     vertical era a costura horizontal entre a mesa e a pessoa, vira uma costura vertical:
//
//        [ MESA (tampo, câmera, folhas e kit): x 0 a 1180  |  MOLDURA da pessoa: x 1180 a 1920 ]
//
//  3. nos respiros longos entre momentos (fala sem bloco), a pessoa volta para a tela cheia.
// A mesa é um mundo com coordenadas próprias (origem no centro da área útil); a câmera desliza
// por ele. Os blocos sem objetos são folhas postas no tampo, em coordenadas de tela (AREA).
import { Easing, interpolate } from "remotion";
import type { Caixa, Rosto } from "./motor/caixa";
import type { Kit, Momento, Plano } from "./plano";

// --- medidas do quadro (16:9, 1920×1080) ---
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// a borda da mesa: onde o tampo encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1180;
// a moldura da pessoa: a faixa da direita, na altura toda
export const MOLDURA = { x: COSTURA, y: 0, w: QUADRO.w - COSTURA, h: QUADRO.h };
// área útil da mesa (px de tela) para as folhas dos blocos: da margem segura até um vão antes da
// costura, abaixo da barra de progresso e acima do contador do kit e dos controles do player.
// É maior que a do vertical (960 × 724), então tudo o que cabia lá cabe aqui.
export const AREA = { x: MARGEM, y: 84, w: COSTURA - 64 - MARGEM, h: 800 };
// onde fica a origem do mundo na tela (centro da área útil da mesa)
export const ORIGEM = { x: AREA.x + AREA.w / 2, y: AREA.y + AREA.h / 2 };
// o contador do kit ("1 de 4"): no pé da mesa, acima dos controles do player
export const CONTADOR = { x: AREA.x, y: 904, h: 68 };
// legenda: o centro dela no terço de baixo, acima dos controles do player
export const LEGENDA_Y = 916;
// largura máxima da legenda no quadro cheio e na moldura (com folga das bordas da moldura)
export const LEGENDA_CHEIO = 1200;
export const LEGENDA_MOLDURA = MOLDURA.w - 120;

// o rosto na moldura: a fração da largura dela que o rosto ocupa (cabeça e ombros) e a altura do
// centro do rosto (0 = topo, 1 = base). O rosto gravado em 16:9 tem ~13% da largura do quadro.
const ROSTO_NA_MOLDURA = 0.4;
const ANCORA_MOLDURA = 0.4;
const ROSTO_PADRAO_16x9 = 0.13;
// teto da aproximação (acima disso a imagem perde nitidez)
const ZOOM_MAX = 2.2;
// a troca entre tela cheia e moldura (s); a pessoa sai um pouco antes do momento, para a mesa já
// estar aberta quando a primeira peça cai
const TROCA = 0.4;
const ANTECIPA = 0.3;
// respiro mais curto que isto entre dois momentos não volta para a tela cheia (evita o vaivém)
const RESPIRO_MIN = 1.2;

const suave = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

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

// o Kit mostra a legenda por padrão (a fala acompanha as peças que caem)
export const comLegendaPadrao = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (m.tipo === "kit" && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

// --- a pessoa: tela cheia ou moldura da direita ---

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};

// a pessoa em tela cheia, como foi gravada (zoom 1, o rosto onde está)
export const caixaCheia = (plano: Plano): Caixa => ({
  x: 0,
  y: 0,
  w: QUADRO.w,
  h: alturaDoVideo(plano),
  raio: 0,
  zoom: 1,
  ancoraX: plano.rosto.x,
  ancoraY: (plano.rosto.y * QUADRO.h) / alturaDoVideo(plano),
});

// a pessoa na moldura da direita: o rosto no centro da largura, a ~40% da altura. O zoom sai da
// largura do rosto medida pelo rastreio (gravação perto da câmera aproxima menos, nunca abaixo de 1).
export const caixaNaMoldura = (plano: Plano): Caixa => {
  const base = Math.max(MOLDURA.w / QUADRO.w, MOLDURA.h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * base;
  const zoom = clamp((ROSTO_NA_MOLDURA * MOLDURA.w) / rostoPx, 1, ZOOM_MAX);
  return { ...MOLDURA, raio: 0, zoom, ancoraX: 0.5, ancoraY: ANCORA_MOLDURA };
};

// fim de cada momento na tela (o kit fica na mesa por baixo do fechamento)
export type Vizinhanca = { fim: number; saiPara: boolean };
export const vizinhanca = (m: Momento, plano: Plano): Vizinhanca => {
  const ordem = ordenar(plano);
  const i = ordem.indexOf(m);
  const proximo = ordem[i + 1];
  // o kit continua na mesa por baixo do fechamento
  if (m.tipo === "kit" && proximo?.tipo === "cta") return { fim: plano.duracao + 1, saiPara: false };
  if (!proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return { fim: plano.duracao + 1, saiPara: false };
  return { fim: m.ate + 0.32, saiPara: true };
};

// Trechos com a mesa aberta (pessoa na moldura): cada momento abre um; momentos separados por um
// respiro curto viram um trecho só (a mesa fica aberta, vazia, entre eles).
export const trechosDaMesa = (plano: Plano): [number, number][] => {
  const lista: [number, number][] = [];
  for (const m of ordenar(plano)) {
    const de = Math.max(0, m.de - ANTECIPA);
    const ate = Math.min(plano.duracao + 1, vizinhanca(m, plano).fim);
    const u = lista[lista.length - 1];
    if (u && de - u[1] < RESPIRO_MIN) u[1] = Math.max(u[1], ate);
    else lista.push([de, ate]);
  }
  return lista;
};

export type Layout = {
  // 0 = pessoa em tela cheia, 1 = pessoa na moldura da direita (mesa aberta)
  naMoldura: (t: number) => number;
  caixa: (t: number) => Caixa;
  // centro da legenda (x e y) e a largura máxima dela
  legenda: (t: number) => { x: number; y: number; largura: number };
};

export const prepararLayout = (plano: Plano): Layout => {
  const trechos = trechosDaMesa(plano);
  const cheia = caixaCheia(plano);
  const moldura = caixaNaMoldura(plano);

  const naMoldura = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      // o primeiro momento no começo do vídeo já abre com a mesa (sem deslizar no quadro 0)
      const entra = a <= 0.01 ? 1 : interpolate(t, [a, a + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      const sai = interpolate(t, [b - 0.02, b + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };

  const caixa = (t: number): Caixa => {
    const p = naMoldura(t);
    if (p <= 0) return cheia;
    if (p >= 1) return moldura;
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: mix(cheia.x, moldura.x),
      y: 0,
      w: mix(cheia.w, moldura.w),
      h: mix(cheia.h, moldura.h),
      raio: 0,
      zoom: mix(cheia.zoom ?? 1, moldura.zoom ?? 1),
      ancoraX: mix(cheia.ancoraX ?? 0.5, moldura.ancoraX ?? 0.5),
      ancoraY: mix(cheia.ancoraY ?? 0.4, moldura.ancoraY ?? 0.4),
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

  return { naMoldura, caixa, legenda };
};

// ——— a geometria do kit (mundo) ———

export const CELULA_W = 540;
// altura útil do mundo na vista geral (px de tela): a área da mesa menos um respiro
const ALTURA_GERAL = AREA.h - 40;
export type Geometria = {
  n: number;
  cols: number;
  rows: number;
  celH: number;
  carta: number; // lado do cartão do objeto
  // centro de cada célula (mundo)
  centros: { x: number; y: number }[];
  // zoom da vista geral e do mergulho em cada lugar
  zGeral: number;
  zItem: number;
  // faixa de baixo (total)
  yTotal: number;
  yGeral: number;
};
export const geometria = (n: number): Geometria => {
  const N = Math.max(1, n);
  const cols = N === 1 ? 1 : 2;
  const rows = Math.ceil(N / cols);
  const celH = rows === 1 ? 360 : rows === 2 ? 316 : 240;
  const altura = rows * celH + 90;
  const centros: { x: number; y: number }[] = [];
  const topo = -altura / 2 + 10;
  for (let i = 0; i < N; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const ultimaSozinha = N % 2 === 1 && i === N - 1 && N > 1;
    const x = cols === 1 || ultimaSozinha ? 0 : c === 0 ? -CELULA_W / 2 : CELULA_W / 2;
    centros.push({ x, y: topo + celH * (r + 0.5) });
  }
  // a vista geral cabe na área da mesa (largura e altura), com o total embaixo
  const zGeral = Math.min(0.96, ALTURA_GERAL / altura, cols === 1 ? 1 : (AREA.w - 20) / (2 * CELULA_W));
  const yTotal = topo + rows * celH + 48;
  // o centro do mundo na tela é a ORIGEM; a vista geral centra o conjunto
  return { n: N, cols, rows, celH, carta: rows === 1 ? 240 : rows === 2 ? 186 : 150, centros, zGeral, zItem: cols === 1 ? 1.5 : 1.8, yTotal, yGeral: 20 };
};

// ——— a câmera ———

export type Camera = { x: number; y: number; z: number };
type Transicao = { ini: number; fim: number; para: Camera };

export const camera = (plano: Plano) => {
  const trans: Transicao[] = [];
  const inicial: Camera = { x: 0, y: 0, z: 1 };
  let desvio = 0;
  let anterior: Momento | undefined;
  for (const m of ordenar(plano)) {
    const sobreOKit = anterior?.tipo === "kit" && m.tipo === "cta";
    anterior = m;
    if (sobreOKit) continue; // o fechamento cai sobre o kit completo: a câmera não sai do lugar
    if (m.tipo === "kit") {
      const g = geometria(m.itens.length);
      const geral: Camera = { x: 0, y: g.yGeral, z: g.zGeral };
      trans.push({ ini: m.de - 0.1, fim: m.de + 0.5, para: geral });
      for (const it of [...m.itens].sort((a, b) => a.em - b.em)) {
        const c = g.centros[m.itens.indexOf(it)];
        trans.push({ ini: it.em - 0.42, fim: it.em - 0.02, para: { x: c.x, y: c.y + 8, z: g.zItem } });
      }
      const afasta = m.afastarEm ?? Math.max(...m.itens.map((i) => i.em)) + 1.4;
      trans.push({ ini: afasta - 0.25, fim: afasta + 0.55, para: geral });
    } else {
      // blocos sem objetos: a mesa escorrega para outro pedaço do tampo
      const k = desvio++;
      const alvo: Camera = { x: [160, -170, 90, -120][k % 4], y: [70, -50, -90, 60][k % 4], z: 1 };
      trans.push({ ini: m.de - 0.12, fim: m.de + 0.5, para: alvo });
    }
  }
  trans.sort((a, b) => a.ini - b.ini);
  return (t: number): Camera => {
    let cur = inicial;
    for (const tr of trans) {
      if (t >= tr.fim) {
        cur = tr.para;
        continue;
      }
      if (t > tr.ini) {
        const p = interpolate(t, [tr.ini, tr.fim], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
        cur = { x: cur.x + (tr.para.x - cur.x) * p, y: cur.y + (tr.para.y - cur.y) * p, z: cur.z + (tr.para.z - cur.z) * p };
      }
      break;
    }
    // a câmera "respira": uma deriva mínima, para a mesa nunca ficar congelada
    return { x: cur.x + 5 * Math.sin(t * 0.8), y: cur.y + 4 * Math.cos(t * 0.65), z: cur.z * (1 + 0.004 * Math.sin(t * 0.9)) };
  };
};

export const itensDoKit = (k: Kit) => k.itens;
