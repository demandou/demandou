// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais da Anuphan e da Sometype Mono (larguras.ts), quebra em linhas e reduz
// o corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
// O espaço entre palavras é uma margem fixa (VAO), igual à dos componentes de texto falado.
import { ANUPHAN_500, ANUPHAN_600, ANUPHAN_700, CARACTERES, MONO } from "./larguras";

export type Fonte = { peso?: 500 | 600 | 700; mono?: boolean; espacamento?: number; caixaAlta?: boolean };

// espaço entre palavras, em em (o mesmo das palavras animadas)
export const VAO = 0.27;

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

// Uma palavra longa demais para a linha é partida com hífen; o pedaço que continua começa com
// PARTE (um caractere invisível) para o texto falado saber que é a mesma palavra.
export const PARTE = "\u2060";
export const partida = (w: string) => w.startsWith(PARTE);

// Largura de uma palavra (sem espaços) em px, num corpo `tamanho`.
export const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte = {}) => {
  const t = (fonte.caixaAlta ? palavra.toUpperCase() : palavra).replace(PARTE, "");
  const letras = [...t];
  let soma = 0;
  if (fonte.mono) soma = letras.length * MONO;
  else {
    const tabela = fonte.peso === 500 ? ANUPHAN_500 : fonte.peso === 700 ? ANUPHAN_700 : ANUPHAN_600;
    for (const c of letras) {
      const i = indice.get(c);
      soma += i === undefined ? 640 : tabela[i];
    }
  }
  // 3% de folga: arredondamento e kerning do navegador
  return ((soma / 1000) * tamanho + (fonte.espacamento ?? 0) * tamanho * Math.max(0, letras.length - 1)) * 1.03;
};

// Largura de uma linha (palavras separadas pela margem fixa).
export const larguraLinha = (palavras: string[], tamanho: number, fonte: Fonte = {}) =>
  palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, fonte), 0) + Math.max(0, palavras.length - 1) * VAO * tamanho;

export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = {}) =>
  larguraLinha(texto.split(/\s+/).filter(Boolean), tamanho, fonte);

// parte uma palavra maior que a linha em pedaços com hífen
const partir = (p: string, largura: number, tamanho: number, fonte: Fonte) => {
  const pedacos: string[] = [];
  let atual = "";
  for (const c of [...p]) {
    if (atual.replace(PARTE, "").length >= 2 && larguraPalavra(`${atual}${c}-`, tamanho, fonte) > largura) {
      pedacos.push(`${atual}-`);
      atual = PARTE + c;
    } else atual += c;
  }
  pedacos.push(atual);
  return pedacos;
};

// Quebra em linhas que cabem em `largura`. Palavra maior que a linha é partida com hífen.
export const quebrar = (texto: string, largura: number, tamanho: number, fonte: Fonte = {}): string[][] => {
  const palavras = texto
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((p) => (larguraPalavra(p, tamanho, fonte) > largura ? partir(p, largura, tamanho, fonte) : [p]));
  const linhas: string[][] = [];
  let atual: string[] = [];
  for (const p of palavras) {
    const tentativa = [...atual, p];
    if (!atual.length || larguraLinha(tentativa, tamanho, fonte) <= largura) atual = tentativa;
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
      if (larguraLinha(moveu, tamanho, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1);
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

export type Encaixe = { tamanho: number; linhas: string[][] };

// o texto cabe em até `linhas` linhas nesse corpo, sem partir palavra?
export const cabe = (texto: string, largura: number, tamanho: number, linhas: number, fonte: Fonte = {}) => {
  const q = quebrar(texto, largura, tamanho, fonte);
  return q.length <= linhas && !q.flat().some(partida);
};

// Maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas. Se nem no mínimo
// cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra única maior que a caixa ganha um
// corpo menor ainda (nunca vaza na largura).
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { tamanho: max, linhas: [] };
  const melhorEm = (k: number) => {
    for (let tamanho = max; tamanho >= min; tamanho -= 2) {
      const q = quebrar(limpo, largura, tamanho, fonte);
      if (q.length <= k && !q.flat().some(partida)) return { tamanho, linhas: q };
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
  // nem no mínimo coube: fica no mínimo, com mais linhas (e palavra longa partida com hífen)
  return { tamanho: min, linhas: quebrar(limpo, largura, min, fonte) };
};

// Altura de um texto encaixado (linhas × corpo × entrelinha).
export const alturaTexto = (e: Encaixe, entrelinha = 1.1) => e.linhas.length * e.tamanho * entrelinha;

// ---------- números em pt-BR ----------

// 83000 → "83.000"; 1.5 com 1 casa → "1,5"
export const formatarNumero = (valor: number, casas = 0) => {
  const negativo = valor < 0;
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteiro, decimal] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhar}${decimal ? `,${decimal}` : ""}`;
};

// ---------- trechos dentro de um texto (destaque, risco) ----------

const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9$%]/g, "");

// Índices (na lista de palavras de `texto`) do trecho `alvo`.
export const indicesDoTrecho = (texto: string, alvo?: string) => {
  if (!alvo?.trim()) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) return new Set(as.map((_, k) => i + k));
  }
  return new Set<number>();
};
