// Medir e encaixar texto: qualquer texto que o plano mandar cabe no papel dele.
// Mede com as larguras reais da Recursive (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, RECURSIVE } from "./larguras";

export type Medida = {
  // espaço entre palavras, em em (o `Palavras` usa margem fixa de 0,27em, não o caractere de espaço)
  espaco?: number;
  // espaçamento entre letras, em em (títulos: -0,01; rótulos: 0,06)
  tracking?: number;
  caixaAlta?: boolean;
};

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

export const palavrasDe = (texto: string) => texto.split(/\s+/).filter(Boolean);

// Largura de uma palavra em px num corpo `tamanho`
export const larguraPalavra = (w: string, tamanho: number, m: Medida = {}) => {
  const letras = [...(m.caixaAlta ? w.toUpperCase() : w)];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    soma += i === undefined ? 640 : RECURSIVE[i];
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (m.tracking ?? 0) * tamanho * letras.length) * 1.03;
};

export const larguraLinha = (ws: string[], tamanho: number, m: Medida = {}) =>
  ws.reduce((a, w) => a + larguraPalavra(w, tamanho, m), 0) + Math.max(0, ws.length - 1) * (m.espaco ?? 0.27) * tamanho;

// Quebra em linhas que cabem em `largura`. Palavra maior que a linha fica sozinha.
export const quebrar = (texto: string, largura: number, tamanho: number, m: Medida = {}) => {
  const linhas: string[][] = [];
  let atual: string[] = [];
  for (const w of palavrasDe(texto)) {
    const tentativa = [...atual, w];
    if (!atual.length || larguraLinha(tentativa, tamanho, m) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = [w];
    }
  }
  if (atual.length) linhas.push(atual);
  // não deixa uma palavra sozinha na última linha se der para equilibrar com a anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2];
    if (ultima.length === 1 && penultima.length > 2) {
      const movida = [penultima[penultima.length - 1], ...ultima];
      if (larguraLinha(movida, tamanho, m) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1);
        linhas[linhas.length - 1] = movida;
      }
    }
  }
  return linhas;
};

export type Encaixe = {
  tamanho: number;
  linhas: string[][];
  // índices (na sequência de palavras do texto) que começam uma linha nova
  quebras: number[];
  // largura da linha mais larga, em px
  largura: number;
};

const comQuebras = (tamanho: number, linhas: string[][], m: Medida): Encaixe => {
  const quebras: number[] = [];
  let n = 0;
  linhas.forEach((l, i) => {
    if (i > 0) quebras.push(n);
    n += l.length;
  });
  return { tamanho, linhas, quebras, largura: Math.max(0, ...linhas.map((l) => larguraLinha(l, tamanho, m))) };
};

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Menos linhas valem a pena se custarem pouco corpo (até ~12% menor). Se nem no mínimo cabe, usa o
// mínimo e deixa quebrar em mais linhas; uma palavra única maior que a caixa ganha um corpo menor.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, ...m }: { largura: number; max: number; min: number; linhas?: number } & Medida,
): Encaixe => {
  const limpo = palavrasDe(texto).join(" ");
  if (!limpo) return { tamanho: max, linhas: [], quebras: [], largura: 0 };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = quebrar(limpo, largura, tamanho, m);
      if (q.length <= k && q.every((l) => larguraLinha(l, tamanho, m) <= largura)) return comQuebras(tamanho, q, m);
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  // não coube no mínimo: palavra enorme ("criptomoedas" numa coluna estreita) reduz até caber
  let tamanho = min;
  const maior = palavrasDe(limpo).reduce((a, b) => (larguraPalavra(b, 1, m) > larguraPalavra(a, 1, m) ? b : a), "");
  while (tamanho > 26 && larguraPalavra(maior, tamanho, m) > largura) tamanho -= 2;
  return comQuebras(tamanho, quebrar(limpo, largura, tamanho, m), m);
};

// Medidas dos estilos de texto do tema (tema.ts): título, corpo e rótulo
export const TITULO: Medida = { tracking: -0.01 };
export const CORPO: Medida = {};
export const ROTULO: Medida = { tracking: 0.06, caixaAlta: true };

// Altura de um bloco de texto encaixado (linhas × entrelinha)
export const alturaDe = (e: { linhas: unknown[]; tamanho: number }, entrelinha = 1.08) => e.linhas.length * e.tamanho * entrelinha;

// Como `encaixar`, mas também limitado na altura: reduz o corpo até o bloco caber em `altura` px.
export const encaixarNaAltura = (
  texto: string,
  { altura, entrelinha = 1.04, max, ...resto }: { largura: number; max: number; min: number; linhas?: number; altura: number; entrelinha?: number } & Medida,
): Encaixe => {
  let e = encaixar(texto, { max, ...resto });
  for (let m = max; m >= resto.min; m -= 4) {
    e = encaixar(texto, { max: m, ...resto });
    if (alturaDe(e, entrelinha) <= altura) return e;
  }
  return e;
};

// Número em pt-BR: 83.000 · 1,5 · 12
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
