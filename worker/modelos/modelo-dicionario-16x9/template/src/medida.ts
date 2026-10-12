// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas e reduz o corpo até um
// mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais (e, se uma palavra
// sozinha não cabe na linha, ela ganha um corpo menor ainda).
import * as L from "./larguras";

export type Fonte = {
  // serif = Source Serif 4 reta; italico = Source Serif 4 itálica; sans = Source Sans 3
  familia?: "serif" | "italico" | "sans";
  peso?: 400 | 600 | 700 | 800;
  caixaAlta?: boolean;
  // espaçamento entre letras, em frações do corpo (ex.: 0.15 = "0.15em")
  espacamento?: number;
};

const indice = new Map<string, number>([...L.CARACTERES].map((c, i) => [c, i]));

const tabela = (f: Fonte): number[] => {
  const peso = f.peso ?? 400;
  if (f.familia === "sans") return peso >= 800 ? L.SANS_800 : peso >= 700 ? L.SANS_700 : L.SANS_600;
  if (f.familia === "italico") return peso >= 700 ? L.ITALICO_700 : peso >= 600 ? L.ITALICO_600 : L.ITALICO_400;
  return peso >= 800 ? L.SERIF_800 : peso >= 700 ? L.SERIF_700 : peso >= 600 ? L.SERIF_600 : L.SERIF_400;
};

// sem acento, para achar a largura de um caractere fora da tabela pela letra-base
const base = (c: string) => c.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Largura do texto em px num corpo `corpo` (a fonte que o Google Fonts entrega não muda de desenho
// com o tamanho: uma tabela por peso basta).
export const larguraTexto = (texto: string, corpo: number, fonte: Fonte = {}) => {
  const t = fonte.caixaAlta ? texto.toLocaleUpperCase("pt-BR") : texto;
  const tab = tabela(fonte);
  let soma = 0;
  const letras = [...t];
  for (const c of letras) {
    let i = indice.get(c);
    if (i === undefined) i = indice.get(base(c));
    const v = i === undefined ? -1 : tab[i];
    // caractere fora da tabela: uma largura generosa
    soma += v < 0 ? 640 : v;
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * corpo + (fonte.espacamento ?? 0) * corpo * Math.max(0, letras.length - 1)) * 1.03;
};

// Quebra em linhas que cabem em `largura` (palavra por palavra). Palavra maior que a linha fica sozinha.
// " / " no texto força uma quebra.
export const quebrarLinhas = (texto: string, largura: number, corpo: number, fonte: Fonte = {}) => {
  const linhas: string[] = [];
  for (const trecho of texto.split(/\s+\/\s+/)) {
    let atual = "";
    for (const p of trecho.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${p}` : p;
      if (!atual || larguraTexto(tentativa, corpo, fonte) <= largura) atual = tentativa;
      else {
        linhas.push(atual);
        atual = p;
      }
    }
    if (atual) linhas.push(atual);
  }
  // não deixa uma palavra curta sozinha no fim se der para equilibrar com a linha anterior
  if (linhas.length >= 2 && !/\s\/\s/.test(texto)) {
    const ultima = linhas[linhas.length - 1];
    const penultima = linhas[linhas.length - 2].split(" ");
    if (!ultima.includes(" ") && penultima.length > 2) {
      const moveu = `${penultima[penultima.length - 1]} ${ultima}`;
      if (larguraTexto(moveu, corpo, fonte) <= largura) {
        linhas[linhas.length - 2] = penultima.slice(0, -1).join(" ");
        linhas[linhas.length - 1] = moveu;
      }
    }
  }
  return linhas;
};

export type Encaixe = { corpo: number; linhas: string[] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas e, se
// `altura` for dada, nessa altura (com a entrelinha `entrelinha`). Se nem no mínimo cabe, usa o
// mínimo e deixa quebrar em mais linhas; palavra única maior que a caixa ganha um corpo menor.
export const encaixar = (
  texto: string,
  {
    largura,
    max,
    min,
    linhas = 2,
    altura,
    entrelinha = 1.15,
    fonte = {},
  }: { largura: number; max: number; min: number; linhas?: number; altura?: number; entrelinha?: number; fonte?: Fonte },
): Encaixe => {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return { corpo: min, linhas: [] };
  const cabe = (corpo: number, k: number) => {
    const q = quebrarLinhas(limpo, largura, corpo, fonte);
    if (q.length > k || q.some((l) => larguraTexto(l, corpo, fonte) > largura)) return null;
    if (altura !== undefined && q.length * corpo * entrelinha > altura) return null;
    return q;
  };
  const melhorEm = (k: number): Encaixe | null => {
    for (let corpo = max; corpo >= min; corpo -= 2) {
      const q = cabe(corpo, k);
      if (q) return { corpo, linhas: q };
    }
    return null;
  };
  const melhor = melhorEm(linhas);
  if (melhor) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
    for (let k = 1; k < melhor.linhas.length; k++) {
      const menos = melhorEm(k);
      if (menos && menos.corpo >= melhor.corpo * 0.88) return menos;
    }
    return melhor;
  }
  // não coube: corpo mínimo, quantas linhas precisar; uma palavra longa demais encolhe até caber
  let corpo = min;
  const maiorPalavra = limpo.split(" ").reduce((a, p) => (larguraTexto(p, min, fonte) > larguraTexto(a, min, fonte) ? p : a), "");
  while (corpo > 20 && larguraTexto(maiorPalavra, corpo, fonte) > largura) corpo -= 2;
  return { corpo, linhas: quebrarLinhas(limpo, largura, corpo, fonte) };
};

// O maior corpo em que uma linha só cabe na largura (sem quebrar), entre min e max.
export const corpoDeUmaLinha = (texto: string, largura: number, max: number, min: number, fonte: Fonte = {}) => {
  for (let corpo = max; corpo > min; corpo -= 2) if (larguraTexto(texto, corpo, fonte) <= largura) return corpo;
  return min;
};

// ---------- números em pt-BR ----------

export const formatarNumero = (valor: number, casas = 0) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

const ate999 = (n: number): string => {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (r) {
    if (r < 20) partes.push(UNIDADES[r]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
};

// Número inteiro por extenso (até centenas de bilhões). Fora disso, devolve null.
export const porExtenso = (n: number): string | null => {
  if (!Number.isInteger(n) || n < 0 || n >= 1e12) return null;
  if (n === 0) return "zero";
  const grupos = [
    { valor: Math.floor(n / 1e9) % 1000, um: "um bilhão", varios: "bilhões" },
    { valor: Math.floor(n / 1e6) % 1000, um: "um milhão", varios: "milhões" },
    { valor: Math.floor(n / 1e3) % 1000, um: "mil", varios: "mil" },
    { valor: n % 1000, um: "um", varios: "" },
  ];
  const partes: { texto: string; valor: number }[] = [];
  grupos.forEach((g, i) => {
    if (!g.valor) return;
    if (i === 3) partes.push({ texto: ate999(g.valor), valor: g.valor });
    else if (g.valor === 1) partes.push({ texto: g.um, valor: g.valor });
    else partes.push({ texto: `${ate999(g.valor)} ${g.varios}`, valor: g.valor });
  });
  // "e" antes do último grupo quando ele é menor que 100 ou uma centena redonda
  return partes
    .map((p, i) => {
      if (i === 0) return p.texto;
      const ultimo = i === partes.length - 1;
      return ultimo && (p.valor < 100 || p.valor % 100 === 0) ? `e ${p.texto}` : p.texto;
    })
    .join(" ");
};
