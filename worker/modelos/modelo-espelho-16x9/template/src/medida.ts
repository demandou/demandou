// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
//
// As palavras faladas são desenhadas uma a uma (PalavraRevelada), com uma margem fixa entre elas
// em vez do caractere de espaço: a medida usa a mesma margem (`vao`, em frações do corpo).
import {
  BODONI_400,
  BODONI_500,
  BODONI_600,
  BODONI_ITALICO_400,
  BODONI_ITALICO_500,
  CARACTERES,
  JOST_300,
  JOST_400,
  JOST_500,
} from "./larguras";

export type Fonte = {
  // "serif" = Bodoni Moda; "sans" = Jost
  familia?: "serif" | "sans";
  peso?: 300 | 400 | 500 | 600;
  italico?: boolean;
  caixaAlta?: boolean;
  // espaçamento entre letras, em frações do corpo (letterSpacing em em)
  espacamento?: number;
  // margem entre palavras, em frações do corpo (padrão 0,24, a das palavras reveladas)
  vao?: number;
};

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

const tabela = (f: Fonte) => {
  if (f.familia === "sans") return f.peso === 300 ? JOST_300 : f.peso === 400 ? JOST_400 : JOST_500;
  if (f.italico) return (f.peso ?? 500) >= 500 ? BODONI_ITALICO_500 : BODONI_ITALICO_400;
  return f.peso === 400 ? BODONI_400 : f.peso === 600 ? BODONI_600 : BODONI_500;
};

// Largura de uma palavra (sem espaços) em px num corpo `tamanho`.
export const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? palavra.toUpperCase() : palavra;
  const tab = tabela(fonte);
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    const i = indice.get(c);
    // caractere fora da tabela: uma largura média generosa
    soma += i === undefined ? 640 : tab[i];
  }
  // 2% de folga: o navegador arredonda e aplica o kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * letras.length) * 1.02;
};

// Largura de uma linha (palavras com a margem fixa entre elas).
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const vao = (fonte.vao ?? 0.24) * tamanho;
  return palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, fonte), 0) + vao * Math.max(0, palavras.length - 1);
};

// Quebra em linhas que cabem em `largura`, palavra por palavra. Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, fonte) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return equilibrar(linhas, largura, tamanho, fonte);
};

// Linhas com larguras parecidas (a última não fica com uma palavra só se der para evitar).
const equilibrar = (linhas: string[], largura: number, tamanho: number, fonte: Fonte) => {
  if (linhas.length < 2) return linhas;
  const palavras = linhas.join(" ").split(" ");
  const n = linhas.length;
  // procura a divisão em n linhas com a linha mais larga mais estreita possível
  let melhor = linhas;
  let pior = Math.max(...linhas.map((l) => larguraTexto(l, tamanho, fonte)));
  const tentar = (inicio: number, resto: number, acumulado: string[]) => {
    if (resto === 1) {
      const ultima = palavras.slice(inicio).join(" ");
      if (!ultima) return;
      const candidata = [...acumulado, ultima];
      const maior = Math.max(...candidata.map((l) => larguraTexto(l, tamanho, fonte)));
      if (maior <= largura && maior < pior - 0.5) {
        pior = maior;
        melhor = candidata;
      }
      return;
    }
    for (let fim = inicio + 1; fim <= palavras.length - resto + 1; fim++) {
      const linha = palavras.slice(inicio, fim).join(" ");
      if (larguraTexto(linha, tamanho, fonte) > largura && fim > inicio + 1) break;
      tentar(fim, resto - 1, [...acumulado, linha]);
    }
  };
  if (palavras.length <= 14) tentar(0, n, []);
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas. Uma palavra única maior
// que a caixa ganha um corpo menor ainda (nunca vaza na largura).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {}, preferirMenos = 0.85 }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; preferirMenos?: number },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: min, linhas: [] };
  const melhorEm = (k: number): Encaixe | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo: o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * preferirMenos) return menos;
    }
    return melhor;
  }
  // não coube: corpo mínimo, quantas linhas precisar; palavra longa demais encolhe até caber
  const quebra = quebrarLinhas(limpo, largura, min, fonte);
  const maior = Math.max(...quebra.map((l) => larguraTexto(l, min, fonte)));
  const tamanho = maior > largura ? Math.max(28, Math.floor((min * largura) / maior)) : min;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// Maior corpo em que TODAS as linhas dadas (já quebradas) cabem na largura.
export const corpoQueCabe = (linhas: string[], largura: number, max: number, min: number, fonte: Fonte = {}) => {
  for (let tamanho = max; tamanho > min; tamanho -= 2) {
    if (linhas.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return tamanho;
  }
  return min;
};

// Guarda o resultado de contas puras (geometria, encaixe) entre um quadro e outro.
const memoria = new Map<string, unknown>();
export const lembrar = <T,>(chave: string, conta: () => T): T => {
  if (memoria.has(chave)) return memoria.get(chave) as T;
  const v = conta();
  if (memoria.size > 4000) memoria.clear();
  memoria.set(chave, v);
  return v;
};
