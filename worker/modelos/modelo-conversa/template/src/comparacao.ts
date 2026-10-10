// Geometria da comparação (duas faixas): calculada sem o DOM, para a bolha da pessoa saber o espaço
// que sobra embaixo delas e o texto diminuir só quando precisa.
import type { Msg } from "./blocos";
import { medidas } from "./fio";
import type { Comparacao } from "./plano";
import { ajustarTexto, BOLHA, CONVERSA_TOPO, FIXADA, FOLGA_BOLHA, MARGEM, W } from "./tema";

export const FAIXA = { largura: W - 2 * MARGEM, pad: 30, gap: 64, rotulo: 54, topo: 22 };
// a bolha nesta tela: o que sobrar embaixo das faixas, entre estes limites
export const BOLHA_FAIXAS = { min: 470, max: 640 };

export type GeoComparacao = { corpo: number; rotulo: number; alturas: [number, number]; total: number };

const larguraBalao = () => FAIXA.largura - 2 * FAIXA.pad + 12;

// o maior corpo (de 74 a 46) em que as duas faixas cabem em `altura`, com até 2 linhas por balão
export const geoComparacao = (m: Comparacao, altura: number): GeoComparacao => {
  const rotulo = Math.min(...m.lados.map((l) => ajustarTexto(l.rotulo, FAIXA.largura - 2 * FAIXA.pad - 100, FAIXA.rotulo, 38, 800, 1).corpo));
  const alturaFaixa = (texto: string, corpo: number) => {
    const msg: Msg = { de: "eu", em: 0, texto };
    const med = medidas(msg, corpo, larguraBalao(), true);
    return { h: FAIXA.pad + Math.round(rotulo * 1.2) + 18 + med.h + FAIXA.pad, linhas: med.linhas.length };
  };
  let ultima: GeoComparacao | null = null;
  for (let c = 74; c >= 46; c -= 2) {
    const a = m.lados.map((l) => alturaFaixa(l.texto, c));
    const total = a[0].h + a[1].h + FAIXA.gap;
    ultima = { corpo: c, rotulo, alturas: [a[0].h, a[1].h], total };
    if (total <= altura && a.every((x) => x.linhas <= 2)) return ultima;
  }
  return ultima as GeoComparacao;
};

export const larguraDoBalaoDaFaixa = larguraBalao;

// topo da área da conversa nesta tela (sem título, a barra da fixada recolhe)
export const topoDaComparacao = (m: Comparacao) => CONVERSA_TOPO - (m.titulo ? 0 : FIXADA.altura);

// a bolha: grande quando as faixas são curtas, menor quando o texto pede espaço
export const diametroDaComparacao = (m: Comparacao) => {
  const topo = topoDaComparacao(m);
  const livre = (d: number) => BOLHA.base - d - FOLGA_BOLHA - topo - FAIXA.topo - 10;
  // o maior corpo que cabe com a bolha no mínimo; a bolha fica com o espaço que sobrar
  const geo = geoComparacao(m, livre(BOLHA_FAIXAS.min));
  const d = BOLHA.base - FOLGA_BOLHA - topo - FAIXA.topo - 10 - geo.total;
  return Math.min(BOLHA_FAIXAS.max, Math.max(BOLHA_FAIXAS.min, d));
};
