// Medir e encaixar texto: qualquer texto que o plano mandar cabe no espaço dele.
// Mede com as larguras reais da fonte (larguras.ts), quebra em linhas e reduz o corpo até um mínimo
// legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import {
  CARACTERES,
  REDDIT_500,
  REDDIT_600,
  REDDIT_700,
  SPECTRAL_500,
  SPECTRAL_500I,
  SPECTRAL_600,
  SPECTRAL_600I,
  SPECTRAL_700,
} from "./larguras";

export type Fonte = {
  familia?: "serifa" | "sans";
  peso?: 500 | 600 | 700;
  italico?: boolean;
  // espaçamento entre letras, em em (0,16 = 0.16em)
  espacamento?: number;
  caixaAlta?: boolean;
};

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

const tabela = (f: Fonte) => {
  if (f.familia === "sans") return f.peso === 500 ? REDDIT_500 : f.peso === 700 ? REDDIT_700 : REDDIT_600;
  if (f.italico) return f.peso === 600 || f.peso === 700 ? SPECTRAL_600I : SPECTRAL_500I;
  return f.peso === 600 ? SPECTRAL_600 : f.peso === 700 ? SPECTRAL_700 : SPECTRAL_500;
};

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  const tab = tabela(fonte);
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    // caractere fora da tabela: uma largura média, um pouco generosa
    soma += i === undefined ? 620 : tab[i];
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
  // equilibra: não deixa uma palavra sozinha no fim se der para levar uma da linha anterior
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

export type Encaixe = { tamanho: number; linhas: string[]; largura: number };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura,
// a não ser uma palavra única maior que a caixa, que então ganha um corpo menor ainda).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const medir = (r: { tamanho: number; linhas: string[] }): Encaixe => ({ ...r, largura: Math.max(0, ...r.linhas.map((l) => larguraTexto(l, r.tamanho, fonte))) });
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, fonte) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~15% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.85) return medir(menos);
    }
    return medir(melhor);
  }
  // palavra única enorme ("criptomoedas" numa coluna estreita): reduz até caber na largura
  let tamanho = min;
  const maiorPalavra = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maiorPalavra, tamanho, fonte) > largura) tamanho -= 2;
  return medir({ tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte) });
};

// Vários textos com o MESMO corpo (itens de uma lista): o maior corpo em que todos cabem em
// `linhas` linhas; se não der, o mínimo com uma linha a mais.
export const encaixarTodos = (
  textos: string[],
  opcoes: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; larguras?: number[] },
): Encaixe[] => {
  const k = opcoes.linhas ?? 2;
  // cada texto pode ter a sua largura (ex.: nomes dos dois lados de uma figura); o corpo é um só
  const larg = (i: number) => opcoes.larguras?.[i] ?? opcoes.largura;
  const em = (tamanho: number, linhas: number) => textos.map((t, i) => encaixar(t, { ...opcoes, largura: larg(i), max: tamanho, min: tamanho, linhas }));
  const cabe = (r: Encaixe[], tamanho: number, linhas: number) => r.every((e) => e.linhas.length <= linhas && e.tamanho === tamanho);
  // o maior corpo em que tudo cabe em `linhas` linhas (ou null)
  const melhorEm = (linhas: number) => {
    for (let tamanho = opcoes.max; tamanho >= opcoes.min; tamanho -= 2) {
      const r = em(tamanho, linhas);
      if (cabe(r, tamanho, linhas)) return { tamanho, r };
    }
    return null;
  };
  // tudo numa linha só vale a pena se custar pouco corpo (até ~22% menor): a lista fica mais limpa
  for (let tamanho = opcoes.max; tamanho >= Math.max(opcoes.min, opcoes.max * 0.78); tamanho -= 2) {
    const r = em(tamanho, 1);
    if (cabe(r, tamanho, 1)) return r;
  }
  const melhor = melhorEm(k);
  if (melhor) {
    // menos linhas valem a pena se custarem pouco corpo (até ~22% menor): nada de uma palavra por linha
    for (let j = 1; j < k; j++) {
      const menos = melhorEm(j);
      if (menos && menos.tamanho >= melhor.tamanho * 0.78) return menos.r;
    }
    return melhor.r;
  }
  return textos.map((t, i) => encaixar(t, { ...opcoes, largura: larg(i), max: opcoes.min, min: opcoes.min, linhas: k + 1 }));
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

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

// ——— números em pt-BR ———

export const formatarNumero = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// fim "redondo" de uma régua: 83.000 → 100.000; 7 → 10; 1,5 → 2
export const fimRedondo = (v: number) => {
  const a = Math.abs(v) || 1;
  const p = Math.pow(10, Math.floor(Math.log10(a)));
  for (const f of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (a <= f * p * 1.0001) return f * p * Math.sign(v || 1);
  return 10 * p;
};

// rótulo curto de uma marca da régua: 25000 → "25 mil"; 1500000 → "1,5 mi"
export const numeroCurto = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e9) return `${formatarNumero(v / 1e9, Number.isInteger(v / 1e9) ? 0 : 1)} bi`;
  if (a >= 1e6) return `${formatarNumero(v / 1e6, Number.isInteger(v / 1e6) ? 0 : 1)} mi`;
  if (a >= 1e3) return `${formatarNumero(v / 1e3, Number.isInteger(v / 1e3) ? 0 : 1)} mil`;
  return formatarNumero(v, Number.isInteger(v) ? 0 : 1);
};
