// A gramática do Kit: a mesa em cima, a pessoa numa moldura larga embaixo (sempre).
// A mesa é um mundo com coordenadas próprias (origem no centro do kit); a câmera desliza por ele.
// Os blocos sem objetos (título, lista, número…) são folhas de papel postas no tampo, em coordenadas de tela.
import { Easing, interpolate } from "remotion";
import type { Caixa } from "./motor/caixa";
import type { Kit, Momento, Plano } from "./plano";

// a borda da mesa: onde o tampo encontra a moldura da pessoa
export const COSTURA = 900;
// onde fica a origem do mundo na tela (centro da área útil da mesa, abaixo da interface do Reels)
export const ORIGEM = { x: 540, y: 495 };
// área útil da mesa (px de tela) para as folhas dos blocos
export const AREA = { x: 60, y: 146, w: 960, h: 724 };

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

// ——— a pessoa: moldura larga embaixo ———

export const caixaDaPessoa = (plano: Plano): Caixa => {
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.32) * 1080;
  const alturaBox = 1920 - COSTURA;
  const alvoRosto = COSTURA + 30 + 0.93 * larguraRosto;
  return { x: 0, y: COSTURA, w: 1080, h: alturaBox, raio: 0, zoom: 1, ancoraY: clamp((alvoRosto - COSTURA) / alturaBox, 0.25, 0.5) };
};
// centro da legenda: logo abaixo do queixo
export const yLegenda = (plano: Plano) => {
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.32) * 1080;
  const rostoY = COSTURA + 30 + 0.93 * larguraRosto;
  return rostoY + 0.69 * larguraRosto + 92;
};

// ——— a geometria do kit (mundo) ———

export const CELULA_W = 540;
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
  const zGeral = Math.min(0.96, 700 / altura, cols === 1 ? 1 : 1040 / (2 * CELULA_W));
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

// tempos de cada momento na tela
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
export const itensDoKit = (k: Kit) => k.itens;
