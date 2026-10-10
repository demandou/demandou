// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais da EB Garamond e da Manrope (larguras.ts), quebra em linhas (nunca
// junta duas frases numa linha quando `frases` está ligado), equilibra as linhas e reduz o corpo até
// um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, GARAMOND_400, GARAMOND_500, GARAMOND_600, GARAMOND_I_400, GARAMOND_I_500, MANROPE_600, MANROPE_700, MANROPE_800 } from "./larguras";

export type Fonte = { familia?: "serif" | "sans"; peso?: number; italico?: boolean; versalete?: boolean; espacamento?: number };

// espaço entre palavras (frações do corpo): margem fixa, a mesma usada ao desenhar
export const espacoDe = (f: Fonte) => (f.familia === "sans" ? 0.26 : 0.25);
// versalete: minúsculas viram maiúsculas menores (esta fração do corpo)
export const VERSALETE = 0.74;

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const tabela = (f: Fonte) => {
  if (f.familia === "sans") return (f.peso ?? 700) >= 800 ? MANROPE_800 : (f.peso ?? 700) >= 700 ? MANROPE_700 : MANROPE_600;
  if (f.italico) return (f.peso ?? 400) >= 500 ? GARAMOND_I_500 : GARAMOND_I_400;
  return (f.peso ?? 400) >= 600 ? GARAMOND_600 : (f.peso ?? 400) >= 500 ? GARAMOND_500 : GARAMOND_400;
};

const larguraDoCaractere = (c: string, t: number[]): number => {
  const i = indice.get(c);
  if (i !== undefined && t[i] > 0) return t[i];
  const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (base !== c && base.length === 1) return larguraDoCaractere(base, t);
  return 620;
};

// Largura de uma palavra (sem espaços) em px, num corpo `tamanho`. 3% de folga para o kerning.
export const larguraPalavra = (palavra: string, tamanho: number, f: Fonte = {}) => {
  const t = tabela(f);
  let soma = 0;
  let n = 0;
  for (const c of palavra) {
    n++;
    if (f.versalete && c !== c.toLocaleUpperCase("pt-BR")) soma += larguraDoCaractere(c.toLocaleUpperCase("pt-BR"), t) * VERSALETE;
    else soma += larguraDoCaractere(c, t);
  }
  return ((soma / 1000) * tamanho + (f.espacamento ?? 0) * tamanho * Math.max(0, n - 1)) * 1.03;
};

export const separar = (texto: string) => texto.trim().split(/\s+/).filter(Boolean);

export const larguraLinha = (palavras: string[], tamanho: number, f: Fonte = {}) =>
  palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, f), 0) + espacoDe(f) * tamanho * Math.max(0, palavras.length - 1);

const fimDeFrase = (w: string) => /[.!?…]["”’)]?$/.test(w);

// Quebra gulosa com largura por linha (a capitular estreita as primeiras) e quebra obrigatória
// depois de cada fim de frase (`frases`). Devolve os índices das palavras de cada linha.
export const quebrar = (
  palavras: string[],
  larguraDaLinha: (i: number) => number,
  tamanho: number,
  f: Fonte = {},
  frases = true,
): number[][] => {
  const linhas: number[][] = [];
  let atual: number[] = [];
  palavras.forEach((p, i) => {
    const tentativa = [...atual, i].map((k) => palavras[k]);
    if (atual.length && larguraLinha(tentativa, tamanho, f) > larguraDaLinha(linhas.length)) {
      linhas.push(atual);
      atual = [];
    }
    atual.push(i);
    if (frases && fimDeFrase(p) && i < palavras.length - 1) {
      linhas.push(atual);
      atual = [];
    }
  });
  if (atual.length) linhas.push(atual);
  return linhas;
};

// Quebra equilibrada (para texto centrado): o mesmo número de linhas, com as linhas de tamanhos
// parecidos (nada de uma palavra sozinha embaixo).
export const quebrarEquilibrado = (palavras: string[], largura: number, tamanho: number, f: Fonte = {}, frases = true) => {
  const gulosa = quebrar(palavras, () => largura, tamanho, f, frases);
  if (gulosa.length < 2) return gulosa;
  let lo = largura * 0.5;
  let hi = largura;
  let melhor = gulosa;
  for (let k = 0; k < 14; k++) {
    const meio = (lo + hi) / 2;
    const q = quebrar(palavras, () => meio, tamanho, f, frases);
    if (q.length <= gulosa.length && q.every((l) => larguraLinha(l.map((i) => palavras[i]), tamanho, f) <= largura)) {
      melhor = q;
      hi = meio;
    } else lo = meio;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: number[][]; palavras: string[] };

// Maior corpo (de `max` até `min`) em que o texto cabe em `linhas` linhas e em `altura` px.
export const encaixar = (
  texto: string,
  o: {
    largura: number;
    max: number;
    min: number;
    linhas?: number;
    altura?: number;
    entrelinha?: number;
    fonte?: Fonte;
    equilibrar?: boolean;
    frases?: boolean;
    // linhas mais estreitas no começo (capitular): quantas linhas e quanto tirar (px por px de corpo)
    recuo?: { linhas: number; porCorpo: number };
  },
): Encaixe => {
  const palavras = separar(texto);
  const f = o.fonte ?? {};
  const maxLinhas = o.linhas ?? 3;
  const entre = o.entrelinha ?? 1.2;
  const frases = o.frases ?? true;
  const larg = (tam: number) => (i: number) => (o.recuo && i < o.recuo.linhas ? o.largura - o.recuo.porCorpo * tam : o.largura);
  const tentar = (tam: number) =>
    o.equilibrar && !o.recuo ? quebrarEquilibrado(palavras, o.largura, tam, f, frases) : quebrar(palavras, larg(tam), tam, f, frases);
  const cabe = (tam: number, q: number[][]) =>
    q.every((l, i) => l.length === 1 || larguraLinha(l.map((k) => palavras[k]), tam, f) <= larg(tam)(i)) &&
    (o.altura === undefined || q.length * tam * entre <= o.altura);
  for (let tam = o.max; tam >= o.min; tam -= 2) {
    const q = tentar(tam);
    const maior = Math.max(...palavras.map((p) => larguraPalavra(p, tam, f)));
    if (q.length <= maxLinhas && maior <= o.largura && cabe(tam, q)) return { tamanho: tam, linhas: q, palavras };
  }
  // não coube: no corpo mínimo, aceita mais linhas; palavra enorme reduz até caber na largura
  let tam = o.min;
  const maior = palavras.reduce((a, b) => (larguraPalavra(b, 1, f) > larguraPalavra(a, 1, f) ? b : a), "");
  while (tam > 20 && larguraPalavra(maior, tam, f) > o.largura) tam -= 2;
  while (tam > 20 && o.altura !== undefined && tentar(tam).length * tam * entre > o.altura) tam -= 2;
  return { tamanho: tam, linhas: tentar(tam), palavras };
};

// Corpo em que um texto de uma linha cabe (rótulos, etiquetas, nomes)
export const caberLinha = (texto: string, largura: number, max: number, min: number, f: Fonte = {}) => {
  let tam = max;
  while (tam > min && larguraLinha(separar(texto), tam, f) > largura) tam -= 1;
  return tam;
};

// ——— palavras do texto × palavras ditas ———

export const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices (na lista de palavras de `texto`) do trecho `alvo`, ou null se não achar.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = separar(texto).map(nucleo);
  const as = separar(alvo).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};
