// Medir e encaixar texto com as fontes de verdade (canvas do navegador, depois que as fontes carregam).
// Qualquer texto do plano cabe na caixa: quebra em linhas e reduz o corpo até um mínimo legível.
let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export const larguraTexto = (texto: string, tamanho: number, familia: string, peso = 700, espacamento = 0) => {
  const chave = `${familia}|${peso}|${tamanho}|${espacamento}|${texto}`;
  const salvo = cache.get(chave);
  if (salvo !== undefined) return salvo;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  let w = texto.length * tamanho * 0.6;
  if (ctx) {
    ctx.font = `${peso} ${tamanho}px ${familia}`;
    w = ctx.measureText(texto).width;
  }
  w += espacamento * tamanho * Math.max(0, [...texto].length - 1);
  w *= 1.03; // folga para o arredondamento do navegador
  cache.set(chave, w);
  return w;
};

/** quebra em linhas que cabem em `largura` */
export const quebrar = (texto: string, largura: number, tamanho: number, familia: string, peso = 700, espacamento = 0) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, familia, peso, espacamento) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
};

/** o maior corpo (entre `min` e `max`) em que o texto cabe em `linhas` linhas de `largura` */
export const encaixar = (texto: string, largura: number, max: number, min: number, linhasMax: number, familia: string, peso = 700, espacamento = 0) => {
  for (let s = max; s >= min; s -= 2) {
    const ls = quebrar(texto, largura, s, familia, peso, espacamento);
    if (ls.length <= linhasMax && ls.every((l) => larguraTexto(l, s, familia, peso, espacamento) <= largura)) return { tamanho: s, linhas: ls };
  }
  // no mínimo: aceita uma linha a mais (nunca corta nem vaza)
  return { tamanho: min, linhas: quebrar(texto, largura, min, familia, peso, espacamento) };
};
