// Medir e encaixar texto: qualquer texto que o plano mandar cabe na etiqueta, na placa ou na folha.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, GROTESCA_500, GROTESCA_600, GROTESCA_700, SERIFA } from "./larguras";

// "serifa" = Young Serif (títulos, números); "g500"/"g600"/"g700" = Familjen Grotesk
export type NomeFonte = "serifa" | "g500" | "g600" | "g700";
export type Fonte = { nome: NomeFonte; espacamento?: number; caixaAlta?: boolean };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const TABELAS: Record<NomeFonte, number[]> = { serifa: SERIFA, g500: GROTESCA_500, g600: GROTESCA_600, g700: GROTESCA_700 };
// espaçamento entre letras de cada estilo do tema (em fração do corpo)
export const SERIFA_TITULO: Fonte = { nome: "serifa", espacamento: -0.01 };
export const ROTULO: Fonte = { nome: "g700", espacamento: 0.09, caixaAlta: true };

// Largura do texto em px num corpo `tamanho`.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = { nome: "g600" }) => {
  const t = fonte.caixaAlta ? texto.toLocaleUpperCase("pt-BR") : texto;
  const tabela = TABELAS[fonte.nome];
  const letras = [...t];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    const w = i === undefined ? -1 : tabela[i];
    // caractere fora da tabela (emoji, símbolo raro): uma largura média, um pouco generosa
    soma += w < 0 ? 640 : w;
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Largura de uma linha montada palavra por palavra (o componente Palavras usa margem fixa entre as
// palavras, `espaco` em fração do corpo, e não o caractere de espaço).
export const larguraLinha = (palavras: string[], tamanho: number, fonte: Fonte, espaco = 0.26) =>
  palavras.reduce((s, w) => s + larguraTexto(w, tamanho, fonte), 0) + Math.max(0, palavras.length - 1) * espaco * tamanho;

// Quebra em linhas que cabem em `largura`. Palavra maior que a linha fica sozinha.
export const quebrarLinhas = (texto: string, largura: number, tamanho: number, fonte: Fonte, espaco = 0.26) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[][] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    const tentativa = [...atual, p];
    if (!atual.length || larguraLinha(tentativa, tamanho, fonte, espaco) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = [p];
    }
  }
  if (atual.length) linhas.push(atual);
  // não deixa uma palavra curta sozinha no fim se der para equilibrar com a linha anterior
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2];
    if (ultima.length === 1 && penultima.length > 2) {
      const moveu = [penultima[penultima.length - 1], ...ultima];
      if (larguraLinha(moveu, tamanho, fonte, espaco) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1);
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas.map((l) => l.join(" "));
};

export type Encaixe = { tamanho: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra única maior que
// a caixa ("criptomoedas" numa etiqueta estreita) ganha um corpo menor ainda, até caber.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = { nome: "g600" }, espaco = 0.26 }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte; espaco?: number },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const quebra = quebrarLinhas(limpo, largura, tamanho, fonte, espaco);
      if (quebra.length <= k && quebra.every((l) => larguraLinha(l.split(" "), tamanho, fonte, espaco) <= largura)) return { tamanho, linhas: quebra };
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
  let tamanho = min;
  const maior = limpo.split(" ").reduce((a, b) => (larguraTexto(b, 1, fonte) > larguraTexto(a, 1, fonte) ? b : a), "");
  while (tamanho > 22 && larguraTexto(maior, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrarLinhas(limpo, largura, tamanho, fonte, espaco) };
};

// Um rótulo de uma linha só (etiqueta, chip): o maior corpo até `min`; abaixo disso, quebra em 2.
export const rotuloQueCabe = (texto: string, largura: number, max: number, min: number, fonte: Fonte = ROTULO) =>
  encaixar(texto, { largura, max, min, linhas: 1, fonte });

// ——— números em pt-BR ———

// 83000 → "83.000"; 1.5 → "1,5"; casas fixas quando pedidas
export const numeroBR = (v: number, casas?: number) => {
  const c = casas ?? (Number.isInteger(v) ? 0 : Math.min(2, (String(v).split(".")[1] ?? "").length));
  return v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
};
