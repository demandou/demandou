// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da Figtree (larguras.ts), quebra em linhas e reduz o corpo
// até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, FIGTREE_500, FIGTREE_600, FIGTREE_700, FIGTREE_800 } from "./larguras";

export type Peso = 500 | 600 | 700 | 800;

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELA: Record<Peso, number[]> = { 500: FIGTREE_500, 600: FIGTREE_600, 700: FIGTREE_700, 800: FIGTREE_800 };

// O espaço entre palavras é uma margem fixa de 0,24 do corpo (o mesmo que os textos animados usam).
export const ESPACO = 0.24;

// Largura de uma palavra (sem espaços) em px, num corpo `tamanho`. `espacamento` em em (ex.: -0.02).
export const larguraPalavra = (palavra: string, tamanho: number, peso: Peso = 700, espacamento = 0) => {
  const tabela = TABELA[peso];
  let soma = 0;
  const letras = [...palavra];
  // caractere fora da tabela: uma largura média, um pouco generosa
  for (const c of letras) soma += tabela[indice.get(c) ?? -1] ?? 640;
  // 2% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + espacamento * tamanho * letras.length) * 1.02;
};

// Largura de uma linha (palavras separadas pela margem fixa)
export const larguraTexto = (texto: string, tamanho: number, peso: Peso = 700, espacamento = 0) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  return ws.reduce((s, w) => s + larguraPalavra(w, tamanho, peso, espacamento), 0) + Math.max(0, ws.length - 1) * ESPACO * tamanho;
};

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, peso: Peso = 700, espacamento = 0) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (!atual || larguraTexto(tentativa, tamanho, peso, espacamento) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  // não deixa uma palavra curta sozinha na última linha se der para equilibrar com a anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraTexto(moveu, tamanho, peso, espacamento) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

export type Encaixe = { tamanho: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura;
// uma palavra única maior que a caixa ganha um corpo menor ainda, até 30 px).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, peso = 700, espacamento = 0 }: { largura: number; max: number; min: number; linhas?: number; peso?: Peso; espacamento?: number },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, peso, espacamento);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, peso, espacamento) <= largura)) return { tamanho, linhas: quebra };
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
  // palavra enorme ("criptomoedas" numa caixa estreita): reduz até a maior palavra caber
  const maior = limpo.split(" ").reduce((a, b) => (larguraPalavra(b, 1, peso, espacamento) > larguraPalavra(a, 1, peso, espacamento) ? b : a), "");
  let tamanho = min;
  while (tamanho > 30 && larguraPalavra(maior, tamanho, peso, espacamento) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, peso, espacamento) };
};

// Altura de um bloco de texto encaixado
export const alturaTexto = (e: Encaixe, entrelinha = 1.08) => e.linhas.length * e.tamanho * entrelinha;

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

// Número no formato pt-BR (83.000; 1,5)
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// Quebra equilibrada (como o "text-wrap: balance"): o mesmo número de linhas da quebra comum,
// com as linhas de comprimentos parecidos.
export const quebrarEquilibrado = (texto: string, largura: number, tamanho: number, peso: Peso = 700, espacamento = 0) => {
  const comum = quebrarLinhas(texto, largura, tamanho, peso, espacamento);
  if (comum.length <= 1) return comum;
  let lo = largura * 0.35;
  let hi = largura;
  for (let k = 0; k < 14; k++) {
    const meio = (lo + hi) / 2;
    if (quebrarLinhas(texto, meio, tamanho, peso, espacamento).length <= comum.length) hi = meio;
    else lo = meio;
  }
  const linhas = quebrarLinhas(texto, hi + 0.5, tamanho, peso, espacamento);
  return linhas.length <= comum.length ? linhas : comum;
};

// Linhas de um título: equilibradas, e um ":" no meio do título termina a linha ("Aula gratuita: / como eu analiso")
const linhasDoTitulo = (texto: string, largura: number, tamanho: number, peso: Peso, espacamento: number) => {
  const m = texto.match(/^(.+?:)\s+(.+)$/);
  if (m && m[1].split(/\s+/).length <= 4) {
    return [...quebrarEquilibrado(m[1], largura, tamanho, peso, espacamento), ...quebrarEquilibrado(m[2], largura, tamanho, peso, espacamento)];
  }
  return quebrarEquilibrado(texto, largura, tamanho, peso, espacamento);
};

// Encaixe de título: o maior corpo em que o texto cabe em `linhas` linhas equilibradas (e na `altura`, se dada).
// Se nem no mínimo cabe, usa o mínimo e deixa uma linha a mais (nunca vaza na largura).
export const encaixarTitulo = (
  texto: string,
  {
    largura,
    max,
    min,
    linhas = 2,
    peso = 800,
    espacamento = -0.02,
    altura,
    entrelinha = 1.05,
    menosLinhas = true,
  }: {
    largura: number;
    max: number;
    min: number;
    linhas?: number;
    peso?: Peso;
    espacamento?: number;
    altura?: number;
    entrelinha?: number;
    // false: fica com o maior corpo, mesmo que use mais linhas (títulos em coluna estreita)
    menosLinhas?: boolean;
  },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      for (const ls of [linhasDoTitulo(limpo, largura, tamanho, peso, espacamento), quebrarEquilibrado(limpo, largura, tamanho, peso, espacamento)]) {
        const cabe = ls.length <= k && ls.every((l) => larguraTexto(l, tamanho, peso, espacamento) <= largura);
        if (cabe && (altura === undefined || ls.length * tamanho * entrelinha <= altura)) return { tamanho, linhas: ls };
      }
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor)
    for (let k = 1; menosLinhas && k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return menos;
    }
    return melhor;
  }
  const e = encaixar(limpo, { largura, max: min, min: Math.min(min, 30), linhas: linhas + 1, peso, espacamento });
  return { tamanho: e.tamanho, linhas: quebrarEquilibrado(limpo, largura, e.tamanho, peso, espacamento) };
};
