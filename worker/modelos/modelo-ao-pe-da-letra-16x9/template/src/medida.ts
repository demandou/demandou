// Medir e encaixar texto com a fonte de verdade: `measureText` do canvas, no navegador do render,
// depois que as fontes carregaram (o Edicao segura o quadro até lá). Qualquer texto que o plano
// mandar cabe na caixa dele: quebra em linhas e reduz o corpo até um mínimo legível.
import { sans } from "./tema";

let prontas = false;
export const marcarFontesProntas = () => {
  prontas = true;
  cache.clear();
};

const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;

export type Fonte = { peso?: number; familia?: string; espacamento?: number; caixaAlta?: boolean };

// largura em px do texto num corpo `tamanho`
export const largura = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const familia = fonte.familia ?? sans;
  const chave = `${fonte.peso ?? 700}|${familia}|${t}`;
  let base = cache.get(chave);
  if (base === undefined) {
    if (!ctx && typeof document !== "undefined") ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.font = `${fonte.peso ?? 700} 100px ${familia}`;
      base = ctx.measureText(t).width;
    } else base = t.length * 56;
    if (prontas) cache.set(chave, base);
  }
  const extra = (fonte.espacamento ?? 0) * tamanho * Math.max(0, [...t].length - 1);
  // 2% de folga para o arredondamento do navegador
  return ((base / 100) * tamanho + extra) * 1.02;
};

// quebra em linhas que cabem em `max` (palavra por palavra); não deixa palavra curta sozinha no fim
export const quebrar = (texto: string, max: number, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[][] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    const tentativa = [...atual, p].join(" ");
    if (!atual.length || largura(tentativa, tamanho, fonte) <= max) atual.push(p);
    else {
      linhas.push(atual);
      atual = [p];
    }
  }
  if (atual.length) linhas.push(atual);
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2];
    if (ultima.length === 1 && penultima.length > 2) {
      const moveu = [penultima[penultima.length - 1], ...ultima];
      if (largura(moveu.join(" "), tamanho, fonte) <= max) {
        linhas[linhas.length - 2] = penultima.slice(0, -1);
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

// maior corpo (de `maximo` a `minimo`) em que o texto cabe em `maxLinhas` linhas de `max` px
export const encaixar = (texto: string, max: number, maximo: number, minimo: number, maxLinhas: number, fonte: Fonte = {}) => {
  for (let tam = maximo; tam >= minimo; tam -= 2) {
    const linhas = quebrar(texto, max, tam, fonte);
    const larga = Math.max(...linhas.map((l) => largura(l.join(" "), tam, fonte)));
    if (linhas.length <= maxLinhas && larga <= max) return { tamanho: tam, linhas };
  }
  // nem no mínimo: aceita mais linhas; uma palavra única maior que a caixa ganha corpo menor
  let tam = minimo;
  let linhas = quebrar(texto, max, tam, fonte);
  while (tam > 20 && Math.max(...linhas.map((l) => largura(l.join(" "), tam, fonte))) > max) {
    tam -= 2;
    linhas = quebrar(texto, max, tam, fonte);
  }
  return { tamanho: tam, linhas };
};

// Posição de cada palavra de um texto já encaixado (para o ponto pular de palavra em palavra).
export type PalavraPosta = { w: string; i: number; x: number; y: number; l: number; linha: number };
export const diagramar = (
  linhas: string[][],
  tamanho: number,
  entreLinhas: number,
  fonte: Fonte = {},
  alinhar: "esquerda" | "centro" = "esquerda",
  caixa = 0,
) => {
  const espaco = largura("a a", tamanho, fonte) - largura("aa", tamanho, fonte);
  const saida: PalavraPosta[] = [];
  let i = 0;
  linhas.forEach((linha, k) => {
    const total = largura(linha.join(" "), tamanho, fonte);
    let x = alinhar === "centro" ? (caixa - total) / 2 : 0;
    for (const w of linha) {
      const l = largura(w, tamanho, fonte);
      saida.push({ w, i: i++, x, y: k * tamanho * entreLinhas, l, linha: k });
      x += l + espaco;
    }
  });
  return saida;
};
