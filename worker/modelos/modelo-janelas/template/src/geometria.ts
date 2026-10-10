// Geometria do desktop (px no quadro 1080×1920). Tudo que o mouse precisa achar (barra de título,
// botões, abas, itens) sai daqui, para o cursor e os componentes nunca discordarem.
import type { Caixa, Rosto } from "./motor/caixa";
import type { Lugar, Momento, Plano } from "./plano";
import { duasFilas } from "./teclado";
import { BARRA_JANELA, DOCK, MARGEM_JANELA, RAIO_JANELA, W } from "./tema";

// A janela da chamada. `barra` = 1 mostra a barra de título; 0 = sem barra (tela cheia, mini).
export type CaixaJanela = Required<Caixa> & { barra: number };

// Gravação perto da câmera (rosto largo): a janela da pessoa estreita e perde o zoom até mostrar
// da testa ao queixo com folga. `largura` do rastro = largura do rosto em fração do quadro.
const cabeInteira = (j: CaixaJanela, largura: number, aoCentro: boolean): CaixaJanela => {
  const alturaVideo = j.h - j.barra * BARRA_JANELA;
  // largura × zoom máxima para a altura da janela mostrar ~1,5 rosto (testa, queixo e pescoço)
  const limite = alturaVideo / (1.5 * largura);
  if (j.w * j.zoom <= limite) return j;
  const zoom = limite / j.w;
  if (zoom >= 1) return { ...j, zoom };
  const w = Math.round(Math.max(alturaVideo * 0.75, limite));
  return { ...j, zoom: 1, w, x: aoCentro ? Math.round(j.x + (j.w - w) / 2) : j.x };
};

export const lugares = (plano: Plano): Record<Lugar, CaixaJanela> => {
  const largura = (plano.rosto as Rosto).rastro?.largura ?? 0.3;
  const L = lugaresPadrao(plano);
  return {
    cheia: L.cheia,
    topo: cabeInteira(L.topo, largura, true),
    mini: cabeInteira(L.mini, largura, false),
    centro: cabeInteira(L.centro, largura, true),
    alto: cabeInteira(L.alto, largura, true),
  };
};

const lugaresPadrao = (plano: Plano): Record<Lugar, CaixaJanela> => ({
  // tela cheia: o rosto fica onde está na gravação (linha do centro)
  cheia: { x: 0, y: 0, w: W, h: 1920, raio: 0, zoom: 1, ancoraY: plano.rosto.y, barra: 0 },
  // em cima, larga (92% da tela): navegador embaixo
  topo: { x: MARGEM_JANELA, y: 168, w: W - 2 * MARGEM_JANELA, h: 600, raio: RAIO_JANELA, zoom: 1.1, ancoraY: 0.55, barra: 1 },
  // minimizada: miniatura flutuante no canto de baixo, à esquerda
  mini: { x: MARGEM_JANELA, y: 984, w: 440, h: 452, raio: RAIO_JANELA, zoom: 1.85, ancoraY: 0.52, barra: 0 },
  // no centro, quase quadrada: o recorte acontece em volta do rosto
  centro: { x: 90, y: 168, w: 900, h: 830, raio: RAIO_JANELA, zoom: 1.18, ancoraY: 0.45, barra: 1 },
  // no alto, grande: teclas grandes embaixo
  alto: { x: 80, y: 168, w: 920, h: 800, raio: RAIO_JANELA, zoom: 1.25, ancoraY: 0.49, barra: 1 },
});

export const LUGAR_PADRAO: Record<Momento["tipo"], Lugar> = {
  abertura: "cheia",
  navegador: "topo",
  lista: "mini",
  recorte: "centro",
  teclas: "alto",
  cta: "alto",
  // blocos universais: cada um num lugar pensado para o conteúdo dele caber sem cobrir o rosto
  topicos: "topo",
  passos: "mini",
  numero: "alto",
  comparacao: "alto",
  grafico: "topo",
  destaque: "cheia",
  definicao: "topo",
  frase: "centro",
  pergunta: "cheia",
};

// (um painel `lista` sem teclas não precisa do canto do atalho: a pessoa fica em cima e o painel embaixo)
// (tópicos com 4 ou 5 itens precisam da altura toda: a pessoa minimiza e a nota fica em cima)
export const lugarDoMomento = (m: Momento): Lugar =>
  m.pessoa ??
  (m.tipo === "lista" && !m.teclas?.length && m.itens.length <= 3
    ? "topo"
    : m.tipo === "topicos" && m.itens.length >= 4
      ? "mini"
      : m.tipo === "teclas" && duasFilas((m.teclas ?? []).map((k) => k.tecla))
        ? "topo"
        : LUGAR_PADRAO[m.tipo]);

// A caixa do vídeo dentro da janela (abaixo da barra de título)
export const caixaDoVideo = (j: CaixaJanela): Caixa => ({
  x: 0,
  y: j.barra * BARRA_JANELA,
  w: j.w,
  h: j.h - j.barra * BARRA_JANELA,
  raio: 0,
  zoom: j.zoom,
  ancoraY: j.ancoraY,
});

// Onde o rosto cai no quadro, para uma caixa de vídeo em coordenadas do quadro (mesma conta do motor)
export const rostoNaCaixa = (c: Caixa, rosto: { x: number; y: number }, videoAltura: number) => {
  const W0 = 1080;
  const H0 = videoAltura;
  const fx = rosto.x;
  const fy = (rosto.y * 1920) / H0;
  const escala = Math.max(c.w / W0, c.h / H0) * (c.zoom ?? 1);
  const lv = W0 * escala;
  const av = H0 * escala;
  const esquerda = Math.min(0, Math.max(c.w - lv, c.w / 2 - fx * lv));
  const topo = Math.min(0, Math.max(c.h - av, c.h * (c.ancoraY ?? 0.3) - fy * av));
  return { x: c.x + esquerda + fx * lv, y: c.y + topo + fy * av, escala };
};

// Pontos da barra de título onde o mouse pega e onde ficam os botões (– □ ×)
export const pegada = (j: CaixaJanela) =>
  j.barra > 0.5 ? { x: j.x + j.w * 0.66, y: j.y + BARRA_JANELA / 2 } : j.w >= W - 1 ? { x: W / 2, y: 132 } : { x: j.x + j.w / 2, y: j.y + 48 };
// (botões de 48 px com 18 px entre eles e 22 px de margem à direita — ver BotoesJanela)
export const botoesDaJanela = (j: CaixaJanela) => {
  const y = j.y + BARRA_JANELA / 2;
  return { fechar: { x: j.x + j.w - 46, y }, maximizar: { x: j.x + j.w - 112, y }, minimizar: { x: j.x + j.w - 178, y } };
};

// ---------- janelas dos momentos ----------

export const NAVEGADOR = { x: MARGEM_JANELA, y: 996, w: W - 2 * MARGEM_JANELA, h: 440, abasAltura: 86, enderecoAltura: 78 };
export type GeoNavegador = typeof NAVEGADOR;
// com teclas, o navegador fica embaixo delas; sem teclas, ocupa a área toda embaixo da pessoa
export const navegadorGeom = (m: Momento): GeoNavegador =>
  "teclas" in m && m.teclas?.length ? NAVEGADOR : { ...NAVEGADOR, y: 790, h: FUNDO_JANELAS - 790 };
// largura de cada aba e posição do × (n abas)
export const abasGeom = (n: number, N: GeoNavegador = NAVEGADOR) => {
  const inicio = N.x + 18;
  const largura = Math.min(340, (N.w - 36 - 64) / Math.max(n, 1));
  return Array.from({ length: n }, (_, i) => ({
    x: inicio + i * largura,
    w: largura,
    fechar: { x: inicio + i * largura + largura - 34, y: N.y + 12 + (N.abasAltura - 12) / 2 },
  }));
};

export const LISTA = { x: MARGEM_JANELA, y: 168, w: W - 2 * MARGEM_JANELA, h: 796, cabecalho: 252, linha: 116, vao: 14 };
export type GeoListaPainel = typeof LISTA;
// O painel: em cima (pessoa minimizada, com o atalho ao lado) ou, sem teclas, embaixo da pessoa.
// As linhas encolhem para caber de 2 a 5 itens.
export const listaGeom = (plano: Plano, m: Momento): GeoListaPainel => {
  if (m.tipo !== "lista") return LISTA;
  const base = lugarDoMomento(m) === "mini" ? LISTA : { ...LISTA, ...areaDoMomento(plano, m) };
  const cabecalho = m.subtitulo || m.selo ? (m.selo ? 252 : 190) : BARRA_JANELA + 26;
  const n = Math.max(1, Math.min(5, m.itens.length));
  const vao = n >= 5 ? 10 : 14;
  const linha = Math.min(116, Math.floor((base.h - cabecalho - 20) / n - vao));
  return { ...base, cabecalho, linha, vao };
};
export const itemGeom = (i: number, L: GeoListaPainel = LISTA) => ({
  x: L.x + 28,
  y: L.y + L.cabecalho + i * (L.linha + L.vao),
  w: L.w - 56,
  h: L.linha,
});

// Teclas: centro, altura e unidade (largura de uma tecla de 1 letra) por tipo de momento
// (`largura` = espaço máximo da fila; atalho comprido encolhe as teclas para caber)
export const TECLADO: Record<"navegador" | "lista" | "recorte" | "teclas", { cx: number; cy: number; u: number; largura: number }> = {
  navegador: { cx: W / 2, cy: 912, u: 132, largura: 980 },
  lista: { cx: 770, cy: 1230, u: 148, largura: 520 },
  recorte: { cx: W / 2, cy: 1148, u: 142, largura: 980 },
  teclas: { cx: W / 2, cy: 1150, u: 166, largura: 1000 },
};

// Aviso do recorte (miniatura + texto), embaixo das teclas, até o dock; sem teclas, mais alto e no meio da faixa
export const AVISO_RECORTE = { x: MARGEM_JANELA, y: 1244, w: W - 2 * MARGEM_JANELA, h: 190 };
export const avisoDoRecorte = (m: Momento) => ("teclas" in m && m.teclas?.length ? AVISO_RECORTE : { ...AVISO_RECORTE, y: 1112, h: 230 });

// Cartões no peito, sobre a pessoa em tela cheia (abaixo do queixo). Gravação perto da câmera
// (queixo baixo): o cartão desce junto com a zona que o motor mede, até 1120 px.
export const topoDoPeito = (plano: Plano) => Math.round(Math.max(1004, Math.min(1120, (plano.zona?.topo ?? 1004) - 60)));
// fundo dos cartões no peito (a interface do app começa em 1560)
export const FUNDO_PEITO = 1536;
export const CARTAO_ABERTURA = { x: MARGEM_JANELA, y: 1004, w: W - 2 * MARGEM_JANELA };

// Área livre para a janela do momento, conforme o lugar da pessoa:
// embaixo dela (topo, alto, centro), em cima (mini) ou no peito (cheia). Sempre acima do dock.
export type Area = { x: number; y: number; w: number; h: number };
export const FUNDO_JANELAS = DOCK.y - 12;
export const areaDoMomento = (plano: Plano, m: Momento): Area => {
  const lugar = lugarDoMomento(m);
  if (lugar === "cheia") {
    const y = topoDoPeito(plano);
    return { x: MARGEM_JANELA, y, w: W - 2 * MARGEM_JANELA, h: FUNDO_PEITO - y };
  }
  const j = lugares(plano)[lugar];
  if (lugar === "mini") return { x: MARGEM_JANELA, y: 168, w: W - 2 * MARGEM_JANELA, h: j.y - 20 - 168 };
  const y = j.y + j.h + 22;
  return { x: MARGEM_JANELA, y, w: W - 2 * MARGEM_JANELA, h: FUNDO_JANELAS - y };
};
// Ao lado da miniatura (lugar "mini"): a faixa de baixo, à direita
export const areaAoLadoDaMini = (plano: Plano): Area => {
  const j = lugares(plano).mini;
  const x = j.x + j.w + 24;
  return { x, y: j.y, w: W - MARGEM_JANELA - x, h: j.h };
};
export const CARTAO_CTA = { x: MARGEM_JANELA, y: 1000, w: W - 2 * MARGEM_JANELA, h: 440 };
// o cartão do fechamento fica no peito (tela cheia) ou logo abaixo da janela da pessoa
// sem destinatário (`para`), o cartão é mais baixo: só o título e os dois botões
export const alturaDoCartaoCta = (m: Momento) => (m.tipo === "cta" && m.para ? CARTAO_CTA.h : 312);
export const topoDoCartaoCta = (plano: Plano, m: Momento) => {
  const lugar = lugarDoMomento(m);
  if (lugar === "cheia" || lugar === "mini") return topoDoPeito(plano);
  const j = lugares(plano)[lugar];
  return Math.min(j.y + j.h + 18, DOCK.y - 18 - alturaDoCartaoCta(m));
};
export const botoesCta = (topo: number) => {
  const y = topo + 150;
  const w = (CARTAO_CTA.w - 44 * 2 - 28) / 2;
  return {
    salvar: { x: CARTAO_CTA.x + 44, y, w, h: 116 },
    enviar: { x: CARTAO_CTA.x + 44 + w + 28, y, w, h: 116 },
    para: { x: CARTAO_CTA.x + 44, y: y + 144, w: CARTAO_CTA.w - 88, h: 104 },
  };
};

// Dock: ícones fixos do desktop (a chamada sempre aberta)
export const ICONES_DOCK = ["globo", "pasta", "prancheta", "tesoura", "nota", "camera"] as const;
export const posDock = (i: number) => {
  const n = ICONES_DOCK.length;
  const largura = n * DOCK.icone + (n - 1) * DOCK.vao;
  const x0 = W / 2 - largura / 2;
  return { x: x0 + i * (DOCK.icone + DOCK.vao) + DOCK.icone / 2, y: DOCK.y + DOCK.h / 2 };
};
// Momentos que abrem uma janela de conteúdo (as outras coisas ficam direto no desktop ou no peito)
export const TIPOS_DE_JANELA: Momento["tipo"][] = ["navegador", "lista", "topicos", "passos", "numero", "grafico", "comparacao", "definicao", "frase"];

// O app de cada momento: o ícone do dock de onde a janela cresce e o nome na barra de menu
export const iconeDoTipo: Partial<Record<Momento["tipo"], (typeof ICONES_DOCK)[number]>> = {
  navegador: "globo",
  lista: "prancheta",
  recorte: "tesoura",
  topicos: "nota",
  passos: "pasta",
  numero: "prancheta",
  comparacao: "pasta",
  grafico: "prancheta",
  definicao: "nota",
  frase: "nota",
};
export const APP_DO_TIPO: Partial<Record<Momento["tipo"], string>> = {
  navegador: "Navegador",
  recorte: "Recorte",
  topicos: "Notas",
  passos: "Assistente",
  numero: "Painel",
  comparacao: "Janelas",
  grafico: "Gráficos",
  definicao: "Dicionário",
  frase: "Notas",
  destaque: "Avisos",
  pergunta: "Avisos",
};
