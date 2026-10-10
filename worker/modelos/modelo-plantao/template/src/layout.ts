// A gramática do Plantão, em tempo: em que quadro a pessoa está (cheio, dividida, lateral), quando
// ela troca e onde fica o painel gráfico. Tudo sai dos momentos do plano.
import type { Caixa, EstadoDaCaixa, Rosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { COLUNA, H, LETREIRO, TOPO, W, zona as zonaPadrao } from "./tema";

export type Quadro = "cheio" | "dividida" | "lateral";

// duração da troca de quadro (a caixa da pessoa muda de tamanho e lugar)
export const TROCA = 0.5;
// a troca começa um pouco antes do momento: o corte que costuma ficar na fronteira cai no meio
// do movimento e some
export const ANTES = 0.2;

// Os blocos de painel abrem a tela dividida; as tarjas ficam em quadro cheio.
const PAINEIS = ["grafico", "nota", "dado", "topicos", "passos", "numero", "comparacao", "frase", "etiqueta"];
export const quadroDe = (m: Momento): Quadro => {
  if (m.tipo === "etiqueta") return m.quadro === "lateral" ? "lateral" : "dividida";
  if (m.tipo === "pergunta") return m.opcoes?.length ? "dividida" : "cheio";
  return PAINEIS.includes(m.tipo) ? "dividida" : "cheio";
};
export const ehPainel = (m: Momento) => quadroDe(m) !== "cheio";

export const ordenar = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
export const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Linha da tela dividida (px): logo abaixo do queixo, para a pessoa ficar com rosto e ombros
export const divisaDe = (plano: Plano) => {
  const z = { ...zonaPadrao, ...plano.zona };
  return Math.round(Math.min(980, Math.max(860, z.topo - 70)));
};

// Onde fica o queixo no quadro cheio (px). Com o rastro, vem da largura do rosto medida no vídeo
// (o cortar.mjs usa a mesma conta); sem ele, da zona (o cortar põe a zona 170 px abaixo do queixo).
export const queixoDe = (plano: Plano) => {
  const rastro = (plano.rosto as Rosto).rastro;
  const z = { ...zonaPadrao, ...plano.zona };
  const yRosto = plano.rosto.y * H;
  const pelaZona = z.topo - 170;
  if (!rastro?.largura) return pelaZona;
  const distancia = rastro.largura * W * 0.66;
  return Math.max(pelaZona, yRosto + distancia);
};

// O topo das artes de quadro cheio: nunca acima do queixo (o rosto nunca é coberto)
export const topoDasArtes = (plano: Plano) => Math.round(Math.max(zonaPadrao.topo - 40, queixoDe(plano) + 36));

// Onde fica o painel gráfico em cada quadro
export type Area = { x: number; y: number; w: number; h: number };
export const painelDe = (quadro: Quadro, plano: Plano): Area => {
  if (quadro === "lateral") return { x: 0, y: TOPO + 90, w: COLUNA, h: LETREIRO.y - (TOPO + 90) };
  const y = divisaDe(plano);
  return { x: 0, y, w: W, h: LETREIRO.y - y };
};

// O enquadramento da pessoa em cada quadro
const zoomCheio = (plano: Plano) => {
  const fx = plano.rosto.x;
  return Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
};
export const caixaDe = (quadro: Quadro, plano: Plano): Caixa => {
  const rostoY = plano.rosto.y * H;
  if (quadro === "dividida") {
    const h = divisaDe(plano);
    // o rosto não sai do lugar: a tela dividida só recorta o corpo. Em gravação muito perto da
    // câmera (o queixo passaria da linha), a pessoa diminui um pouco, presa no alto, até o queixo
    // caber com folga: a faixa da pessoa fica mais estreita, com o estúdio dos dois lados.
    const escala = Math.min(1, (h - 40) / queixoDe(plano));
    if (escala < 0.999) {
      const w = Math.max(700, Math.round(W * escala));
      return { x: Math.round((W - w) / 2), y: 0, w, h, raio: 0, zoom: zoomCheio(plano), ancoraY: Math.min(0.72, (rostoY * (w / W)) / h) };
    }
    return { x: 0, y: 0, w: W, h, raio: 0, zoom: zoomCheio(plano), ancoraY: Math.min(0.72, rostoY / h) };
  }
  if (quadro === "lateral") return { x: W - COLUNA, y: 0, w: COLUNA, h: H, raio: 0, zoom: 1, ancoraY: plano.rosto.y };
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom: zoomCheio(plano), ancoraY: plano.rosto.y };
};

// Trechos do vídeo e o quadro de cada um (trecho sem momento = quadro cheio)
export type Trecho = { de: number; ate: number; quadro: Quadro };
export const trechosDe = (plano: Plano): Trecho[] => {
  const lista: Trecho[] = [];
  let cursor = 0;
  for (const m of plano.momentos) {
    if (m.de > cursor + 0.05) lista.push({ de: cursor, ate: m.de, quadro: "cheio" });
    lista.push({ de: m.de, ate: fimDe(m, plano), quadro: quadroDe(m) });
    cursor = Math.max(cursor, fimDe(m, plano));
  }
  if (cursor < plano.duracao) lista.push({ de: cursor, ate: plano.duracao + 1, quadro: "cheio" });
  // trechos vizinhos no mesmo quadro viram um só
  const juntos: Trecho[] = [];
  for (const tr of lista) {
    const ultimo = juntos[juntos.length - 1];
    if (ultimo && ultimo.quadro === tr.quadro) ultimo.ate = tr.ate;
    else juntos.push({ ...tr });
  }
  return juntos;
};

// Estados da caixa da pessoa ao longo do vídeo. Em todo trecho a câmera se aproxima devagar (3,5%)
// enquanto ele dura — a pessoa nunca fica "congelada" na tela dividida. Um corte no meio de um
// trecho em quadro cheio, longe de uma troca, ganha uma troca seca de enquadramento (7%) para
// disfarçar o pulo.
const APROXIMA = 1.035;
export const estadosDaPessoa = (plano: Plano): EstadoDaCaixa[] => {
  const trechos = trechosDe(plano);
  const estados: EstadoDaCaixa[] = [];
  trechos.forEach((tr, i) => {
    const caixa = caixaDe(tr.quadro, plano);
    const inicio = i === 0 ? 0 : Math.max(0, tr.de - ANTES);
    estados.push({ de: inicio, caixa, dur: i === 0 ? 0.001 : TROCA });
    const fim = Math.min(tr.ate, plano.duracao) - ANTES;
    const cortes = tr.quadro === "cheio" ? (plano.cortesEm ?? []).filter((c) => c > inicio + TROCA + 0.6 && c < fim - 0.6) : [];
    let de = inicio + (i === 0 ? 0 : TROCA);
    let zoom = caixa.zoom ?? 1;
    let aproximado = false;
    for (const c of [...cortes, fim]) {
      if (c - de > 0.8) {
        estados.push({ de, caixa: { ...caixa, zoom }, dur: 0.001 });
        estados.push({ de: de + 0.002, caixa: { ...caixa, zoom: zoom * APROXIMA }, dur: c - de - 0.002 });
      }
      if (c === fim) break;
      aproximado = !aproximado;
      zoom = (caixa.zoom ?? 1) * (aproximado ? 1.07 : 1);
      de = c;
    }
  });
  return estados.sort((a, b) => a.de - b.de);
};

// Em que quadro a pessoa está agora e quanto da troca já andou
export const quadroNoTempo = (t: number, plano: Plano) => {
  const trechos = trechosDe(plano);
  let atual = trechos[0];
  for (const tr of trechos) if (t >= Math.max(0, tr.de - ANTES)) atual = tr;
  return atual?.quadro ?? "cheio";
};
