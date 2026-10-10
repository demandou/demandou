// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas equilibradas e reduz o
// corpo até um mínimo legível. Nunca corta nem vaza: no mínimo, aceita uma linha a mais.
import { CARACTERES, MAO_500, MAO_600, MAO_700, SERIF_400, SERIF_500, SERIF_600 } from "./larguras";

export type Fonte = { familia: "serif" | "mao"; peso?: number };

// espaço entre palavras: margem fixa (em frações do corpo), igual à de componentes/Texto.tsx
export const ESPACO = 0.27;

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
const tabela = ({ familia, peso = 400 }: Fonte) =>
  familia === "serif" ? (peso >= 600 ? SERIF_600 : peso >= 500 ? SERIF_500 : SERIF_400) : peso >= 700 ? MAO_700 : peso >= 600 ? MAO_600 : MAO_500;

const larguraDoCaractere = (c: string, t: number[], fonte: Fonte): number => {
  const i = indice.get(c);
  if (i !== undefined && t[i] > 0) return t[i];
  // letra acentuada fora da tabela: a largura da letra sem acento
  const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (base !== c && base.length === 1) return larguraDoCaractere(base, t, fonte);
  // fora da tabela: uma largura média um pouco generosa
  return fonte.familia === "serif" ? 600 : 480;
};

// Largura de uma palavra (sem espaços) em px, num corpo `tamanho`. 3% de folga para o kerning.
export const larguraPalavra = (palavra: string, tamanho: number, fonte: Fonte) => {
  const t = tabela(fonte);
  let soma = 0;
  for (const c of palavra) soma += larguraDoCaractere(c, t, fonte);
  return (soma / 1000) * tamanho * 1.03;
};

export const larguraLinha = (palavras: string[], tamanho: number, fonte: Fonte) =>
  palavras.reduce((s, p) => s + larguraPalavra(p, tamanho, fonte), 0) + ESPACO * tamanho * Math.max(0, palavras.length - 1);

export const separar = (texto: string) => texto.trim().split(/\s+/).filter(Boolean);

// Quebra gulosa: cada linha recebe palavras enquanto couber em `largura`.
const quebraGulosa = (palavras: string[], largura: number, tamanho: number, fonte: Fonte) => {
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
  return linhas;
};

// Quebra equilibrada: o mesmo número de linhas da quebra gulosa, mas com as linhas de tamanhos
// parecidos (nada de uma palavra sozinha na última linha).
export const quebrar = (texto: string | string[], largura: number, tamanho: number, fonte: Fonte) => {
  const palavras = Array.isArray(texto) ? texto : separar(texto);
  const gulosa = quebraGulosa(palavras, largura, tamanho, fonte);
  if (gulosa.length < 2) return gulosa;
  let lo = larguraLinha(palavras, tamanho, fonte) / gulosa.length;
  let hi = largura;
  let melhor = gulosa;
  for (let k = 0; k < 14; k++) {
    const meio = (lo + hi) / 2;
    const teste = quebraGulosa(palavras, meio, tamanho, fonte);
    if (teste.length <= gulosa.length && teste.every((l) => l.length === 1 || larguraLinha(l, tamanho, fonte) <= meio + 0.5)) {
      melhor = teste;
      hi = meio;
    } else lo = meio;
  }
  return melhor;
};

export type Encaixe = { tamanho: number; linhas: string[][] };

// Maior corpo (de `max` até `min`, de 2 em 2 px) em que o texto cabe em `linhas` linhas.
// Se nem no mínimo cabe, usa o mínimo e deixa quebrar em mais linhas; uma palavra única maior que a
// largura ("criptomoedas" numa coluna estreita) ganha um corpo menor ainda, até caber.
export const encaixar = (
  texto: string,
  { largura, max, min, linhas = 2, fonte }: { largura: number; max: number; min: number; linhas?: number; fonte: Fonte },
): Encaixe => {
  const palavras = separar(texto);
  if (!palavras.length) return { tamanho: max, linhas: [] };
  const cabe = (tamanho: number, k: number) => {
    const quebra = quebrar(palavras, largura, tamanho, fonte);
    return quebra.length <= k && quebra.every((l) => larguraLinha(l, tamanho, fonte) <= largura) ? quebra : null;
  };
  let achado: Encaixe | null = null;
  for (let tamanho = max; tamanho >= min; tamanho -= 2) {
    const q = cabe(tamanho, linhas);
    if (q) {
      achado = { tamanho, linhas: q };
      break;
    }
  }
  if (achado) {
    // menos linhas vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
    for (let k = 1; k < achado.linhas.length; k++) {
      for (let tamanho = achado.tamanho; tamanho >= Math.max(min, achado.tamanho * 0.88); tamanho -= 2) {
        const q = cabe(tamanho, k);
        if (q) return { tamanho, linhas: q };
      }
    }
    return achado;
  }
  let tamanho = min;
  const maior = palavras.reduce((a, b) => (larguraPalavra(b, 1, fonte) > larguraPalavra(a, 1, fonte) ? b : a), "");
  while (tamanho > 30 && larguraPalavra(maior, tamanho, fonte) > largura) tamanho -= 2;
  return { tamanho, linhas: quebrar(palavras, largura, tamanho, fonte) };
};

// Altura de um bloco de texto encaixado
export const alturaDe = (e: Encaixe, entrelinha: number) => e.linhas.length * e.tamanho * entrelinha;

// Largura da linha mais larga de um bloco encaixado
export const larguraDe = (e: Encaixe, fonte: Fonte) => Math.max(0, ...e.linhas.map((l) => larguraLinha(l, e.tamanho, fonte)));

// Números em pt-BR: 83.000 · 1,5 · 12,75
export const formatarNumero = (valor: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor);
