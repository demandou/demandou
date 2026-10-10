// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da Sora (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, SORA_300, SORA_400, SORA_600 } from "./larguras";

export type Peso = 300 | 400 | 600;
export type Fonte = { peso?: Peso; mono?: boolean; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
// espaço entre palavras dos textos falados (margem fixa, em em): o mesmo do componente Palavras
export const VAO = 0.26;

const tabela = (peso?: Peso) => (peso === 300 ? SORA_300 : peso === 600 ? SORA_600 : SORA_400);

// Largura de uma palavra (sem espaços) em px num corpo `tamanho`.
const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte): number => {
  const t = fonte.caixaAlta ? palavra.toUpperCase() : palavra;
  // espaço inseparável dentro de um grupo (o destaque fica numa linha só): vale o vão entre palavras
  if (t.includes("\u00A0")) return t.split("\u00A0").reduce((s: number, p, i): number => s + larguraPalavra(p, tamanho, fonte) + (i ? VAO * tamanho : 0), 0);
  const letras = [...t];
  let soma = 0;
  if (fonte.mono) soma = letras.length * 600;
  else {
    const tb = tabela(fonte.peso);
    // caractere fora da tabela: uma largura média, um pouco generosa
    for (const c of letras) soma += tb[indice.get(c) ?? -1] ?? 640;
  }
  return (soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * letras.length;
};

// Largura do texto em px (palavras separadas pelo vão fixo), com 4% de folga para o kerning.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/[ \t\n]+/).filter(Boolean);
  const soma = palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, fonte), 0);
  const vao = fonte.mono ? 0.6 : VAO;
  return (soma + Math.max(0, palavras.length - 1) * vao * tamanho) * 1.04;
};

// Quebra gulosa: palavra por palavra, até a largura. Palavra maior que a linha fica sozinha.
const guloso = (palavras: string[], largura: number, tamanho: number, fonte: Fonte) => {
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
  return linhas;
};

// Quebra em linhas que cabem em `largura`, equilibradas: com o mesmo número de linhas da quebra
// gulosa, procura a menor largura possível (nenhuma palavra sozinha no fim, linhas parecidas).
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}) => {
  const palavras = texto.split(/[ \t\n]+/).filter(Boolean);
  const base = guloso(palavras, largura, tamanho, fonte);
  if (base.length < 2) return base;
  let lo = 0;
  let hi = largura;
  let melhor = base;
  for (let i = 0; i < 18; i++) {
    const meio = (lo + hi) / 2;
    const q = guloso(palavras, meio, tamanho, fonte);
    if (q.length <= base.length && q.every((l) => larguraTexto(l, tamanho, fonte) <= meio + 0.5)) {
      hi = meio;
      melhor = q;
    } else lo = meio;
  }
  return melhor;
};

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura,
// a não ser uma palavra única maior que a caixa, que então ganha um corpo menor ainda).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
) => {
  const limpo = texto.trim().replace(/[ \t\n]+/g, " ");
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
  // palavra única enorme ("criptomoedas" numa caixa estreita): reduz até caber na largura
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maiorPalavra, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) };
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

// Número em pt-BR (83.000; 1,5)
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// O texto com as palavras do `trecho` ligadas por espaço inseparável: medido como um bloco só
// (é assim que o componente Palavras desenha o destaque, sem quebrar no meio).
export const juntarTrecho = (texto: string, trecho?: string) => {
  const r = trechoNoTexto(texto, trecho);
  if (!r) return texto;
  const ws = texto.split(/\s+/).filter(Boolean);
  return [...ws.slice(0, r[0]), ws.slice(r[0], r[1] + 1).join("\u00A0"), ...ws.slice(r[1] + 1)].join(" ");
};
