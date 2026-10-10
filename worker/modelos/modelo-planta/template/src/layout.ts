// Gramática de layout do modelo Planta: onde fica a pessoa e onde fica a prancha em cada momento.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { LEGENDA_Y, MARGEM } from "./tema";

// Layout padrão de cada componente (o plano pode trocar com `layout`)
// Cartão no peito (pessoa em tela cheia): abertura, número, destaque, frase, pergunta, fechamento.
// Prancha (a pessoa muda de lugar): listas, passos, comparação, gráfico, definição e a planta.
export const LAYOUT_PADRAO: Record<Momento["tipo"], Layout> = {
  abertura: "cheio",
  titulo: "cheio",
  numero: "cheio",
  medida: "cheio",
  destaque: "cheio",
  frase: "cheio",
  pergunta: "cheio",
  cta: "cheio",
  topicos: "dividida",
  passos: "dividida",
  comparacao: "dividida",
  grafico: "dividida",
  definicao: "dividida",
  planta: "dividida",
  antesDepois: "dividida",
};

// Tipos que desenham na prancha (os outros são cartões de papel no peito)
const DA_PRANCHA = new Set<Momento["tipo"]>(["topicos", "passos", "comparacao", "grafico", "definicao", "planta", "antesDepois"]);
export const ehDaPrancha = (m: Momento) => DA_PRANCHA.has(m.tipo);

export const layoutDe = (m: Momento): Layout => m.layout ?? LAYOUT_PADRAO[m.tipo];

// Base da área útil da prancha: acima da legenda
export const BASE_PRANCHA = LEGENDA_Y - 26;

// Caixas da pessoa em cada layout (px no quadro 1080×1920)
export const caixaDoLayout = (layout: Layout, plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ajuste = plano.caixas?.[layout] ?? {};
  // Com o rosto medido (rastro), o zoom de cada caixa sai da largura do rosto: o rosto ocupa mais ou
  // menos `alvo` da largura da caixa, seja a gravação aberta (pessoa em pé) ou bem perto da câmera.
  const L = plano.rosto.rastro?.largura;
  const auto = (alvo: number, w: number, h: number, padrao: number, maximo: number) =>
    L ? Math.min(maximo, Math.max(1, (alvo * w) / (L * 1080 * Math.max(w / 1080, h / videoAltura)))) : padrao;
  const perto = !!L && L > 0.42;
  switch (layout) {
    case "cheio":
      return {
        x: 0,
        y: 0,
        w: 1080,
        h: videoAltura,
        raio: 0,
        zoom: ajuste.zoom ?? zoomCheio,
        // o rosto fica onde está: o zoom parte dele
        ancoraY: ajuste.ancoraY ?? (plano.rosto.y * 1920) / videoAltura,
      };
    case "dividida":
      return { x: MARGEM, y: MARGEM, w: 1080 - 2 * MARGEM, h: 640, raio: 0, zoom: ajuste.zoom ?? auto(0.26, 1008, 640, 1.3, 1.6), ancoraY: ajuste.ancoraY ?? (perto ? 0.38 : 0.44) };
    case "cheia":
      return { x: 1080 - MARGEM - 336, y: 64, w: 336, h: 424, raio: 0, zoom: ajuste.zoom ?? auto(0.5, 336, 424, 2.3, 2.6), ancoraY: ajuste.ancoraY ?? (perto ? 0.48 : 0.42) };
    case "lateral":
      return { x: MARGEM, y: MARGEM, w: 420, h: BASE_PRANCHA - MARGEM, raio: 0, zoom: ajuste.zoom ?? auto(0.5, 420, BASE_PRANCHA - MARGEM, 1.3, 2), ancoraY: ajuste.ancoraY ?? 0.3 };
  }
};

// Região da prancha onde o componente desenha, calculada a partir da caixa ATUAL da pessoa:
// na dividida ela sobe junto com a borda de baixo do vídeo; na lateral entra junto com a borda da direita.
export type Regiao = { x: number; y: number; w: number; h: number };

// Onde fica o cabeçalho (título a lápis) e onde fica o corpo do bloco dentro da região.
// Na prancha cheia, o título fica ao lado da janela da pessoa e o corpo começa abaixo dela:
// a janela nunca cobre texto.
export const JANELA_CHEIA = { x: 1080 - MARGEM - 336, y: 64, w: 336, h: 424 };
export const corpoDaPrancha = (layout: Layout, regiao: Regiao, alturaCabecalho: number) => {
  if (layout === "cheia") {
    const topoCorpo = JANELA_CHEIA.y + JANELA_CHEIA.h + 34;
    return {
      cabecalho: { x: regiao.x, y: regiao.y + 28, w: JANELA_CHEIA.x - MARGEM - 40 },
      corpo: { x: regiao.x, y: Math.max(topoCorpo, regiao.y + 28 + alturaCabecalho), w: regiao.w, h: BASE_PRANCHA - Math.max(topoCorpo, regiao.y + 28 + alturaCabecalho) },
    };
  }
  return {
    cabecalho: { x: regiao.x, y: regiao.y, w: regiao.w },
    corpo: { x: regiao.x, y: regiao.y + alturaCabecalho, w: regiao.w, h: regiao.h - alturaCabecalho },
  };
};

export const regiaoDoLayout = (layout: Layout, caixa: Caixa, final: Caixa): Regiao => {
  switch (layout) {
    case "dividida": {
      const topoFinal = final.y + final.h + 40;
      const desloc = caixa.y + caixa.h - (final.y + final.h);
      return { x: MARGEM, y: topoFinal + desloc, w: 1080 - 2 * MARGEM, h: BASE_PRANCHA - topoFinal };
    }
    case "lateral": {
      const esqFinal = final.x + final.w + 40;
      const desloc = caixa.x + caixa.w - (final.x + final.w);
      return { x: esqFinal + desloc, y: MARGEM + 8, w: 1080 - MARGEM - esqFinal, h: BASE_PRANCHA - MARGEM - 8 };
    }
    case "cheia":
      return { x: MARGEM, y: MARGEM, w: 1080 - 2 * MARGEM, h: BASE_PRANCHA - MARGEM };
    case "cheio":
      return { x: 0, y: 0, w: 1080, h: 1920 };
  }
};

// Sequência de estados da caixa ao longo do vídeo. Entre momentos, tela cheia.
// Em tela cheia o zoom alterna (1 ↔ 1,08) com troca seca nos cortes, para disfarçar o pulo.
export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  type Trecho = { de: number; layout: Layout };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: Layout) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) ultimo.layout = layout;
    // tela cheia seguida de tela cheia é um trecho só (o zoom troca nos cortes)
    else if (!(layout === "cheio" && ultimo.layout === "cheio")) trechos.push({ de, layout });
  };
  momentos.forEach((m, i) => {
    empurrar(Math.max(0, m.de), layoutDe(m));
    const prox = momentos[i + 1];
    // volta para a tela cheia se houver um respiro antes do próximo momento
    if (!prox || prox.de - m.ate > 0.3) empurrar(m.ate, "cheio");
  });

  const estados: EstadoDaCaixa[] = [];
  let zoom = 1;
  let anterior: Layout | null = null;
  const cortes = plano.cortesEm ?? [];
  // a troca de layout começa exatamente no corte mais próximo (o movimento esconde o pulo do corte)
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    if (tr.layout === "cheio") {
      if (anterior !== null) zoom = zoom === 1 ? 1.08 : 1;
      estados.push({ de: tr.de, caixa: caixaDoLayout("cheio", plano, zoom), dur: anterior && anterior !== "cheio" ? 0.6 : 0.001 });
      // cortes dentro deste trecho em tela cheia: troca seca de zoom
      let ultimo = tr.de;
      for (const c of cortes) {
        if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
        zoom = zoom === 1 ? 1.08 : 1;
        estados.push({ de: c, caixa: caixaDoLayout("cheio", plano, zoom), dur: 0.001 });
        ultimo = c;
      }
    } else {
      estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano), dur: 0.62 });
    }
    anterior = tr.layout;
  });
  return estados;
};
