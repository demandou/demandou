// Medidas de texto sem DOM: a largura de cada caractere da Hubot Sans (em frações do corpo),
// medida na própria fonte para cada corte usado. Com isso o template quebra linhas e escolhe o
// corpo antes de desenhar, e nada estoura a coluna.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüç ,.!?:;-/×+%$()\"'";

export type Corte = "larga" | "rotulo" | "normal600" | "normal700";

// larga = 900 a 125%; rotulo = 800 a 112,5%; normal = 600/700 a 100%
const TABELAS: Record<Corte, number[]> = {
  larga: [1.006, 0.887, 0.951, 0.935, 0.82, 0.801, 0.975, 0.983, 0.782, 0.546, 0.953, 0.769, 1.174, 0.973, 0.986, 0.864, 0.986, 0.93, 0.848, 0.876, 0.927, 1.013, 1.293, 1.038, 0.957, 0.844, 0.779, 0.779, 0.748, 0.779, 0.753, 0.502, 0.76, 0.768, 0.326, 0.326, 0.807, 0.326, 1.196, 0.768, 0.767, 0.779, 0.779, 0.494, 0.698, 0.505, 0.768, 0.786, 1.068, 0.834, 0.779, 0.654, 0.824, 0.519, 0.734, 0.73, 0.796, 0.742, 0.778, 0.748, 0.766, 0.778, 1.006, 1.006, 1.006, 1.006, 0.82, 0.82, 0.782, 0.986, 0.986, 0.986, 0.927, 0.927, 0.951, 0.779, 0.779, 0.779, 0.779, 0.753, 0.753, 0.326, 0.767, 0.767, 0.767, 0.768, 0.768, 0.748, 0.193, 0.296, 0.296, 0.293, 0.644, 0.296, 0.296, 0.427, 0.587, 0.721, 0.721, 0.98, 0.857, 0.407, 0.407, 0.484, 0.234],
  rotulo: [0.901, 0.804, 0.863, 0.847, 0.738, 0.72, 0.884, 0.886, 0.699, 0.488, 0.86, 0.687, 1.064, 0.88, 0.895, 0.78, 0.895, 0.835, 0.768, 0.786, 0.843, 0.905, 1.173, 0.924, 0.86, 0.767, 0.711, 0.711, 0.68, 0.711, 0.687, 0.454, 0.696, 0.7, 0.29, 0.29, 0.726, 0.29, 1.099, 0.7, 0.7, 0.711, 0.711, 0.445, 0.629, 0.456, 0.7, 0.714, 0.975, 0.745, 0.708, 0.596, 0.76, 0.469, 0.684, 0.685, 0.746, 0.694, 0.725, 0.691, 0.716, 0.725, 0.901, 0.901, 0.901, 0.901, 0.738, 0.738, 0.699, 0.895, 0.895, 0.895, 0.843, 0.843, 0.863, 0.711, 0.711, 0.711, 0.711, 0.687, 0.687, 0.29, 0.7, 0.7, 0.7, 0.7, 0.7, 0.68, 0.185, 0.265, 0.265, 0.267, 0.594, 0.265, 0.265, 0.407, 0.536, 0.684, 0.684, 0.917, 0.777, 0.373, 0.373, 0.445, 0.214],
  normal600: [0.786, 0.707, 0.765, 0.748, 0.647, 0.632, 0.783, 0.779, 0.602, 0.417, 0.744, 0.601, 0.933, 0.773, 0.793, 0.68, 0.793, 0.723, 0.678, 0.685, 0.749, 0.784, 1.041, 0.791, 0.745, 0.68, 0.625, 0.625, 0.596, 0.625, 0.606, 0.39, 0.615, 0.616, 0.239, 0.239, 0.622, 0.239, 0.985, 0.616, 0.617, 0.625, 0.625, 0.38, 0.544, 0.395, 0.616, 0.623, 0.864, 0.633, 0.618, 0.525, 0.686, 0.401, 0.623, 0.628, 0.684, 0.635, 0.66, 0.622, 0.65, 0.66, 0.786, 0.786, 0.786, 0.786, 0.647, 0.647, 0.602, 0.793, 0.793, 0.793, 0.749, 0.749, 0.765, 0.625, 0.625, 0.625, 0.625, 0.606, 0.606, 0.239, 0.617, 0.617, 0.617, 0.616, 0.616, 0.596, 0.176, 0.221, 0.221, 0.23, 0.529, 0.221, 0.221, 0.375, 0.469, 0.647, 0.647, 0.842, 0.688, 0.331, 0.331, 0.381, 0.181],
  normal700: [0.801, 0.723, 0.775, 0.762, 0.658, 0.641, 0.794, 0.793, 0.62, 0.434, 0.768, 0.61, 0.957, 0.789, 0.803, 0.699, 0.803, 0.743, 0.691, 0.699, 0.761, 0.801, 1.057, 0.815, 0.766, 0.691, 0.644, 0.644, 0.614, 0.644, 0.623, 0.408, 0.633, 0.636, 0.258, 0.258, 0.649, 0.258, 1.006, 0.636, 0.634, 0.644, 0.644, 0.399, 0.565, 0.411, 0.636, 0.642, 0.884, 0.661, 0.637, 0.54, 0.696, 0.421, 0.633, 0.637, 0.694, 0.645, 0.671, 0.634, 0.663, 0.671, 0.801, 0.801, 0.801, 0.801, 0.658, 0.658, 0.62, 0.803, 0.803, 0.803, 0.761, 0.761, 0.775, 0.644, 0.644, 0.644, 0.644, 0.623, 0.623, 0.258, 0.634, 0.634, 0.634, 0.636, 0.636, 0.614, 0.176, 0.237, 0.236, 0.244, 0.545, 0.236, 0.237, 0.385, 0.485, 0.647, 0.647, 0.853, 0.7, 0.342, 0.342, 0.408, 0.195],
};

const MEDIA: Record<Corte, number> = { larga: 0.9, rotulo: 0.8, normal600: 0.56, normal700: 0.58 };

// largura de um texto em px (as maiúsculas da `larga` e do `rotulo` são medidas como caixa-alta)
export const medir = (texto: string, tamanho: number, corte: Corte = "larga", espacamento = 0) => {
  const tabela = TABELAS[corte];
  const t = corte === "larga" || corte === "rotulo" ? texto.toUpperCase() : texto;
  let soma = 0;
  for (const c of t) {
    // o espaço entre palavras animadas é uma margem fixa de 0,26 do corpo (ver Palavras em anim.tsx)
    if (c === " ") {
      soma += 0.27;
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += i >= 0 ? tabela[i] : MEDIA[corte];
  }
  return (soma + espacamento * t.length) * tamanho;
};

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
export const quebrarMedindo = (texto: string, tamanho: number, largura: number, max: number, corte: Corte = "larga", espacamento = 0) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  const larguraDe = (l: string) => medir(l, tamanho, corte, espacamento);
  let melhor: string[] = [texto];
  let melhorMaior = Infinity;
  const teto = Math.min(max, palavras.length);
  for (let n = 1; n <= teto; n++) {
    // todas as divisões em n linhas (textos curtos: busca completa é barata)
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
// (e, se dada, nesta altura). Devolve as linhas já quebradas.
export const diagramar = (
  texto: string,
  { largura, maximo, minimo, linhas = 2, linhasMax, altura, entrelinha = 1, corte = "larga", espacamento = 0 }: {
    largura: number;
    maximo: number;
    minimo: number;
    linhas?: number;
    // se nem no corpo mínimo couber em `linhas`, tenta com até `linhasMax` linhas
    linhasMax?: number;
    altura?: number;
    entrelinha?: number;
    corte?: Corte;
    espacamento?: number;
  },
) => {
  for (let n = linhas; n <= Math.max(linhas, linhasMax ?? linhas); n++) {
    for (let tam = maximo; tam >= minimo; tam -= 2) {
      const ls = quebrarMedindo(texto, tam, largura, n, corte, espacamento);
      const cabe = ls.every((l) => medir(l, tam, corte, espacamento) <= largura);
      if (cabe && (altura === undefined || ls.length * tam * entrelinha <= altura)) return { linhas: ls, tam };
    }
  }
  return { linhas: quebrarMedindo(texto, minimo, largura, Math.max(linhas, linhasMax ?? linhas), corte, espacamento), tam: minimo };
};
