// Gramática de layout do modelo Espelho: a tela se divide na HORIZONTAL por um fio dourado, a
// linha do espelho. Em cima ficam o desenho e os textos; embaixo, a pessoa, numa moldura larga
// ancorada na base do quadro, com a cabeça inteira e espaço para se mexer. A linha sobe e desce
// conforme o momento (como a linha de um reflexo), e a pessoa vai junto.
//
// "cheio"      pessoa em tela cheia, sem linha (só entre momentos com respiro)
// "manchete"   linha alta: o título na faixa de cima, a pessoa embaixo, grande
// "mapaEsq"    linha no meio: rosto desenhado à esquerda na faixa de cima, textos à direita
// "mapaDir"    o mesmo, com o desenho à direita
// "comparacao" linha no meio, que vira a régua do tempo; os dois lados em duas linhas, em cima
// "fechamento" assinatura e chamada na faixa de cima, a pessoa embaixo
// "texto"      abertura, frase, pergunta, destaque, definição e número: o texto centrado em cima e
//              a linha descendo só o necessário (como a manchete)
// "painel"     tópicos, passos, comparação de lados e gráfico: o conteúdo na largura toda e a
//              linha entre 640 e 880 px conforme a quantidade de coisas
//
// Regras da moldura de baixo (valem para qualquer gravação):
// - a moldura ocupa a largura toda, do fio até a base do quadro;
// - o alto da cabeça fica `margem` px abaixo do fio (padrão 80) e o queixo nunca passa de y 1500,
//   mesmo no pulo de zoom dos cortes;
// - se a cabeça é grande demais para isso (gravação muito fechada), a linha fica no mínimo do
//   layout e a moldura estreita (vira uma janela larga, centrada, com a cabeça inteira).
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

// blocos de texto centrado (a linha desce só o necessário)
export const ehTexto = (m: Momento) => ["manchete", "abertura", "frase", "pergunta", "destaque", "definicao", "numero"].includes(m.tipo);

// o queixo da pessoa nunca desce além disto (abaixo vem a interface do app)
export const QUEIXO_MAX = 1500;
// pulo de zoom nos cortes (troca seca, disfarça o pulo da imagem)
export const PULO = 1.05;
// altura da linha nos layouts com desenho: a ideal (o máximo) e a mínima (abaixo disso a faixa de
// cima não comporta o desenho e os textos; a moldura estreita em vez de a linha subir)
export const LINHA_PAINEL = 880;
export const LINHA_MIN_PAINEL = 790;

const alturaDoVideo = (plano: Plano) => Math.min(1920, plano.videoAltura ?? 1920);

// Cabeça da pessoa no vídeo de trabalho (px, com o vídeo na largura 1080): alto do cabelo, centro
// do rosto e queixo. O queixo vem do plano (`caixas.pessoa.queixo`) ou da zona do motor (que
// começa ~170 px abaixo dele); do centro do rosto até o alto do cabelo vai ~1,4 × a distância do
// centro ao queixo.
export const cabeca = (plano: Plano) => {
  const centro = plano.rosto.y * 1920;
  const estimado = plano.caixas?.pessoa?.queixo ?? (plano.zona ? plano.zona.topo - 170 : centro + 230);
  const queixo = Math.max(centro + 110, estimado);
  // o cabelo não passa do alto da gravação (em close, a estimativa passaria e encolheria a pessoa à toa)
  const topo = Math.max(30, centro - 1.4 * (queixo - centro));
  return { topo, centro, queixo, altura: queixo - topo };
};

// a margem acima da cabeça nunca é maior que a imagem que existe acima dela (em gravação de selfie
// o cabelo encosta no alto do vídeo: não há fundo para mostrar ali)
export const margemDaCabeca = (plano: Plano) => Math.min(plano.caixas?.pessoa?.margem ?? 80, Math.max(0, cabeca(plano).topo));

// Zoom da moldura de baixo: 1 (a gravação inteira na largura) para cabeças normais; aproxima um
// pouco (até 1,35) quando a pessoa está longe da câmera e a cabeça fica pequena.
export const zoomDaPessoa = (plano: Plano) => {
  const pedido = plano.caixas?.pessoa?.zoom;
  if (pedido !== undefined) return Math.max(1, pedido);
  return Math.min(1.35, Math.max(1, 500 / cabeca(plano).altura));
};

// Escala do vídeo para a cabeça caber entre a linha (mais a margem) e o queixo máximo,
// contando o pulo de zoom dos cortes (o centro do rosto fica parado; a cabeça cresce em volta)
const escalaQueCabe = (linha: number, plano: Plano) => {
  const { topo, centro, queixo } = cabeca(plano);
  return (QUEIXO_MAX - linha - margemDaCabeca(plano)) / (centro - topo + (queixo - centro) * PULO);
};

// A linha mais baixa possível com a pessoa em largura total
export const linhaMaxima = (plano: Plano) => {
  const { topo, centro, queixo } = cabeca(plano);
  const esc = zoomDaPessoa(plano);
  return Math.floor(QUEIXO_MAX - margemDaCabeca(plano) - esc * (centro - topo + (queixo - centro) * PULO));
};

// Até onde a linha pode descer em cada componente com a pessoa em largura total (a manchete mede o
// corpo do título por ela). Se os textos pedem mais que isso, a linha desce mesmo assim e a moldura
// da pessoa estreita para a cabeça caber.
// (blocos de texto: até 700 px mesmo em gravação muito fechada, para o texto não ficar miúdo; aí a
// moldura da pessoa estreita um pouco)
export const linhaMaximaPara = (m: Momento, plano: Plano) =>
  Math.max(linhaMaxima(plano), m.tipo === "manchete" ? 480 : ehTexto(m) ? 700 : LINHA_MIN_PAINEL);

// Altura da linha do espelho em cada momento
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

// Caixa da pessoa embaixo de uma linha em `linha` px
export const caixaDaPessoa = (linha: number, plano: Plano): Caixa => {
  const H0 = alturaDoVideo(plano);
  const { topo, centro } = cabeca(plano);
  const margem = margemDaCabeca(plano);
  let h = 1920 - linha;
  let w = 1080;
  // escala mínima em largura total (o vídeo precisa cobrir a moldura inteira)
  const minimaCheia = Math.max(1, h / H0);
  const cabe = escalaQueCabe(linha, plano);
  let esc = Math.max(minimaCheia, Math.min(minimaCheia * zoomDaPessoa(plano), cabe));
  if (cabe < 1) {
    // cabeça grande demais para a largura toda: a moldura estreita até a cabeça caber
    esc = Math.max(0.6, cabe);
    w = Math.round(1080 * esc);
    // vídeo curto para a altura toda: a moldura termina onde o vídeo termina
    h = Math.min(h, Math.floor(H0 * esc));
  }
  const cobre = Math.max(w / 1080, h / H0);
  return {
    x: (1080 - w) / 2,
    y: linha,
    w,
    h,
    raio: 0,
    zoom: esc / cobre,
    // o alto da cabeça fica `margem` px abaixo da linha
    ancoraY: (margem + (centro - topo) * esc) / h,
  };
};

// Tela cheia: a gravação cobre o quadro inteiro (num recorte 3:4, aproxima o que falta para cobrir)
const caixaDoCheio = (plano: Plano, zoom: number): Caixa => {
  const H0 = alturaDoVideo(plano);
  return {
    x: 0,
    y: 0,
    w: 1080,
    h: 1920,
    raio: 0,
    zoom: plano.caixas?.cheio?.zoom ?? zoom,
    ancoraY: plano.caixas?.cheio?.ancoraY ?? (plano.rosto.y * 1920) / H0,
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
// Mesma conta do VideoNaCaixa; serve para as guias e para conferir.
export const pessoaNaCaixa = (c: Caixa, plano: Plano) => {
  const H0 = alturaDoVideo(plano);
  const { topo, centro, queixo } = cabeca(plano);
  const esc = Math.max(c.w / 1080, c.h / H0) * (c.zoom ?? 1);
  const av = H0 * esc;
  const y0 = Math.min(0, Math.max(c.h - av, c.h * (c.ancoraY ?? 0.3) - centro * esc));
  return { topo: c.y + y0 + topo * esc, centro: c.y + y0 + centro * esc, queixo: c.y + y0 + queixo * esc };
};
