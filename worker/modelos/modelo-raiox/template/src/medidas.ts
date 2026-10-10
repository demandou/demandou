// Medidas de texto sem DOM: a largura de cada caractere (em frações do corpo), medida na própria
// fonte (Inclusive Sans 500/600/700 e Reddit Mono, que é monoespaçada). Com isso o template escolhe
// o corpo e quebra as linhas antes de desenhar, e nenhum título estoura a coluna.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüç ,.!?:;-/×+%$()\"'°·";

export type Corte = "sans500" | "sans600" | "sans700" | "mono";

const TABELAS: Record<Exclude<Corte, "mono">, number[]> = {
  sans500: [0.617, 0.67, 0.687, 0.694, 0.572, 0.553, 0.735, 0.718, 0.495, 0.543, 0.632, 0.542, 0.88, 0.71, 0.749, 0.614, 0.746, 0.662, 0.602, 0.573, 0.685, 0.614, 0.964, 0.611, 0.603, 0.546, 0.609, 0.621, 0.541, 0.638, 0.576, 0.383, 0.615, 0.594, 0.258, 0.287, 0.546, 0.251, 0.947, 0.599, 0.588, 0.614, 0.621, 0.408, 0.52, 0.377, 0.603, 0.512, 0.871, 0.503, 0.519, 0.494, 0.642, 0.476, 0.555, 0.583, 0.628, 0.603, 0.574, 0.491, 0.618, 0.573, 0.617, 0.617, 0.617, 0.617, 0.572, 0.572, 0.495, 0.749, 0.749, 0.749, 0.685, 0.685, 0.687, 0.609, 0.609, 0.609, 0.609, 0.576, 0.576, 0.232, 0.588, 0.588, 0.588, 0.603, 0.603, 0.541, 0.3, 0.254, 0.303, 0.32, 0.517, 0.318, 0.288, 0.501, 0.467, 0.565, 0.619, 0.881, 0.611, 0.337, 0.337, 0.485, 0.295, 0.373, 0.315],
  sans600: [0.643, 0.686, 0.686, 0.709, 0.581, 0.565, 0.731, 0.736, 0.514, 0.559, 0.648, 0.561, 0.893, 0.721, 0.753, 0.626, 0.74, 0.681, 0.606, 0.585, 0.689, 0.639, 0.973, 0.627, 0.624, 0.548, 0.61, 0.627, 0.545, 0.649, 0.584, 0.392, 0.624, 0.609, 0.263, 0.286, 0.567, 0.273, 0.961, 0.612, 0.596, 0.614, 0.638, 0.413, 0.537, 0.389, 0.61, 0.528, 0.895, 0.529, 0.531, 0.505, 0.659, 0.494, 0.565, 0.59, 0.645, 0.61, 0.587, 0.497, 0.635, 0.585, 0.643, 0.643, 0.643, 0.643, 0.581, 0.581, 0.514, 0.753, 0.753, 0.753, 0.689, 0.689, 0.686, 0.61, 0.61, 0.61, 0.61, 0.584, 0.584, 0.236, 0.596, 0.596, 0.596, 0.61, 0.61, 0.545, 0.3, 0.274, 0.315, 0.341, 0.522, 0.325, 0.31, 0.513, 0.475, 0.573, 0.624, 0.915, 0.625, 0.365, 0.365, 0.525, 0.312, 0.373, 0.324],
  sans700: [0.669, 0.701, 0.684, 0.723, 0.589, 0.577, 0.726, 0.754, 0.533, 0.575, 0.665, 0.579, 0.905, 0.732, 0.758, 0.638, 0.734, 0.699, 0.611, 0.596, 0.694, 0.663, 0.983, 0.642, 0.645, 0.549, 0.61, 0.633, 0.55, 0.66, 0.591, 0.4, 0.632, 0.624, 0.268, 0.284, 0.588, 0.296, 0.974, 0.624, 0.604, 0.613, 0.655, 0.419, 0.554, 0.4, 0.616, 0.544, 0.918, 0.555, 0.543, 0.516, 0.677, 0.512, 0.574, 0.598, 0.661, 0.616, 0.6, 0.502, 0.653, 0.597, 0.669, 0.669, 0.669, 0.669, 0.589, 0.589, 0.533, 0.758, 0.758, 0.758, 0.694, 0.694, 0.684, 0.61, 0.61, 0.61, 0.61, 0.591, 0.591, 0.24, 0.604, 0.604, 0.604, 0.616, 0.616, 0.55, 0.3, 0.293, 0.328, 0.361, 0.528, 0.333, 0.333, 0.526, 0.482, 0.582, 0.629, 0.95, 0.639, 0.394, 0.394, 0.566, 0.329, 0.373, 0.333],
};

// Reddit Mono: todo caractere tem a mesma largura
const MONO = 0.563;

// largura de um texto em px. `espacamento` em em (letter-spacing); o espaço entre palavras animadas
// é uma margem fixa de 0,28 do corpo (ver Palavras em anim.tsx)
export const medir = (texto: string, tamanho: number, corte: Corte = "sans700", espacamento = 0) => {
  if (corte === "mono") return [...texto].length * (MONO + espacamento) * tamanho;
  const tabela = TABELAS[corte];
  let soma = 0;
  for (const c of texto) {
    if (c === " ") {
      soma += 0.28;
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += (i >= 0 ? tabela[i] : 0.62) + espacamento;
  }
  return soma * tamanho;
};

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
export const quebrar = (texto: string, tamanho: number, largura: number, max: number, corte: Corte = "sans700") => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return { linhas: [palavras.join(" ")], cabe: medir(texto, tamanho, corte) <= largura };
  const larguraDe = (l: string) => medir(l, tamanho, corte);
  let melhor: string[] = [texto];
  let melhorMaior = Infinity;
  const teto = Math.min(max, palavras.length);
  for (let n = 1; n <= teto; n++) {
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
    if (melhorMaior <= largura) return { linhas: melhor, cabe: true };
  }
  return { linhas: melhor, cabe: false };
};

// Diagrama um texto numa coluna: o maior corpo (de `maximo` a `minimo`, de 2 em 2 px) em que ele cabe
// em até `max` linhas. Se nem no mínimo couber, fica no mínimo com as linhas mais equilibradas.
export const diagramar = (texto: string, largura: number, maximo: number, minimo: number, max: number, corte: Corte = "sans700") => {
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const r = quebrar(texto, tamanho, largura, max, corte);
    if (r.cabe) return { tamanho, linhas: r.linhas };
  }
  return { tamanho: minimo, linhas: quebrar(texto, minimo, largura, max, corte).linhas };
};
