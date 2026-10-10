// A gramática de layout do Pronúncia.
// - Quadro cheio: a pessoa na tela inteira; os blocos curtos entram num cartão violeta no peito.
// - Ficha: o painel violeta ocupa a parte de cima e a pessoa desce para uma moldura larga embaixo
//   (a assinatura `pronuncia` e os blocos de lista, comparação e gráfico).
// - Câmera lenta: a pessoa volta à tela inteira, um pouco mais perto, com a lupa na boca.
import { CHEIO, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { ehPainel, type Momento, type Palavra, type Plano, type Pronuncia } from "./plano";

// a moldura larga embaixo (cabeça inteira, ombros e um pouco do peito)
export const MOLDURA: Caixa = { x: 36, y: 1046, w: 1008, h: 838, raio: 44, zoom: 1.1, ancoraY: 0.43 };
// a tela inteira da câmera lenta: aproxima de leve (o "soco" de zoom que marca a repetição)
export const LENTA: Caixa = { ...CHEIO, zoom: 1.16, ancoraY: 0.3 };
// a área do painel (acima da moldura)
export const PAINEL = { x: 60, y: 84, w: 960, h: 940 };

const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// ——— a câmera lenta ———

export type Janela = {
  // quando a repetição começa e quando a voz normal volta (tempo do vídeo cortado)
  em: number;
  fim: number;
  // o trecho da fala que é repetido (a palavra) e a velocidade
  a: number;
  b: number;
  ritmo: number;
  // limites das sílabas faladas dentro de [a, b] (gravados pela ferramenta), a onda e o áudio
  silabas?: number[];
  onda?: number[];
  arquivo?: string;
};

const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const janelaLenta = (m: Momento, palavras: Palavra[]): Janela | null => {
  if (m.tipo !== "pronuncia" || !m.lenta) return null;
  const l = m.lenta;
  const a = l.origem?.[0] ?? l.de - 0.03;
  const b = l.origem?.[1] ?? l.ate + 0.05;
  const em = l.em ?? a;
  const proxima = palavras.find((p) => p.em > l.ate - 0.02)?.em;
  const fimPedido = l.fim ?? (proxima !== undefined ? proxima - 0.03 : em + (b - a) / 0.6);
  const ritmo = l.ritmo ?? entre((b - a) / Math.max(0.05, fimPedido - em), 0.45, 0.85);
  return { em, fim: em + (b - a) / ritmo, a, b, ritmo, silabas: l.silabas, onda: l.onda, arquivo: l.arquivo };
};

// ——— a caixa da pessoa ao longo do vídeo ———

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const estados: EstadoDaCaixa[] = [{ de: -1, caixa: CHEIO, dur: 0 }];
  const ordem = ordenar(plano);
  // fim da última câmera lenta: a troca seguinte espera ela acabar e sai num corte seco de zoom
  let fimLenta = -1;
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    const deLenta = m.de - 0.05 < fimLenta + 0.05;
    const de = Math.max(m.de - 0.05, fimLenta);
    if (ehPainel(m)) estados.push({ de, caixa: MOLDURA, dur: deLenta ? 0.42 : 0.55 });
    else estados.push({ de, caixa: CHEIO, dur: deLenta ? 0.14 : 0.55 });
    const j = janelaLenta(m, plano.palavras);
    if (j) {
      estados.push({ de: j.em, caixa: LENTA, dur: 0.12 });
      fimLenta = j.fim;
      if (j.fim < m.ate - 0.25) estados.push({ de: j.fim, caixa: MOLDURA, dur: 0.42 });
    }
    // depois do momento, se a fala segue sem bloco, a pessoa volta para a tela inteira
    if (!proximo || proximo.de - m.ate > 0.3) estados.push({ de: Math.max(m.ate, fimLenta), caixa: CHEIO, dur: m.ate < fimLenta + 0.05 ? 0.14 : 0.5 });
  });
  // tira estados repetidos (a mesma caixa duas vezes seguidas)
  return estados
    .sort((a, b) => a.de - b.de)
    .filter((e, i, l) => i === 0 || JSON.stringify(e.caixa) !== JSON.stringify(l[i - 1].caixa));
};

// quanto da tela a pessoa ocupa (1 = cheia, 0 = moldura): para mostrar a borda e o nome
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

// a ficha da mesma palavra (para o "repete comigo" achar a sílaba forte)
export const fichaDaPalavra = (plano: Plano, texto: string): Pronuncia | undefined => {
  const limpo = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return plano.momentos.find((m): m is Pronuncia => m.tipo === "pronuncia" && limpo(m.palavra) === limpo(texto));
};
