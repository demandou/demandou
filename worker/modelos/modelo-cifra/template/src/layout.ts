// A gramática do Cifra, em tempo: onde a pessoa fica em cada momento, quando a janela troca de
// lugar, e as batidas (acordes ditos, metrônomo, setas) que fazem a janela pulsar.
import type { Area } from "./componentes/Cena";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Compasso, Janela, Momento, Plano } from "./plano";
import { H, LIMITE_APP, RAIO, TOPO, W } from "./tema";

// duração da troca de lugar da janela
export const TROCA = 0.55;

// As janelas da pessoa (px, 1080×1920). O rosto fica centrado na horizontal de cada janela.
export const JANELAS: Record<Exclude<Janela, "cheio">, Caixa> = {
  // larga em cima (rosto e ombros, a sala e o violão ao fundo); os diagramas ocupam a metade de baixo
  topo: { x: 150, y: TOPO, w: 780, h: 600, raio: RAIO, zoom: 1, ancoraY: 0.42 },
  // canto de cima à direita: o metrônomo fica à esquerda, os compassos embaixo
  canto: { x: 556, y: TOPO, w: 464, h: 640, raio: RAIO, zoom: 1.9, ancoraY: 0.43 },
  // no meio, em cima: as setas da batida embaixo
  centro: { x: 190, y: TOPO, w: 700, h: 600, raio: RAIO, zoom: 1.32, ancoraY: 0.47 },
  // embaixo: a folha de cifra fica em cima, como na estante
  estante: { x: 190, y: 960, w: 700, h: 560, raio: RAIO, zoom: 1.22, ancoraY: 0.47 },
};

// Onde fica a arte de cada momento, conforme o lugar da pessoa (px, 1080×1920)
export const areaDe = (j: Janela, zona: { topo: number; altura: number }): Area => {
  switch (j) {
    case "topo":
      return { x: 60, y: 780, w: 960, h: 742 };
    case "canto":
      return { x: 60, y: 820, w: 960, h: 700 };
    case "centro":
      return { x: 60, y: 785, w: 960, h: 735 };
    case "estante":
      return { x: 60, y: 185, w: 960, h: 745 };
    default:
      return { x: 60, y: zona.topo, w: 960, h: zona.altura };
  }
};

// A coluna livre ao lado da janela do canto (onde fica o metrônomo grande)
export const ladoDe = (j: Janela): Area | null => (j === "canto" ? { x: 60, y: TOPO, w: 470, h: 640 } : null);

// Onde a legenda fica em cada lugar da pessoa (topo da linha, px)
export const legendaYDe = (j: Janela, zona: { topo: number; altura: number }) => {
  if (j === "cheio") return Math.min(zona.topo + zona.altura + 30, LIMITE_APP - 96);
  if (j === "estante") return 1452;
  return 1462;
};

export const janelaPadrao: Record<Momento["tipo"], Janela> = {
  // quadro cheio: cartão de palco no peito
  abertura: "cheio",
  destaque: "cheio",
  frase: "cheio",
  pergunta: "cheio",
  cta: "cheio",
  // janela larga em cima: a arte embaixo
  acordes: "topo",
  numero: "topo",
  comparacao: "topo",
  // janela no meio, em cima: setas e cordas embaixo
  batida: "centro",
  grafico: "centro",
  // janela no canto: metrônomo ao lado, compassos embaixo
  compasso: "canto",
  passos: "canto",
  // janela embaixo: a folha de cifra na estante, em cima
  cifra: "estante",
  topicos: "estante",
  definicao: "estante",
};

// A pergunta com 3 ou 4 opções não cabe no cartão do peito: a pessoa sobe para a janela do meio e a
// pergunta ganha o palco embaixo.
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

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

const caixaDe = (j: Janela, plano: Plano): Caixa => (j === "cheio" ? caixaCheia(plano) : JANELAS[j]);

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
