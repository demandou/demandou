// Geometria do cartão de gráfico (o gráfico é "compartilhado" na conversa como um cartão claro).
// Calculada sem o DOM: a altura entra na rolagem da conversa antes de o cartão ser desenhado.
import type { Grafico } from "./plano";
import { ajustarTexto, formatarNumero, larguraTexto } from "./tema";

export const PAD_GRAFICO = 30;
// a linha de cima (etiqueta "ilustrativo" e a unidade)
export const TOPO_GRAFICO = 58;
// o cartão cabe entre a mensagem fixada e a pessoa
const ALTURA_MAXIMA = 540;

export type Barra = { rotulo: string[]; corpoRotulo: number; valor: string; y: number; h: number };

export type GeoGrafico = {
  w: number;
  h: number;
  forma: "barras" | "linha" | "pizza" | "tendencia";
  temTopo: boolean;
  // área do desenho (dentro do cartão)
  area: { x: number; y: number; w: number; h: number };
  // barras: rótulo à esquerda, barra à direita
  colunaRotulo: number;
  barras: Barra[];
  // linha: rótulos embaixo
  corpoEixo: number;
  rotulosEixo: string[][];
  corpoValor: number;
};

const rotuloValor = (g: Grafico, v: number) => {
  const casas = Number.isInteger(v) ? 0 : 1;
  return formatarNumero(v, casas);
};

export const valorNaTela = rotuloValor;

export const geoGrafico = (g: Grafico, w: number): GeoGrafico => {
  const dados = g.dados ?? [];
  const forma = dados.length >= 2 ? g.forma : "tendencia";
  const temTopo = !!(g.ilustrativo || g.unidade || forma === "tendencia");
  const topo = PAD_GRAFICO + (temTopo ? TOPO_GRAFICO : 0);
  const larguraUtil = w - 2 * PAD_GRAFICO;
  const base = { w, forma, temTopo, colunaRotulo: 0, barras: [] as Barra[], corpoEixo: 32, rotulosEixo: [] as string[][], corpoValor: 40 } as const;

  if (forma === "barras") {
    const n = dados.length;
    // rótulo à esquerda (até 2 linhas), barra à direita; com muitos dados ou rótulos longos a letra e a
    // linha diminuem para o cartão caber acima da pessoa (até ~540 px de altura)
    const tentativas: [number, number, number][] = [
      [40, 2, 0.4],
      [36, 2, 0.42],
      [34, 2, 0.45],
      [32, 1, 0.45],
      [30, 1, 0.5],
    ];
    let escolha: GeoGrafico | null = null;
    for (const [corpoRotulo, maxLinhas, coluna] of tentativas) {
      const colunaRotulo = Math.round(larguraUtil * coluna);
      const rotulos = dados.map((d) => ajustarTexto(d.rotulo, colunaRotulo - 20, corpoRotulo, 30, 600, maxLinhas));
      const alturaLinha = Math.max(n <= 4 ? 78 : 58, ...rotulos.map((r) => r.linhas.length * Math.round(r.corpo * 1.15) + 12));
      let y = topo;
      const barras: Barra[] = dados.map((d, i) => {
        const b = { rotulo: rotulos[i].linhas, corpoRotulo: rotulos[i].corpo, valor: rotuloValor(g, d.valor), y, h: alturaLinha };
        y += alturaLinha;
        return b;
      });
      escolha = { ...base, forma, h: y + PAD_GRAFICO - 6, colunaRotulo, barras, area: { x: PAD_GRAFICO, y: topo, w: larguraUtil, h: y - topo }, corpoValor: n <= 4 ? 42 : 36 };
      if (escolha.h <= ALTURA_MAXIMA) break;
    }
    return escolha as GeoGrafico;
  }

  if (forma === "pizza") {
    const n = dados.length;
    const alturaLinha = n <= 4 ? 74 : 60;
    const altura = Math.max(320, n * alturaLinha);
    return { ...base, forma, h: topo + altura + PAD_GRAFICO, area: { x: PAD_GRAFICO, y: topo, w: larguraUtil, h: altura }, corpoValor: n <= 4 ? 40 : 34 };
  }

  if (forma === "linha") {
    const n = dados.length;
    const fatia = larguraUtil / n;
    const corpoEixo = n <= 4 ? 34 : 30;
    const rotulosEixo = dados.map((d) => ajustarTexto(d.rotulo, fatia - 10, corpoEixo, 30, 600, 2).linhas);
    const linhas = Math.max(1, ...rotulosEixo.map((r) => r.length));
    const alturaEixo = linhas * Math.round(corpoEixo * 1.15) + 14;
    const alturaDesenho = 300;
    const maiorValor = Math.max(...dados.map((d) => larguraTexto(rotuloValor(g, d.valor), 38, 800)));
    return {
      ...base,
      forma,
      h: topo + alturaDesenho + alturaEixo + PAD_GRAFICO,
      area: { x: PAD_GRAFICO, y: topo, w: larguraUtil, h: alturaDesenho },
      corpoEixo,
      rotulosEixo,
      corpoValor: maiorValor > fatia - 6 ? 32 : 38,
    };
  }

  // tendência (sem números ditos): uma curva ilustrativa
  const alturaDesenho = 300;
  return { ...base, forma: "tendencia", h: topo + alturaDesenho + PAD_GRAFICO, area: { x: PAD_GRAFICO, y: topo, w: larguraUtil, h: alturaDesenho } };
};

// A curva da tendência (pontos de 0 a 1, y para cima)
export const pontosDaTendencia = (t: Grafico["tendencia"]): [number, number][] => {
  if (t === "cai") return [[0, 0.86], [0.18, 0.78], [0.34, 0.8], [0.52, 0.56], [0.66, 0.5], [0.82, 0.28], [1, 0.12]];
  if (t === "oscila") return [[0, 0.42], [0.16, 0.7], [0.32, 0.3], [0.5, 0.74], [0.66, 0.36], [0.82, 0.66], [1, 0.48]];
  return [[0, 0.12], [0.18, 0.24], [0.34, 0.2], [0.5, 0.46], [0.64, 0.42], [0.82, 0.7], [1, 0.88]];
};

// Caminho suave por pontos (curvas de Catmull-Rom convertidas em Bézier)
export const caminhoSuave = (p: [number, number][]) => {
  if (p.length < 2) return "";
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
};
