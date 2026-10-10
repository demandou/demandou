// Geometria dos blocos que viram tabela na área de baixo (topicos, passos, tabela) e das linhas de
// dados do gráfico. Tudo encaixa nas colunas A, B e C da grade; as linhas ganham a altura que o
// número de itens pede (2 a 5), e o cabeçalho de linhas da planilha numera exatamente estas linhas.
import type { Ret } from "./grade";
import type { Grafico, Item, LinhaDaTabela, Passos, Plano, Tabela, Topicos } from "./plano";
import { COL, FUNDO_UTIL, LINHA, TAB, TABELA_Y } from "./tema";

export type BlocoDeTabela = Topicos | Passos | Tabela;

// Uma linha normalizada (o mesmo formato para os três tipos)
export type LinhaNorm = {
  texto: string;
  em: number;
  detalhe?: string;
  detalheEm?: number;
  marca?: "sim" | "nao" | number;
  marcaEm?: number;
};

export const MAX_ITENS = 5;

export const linhasNorm = (m: BlocoDeTabela): LinhaNorm[] => {
  if (m.tipo === "tabela") return (m.linhas ?? []).slice(0, MAX_ITENS).map((l: LinhaDaTabela) => ({ ...l }));
  return (m.itens ?? []).slice(0, MAX_ITENS).map((i: Item) => ({
    texto: i.texto,
    em: i.em,
    detalhe: i.detalhe,
    detalheEm: i.detalheEm,
    marca: i.marca,
    marcaEm: i.marcaEm,
  }));
};

export type GeoLinha = {
  ret: Ret;
  numero: number;
  // a célula do texto do item, a da marca (✓/✗/número) e a do detalhe; `passo` = célula do número (passos)
  item: Ret;
  marca?: Ret;
  detalhe?: Ret;
  passo?: Ret;
  dados: LinhaNorm;
};

export type GeoTabela = {
  cabecalho?: { ret: Ret; numero: number; colunas: { texto: string; ret: Ret }[] };
  linhas: GeoLinha[];
  total?: { ret: Ret; numero: number; rotulo: string; valor: Ret };
  fundo: number;
  // detalhe na mesma célula do item (passos), embaixo dele
  detalheEmbaixo: boolean;
};

const temDetalhe = (ls: LinhaNorm[]) => ls.some((l) => !!l.detalhe);
const temMarca = (ls: LinhaNorm[]) => ls.some((l) => l.marca !== undefined);

// Largura reservada para a marca (✓/✗) no fim da linha, nos tópicos
export const LARGURA_MARCA = 96;

export const geoTabela = (plano: Plano, m: BlocoDeTabela): GeoTabela => {
  const ls = linhasNorm(m);
  const n = Math.max(1, ls.length);
  const x0 = COL[0];
  const x3 = COL[3];
  let y = TABELA_Y;
  let numero = 6;

  // cabeçalho (títulos das colunas)
  let cabecalho: GeoTabela["cabecalho"];
  const colunasTabela = m.tipo === "tabela" ? (m.colunas ?? plano.tabela?.colunas) : undefined;
  const titulo = m.tipo !== "tabela" ? m.titulo?.trim() : undefined;
  if (m.tipo === "tabela" && colunasTabela?.some((c) => c.trim())) {
    cabecalho = {
      ret: { x: x0, y, w: x3 - x0, h: TAB.cabecalho },
      numero,
      colunas: colunasTabela.map((texto, i) => ({ texto, ret: { x: COL[i], y, w: COL[i + 1] - COL[i], h: TAB.cabecalho } })),
    };
  } else if (m.tipo === "passos" && titulo) {
    cabecalho = {
      ret: { x: x0, y, w: x3 - x0, h: TAB.cabecalho },
      numero,
      colunas: [
        { texto: "#", ret: { x: COL[0], y, w: COL[1] - COL[0], h: TAB.cabecalho } },
        { texto: titulo, ret: { x: COL[1], y, w: COL[3] - COL[1], h: TAB.cabecalho } },
      ],
    };
  } else if (m.tipo === "topicos" && titulo) {
    cabecalho = { ret: { x: x0, y, w: x3 - x0, h: TAB.cabecalho }, numero, colunas: [{ texto: titulo, ret: { x: x0, y, w: x3 - x0, h: TAB.cabecalho } }] };
  }
  if (cabecalho) {
    y += TAB.cabecalho;
    numero++;
  }

  const comTotal = m.tipo === "tabela" && m.total !== false && temMarca(ls);
  const disponivel = FUNDO_UTIL - y - (comTotal ? TAB.total : 0);
  const h = Math.max(88, Math.min(170, Math.floor(disponivel / n)));

  const detalhe = temDetalhe(ls);
  const linhas: GeoLinha[] = ls.map((dados) => {
    const ret = { x: x0, y, w: x3 - x0, h };
    let g: GeoLinha;
    if (m.tipo === "tabela") {
      g = {
        ret,
        numero,
        dados,
        item: { x: COL[0], y, w: COL[1] - COL[0], h },
        marca: { x: COL[1], y, w: COL[2] - COL[1], h },
        detalhe: { x: COL[2], y, w: COL[3] - COL[2], h },
      };
    } else if (m.tipo === "passos") {
      g = { ret, numero, dados, passo: { x: COL[0], y, w: COL[1] - COL[0], h }, item: { x: COL[1], y, w: COL[3] - COL[1], h } };
    } else {
      // tópicos: o item ocupa A–B (com detalhe em C) ou A–C; a marca, se houver, fica no fim da linha
      const item = detalhe ? { x: COL[0], y, w: COL[2] - COL[0], h } : { x: COL[0], y, w: COL[3] - COL[0], h };
      g = { ret, numero, dados, item, detalhe: detalhe ? { x: COL[2], y, w: COL[3] - COL[2], h } : undefined };
      if (temMarca(ls)) g.marca = { x: COL[3] - LARGURA_MARCA, y, w: LARGURA_MARCA, h };
    }
    y += h;
    numero++;
    return g;
  });

  let total: GeoTabela["total"];
  if (comTotal && m.tipo === "tabela") {
    total = { ret: { x: x0, y, w: x3 - x0, h: TAB.total }, numero, rotulo: m.total || "Total", valor: { x: COL[1], y, w: COL[2] - COL[1], h: TAB.total } };
    y += TAB.total;
    numero++;
  }
  return { cabecalho, linhas, total, fundo: y, detalheEmbaixo: m.tipo === "passos" };
};

// Linhas numeradas da planilha com este bloco na área de baixo (faixa de cima 1–5, o bloco, e
// linhas comuns de 100 px até o fim do quadro).
export const linhasNumeradasDoBloco = (geo: GeoTabela) => {
  const lista: { y: number; h: number; numero: number }[] = [];
  for (let i = 0; i < 5; i++) lista.push({ y: TABELA_Y - (5 - i) * LINHA, h: LINHA, numero: i + 1 });
  let n = 6;
  if (geo.cabecalho) lista.push({ y: geo.cabecalho.ret.y, h: geo.cabecalho.ret.h, numero: n++ });
  for (const l of geo.linhas) lista.push({ y: l.ret.y, h: l.ret.h, numero: n++ });
  if (geo.total) lista.push({ y: geo.total.ret.y, h: geo.total.ret.h, numero: n++ });
  let y = geo.fundo;
  while (y < 1920) {
    lista.push({ y, h: LINHA, numero: n++ });
    y += LINHA;
  }
  return lista;
};

// ---------- gráfico ----------

// Formato dos números do gráfico: prefixo/sufixo explícitos ou a `unidade`
export const formatoDoGrafico = (m: Grafico) => {
  const u = m.unidade?.trim() ?? "";
  const prefixoU = /^(R\$|US\$|€|£|\$)$/.test(u);
  return {
    prefixo: m.prefixo ?? (prefixoU ? u : ""),
    sufixo: m.sufixo ?? (!prefixoU && u ? (u === "%" ? "%" : ` ${u}`) : ""),
    casas: m.casas ?? 0,
  };
};

// As linhas de dados na célula ao lado da pessoa (rótulo | valor), com cabeçalho
export const geoDados = (lado: Ret, n: number) => {
  const cab = 76;
  const h = Math.max(58, Math.min(96, Math.floor((lado.h - cab - 16) / Math.max(1, n))));
  const linhas = Array.from({ length: n }, (_, i) => ({ x: lado.x, y: lado.y + cab + i * h, w: lado.w, h }));
  return { cabecalho: { x: lado.x, y: lado.y, w: lado.w, h: cab }, linhas };
};
