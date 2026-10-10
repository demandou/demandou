// A gramática de layout do Ao Pé da Letra.
// - Quadro cheio: a pessoa na tela inteira; os blocos curtos entram num cartão de tinta no peito.
// - Painel: o vermelho-carimbo ocupa a parte de cima e a pessoa desce para uma moldura larga
//   embaixo (a assinatura `literal` e os blocos de lista, comparação e gráfico).
import { CHEIO, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { ehPainel, type Momento, type Plano } from "./plano";

// a moldura larga embaixo (cabeça inteira, ombros e um pouco do peito)
export const MOLDURA: Caixa = { x: 36, y: 1046, w: 1008, h: 838, raio: 44, zoom: 1.1, ancoraY: 0.43 };
// a área do painel (acima da moldura)
export const PAINEL = { x: 60, y: 84, w: 960, h: 940 };

const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// ——— a caixa da pessoa ao longo do vídeo ———

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const estados: EstadoDaCaixa[] = [{ de: -1, caixa: CHEIO, dur: 0 }];
  const ordem = ordenar(plano);
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    const de = m.de - 0.05;
    estados.push({ de, caixa: ehPainel(m) ? MOLDURA : CHEIO, dur: 0.55 });
    // depois do momento, se a fala segue sem bloco, a pessoa volta para a tela inteira
    if (!proximo || proximo.de - m.ate > 0.3) estados.push({ de: m.ate, caixa: CHEIO, dur: 0.5 });
  });
  // tira estados repetidos (a mesma caixa duas vezes seguidas)
  return estados
    .sort((a, b) => a.de - b.de)
    .filter((e, i, l) => i === 0 || JSON.stringify(e.caixa) !== JSON.stringify(l[i - 1].caixa));
};

// quanto da tela a pessoa ocupa (1 = cheia, 0 = moldura): para mostrar a borda e o nome
const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const cheiura = (c: Caixa) => entre((c.h - MOLDURA.h) / (1920 - MOLDURA.h), 0, 1);

// ——— trocas entre painéis ———

// O momento seguinte (por ordem de início)
export const proximoDe = (m: Momento, plano: Plano) => ordenar(plano).find((o) => o.de > m.de);
export const anteriorDe = (m: Momento, plano: Plano) => [...ordenar(plano)].reverse().find((o) => o.de < m.de);

// dois painéis colados: o de saída sai por uma cortina enquanto o seguinte entra
export const CORTINA = 0.42;
export const emendaPainel = (m: Momento, outro?: Momento) => !!outro && ehPainel(m) && ehPainel(outro) && outro.de - m.ate < 0.4;

// até quando o momento fica montado
export const fimDoMomento = (m: Momento, plano: Plano) => {
  const proximo = proximoDe(m, plano);
  if (!proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  if (proximo && emendaPainel(m, proximo)) return proximo.de - 0.05 + CORTINA;
  // um painel antes da tela cheia: fica embaixo enquanto a pessoa cresce por cima dele
  if (ehPainel(m)) return m.ate + 0.6;
  // cartão de tela cheia antes de um painel: fica enquanto a pessoa já encolhe e some sobre o painel
  if (proximo && ehPainel(proximo) && proximo.de - m.ate < 0.4) return m.ate + 0.28;
  return m.ate;
};
