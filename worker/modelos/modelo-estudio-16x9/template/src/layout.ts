// A gramática do Estúdio, em tempo: onde fica o quadro da pessoa em cada momento, qual câmera
// (enquadramento) vale em cada instante e quais são os capítulos. Tudo sai dos momentos do plano.
//
// Versão DEITADA (16:9, 1920×1080), para o vídeo completo do YouTube. A regra da composição é a da
// aula 9 do curso (editar uma aula horizontal):
// - Tela cheia é a base: fora dos momentos (o "palco") a pessoa ocupa o quadro inteiro, como foi
//   gravada, com a régua do episódio no alto e a legenda na área segura de baixo (cada uma sobre uma
//   sombra suave que só aparece na tela cheia).
// - Quando um bloco pede apoio visual, o quadro de câmera do estúdio (cantos de 30 px, filete, a
//   etiqueta "CAM 2 · MÉDIO" e a onda presa embaixo) vira a MOLDURA do lado DIREITO, com o rosto
//   centralizado nela e acompanhado de leve pelo rastro do cortar.mjs; o bloco ocupa o QUADRO do lado
//   ESQUERDO, da margem até a moldura e da régua até o fundo. A troca de lugar continua sendo a vida
//   do modelo: a moldura muda de largura a cada bloco e desce para o canto de baixo nos passos e no
//   gráfico.
// - O fechamento (player) continua de tela cheia: o cartão do player ocupa a largura toda, com a capa
//   (a pessoa) à direita e o episódio à esquerda; a chamada fica embaixo do cartão.
//
//   [ régua do episódio: chip · capítulo · tempo / barra de capítulos            y 40–120 ]
//   [ QUADRO do bloco: x 96 até a moldura − 56     |  MOLDURA (rosto no centro)  y 144–… ]
//   [                                              |  onda presa embaixo        até y 952 ]
//   [ legenda (palco e trilha): base em y 960; abaixo de 984, os controles do player       ]
import { interpolate } from "remotion";
import { indicesDoTrecho, temposDoTexto, troca } from "./anim";
import { diagramarChamada, ehFechamento, PASSO_LINHA } from "./chamada";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Enquadramento, Momento, Plano } from "./plano";
import { FUNDO, H, MARGEM, TOPO, VAO_LADO, W } from "./tema";

// Os lugares do quadro da pessoa. Cada bloco põe o quadro num deles: é a troca de lugar que dá vida
// ao modelo (no 16:9 a moldura fica sempre à direita e muda de largura, desce para o canto de baixo
// e vira a capa do player).
export type Layout = "palco" | "abertura" | "entrevista" | "trilha" | "numero" | "citacao" | "pauta" | "baixo" | "player";

// duração da troca de lugar do quadro
export const TROCA = 0.55;
// o quadro começa a se mover um pouco antes do momento: o corte que costuma ficar na fronteira
// cai no meio do movimento e some
export const ANTES = 0.15;

// vão entre o quadro e a faixa da onda (embaixo dele)
export const VAO_ONDA = 16;

// Onde fica o quadro da pessoa em cada layout (enquadramento "aberto"); `onda` = altura da faixa da
// onda logo abaixo do quadro. O zoom de cada moldura sai da largura do rosto medida (`lugarDe`).
export type Lugar = { caixa: Caixa; onda: number };

// a moldura do lado direito: largura `w`, do TOPO até a onda terminar no FUNDO
const moldura = (w: number, onda: number, ancoraY: number): Lugar => ({
  caixa: { x: W - MARGEM - w, y: TOPO, w, h: FUNDO - TOPO - VAO_ONDA - onda, raio: 30, zoom: 1, ancoraY },
  onda,
});

export const LUGARES: Record<Layout, Lugar> = {
  // fora dos momentos: a tela cheia (a base da aula 9), com a legenda embaixo; o real sai de `cheio`
  palco: { caixa: { x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: 0.38 }, onda: 0 },
  // abertura e destaque: a moldura mais larga (720×720); o título no quadro da esquerda
  abertura: moldura(720, 72, 0.42),
  // pergunta, resposta e comparação: moldura média (640); o cartão de entrevista à esquerda
  entrevista: moldura(640, 62, 0.44),
  // trilha: a moldura vira coluna estreita (500); à esquerda, o começo e o ponto grande em fileira,
  // a trilha embaixo e a legenda
  trilha: moldura(500, 58, 0.44),
  // número: moldura de 600; à esquerda, o número grande e o medidor embaixo
  numero: moldura(600, 58, 0.44),
  // frase (citação) e definição: moldura de 680; o texto à esquerda
  citacao: moldura(680, 62, 0.44),
  // tópicos (a pauta): moldura de 580; o cartão da pauta à esquerda
  pauta: moldura(580, 56, 0.45),
  // passos e gráfico: a moldura desce para o canto de baixo e encolhe; o conteúdo ocupa o alto e a
  // esquerda
  baixo: { caixa: { x: W - MARGEM - 520, y: FUNDO - 56 - VAO_ONDA - 400, w: 520, h: 400, raio: 30, zoom: 1, ancoraY: 0.46 }, onda: 56 },
  // player: o quadro vira a capa do episódio, dentro do cartão do player (ver geometriaDoPlayer)
  player: { caixa: { x: W - MARGEM - 40 - 680, y: TOPO + 40, w: 680, h: 530, raio: 26, zoom: 1, ancoraY: 0.42 }, onda: 54 },
};

// Quanto o rosto ocupa da largura da moldura em cada lugar (cabeça e ombros). No 16:9 o rosto gravado
// é estreito (~13% da largura do quadro): sem isto a moldura mostraria a sala inteira.
const ROSTO_NA_MOLDURA: Record<Layout, number> = {
  palco: 0,
  abertura: 0.36,
  entrevista: 0.38,
  trilha: 0.42,
  numero: 0.4,
  citacao: 0.38,
  pauta: 0.4,
  baixo: 0.36,
  player: 0.34,
};

// a largura do rosto (fração da largura do quadro): a do rastreio do cortar.mjs ou a típica do 16:9
const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  return l && Number.isFinite(l) && l > 0.03 ? l : 0.13;
};

// Zoom da moldura para o rosto ocupar `fracao` da largura dela (1 = o menor enquadramento que cobre
// a moldura; gravação de perto, com o rosto grande, fica em 1). `semCortarCabeca` ainda garante a
// cabeça inteira.
export const zoomDoRosto = (plano: Plano, caixa: Caixa, fracao: number) => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const s0 = Math.max(caixa.w / W, caixa.h / videoAltura);
  const rostoPx = larguraDoRosto(plano) * W * s0;
  return Math.max(1, Math.min(3, (fracao * caixa.w) / Math.max(1, rostoPx)));
};

// O cartão do player (atrás da capa): a largura toda, a capa à direita, o episódio à esquerda
export const CARTAO_PLAYER = { x: MARGEM, y: TOPO, w: W - 2 * MARGEM, h: 680, raio: 40 };

// A geometria do player depende da chamada: com 2 ou 3 linhas, a capa e o cartão encolhem para a
// chamada caber embaixo, acima dos controles do player do YouTube.
export const geometriaDoPlayer = (m?: Momento) => {
  const n = ehFechamento(m) ? Math.max(1, diagramarChamada(m, CARTAO_PLAYER.w).linhas.length) : 1;
  const menos = (n - 1) * PASSO_LINHA;
  const lugar = LUGARES.player;
  return {
    capa: { ...lugar.caixa, h: lugar.caixa.h - menos },
    cartao: { ...CARTAO_PLAYER, h: CARTAO_PLAYER.h - menos },
    onda: lugar.onda,
    linhas: n,
  };
};

// o quadro termina de recuar para o estúdio aqui (os textos da abertura esperam)
export const FIM_DO_RECUO = 0.42;

// A tela cheia (a base da aula 9): o vídeo deitado inteiro, como foi gravado, com o rosto onde está
export const cheio = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom: 1, ancoraY: Math.min(0.6, (plano.rosto.y * H) / videoAltura) };
};

// O lugar de um trecho: a tela cheia, a capa do player (muda de tamanho com a chamada) ou a moldura
// do layout, com o zoom que deixa o rosto do tamanho certo nela.
export const lugarDe = (tr: { layout: Layout; momento?: Momento }, plano: Plano): Lugar => {
  if (tr.layout === "palco") return { caixa: cheio(plano), onda: 0 };
  const caixa = tr.layout === "player" ? geometriaDoPlayer(tr.momento).capa : LUGARES[tr.layout].caixa;
  return { caixa: { ...caixa, zoom: zoomDoRosto(plano, caixa, ROSTO_NA_MOLDURA[tr.layout]) }, onda: LUGARES[tr.layout].onda };
};

// O QUADRO do bloco (aula 9): do lado esquerdo, da margem até um pouco antes da moldura da pessoa,
// do TOPO (abaixo da régua) até o FUNDO. No palco e no player, a largura útil inteira.
export type Area = { x: number; y: number; w: number; h: number };
export const quadroDe = (layout: Layout): Area => {
  if (layout === "palco" || layout === "player") return { x: MARGEM, y: TOPO, w: W - 2 * MARGEM, h: FUNDO - TOPO };
  const c = LUGARES[layout].caixa;
  return { x: MARGEM, y: TOPO, w: c.x - VAO_LADO - MARGEM, h: FUNDO - TOPO };
};

export const layoutDe = (m: Momento): Layout => {
  switch (m.tipo) {
    case "abertura":
    case "destaque":
      return "abertura";
    case "pergunta":
    case "resposta":
    case "comparacao":
      return "entrevista";
    case "trilha":
      return "trilha";
    case "numero":
      return "numero";
    case "citacao":
    case "frase":
    case "definicao":
      return "citacao";
    case "topicos":
      return "pauta";
    case "passos":
    case "grafico":
      return "baixo";
    case "player":
    case "cta":
      return "player";
  }
};

// Momentos em ordem, sem um invadir o seguinte
export const ordenar = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// O último momento fica até o fim quando é o player ou quando termina colado no fim.
export const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (ehFechamento(m) || m.ate >= plano.duracao - 0.4)) return plano.duracao + 1;
  return m.ate;
};

// Trechos de layout ao longo do vídeo: [de, ate) com o layout que vale. Entre momentos, "palco".
export type Trecho = { de: number; ate: number; layout: Layout; momento?: Momento };
export const trechos = (plano: Plano): Trecho[] => {
  const lista: Trecho[] = [];
  let cursor = 0;
  for (const m of plano.momentos) {
    const fim = Math.min(fimDe(m, plano), plano.duracao + 1);
    // um vão curto entre dois momentos não vira palco (o quadro não sobe e desce à toa)
    if (m.de - cursor > 0.6) lista.push({ de: cursor, ate: m.de, layout: "palco" });
    else if (lista.length) lista[lista.length - 1].ate = m.de;
    lista.push({ de: m.de, ate: fim, layout: layoutDe(m), momento: m });
    cursor = fim;
  }
  if (cursor < plano.duracao) lista.push({ de: cursor, ate: plano.duracao + 1, layout: "palco" });
  return lista;
};

// Estados do quadro: cada trecho começa a se mover ANTES do seu início. O primeiro trecho nasce
// em quadro cheio e recua para o estúdio (uma vez, no começo do vídeo).
export type Estado = EstadoDaCaixa & { onda: number };
export const estadosDoQuadro = (plano: Plano, lista: Trecho[]): Estado[] => {
  const estados: Estado[] = [{ de: 0, caixa: cheio(plano), dur: 0.001, onda: 0 }];
  lista.forEach((tr, i) => {
    const { caixa, onda } = lugarDe(tr, plano);
    if (i === 0) estados.push({ de: 0.04, caixa, dur: 0.6, onda });
    else if (tr.layout !== lista[i - 1].layout) estados.push({ de: Math.max(0.2, tr.de - ANTES), caixa, dur: TROCA, onda });
  });
  return estados;
};

// Altura da faixa da onda no instante t (acompanha a troca do quadro, com o mesmo tempo)
export const alturaDaOnda = (t: number, estados: Estado[]) => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  if (i === 0) return estados[0].onda;
  const p = interpolate(t, [estados[i].de, estados[i].de + (estados[i].dur ?? TROCA)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: troca,
  });
  return estados[i - 1].onda + (estados[i].onda - estados[i - 1].onda) * p;
};

// Quanto o quadro já chegou no lugar do trecho atual (0 = acabou de sair do anterior, 1 = no lugar)
export const chegada = (t: number, estados: Estado[]) => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  return interpolate(t, [estados[i].de, estados[i].de + (estados[i].dur ?? TROCA)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};

export const trechoEm = (t: number, lista: Trecho[]) => lista.find((x) => t >= x.de && t < x.ate) ?? lista[lista.length - 1];

// ---------- câmeras ----------

// Cada enquadramento multiplica o zoom do lugar e desce um pouco o rosto. Depois, `semCortarCabeca`
// garante que o cabelo e o queixo fiquem dentro do quadro (num quadro baixo o close aproxima menos).
export const CAMERAS: Record<Enquadramento, { zoom: number; ancora: number; numero: number; nome: string }> = {
  aberto: { zoom: 1, ancora: 0, numero: 1, nome: "ABERTO" },
  medio: { zoom: 1.14, ancora: 0.02, numero: 2, nome: "MÉDIO" },
  close: { zoom: 1.28, ancora: 0.04, numero: 3, nome: "CLOSE" },
};

// Quanto a cabeça ocupa acima e abaixo do centro do rosto, em fração da altura do quadro (1080).
// O padrão serve para a pessoa sentada numa gravação deitada, com o rosto em ~13% da largura do
// quadro (o queixo a ~0,66 × a largura do rosto abaixo do centro); o plano pode trocar (`cabeca`).
export const CABECA = { acima: 0.2, abaixo: 0.155 };
const FOLGA = 26;
// folga menor quando a cabeça não cabe inteira (o rosto vem primeiro)
const FOLGA_ROSTO = 10;

// Ajusta zoom e ancoraY de um quadro para a cabeça inteira caber, do alto do cabelo ao queixo:
// o zoom não passa do que cabe (mas nunca fica menor que o do lugar) e o rosto desce o necessário
// para o cabelo não encostar na borda de cima.
// A medida da cabeça: a do plano (`cabeca`); sem ela, a que o rastreio do rosto mediu (o cortar.mjs
// grava a largura do rosto, que vem da distância até o queixo: queixo ≈ 0,66 × largura abaixo do
// centro, topo do cabelo ≈ 1,3 × isso acima); sem rastreio, o padrão (pessoa sentada).
export const cabecaDo = (plano: Plano) => {
  if (plano.cabeca) return { ...CABECA, ...plano.cabeca };
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  if (!largura || !Number.isFinite(largura)) return CABECA;
  const queixo = (largura * W * 0.66) / H;
  return { acima: Math.max(CABECA.acima, queixo * 1.3), abaixo: Math.max(CABECA.abaixo, queixo) };
};

export const semCortarCabeca = (caixa: Caixa, plano: Plano, zoomDoLugar: number): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const cabeca = cabecaDo(plano);
  const base = Math.max(caixa.w / W, caixa.h / videoAltura);
  const alturaCabeca = (cabeca.acima + cabeca.abaixo) * H * base;
  const zoomMax = (caixa.h - 2 * FOLGA) / Math.max(1, alturaCabeca);
  let zoom: number;
  if (zoomMax >= zoomDoLugar) {
    // a cabeça cabe no aberto do lugar: o close aproxima até onde ela continua inteira (nunca menos
    // que o aberto)
    zoom = Math.max(zoomDoLugar, Math.min(caixa.zoom ?? 1, zoomMax));
  } else {
    // gravação perto da câmera: nem o aberto cabe a cabeça. O lugar afasta até onde der (sem passar de
    // 1, para não sobrar borda) e as câmeras aproximam a partir daí, como um close de verdade: o alto do
    // cabelo pode sair, mas os olhos e o queixo ficam sempre dentro.
    const piso = Math.max(1, zoomMax);
    const camera = (caixa.zoom ?? 1) / Math.max(0.01, zoomDoLugar);
    const zoomRosto = (caixa.h - 2 * FOLGA) / Math.max(1, (0.11 + cabeca.abaixo) * H * base);
    zoom = Math.max(piso, Math.min(piso * camera, zoomRosto));
  }
  const escala = base * zoom;
  const minimo = (FOLGA + cabeca.acima * H * escala) / caixa.h;
  const maximo = (caixa.h - FOLGA - cabeca.abaixo * H * escala) / caixa.h;
  if (minimo <= maximo) {
    const ancoraY = Math.max(minimo, Math.min(caixa.ancoraY ?? 0.3, maximo));
    return { ...caixa, zoom, ancoraY };
  }
  // A cabeça inteira não cabe (gravação muito perto da câmera num quadro largo e baixo): o rosto vem
  // primeiro. O queixo fica dentro (com uma folga menor) e o corte cai no alto do cabelo, como num
  // close de verdade; se nem os olhos couberem assim, eles ficam logo abaixo da borda de cima.
  const queixoDentro = (caixa.h - FOLGA_ROSTO - cabeca.abaixo * H * escala) / caixa.h;
  const olhos = (0.045 * H * escala + 2 * FOLGA_ROSTO) / caixa.h;
  const ancoraY = Math.max(queixoDentro, olhos);
  return { ...caixa, zoom, ancoraY };
};

// Câmeras automáticas (quando o plano não traz `cameras`): cada momento abre no aberto; a pergunta e
// a citação dão um close no destaque; um corte longe das trocas de lugar alterna aberto ↔ close.
export const camerasAuto = (plano: Plano, lista: Trecho[]) => {
  const cams: { em: number; plano: Enquadramento }[] = [{ em: 0, plano: "aberto" }];
  for (const tr of lista) if (tr.de > 0) cams.push({ em: Math.max(0.2, tr.de - ANTES), plano: "aberto" });
  for (const m of plano.momentos) {
    if ((m.tipo === "citacao" || m.tipo === "frase" || m.tipo === "pergunta") && m.destaque) {
      const indices = [...indicesDoTrecho(m.texto, m.destaque)];
      const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate, m.em ?? m.de);
      if (indices.length) cams.push({ em: tempos[Math.min(...indices)], plano: "close" });
    }
    // o destaque bate forte: corte seco para o close na palavra (e de volta ao aberto no detalhe)
    if (m.tipo === "destaque") {
      cams.push({ em: Math.max(m.de + 0.3, m.em - 0.04), plano: "close" });
      if (m.detalhe && m.detalheEm !== undefined && m.detalheEm - m.em > 1) cams.push({ em: m.detalheEm - 0.04, plano: "aberto" });
    }
  }
  const trocas = lista.map((tr) => tr.de);
  for (const c of plano.cortesEm ?? []) {
    if (trocas.some((x) => Math.abs(x - c) < 0.7)) continue;
    const antes = [...cams].sort((a, b) => a.em - b.em).filter((k) => k.em <= c).pop();
    cams.push({ em: c, plano: antes?.plano === "close" ? "aberto" : "close" });
  }
  return cams.sort((a, b) => a.em - b.em);
};

export const cameraEm = (t: number, cams: { em: number; plano: Enquadramento }[]) => {
  let atual: Enquadramento = "aberto";
  for (const c of cams) if (c.em <= t) atual = c.plano;
  return atual;
};

// ---------- capítulos ----------

export type Capitulo = { numero: number; nome: string; de: number; ate: number };
export const capitulos = (plano: Plano): Capitulo[] => {
  const com = plano.momentos.filter((m) => m.capitulo);
  return com.map((m, i) => ({
    numero: i + 1,
    nome: m.capitulo as string,
    de: i === 0 ? 0 : m.de,
    ate: com[i + 1]?.de ?? plano.duracao,
  }));
};

// Um cartão (pergunta/resposta, pauta, comparação) encosta em outro cartão antes ou depois?
const CARTOES = ["pergunta", "resposta", "topicos", "comparacao"];
export const cartoesVizinhos = (plano: Plano, de: number, fim: number) => ({
  antes: plano.momentos.some((o) => CARTOES.includes(o.tipo) && o.de < de - 0.05 && Math.abs(fimDe(o, plano) - de) < 0.35),
  depois: plano.momentos.some((o) => CARTOES.includes(o.tipo) && o.de > de + 0.05 && Math.abs(o.de - fim) < 0.35),
});
