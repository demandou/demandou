// A gramática do Cifra, em tempo: onde a pessoa fica em cada momento, quando a janela troca de
// lugar, e as batidas (acordes ditos, metrônomo, setas) que fazem a janela pulsar.
//
// VERSÃO DEITADA (16:9, 1920×1080), pela aula 9 do curso (editar uma aula horizontal): a pessoa em
// tela cheia é a base; nos blocos que pedem apoio visual ela vai para uma MOLDURA do lado DIREITO,
// com o rosto centralizado nela e acompanhado com suavidade (o `rosto.rastro`), e a arte ocupa o
// QUADRO do lado ESQUERDO, na altura toda. As quatro janelas do vertical continuam existindo (o
// plano e os padrões de cada bloco não mudam), agora como quatro molduras da direita: a pessoa
// ainda troca de lugar entre um bloco e outro (sobe, desce, aproxima), sem nunca sair do lado direito.
import type { Area } from "./componentes/Cena";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Compasso, Janela, Momento, Plano } from "./plano";
import {
  ALTURA_MINIMA_CARTAO,
  BASE_ARTE,
  BASE_CARTAO,
  H,
  LARGURA_CARTAO,
  LEGENDA_Y,
  MARGEM,
  RAIO,
  TOPO,
  W,
} from "./tema";

// duração da troca de lugar da janela
export const TROCA = 0.55;

// vão entre o quadro (a arte) e a moldura (a pessoa)
const VAO_QUADRO = 48;

// As molduras da pessoa (px, 1920×1080), todas encostadas na margem direita. O rosto fica centrado
// na horizontal de cada uma. O `zoom` daqui vale para um rosto do tamanho padrão do 16:9 (13% da
// largura do quadro); `janelasDo(plano)` recalcula com o rosto medido na gravação.
export const JANELAS: Record<Exclude<Janela, "cheio">, Caixa> = {
  // larga, em cima (rosto e ombros, a sala ao fundo); os diagramas, o número e os lados à esquerda
  topo: { x: W - MARGEM - 652, y: TOPO, w: 652, h: 560, raio: RAIO, zoom: 1.71, ancoraY: 0.42 },
  // estreita, no canto de cima: o metrônomo fica na coluna ao lado dela, os compassos à esquerda
  canto: { x: W - MARGEM - 440, y: TOPO, w: 440, h: 540, raio: RAIO, zoom: 1.62, ancoraY: 0.43 },
  // no meio da altura: as setas da batida e o gráfico à esquerda
  centro: { x: W - MARGEM - 652, y: 222, w: 652, h: 600, raio: RAIO, zoom: 1.88, ancoraY: 0.46 },
  // embaixo: a folha de cifra fica à esquerda, de pé na estante
  estante: { x: W - MARGEM - 652, y: 348, w: 652, h: 520, raio: RAIO, zoom: 2.17, ancoraY: 0.47 },
};

// quanto da largura da moldura o rosto ocupa em cada lugar (o canto, estreito, mostra o rosto mais perto)
const ROSTO_NA_MOLDURA: Record<Exclude<Janela, "cheio">, number> = { topo: 0.34, canto: 0.46, centro: 0.4, estante: 0.4 };

// a largura do rosto na gravação (fração da largura do quadro): a do rastro do cortar.mjs, ou a de
// uma gravação deitada comum (~13%, uns 250 px)
export const larguraDoRosto = (plano: Plano) => {
  const l = plano.rosto.rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

// As molduras com o zoom que deixa o rosto do tamanho certo nesta gravação (entre 1 e 3).
export const janelasDo = (plano: Plano): Record<Exclude<Janela, "cheio">, Caixa> => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const rosto = larguraDoRosto(plano) * W;
  const saida = { ...JANELAS };
  for (const nome of Object.keys(JANELAS) as Exclude<Janela, "cheio">[]) {
    const c = JANELAS[nome];
    // escala do vídeo com zoom 1 (o menor enquadramento que cobre a moldura) e a que o rosto pede
    const cobre = Math.max(c.w / W, c.h / videoAltura);
    const pede = (ROSTO_NA_MOLDURA[nome] * c.w) / rosto;
    saida[nome] = { ...c, zoom: Math.min(3, Math.max(1, pede / cobre)) };
  }
  return saida;
};

// A zona do quadro cheio, com o centro do rosto na horizontal (o cartão fica no peito, sob o rosto)
export type Zona = { topo: number; altura: number; centroX?: number };

// O QUADRO: o lado esquerdo, da margem até a moldura, na altura toda
const quadroAte = (xMoldura: number): Area => ({ x: MARGEM, y: TOPO, w: xMoldura - VAO_QUADRO - MARGEM, h: BASE_ARTE - TOPO });

// a coluna do metrônomo, entre os compassos e a moldura do canto (o metrônomo fica ao lado da pessoa)
const LARGURA_LADO = 360;
const xDoLado = JANELAS.canto.x - 40 - LARGURA_LADO;

// Onde fica a arte de cada momento, conforme o lugar da pessoa (px, 1920×1080)
export const areaDe = (j: Janela, zona: Zona): Area => {
  switch (j) {
    case "topo":
    case "centro":
    case "estante":
      return quadroAte(JANELAS[j].x);
    case "canto":
      // os compassos à esquerda; a coluna do metrônomo fica entre eles e a moldura
      return { x: MARGEM, y: TOPO, w: xDoLado - 40 - MARGEM, h: BASE_ARTE - TOPO };
    default: {
      // quadro cheio: o cartão de palco no peito, abaixo do queixo e centrado no rosto
      const cx = zona.centroX ?? W / 2;
      const x = Math.round(Math.min(W - MARGEM - LARGURA_CARTAO, Math.max(MARGEM, cx - LARGURA_CARTAO / 2)));
      const base = Math.min(zona.topo + zona.altura, BASE_CARTAO);
      const topo = Math.min(zona.topo, base - ALTURA_MINIMA_CARTAO);
      return { x, y: topo, w: LARGURA_CARTAO, h: base - topo };
    }
  }
};

// A coluna livre ao lado da moldura do canto (onde fica o metrônomo grande)
export const ladoDe = (j: Janela): Area | null => (j === "canto" ? { x: xDoLado, y: TOPO, w: LARGURA_LADO, h: BASE_ARTE - TOPO } : null);

// Onde a legenda fica (topo da linha, px): no quadro deitado, sempre no terço de baixo, abaixo das
// molduras e acima dos controles do player
export const legendaYDe = (_j: Janela, _zona: Zona) => LEGENDA_Y;

export const janelaPadrao: Record<Momento["tipo"], Janela> = {
  // quadro cheio: cartão de palco no peito
  abertura: "cheio",
  destaque: "cheio",
  frase: "cheio",
  pergunta: "cheio",
  cta: "cheio",
  // moldura larga em cima, à direita: a arte no quadro à esquerda
  acordes: "topo",
  numero: "topo",
  comparacao: "topo",
  // moldura no meio da altura, à direita: setas e cordas no quadro à esquerda
  batida: "centro",
  grafico: "centro",
  // moldura estreita no canto de cima: metrônomo ao lado dela, compassos à esquerda
  compasso: "canto",
  passos: "canto",
  // moldura embaixo, à direita: a folha de cifra no quadro à esquerda
  cifra: "estante",
  topicos: "estante",
  definicao: "estante",
};

// A pergunta com 3 ou 4 opções não cabe no cartão do peito: a pessoa vai para a moldura do meio e a
// pergunta ganha o quadro à esquerda.
export const janelaDe = (m: Momento): Janela =>
  m.janela ?? (m.tipo === "pergunta" && (m.opcoes?.length ?? 0) >= 3 ? "centro" : janelaPadrao[m.tipo]);

// Um momento nunca invade o seguinte.
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

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
export const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Quadro cheio: o vídeo deitado inteiro, como foi gravado (sem recorte vertical). O zoom 1 já cobre o
// quadro; com o rastro, a câmera só faz reenquadramentos suaves em volta do rosto.
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom: 1, ancoraX: plano.rosto.x, ancoraY: (plano.rosto.y * H) / videoAltura };
};

const caixaDe = (j: Janela, plano: Plano): Caixa => (j === "cheio" ? caixaCheia(plano) : janelasDo(plano)[j]);

// Se dois momentos ficam a mais de 1 s um do outro, a pessoa volta ao quadro cheio entre eles.
const VOLTA_AO_CHEIO = 1;

type Trecho = { de: number; janela: Janela };

// A sequência de lugares da pessoa ao longo do vídeo
export const trechos = (plano: Plano): Trecho[] => {
  const lista: Trecho[] = [{ de: 0, janela: "cheio" }];
  plano.momentos.forEach((m, i) => {
    const proximo = plano.momentos[i + 1];
    lista.push({ de: Math.max(0, m.de), janela: janelaDe(m) });
    const fim = fimDe(m, plano);
    if (fim < plano.duracao && (!proximo || proximo.de - fim > VOLTA_AO_CHEIO)) lista.push({ de: fim, janela: "cheio" });
  });
  // tira repetidos seguidos (a janela não "troca" para o mesmo lugar)
  return lista.filter((x, i) => i === 0 || x.janela !== lista[i - 1].janela || x.de === 0);
};

// Estados da caixa da pessoa. Um corte longe de uma troca ganha uma troca seca de enquadramento
// (zoom 1 ↔ 1,06) para disfarçar o pulo.
export const estadosDaPessoa = (plano: Plano): EstadoDaCaixa[] => {
  const lista = trechos(plano);
  const estados: EstadoDaCaixa[] = lista.map((x, i) => ({ de: x.de, caixa: caixaDe(x.janela, plano), dur: i === 0 ? 0.001 : TROCA }));
  const perto = (c: number) => lista.some((x) => x.de > 0 && c > x.de - 0.6 && c < x.de + TROCA + 0.3);
  for (const c of plano.cortesEm ?? []) {
    if (perto(c)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    if (!antes) continue;
    const base = lista.filter((x) => x.de <= c).pop();
    const original = caixaDe(base?.janela ?? "cheio", plano);
    const aproximado = (antes.caixa.zoom ?? 1) > (original.zoom ?? 1) + 0.001;
    estados.push({ de: c, caixa: { ...antes.caixa, zoom: (original.zoom ?? 1) * (aproximado ? 1 : 1.06) }, dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// 0 = quadro cheio, 1 = numa janela (com a mesma curva da troca), para a moldura e o fundo
export const naJanela = (t: number, plano: Plano) => {
  const lista = trechos(plano);
  let v = 0;
  for (const x of lista) {
    if (x.de > t) break;
    const alvo = x.janela === "cheio" ? 0 : 1;
    const p = Math.min(1, Math.max(0, (t - x.de) / TROCA));
    const curva = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
    v = v + (alvo - v) * (x.de === 0 ? 1 : curva);
  }
  return v;
};

// Janela em que a pessoa está num instante (a do último trecho que começou)
export const janelaNoTempo = (t: number, plano: Plano): Janela => trechos(plano).filter((x) => x.de <= t).pop()?.janela ?? "cheio";

// ---------------------------------------------------------------------------------------------
// Metrônomo: as batidas de um momento `compasso`, a partir de cada andamento. Sem andamentos, o pêndulo
// bate a cada 1 s desde `tocarEm` (ou o `de`); andamento sem `periodo`: 1 s no primeiro e a metade a cada novo.
export const andamentosDe = (m: Compasso) => {
  const lista = [...(m.andamentos ?? [])].sort((a, b) => a.em - b.em);
  if (!lista.length) return [{ em: m.tocarEm ?? m.de + 0.3, texto: "", periodo: 1 }];
  let anterior = 2;
  return lista.map((a) => {
    const periodo = a.periodo ?? Math.max(0.45, anterior / 2);
    anterior = periodo;
    return { em: a.em, texto: a.texto, periodo };
  });
};

export const batidasDoCompasso = (m: Compasso, fim: number) => {
  const andamentos = andamentosDe(m);
  const lista: { em: number; andamento: number }[] = [];
  andamentos.forEach((a, i) => {
    const ate = Math.min(fim, andamentos[i + 1]?.em ?? fim);
    const periodo = Math.max(0.25, a.periodo);
    // a última batida antes de um novo andamento sai se ficaria colada nele
    const folga = andamentos[i + 1] ? Math.min(0.35, periodo * 0.5) : 0.05;
    for (let t = a.em; t < ate - folga; t += periodo) lista.push({ em: t, andamento: i });
  });
  return lista;
};

// O texto e o instante de cada compasso (uma cifra solta não tem instante: já está na tela)
export const textoDoCompasso = (c: Compasso["compassos"][number]) => (typeof c === "string" ? c : c.texto);
export const emDoCompasso = (c: Compasso["compassos"][number]) => (typeof c === "string" ? undefined : c.em);

// Compasso em curso: conta as batidas desde `tocarEm`; −1 antes de começar
export const compassoEmCurso = (t: number, m: Compasso, batidas: { em: number }[], n = Math.min(4, m.compassos.length)) => {
  const inicio = m.tocarEm ?? andamentosDe(m)[0]?.em ?? m.de;
  const dadas = batidas.filter((b) => b.em >= inicio - 0.02 && b.em <= t);
  if (dadas.length === 0) return { indice: -1, desde: 0 };
  return { indice: (dadas.length - 1) % Math.max(1, n), desde: dadas[dadas.length - 1].em };
};

// Todas as batidas que fazem a janela pulsar: cada acorde dito, cada batida do metrônomo, cada seta
// da batida, cada marca que acende na folha e cada item, lado, dado ou número que entra.
export const pulsosDaJanela = (plano: Plano) => {
  const lista: { em: number; forca: number }[] = [];
  for (const m of plano.momentos) {
    const fim = fimDe(m, plano);
    if (m.tipo === "acordes") m.acordes.forEach((a) => lista.push({ em: a.em, forca: 1 }));
    if (m.tipo === "compasso") batidasDoCompasso(m, fim).forEach((b) => lista.push({ em: b.em, forca: 0.75 }));
    if (m.tipo === "batida") m.setas.forEach((s) => lista.push({ em: s.em, forca: 1 }));
    if (m.tipo === "cifra") m.linhas.flat().forEach((c) => lista.push({ em: c.em, forca: 0.7 }));
    if (m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((i) => lista.push({ em: i.em, forca: 0.8 }));
    if (m.tipo === "numero") lista.push({ em: m.em + DURACAO_CONTA, forca: 1 });
    if (m.tipo === "comparacao") {
      m.lados.forEach((l) => lista.push({ em: l.em, forca: 0.8 }));
      if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm, forca: 1 });
    }
    if (m.tipo === "grafico") {
      (m.dados ?? []).forEach((d) => lista.push({ em: d.em, forca: 0.8 }));
      if (!m.dados?.length) lista.push({ em: m.tendenciaEm ?? m.de + 0.3, forca: 0.8 });
    }
    if (m.tipo === "definicao") {
      lista.push({ em: m.em, forca: 0.8 });
      lista.push({ em: m.significadoEm, forca: 0.8 });
    }
  }
  return lista.filter((b) => Number.isFinite(b.em)).sort((a, b) => a.em - b.em);
};

// quanto tempo o número leva contando
export const DURACAO_CONTA = 1.1;
