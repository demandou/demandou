// Medir e encaixar texto: qualquer texto que o plano mandar cabe no bloco dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas equilibradas e reduz o corpo
// até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import {
  BRICOLAGE_500,
  BRICOLAGE_600,
  BRICOLAGE_700,
  BRICOLAGE_800,
  CARACTERES,
  INSTRUMENT_500,
  INSTRUMENT_600,
  INSTRUMENT_700,
} from "./larguras";

// display = Bricolage Grotesque (títulos, números); sans = Instrument Sans (rótulos, apoio)
export type Fonte = { familia?: "display" | "sans"; peso?: number; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS: Record<"display" | "sans", Record<number, number[]>> = {
  display: { 500: BRICOLAGE_500, 600: BRICOLAGE_600, 700: BRICOLAGE_700, 800: BRICOLAGE_800 },
  sans: { 500: INSTRUMENT_500, 600: INSTRUMENT_600, 700: INSTRUMENT_700 },
};

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const familia = fonte.familia ?? "display";
  const pesos = TABELAS[familia];
  const peso = fonte.peso ?? 700;
  const tabela = pesos[peso] ?? pesos[700] ?? pesos[600];
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    const v = i === undefined ? -1 : tabela[i];
    // caractere fora da tabela: uma largura média, um pouco generosa
    soma += v < 0 ? 640 : v;
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

const palavrasDe = (texto: string) => texto.trim().split(/\s+/).filter(Boolean);

// Quebra gulosa: linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavrasDe(texto)) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, fonte) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
};

// Divide o texto em exatamente `k` linhas, com a linha mais larga a menor possível (título equilibrado,
// sem palavra sozinha no fim). Programação dinâmica nas quebras entre palavras.
export const equilibrar = (texto: string, k: number, tamanho: number, fonte: Fonte = {}) => {
  const ws = palavrasDe(texto);
  if (k <= 1 || ws.length <= 1) return [ws.join(" ")];
  const n = ws.length;
  const kk = Math.min(k, n);
  const larg = (a: number, b: number) => larguraTexto(ws.slice(a, b).join(" "), tamanho, fonte);
  // melhor[j][i] = menor "linha mais larga" para as primeiras i palavras em j linhas
  const melhor: number[][] = Array.from({ length: kk + 1 }, () => Array(n + 1).fill(Infinity));
  const corte: number[][] = Array.from({ length: kk + 1 }, () => Array(n + 1).fill(0));
  melhor[0][0] = 0;
  for (let j = 1; j <= kk; j++)
    for (let i = 1; i <= n; i++)
      for (let a = j - 1; a < i; a++) {
        const v = Math.max(melhor[j - 1][a], larg(a, i));
        if (v < melhor[j][i]) {
          melhor[j][i] = v;
          corte[j][i] = a;
        }
      }
  const linhas: string[] = [];
  let i = n;
  for (let j = kk; j >= 1; j--) {
    const a = corte[j][i];
    linhas.unshift(ws.slice(a, i).join(" "));
    i = a;
  }
  return linhas;
};

export type Encaixe = { tamanho: number; linhas: string[]; largura: number; altura: number };

// Maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas, dentro de `largura`
// (e de `altura`, se informada). As linhas saem equilibradas. Se nem no mínimo cabe, usa o mínimo e
// deixa quebrar em mais linhas; uma palavra única maior que a caixa ganha um corpo menor ainda.
export const encaixar = (
  texto: string,
  {
    largura,
    altura = Infinity,
    max,
    min,
    linhas = 3,
    fonte = {},
    entrelinha = 1.08,
    equilibrado = true,
  }: { largura: number; altura?: number; max: number; min: number; linhas?: number; fonte?: Fonte; entrelinha?: number; equilibrado?: boolean },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const medir = (tamanho: number, ls: string[]): Encaixe => ({
    tamanho,
    linhas: ls,
    largura: Math.max(0, ...ls.map((l) => larguraTexto(l, tamanho, fonte))),
    altura: ls.length * tamanho * entrelinha,
  });
  if (!limpo) return medir(min, []);
  const passo = max > 120 ? 3 : 2;
  for (let tamanho = Math.floor(max); tamanho >= min; tamanho -= passo) {
    const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
    if (quebra.length > linhas) continue;
    if (quebra.some((l) => larguraTexto(l, tamanho, fonte) > largura)) continue;
    if (quebra.length * tamanho * entrelinha > altura) continue;
    const ls = equilibrado ? equilibrar(limpo, quebra.length, tamanho, fonte) : quebra;
    return medir(tamanho, ls.every((l) => larguraTexto(l, tamanho, fonte) <= largura) ? ls : quebra);
  }
  // não coube: corpo mínimo, quantas linhas precisar
  let tamanho = min;
  const maior = palavrasDe(limpo).reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  // e se a altura não comporta, reduz mais um pouco (sem descer de 30 px)
  let ls = quebrarLinhas(limpo, largura, tamanho, fonte);
  while (tamanho > 30 && ls.length * tamanho * entrelinha > altura) {
    tamanho -= 2;
    ls = quebrarLinhas(limpo, largura, tamanho, fonte);
  }
  return medir(tamanho, ls);
};

// Um corpo único para vários textos (itens de uma lista): o maior em que todos cabem nas suas caixas.
export const encaixarTodos = (
  textos: string[],
  opcoes: { largura: number; altura?: number; max: number; min: number; linhas?: number; fonte?: Fonte; entrelinha?: number },
) => {
  const tamanho = Math.min(...textos.map((t) => encaixar(t, opcoes).tamanho), opcoes.max);
  return textos.map((t) => encaixar(t, { ...opcoes, max: tamanho }));
};

// ——— números em pt-BR ———

export const formatarNumero = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
