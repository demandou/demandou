// Medir e encaixar texto: qualquer texto que o plano mandar cabe na célula dele.
// Mede com as larguras reais da IBM Plex Sans (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais; uma palavra maior que a
// célula ganha um corpo menor ainda (só ela decide).
import { CARACTERES, SANS400, SANS500, SANS600, SANS700 } from "./larguras";

export type Fonte = { peso?: 400 | 500 | 600 | 700; mono?: boolean; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELA = { 400: SANS400, 500: SANS500, 600: SANS600, 700: SANS700 } as const;

// espaço entre palavras como o TextoFalado desenha (margem fixa de 0,26 do corpo)
export const VAO = 0.26;

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  let soma = 0;
  if (fonte.mono) soma = letras.length * 600;
  else {
    const tabela = TABELA[fonte.peso ?? 600];
    for (const c of letras) {
      if (c === " ") {
        soma += VAO * 1000;
        continue;
      }
      const i = indice.get(c);
      // caractere fora da tabela: uma largura média, um pouco generosa
      soma += i === undefined ? 640 : tabela[i];
    }
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
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

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas. Uma palavra única maior que a
// largura reduz o corpo até caber (nunca vaza).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const cabe = (tamanho: number, k: number) => {
    const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
    return quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura) ? quebra : null;
  };
  const melhorEm = (k: number): Encaixe | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = cabe(tamanho, k);
      if (q) return { tamanho, linhas: q };
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
  // não coube: no mínimo, com mais linhas; a palavra mais longa decide se precisa descer ainda mais
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, p) => Math.max(a, larguraTexto(p, 1, fonte)), 0);
  if (maiorPalavra * tamanho > largura) tamanho = Math.floor(largura / maiorPalavra);
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// Maior corpo (até `max`) em que o texto cabe numa linha só; nunca abaixo de `min`, a não ser que
// só assim caiba (aí desce o necessário).
export const umaLinha = (texto: string, largura: number, max: number, min: number, fonte: Fonte = {}) => {
  const l = larguraTexto(texto, 1, fonte);
  if (l <= 0) return max;
  const cabe = Math.floor(largura / l);
  return Math.min(max, Math.max(Math.min(min, cabe), cabe));
};

// Altura de um bloco de `n` linhas num corpo `tamanho` com entrelinha `entre`.
export const alturaDe = (n: number, tamanho: number, entre = 1.1) => Math.ceil(n * tamanho * entre);
