// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da fonte (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { ARCHIVO_500, ARCHIVO_600, ARCHIVO_700, ARCHIVO_800, CARACTERES } from "./larguras";

// peso da Archivo, ou `mono` = Courier Prime (máquina de escrever, 0,6 do corpo por caractere)
export type Fonte = { peso?: 500 | 600 | 700 | 800; mono?: boolean; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS = { 500: ARCHIVO_500, 600: ARCHIVO_600, 700: ARCHIVO_700, 800: ARCHIVO_800 } as const;

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  let soma = 0;
  if (fonte.mono) soma = letras.length * 600;
  else {
    const tabela = TABELAS[fonte.peso ?? 800];
    for (const c of letras) {
      const i = indice.get(c);
      // caractere fora da tabela: uma largura média, um pouco generosa
      soma += i === undefined ? 680 : tabela[i];
    }
  }
  // 3% de folga: o navegador arredonda; a datilografia tem uma leve irregularidade
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

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas (nunca vaza na largura,
// a não ser uma palavra única maior que a caixa, que então ganha um corpo menor ainda).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const t = fonte.caixaAlta ? limpo.toUpperCase() : limpo;
  const f = { ...fonte, caixaAlta: false };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(t, largura, tamanho, f);
      if (quebra.length <= k && quebra.every((l) => larguraTexto(l, tamanho, f) <= largura)) return { tamanho, linhas: quebra };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~15% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.85) return menos;
    }
    return melhor;
  }
  // palavra única enorme ("criptomoedas" num cartão estreito): reduz até caber na largura
  let tamanho = min;
  const maiorPalavra = t.split(" ").reduce((a, b) => (larguraTexto(b, 1, f) > larguraTexto(a, 1, f) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maiorPalavra, tamanho, f) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(t, largura, tamanho, f) };
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

// ——— números em pt-BR ———

// 83000 → "83.000"; 1.5 com 1 casa → "1,5"
export const formatarNumero = (valor: number, casas = 0) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

// rótulo curto de régua: 80000 → "80 mil"; 1500000 → "1,5 mi"; 12 → "12"
export const numeroCurto = (valor: number) => {
  const abs = Math.abs(valor);
  if (abs >= 1e9) return `${formatarNumero(valor / 1e9, Number.isInteger(valor / 1e9) ? 0 : 1)} bi`;
  if (abs >= 1e6) return `${formatarNumero(valor / 1e6, Number.isInteger(valor / 1e6) ? 0 : 1)} mi`;
  if (abs >= 1e4) return `${formatarNumero(valor / 1e3, Number.isInteger(valor / 1e3) ? 0 : 1)} mil`;
  return formatarNumero(valor, Number.isInteger(valor) ? 0 : 1);
};

// passo "redondo" (1, 2, 5 × 10^n) perto de `bruto`
export const passoRedondo = (bruto: number) => {
  if (!(bruto > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
};

// O maior corpo em que o texto cabe numa caixa de `largura` × `altura`, com até `maxLinhas` linhas
// (`entrelinha` = altura da linha em corpos). Para títulos e frases que podem crescer para baixo.
export const encaixarBloco = (
  texto: string,
  { largura, altura, max, min, maxLinhas = 4, entrelinha = 1.06, fonte = {} }: { largura: number; altura: number; max: number; min: number; maxLinhas?: number; entrelinha?: number; fonte?: Fonte },
): Encaixe => {
  let melhor: Encaixe | null = null;
  for (let k = 1; k <= maxLinhas; k++) {
    const teto = Math.min(max, Math.floor(altura / (k * entrelinha)));
    if (teto < min) break;
    const fit = encaixar(texto, { largura, max: teto, min, linhas: k, fonte });
    if (fit.linhas.length <= k && fit.linhas.length * fit.tamanho * entrelinha <= altura + 1 && (!melhor || fit.tamanho > melhor.tamanho)) melhor = fit;
  }
  return melhor ?? encaixar(texto, { largura, max: min, min: Math.max(26, min - 10), linhas: maxLinhas, fonte });
};
