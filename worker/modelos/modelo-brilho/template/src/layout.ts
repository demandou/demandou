// Gramática de layout do modelo Brilho: a pessoa fica em quadro cheio e o rosto é anotado;
// para anotar mais de perto, a câmera aproxima ("perto"); quando precisa de espaço para explicar,
// a pessoa desliza para um lado e um painel creme abre do outro ("lado").
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Lado, Layout, Momento, Plano } from "./plano";
import { LARGURA_LADO } from "./tema";

export const LAYOUT_PADRAO: Record<Momento["tipo"], Layout> = {
  abertura: "cheio",
  topicos: "lado",
  passos: "lado",
  numero: "cheio",
  comparacao: "perto",
  grafico: "cheio",
  destaque: "cheio",
  definicao: "lado",
  frase: "cheio",
  pergunta: "cheio",
  cta: "cheio",
  truque: "perto",
  amostras: "lado",
  resultado: "cheio",
};

// Layouts que cada bloco sabe desenhar: os do painel só existem no "lado"; os do peito e do cartão,
// em quadro cheio ou com aproximação. Um layout que o bloco não tem vira o padrão dele.
const PERMITIDOS: Record<Momento["tipo"], Layout[]> = {
  abertura: ["cheio", "perto"],
  topicos: ["lado"],
  passos: ["lado"],
  numero: ["cheio", "perto"],
  comparacao: ["cheio", "perto"],
  grafico: ["cheio", "perto"],
  destaque: ["cheio", "perto"],
  definicao: ["lado"],
  frase: ["cheio", "perto"],
  pergunta: ["cheio", "perto"],
  cta: ["cheio", "perto"],
  truque: ["cheio", "perto", "lado"],
  amostras: ["cheio", "perto", "lado"],
  resultado: ["cheio", "perto"],
};
const layoutDo = (m: Momento): Layout => (m.layout && PERMITIDOS[m.tipo].includes(m.layout) ? m.layout : LAYOUT_PADRAO[m.tipo]);

export type MomentoComLayout = { m: Momento; layout: Layout; lado: Lado };

// Resolve o layout de cada momento. No "lado", a pessoa alterna de lado a cada vez
// (esquerda, direita, esquerda…), a não ser que o plano diga. Dois painéis colados nunca ficam do
// mesmo lado: a pessoa cruza a tela (a página que sai e a que entra nunca se sobrepõem).
export const resolverLayouts = (plano: Plano): MomentoComLayout[] => {
  let proximo: Lado = "esquerda";
  let anterior: MomentoComLayout | null = null;
  return [...plano.momentos]
    .sort((a, b) => a.de - b.de)
    .map((m) => {
      const layout = layoutDo(m);
      let lado: Lado = m.lado ?? proximo;
      if (layout === "lado") {
        lado = m.lado ?? proximo;
        const colado = anterior && anterior.layout === "lado" && m.de - anterior.m.ate < 0.3;
        if (colado && anterior && anterior.lado === lado) lado = lado === "esquerda" ? "direita" : "esquerda";
        proximo = lado === "esquerda" ? "direita" : "esquerda";
      }
      const r = { m, layout, lado };
      anterior = r;
      return r;
    });
};

// altura do rosto dentro da caixa em tela cheia: onde ele já está no vídeo
const ancoraNatural = (plano: Plano) => {
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  return Math.min(0.42, (plano.rosto.y * 1920) / H0);
};

export const caixaDoLayout = (layout: Layout, lado: Lado, plano: Plano, zoomCheio = 1): Caixa => {
  const ancoraY = ancoraNatural(plano);
  switch (layout) {
    case "cheio":
      return { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: zoomCheio, ancoraY };
    case "perto":
      return { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: plano.zoomPerto ?? 1.22, ancoraY };
    case "lado":
      return {
        x: lado === "esquerda" ? 0 : 1080 - LARGURA_LADO,
        y: 0,
        w: LARGURA_LADO,
        h: 1920,
        raio: 0,
        zoom: plano.zoomLado ?? 1,
        ancoraY,
      };
  }
};

// Região livre do painel, calculada a partir da caixa ATUAL da pessoa (acompanha a borda dela)
export type Regiao = { x: number; y: number; w: number; h: number };
export const regiaoDoPainel = (caixa: Caixa, lado: Lado): Regiao =>
  lado === "esquerda"
    ? { x: caixa.x + caixa.w, y: 0, w: 1080 - (caixa.x + caixa.w), h: 1920 }
    : { x: 0, y: 0, w: caixa.x, h: 1920 };

// Região final do painel (com a pessoa já no lugar): para o conteúdo não "respirar" durante a troca
export const regiaoFinalDoPainel = (lado: Lado): Regiao =>
  lado === "esquerda" ? { x: LARGURA_LADO, y: 0, w: 1080 - LARGURA_LADO, h: 1920 } : { x: 0, y: 0, w: 1080 - LARGURA_LADO, h: 1920 };

// Sequência de estados da caixa ao longo do vídeo. Entre momentos com respiro, tela cheia.
// Em tela cheia o zoom alterna (1 ↔ 1,06) com troca seca nos cortes, para disfarçar o pulo.
export const estadosDaCaixa = (plano: Plano, lista: MomentoComLayout[]): EstadoDaCaixa[] => {
  type Trecho = { de: number; layout: Layout; lado: Lado };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio", lado: "esquerda" }];
  const empurrar = (de: number, layout: Layout, lado: Lado) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) {
      ultimo.layout = layout;
      ultimo.lado = lado;
    } else if (!(layout === "cheio" && ultimo.layout === "cheio")) trechos.push({ de, layout, lado });
  };
  lista.forEach(({ m, layout, lado }, i) => {
    empurrar(Math.max(0, m.de), layout, lado);
    const prox = lista[i + 1];
    if (!prox || prox.m.de - m.ate > 0.3) empurrar(m.ate, "cheio", lado);
  });

  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }

  const estados: EstadoDaCaixa[] = [];
  let zoom = 1;
  let anterior: Layout | null = null;
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    if (tr.layout === "cheio") {
      if (anterior === "cheio") zoom = zoom === 1 ? 1.06 : 1;
      else zoom = 1;
      estados.push({ de: tr.de, caixa: caixaDoLayout("cheio", tr.lado, plano, zoom), dur: anterior && anterior !== "cheio" ? 0.6 : 0.001 });
      let ultimo = tr.de;
      for (const c of cortes) {
        if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
        zoom = zoom === 1 ? 1.06 : 1;
        estados.push({ de: c, caixa: caixaDoLayout("cheio", tr.lado, plano, zoom), dur: 0.001 });
        ultimo = c;
      }
    } else {
      estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, tr.lado, plano), dur: 0.6 });
    }
    anterior = tr.layout;
  });
  return estados;
};
