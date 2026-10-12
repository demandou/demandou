// Gramática de layout do modelo Espelho, VERSÃO DEITADA (16:9, 1920×1080, o vídeo longo do
// YouTube). No vertical, um fio dourado divide a tela na horizontal: a página em cima, a pessoa
// embaixo. No deitado vale a regra da aula 9 do curso (editar uma aula horizontal): a pessoa em
// TELA CHEIA como base e, quando um bloco pede apoio visual, ela vai para uma MOLDURA do lado
// direito, com o rosto centralizado e acompanhado (rosto.rastro), e o bloco ocupa o QUADRO do lado
// esquerdo. A linha do espelho fica de pé: é a borda esquerda da moldura, um fio dourado de cima a
// baixo. Ela anda para a esquerda ou para a direita conforme o momento (como a linha do reflexo
// que subia e descia no vertical), e a pessoa vai junto.
//
// "cheio"      pessoa em tela cheia, sem linha (só entre momentos com respiro)
// "manchete"   página curta: a linha mais à esquerda, a moldura da pessoa larga
// "mapaEsq"    a figura desenhada à esquerda na página, os textos à direita
// "mapaDir"    o mesmo, com o desenho à direita
// "comparacao" a régua do tempo na base da página; os dois lados em duas linhas
// "fechamento" assinatura e chamada na página, a pessoa na moldura
// "texto"      abertura, frase, pergunta, destaque, definição e número: o texto centrado na página
// "painel"     tópicos, passos, comparação de lados e gráfico: o conteúdo na largura toda da página
//
// A página de cada bloco é a mesma do vertical (1080 px de largura, faixa de x 90 a 990, a altura
// medida pelas geometrias em blocos.ts e geometria.ts, com o texto medido de verdade). O que muda
// é onde ela fica: centrada na largura do quadro da esquerda e na altura do quadro (paginaNoQuadro).
// A "linha" de cada momento continua sendo a base da página (a altura que ela ocupa): ela decide
// onde fica a linha do espelho de pé (xDaLinha).
//
// Regras da moldura da direita (valem para qualquer gravação):
// - a moldura vai do alto à base do quadro, da linha do espelho até a borda direita;
// - o rosto fica no centro da moldura na horizontal e acompanha a pessoa (o rastro do motor);
// - com a cabeça pequena (pessoa longe da câmera), a moldura aproxima um pouco (até 1,3×).
import {
  geometriaDaComparacaoUniversal,
  geometriaDaDefinicao,
  geometriaDaFrase,
  geometriaDaLista,
  geometriaDaPergunta,
  geometriaDoDestaque,
  geometriaDoGrafico,
  geometriaDoNumero,
} from "./blocos";
import { comoManchete, ehRegua, geometriaDaManchete, geometriaDoFechamento } from "./geometria";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { FOLGA_DA_LINHA, QUADRO, TOPO_SEGURO } from "./tema";

export type Layout = "cheio" | "manchete" | "mapaEsq" | "mapaDir" | "comparacao" | "fechamento" | "texto" | "painel";

export const layoutDe = (m: Momento): Layout => {
  switch (m.tipo) {
    case "manchete":
    case "abertura":
      return "manchete";
    case "mapa":
      return m.lado === "direita" ? "mapaDir" : "mapaEsq";
    case "comparacao":
      return ehRegua(m) ? "comparacao" : "painel";
    case "cta":
      return "fechamento";
    case "frase":
    case "pergunta":
    case "destaque":
    case "definicao":
    case "numero":
      return "texto";
    case "topicos":
    case "passos":
    case "grafico":
      return "painel";
  }
};

// blocos de texto centrado (a página só com a altura necessária)
export const ehTexto = (m: Momento) => ["manchete", "abertura", "frase", "pergunta", "destaque", "definicao", "numero"].includes(m.tipo);

// pulo de zoom nos cortes (troca seca, disfarça o pulo da imagem)
export const PULO = 1.05;
// base da página nos layouts com desenho: a ideal (o máximo) e a mínima
export const LINHA_PAINEL = 880;
export const LINHA_MIN_PAINEL = 790;
// No deitado a pessoa fica ao lado da página, não embaixo: ela não limita a altura da página. A
// base da página vai até aqui (faixa de até 760 px, centrada na altura do quadro de 1080). Os
// painéis continuam presos aos limites deles (LINHA_PAINEL_MAX, em blocos.ts).
export const LINHA_MAXIMA = 968;
export const linhaMaximaPara = (_m: Momento, _plano: Plano) => LINHA_MAXIMA;

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// Altura da base da página em cada momento
export const linhaDe = (m: Momento, plano: Plano): number => {
  const maxima = linhaMaximaPara(m, plano);
  switch (m.tipo) {
    case "manchete":
      return geometriaDaManchete(m, maxima).linha;
    case "abertura":
      return geometriaDaManchete(comoManchete(m), maxima).linha;
    case "cta":
      return geometriaDoFechamento(m, plano).linha;
    case "frase":
      return geometriaDaFrase(m, maxima).linha;
    case "pergunta":
      return geometriaDaPergunta(m, maxima).linha;
    case "destaque":
      return geometriaDoDestaque(m, maxima).linha;
    case "definicao":
      return geometriaDaDefinicao(m, maxima).linha;
    case "numero":
      return geometriaDoNumero(m, maxima).linha;
    case "topicos":
    case "passos":
      return geometriaDaLista(m, maxima).linha;
    case "grafico":
      return geometriaDoGrafico(m, maxima).linha;
    case "comparacao":
      return ehRegua(m) ? Math.min(LINHA_PAINEL, maxima) : geometriaDaComparacaoUniversal(m, maxima).linha;
    default:
      return Math.min(LINHA_PAINEL, maxima);
  }
};

// ---------------------------------------------------------------- a linha do espelho de pé
// x da linha (a borda esquerda da moldura da pessoa). Página curta (capa: abertura, frase,
// destaque) deixa a linha mais à esquerda e a moldura larga; página alta (matéria: lista, passos,
// gráfico, mapa) empurra a linha para a direita. É o mesmo movimento do vertical, onde a linha
// descia só o necessário: entre duas ideias a linha desliza e a pessoa vai junto.
export const X_LINHA_MIN = 1040;
export const X_LINHA_MAX = 1160;
export const xDaLinha = (linha: number) => Math.round(Math.min(X_LINHA_MAX, Math.max(X_LINHA_MIN, X_LINHA_MIN + (linha - 430) * 0.2)));

// Onde a página (1080 px de largura, a mesma do vertical) entra no quadro: centrada na largura do
// quadro da esquerda (de 0 até a linha) e na altura do quadro (um pouco acima do meio, longe dos
// controles do player). Devolve o deslocamento da página em px.
export const CENTRO_DA_PAGINA = 530;
export const paginaNoQuadro = (linha: number) => {
  const altura = linha - FOLGA_DA_LINHA - TOPO_SEGURO;
  // nunca acima de y 56 no quadro (uma página alta demais encosta no alto, sem sair dele)
  const y = Math.max(56 - TOPO_SEGURO, CENTRO_DA_PAGINA - TOPO_SEGURO - altura / 2);
  return { x: Math.round(xDaLinha(linha) / 2 - 540), y: Math.round(y) };
};

// Cabeça da pessoa no vídeo de trabalho (px no quadro 1920×1080): alto do cabelo, centro do rosto
// e queixo. O queixo vem do plano (`caixas.pessoa.queixo`) ou da zona do cortar.mjs deitado (que
// começa ~60 px abaixo dele); do centro do rosto até o alto do cabelo vai ~1,4 × a distância do
// centro ao queixo.
export const cabeca = (plano: Plano) => {
  const centro = plano.rosto.y * QUADRO.h;
  const estimado = plano.caixas?.pessoa?.queixo ?? (plano.zona ? plano.zona.topo - 60 : centro + 130);
  const queixo = Math.max(centro + 50, estimado);
  const topo = Math.max(0, centro - 1.4 * (queixo - centro));
  return { topo, centro, queixo, altura: queixo - topo };
};

// a margem acima da cabeça (px) quando a moldura aproxima
export const margemDaCabeca = (plano: Plano) => Math.min(plano.caixas?.pessoa?.margem ?? 60, Math.max(0, cabeca(plano).topo));

// Zoom da moldura: 1 (a gravação na altura toda do quadro) para cabeças normais; aproxima um pouco
// (até 1,3) quando a pessoa está longe da câmera e a cabeça fica pequena.
export const zoomDaPessoa = (plano: Plano) => {
  const pedido = plano.caixas?.pessoa?.zoom;
  if (pedido !== undefined) return Math.max(1, pedido);
  return Math.min(1.3, Math.max(1, 380 / cabeca(plano).altura));
};

// Caixa da pessoa na moldura da direita, com a linha do espelho de pé em xDaLinha(linha)
export const caixaDaPessoa = (linha: number, plano: Plano): Caixa => {
  const H0 = alturaDoVideo(plano);
  const x = xDaLinha(linha);
  const w = QUADRO.w - x;
  const h = QUADRO.h;
  const zoom = zoomDaPessoa(plano);
  const escala = Math.max(w / QUADRO.w, h / H0) * zoom;
  const { topo, centro } = cabeca(plano);
  // aproximando, o rosto fica a ~40% da altura da moldura, sem cortar o alto da cabeça
  const ancoraY = Math.min(0.5, Math.max(0.36, (margemDaCabeca(plano) + (centro - topo) * escala) / h));
  return { x, y: 0, w, h, raio: 0, zoom, ancoraY: zoom > 1.001 ? ancoraY : (plano.rosto.y * QUADRO.h) / H0 };
};

// Tela cheia: a gravação cobre o quadro inteiro
const caixaDoCheio = (plano: Plano, zoom: number): Caixa => {
  const H0 = alturaDoVideo(plano);
  return {
    x: 0,
    y: 0,
    w: QUADRO.w,
    h: QUADRO.h,
    raio: 0,
    zoom: plano.caixas?.cheio?.zoom ?? zoom,
    ancoraY: plano.caixas?.cheio?.ancoraY ?? (plano.rosto.y * QUADRO.h) / H0,
  };
};

// Trechos do vídeo: um por momento; entre momentos com respiro (> 0,3 s), tela cheia
export type Trecho = { de: number; layout: Layout; m?: Momento; linha: number };
export const trechosDoPlano = (plano: Plano): Trecho[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const trechos: Trecho[] = [{ de: 0, layout: "cheio", linha: 0 }];
  const empurrar = (de: number, layout: Layout, m?: Momento) => {
    const linha = m ? linhaDe(m, plano) : 0;
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) Object.assign(ultimo, { layout, m, linha });
    else if (!(layout === "cheio" && ultimo.layout === "cheio")) trechos.push({ de, layout, m, linha });
  };
  momentos.forEach((m, i) => {
    empurrar(Math.max(0, m.de), layoutDe(m), m);
    const prox = momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) {
      if (!(m.tipo === "cta" && !prox)) empurrar(m.ate, "cheio");
    }
  });
  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of trechos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }
  return trechos;
};

// Sequência de estados da caixa ao longo do vídeo. Cada troca de layout leva TROCA s, com a mesma
// curva. Dentro de um trecho, nos cortes, o zoom alterna (1 ↔ PULO) com troca seca.
export const TROCA = 0.72;
export const estadosDaCaixa = (plano: Plano): EstadoDaCaixa[] => {
  const trechos = trechosDoPlano(plano);
  const cortes = plano.cortesEm ?? [];
  const estados: EstadoDaCaixa[] = [];
  let anterior: Trecho | null = null;
  let pulo = false;
  trechos.forEach((tr, i) => {
    const fim = trechos[i + 1]?.de ?? plano.duracao + 1;
    const caixa = (comPulo: boolean): Caixa => {
      if (tr.layout === "cheio") return caixaDoCheio(plano, comPulo ? 1.06 : 1);
      const c = caixaDaPessoa(tr.linha, plano);
      return comPulo ? { ...c, zoom: (c.zoom ?? 1) * PULO } : c;
    };
    // tela cheia depois de outro trecho alterna o zoom; os outros layouts entram sem pulo
    if (tr.layout === "cheio") pulo = anterior ? !pulo : false;
    else pulo = false;
    const viaja = anterior !== null && (anterior.layout !== tr.layout || anterior.linha !== tr.linha);
    estados.push({ de: tr.de, caixa: caixa(pulo), dur: viaja ? TROCA : 0.001 });
    let ultimo = tr.de;
    for (const c of cortes) {
      if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
      pulo = !pulo;
      estados.push({ de: c, caixa: caixa(pulo), dur: 0.001 });
      ultimo = c;
    }
    anterior = tr;
  });
  return estados;
};

// Onde a pessoa está na tela numa caixa (px): alto da cabeça, centro do rosto e queixo.
// Mesma conta do VideoNaCaixa (sem o rastro); serve para as guias.
export const pessoaNaCaixa = (c: Caixa, plano: Plano) => {
  const H0 = alturaDoVideo(plano);
  const { topo, centro, queixo } = cabeca(plano);
  const esc = Math.max(c.w / QUADRO.w, c.h / H0) * (c.zoom ?? 1);
  const av = H0 * esc;
  const y0 = Math.min(0, Math.max(c.h - av, c.h * (c.ancoraY ?? 0.3) - centro * esc));
  return { topo: c.y + y0 + topo * esc, centro: c.y + y0 + centro * esc, queixo: c.y + y0 + queixo * esc };
};
