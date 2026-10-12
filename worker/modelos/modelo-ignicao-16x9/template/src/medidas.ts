// Medidas de texto sem DOM: a largura de cada caractere da Tomorrow (em frações do corpo), medida na
// própria fonte para os três pesos usados. Com isso o template escolhe o corpo e quebra as linhas
// antes de desenhar, e nenhum texto estoura a tela do painel.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüç ,.!?:;-/×+%$()\"'°·";

export type Peso = 500 | 600 | 700;

const TABELAS: Record<Peso, number[]> = {
  500: [0.687, 0.708, 0.649, 0.72, 0.634, 0.583, 0.72, 0.733, 0.395, 0.589, 0.679, 0.572, 0.899, 0.739, 0.703, 0.626, 0.703, 0.694, 0.67, 0.565, 0.713, 0.687, 0.918, 0.665, 0.66, 0.658, 0.585, 0.636, 0.571, 0.636, 0.592, 0.314, 0.636, 0.641, 0.271, 0.282, 0.552, 0.271, 1.032, 0.658, 0.614, 0.636, 0.636, 0.418, 0.567, 0.345, 0.636, 0.612, 0.885, 0.605, 0.59, 0.572, 0.672, 0.431, 0.651, 0.645, 0.636, 0.634, 0.68, 0.534, 0.681, 0.671, 0.687, 0.687, 0.687, 0.687, 0.634, 0.634, 0.395, 0.703, 0.703, 0.703, 0.713, 0.713, 0.649, 0.585, 0.585, 0.585, 0.585, 0.592, 0.592, 0.271, 0.614, 0.614, 0.614, 0.636, 0.636, 0.571, 0.237, 0.271, 0.271, 0.271, 0.597, 0.271, 0.271, 0.47, 0.476, 0.677, 0.624, 0.95, 0.67, 0.38, 0.38, 0.386, 0.236, 0.406, 0.271],
  600: [0.711, 0.727, 0.673, 0.732, 0.657, 0.611, 0.737, 0.749, 0.408, 0.635, 0.686, 0.591, 0.892, 0.752, 0.729, 0.657, 0.729, 0.718, 0.696, 0.587, 0.745, 0.697, 0.964, 0.683, 0.669, 0.669, 0.614, 0.656, 0.591, 0.656, 0.607, 0.341, 0.652, 0.658, 0.294, 0.306, 0.598, 0.294, 1.042, 0.672, 0.631, 0.654, 0.654, 0.436, 0.583, 0.364, 0.653, 0.623, 0.922, 0.608, 0.623, 0.586, 0.682, 0.455, 0.672, 0.668, 0.672, 0.666, 0.695, 0.569, 0.689, 0.699, 0.711, 0.711, 0.711, 0.711, 0.657, 0.657, 0.408, 0.729, 0.729, 0.729, 0.745, 0.745, 0.673, 0.614, 0.614, 0.614, 0.614, 0.607, 0.607, 0.294, 0.631, 0.631, 0.631, 0.653, 0.653, 0.591, 0.239, 0.289, 0.289, 0.3, 0.614, 0.289, 0.289, 0.464, 0.51, 0.673, 0.587, 0.97, 0.696, 0.392, 0.392, 0.422, 0.25, 0.435, 0.285],
  700: [0.736, 0.747, 0.67, 0.744, 0.68, 0.639, 0.818, 0.765, 0.42, 0.681, 0.692, 0.61, 0.885, 0.766, 0.754, 0.689, 0.754, 0.742, 0.722, 0.609, 0.777, 0.708, 1.01, 0.702, 0.678, 0.68, 0.632, 0.676, 0.61, 0.676, 0.621, 0.367, 0.669, 0.674, 0.317, 0.331, 0.643, 0.317, 1.052, 0.686, 0.648, 0.673, 0.673, 0.453, 0.599, 0.383, 0.671, 0.634, 0.96, 0.61, 0.657, 0.601, 0.692, 0.478, 0.683, 0.695, 0.709, 0.708, 0.715, 0.603, 0.696, 0.73, 0.736, 0.736, 0.736, 0.736, 0.68, 0.68, 0.42, 0.754, 0.754, 0.754, 0.777, 0.777, 0.67, 0.632, 0.632, 0.632, 0.632, 0.621, 0.621, 0.317, 0.648, 0.648, 0.648, 0.671, 0.671, 0.61, 0.246, 0.309, 0.309, 0.329, 0.618, 0.309, 0.309, 0.46, 0.544, 0.669, 0.55, 0.99, 0.722, 0.403, 0.403, 0.457, 0.264, 0.444, 0.299],
};

// o espaço entre palavras animadas é uma margem fixa (ver `Acende` em anim.tsx), nunca o caractere
export const ESPACO = 0.3;

// Largura de um texto em px. `caixaAlta` mede como o CSS vai desenhar (text-transform: uppercase);
// `espacamento` é o letter-spacing em em.
export const medir = (texto: string, tamanho: number, peso: Peso = 700, caixaAlta = true, espacamento = 0) => {
  const tabela = TABELAS[peso];
  const t = caixaAlta ? texto.toUpperCase() : texto;
  let soma = 0;
  for (const c of t) {
    if (c === " ") {
      soma += ESPACO;
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += (i >= 0 ? tabela[i] : 0.68) + espacamento;
  }
  return soma * tamanho;
};

type Opcoes = { peso?: Peso; caixaAlta?: boolean; espacamento?: number };

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
export const quebrar = (texto: string, tamanho: number, largura: number, max: number, o: Opcoes = {}) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  const larguraDe = (l: string) => medir(l, tamanho, o.peso, o.caixaAlta, o.espacamento);
  let melhor: string[] = [texto];
  let melhorMaior = Infinity;
  for (let n = 1; n <= Math.min(max, palavras.length); n++) {
    const busca = (inicio: number, resto: number, atual: string[]) => {
      if (resto === 1) {
        const ls = [...atual, palavras.slice(inicio).join(" ")];
        const maior = Math.max(...ls.map(larguraDe));
        if (maior < melhorMaior - 0.5) {
          melhorMaior = maior;
          melhor = ls;
        }
        return;
      }
      for (let k = inicio + 1; k <= palavras.length - resto + 1; k++) busca(k, resto - 1, [...atual, palavras.slice(inicio, k).join(" ")]);
    };
    busca(0, n, []);
    if (melhorMaior <= largura) return melhor;
  }
  return melhor;
};

// O maior corpo (de `maximo` até `minimo`) em que o texto cabe em até `linhas` linhas nesta largura
// (e, se dada, nesta altura). Devolve as linhas já quebradas e o corpo.
export const diagramar = (
  texto: string,
  {
    largura,
    maximo,
    minimo,
    linhas = 2,
    altura,
    entrelinha = 1.08,
    ...o
  }: { largura: number; maximo: number; minimo: number; linhas?: number; altura?: number; entrelinha?: number } & Opcoes,
) => {
  for (let tam = maximo; tam >= minimo; tam -= 2) {
    const ls = quebrar(texto, tam, largura, linhas, o);
    const cabe = ls.every((l) => medir(l, tam, o.peso, o.caixaAlta, o.espacamento) <= largura);
    if (cabe && (altura === undefined || ls.length * tam * entrelinha <= altura)) return { linhas: ls, tam };
  }
  return { linhas: quebrar(texto, minimo, largura, linhas, o), tam: minimo };
};
