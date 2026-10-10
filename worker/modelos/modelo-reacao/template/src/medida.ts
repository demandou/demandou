// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da Rubik (larguras.ts), quebra em linhas e reduz o corpo
// até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
// Devolve também a posição de cada palavra: é com ela que o marca-texto acha a linha lida.
import { CARACTERES, RUBIK_500, RUBIK_600, RUBIK_700, RUBIK_800 } from "./larguras";

export type Peso = 500 | 600 | 700 | 800;
export type Fonte = { peso?: Peso; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS = { 500: RUBIK_500, 600: RUBIK_600, 700: RUBIK_700, 800: RUBIK_800 };

// Largura do texto em px num corpo `tamanho` (2% de folga: o navegador arredonda e aplica kerning).
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toLocaleUpperCase("pt-BR") : texto;
  const tabela = TABELAS[fonte.peso ?? 700];
  let soma = 0;
  for (const c of t) {
    const i = indice.get(c);
    soma += i === undefined ? 640 : tabela[i];
  }
  return (soma / 1000) * tamanho * 1.02;
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

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
) => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor)
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  // texto além do limite: fica no corpo mínimo e ganha as linhas que precisar;
  // palavra única enorme ("criptomoedas" numa caixa estreita) reduz até caber na largura
  let tamanho = min;
  const maior = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 22 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
};

// ——— bloco de texto com a posição de cada palavra ———

export type PalavraPosta = { w: string; i: number; x: number; largura: number; linha: number };
export type TextoPosto = {
  tamanho: number;
  // altura de cada linha (px)
  lh: number;
  linhas: PalavraPosta[][];
  palavras: PalavraPosta[];
  altura: number;
  largura: number;
  fonte: Fonte;
};

export const porTexto = (
  texto: string,
  opcoes: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; entrelinha?: number },
): TextoPosto => {
  const fonte = opcoes.fonte ?? {};
  const { tamanho, linhas } = encaixar(texto, opcoes);
  const lh = Math.round(tamanho * (opcoes.entrelinha ?? 1.22));
  const espaco = larguraTexto(" ", tamanho, fonte);
  const palavras: PalavraPosta[] = [];
  const porLinha: PalavraPosta[][] = [];
  let i = 0;
  let maior = 0;
  linhas.forEach((l, li) => {
    let x = 0;
    const lista: PalavraPosta[] = [];
    for (const w of l.split(" ")) {
      const largura = larguraTexto(w, tamanho, fonte);
      const p = { w, i: i++, x, largura, linha: li };
      lista.push(p);
      palavras.push(p);
      x += largura + espaco;
    }
    maior = Math.max(maior, x - espaco);
    porLinha.push(lista);
  });
  return { tamanho, lh, linhas: porLinha, palavras, altura: lh * linhas.length, largura: maior, fonte };
};

// ——— trechos dentro de um texto (marca-texto, risco, destaque) ———

export const nucleo = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

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
