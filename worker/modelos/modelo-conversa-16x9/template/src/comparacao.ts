// Geometria da comparação (duas faixas): calculada sem o DOM, para o texto diminuir só quando precisa.
// No quadro deitado as faixas ficam no quadro da esquerda (a coluna da conversa), uma embaixo da
// outra; a bolha fica na moldura da direita e não divide a altura com elas.
import type { Msg } from "./blocos";
import { medidas } from "./fio";
import type { Comparacao } from "./plano";
import { ajustarTexto, COLUNA } from "./tema";

export const FAIXA = { largura: COLUNA.w, pad: 30, gap: 64, rotulo: 54, topo: 22 };

export type GeoComparacao = { corpo: number; rotulo: number; alturas: [number, number]; total: number };

// o balão da faixa não passa de ~76% da faixa (fica com cara de mensagem, não de barra)
const larguraBalao = () => Math.round(Math.min(FAIXA.largura - 2 * FAIXA.pad + 12, FAIXA.largura * 0.76));

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
