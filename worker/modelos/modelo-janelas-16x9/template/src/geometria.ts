// Geometria do desktop deitado (px na camada lógica 2400×1350, que a Edicao encolhe para o quadro
// 1920×1080: veja tema.ts). Tudo que o mouse precisa achar (barra de título, botões, abas, itens)
// sai daqui, para o cursor e os componentes nunca discordarem.
//
// A regra da aula 9 do curso (editar uma aula horizontal):
// - Tela cheia é a base: a janela da chamada cobre o quadro e a pessoa fica como foi gravada.
// - Quando um bloco pede apoio visual, a janela da chamada vai para uma MOLDURA do lado direito,
//   com o rosto no meio dela (seguido de leve pelo rastro), e a janela do bloco ocupa o QUADRO do
//   lado esquerdo, na altura toda entre a barra de menu e o dock.
// - Os cartões que no vertical ficam no peito da pessoa em tela cheia (abertura, destaque,
//   pergunta) continuam com a pessoa em tela cheia: o vídeo desliza um pouco (lugar "lado") e o
//   cartão entra na COLUNA livre ao lado do rosto, sem cobrir a pessoa.
//
//   [ QUADRO do bloco: da margem até a moldura, y 112 a 1216 | MOLDURA da pessoa, à direita ]
//   [                         dock no meio, embaixo (y 1228 a 1328)                         ]
import type { Caixa, Rosto } from "./motor/caixa";
import type { Lugar, Momento, Plano } from "./plano";
import { duasFilas } from "./teclado";
import { BARRA_JANELA, DOCK, H, MARGEM_JANELA, QUADRO, RAIO_JANELA, TOPO, W } from "./tema";

// Lugares da janela da pessoa. "lado" é só do quadro deitado: tela cheia com o vídeo deslizado
// para abrir a coluna dos cartões (o plano escreve "cheia"; a geometria troca sozinha).
export type LugarDaJanela = Lugar | "lado";
export const telaCheia = (l: LugarDaJanela) => l === "cheia" || l === "lado";

// A janela da chamada. `barra` = 1 mostra a barra de título; 0 = sem barra (tela cheia, mini).
export type CaixaJanela = Required<Caixa> & { barra: number };

// fundo das janelas (acima do dock) e a altura útil entre a barra de menu e o dock
export const FUNDO_JANELAS = DOCK.y - 20;
const ALTURA_UTIL = FUNDO_JANELAS - TOPO;
// vão entre o quadro do bloco e a moldura da pessoa
const VAO_MOLDURA = 48;
// o quadro do bloco nunca passa desta largura (fica no meio do espaço livre)
const LARGURA_MAX_QUADRO = 1400;

// a largura do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
export const ROSTO_PADRAO = 0.13;
export const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO;
};
const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// As molduras da pessoa, todas do lado direito e no meio da altura útil (retrato: cabeça e ombros)
const MOLDURAS: Record<"topo" | "centro" | "alto", { w: number; h: number }> = {
  // navegador, tópicos, gráfico, definição: a moldura mais estreita deixa o quadro do bloco largo
  topo: { w: 760, h: 960 },
  // recorte e frase: moldura grande, o rosto grande para o retângulo do recorte
  centro: { w: 880, h: 1000 },
  // teclas, fechamento, número, comparação
  alto: { w: 880, h: 1060 },
};
// minimizada: miniatura sem barra no canto de baixo, à direita; em cima dela fica a coluna do
// atalho (lista) ou do progresso (passos), como o canto ao lado da miniatura no vertical
const MINI = { w: 500, h: 560 };
const xDaMoldura = (lugar: "topo" | "centro" | "alto" | "mini") => W - MARGEM_JANELA - (lugar === "mini" ? MINI.w : MOLDURAS[lugar].w);

// Zoom que deixa o rosto com `fracao` da largura da moldura, sem aproximar demais (a altura
// mostra pelo menos 1,5 rosto: testa, queixo e pescoço). Gravação perto da câmera = zoom 1.
const zoomDoRetrato = (plano: Plano, w: number, hVideo: number, fracao: number) => {
  const cobre = Math.max(w / QUADRO.w, hVideo / alturaDoVideo(plano));
  const rosto1 = larguraDoRosto(plano) * QUADRO.w * cobre;
  const teto = hVideo / (1.5 * rosto1);
  return Math.max(1, Math.min(2.4, teto, (fracao * w) / rosto1));
};

const moldura = (plano: Plano, w: number, h: number, barra: number, fracao: number, y?: number): CaixaJanela => ({
  x: W - MARGEM_JANELA - w,
  y: y ?? Math.round(TOPO + (ALTURA_UTIL - h) / 2),
  w,
  h,
  raio: RAIO_JANELA,
  zoom: zoomDoRetrato(plano, w, h - barra * BARRA_JANELA, fracao),
  ancoraY: 0.46,
  // o rosto no meio da moldura
  ancoraX: 0.5,
  barra,
});

// --- a coluna dos cartões (pessoa em tela cheia) ---
// O cartão fica na coluna livre ao lado do rosto (o lado com mais espaço; empate = esquerda), com
// folga para o rosto e para o rastro. Coluna estreita (rosto no meio): o vídeo desliza para o outro
// lado, aproximando o mínimo para não sobrar borda (até ZOOM_DO_DESLIZE).
export type Coluna = { x: number; w: number; lado: "esq" | "dir"; zoom: number; ancoraX: number; rostoY: number };
const LARGURA_DO_CARTAO = { min: 940, max: 1080, piso: 520 };
const ZOOM_DO_DESLIZE = 1.2;
// a base dos cartões: acima da etiqueta do nome da chamada (canto de baixo, à esquerda)
export const FUNDO_PEITO = H - 200;

const colunas = new WeakMap<Plano, Coluna>();
export const colunaDoCartao = (plano: Plano): Coluna => {
  const salva = colunas.get(plano);
  if (salva) return salva;
  const fx = plano.rosto.x;
  // no quadro cheio o vídeo tem a largura da camada (W): o rosto mede largura × W × zoom
  const rosto = larguraDoRosto(plano) * W;
  const folga = (z: number) => 0.85 * rosto * z + 50;
  // até onde o rosto vai, com o zoom z, do lado oposto ao cartão (sem borda vazia)
  const livre = (lado: "esq" | "dir", z: number) => {
    const xR = lado === "esq" ? fx * W * z : W - (1 - fx) * W * z;
    return { xR, w: lado === "esq" ? xR - folga(z) - MARGEM_JANELA : W - MARGEM_JANELA - (xR + folga(z)) };
  };
  const lado = livre("esq", 1).w >= livre("dir", 1).w ? "esq" : "dir";
  let zoom = 1;
  while (zoom < ZOOM_DO_DESLIZE - 1e-6 && livre(lado, zoom).w < LARGURA_DO_CARTAO.min) zoom = Math.round((zoom + 0.01) * 100) / 100;
  const max = livre(lado, zoom);
  const w = Math.round(Math.max(LARGURA_DO_CARTAO.piso, Math.min(LARGURA_DO_CARTAO.max, max.w)));
  // só desliza o necessário: o rosto fica onde o cartão cabe (ou onde foi gravado, se já cabia)
  const xR =
    lado === "esq"
      ? Math.min(max.xR, Math.max(fx * W, MARGEM_JANELA + w + folga(zoom)))
      : Math.max(max.xR, Math.min(fx * W, W - MARGEM_JANELA - w - folga(zoom)));
  const inicio = lado === "esq" ? MARGEM_JANELA : xR + folga(zoom);
  const fim = lado === "esq" ? xR - folga(zoom) : W - MARGEM_JANELA;
  const x = Math.round(inicio + Math.max(0, (fim - inicio - w) / 2));
  const c: Coluna = { x, w, lado, zoom, ancoraX: xR / W, rostoY: plano.rosto.y * H };
  colunas.set(plano, c);
  return c;
};

// Topo de um cartão de altura h na coluna: na altura do rosto, dentro da faixa útil
export const topoNaColuna = (plano: Plano, h: number) =>
  Math.round(Math.max(TOPO + 16, Math.min(FUNDO_PEITO - h, colunaDoCartao(plano).rostoY - h * 0.42)));

export const lugares = (plano: Plano): Record<LugarDaJanela, CaixaJanela> => {
  const c = colunaDoCartao(plano);
  const cheia: CaixaJanela = { x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: plano.rosto.y, ancoraX: plano.rosto.x, barra: 0 };
  return {
    // tela cheia: o rosto fica onde está na gravação
    cheia,
    // tela cheia com o vídeo deslizado: a coluna do cartão fica livre ao lado do rosto
    lado: { ...cheia, zoom: c.zoom, ancoraX: c.ancoraX },
    topo: moldura(plano, MOLDURAS.topo.w, MOLDURAS.topo.h, 1, 0.36),
    centro: moldura(plano, MOLDURAS.centro.w, MOLDURAS.centro.h, 1, 0.36),
    alto: moldura(plano, MOLDURAS.alto.w, MOLDURAS.alto.h, 1, 0.34),
    mini: { ...moldura(plano, MINI.w, MINI.h, 0, 0.44, FUNDO_JANELAS - MINI.h), ancoraY: 0.5 },
  };
};

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

// (um painel `lista` sem teclas não precisa do canto do atalho: a pessoa vai para a moldura)
// (tópicos com 4 ou 5 itens: a pessoa minimiza e a nota fica com o quadro mais largo)
const lugarDoPlano = (m: Momento): Lugar =>
  m.pessoa ??
  (m.tipo === "lista" && !m.teclas?.length && m.itens.length <= 3
    ? "topo"
    : m.tipo === "topicos" && m.itens.length >= 4
      ? "mini"
      : m.tipo === "teclas" && duasFilas((m.teclas ?? []).map((k) => k.tecla))
        ? "topo"
        : LUGAR_PADRAO[m.tipo]);

// Os cartões do sistema que ficam sobre a pessoa em tela cheia
const CARTOES: Momento["tipo"][] = ["abertura", "destaque", "pergunta", "cta"];
// Tela cheia com conteúdo vira "lado" (o cartão na coluna ao lado do rosto). Uma janela nunca fica
// escondida atrás da pessoa em tela cheia: vai para o lugar padrão do tipo dela.
export const lugarDoMomento = (m: Momento): LugarDaJanela => {
  const l = lugarDoPlano(m);
  if (l !== "cheia") return l;
  if (CARTOES.includes(m.tipo)) return "lado";
  const padrao = LUGAR_PADRAO[m.tipo];
  return padrao === "cheia" ? "lado" : padrao;
};

// A caixa do vídeo dentro da janela (abaixo da barra de título)
export const caixaDoVideo = (j: CaixaJanela): Caixa => ({
  x: 0,
  y: j.barra * BARRA_JANELA,
  w: j.w,
  h: j.h - j.barra * BARRA_JANELA,
  raio: 0,
  zoom: j.zoom,
  ancoraY: j.ancoraY,
  ancoraX: j.ancoraX,
});

// Onde o rosto cai na tela, para uma caixa de vídeo em coordenadas da camada (mesma conta do
// motor, sem o rastro). `lv` = largura do vídeo na tela; `largura` = largura do rosto na tela.
export const rostoNaCaixa = (c: Caixa, plano: Plano) => {
  const W0 = QUADRO.w;
  const H0 = alturaDoVideo(plano);
  const fx = plano.rosto.x;
  const fy = (plano.rosto.y * QUADRO.h) / H0;
  const escala = Math.max(c.w / W0, c.h / H0) * (c.zoom ?? 1);
  const lv = W0 * escala;
  const av = H0 * escala;
  const esquerda = Math.min(0, Math.max(c.w - lv, (c.ancoraX === undefined ? c.w / 2 : c.w * c.ancoraX) - fx * lv));
  const topo = Math.min(0, Math.max(c.h - av, c.h * (c.ancoraY ?? 0.3) - fy * av));
  return { x: c.x + esquerda + fx * lv, y: c.y + topo + fy * av, escala, lv, largura: larguraDoRosto(plano) * lv };
};

// Pontos da barra de título onde o mouse pega e onde ficam os botões (– □ ×)
export const pegada = (j: CaixaJanela) =>
  j.barra > 0.5 ? { x: j.x + j.w * 0.66, y: j.y + BARRA_JANELA / 2 } : j.w >= W - 1 ? { x: W / 2, y: 132 } : { x: j.x + j.w / 2, y: j.y + 48 };
// (botões de 48 px com 18 px entre eles e 22 px de margem à direita — ver BotoesJanela)
export const botoesDaJanela = (j: CaixaJanela) => {
  const y = j.y + BARRA_JANELA / 2;
  return { fechar: { x: j.x + j.w - 46, y }, maximizar: { x: j.x + j.w - 112, y }, minimizar: { x: j.x + j.w - 178, y } };
};

// ---------- o quadro do bloco (lado esquerdo) ----------

export type Area = { x: number; y: number; w: number; h: number };
// O espaço livre ao lado da pessoa, conforme o lugar dela: à esquerda da moldura (ou da
// miniatura), na altura útil inteira; em tela cheia, a coluna ao lado do rosto.
export const quadroDoLugar = (lugar: LugarDaJanela, plano?: Plano): Area => {
  if (telaCheia(lugar)) {
    if (!plano) return quadroDoLugar("topo");
    const c = colunaDoCartao(plano);
    return { x: c.x, y: TOPO, w: c.w, h: FUNDO_PEITO - TOPO };
  }
  const livre = xDaMoldura(lugar as "topo" | "centro" | "alto" | "mini") - VAO_MOLDURA - MARGEM_JANELA;
  const w = Math.min(LARGURA_MAX_QUADRO, livre);
  return { x: MARGEM_JANELA + Math.round((livre - w) / 2), y: TOPO, w, h: ALTURA_UTIL };
};

// altura máxima da janela de cada bloco no quadro deitado (ela fica no meio da altura útil):
// o conteúdo do vertical foi pensado para uma janela mais baixa e não estica à toa
const ALTURA_MAX: Partial<Record<Momento["tipo"], number>> = {
  numero: 720,
  definicao: 820,
  frase: 760,
  comparacao: 900,
  grafico: 960,
};
export const areaDoMomento = (plano: Plano, m: Momento): Area => {
  const q = quadroDoLugar(lugarDoMomento(m), plano);
  const max = ALTURA_MAX[m.tipo];
  if (!max || max >= q.h) return q;
  return { ...q, y: Math.round(q.y + (q.h - max) / 2), h: max };
};
// Em cima da miniatura (lugar "mini"): a coluna da direita, acima da pessoa
export const areaAoLadoDaMini = (_plano?: Plano): Area => {
  const y = FUNDO_JANELAS - MINI.h;
  return { x: xDaMoldura("mini"), y: TOPO, w: MINI.w, h: y - 24 - TOPO };
};

// ---------- janelas dos momentos ----------

// Teclas: centro, altura e unidade (largura de uma tecla de 1 letra) de cada momento
// (`largura` = espaço máximo da fila; atalho comprido encolhe as teclas para caber)
export type GeoTeclado = { cx: number; cy: number; u: number; largura: number };
// faixa das teclas no alto do quadro (navegador e lista: a janela fica embaixo delas)
const FAIXA_DAS_TECLAS = 290;
// teclas do recorte e o aviso embaixo delas, no meio da altura útil
const BLOCO_DO_RECORTE = { teclas: 142, alturaAviso: 190, vao: 96 };
const topoDoRecorte = () => Math.round(TOPO + (ALTURA_UTIL - (70 + BLOCO_DO_RECORTE.teclas + BLOCO_DO_RECORTE.vao + BLOCO_DO_RECORTE.alturaAviso)) / 2);
export const tecladoDe = (m: Momento): GeoTeclado => {
  const lugar = lugarDoMomento(m);
  if (m.tipo === "lista" && lugar === "mini") {
    // ao lado da pessoa minimizada (em cima da miniatura), como no vertical
    const s = areaAoLadoDaMini();
    return { cx: s.x + s.w / 2, cy: s.y + s.h / 2 + 30, u: 140, largura: s.w - 40 };
  }
  const q = quadroDoLugar(lugar);
  const cx = q.x + q.w / 2;
  if (m.tipo === "navegador" || m.tipo === "lista") return { cx, cy: q.y + 146, u: m.tipo === "lista" ? 140 : 132, largura: Math.min(1100, q.w - 40) };
  if (m.tipo === "recorte") return { cx, cy: topoDoRecorte() + 70 + BLOCO_DO_RECORTE.teclas / 2, u: BLOCO_DO_RECORTE.teclas, largura: Math.min(1100, q.w - 40) };
  // o momento "teclas": teclas grandes no meio do quadro
  return { cx, cy: q.y + q.h / 2, u: 176, largura: Math.min(1120, q.w - 60) };
};

// O navegador: no quadro do bloco; com teclas, embaixo delas
const ALTURA_MAX_NAVEGADOR = 920;
export const navegadorGeom = (m: Momento) => {
  const q = quadroDoLugar(lugarDoMomento(m));
  const comTeclas = "teclas" in m && !!m.teclas?.length;
  const y = comTeclas ? q.y + FAIXA_DAS_TECLAS : Math.round(q.y + Math.max(0, (q.h - ALTURA_MAX_NAVEGADOR) / 2));
  const h = comTeclas ? FUNDO_JANELAS - y : Math.min(q.h, ALTURA_MAX_NAVEGADOR);
  return { x: q.x, y, w: q.w, h, abasAltura: 86, enderecoAltura: 78 };
};
export type GeoNavegador = ReturnType<typeof navegadorGeom>;
// largura de cada aba e posição do × (n abas)
export const abasGeom = (n: number, N: GeoNavegador) => {
  const inicio = N.x + 18;
  const largura = Math.min(340, (N.w - 36 - 64) / Math.max(n, 1));
  return Array.from({ length: n }, (_, i) => ({
    x: inicio + i * largura,
    w: largura,
    fechar: { x: inicio + i * largura + largura - 34, y: N.y + 12 + (N.abasAltura - 12) / 2 },
  }));
};

export type GeoListaPainel = { x: number; y: number; w: number; h: number; cabecalho: number; linha: number; vao: number };
// O painel da lista no quadro do bloco, com a altura do conteúdo, no meio da altura útil (com
// teclas fora da miniatura, embaixo delas). As linhas encolhem para caber de 2 a 5 itens.
export const listaGeom = (plano: Plano, m: Momento): GeoListaPainel => {
  const area = areaDoMomento(plano, m);
  if (m.tipo !== "lista") return { ...area, cabecalho: 252, linha: 116, vao: 14 };
  const teclasEmCima = !!m.teclas?.length && lugarDoMomento(m) !== "mini";
  const base = teclasEmCima ? { ...area, y: area.y + FAIXA_DAS_TECLAS, h: area.h - FAIXA_DAS_TECLAS } : area;
  const cabecalho = m.subtitulo || m.selo ? (m.selo ? 252 : 190) : BARRA_JANELA + 26;
  const n = Math.max(1, Math.min(5, m.itens.length));
  const vao = n >= 5 ? 10 : 14;
  const linha = Math.min(116, Math.floor((base.h - cabecalho - 20) / n - vao));
  const h = Math.min(base.h, Math.round(cabecalho + 20 + n * (linha + vao) + 24));
  const y = teclasEmCima ? base.y : Math.round(base.y + (base.h - h) / 2);
  return { x: base.x, y, w: base.w, h, cabecalho, linha, vao };
};
export const itemGeom = (i: number, L: GeoListaPainel) => ({
  x: L.x + 28,
  y: L.y + L.cabecalho + i * (L.linha + L.vao),
  w: L.w - 56,
  h: L.linha,
});

// Aviso do recorte (miniatura + texto), embaixo das teclas; sem teclas, mais alto e no meio
export const avisoDoRecorte = (m: Momento): Area => {
  const q = quadroDoLugar(lugarDoMomento(m));
  const w = Math.min(1100, q.w);
  const x = Math.round(q.x + (q.w - w) / 2);
  if ("teclas" in m && m.teclas?.length) {
    const y = topoDoRecorte() + 70 + BLOCO_DO_RECORTE.teclas + BLOCO_DO_RECORTE.vao;
    return { x, y, w, h: BLOCO_DO_RECORTE.alturaAviso };
  }
  return { x, y: Math.round(TOPO + (ALTURA_UTIL - 230) / 2), w, h: 230 };
};

// ---------- o fechamento ----------

// O cartão do fechamento: no quadro do bloco (a pessoa na moldura ou na miniatura) ou na coluna ao
// lado do rosto (pessoa em tela cheia). Sem destinatário (`para`), o cartão é mais baixo: só o
// título e os dois botões.
export const alturaDoCartaoCta = (m: Momento) => (m.tipo === "cta" && m.para ? 440 : 312);
export const cartaoCta = (plano: Plano, m: Momento) => {
  const q = quadroDoLugar(lugarDoMomento(m), plano);
  const w = Math.min(1080, q.w);
  return { x: Math.round(q.x + (q.w - w) / 2), w, h: alturaDoCartaoCta(m) };
};
// topo de um cartão de altura h: na coluna (tela cheia) ou no meio do quadro do bloco
export const topoDoCartao = (plano: Plano, m: Momento, h: number) => {
  const lugar = lugarDoMomento(m);
  if (telaCheia(lugar)) return topoNaColuna(plano, h);
  const q = quadroDoLugar(lugar, plano);
  return Math.round(q.y + Math.max(0, (q.h - h) / 2));
};
export const topoDoCartaoCta = (plano: Plano, m: Momento) => topoDoCartao(plano, m, alturaDoCartaoCta(m));
export const botoesCta = (topo: number, c: { x: number; w: number }) => {
  const y = topo + 150;
  const w = (c.w - 44 * 2 - 28) / 2;
  return {
    salvar: { x: c.x + 44, y, w, h: 116 },
    enviar: { x: c.x + 44 + w + 28, y, w, h: 116 },
    para: { x: c.x + 44, y: y + 144, w: c.w - 88, h: 104 },
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
// Momentos que abrem uma janela de conteúdo (as outras coisas ficam direto no desktop ou na coluna)
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
