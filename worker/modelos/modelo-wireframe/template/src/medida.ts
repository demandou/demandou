// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com a própria fonte no navegador do render (canvas.measureText, depois que as fontes
// carregaram: o <Edicao> só desenha quando `fontesCarregadas` resolve), quebra em linhas e reduz o
// corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { mono, sans } from "./tema";

export type Fonte = {
  familia?: "sans" | "mono";
  italico?: boolean;
  peso?: 400 | 500 | 600 | 700;
  // espaçamento entre letras, em frações do corpo
  espacamento?: number;
  caixaAlta?: boolean;
};

export const TITULO: Fonte = { familia: "sans", peso: 700 };
export const SANS: Fonte = { familia: "sans", peso: 500 };
export const SANS_FORTE: Fonte = { familia: "sans", peso: 700 };
export const MONO: Fonte = { familia: "mono", peso: 700 };
export const MONO_FORTE: Fonte = { familia: "mono", peso: 700 };
export const ROTULO: Fonte = { familia: "mono", peso: 500, espacamento: 0.06, caixaAlta: true };

let contexto: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

// largura de reserva (sem navegador): média generosa por caractere
const estimativa = (texto: string, f: Fonte) => texto.length * (f.familia === "mono" ? 0.62 : 0.56) * 100;

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, f: Fonte = SANS) => {
  const t = f.caixaAlta ? texto.toUpperCase() : texto;
  const familia = f.familia === "mono" ? mono : sans;
  const chave = `${familia}|${f.peso ?? 400}|${f.italico ? "i" : "n"}|${t}`;
  let a100 = cache.get(chave);
  if (a100 === undefined) {
    if (!contexto && typeof document !== "undefined") contexto = document.createElement("canvas").getContext("2d");
    if (contexto) {
      contexto.font = `${f.italico ? "italic " : ""}${f.peso ?? 400} 100px "${familia}"`;
      a100 = contexto.measureText(t).width;
    } else a100 = estimativa(t, f);
    cache.set(chave, a100);
  }
  const letras = [...t].length;
  // 2% de folga: o navegador arredonda e aplica kerning
  return ((a100 / 100) * tamanho + (f.espacamento ?? 0) * tamanho * Math.max(0, letras - 1)) * 1.02;
};

// Uma palavra pode ter estilo próprio (ex.: o trecho em itálico); `estilo(i)` devolve a fonte da palavra i.
export type EstiloDaPalavra = (i: number) => Fonte;

// espaço entre palavras (margem fixa, em frações do corpo)
export const ESPACO = 0.26;

const larguraLinha = (palavras: { w: string; i: number }[], tamanho: number, estilo: EstiloDaPalavra) =>
  palavras.reduce((s, p, k) => s + larguraTexto(p.w, tamanho, estilo(p.i)) + (k > 0 ? ESPACO * tamanho : 0), 0);

export type Quebra = { tamanho: number; linhas: { w: string; i: number }[][] };

// Quebra as palavras em linhas que cabem em `largura` (guloso, depois equilibrado: as linhas ficam
// com larguras parecidas, sem uma palavra sozinha no fim).
export const quebrar = (texto: string, largura: number, tamanho: number, estilo: EstiloDaPalavra = () => SANS) => {
  const ws = texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => ({ w, i }));
  const guloso = (limite: number) => {
    const linhas: { w: string; i: number }[][] = [[]];
    for (const p of ws) {
      const atual = linhas[linhas.length - 1];
      if (atual.length && larguraLinha([...atual, p], tamanho, estilo) > limite) linhas.push([p]);
      else atual.push(p);
    }
    return linhas;
  };
  const base = guloso(largura);
  if (base.length < 2) return base;
  let melhor = base;
  for (let l = largura - 16; l > largura * 0.45; l -= 16) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

// O maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas, sem nenhuma palavra
// maior que a largura. Menos linhas vale a pena se custar pouco corpo (até ~12% menor).
// Se nem no mínimo cabe, usa o mínimo com mais linhas; palavra comprida demais desce até 0,8 do mínimo.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, estilo = () => SANS }: { largura: number; max: number; min: number; linhas?: number; estilo?: EstiloDaPalavra },
): Quebra => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const ws = limpo.split(" ");
  const cabe = (tamanho: number, k: number) => {
    if (ws.some((w, i) => larguraTexto(w, tamanho, estilo(i)) > largura)) return null;
    const q = quebrar(limpo, largura, tamanho, estilo);
    return q.length <= k ? q : null;
  };
  const melhorEm = (k: number): Quebra | null => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = cabe(tamanho, k);
      if (q) return { tamanho, linhas: q };
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
  let tamanho = min;
  while (tamanho > min * 0.8 && ws.some((w, i) => larguraTexto(w, tamanho, estilo(i)) > largura)) tamanho -= 2;
  return { tamanho, linhas: quebrar(limpo, largura, tamanho, estilo) };
};

// Corpo único para vários textos (itens de uma lista, lados de uma comparação): o maior em que
// todos cabem em até `linhas` linhas.
export const encaixarTodos = (
  textos: string[],
  opcoes: { largura: number; max: number; min: number; linhas?: number; estilo?: EstiloDaPalavra },
) => {
  const tamanho = Math.min(...textos.map((tx) => encaixar(tx, opcoes).tamanho));
  return { tamanho, quebras: textos.map((tx) => ({ tamanho, linhas: quebrar(tx, opcoes.largura, tamanho, opcoes.estilo) })) };
};

// Letreiro (caixa alta espaçada) que cabe numa largura: reduz até o mínimo de 30 px.
export const corpoDoRotulo = (texto: string, largura: number, max = 30, min = 30) => {
  for (let tamanho = max; tamanho > min; tamanho -= 1) if (larguraTexto(texto, tamanho, ROTULO) <= largura) return tamanho;
  return min;
};

// Como `encaixar`, mas também respeita uma altura: o bloco de linhas (linhas × corpo × entrelinha)
// não passa de `altura`.
export const encaixarNaCaixa = (
  texto: string,
  o: { largura: number; altura: number; max: number; min: number; linhas?: number; alturaLinha?: number; estilo?: EstiloDaPalavra },
): Quebra => {
  const lh = o.alturaLinha ?? 1.04;
  let max = o.max;
  let q = encaixar(texto, o);
  while (q.linhas.length * q.tamanho * lh > o.altura && max > o.min * 0.8) {
    max = Math.min(max, q.tamanho) - 2;
    q = encaixar(texto, { ...o, max, min: Math.min(o.min, max) });
  }
  return q;
};

// Largura de cada palavra de um texto (para marcas que correm por um grupo de palavras).
export const larguraDe = (texto: string, tamanho: number, estilo: EstiloDaPalavra = () => SANS) =>
  texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => larguraTexto(w, tamanho, estilo(i)));
