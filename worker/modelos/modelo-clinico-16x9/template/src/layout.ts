// Gramática de layout do modelo Clínico no quadro DEITADO (16:9, 1920×1080), a versão do vídeo
// completo do YouTube: onde fica a lupa (a pessoa num círculo) e onde ficam o cabeçalho
// (número + título) e o corpo (o desenho) em cada momento.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal): a tela cheia é a base; quando o bloco
// pede apoio visual, a pessoa vai para uma MOLDURA do lado DIREITO, com o rosto centralizado e
// acompanhado de leve (o rastro do cortar.mjs), e a explicação ocupa o QUADRO do lado ESQUERDO.
// No Clínico a moldura é a lupa: ela fica sempre na coluna da direita e muda de tamanho e de altura
// a cada momento (a viagem continua visível, como no vertical):
//
//   [ quadro: cabeçalho + corpo do exame          |  LUPA (rosto no centro) ]
//
//   topo   = lupa grande no meio da altura; título e corpo centralizados no quadro
//   centro = lupa com o mostrador em volta; o título (ou o número) no quadro
//   canto  = lupa pequena no alto; o título embaixo dela, na coluna da direita; o corpo ocupa o quadro inteiro
//   lado   = lupa média, mais alta; título e corpo alinhados à esquerda no quadro
//
// Em tela cheia ("cheio"), a pessoa fica como foi gravada e o texto entra numa faixa de névoa branca
// na base do quadro, abaixo do queixo, em fileiras e colunas (não numa pilha alta).
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_CHEIO, LEGENDA_Y, MARGEM, QUADRO, TOPO_MAX_CHEIO, TOPO_UTIL, zona as zonaPadrao } from "./tema";

export const LAYOUT_PADRAO: Record<Momento["tipo"], Layout> = {
  // universais
  abertura: "cheio",
  topicos: "canto",
  passos: "lado",
  numero: "centro",
  comparacao: "topo",
  grafico: "canto",
  destaque: "cheio",
  definicao: "topo",
  frase: "cheio",
  pergunta: "cheio",
  cta: "cheio",
  // próprios
  titulo: "cheio",
  contagem: "topo",
  cronometro: "centro",
  anatomia: "canto",
  checklist: "cheio",
};

// tipos que precisam da lupa (o conteúdo fica em volta dela): em "cheio" usam o padrão
const PRECISA_LUPA: Momento["tipo"][] = ["anatomia", "cronometro", "contagem", "topicos", "passos", "numero", "comparacao", "grafico", "definicao"];
// tipos que só existem em tela cheia (o texto entra na névoa)
const SO_CHEIO: Momento["tipo"][] = ["abertura", "titulo", "destaque", "frase", "pergunta", "cta"];
// tipos presos a um lugar: o mostrador gira em volta da lupa do centro
const FIXO: Partial<Record<Momento["tipo"], Layout>> = { cronometro: "centro", numero: "centro" };

export const layoutDe = (m: Momento): Layout => {
  const fixo = FIXO[m.tipo];
  if (fixo) return fixo;
  if (SO_CHEIO.includes(m.tipo)) return "cheio";
  // gráfico sem título: ao lado da lupa grande, o traçado usa o quadro inteiro
  if (m.tipo === "grafico" && !m.titulo && !m.layout) return "topo";
  const pedido = m.layout ?? LAYOUT_PADRAO[m.tipo];
  if (pedido === "centro") return LAYOUT_PADRAO[m.tipo];
  return pedido === "cheio" && PRECISA_LUPA.includes(m.tipo) ? LAYOUT_PADRAO[m.tipo] : pedido;
};

// A lupa em cada layout: centro (cx, cy) e diâmetro, em px no quadro 1920×1080. Todas na coluna da
// direita (a moldura da aula 9), com o centro perto de 74% da largura.
export const LUPAS: Record<Exclude<Layout, "cheio">, { cx: number; cy: number; d: number }> = {
  topo: { cx: 1420, cy: 475, d: 620 },
  centro: { cx: 1420, cy: 500, d: 420 },
  canto: { cx: 1572, cy: 282, d: 364 },
  lado: { cx: 1452, cy: 400, d: 500 },
};

export type Regiao = { x: number; y: number; w: number; h: number };
// cabeçalho e corpo do exame; `quadro` = o lado da explicação inteiro (o lugar do texto quando o
// bloco não tem título e ocupa também o lugar do cabeçalho)
export type Areas = { cabecalho: Regiao; corpo: Regiao; quadro: Regiao };

// Base útil do corpo: acima da legenda (que só aparece em momentos com `legenda: true`)
const BASE = LEGENDA_Y - 24;
// o anel graduado atrás da lupa vai até r + 46; o texto do quadro para antes dele, com folga
const FOLGA_DO_ANEL = 46 + 40;

// A faixa do texto em tela cheia: do topo da zona (abaixo do queixo) até BASE_CHEIO
export const faixaCheia = (plano: Plano): Regiao => {
  const z = { ...zonaPadrao, ...plano.zona };
  const topo = Math.round(Math.min(TOPO_MAX_CHEIO, Math.max(560, z.topo)));
  return { x: MARGEM, y: topo, w: QUADRO.w - 2 * MARGEM, h: BASE_CHEIO - topo };
};

export const areasDoLayout = (layout: Layout, plano: Plano): Areas => {
  switch (layout) {
    case "cheio": {
      // em tela cheia não há legenda junto do texto: a faixa desce até perto dos controles do player
      const f = faixaCheia(plano);
      return { cabecalho: f, corpo: f, quadro: f };
    }
    case "topo": {
      const { cx, d } = LUPAS.topo;
      const w = cx - d / 2 - FOLGA_DO_ANEL - MARGEM;
      const yCorpo = TOPO_UTIL + 220;
      return {
        cabecalho: { x: MARGEM, y: TOPO_UTIL, w, h: 200 },
        corpo: { x: MARGEM, y: yCorpo, w, h: BASE - yCorpo },
        quadro: { x: MARGEM, y: TOPO_UTIL, w, h: BASE - TOPO_UTIL },
      };
    }
    case "centro": {
      // o mostrador vai até d/2 + 62 + 46 em volta do centro da lupa
      const { cx, d } = LUPAS.centro;
      const w = cx - (d / 2 + 108) - 50 - MARGEM;
      return {
        cabecalho: { x: MARGEM, y: 120, w, h: 380 },
        corpo: { x: MARGEM, y: 520, w, h: BASE - 520 },
        quadro: { x: MARGEM, y: TOPO_UTIL, w, h: BASE - TOPO_UTIL },
      };
    }
    case "canto": {
      const { cx, cy, d } = LUPAS.canto;
      const xCab = cx - d / 2 - 70;
      const yCab = cy + d / 2 + 60;
      const direita = cx - d / 2 - FOLGA_DO_ANEL - 10;
      const corpo = { x: MARGEM - 10, y: TOPO_UTIL, w: direita - (MARGEM - 10), h: BASE - TOPO_UTIL };
      return {
        // o título fica embaixo da lupa, na coluna da direita (a pessoa e o nome do exame juntos)
        cabecalho: { x: xCab, y: yCab, w: QUADRO.w - MARGEM - xCab, h: BASE - yCab },
        corpo,
        quadro: corpo,
      };
    }
    case "lado": {
      const { cx, d } = LUPAS.lado;
      const w = cx - d / 2 - FOLGA_DO_ANEL - MARGEM;
      const yCorpo = TOPO_UTIL + 196;
      return {
        cabecalho: { x: MARGEM, y: TOPO_UTIL, w, h: 180 },
        corpo: { x: MARGEM - 10, y: yCorpo, w: w + 20, h: BASE - yCorpo },
        quadro: { x: MARGEM, y: TOPO_UTIL, w, h: BASE - TOPO_UTIL },
      };
    }
  }
};

// Alinhamento do título no cabeçalho de cada lugar: centralizado ao lado da lupa grande, do
// mostrador e embaixo da lupa pequena; à esquerda na lupa média (lista e conduta alinhadas).
export const alinharCabecalho = (layout: Layout): "esquerda" | "centro" => (layout === "lado" ? "esquerda" : "centro");

// Largura do rosto (fração da largura do quadro) medida pelo rastreio, quando houver
const larguraDoRosto = (plano: Plano) => (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// Zoom da pessoa dentro da lupa: o rosto ocupa ~43% do diâmetro (nunca menos que cobrir o círculo).
// No 16:9 o vídeo de trabalho é deitado: a escala 1 cobre o círculo pela altura, e o rosto gravado
// é estreito (~13% da largura do quadro), por isso o zoom sai maior que no vertical.
export const zoomDaLupa = (plano: Plano) => {
  if (plano.lupa?.zoom) return plano.lupa.zoom;
  const l = larguraDoRosto(plano) ?? 0.13;
  return Math.min(3, Math.max(1, (0.43 * alturaDoVideo(plano)) / (QUADRO.w * l)));
};

// Gravação muito perto da câmera (rosto enorme): o rosto desce um pouco no círculo para a testa caber
const ancoraDaLupa = (plano: Plano) => {
  const l = larguraDoRosto(plano);
  return l && (l * QUADRO.w) / alturaDoVideo(plano) > 0.5 ? 0.56 : 0.5;
};

// A caixa do vídeo em cada layout
export const caixaDoLayout = (layout: Layout, plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  if (layout === "cheio") {
    // o quadro como foi gravado; a troca de zoom (1 ↔ 1,06) aproxima em volta do rosto
    return {
      x: 0,
      y: 0,
      w: QUADRO.w,
      h: videoAltura,
      raio: 0,
      zoom: zoomCheio,
      ancoraY: (plano.rosto.y * QUADRO.h) / videoAltura,
      ancoraX: plano.rosto.x,
    };
  }
  const { cx, cy, d } = LUPAS[layout];
  return {
    x: cx - d / 2,
    y: cy - d / 2,
    w: d,
    h: d,
    raio: d / 2,
    // cabeça inteira no círculo, nariz no centro, um pouco de ombro: o zoom sai do tamanho do rosto
    // na gravação (o rastro do cortar.mjs); sem rastro, o padrão de quem grava sentado no 16:9
    zoom: zoomDaLupa(plano),
    ancoraY: plano.lupa?.ancoraY ?? ancoraDaLupa(plano),
  };
};

// Duração da viagem da lupa entre dois lugares
export const VIAGEM = 0.62;
// Da tela cheia para a lupa (e de volta), o primeiro trecho: o quadro vira um círculo grande em volta do rosto
export const IRIS = 0.22;

// O círculo grande em volta do rosto, com o vídeo na mesma escala da tela cheia (o rosto não pula).
// No quadro deitado ele ocupa quase a altura toda e fica centrado no rosto.
const iris = (plano: Plano, zoomCheio: number): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  const D = 960;
  const fx = plano.rosto.x * QUADRO.w;
  const fy = plano.rosto.y * QUADRO.h;
  const x = Math.min(QUADRO.w - D, Math.max(0, fx - D / 2));
  const y = Math.min(videoAltura - D, Math.max(0, fy - D / 2));
  return {
    x,
    y,
    w: D,
    h: D,
    raio: D / 2,
    zoom: zoomCheio / Math.max(D / QUADRO.w, D / videoAltura),
    ancoraY: (fy - y) / D,
    ancoraX: (fx - x) / D,
  };
};

// Sequência de estados da caixa ao longo do vídeo. Entre momentos com respiro, tela cheia.
// Em tela cheia o zoom alterna (1 ↔ 1,06) com troca seca nos cortes, para disfarçar o pulo.
export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  type Trecho = { de: number; layout: Layout };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: Layout) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02 || (ultimo.layout === "cheio" && trechos.length === 1 && de < 0.05)) ultimo.layout = layout;
    else if (!(layout === ultimo.layout)) trechos.push({ de, layout });
  };
  momentos.forEach((m, i) => {
    empurrar(Math.max(0, m.de), layoutDe(m));
    const prox = momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) empurrar(m.ate, "cheio");
  });

  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.2 && c - tr.de < 0.12);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }

  const estados: EstadoDaCaixa[] = [];
  let zoom = 1;
  let anterior: Layout | null = null;
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    if (tr.layout === "cheio") {
      if (anterior !== null && anterior !== "cheio") {
        // a lupa cresce: primeiro vira o círculo grande em volta do rosto, depois abre para a tela cheia
        estados.push({ de: tr.de, caixa: iris(plano, zoom === 1 ? 1.06 : 1), dur: VIAGEM - IRIS });
        zoom = zoom === 1 ? 1.06 : 1;
        estados.push({ de: tr.de + VIAGEM - IRIS, caixa: caixaDoLayout("cheio", plano, zoom), dur: IRIS });
      } else {
        if (anterior !== null) zoom = zoom === 1 ? 1.06 : 1;
        estados.push({ de: tr.de, caixa: caixaDoLayout("cheio", plano, zoom), dur: 0.001 });
      }
      let ultimo = tr.de;
      for (const c of cortes) {
        if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
        zoom = zoom === 1 ? 1.06 : 1;
        estados.push({ de: c, caixa: caixaDoLayout("cheio", plano, zoom), dur: 0.001 });
        ultimo = c;
      }
    } else if (anterior === "cheio") {
      // a lupa se forma: o quadro fecha num círculo grande em volta do rosto (abre a página em volta)
      // e então encolhe e viaja até a moldura da direita
      estados.push({ de: tr.de, caixa: iris(plano, zoom), dur: IRIS });
      estados.push({ de: tr.de + IRIS, caixa: caixaDoLayout(tr.layout, plano), dur: VIAGEM - IRIS });
    } else {
      estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano), dur: anterior === null ? 0.001 : VIAGEM });
    }
    anterior = tr.layout;
  });
  return estados;
};

// Instante em que a lupa chega ao lugar do momento (o conteúdo espera por ela)
export const chegadaDaLupa = (m: Momento, plano: Plano) => {
  const estados = estadosDaCaixa(plano);
  const e = [...estados].reverse().find((x) => x.de <= m.de + 0.15);
  return e ? e.de + (e.dur ?? 0) : m.de;
};
