// Medir e encaixar texto com as larguras reais da Golos Text (larguras.ts): qualquer texto que o
// plano mandar cabe na caixa dele. Quebra em linhas e reduz o corpo até um mínimo legível; nunca
// corta nem vaza (no pior caso, aceita uma linha a mais).
import { CARACTERES, GOLOS_500, GOLOS_600, GOLOS_700, GOLOS_800 } from "./larguras";

export type Peso = 500 | 600 | 700 | 800;
export type Fonte = { peso?: Peso; espacamento?: number; caixaAlta?: boolean; tabular?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS: Record<Peso, number[]> = { 500: GOLOS_500, 600: GOLOS_600, 700: GOLOS_700, 800: GOLOS_800 };

// Largura do texto em px num corpo `tamanho` (peso padrão 800; `espacamento` em em, como no CSS).
export const medir = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const tabela = TABELAS[fonte.peso ?? 800];
  const zero = tabela[indice.get("0") ?? 16];
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    if (fonte.tabular && /[0-9]/.test(c)) {
      soma += zero;
      continue;
    }
    const i = indice.get(c);
    const v = i === undefined ? -1 : tabela[i];
    // caractere fora da tabela: uma largura média, um pouco generosa
    soma += v < 0 ? 640 : v;
  }
  // 2% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.02;
};

// Quebra em linhas (listas de palavras) que cabem em `largura`. Palavra maior que a linha fica sozinha.
// Equilibra: a menor largura que ainda dá o mesmo número de linhas (nada de palavra órfã no fim).
export const quebrar = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}): string[][] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const guloso = (limite: number) => {
    const linhas: string[][] = [[]];
    for (const w of ws) {
      const atual = linhas[linhas.length - 1];
      if (atual.length && medir([...atual, w].join(" "), tamanho, fonte) > limite) linhas.push([w]);
      else atual.push(w);
    }
    return linhas.filter((l) => l.length);
  };
  const base = guloso(largura);
  if (base.length < 2) return base;
  let melhor = base;
  for (let l = largura - 16; l > largura * 0.55; l -= 16) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: string[][]; largura: number };

// O maior corpo (de `max` até `min`, de 2 em 2) em que o texto cabe em até `linhas` linhas e, se
// houver, em `altura` px (com a entrelinha `entrelinha`). Menos linhas vale a pena se custar pouco
// corpo. Se nem no mínimo cabe, fica no mínimo e quebra em mais linhas; palavra única enorme reduz
// até caber na largura.
export const encaixar = (
  texto: string,
  o: { largura: number; max: number; min: number; linhas?: number; altura?: number; entrelinha?: number; fonte?: Fonte; menos?: boolean },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const maxLinhas = o.linhas ?? 2;
  const entrelinha = o.entrelinha ?? 1.08;
  const fonte = o.fonte ?? {};
  const ws = limpo.split(" ");
  const cabe = (tamanho: number, k: number) => {
    if (Math.max(0, ...ws.map((w) => medir(w, tamanho, fonte))) > o.largura) return null;
    const linhas = quebrar(limpo, o.largura, tamanho, fonte);
    if (linhas.length > k) return null;
    if (o.altura !== undefined && linhas.length * tamanho * entrelinha > o.altura) return null;
    return linhas;
  };
  const melhorEm = (k: number) => {
    for (let tamanho = o.max; tamanho >= o.min; tamanho -= 2) {
      const linhas = cabe(tamanho, k);
      if (linhas) return { tamanho, linhas };
    }
    return null;
  };
  const larguraDe = (r: { tamanho: number; linhas: string[][] }) => Math.max(0, ...r.linhas.map((l) => medir(l.join(" "), r.tamanho, fonte)));
  const melhor = melhorEm(maxLinhas);
  if (melhor) {
    for (let k = 1; o.menos !== false && k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.86) return { ...menos, largura: larguraDe(menos) };
    }
    return { ...melhor, largura: larguraDe(melhor) };
  }
  let tamanho = o.min;
  const maior = ws.reduce((a, b) => (medir(b, 1, fonte) > medir(a, 1, fonte) ? b : a), "");
  while (tamanho > o.min * 0.72 && medir(maior, tamanho, fonte) > o.largura) tamanho -= 2;
  const linhas = quebrar(limpo, o.largura, tamanho, fonte);
  return { tamanho, linhas, largura: larguraDe({ tamanho, linhas }) };
};

// ——— trechos dentro de um texto (destaque, risco) ———

export const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices [primeiro, último] (na lista de palavras de `texto`) do trecho `alvo`, ou null.
export const trechoNoTexto = (texto: string, alvo?: string): [number, number] | null => {
  if (!alvo?.trim()) return null;
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return [i, i + as.length - 1];
  }
  return null;
};

// ——— números em português do Brasil ———

const milhar = (n: number) => Math.round(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 83000 → "83.000"; 1.5 (casas 1) → "1,5"
export const formatar = (n: number, casas = 0) => {
  if (casas <= 0) return `${n < 0 ? "-" : ""}${milhar(Math.abs(n))}`;
  const [i, d] = Math.abs(n).toFixed(casas).split(".");
  return `${n < 0 ? "-" : ""}${milhar(Number(i))},${d}`;
};

// casas padrão de um valor: inteiro = 0; com fração = 1 (ou 2 se precisar)
export const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? 1 : 2);
