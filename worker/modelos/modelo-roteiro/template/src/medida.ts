// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca vaza: no mínimo, aceita uma linha a mais (e uma palavra maior que a linha
// ganha um corpo menor ainda, só ela).
import {
  CARACTERES,
  FIRA_500,
  FIRA_600,
  FIRA_700,
  FRAUNCES_ITALICO_500,
  FRAUNCES_ITALICO_600,
  FRAUNCES_ITALICO_700,
  FRAUNCES_NORMAL_500,
  FRAUNCES_NORMAL_600,
  FRAUNCES_NORMAL_700,
} from "./larguras";

export type Fonte = {
  // "display" = Fraunces (títulos, nomes, números); "sans" = Fira Sans (rótulos, chips, detalhes)
  familia?: "display" | "sans";
  peso?: 500 | 600 | 700;
  italico?: boolean;
  // espaçamento entre letras, em frações do corpo (0.14 = "0.14em")
  espacamento?: number;
  caixaAlta?: boolean;
};

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

const tabela = (f: Fonte) => {
  const peso = f.peso ?? 600;
  if (f.familia === "sans") return peso === 500 ? FIRA_500 : peso === 700 ? FIRA_700 : FIRA_600;
  if (f.italico) return peso === 500 ? FRAUNCES_ITALICO_500 : peso === 700 ? FRAUNCES_ITALICO_700 : FRAUNCES_ITALICO_600;
  return peso === 500 ? FRAUNCES_NORMAL_500 : peso === 700 ? FRAUNCES_NORMAL_700 : FRAUNCES_NORMAL_600;
};

// Os textos animados palavra por palavra (TextoALapis) separam as palavras com uma margem fixa de
// 0,24 do corpo, não com o caractere de espaço. A medida segue a mesma regra.
export const VAO = 0.24;

// Largura de uma palavra (sem espaços) em px num corpo `tamanho`.
export const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? palavra.toUpperCase() : palavra;
  const larguras = tabela(fonte);
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    const i = indice.get(c);
    const w = i === undefined ? -1 : larguras[i];
    // caractere fora da tabela: uma largura média, generosa
    soma += w < 0 ? 640 : w;
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Largura de uma linha (palavras separadas pelo vão fixo).
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (!palavras.length) return 0;
  return palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, fonte), 0) + VAO * tamanho * (palavras.length - 1);
};

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
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
  // não deixa uma palavra curta sozinha no fim se der para equilibrar com a linha anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraTexto(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

export type Encaixe = { tamanho: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra única maior que a
// caixa ganha um corpo menor ainda (nunca vaza na largura).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  // não coube: corpo mínimo, mais linhas; a palavra mais larga decide se precisa encolher além do mínimo
  const maiorPalavra = Math.max(...limpo.split(" ").map((p) => larguraPalavra(p, min, fonte)));
  const tamanho = maiorPalavra > largura ? Math.floor((min * largura) / maiorPalavra) : min;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// Altura de um bloco de texto encaixado.
export const alturaDe = (e: Encaixe, entrelinha = 1.05) => e.linhas.length * e.tamanho * entrelinha;

// Encaixa também na altura: reduz o corpo até o bloco caber em `altura`.
export const encaixarNaCaixa = (
  texto: string,
  op: { largura: number; altura: number; max: number; min: number; linhas?: number; fonte?: Fonte; entrelinha?: number },
): Encaixe => {
  let max = op.max;
  let e = encaixar(texto, { ...op, max });
  while (alturaDe(e, op.entrelinha) > op.altura && max > op.min) {
    max -= 2;
    e = encaixar(texto, { ...op, max });
  }
  return e;
};

// Número em pt-BR: 83000 → "83.000"; 1.5 → "1,5"
// (feito à mão: não depende do idioma instalado no navegador do render)
export const numeroBR = (valor: number, casas = 0) => {
  const negativo = valor < 0;
  const fixo = Math.abs(valor).toFixed(casas);
  const [inteiro, fracao] = fixo.split(".");
  const milhares = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhares}${fracao ? `,${fracao}` : ""}`;
};
