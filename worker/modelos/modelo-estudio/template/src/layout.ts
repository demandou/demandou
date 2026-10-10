// A gramática do Estúdio, em tempo: onde fica o quadro da pessoa em cada momento, qual câmera
// (enquadramento) vale em cada instante e quais são os capítulos. Tudo sai dos momentos do plano.
import { interpolate } from "remotion";
import { indicesDoTrecho, temposDoTexto, troca } from "./anim";
import { diagramarChamada, ehFechamento, PASSO_LINHA } from "./chamada";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Enquadramento, Momento, Plano } from "./plano";
import { FUNDO, H, MARGEM, TOPO, W } from "./tema";

// Os lugares do quadro da pessoa. Cada bloco põe o quadro num deles: é a troca de lugar que dá vida
// ao modelo (o quadro sobe, desce, vira coluna de um lado ou do outro, vira a capa do player).
export type Layout = "palco" | "abertura" | "entrevista" | "trilha" | "numero" | "citacao" | "pauta" | "baixo" | "player";

// duração da troca de lugar do quadro
export const TROCA = 0.55;
// o quadro começa a se mover um pouco antes do momento: o corte que costuma ficar na fronteira
// cai no meio do movimento e some
export const ANTES = 0.15;

const LARGURA = W - 2 * MARGEM;

// Onde fica o quadro da pessoa em cada layout (enquadramento "aberto"); `onda` = altura da faixa da
// onda logo abaixo do quadro. O zoom e o ancoraY dependem da proporção do vídeo de trabalho.
export type Lugar = { caixa: Caixa; onda: number };

export const LUGARES: Record<Layout, Lugar> = {
  // fora dos momentos: o quadro grande, a onda e a legenda embaixo
  palco: { caixa: { x: MARGEM, y: TOPO, w: LARGURA, h: 1040, raio: 30, zoom: 1, ancoraY: 0.34 }, onda: 84 },
  // abertura e destaque: quadro grande, título embaixo
  abertura: { caixa: { x: MARGEM, y: TOPO, w: LARGURA, h: 860, raio: 30, zoom: 1, ancoraY: 0.37 }, onda: 72 },
  // pergunta, resposta e comparação: quadro mais baixo, cartão embaixo (alto o bastante para o close caber)
  entrevista: { caixa: { x: MARGEM, y: TOPO, w: LARGURA, h: 660, raio: 30, zoom: 1, ancoraY: 0.47 }, onda: 62 },
  // trilha: quadro numa coluna à esquerda; número à direita; trilha embaixo
  trilha: { caixa: { x: MARGEM, y: TOPO, w: 480, h: 700, raio: 30, zoom: 1.5, ancoraY: 0.45 }, onda: 58 },
  // número: o espelho da trilha — quadro numa coluna à direita; o número à esquerda; o medidor embaixo
  numero: { caixa: { x: W - MARGEM - 480, y: TOPO, w: 480, h: 760, raio: 30, zoom: 1.5, ancoraY: 0.45 }, onda: 58 },
  // frase (citação) e definição: quadro médio-alto, o texto embaixo
  citacao: { caixa: { x: MARGEM, y: TOPO, w: LARGURA, h: 740, raio: 30, zoom: 1, ancoraY: 0.46 }, onda: 62 },
  // tópicos (a pauta): quadro mais baixo de todos no alto; o cartão da pauta embaixo
  pauta: { caixa: { x: MARGEM, y: TOPO, w: LARGURA, h: 580, raio: 30, zoom: 1, ancoraY: 0.5 }, onda: 56 },
  // passos e gráfico: o quadro desce para o pé da tela e o conteúdo ocupa o alto
  baixo: { caixa: { x: MARGEM, y: FUNDO - 56 - 16 - 600, w: LARGURA, h: 600, raio: 30, zoom: 1, ancoraY: 0.5 }, onda: 56 },
  // player: o quadro vira a capa do episódio, dentro do cartão do player
  player: { caixa: { x: 104, y: 300, w: 872, h: 720, raio: 26, zoom: 1.12, ancoraY: 0.42 }, onda: 54 },
};

// O cartão do player (atrás da capa)
export const CARTAO_PLAYER = { x: 64, y: 260, w: 952, h: 1200, raio: 40 };

// A geometria do player depende da chamada: com 2 ou 3 linhas, a capa e o cartão encolhem para a
// chamada caber embaixo, acima da interface do app.
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

// o lugar de um trecho (o player muda de tamanho com a chamada)
export const lugarDe = (tr: { layout: Layout; momento?: Momento }): Lugar =>
  tr.layout === "player" ? { caixa: geometriaDoPlayer(tr.momento).capa, onda: LUGARES.player.onda } : LUGARES[tr.layout];

// o quadro termina de recuar para o estúdio aqui (os textos da abertura esperam)
export const FIM_DO_RECUO = 0.42;

// Quadro cheio de verdade (só na primeira fração de segundo, antes de o quadro recuar para o estúdio)
export const cheio = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: H, raio: 0, zoom: zoom * (H / Math.max(H, videoAltura)), ancoraY: (plano.rosto.y * H) / videoAltura };
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
    const { caixa, onda } = lugarDe(tr);
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

// Quanto a cabeça ocupa acima e abaixo do centro do rosto, em fração da altura do quadro (1920).
// O padrão serve para a pessoa sentada, do peito para cima, com o rosto em ~35% da largura;
// o plano pode trocar (campo `cabeca`).
export const CABECA = { acima: 0.155, abaixo: 0.125 };
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

// ---------- áreas abaixo do quadro ----------

// vão entre o quadro e a faixa da onda, e entre a onda e o conteúdo de baixo
export const VAO_ONDA = 16;
export const VAO_CONTEUDO = 30;
// onde começa a área de conteúdo embaixo do quadro, num layout (já no lugar)
export const abaixoDoQuadro = (layout: Layout) => {
  const { caixa, onda } = LUGARES[layout];
  return caixa.y + caixa.h + VAO_ONDA + onda + VAO_CONTEUDO;
};
// onde termina a área de conteúdo em cima do quadro (layout "baixo": o quadro no pé da tela)
export const acimaDoQuadro = (layout: Layout) => LUGARES[layout].caixa.y - VAO_CONTEUDO;

// Um cartão (pergunta/resposta, pauta, comparação) encosta em outro cartão antes ou depois?
const CARTOES = ["pergunta", "resposta", "topicos", "comparacao"];
export const cartoesVizinhos = (plano: Plano, de: number, fim: number) => ({
  antes: plano.momentos.some((o) => CARTOES.includes(o.tipo) && o.de < de - 0.05 && Math.abs(fimDe(o, plano) - de) < 0.35),
  depois: plano.momentos.some((o) => CARTOES.includes(o.tipo) && o.de > de + 0.05 && Math.abs(o.de - fim) < 0.35),
});
