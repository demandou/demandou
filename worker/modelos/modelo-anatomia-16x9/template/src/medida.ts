// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza.
import { CARACTERES, SORA_600, SORA_700, SORA_800 } from "./larguras";

// peso 650 (rótulos clínicos) mede como 700, a favor da folga
export type Fonte = { peso?: 500 | 600 | 650 | 700 | 800; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const tabela = (f: Fonte) => (f.peso === 800 ? SORA_800 : f.peso === 700 || f.peso === 650 ? SORA_700 : SORA_600);

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const tab = tabela(fonte);
  const letras = [...t];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    soma += i === undefined ? 700 : tab[i];
  }
  // 3% de folga: o navegador arredonda
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Quebra em linhas que cabem em `largura` (palavra por palavra).
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

// Maior corpo (de `max` até `min`) em que o texto cabe em `linhas` linhas na `largura`.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const t = fonte.caixaAlta ? limpo.toUpperCase() : limpo;
  const f = { ...fonte, caixaAlta: false };
  for (let tamanho = max; tamanho >= min; tamanho -= 2) {
    const quebra = quebrarLinhas(t, largura, tamanho, f);
    if (quebra.length <= linhas && quebra.every((l) => larguraTexto(l, tamanho, f) <= largura)) return { tamanho, linhas: quebra };
  }
  // não coube: corpo mínimo e mais linhas; uma palavra única enorme ganha um corpo menor ainda
  let tamanho = min;
  const maior = t.split(" ").reduce((a, b) => (larguraTexto(b, 1, f) > larguraTexto(a, 1, f) ? b : a), "");
  while (tamanho > 22 && larguraTexto(maior, tamanho, f) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(t, largura, tamanho, f) };
};

// O maior corpo em que o texto cabe numa caixa `largura` × `altura`, com até `maxLinhas` linhas.
export const encaixarBloco = (
  texto: string,
  { largura, altura, max, min, maxLinhas = 4, entrelinha = 1.08, fonte = {} }: { largura: number; altura: number; max: number; min: number; maxLinhas?: number; entrelinha?: number; fonte?: Fonte },
): Encaixe => {
  let melhor: Encaixe | null = null;
  for (let k = 1; k <= maxLinhas; k++) {
    const teto = Math.min(max, Math.floor(altura / (k * entrelinha)));
    if (teto < min) break;
    const fit = encaixar(texto, { largura, max: teto, min, linhas: k, fonte });
    if (fit.linhas.length <= k && fit.linhas.length * fit.tamanho * entrelinha <= altura + 1 && (!melhor || fit.tamanho > melhor.tamanho)) melhor = fit;
  }
  return melhor ?? encaixar(texto, { largura, max: min, min: Math.max(24, min - 10), linhas: maxLinhas, fonte });
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

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

// 83000 → "83.000"; 1.5 com 1 casa → "1,5"
export const formatarNumero = (valor: number, casas = 0) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// rótulo curto: 80000 → "80 mil"; 1500000 → "1,5 mi"
export const numeroCurto = (valor: number) => {
  const abs = Math.abs(valor);
  if (abs >= 1e9) return `${formatarNumero(valor / 1e9, Number.isInteger(valor / 1e9) ? 0 : 1)} bi`;
  if (abs >= 1e6) return `${formatarNumero(valor / 1e6, Number.isInteger(valor / 1e6) ? 0 : 1)} mi`;
  if (abs >= 1e4) return `${formatarNumero(valor / 1e3, Number.isInteger(valor / 1e3) ? 0 : 1)} mil`;
  return formatarNumero(valor, Number.isInteger(valor) ? 0 : 1);
};
