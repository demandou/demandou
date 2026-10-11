// A gramática de layout do Ao Pé da Letra no quadro DEITADO (16:9, 1920×1080), a versão do vídeo
// completo do YouTube. O estilo é o mesmo do vertical; muda só a diagramação, pela regra da aula 9
// do curso (editar uma aula horizontal):
// - Quadro cheio é a BASE: a pessoa na tela inteira; os blocos curtos entram no mesmo cartão de
//   tinta no peito, logo abaixo do queixo e centrado no rosto. No quadro deitado não cabe uma pilha
//   alta: o cartão fica mais largo e mais baixo, e se não couber abaixo do queixo ele sobe só o
//   necessário para não passar da área segura de baixo.
// - Painel: quando o bloco pede apoio visual (a assinatura `literal` e os blocos de lista,
//   comparação e gráfico), o vermelho-carimbo toma o quadro, a pessoa vai para uma MOLDURA do lado
//   direito (rosto centralizado nela e acompanhado suavemente pelo rastro) e o bloco ocupa o QUADRO
//   do lado esquerdo. Quando a ideia termina, a pessoa cresce de volta para a tela inteira.
// - Legenda: na área segura de baixo, numa linha só (o corpo encolhe para caber), acima dos
//   controles do player. Com o painel, ela fica embaixo do quadro, ao lado da moldura.
//
//   [ QUADRO (o bloco, x 96 a 1216)              |  MOLDURA (a pessoa, x 1264 a 1824) ]
//   [ legenda (embaixo do quadro, até y 976)     |                                     ]
import { CHEIO_16x9, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { ehPainel, type Momento, type Plano } from "./plano";

// --- medidas do quadro deitado ---
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_PLAYER = 984;

// a moldura da pessoa, à direita: retrato alto (cabeça, ombros e peito), com o rosto no meio
export const MOLDURA: Caixa = { x: 1264, y: 64, w: 560, h: 912, raio: 40, zoom: 1.12, ancoraY: 0.36 };
// o quadro do painel, à esquerda da moldura e acima da legenda
export const PAINEL = { x: MARGEM, y: 64, w: 1120, h: 808 };

// a legenda: a base da faixa (o fundo dela) e o corpo, de 48 a 36 px, numa linha só
export const LEGENDA = { base: 976, maximo: 48, minimo: 36, altura: 88 };
// o cartão no peito: largura e margem interna
export const CARTAO = { largura: 1080, pad: 36 };

const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// --- a caixa da pessoa ao longo do vídeo ---

export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const estados: EstadoDaCaixa[] = [{ de: -1, caixa: CHEIO_16x9, dur: 0 }];
  const ordem = ordenar(plano);
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    const de = m.de - 0.05;
    estados.push({ de, caixa: ehPainel(m) ? MOLDURA : CHEIO_16x9, dur: 0.55 });
    // depois do momento, se a fala segue sem bloco, a pessoa volta para a tela inteira
    if (!proximo || proximo.de - m.ate > 0.3) estados.push({ de: m.ate, caixa: CHEIO_16x9, dur: 0.5 });
  });
  // tira estados repetidos (a mesma caixa duas vezes seguidas)
  return estados
    .sort((a, b) => a.de - b.de)
    .filter((e, i, l) => i === 0 || JSON.stringify(e.caixa) !== JSON.stringify(l[i - 1].caixa));
};

// quanto da tela a pessoa ocupa (1 = cheia, 0 = moldura): para mostrar a borda e o nome
const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const cheiura = (c: Caixa) => entre((c.w - MOLDURA.w) / (QUADRO.w - MOLDURA.w), 0, 1);

// --- onde entram o cartão no peito e a legenda ---

export type Lugar = { x: number; queixo: number; limite: number };
// O cartão no peito: centrado no rosto (sem passar das margens), começando logo abaixo do queixo
// (o cortar.mjs do 16:9 põe a `zona` 60 px abaixo dele). `limite` é até onde ele pode descer: a
// área segura de baixo, ou o topo da legenda quando o momento tem `legenda: true`.
export const lugarDoCartao = (plano: Plano, m: Momento): Lugar => {
  const centro = plano.rosto.x * QUADRO.w;
  const x = Math.round(entre(centro - CARTAO.largura / 2, MARGEM, QUADRO.w - MARGEM - CARTAO.largura));
  const queixo = (plano.zona?.topo ?? 640) - 60;
  const limite = m.legenda ? LEGENDA.base - LEGENDA.altura - 16 : LIMITE_PLAYER - 16;
  return { x, queixo, limite };
};

export type LugarDaLegenda = { cx: number; largura: number; base: number };
// tela cheia: centrada no quadro; com o painel: embaixo do quadro, sem invadir a moldura
export const LEGENDA_CHEIA: LugarDaLegenda = { cx: QUADRO.w / 2, largura: QUADRO.w - 2 * MARGEM - 160, base: LEGENDA.base };
export const LEGENDA_NO_PAINEL: LugarDaLegenda = { cx: PAINEL.x + PAINEL.w / 2, largura: PAINEL.w, base: LEGENDA.base };

// --- trocas entre painéis ---

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
