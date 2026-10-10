// Gramática de layout do modelo Clínico: onde fica a lupa (a pessoa num círculo) e onde ficam
// o cabeçalho (número + título) e o corpo (o desenho) em cada momento.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { LEGENDA_Y, MARGEM, zona as zonaPadrao } from "./tema";

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
  // gráfico sem título: embaixo da lupa grande, o traçado usa a largura e a altura toda
  if (m.tipo === "grafico" && !m.titulo && !m.layout) return "topo";
  const pedido = m.layout ?? LAYOUT_PADRAO[m.tipo];
  if (pedido === "centro") return LAYOUT_PADRAO[m.tipo];
  return pedido === "cheio" && PRECISA_LUPA.includes(m.tipo) ? LAYOUT_PADRAO[m.tipo] : pedido;
};

// A lupa em cada layout: centro (cx, cy) e diâmetro, em px no quadro 1080×1920
export const LUPAS: Record<Exclude<Layout, "cheio">, { cx: number; cy: number; d: number }> = {
  topo: { cx: 540, cy: 420, d: 600 },
  centro: { cx: 540, cy: 968, d: 540 },
  canto: { cx: 842, cy: 334, d: 368 },
  lado: { cx: 300, cy: 456, d: 424 },
};

export type Regiao = { x: number; y: number; w: number; h: number };
export type Areas = { cabecalho: Regiao; corpo: Regiao };

// Base útil do corpo: acima da legenda (que só aparece em momentos com `legenda: true`)
const BASE = LEGENDA_Y - 24;

export const areasDoLayout = (layout: Layout, plano: Plano): Areas => {
  const z = { ...zonaPadrao, ...plano.zona };
  const L = 1080 - 2 * MARGEM;
  switch (layout) {
    case "cheio":
      return {
        cabecalho: { x: MARGEM, y: z.topo, w: L, h: 300 },
        // em tela cheia não há legenda junto do texto: o corpo desce até perto da interface do app
        corpo: { x: MARGEM, y: z.topo, w: L, h: 1500 - z.topo },
      };
    case "topo": {
      const { cy, d } = LUPAS.topo;
      const y = cy + d / 2 + 50;
      return { cabecalho: { x: MARGEM, y, w: L, h: 190 }, corpo: { x: MARGEM, y: y + 210, w: L, h: BASE - (y + 210) } };
    }
    case "centro":
      return { cabecalho: { x: MARGEM, y: 130, w: L, h: 330 }, corpo: { x: MARGEM, y: 480, w: L, h: BASE - 480 } };
    case "canto": {
      const { cx, cy, d } = LUPAS.canto;
      const topo = cy - d / 2;
      return {
        cabecalho: { x: MARGEM, y: topo + 6, w: cx - d / 2 - MARGEM - 40, h: d - 12 },
        corpo: { x: MARGEM - 10, y: cy + d / 2 + 40, w: L + 20, h: BASE - (cy + d / 2 + 40) },
      };
    }
    case "lado": {
      const { cx, cy, d } = LUPAS.lado;
      const esq = cx + d / 2 + 44;
      return {
        cabecalho: { x: esq, y: cy - d / 2 + 10, w: 1080 - MARGEM - esq, h: d - 20 },
        corpo: { x: MARGEM - 10, y: cy + d / 2 + 50, w: L + 20, h: BASE - (cy + d / 2 + 50) },
      };
    }
  }
};

// Largura do rosto (fração da largura do quadro) medida pelo rastreio, quando houver
const larguraDoRosto = (plano: Plano) => (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;

// Zoom da pessoa dentro da lupa: o rosto ocupa ~43% do diâmetro (nunca menos que cobrir o círculo)
export const zoomDaLupa = (plano: Plano) => {
  if (plano.lupa?.zoom) return plano.lupa.zoom;
  const l = larguraDoRosto(plano);
  return l ? Math.min(2.6, Math.max(1, 0.43 / l)) : 1.45;
};

// Gravação muito perto da câmera (rosto enorme): o rosto desce um pouco no círculo para a testa caber
const ancoraDaLupa = (plano: Plano) => {
  const l = larguraDoRosto(plano);
  return l && l > 0.5 ? 0.56 : 0.5;
};

// A caixa do vídeo em cada layout
export const caixaDoLayout = (layout: Layout, plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  if (layout === "cheio") {
    return { x: 0, y: 0, w: 1080, h: videoAltura, raio: 0, zoom: zoomCheio, ancoraY: (plano.rosto.y * 1920) / videoAltura };
  }
  const { cx, cy, d } = LUPAS[layout];
  return {
    x: cx - d / 2,
    y: cy - d / 2,
    w: d,
    h: d,
    raio: d / 2,
    // cabeça inteira no círculo, nariz no centro, um pouco de ombro: o zoom sai do tamanho do rosto
    // na gravação (o rastro do cortar.mjs); sem rastro, o padrão de quem grava sentado, do peito para cima
    zoom: zoomDaLupa(plano),
    ancoraY: plano.lupa?.ancoraY ?? ancoraDaLupa(plano),
  };
};

// Duração da viagem da lupa entre dois lugares
export const VIAGEM = 0.62;
// Da tela cheia para a lupa (e de volta), o primeiro trecho: o quadro vira um círculo grande em volta do rosto
export const IRIS = 0.22;

// O círculo grande em volta do rosto, com o vídeo na mesma escala da tela cheia (o rosto não pula)
const iris = (plano: Plano, zoomCheio: number): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const D = 1000;
  const fx = plano.rosto.x * 1080;
  const fy = plano.rosto.y * 1920;
  const x = Math.min(1080 - D, Math.max(0, fx - D / 2));
  const y = Math.min(videoAltura - D, Math.max(0, fy - D / 2));
  return { x, y, w: D, h: D, raio: D / 2, zoom: (1080 / D) * zoomCheio, ancoraY: (fy - y) / D };
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
      // e então encolhe e viaja até o lugar dela
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
