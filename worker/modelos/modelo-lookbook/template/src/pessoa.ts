// A pessoa é a "foto" da página. Este arquivo decide onde a foto fica em cada instante
// (capa, quadro cheio, deslocada para um lado, retrato largo em cima ou embaixo, impressão da
// colagem), onde sobra papel para cada bloco (a "área da página") e converte os pontos do corpo
// (frações do vídeo) para pixels da tela, acompanhando a foto.
import { Easing, interpolate } from "remotion";
import { enquadrar, rostoNoTempo, type Caixa, type Rosto } from "./motor/caixa";
import type { Faixa, Lateral, Layout, Momento, Plano, Ponto } from "./plano";
import { BASE_CARTAO, CABECALHO, MARGEM, MARGEM_DIREITA } from "./tema";

export type LayoutPessoa = Layout | "capa" | "colagem";

const H0 = (plano: Plano) => Math.min(1920, plano.videoAltura ?? 1920);
const rostoDo = (plano: Plano) => plano.rosto as Rosto;

// Pontos do corpo para uma pessoa sentada, do peito para cima, com o rosto no centro
// (rosto em x 0,5 · y 0,33). Frações do vídeo da pessoa; "Esq"/"Dir" = lados da imagem.
// Se o rosto do aluno estiver em outro lugar ou for maior (gravação perto da câmera), todos
// andam e se afastam junto com ele; para acertar um ponto, escreva-o em `pontos` no plano
// (o valor do plano vale como está, sem deslocamento).
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
// largura do rosto (fração do quadro) da pessoa para quem os pontos padrão foram medidos
const LARGURA_PADRAO = 0.285;

// quanto os pontos se afastam do rosto: rosto maior (perto da câmera) = pontos mais longe
const escalaDoCorpo = (plano: Plano) => {
  const l = rostoDo(plano).rastro?.largura;
  return l ? Math.min(3, Math.max(0.7, l / LARGURA_PADRAO)) : 1;
};

export const resolverPonto = (p: Ponto | undefined, plano: Plano, padrao = "peito") => {
  const alvo = p ?? padrao;
  if (typeof alvo !== "string") return alvo;
  const doPlano = plano.pontos?.[alvo];
  if (doPlano) return doPlano;
  const base = PONTOS_PADRAO[alvo] ?? PONTOS_PADRAO[padrao];
  const fy = (plano.rosto.y * 1920) / H0(plano);
  const k = escalaDoCorpo(plano);
  return { x: plano.rosto.x + (base.x - ROSTO_PADRAO.x) * k, y: fy + ((base.y - ROSTO_PADRAO.y) * k * 1920) / H0(plano) };
};

// ——— o rosto e o queixo, em px do vídeo de trabalho ———
const rostoPx = (plano: Plano) => plano.rosto.y * 1920;
export const queixoPx = (plano: Plano) => {
  const l = rostoDo(plano).rastro?.largura;
  if (l) return rostoPx(plano) + 0.66 * l * 1080;
  if (plano.zona) return plano.zona.topo - 170;
  return rostoPx(plano) + 210;
};

// Altura do rosto na caixa (0 a 1) que mostra a cabeça e, sobretudo, o queixo inteiro.
// `desejada` é a âncora do layout; ela só muda quando cortaria o queixo (gravação perto da câmera).
const ancoraSegura = (plano: Plano, w: number, h: number, zoom: number, desejada: number) => {
  const s = Math.max(w / 1080, h / H0(plano)) * zoom;
  const d = (queixoPx(plano) - rostoPx(plano)) * s;
  let y = desejada * h;
  const cabeca = 1.3 * d + 14;
  const queixo = h - 40 - d;
  if (y < cabeca) y = cabeca;
  if (y > queixo) y = queixo;
  return Math.max(0.05, y / h);
};

// Onde o rosto fica na altura da caixa quando ela é alta (não puxa a pessoa para cima)
const ancoraNatural = (plano: Plano) => Math.min(0.4, (plano.rosto.y * 1920) / H0(plano));

export type Foto = { caixa: Caixa; rot: number; moldura: number };

// Altura do retrato largo (em cima ou embaixo): 780 px; numa gravação perto da câmera (rosto
// grande), cresce até 920 px para os olhos e o queixo caberem.
export const alturaDaFaixa = (plano: Plano) => {
  const d = queixoPx(plano) - rostoPx(plano);
  return Math.round(Math.min(920, Math.max(780, 1.75 * d + 120)));
};
// retrato largo embaixo: do fim da página até passar por baixo da interface do app
export const topoDoBaixo = (plano: Plano) => 1700 - alturaDaFaixa(plano);

export const FOTO: Record<LayoutPessoa, (plano: Plano) => Foto> = {
  // capa: a foto emoldurada pelo papel, abaixo do título
  capa: (plano) => ({ caixa: { x: 48, y: 500, w: 984, h: 1420, raio: 0, zoom: 1, ancoraY: ancoraNatural(plano) }, rot: 0, moldura: 0 }),
  cheio: (plano) => ({ caixa: { x: 0, y: CABECALHO, w: 1080, h: 1920 - CABECALHO, raio: 0, zoom: 1, ancoraY: ancoraNatural(plano) }, rot: 0, moldura: 0 }),
  // a foto vai do cabeçalho até 1700 px (passa por baixo da interface do app) e mostra a pessoa
  // de ombro a ombro; a coluna de papel fica do outro lado
  direita: (plano) => ({ caixa: { x: 360, y: 136, w: 680, h: 1564, raio: 0, zoom: plano.zoomLado ?? 1, ancoraY: ancoraNatural(plano) }, rot: 0, moldura: 0 }),
  esquerda: (plano) => ({ caixa: { x: 40, y: 136, w: 680, h: 1564, raio: 0, zoom: plano.zoomLado ?? 1, ancoraY: ancoraNatural(plano) }, rot: 0, moldura: 0 }),
  topo: (plano) => {
    const h = alturaDaFaixa(plano);
    return { caixa: { x: 0, y: CABECALHO, w: 1080, h, raio: 0, zoom: 1, ancoraY: ancoraSegura(plano, 1080, h, 1, (0.52 * 780) / h) }, rot: 0, moldura: 0 };
  },
  baixo: (plano) => {
    const h = alturaDaFaixa(plano);
    return { caixa: { x: 0, y: 1700 - h, w: 1080, h, raio: 0, zoom: 1, ancoraY: ancoraSegura(plano, 1080, h, 1, 0.42) }, rot: 0, moldura: 0 };
  },
  colagem: () => ({ caixa: { x: 96, y: 180, w: 640, h: 940, raio: 0, zoom: 1, ancoraY: 0.4 }, rot: -2.2, moldura: 1 }),
};

export type MomentoComLayout = { m: Momento; layout: LayoutPessoa };

// Blocos que abrem a página larga (foto em cima ou embaixo, alternando)
const NA_FAIXA = ["topicos", "passos", "numero", "comparacao", "grafico", "definicao"];
// Blocos que abrem a página lateral (foto de um lado, coluna e cartão do outro, alternando)
const NO_LADO = ["peca", "frase", "destaque", "pergunta"];

// Layout de cada momento. Páginas laterais alternam direita ↔ esquerda (a pessoa cruza a
// página); páginas largas alternam topo ↔ baixo e nunca repetem o lugar do momento anterior.
export const resolverLayouts = (plano: Plano): MomentoComLayout[] => {
  let lado: Lateral = "direita";
  let faixa: Faixa = "topo";
  let anterior: LayoutPessoa = "cheio";
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ordenados.map((m, i) => {
    let layout: LayoutPessoa;
    const pedido = "layout" in m ? m.layout : undefined;
    if (m.tipo === "capa" || m.tipo === "abertura") layout = "capa";
    else if (m.tipo === "colagem") layout = "colagem";
    else if (m.tipo === "cta") layout = "cheio";
    else if (pedido === "capa" || (m.tipo === "numero" && !pedido && i === 0 && m.de < 0.5)) layout = "capa";
    else if (pedido) layout = pedido as LayoutPessoa;
    else if (NA_FAIXA.includes(m.tipo)) {
      if (anterior === faixa) faixa = faixa === "topo" ? "baixo" : "topo";
      layout = faixa;
    } else if (NO_LADO.includes(m.tipo)) layout = lado;
    else layout = "cheio";
    if (layout === "direita") lado = "esquerda";
    else if (layout === "esquerda") lado = "direita";
    if (layout === "topo") faixa = "baixo";
    else if (layout === "baixo") faixa = "topo";
    anterior = layout;
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

// A foto no instante t (interpola posição, tamanho, zoom, giro e moldura)
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
    },
    rot: m(antes.rot, agora.rot),
    moldura: m(antes.moldura, agora.moldura),
  };
};

// Um ponto do corpo (frações do vídeo) em pixels da tela, dentro da foto. Com `t`, usa a mesma
// conta da VideoNaCaixa do motor (a caixa segue o rosto) e o ponto anda junto com a pessoa.
export const naTela = (p: { x: number; y: number }, caixa: Caixa, plano: Plano, t: number | null = null) => {
  const e = enquadrar(caixa, rostoDo(plano), H0(plano), t);
  let dx = 0;
  let dy = 0;
  if (t !== null) {
    const r = rostoNoTempo(rostoDo(plano), t);
    dx = r.x - plano.rosto.x;
    dy = ((r.y - plano.rosto.y) * 1920) / H0(plano);
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

// ——— a área da página: onde cada bloco pode desenhar, sem cobrir o rosto ———
export type Area = { x: number; y: number; w: number; h: number };

export const areaDaPagina = (layout: LayoutPessoa, plano: Plano): Area => {
  switch (layout) {
    case "topo": {
      const c = FOTO.topo(plano).caixa;
      const y = c.y + c.h + 36;
      return { x: MARGEM, y, w: 1080 - MARGEM - MARGEM_DIREITA, h: BASE_CARTAO - y };
    }
    case "baixo":
      return { x: MARGEM, y: 150, w: 1080 - MARGEM * 2, h: topoDoBaixo(plano) - 40 - 150 };
    case "capa":
      return { x: MARGEM, y: 118, w: 1080 - MARGEM * 2, h: 500 - 16 - 118 };
    default:
      return { x: MARGEM, y: 168, w: 1080 - MARGEM - MARGEM_DIREITA, h: BASE_CARTAO - 168 };
  }
};

// Nas páginas laterais: a coluna de papel ao lado da foto e a faixa do cartão (abaixo do queixo,
// avançando sobre a foto até a base).
export const COLUNA = 280;
export const ladoDaPagina = (layout: LayoutPessoa, plano: Plano, larguraCartao = 760) => {
  const lado: -1 | 1 = layout === "esquerda" ? 1 : -1;
  const colX = lado === -1 ? MARGEM : 1080 - MARGEM - COLUNA;
  const queixo = queixoNaTela(layout === "esquerda" ? "esquerda" : "direita", plano);
  const topoCartao = Math.max(1000, Math.round(queixo + 44));
  const cartaoX = lado === -1 ? MARGEM : 1080 - MARGEM_DIREITA - larguraCartao;
  return {
    lado,
    coluna: { x: colX, y: 168, w: COLUNA, h: Math.min(topoCartao, 1000) - 40 - 168 } as Area,
    cartao: { x: cartaoX, y: topoCartao, w: larguraCartao, h: BASE_CARTAO - topoCartao } as Area,
  };
};
