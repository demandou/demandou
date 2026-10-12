// Gramática de layout do modelo Brilho no quadro deitado (16:9, 1920×1080): a pessoa fica em
// quadro cheio e o rosto é anotado; para anotar mais de perto, a câmera aproxima ("perto"); quando
// precisa de espaço para explicar, a pessoa vai para a MOLDURA do lado direito e o painel creme abre
// do lado esquerdo ("lado"), como manda a aula 9 do curso. A diagramação de cada lugar está em
// src/fileira.ts.
import { CHEIO_16x9, type Caixa, type EstadoDaCaixa } from "./motor/caixa";
import { MOLDURA, zoomDaMoldura } from "./fileira";
import type { Lado, Layout, Momento, Plano } from "./plano";
import { QUADRO } from "./tema";

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

// `colado`: o momento seguinte também é de painel e começa logo depois (a página vira sem a pessoa
// voltar para a tela cheia)
export type MomentoComLayout = { m: Momento; layout: Layout; lado: Lado; colado?: boolean };

// No quadro deitado a pessoa fica sempre na moldura da DIREITA (aula 9): o `lado` do plano não muda
// nada aqui ("esquerda" vale como "direita"). Quando dois painéis encostam, a página que sai se
// apaga antes de a nova se montar (no vertical a pessoa cruzava a tela).
export const resolverLayouts = (plano: Plano): MomentoComLayout[] => {
  const lista: MomentoComLayout[] = [...plano.momentos].sort((a, b) => a.de - b.de).map((m) => ({ m, layout: layoutDo(m), lado: "direita" as Lado }));
  lista.forEach((x, i) => {
    const prox = lista[i + 1];
    x.colado = x.layout === "lado" && !!prox && prox.layout === "lado" && prox.m.de - x.m.ate < 0.3;
  });
  return lista;
};

// altura do rosto dentro da caixa em tela cheia: onde ele já está no vídeo
const ancoraNatural = (plano: Plano) => {
  const H0 = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  return Math.min(0.42, (plano.rosto.y * QUADRO.h) / H0);
};

export const caixaDoLayout = (layout: Layout, _lado: Lado, plano: Plano, zoomCheio = 1): Caixa => {
  const ancoraY = ancoraNatural(plano);
  switch (layout) {
    case "cheio":
      return { ...CHEIO_16x9, zoom: zoomCheio, ancoraY };
    case "perto":
      return { ...CHEIO_16x9, zoom: plano.zoomPerto ?? 1.22, ancoraY };
    case "lado":
      // a moldura: do topo à base, à direita, com o rosto no meio dela
      return { x: MOLDURA.x, y: 0, w: MOLDURA.w, h: MOLDURA.h, raio: 0, zoom: zoomDaMoldura(plano), ancoraY };
  }
};

// Região livre do painel, calculada a partir da caixa ATUAL da pessoa (acompanha a borda dela)
export type Regiao = { x: number; y: number; w: number; h: number };
export const regiaoDoPainel = (caixa: Caixa, _lado?: Lado): Regiao => ({ x: 0, y: 0, w: caixa.x, h: QUADRO.h });

// Região final do painel (com a pessoa já na moldura): para o conteúdo não "respirar" durante a troca
export const regiaoFinalDoPainel = (_lado?: Lado): Regiao => ({ x: 0, y: 0, w: MOLDURA.x, h: QUADRO.h });

// Sequência de estados da caixa ao longo do vídeo. Entre momentos com respiro, tela cheia.
// Em tela cheia o zoom alterna (1 ↔ 1,06) com troca seca nos cortes, para disfarçar o pulo.
export const estadosDaCaixa = (plano: Plano, lista: MomentoComLayout[]): EstadoDaCaixa[] => {
  type Trecho = { de: number; layout: Layout; lado: Lado };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio", lado: "direita" }];
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
