// Medir e encaixar texto: qualquer texto que o plano mandar cabe no lugar dele.
// Mede com as larguras reais das fontes (larguras.ts), quebra em linhas equilibradas e reduz o
// corpo até um mínimo legível. Nunca corta nem vaza: no pior caso aceita uma linha a mais e, só
// para uma palavra única maior que a caixa, um corpo menor.
import { CARACTERES, SANS_500, SERIF_500, SERIF_600, SERIF_I500, SERIF_I600 } from "./larguras";

// serif = Cormorant Garamond 600 · serif500 = 500 · italico = itálico 600 · italico500 = itálico 500
// sans = Jost 500 (sempre em caixa alta espaçada, como crédito de filme)
export type Fonte = "serif" | "serif500" | "italico" | "italico500" | "sans";

const TABELAS: Record<Fonte, number[]> = { serif: SERIF_600, serif500: SERIF_500, italico: SERIF_I600, italico500: SERIF_I500, sans: SANS_500 };
const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));

// Largura de uma palavra (sem espaços) em px. `espacamento` = letter-spacing em em (crédito).
export const larguraPalavra = (w: string, tamanho: number, fonte: Fonte = "serif", espacamento = 0) => {
  const texto = fonte === "sans" ? w.toUpperCase() : w;
  const letras = [...texto.normalize("NFC")];
  const tabela = TABELAS[fonte];
  let soma = 0;
  for (const c of letras) {
    const i = indice.get(c);
    soma += i === undefined ? 560 : tabela[i];
  }
  // 3% de folga: o navegador arredonda e aplica kerning
  return ((soma / 1000) * tamanho + espacamento * tamanho * letras.length) * 1.03;
};

// Largura de uma linha de palavras desenhadas como spans com margem fixa entre elas (`vao` em em).
export const larguraLinha = (palavras: string[], tamanho: number, fonteDe: (i: number) => Fonte = () => "serif", vao = 0.26, inicio = 0) =>
  palavras.reduce((soma, w, k) => soma + larguraPalavra(w, tamanho, fonteDe(inicio + k)), 0) + Math.max(0, palavras.length - 1) * vao * tamanho;

// Largura de um texto contínuo (com espaços normais) — créditos em caixa alta, rótulos.
export const larguraTexto = (texto: string, tamanho: number, fonte: Fonte = "serif", espacamento = 0) =>
  larguraPalavra(texto, tamanho, fonte, espacamento);

export type Encaixe = { tamanho: number; linhas: number[][] };

// Todas as divisões de n palavras em k linhas: fica a mais equilibrada que cabe na largura.
// Devolve as linhas como listas de índices das palavras, ou null se nenhuma cabe.
const melhorDivisao = (larguras: number[], vaoPx: number, k: number, largura: number): number[][] | null => {
  const n = larguras.length;
  if (k > n) return null;
  const linhaDe = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i < b; i++) s += larguras[i];
    return s + Math.max(0, b - a - 1) * vaoPx;
  };
  let melhor: number[][] | null = null;
  let pior = Infinity;
  const cortes: number[] = [];
  const tentar = (inicio: number, resto: number) => {
    if (resto === 1) {
      const limites = [0, ...cortes, n];
      let maior = 0;
      let multa = 0;
      for (let j = 0; j < limites.length - 1; j++) {
        const w = linhaDe(limites[j], limites[j + 1]);
        if (w > largura) return;
        maior = Math.max(maior, w);
        // uma palavra sozinha numa linha (com texto de 4+ palavras) fica feio
        if (n >= 4 && limites[j + 1] - limites[j] === 1) multa += largura * 0.18;
      }
      // a última linha bem mais curta que as outras também pesa um pouco
      const custo = maior + multa;
      if (custo < pior) {
        pior = custo;
        melhor = limites.slice(0, -1).map((a, j) => Array.from({ length: limites[j + 1] - a }, (_, x) => a + x));
      }
      return;
    }
    for (let c = inicio + 1; c <= n - (resto - 1); c++) {
      cortes.push(c);
      tentar(c, resto - 1);
      cortes.pop();
    }
  };
  tentar(0, k);
  return melhor;
};

// O maior corpo (de `max` a `min`, de 2 em 2) em que as palavras cabem em até `linhas` linhas na
// `largura` (e, se dada, na `altura`, com a `entrelinha`). Linhas equilibradas.
export const encaixar = (
  palavras: string[],
  {
    largura,
    max,
    min,
    linhas = 2,
    altura,
    entrelinha = 1.12,
    fonteDe = () => "serif",
    vao = 0.26,
  }: { largura: number; max: number; min: number; linhas?: number; altura?: number; entrelinha?: number; fonteDe?: (i: number) => Fonte; vao?: number },
): Encaixe => {
  const n = palavras.length;
  if (!n) return { tamanho: max, linhas: [] };
  const tentar = (tamanho: number, k: number) => {
    if (altura !== undefined && k * tamanho * entrelinha > altura) return null;
    const larguras = palavras.map((w, i) => larguraPalavra(w, tamanho, fonteDe(i)));
    return melhorDivisao(larguras, vao * tamanho, k, largura);
  };
  for (let tamanho = max; tamanho >= min; tamanho -= 2) {
    for (let k = 1; k <= Math.min(linhas, n); k++) {
      const d = tentar(tamanho, k);
      if (d) {
        // uma linha a menos vale a pena se custar pouco corpo (até ~12% menor): o bloco fica mais limpo
        if (k > 1) {
          for (let t2 = tamanho; t2 >= Math.max(min, tamanho * 0.88); t2 -= 2) {
            const d2 = tentar(t2, k - 1);
            if (d2) return { tamanho: t2, linhas: d2 };
          }
        }
        return { tamanho, linhas: d };
      }
    }
  }
  // não coube no mínimo: aceita uma linha a mais (ou duas)
  for (let k = linhas + 1; k <= Math.min(n, linhas + 2); k++) {
    const d = tentar(min, k);
    if (d) return { tamanho: min, linhas: d };
  }
  // uma palavra maior que a caixa: diminui até caber (sem limite de altura)
  let tamanho = min;
  while (tamanho > 20) {
    const larguras = palavras.map((w, i) => larguraPalavra(w, tamanho, fonteDe(i)));
    for (let k = 1; k <= n; k++) {
      const d = melhorDivisao(larguras, vao * tamanho, k, largura);
      if (d && (k <= linhas + 2 || tamanho <= 24)) return { tamanho, linhas: d };
    }
    tamanho -= 2;
  }
  return { tamanho: 20, linhas: palavras.map((_, i) => [i]) };
};

// Corpo de um crédito em caixa alta espaçada que cabe numa linha (do `max` ao `min`); null se não cabe.
export const corpoDoCredito = (texto: string, largura: number, max: number, min: number, espacamento = 0.34) => {
  for (let t = max; t >= min; t -= 1) if (larguraTexto(texto, t, "sans", espacamento) <= largura) return t;
  return null;
};

// ——— trechos dentro de um texto (destaque, risco) ———

export const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}%$]+/gu, "");

// Índices (na lista de palavras) das palavras do trecho `alvo` (a primeira ocorrência), ou vazio.
export const indicesDoTrecho = (palavras: string[], alvo?: string): Set<number> => {
  const saida = new Set<number>();
  if (!alvo?.trim()) return saida;
  const as = alvo.split(/\s+/).filter(Boolean).map(nucleo);
  const ws = palavras.map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => ws[i + k] === a)) {
      as.forEach((_, k) => saida.add(i + k));
      return saida;
    }
  }
  return saida;
};

// ——— números em pt-BR ———

export const formatarNumero = (valor: number, casas = 0) => {
  const fixo = Math.abs(valor).toFixed(Math.max(0, casas));
  const [inteiro, fracao] = fixo.split(".");
  const agrupado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "−" : ""}${agrupado}${fracao ? `,${fracao}` : ""}`;
};
