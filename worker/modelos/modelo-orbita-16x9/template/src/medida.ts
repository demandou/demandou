// Medir e encaixar texto: qualquer texto do plano cabe na caixa dele. Mede com a própria fonte no
// navegador do render (o <Edicao> só desenha depois que as fontes carregam), quebra em linhas
// equilibradas e reduz o corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma
// linha a mais.
import { MONO, SORA } from "./tema";

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export const larguraTexto = (texto: string, tamanho: number, peso = 700, mono = false, espacamento = 0) => {
  const fam = mono ? MONO : SORA;
  const chave = `${fam}|${peso}|${texto}`;
  let a = cache.get(chave);
  if (a === undefined) {
    if (!ctx && typeof document !== "undefined") ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.font = `${peso} 100px "${fam}"`;
      a = ctx.measureText(texto).width;
    } else a = texto.length * 62;
    cache.set(chave, a);
  }
  return ((a / 100) * tamanho + espacamento * tamanho * Math.max(0, [...texto].length - 1)) * 1.03;
};

// quebra em linhas que cabem em `largura` (guloso e depois equilibrado)
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, peso = 700): string[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const w of ws) {
    const teste = atual ? `${atual} ${w}` : w;
    if (!atual || larguraTexto(teste, tamanho, peso) <= largura) atual = teste;
    else {
      linhas.push(atual);
      atual = w;
    }
  }
  if (atual) linhas.push(atual);
  // equilibra: puxa palavras da linha de cima para a de baixo enquanto a de baixo for bem menor
  for (let i = linhas.length - 1; i > 0; i--) {
    for (let k = 0; k < 4; k++) {
      const cima = linhas[i - 1].split(" ");
      if (cima.length < 2) break;
      const ultima = cima[cima.length - 1];
      const novaBaixo = `${ultima} ${linhas[i]}`;
      const novaCima = cima.slice(0, -1).join(" ");
      if (larguraTexto(novaBaixo, tamanho, peso) <= largura && larguraTexto(novaBaixo, tamanho, peso) < larguraTexto(linhas[i - 1], tamanho, peso)) {
        linhas[i - 1] = novaCima;
        linhas[i] = novaBaixo;
      } else break;
    }
  }
  return linhas;
};

// o maior corpo (entre `max` e `min`) em que o texto cabe em até `maxLinhas` linhas
export const encaixar = (texto: string, largura: number, max: number, min: number, maxLinhas = 2, peso = 700) => {
  for (let s = max; s >= min; s -= 2) {
    const linhas = quebrarLinhas(texto, largura, s, peso);
    if (linhas.length <= maxLinhas && linhas.every((l) => larguraTexto(l, s, peso) <= largura)) return { tamanho: s, linhas };
  }
  // no mínimo: aceita mais linhas (nunca vaza)
  const linhas = quebrarLinhas(texto, largura, min, peso);
  return { tamanho: min, linhas };
};

// uma linha só: o maior corpo que cabe
export const caberNumaLinha = (texto: string, largura: number, max: number, min: number, peso = 700, mono = false, espacamento = 0) => {
  const a = larguraTexto(texto, 100, peso, mono, espacamento);
  return Math.max(min, Math.min(max, Math.floor((largura / a) * 100)));
};
