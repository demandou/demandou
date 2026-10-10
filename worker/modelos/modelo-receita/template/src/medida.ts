// Medir e encaixar texto: qualquer texto que o plano mandar cabe na caixa dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: palavra enorme sozinha ganha um corpo menor ainda.
import { CARACTERES, DISPLAY, DISPLAY_IT, TEXTO, TEXTO_IT } from "./larguras";

// "display": DM Serif Display (títulos, números); "texto": DM Serif Text (rótulos, itens, anotações)
export type Familia = "display" | "texto";
export type Fonte = { familia?: Familia; italico?: boolean; caixaAlta?: boolean; espacamento?: number };

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const tabela = (f: Fonte) => (f.familia === "texto" ? (f.italico ? TEXTO_IT : TEXTO) : f.italico ? DISPLAY_IT : DISPLAY);

// O Escrita põe as palavras com uma margem fixa de 0,24 do corpo entre elas (nunca o espaço).
export const VAO = 0.24;

// Largura de uma palavra (sem espaços) em px, num corpo `corpo`.
export const larguraPalavra = (palavra: string, corpo: number, f: Fonte = {}) => {
  const t = f.caixaAlta ? palavra.toUpperCase() : palavra;
  const tab = tabela(f);
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    const i = indice.get(c);
    const w = i === undefined ? -1 : tab[i];
    soma += w < 0 ? 640 : w;
  }
  // 2% de folga (arredondamento e kerning do navegador)
  return ((soma / 1000) * corpo + (f.espacamento ?? 0) * corpo * Math.max(0, letras.length - 1)) * 1.02;
};

// Largura de uma linha como o Escrita a desenha (palavras com a margem fixa entre elas).
export const larguraLinha = (linha: string, corpo: number, f: Fonte = {}) => {
  const ws = linha.split(/\s+/).filter(Boolean);
  if (!ws.length) return 0;
  return ws.reduce((s, w) => s + larguraPalavra(w, corpo, f), 0) + VAO * corpo * (ws.length - 1);
};

// Quebra em linhas que cabem em `largura` (palavra por palavra), sem deixar uma palavra curta sozinha
// no fim quando dá para equilibrar.
export const quebrarLinhas = (texto: string, largura: number, corpo: number, f: Fonte = {}) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const w of ws) {
    const tentativa = atual ? `${atual} ${w}` : w;
    if (!atual || larguraLinha(tentativa, corpo, f) <= largura) atual = tentativa;
    else {
      linhas.push(atual);
      atual = w;
    }
  }
  if (atual) linhas.push(atual);
  // equilibra as duas últimas linhas (a última nunca fica com uma palavra só se der para mover outra)
  if (linhas.length >= 2) {
    const ultima = linhas[linhas.length - 1].split(" ");
    const penultima = linhas[linhas.length - 2].split(" ");
    while (penultima.length > 1) {
      const nova = [penultima[penultima.length - 1], ...ultima].join(" ");
      const larguraNova = larguraLinha(nova, corpo, f);
      const larguraVelha = larguraLinha(penultima.slice(0, -1).join(" "), corpo, f);
      if (larguraNova > largura || larguraNova > larguraVelha + corpo * 0.6) break;
      ultima.unshift(penultima.pop() as string);
    }
    linhas[linhas.length - 2] = penultima.join(" ");
    linhas[linhas.length - 1] = ultima.join(" ");
  }
  return linhas;
};

export type Encaixe = { corpo: number; linhas: string[]; largura: number };

// Maior corpo (de `max` até `min`) em que o texto cabe em até `linhas` linhas da `largura`.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra única maior que a
// largura faz o corpo descer abaixo do mínimo só o bastante para ela caber.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte = {} }: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const medir = (corpo: number, ls: string[]) => Math.max(0, ...ls.map((l) => larguraLinha(l, corpo, fonte)));
  const melhorEm = (k: number) => {
    for (let corpo = max; corpo >= min; corpo -= 2) {
      const q = quebrarLinhas(limpo, largura, corpo, fonte);
      if (q.length <= k && medir(corpo, q) <= largura) return { corpo, linhas: q, largura: medir(corpo, q) };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor)
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.corpo >= melhor.corpo * 0.88) return menos;
    }
    return melhor;
  }
  let corpo = min;
  const maior = limpo.split(" ").reduce((a, b) => (larguraPalavra(b, 1, fonte) > larguraPalavra(a, 1, fonte) ? b : a), "");
  while (corpo > 26 && larguraPalavra(maior, corpo, fonte) > largura) corpo -= 2;
  const q = quebrarLinhas(limpo, largura, corpo, fonte);
  return { corpo, linhas: q, largura: medir(corpo, q) };
};

// Encaixa respeitando quebras de linha já escolhidas no plano (lista de linhas): cada linha pode
// ainda quebrar se não couber; o corpo é o mesmo para todas.
export const encaixarLinhas = (
  linhas: string[],
  opcoes: { largura: number; max: number; min: number; linhas?: number; fonte?: Fonte },
): Encaixe => {
  const limite = opcoes.linhas ?? Math.max(linhas.length, 2);
  const fonte = opcoes.fonte ?? {};
  for (let corpo = opcoes.max; corpo >= opcoes.min; corpo -= 2) {
    const q = linhas.flatMap((l) => quebrarLinhas(l, opcoes.largura, corpo, fonte));
    const larg = Math.max(0, ...q.map((l) => larguraLinha(l, corpo, fonte)));
    if (q.length <= limite && larg <= opcoes.largura) return { corpo, linhas: q, largura: larg };
  }
  return encaixar(linhas.join(" "), { ...opcoes, linhas: limite });
};

// ---------- números em pt-BR ----------

// 83000 → "83.000"; 1.5 (casas 1) → "1,5"
export const numeroBR = (v: number, casas = 0) => {
  const fixo = Math.abs(v).toFixed(casas);
  const [inteiro, frac] = fixo.split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${v < 0 ? "−" : ""}${milhar}${frac ? `,${frac}` : ""}`;
};

// casas decimais de um valor (para contar 1,5 com uma casa sem o plano precisar dizer)
export const casasDe = (v: number) => {
  const s = String(v);
  return s.includes(".") ? Math.min(2, s.split(".")[1].length) : 0;
};
