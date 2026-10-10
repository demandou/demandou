// A gramática de layout do Painel, versão deitada (16:9, 1920×1080, o vídeo completo do YouTube).
// A regra da composição é a da aula 9 do curso (editar uma aula horizontal):
// - Tela cheia é a base: a pessoa ocupa o quadro como foi gravada. Os blocos de quadro cheio
//   (abertura, gancho, número, frase, comparação, fechamento…) entram como um cartão grafite na
//   COLUNA LIVRE ao lado da pessoa, na altura do rosto, sem cobrir o rosto. Se a pessoa está no
//   meio e a coluna fica estreita, o vídeo desliza um pouco para o outro lado (e aproxima o mínimo
//   para não sobrar borda, no máximo 15%) enquanto o cartão está na tela.
// - Nos momentos de painel (dados), a pessoa vai para uma MOLDURA do lado DIREITO, com o rosto
//   centralizado nela e acompanhado de leve pelo rastro; o painel ocupa o QUADRO do lado esquerdo:
//   o cabeçalho em cima (rótulo, título ou ficha, contador) e o corpo embaixo (gráfico, barra,
//   cartões). A legenda fica na área segura de baixo.
//
//   [ PAINEL: x 96–1232 (cabeçalho y 100–316, corpo y 352–820, nota 828) | MOLDURA: x 1280–1824, y 100–860 ]
//   [ legenda: y 884, centrada                                                                         ]
//
// Os painéis e os cartões são desenhados numa camada lógica com as medidas do vertical e encolhidos
// pela ESCALA (tema.ts): por isso o PAINEL abaixo está em px lógicos (px do quadro ÷ ESCALA).
import { interpolate } from "remotion";
import { type Caixa, caixaNoTempo, CHEIO_16x9, type EstadoDaCaixa } from "./motor/caixa";
import { ehPainel, type Lado, type Momento, type Plano } from "./plano";
import { ESCALA, LEGENDA_Y, logico, MARGEM, QUADRO } from "./tema";

// A moldura (px do quadro): retrato (cabeça e ombros), sempre do lado direito.
export const JANELA = { w: 544, h: 760, x: QUADRO.w - MARGEM - 544, y: 100, raio: 28, ancoraY: 0.4 };
// o vão entre o painel e a moldura
const VAO_MOLDURA = 48;
// a área do painel, à esquerda da moldura (px do quadro)
export const AREA_DO_PAINEL = { x: MARGEM, direita: JANELA.x - VAO_MOLDURA, topo: JANELA.y, base: JANELA.y + JANELA.h };
// a largura do contador no cabeçalho (px do quadro); o título ou a ficha ficam com o resto
const COLUNA_DO_CONTADOR = 436;

// Geometria do painel em px LÓGICOS (a camada do painel é encolhida pela ESCALA).
export const PAINEL = {
  // cabeçalho: em cima, na largura do painel. O rótulo numa linha; embaixo, o título (ou a
  // ficha) à esquerda e o contador (ou o indicador) à direita.
  cabecalho: {
    x: logico(AREA_DO_PAINEL.x),
    topo: logico(AREA_DO_PAINEL.topo),
    altura: logico(216),
    // largura inteira do cabeçalho
    total: logico(AREA_DO_PAINEL.direita - AREA_DO_PAINEL.x),
    // largura da coluna do contador (e dos indicadores que entram no lugar dele)
    largura: logico(COLUNA_DO_CONTADOR),
    // vão entre o título (ou a ficha) e o contador
    vao: logico(48),
  },
  // corpo: gráfico, barra, cartões. Ocupa o painel entre o cabeçalho e a nota.
  corpo: { esquerda: logico(AREA_DO_PAINEL.x), direita: logico(AREA_DO_PAINEL.direita), topo: logico(352), base: logico(820) },
  nota: logico(828),
};

// a legenda (px do quadro): sempre na mesma faixa, nos dois layouts
export const yDaLegenda = () => LEGENDA_Y;

const TRANSICAO = 0.6;

// Lado da moldura em cada momento de painel. No quadro deitado é sempre a direita (aula 9): o
// campo `janela` do plano é aceito e ignorado.
export const ladosDosPaineis = (momentos: Momento[]) => {
  const lados = new Map<Momento, Lado>();
  for (const m of momentos) if (ehPainel(m)) lados.set(m, "dir");
  return lados;
};

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// a largura do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
export const ROSTO_PADRAO = 0.13;
export const larguraDoRosto = (plano?: Plano) => {
  const l = (plano?.rosto as { rastro?: { largura?: number } } | undefined)?.rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO;
};

export const caixaCheia = (plano: Plano): Caixa => {
  const h = alturaDoVideo(plano);
  // âncoras = o rosto: o zoom parte do rosto e ele não sai do lugar
  return { x: 0, y: 0, w: QUADRO.w, h, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * QUADRO.h) / h, ancoraX: plano.rosto.x };
};

// O enquadramento dentro da moldura pode ser ajustado no plano (`retrato`). Sem ele, sai da largura
// do rosto medida pelo rastreio: o rosto ocupa ~42% da largura da moldura (cabeça e ombros), seja
// a pessoa perto ou longe da câmera. `zoom` 1 = o menor enquadramento que cobre a moldura.
export const retratoAutomatico = (plano?: Plano) => {
  const largura = larguraDoRosto(plano);
  const h = plano ? alturaDoVideo(plano) : QUADRO.h;
  const cobre = Math.max(JANELA.w / QUADRO.w, JANELA.h / h);
  const zoom = Math.min(2.6, Math.max(1, (0.42 * JANELA.w) / (largura * QUADRO.w * cobre)));
  return { zoom, ancoraY: largura > 0.2 ? 0.45 : JANELA.ancoraY };
};

export const caixaDaJanela = (plano?: Plano): Caixa => ({
  x: JANELA.x,
  y: JANELA.y,
  w: JANELA.w,
  h: JANELA.h,
  raio: JANELA.raio,
  zoom: plano?.retrato?.zoom ?? retratoAutomatico(plano).zoom,
  ancoraY: plano?.retrato?.ancoraY ?? retratoAutomatico(plano).ancoraY,
  // o rosto no meio da moldura
  ancoraX: 0.5,
});

// --- a coluna dos cartões de quadro cheio ---
// O cartão fica na coluna livre ao lado da pessoa (o lado com mais espaço; empate = esquerda, como
// o painel), da margem até perto do rosto, com folga para o rosto crescer no zoom lento e no salto
// dos cortes. Coluna estreita (pessoa no meio, perto da câmera): o vídeo desliza para o outro lado,
// aproximando o mínimo para não sobrar borda (até ZOOM_DO_DESLIZE).
export const LARGURA_DO_CARTAO = { min: 660, max: 900, piso: 560 };
const ZOOM_DO_DESLIZE = 1.15;
// o quanto o rosto cresce sozinho no quadro cheio (zoomNoTempo: até 4,5% e o salto de 6% nos cortes)
const CRESCE_SOZINHO = 1.045 * 1.06;
// a base dos cartões: acima da legenda
export const BASE_DOS_CARTOES = LEGENDA_Y - 20;

export type Coluna = {
  // posição e tamanho do cartão no quadro (px do quadro)
  x: number;
  y: number;
  w: number;
  h: number;
  lado: Lado;
  // a caixa do vídeo enquanto o cartão está na tela (igual à cheia quando não precisa deslizar)
  caixa: Caixa;
};

const guardadas = new WeakMap<Plano, Coluna>();
export const colunaDoCartao = (plano: Plano): Coluna => {
  const salva = guardadas.get(plano);
  if (salva) return salva;
  const fx = plano.rosto.x;
  const rostoPx = larguraDoRosto(plano) * QUADRO.w;
  const folga = (z: number) => 0.8 * rostoPx * z * CRESCE_SOZINHO + 40;
  const x0 = fx * QUADRO.w;
  const livreEsq = x0 - folga(1) - MARGEM;
  const livreDir = QUADRO.w - MARGEM - (x0 + folga(1));
  const lado: Lado = livreEsq >= livreDir - 1 ? "esq" : "dir";
  // o deslize: o menor zoom em que o rosto chega aonde a coluna fica com a largura mínima
  let zoom = 1;
  let xRosto = x0;
  const livre = (x: number, z: number) => (lado === "esq" ? x - folga(z) - MARGEM : QUADRO.w - MARGEM - (x + folga(z)));
  if (livre(x0, 1) < LARGURA_DO_CARTAO.min) {
    for (let z = 1.01; z <= ZOOM_DO_DESLIZE + 1e-6; z += 0.01) {
      // até onde o rosto pode ir nesse zoom sem o vídeo descobrir a borda
      const limite = lado === "esq" ? fx * QUADRO.w * z : QUADRO.w - (1 - fx) * QUADRO.w * z;
      const alvo = lado === "esq" ? MARGEM + LARGURA_DO_CARTAO.min + folga(z) : QUADRO.w - MARGEM - LARGURA_DO_CARTAO.min - folga(z);
      zoom = z;
      xRosto = lado === "esq" ? Math.min(alvo, limite) : Math.max(alvo, limite);
      if (lado === "esq" ? limite >= alvo : limite <= alvo) break;
    }
  }
  const w = Math.round(Math.min(LARGURA_DO_CARTAO.max, Math.max(LARGURA_DO_CARTAO.piso, livre(xRosto, zoom))));
  const x = lado === "esq" ? MARGEM : QUADRO.w - MARGEM - w;
  // na altura do rosto: o topo do cartão um pouco acima dos olhos
  const y = Math.round(Math.min(280, Math.max(120, plano.rosto.y * QUADRO.h - 190)));
  const cheia = caixaCheia(plano);
  const coluna: Coluna = { x, y, w, h: BASE_DOS_CARTOES - y, lado, caixa: zoom > 1.001 ? { ...cheia, zoom, ancoraX: xRosto / QUADRO.w } : cheia };
  guardadas.set(plano, coluna);
  return coluna;
};

// A zona que os cartões recebem (px LÓGICOS: o cartão é desenhado na camada encolhida pela ESCALA).
export const zonaDoCartao = (plano: Plano) => {
  const c = colunaDoCartao(plano);
  return { esquerda: 0, direita: 0, topo: 0, altura: c.h / ESCALA, largura: c.w / ESCALA };
};

// Estados da caixa da pessoa ao longo do vídeo.
export const estadosDaCaixa = (plano: Plano, lados: Map<Momento, Lado>): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const comCartao = colunaDoCartao(plano).caixa;
  const estados: EstadoDaCaixa[] = [{ de: -10, caixa: cheia }];
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const painel = lados.has(m);
    // um cartão no começo do vídeo já começa com o vídeo no lugar (vira a capa)
    const de = !painel && m.de <= 0.25 ? -10 : Math.max(0, m.de);
    estados.push({ de, caixa: painel ? caixaDaJanela(plano) : comCartao, dur: TRANSICAO });
    const proximo = ordem[i + 1];
    const emenda = proximo && proximo.de - m.ate < 0.4;
    if (!emenda) estados.push({ de: m.ate, caixa: cheia, dur: TRANSICAO });
  });
  return estados;
};

// Quanto a caixa está "cheia" (1) ou "moldura" (0), para dosar bordas e zoom.
export const cheiura = (caixa: Caixa) =>
  interpolate(caixa.w, [JANELA.w, QUADRO.w], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Movimento contínuo no quadro cheio: aproxima e afasta devagar (até 4,5%), mudando de direção
// na fronteira de cada momento; em cada corte, um salto seco de 6% disfarça o pulo.
export const zoomNoTempo = (t: number, plano: Plano) => {
  const pontos = [
    0,
    plano.duracao,
    ...plano.momentos.flatMap((m) => [m.de, m.ate]),
    ...(plano.cortesEm ?? []),
  ]
    .map((x) => Math.min(plano.duracao, Math.max(0, x)))
    .sort((a, b) => a - b)
    .filter((x, i, a) => i === 0 || x - a[i - 1] > 0.3);
  let direcao = 0;
  let valor = 0;
  for (let i = 0; i < pontos.length - 1; i++) {
    const [a, b] = [pontos[i], pontos[i + 1]];
    const sobe = direcao % 2 === 0;
    if (t < b || i === pontos.length - 2) {
      const p = interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const suave = p * p * (3 - 2 * p);
      valor = sobe ? suave : 1 - suave;
      break;
    }
    direcao++;
  }
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t).length;
  return (1 + 0.045 * valor) * (cortes % 2 === 1 ? 1.06 : 1);
};

export const caixaNoInstante = (t: number, plano: Plano, estados: EstadoDaCaixa[]) => {
  const c = caixaNoTempo(t, estados, CHEIO_16x9);
  const cheia = cheiura(c);
  return { ...c, zoom: (c.zoom ?? 1) * (1 + (zoomNoTempo(t, plano) - 1) * cheia) };
};

// Quando o conteúdo de cada momento começa a entrar, conforme a troca de layout:
// - painel vindo do quadro cheio: entra junto (está por baixo da pessoa, que encolhe revelando-o);
// - painel vindo de outro painel: o corpo entra enquanto o anterior desliza para fora;
// - quadro cheio vindo de um painel: entra enquanto a pessoa cresce por cima do painel que sai;
// - gancho no início do vídeo: o cartão já está montado no primeiro quadro (vira a capa).
export const iniciosDosMomentos = (plano: Plano, lados: Map<Momento, Lado>) => {
  const inicios = new Map<Momento, number>();
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const anterior = ordem[i - 1];
    const vemDePainel = !!anterior && lados.has(anterior) && m.de - anterior.ate < 0.4;
    // painel vindo da tela cheia: monta-se embaixo da pessoa um pouco antes da troca, e ela encolhe
    // revelando um painel já pronto (cabeçalho, grade, cartões "a lápis"); os dados seguem a fala
    if (lados.has(m)) inicios.set(m, m.de + (vemDePainel ? 0.2 : -0.35));
    // tela cheia vindo de um painel: o cartão entra enquanto a pessoa cresce por cima do painel
    else if (vemDePainel) inicios.set(m, m.de + 0.3);
    else if ((m.tipo === "gancho" || m.tipo === "abertura") && m.de <= 0.25) inicios.set(m, -0.6);
    else inicios.set(m, m.de);
  });
  return inicios;
};
