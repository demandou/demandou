// Medidas de texto sem DOM: a largura de cada caractere da Schibsted Grotesk (em frações do corpo),
// medida no próprio navegador do render para cada peso usado. Com isso o template quebra as linhas e
// escolhe o corpo antes de desenhar, e nenhum texto estoura a coluna nem a caixa.
// A Martian Mono é monoespaçada: todo caractere mede 0,7 do corpo.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüç ,.!?:;-/×+%$()\"'“”–—º°";

export type Peso = 600 | 700 | 800;

const TABELAS: Record<Peso, number[]> = {
  600: [0.724, 0.666, 0.712, 0.721, 0.598, 0.575, 0.725, 0.74, 0.398, 0.568, 0.7, 0.566, 0.909, 0.752, 0.769, 0.65, 0.769, 0.667, 0.635, 0.671, 0.7, 0.7, 0.98, 0.703, 0.645, 0.619, 0.579, 0.613, 0.571, 0.613, 0.588, 0.359, 0.569, 0.59, 0.268, 0.291, 0.586, 0.284, 0.897, 0.603, 0.605, 0.614, 0.613, 0.436, 0.532, 0.365, 0.603, 0.585, 0.854, 0.588, 0.585, 0.528, 0.624, 0.381, 0.587, 0.592, 0.611, 0.602, 0.607, 0.554, 0.6, 0.608, 0.724, 0.724, 0.724, 0.724, 0.598, 0.598, 0.398, 0.769, 0.769, 0.769, 0.7, 0.7, 0.712, 0.579, 0.579, 0.579, 0.579, 0.588, 0.588, 0.268, 0.605, 0.605, 0.605, 0.603, 0.603, 0.571, 0.227, 0.282, 0.295, 0.265, 0.551, 0.295, 0.285, 0.473, 0.466, 0.635, 0.635, 0.888, 0.586, 0.333, 0.333, 0.382, 0.213, 0.506, 0.506, 0.5, 1, 0.455, 0.451],
  700: [0.738, 0.679, 0.717, 0.736, 0.606, 0.584, 0.73, 0.753, 0.426, 0.589, 0.726, 0.579, 0.935, 0.767, 0.768, 0.672, 0.768, 0.689, 0.648, 0.689, 0.718, 0.714, 1.008, 0.735, 0.659, 0.634, 0.596, 0.628, 0.583, 0.628, 0.596, 0.37, 0.578, 0.603, 0.284, 0.303, 0.607, 0.298, 0.913, 0.617, 0.611, 0.628, 0.628, 0.458, 0.544, 0.38, 0.617, 0.604, 0.88, 0.606, 0.609, 0.543, 0.632, 0.404, 0.597, 0.603, 0.628, 0.616, 0.616, 0.568, 0.612, 0.617, 0.738, 0.738, 0.738, 0.738, 0.606, 0.606, 0.426, 0.768, 0.768, 0.768, 0.718, 0.718, 0.717, 0.596, 0.596, 0.596, 0.596, 0.596, 0.596, 0.284, 0.611, 0.611, 0.611, 0.617, 0.617, 0.583, 0.21, 0.292, 0.304, 0.281, 0.564, 0.304, 0.296, 0.463, 0.479, 0.635, 0.635, 0.911, 0.6, 0.348, 0.348, 0.4, 0.221, 0.533, 0.533, 0.5, 1, 0.46, 0.463],
  800: [0.754, 0.693, 0.723, 0.752, 0.614, 0.594, 0.735, 0.767, 0.456, 0.61, 0.753, 0.593, 0.963, 0.783, 0.767, 0.695, 0.767, 0.712, 0.663, 0.707, 0.736, 0.728, 1.038, 0.769, 0.673, 0.65, 0.614, 0.643, 0.595, 0.643, 0.606, 0.382, 0.588, 0.618, 0.301, 0.315, 0.63, 0.312, 0.929, 0.632, 0.617, 0.644, 0.644, 0.481, 0.557, 0.396, 0.632, 0.625, 0.908, 0.626, 0.634, 0.558, 0.64, 0.429, 0.606, 0.614, 0.645, 0.631, 0.624, 0.583, 0.626, 0.626, 0.754, 0.754, 0.754, 0.754, 0.614, 0.614, 0.456, 0.767, 0.767, 0.767, 0.736, 0.736, 0.723, 0.614, 0.614, 0.614, 0.614, 0.606, 0.606, 0.301, 0.617, 0.617, 0.617, 0.632, 0.632, 0.595, 0.192, 0.304, 0.314, 0.297, 0.578, 0.314, 0.307, 0.454, 0.493, 0.635, 0.635, 0.936, 0.614, 0.364, 0.364, 0.419, 0.23, 0.561, 0.561, 0.5, 1, 0.466, 0.474],
};

// o espaço entre palavras animadas é uma margem fixa (ver ESPACO em anim.tsx), não o caractere
export const ESPACO = 0.26;
export const MONO = 0.7;

// largura de um texto em px; `espacamento` = letter-spacing em em
export const medir = (texto: string, tamanho: number, peso: Peso = 800, espacamento = 0) => {
  const tabela = TABELAS[peso];
  let soma = 0;
  for (const c of texto) {
    if (c === " ") {
      soma += ESPACO;
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += (i >= 0 ? tabela[i] : 0.62) + espacamento;
  }
  return soma * tamanho;
};

export const medirMono = (texto: string, tamanho: number, espacamento = 0.02) => texto.length * (MONO + espacamento) * tamanho;

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
export const quebrar = (texto: string, tamanho: number, largura: number, max: number, peso: Peso = 800, espacamento = 0) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  const larguraDe = (l: string) => medir(l, tamanho, peso, espacamento);
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

// O maior corpo (de `maximo` até `minimo`, de 2 em 2 px) em que o texto cabe em até `linhas` linhas
// nesta largura (e, se dada, nesta altura). Devolve as linhas já quebradas e o corpo.
export const diagramar = (
  texto: string,
  o: { largura: number; maximo: number; minimo: number; linhas: number; altura?: number; entrelinha?: number; peso?: Peso; espacamento?: number },
) => {
  const { largura, maximo, minimo, linhas, altura, entrelinha = 1.05, peso = 800, espacamento = 0 } = o;
  for (let tam = maximo; tam >= minimo; tam -= 2) {
    const ls = quebrar(texto, tam, largura, linhas, peso, espacamento);
    const cabe = ls.length <= linhas && ls.every((l) => medir(l, tam, peso, espacamento) <= largura);
    if (cabe && (altura === undefined || ls.length * tam * entrelinha <= altura)) return { linhas: ls, tam };
  }
  return { linhas: quebrar(texto, minimo, largura, linhas, peso, espacamento), tam: minimo };
};

// Exatamente `n` linhas equilibradas (a mais larga o menor possível) — para textos que devem
// ocupar a altura toda (a citação em três linhas grandes, em vez de duas menores).
export const emLinhas = (texto: string, n: number, tamanho: number, peso: Peso = 800, espacamento = 0) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= n) return palavras;
  let melhor: string[] = [];
  let melhorMaior = Infinity;
  const busca = (inicio: number, resto: number, atual: string[]) => {
    if (resto === 1) {
      const ls = [...atual, palavras.slice(inicio).join(" ")];
      const maior = Math.max(...ls.map((l) => medir(l, tamanho, peso, espacamento)));
      if (maior < melhorMaior) {
        melhorMaior = maior;
        melhor = ls;
      }
      return;
    }
    for (let k = inicio + 1; k <= palavras.length - resto + 1; k++) busca(k, resto - 1, [...atual, palavras.slice(inicio, k).join(" ")]);
  };
  busca(0, n, []);
  return melhor;
};

export const diagramarEm = (
  texto: string,
  n: number,
  o: { largura: number; maximo: number; minimo: number; altura?: number; entrelinha?: number; peso?: Peso },
) => {
  const { largura, maximo, minimo, altura, entrelinha = 1.05, peso = 800 } = o;
  for (let tam = maximo; tam >= minimo; tam -= 2) {
    const ls = emLinhas(texto, n, tam, peso);
    if (ls.every((l) => medir(l, tam, peso) <= largura) && (altura === undefined || ls.length * tam * entrelinha <= altura)) return { linhas: ls, tam };
  }
  return null;
};

// Robusto para qualquer texto que o plano mandar: tenta `diagramar` (do maior corpo até `minimo`, em até
// `linhas` linhas); se nem assim couber, continua diminuindo até `piso` (padrão 36 px) e aceita mais
// linhas, até onde a altura deixar. Nunca devolve linha mais larga que a coluna, salvo uma palavra
// sozinha maior que ela (então diminui até caber).
export const caber = (
  texto: string,
  o: { largura: number; maximo: number; minimo: number; linhas: number; altura?: number; entrelinha?: number; peso?: Peso; espacamento?: number; piso?: number },
) => {
  const { largura, linhas, altura, entrelinha = 1.05, peso = 800, espacamento = 0, piso = 36 } = o;
  const cabe = (ls: string[], tam: number, max: number) =>
    ls.length <= max && ls.every((l) => medir(l, tam, peso, espacamento) <= largura) && (altura === undefined || ls.length * tam * entrelinha <= altura);
  const d = diagramar(texto, o);
  if (cabe(d.linhas, d.tam, linhas)) return d;
  let ultimo = d;
  for (let tam = o.minimo - 2; tam >= piso; tam -= 2) {
    const maxLinhas = altura === undefined ? linhas + 2 : Math.max(1, Math.floor(altura / (tam * entrelinha)));
    for (let n = linhas; n <= Math.max(linhas, maxLinhas); n++) {
      const ls = quebrar(texto, tam, largura, n, peso, espacamento);
      ultimo = { linhas: ls, tam };
      if (cabe(ls, tam, Math.max(linhas, maxLinhas))) return ultimo;
    }
  }
  // última saída: uma palavra maior que a coluna; o corpo desce até ela caber
  const maior = Math.max(...ultimo.linhas.map((l) => medir(l, 1, peso, espacamento)));
  return { linhas: ultimo.linhas, tam: Math.max(24, Math.min(ultimo.tam, Math.floor(largura / Math.max(0.1, maior)))) };
};
