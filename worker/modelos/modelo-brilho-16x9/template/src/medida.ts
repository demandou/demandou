// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais da Quicksand (larguras.ts), quebra em linhas e reduz o corpo
// até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, QUICKSAND_300, QUICKSAND_400, QUICKSAND_500, QUICKSAND_600, QUICKSAND_700 } from "./larguras";

export type Peso = 300 | 400 | 500 | 600 | 700;
export type Fonte = { peso?: Peso; espacamento?: number; caixaAlta?: boolean };

const TABELAS: Record<Peso, number[]> = {
  300: QUICKSAND_300,
  400: QUICKSAND_400,
  500: QUICKSAND_500,
  600: QUICKSAND_600,
  700: QUICKSAND_700,
};
const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

// Largura do texto em px num corpo `tamanho` (espacamento em em, como no CSS letter-spacing).
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  const tabela = TABELAS[fonte.peso ?? 600];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    // caractere fora da tabela: uma largura média, um pouco generosa
    soma += i === undefined ? 640 : tabela[i];
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * letras.length) * 1.03;
};

// Largura de uma linha montada palavra por palavra (o componente Palavras põe 0,26 em entre elas,
// em vez do caractere de espaço)
export const larguraLinha = (linha: string, tamanho: number, fonte: Fonte = {}) => {
  const ws = linha.split(/\s+/).filter(Boolean);
  return ws.reduce((s, w) => s + larguraTexto(w, tamanho, fonte), 0) + Math.max(0, ws.length - 1) * 0.26 * tamanho;
};

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraLinha(tentativa, tamanho, fonte) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  // equilibra: não deixa uma palavra curta sozinha no fim se der para trazer uma da linha anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraLinha(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura,
// a não ser uma palavra única maior que a caixa, que então ganha um corpo menor ainda).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
) => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraLinha(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~15% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.85) return menos;
    }
    return melhor;
  }
  // palavra única enorme ("criptomoedas" numa coluna estreita): reduz até caber na largura
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maiorPalavra, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// Maior corpo (até `max`) em que um texto de UMA linha cabe na largura (sem descer de `min`,
// a não ser que nem assim caiba: aí desce até caber).
export const corpoQueCabe = (texto: string, largura: number, max: number, min = 26, fonte: Fonte = {}) => {
  let tamanho = max;
  while (tamanho > min && larguraLinha(texto, tamanho, fonte) > largura) tamanho -= 1;
  while (tamanho > 18 && larguraLinha(texto, tamanho, fonte) > largura) tamanho -= 1;
  return tamanho;
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices (na lista de palavras de `texto`) do trecho `alvo`, ou null se não achar.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};
