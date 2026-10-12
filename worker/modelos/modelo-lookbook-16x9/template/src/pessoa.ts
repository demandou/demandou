// A pessoa é a "foto" da página. Este arquivo decide onde a foto fica em cada instante
// (capa, quadro cheio, na moldura da direita, impressão da colagem, fechamento), onde sobra papel
// para cada bloco (a "área da página") e converte os pontos do corpo (frações do vídeo) para
// pixels da tela, acompanhando a foto.
//
// Versão deitada (16:9): todas as medidas em px LÓGICOS da página (tema.ts, PAGINA). A regra da
// aula 9 do curso decide a diagramação: tela cheia é a base; quando um bloco pede apoio visual, a
// foto vai para a MOLDURA do lado direito, com o rosto no meio dela (e acompanhado pelo rastro), e
// a página abre no QUADRO do lado esquerdo. Os lugares do vertical ("direita", "esquerda", "topo",
// "baixo") continuam aceitos no plano e viram a moldura da direita.
import { Easing, interpolate } from "remotion";
import { enquadrar, QUADRO_16x9, rostoNoTempo, type Caixa, type Rosto } from "./motor/caixa";
import type { Layout, Momento, Plano, Ponto } from "./plano";
import { BASE_CARTAO, CABECALHO, MOLDURA, PAGINA, QUADRO, QUADRO_PAGINA } from "./tema";

export type LayoutPessoa = Layout | "capa" | "colagem" | "fecho";

const H0 = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
// o rosto do plano, sempre medido no quadro deitado (o cortar.mjs grava `rosto.quadro`)
export const rostoDo = (plano: Plano): Rosto => {
  const r = plano.rosto as Rosto;
  return r.quadro ? r : { ...r, quadro: QUADRO_16x9 };
};
// largura do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
const larguraDoRosto = (plano: Plano) => {
  const l = rostoDo(plano).rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

// Pontos do corpo para uma pessoa sentada, do peito para cima, medidos no vídeo VERTICAL
// (1080×1920, rosto em x 0,5 · y 0,329, rosto com 0,285 da largura). Frações daquele vídeo;
// "Esq"/"Dir" = lados da imagem. No 16:9 eles são levados para o vídeo deitado a partir do rosto:
// a distância até o rosto, em px, cresce ou encolhe com o tamanho do rosto gravado. Para acertar
// um ponto, escreva-o em `pontos` no plano, em frações do vídeo deitado (vale como está).
export const PONTOS_PADRAO: Record<string, { x: number; y: number }> = {
  // camisa
  gola: { x: 0.405, y: 0.515 },
  pescoco: { x: 0.5, y: 0.485 },
  peito: { x: 0.507, y: 0.62 },
  camisa: { x: 0.47, y: 0.73 },
  // ombros (ponto de fora, onde a manga começa)
  ombroEsq: { x: 0.12, y: 0.485 },
  ombroDir: { x: 0.885, y: 0.485 },
  // jaqueta / casaco / blazer
  lapelaEsq: { x: 0.33, y: 0.57 },
  lapelaDir: { x: 0.665, y: 0.57 },
  jaquetaEsq: { x: 0.21, y: 0.5 },
  jaquetaDir: { x: 0.79, y: 0.5 },
  // pulsos (relógio, pulseira) e cintura (cinto)
  pulsoEsq: { x: 0.27, y: 0.86 },
  pulsoDir: { x: 0.76, y: 0.85 },
  cintura: { x: 0.5, y: 0.82 },
};
const ROSTO_PADRAO = { x: 0.5, y: 0.329 };
// o vídeo vertical em que os pontos padrão foram medidos e a largura do rosto nele (px)
const VERTICAL = { w: 1080, h: 1920 };
const ROSTO_PADRAO_PX = 0.285 * VERTICAL.w;

// quanto os pontos se afastam do rosto: rosto maior (perto da câmera) = pontos mais longe
const escalaDoCorpo = (plano: Plano) => Math.min(3, Math.max(0.5, (larguraDoRosto(plano) * QUADRO.w) / ROSTO_PADRAO_PX));

export const resolverPonto = (p: Ponto | undefined, plano: Plano, padrao = "peito") => {
  const alvo = p ?? padrao;
  if (typeof alvo !== "string") return alvo;
  const doPlano = plano.pontos?.[alvo];
  if (doPlano) return doPlano;
  const base = PONTOS_PADRAO[alvo] ?? PONTOS_PADRAO[padrao];
  const fy = (plano.rosto.y * QUADRO.h) / H0(plano);
  const k = escalaDoCorpo(plano);
  return {
    x: plano.rosto.x + ((base.x - ROSTO_PADRAO.x) * VERTICAL.w * k) / QUADRO.w,
    y: fy + ((base.y - ROSTO_PADRAO.y) * VERTICAL.h * k) / H0(plano),
  };
};

// ——— o rosto e o queixo, em px do vídeo de trabalho ———
const rostoPx = (plano: Plano) => plano.rosto.y * QUADRO.h;
export const queixoPx = (plano: Plano) => {
  const l = rostoDo(plano).rastro?.largura;
  if (l) return rostoPx(plano) + 0.66 * l * QUADRO.w;
  // no 16:9 o cortar põe o topo da `zona` 60 px abaixo do queixo
  if (plano.zona) return plano.zona.topo - 60;
  return rostoPx(plano) + 0.66 * 0.13 * QUADRO.w;
};

// Onde o rosto fica na altura da caixa quando ela é alta (não puxa a pessoa para cima)
const ancoraNatural = (plano: Plano) => Math.min(0.4, (plano.rosto.y * QUADRO.h) / H0(plano));

export type Foto = { caixa: Caixa; rot: number; moldura: number };

// Na moldura, o rosto ocupa pelo menos ~28% da largura dela (cabeça, ombros e o peito, onde
// ficam as peças): numa gravação de longe, a moldura aproxima um pouco (até 1,6×).
const zoomDaMoldura = (plano: Plano) => {
  const s0 = Math.max(MOLDURA.w / QUADRO.w, MOLDURA.h / H0(plano));
  const rosto = larguraDoRosto(plano) * QUADRO.w * s0;
  return Math.max(1, Math.min(1.6, (0.28 * MOLDURA.w) / rosto));
};
const naMoldura = (plano: Plano, zoom = 1): Foto => ({
  caixa: { ...MOLDURA, raio: 0, zoom: zoomDaMoldura(plano) * zoom, ancoraY: ancoraNatural(plano), ancoraX: 0.5 },
  rot: 0,
  moldura: 0,
});

// O fechamento: a etiqueta fica do lado com mais papel e a foto (quadro cheio) aproxima um pouco
// para a pessoa deslizar para o outro lado, sem a etiqueta cobrir o corpo.
export const ladoDaEtiqueta = (plano: Plano): -1 | 1 => (plano.rosto.x >= 0.5 ? -1 : 1);

export const FOTO: Record<LayoutPessoa, (plano: Plano) => Foto> = {
  // capa: a foto na moldura da direita; a manchete abre no quadro da esquerda
  capa: (plano) => naMoldura(plano),
  // quadro cheio, abaixo da faixa do cabeçalho; o zoom dos cortes parte do rosto
  cheio: (plano) => ({
    caixa: { x: 0, y: CABECALHO, w: PAGINA.w, h: PAGINA.h - CABECALHO, raio: 0, zoom: 1, ancoraY: ancoraNatural(plano), ancoraX: plano.rosto.x },
    rot: 0,
    moldura: 0,
  }),
  // a página lateral e a página larga do vertical: no 16:9, a moldura da direita
  direita: (plano) => naMoldura(plano, plano.zoomLado ?? 1),
  esquerda: (plano) => naMoldura(plano, plano.zoomLado ?? 1),
  topo: (plano) => naMoldura(plano),
  baixo: (plano) => naMoldura(plano),
  // a impressão girada da colagem, no meio da página (os recortes em volta, o título à esquerda)
  colagem: () => ({ caixa: { x: 1000, y: 196, w: 620, h: 860, raio: 0, zoom: 1, ancoraY: 0.4, ancoraX: 0.5 }, rot: -2.2, moldura: 1 }),
  fecho: (plano) => ({
    caixa: {
      x: 0,
      y: CABECALHO,
      w: PAGINA.w,
      h: PAGINA.h - CABECALHO,
      raio: 0,
      // aproxima o bastante para a pessoa deslizar para longe da etiqueta (prova de 10/10: com 1,18
      // a borda da etiqueta ainda pegava o ombro); o vídeo nunca deixa borda, ela para antes
      zoom: 1.25,
      ancoraY: ancoraNatural(plano),
      ancoraX: ladoDaEtiqueta(plano) === -1 ? Math.max(plano.rosto.x, 0.66) : Math.min(plano.rosto.x, 0.34),
    },
    rot: 0,
    moldura: 0,
  }),
};

export type MomentoComLayout = { m: Momento; layout: LayoutPessoa };

// Layout de cada momento. No 16:9 todo bloco que abre uma página usa a moldura da direita (a
// regra da aula 9); a capa, a colagem e o fechamento têm a composição própria.
export const resolverLayouts = (plano: Plano): MomentoComLayout[] => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ordenados.map((m, i) => {
    let layout: LayoutPessoa;
    const pedido = "layout" in m ? m.layout : undefined;
    if (m.tipo === "capa" || m.tipo === "abertura") layout = "capa";
    else if (m.tipo === "colagem") layout = "colagem";
    else if (m.tipo === "cta") layout = "fecho";
    else if (pedido === "capa" || (m.tipo === "numero" && !pedido && i === 0 && m.de < 0.5)) layout = "capa";
    else layout = "direita";
    return { m, layout };
  });
};

type Estado = { de: number; layout: LayoutPessoa; zoom: number };
export const DUR_TROCA = 0.62;

// Sequência de estados da foto. Entre momentos com respiro (> 0,3 s), quadro cheio.
// Em quadro cheio, o zoom alterna 1 ↔ 1,05 em cada corte (troca seca disfarça o pulo).
export const estadosDaFoto = (plano: Plano, lista: MomentoComLayout[]): Estado[] => {
  const trechos: { de: number; layout: LayoutPessoa }[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: LayoutPessoa) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02 || de <= ultimo.de) ultimo.layout = layout;
    else if (ultimo.layout !== layout) trechos.push({ de, layout });
  };
  lista.forEach(({ m, layout }, i) => {
    empurrar(Math.max(0, m.de), layout);
    const prox = lista[i + 1];
    if (prox ? prox.m.de - m.ate > 0.3 : m.tipo !== "cta" && m.ate < plano.duracao - 0.3) empurrar(m.ate, "cheio");
  });
  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }
  const estados: Estado[] = [];
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    estados.push({ de: tr.de, layout: tr.layout, zoom: 1 });
    if (tr.layout !== "cheio") return;
    let zoom = 1;
    let ultimo = tr.de;
    for (const c of cortes) {
      if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
      zoom = zoom === 1 ? 1.05 : 1;
      estados.push({ de: c, layout: "cheio", zoom });
      ultimo = c;
    }
  });
  return estados;
};

const fotoDoEstado = (e: Estado, plano: Plano): Foto => {
  const f = FOTO[e.layout](plano);
  return { ...f, caixa: { ...f.caixa, zoom: (f.caixa.zoom ?? 1) * e.zoom } };
};

const suave = Easing.bezier(0.65, 0, 0.35, 1);

// A foto no instante t (interpola posição, tamanho, zoom, âncoras, giro e moldura)
export const fotoNoTempo = (t: number, plano: Plano, estados: Estado[]): Foto => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = fotoDoEstado(estados[i], plano);
  if (i === 0) return agora;
  const antes = fotoDoEstado(estados[i - 1], plano);
  // troca seca de zoom no mesmo layout (corte); troca de layout desliza
  const mesmo = estados[i].layout === estados[i - 1].layout;
  const p = mesmo
    ? 1
    : interpolate(t, [estados[i].de, estados[i].de + DUR_TROCA], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: suave,
      });
  const m = (a: number, b: number) => a + (b - a) * p;
  const a = antes.caixa;
  const b = agora.caixa;
  return {
    caixa: {
      x: m(a.x, b.x),
      y: m(a.y, b.y),
      w: m(a.w, b.w),
      h: m(a.h, b.h),
      raio: 0,
      zoom: m(a.zoom ?? 1, b.zoom ?? 1),
      ancoraY: m(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3),
      ancoraX: m(a.ancoraX ?? 0.5, b.ancoraX ?? 0.5),
    },
    rot: m(antes.rot, agora.rot),
    moldura: m(antes.moldura, agora.moldura),
  };
};

// Um ponto do corpo (frações do vídeo) em pixels da página, dentro da foto. Com `t`, usa a mesma
// conta da VideoNaCaixa do motor (a caixa segue o rosto) e o ponto anda junto com a pessoa.
export const naTela = (p: { x: number; y: number }, caixa: Caixa, plano: Plano, t: number | null = null) => {
  const e = enquadrar(caixa, rostoDo(plano), H0(plano), t);
  let dx = 0;
  let dy = 0;
  if (t !== null) {
    const r = rostoNoTempo(rostoDo(plano), t);
    dx = r.x - plano.rosto.x;
    dy = ((r.y - plano.rosto.y) * QUADRO.h) / H0(plano);
  }
  return { x: caixa.x + e.esquerda + (p.x + dx) * e.lv, y: caixa.y + e.topo + (p.y + dy) * e.av };
};

// O ponto está dentro da foto (com folga)?
export const dentroDaFoto = (q: { x: number; y: number }, caixa: Caixa, folga = 12) =>
  q.x > caixa.x + folga && q.x < caixa.x + caixa.w - folga && q.y > caixa.y + folga && q.y < caixa.y + caixa.h - folga;

// Onde fica o queixo na tela, numa foto parada no layout (px)
export const queixoNaTela = (layout: LayoutPessoa, plano: Plano) => {
  const c = FOTO[layout](plano).caixa;
  return naTela({ x: plano.rosto.x, y: queixoPx(plano) / H0(plano) }, c, plano).y;
};

// ——— a área da página: onde cada bloco pode desenhar, sem cobrir a pessoa ———
// No 16:9 é sempre o QUADRO da esquerda (a pessoa está na moldura da direita).
export type Area = { x: number; y: number; w: number; h: number };

export const areaDaPagina = (_layout: LayoutPessoa, _plano: Plano): Area => ({ ...QUADRO_PAGINA });

// Nas páginas laterais (peça, frase, destaque, pergunta): a coluna de papel na esquerda do quadro
// (numeral, nome, aspas, interrogação, o pino grande) e, ao lado dela, o cartão. No vertical o
// cartão ficava embaixo da coluna, avançando sobre a foto; no quadro deitado eles ficam lado a lado
// (uma fileira) e o cartão nunca cobre a pessoa.
export const COLUNA = 300;
export const ladoDaPagina = (_layout: LayoutPessoa, _plano: Plano, larguraCartao = 760) => {
  const q = QUADRO_PAGINA;
  const cartaoX = Math.max(q.x + COLUNA + 40, q.x + q.w - larguraCartao);
  return {
    lado: -1 as -1 | 1,
    coluna: { x: q.x, y: q.y, w: COLUNA, h: q.h } as Area,
    cartao: { x: cartaoX, y: q.y, w: Math.min(larguraCartao, q.x + q.w - cartaoX), h: BASE_CARTAO - q.y } as Area,
  };
};
// o cartão de uma página lateral: no meio da altura do quadro (nunca acima do topo nem abaixo da base)
export const topoDoCartao = (altura: number) => {
  const q = QUADRO_PAGINA;
  return Math.round(Math.max(q.y, Math.min(BASE_CARTAO - altura, q.y + (q.h - altura) / 2)));
};
