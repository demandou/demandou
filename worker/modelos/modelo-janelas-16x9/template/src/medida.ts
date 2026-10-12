// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais da fonte (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { LARGURAS } from "./larguras";

export type Fonte = { peso?: 400 | 500 | 600 | 700 | 800; mono?: boolean; espacamento?: number; caixaAlta?: boolean };

// espaço entre palavras (margem fixa em frações do corpo, igual à dos textos animados)
export const ESPACO = 0.25;

const mediaDoPeso = (peso: number) => {
  const tabela = LARGURAS[peso] ?? LARGURAS[800];
  const valores = Object.values(tabela);
  return valores.reduce((s, v) => s + v, 0) / valores.length;
};
const MEDIAS: Record<number, number> = Object.fromEntries([400, 500, 600, 700, 800].map((p) => [p, mediaDoPeso(p)]));

// Largura de uma palavra (ou trecho sem quebra) em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toUpperCase() : texto;
  const letras = [...t];
  let soma = 0;
  if (fonte.mono) soma = letras.length * 0.6;
  else {
    const peso = fonte.peso ?? 800;
    const tabela = LARGURAS[peso] ?? LARGURAS[800];
    // caractere fora da tabela: a média do peso, um pouco generosa
    for (const c of letras) soma += tabela[c] ?? MEDIAS[peso] * 1.1;
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return (soma * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Largura de uma linha de palavras separadas pela margem fixa
export const larguraLinha = (palavras: string[], tamanho: number, fonte: Fonte = {}) =>
  palavras.reduce((s, w, i) => s + larguraTexto(w, tamanho, fonte) + (i > 0 ? ESPACO * tamanho : 0), 0);

// Quebra em linhas que cabem em `largura` (guloso, depois equilibrado: sem palavra sozinha no fim).
// Devolve os índices das palavras de cada linha.
export const quebrar = (palavras: string[], largura: number, tamanho: number, fonte: Fonte = {}) => {
  const guloso = (limite: number) => {
    const linhas: number[][] = [[]];
    palavras.forEach((w, i) => {
      const atual = linhas[linhas.length - 1];
      if (atual.length && larguraLinha([...atual.map((k) => palavras[k]), w], tamanho, fonte) > limite) linhas.push([i]);
      else atual.push(i);
    });
    return linhas.filter((l) => l.length);
  };
  const base = guloso(largura);
  if (base.length < 2) return base;
  // equilibra: a menor largura que não cria linha nova
  let melhor = base;
  for (let l = largura - 12; l > largura * 0.5; l -= 12) {
    const tentativa = guloso(l);
    if (tentativa.length > base.length) break;
    melhor = tentativa;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: number[][]; palavras: string[]; largura: number };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra maior que a
// caixa ganha um corpo menor ainda (nunca vaza na largura).
export const encaixar = (
  texto: string,
  {
    largura,
    max,
    min,
    linhas = 2,
    fonte = {},
    menosLinhas = true,
  }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; menosLinhas?: boolean },
): Encaixe => {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const medida = (tamanho: number, q: number[][]) => Math.max(0, ...q.map((l) => larguraLinha(l.map((k) => palavras[k]), tamanho, fonte)));
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = quebrar(palavras, largura, tamanho, fonte);
      if (q.length <= k && medida(tamanho, q) <= largura) return { tamanho, linhas: q };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor && !menosLinhas) return { ...melhor, palavras, largura: medida(melhor.tamanho, melhor.linhas) };
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.tamanho >= melhor.tamanho * 0.88) return { ...menos, palavras, largura: medida(menos.tamanho, menos.linhas) };
    }
    return { ...melhor, palavras, largura: medida(melhor.tamanho, melhor.linhas) };
  }
  let tamanho = min;
  const maior = palavras.reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 26 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  const q = quebrar(palavras, largura, tamanho, fonte);
  return { tamanho, linhas: q, palavras, largura: medida(tamanho, q) };
};

// Corpo de uma linha só que cabe em `largura` (rótulos, títulos de janela, nomes de tecla)
export const corpoQueCabe = (texto: string, largura: number, max: number, min: number, fonte: Fonte = {}) => {
  for (let tamanho = max; tamanho > min; tamanho -= 1) if (larguraTexto(texto, tamanho, fonte) <= largura) return tamanho;
  return min;
};

// ——— trechos dentro de um texto (destaque, risco) ———

const nucleo = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}$%]+|[^\p{L}\p{N}%]+$/gu, "");

// Índices [primeiro, último] das palavras de `texto` que formam o trecho `alvo` (ou null)
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

// 83000 → "83.000"; 1.5 (casas 1) → "1,5". Sem depender do idioma do navegador.
export const formatarNumero = (v: number, casas = 0) => {
  const [inteiro, decimal] = Math.abs(v).toFixed(casas).split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "−" : ""}${milhar}${decimal ? `,${decimal}` : ""}`;
};
