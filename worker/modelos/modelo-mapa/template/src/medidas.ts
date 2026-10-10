// Medidas de texto sem DOM: a largura de cada caractere (em frações do corpo), medida na própria
// fonte, para cada corte usado. Com isso o template quebra linhas e escolhe o corpo antes de desenhar,
// e nada estoura a coluna nem a caixa do nó.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüç ,.!?:;-/×+%$()\"'·–—…ªº°=→";

export type Corte = "titulo" | "serifa700" | "texto500" | "texto600" | "texto700";

// titulo = Bitter 800; serifa700 = Bitter 700; textoNNN = Readex Pro no peso NNN
const TABELAS: Record<Corte, number[]> = {
  titulo: [0.716, 0.647, 0.626, 0.709, 0.602, 0.561, 0.706, 0.783, 0.368, 0.348, 0.722, 0.561, 0.864, 0.762, 0.726, 0.618, 0.73, 0.672, 0.602, 0.625, 0.739, 0.717, 1.02, 0.717, 0.651, 0.627, 0.568, 0.595, 0.518, 0.609, 0.55, 0.387, 0.581, 0.635, 0.328, 0.301, 0.607, 0.321, 0.954, 0.649, 0.577, 0.615, 0.595, 0.484, 0.506, 0.412, 0.637, 0.553, 0.849, 0.576, 0.569, 0.515, 0.631, 0.444, 0.572, 0.579, 0.621, 0.553, 0.594, 0.555, 0.602, 0.593, 0.716, 0.716, 0.716, 0.716, 0.602, 0.602, 0.368, 0.726, 0.726, 0.726, 0.739, 0.739, 0.626, 0.568, 0.568, 0.568, 0.568, 0.551, 0.551, 0.328, 0.577, 0.577, 0.577, 0.637, 0.637, 0.518, 0.17, 0.253, 0.243, 0.316, 0.464, 0.243, 0.248, 0.44, 0.352, 0.496, 0.534, 0.88, 0.598, 0.319, 0.319, 0.459, 0.262, 0.243, 0.6, 0.85, 0.773, 0.439, 0.468, 0.439, 0.523, 1],
  serifa700: [0.713, 0.647, 0.632, 0.712, 0.609, 0.562, 0.716, 0.787, 0.362, 0.342, 0.718, 0.558, 0.873, 0.772, 0.732, 0.61, 0.738, 0.667, 0.601, 0.612, 0.742, 0.709, 1.021, 0.711, 0.648, 0.623, 0.561, 0.589, 0.516, 0.604, 0.549, 0.374, 0.574, 0.633, 0.318, 0.291, 0.594, 0.31, 0.954, 0.644, 0.577, 0.608, 0.59, 0.47, 0.493, 0.395, 0.632, 0.544, 0.833, 0.569, 0.556, 0.504, 0.635, 0.432, 0.563, 0.576, 0.609, 0.547, 0.591, 0.538, 0.602, 0.591, 0.713, 0.713, 0.713, 0.713, 0.609, 0.609, 0.362, 0.732, 0.732, 0.732, 0.742, 0.742, 0.632, 0.561, 0.561, 0.561, 0.561, 0.55, 0.55, 0.318, 0.577, 0.577, 0.577, 0.632, 0.632, 0.516, 0.18, 0.244, 0.233, 0.321, 0.448, 0.233, 0.239, 0.446, 0.339, 0.499, 0.546, 0.868, 0.607, 0.316, 0.316, 0.434, 0.251, 0.233, 0.606, 0.856, 0.743, 0.438, 0.472, 0.441, 0.533, 1],
  texto500: [0.699, 0.688, 0.684, 0.756, 0.624, 0.607, 0.771, 0.767, 0.504, 0.65, 0.735, 0.603, 0.869, 0.798, 0.791, 0.643, 0.791, 0.698, 0.628, 0.602, 0.748, 0.715, 0.997, 0.692, 0.67, 0.667, 0.545, 0.639, 0.538, 0.641, 0.586, 0.394, 0.656, 0.609, 0.292, 0.282, 0.588, 0.269, 0.935, 0.609, 0.623, 0.64, 0.639, 0.421, 0.484, 0.389, 0.618, 0.584, 0.811, 0.577, 0.594, 0.506, 0.629, 0.521, 0.548, 0.549, 0.634, 0.577, 0.564, 0.546, 0.585, 0.559, 0.699, 0.699, 0.699, 0.699, 0.624, 0.624, 0.504, 0.791, 0.791, 0.791, 0.748, 0.748, 0.684, 0.545, 0.545, 0.545, 0.545, 0.586, 0.586, 0.259, 0.623, 0.623, 0.623, 0.618, 0.618, 0.538, 0.293, 0.274, 0.237, 0.26, 0.52, 0.237, 0.272, 0.411, 0.569, 0.5, 0.593, 0.881, 0.628, 0.374, 0.374, 0.434, 0.22, 0.237, 0.54, 0.889, 0.647, 0.373, 0.369, 0.532, 0.585, 1],
  texto600: [0.698, 0.694, 0.688, 0.764, 0.635, 0.613, 0.776, 0.774, 0.529, 0.659, 0.739, 0.606, 0.873, 0.803, 0.801, 0.653, 0.801, 0.701, 0.631, 0.629, 0.756, 0.716, 0.997, 0.7, 0.68, 0.675, 0.555, 0.649, 0.542, 0.647, 0.587, 0.394, 0.663, 0.622, 0.307, 0.3, 0.607, 0.286, 0.948, 0.622, 0.632, 0.649, 0.649, 0.438, 0.49, 0.394, 0.63, 0.596, 0.823, 0.592, 0.608, 0.528, 0.65, 0.542, 0.548, 0.569, 0.647, 0.586, 0.57, 0.551, 0.592, 0.568, 0.698, 0.698, 0.698, 0.698, 0.635, 0.635, 0.529, 0.801, 0.801, 0.801, 0.756, 0.756, 0.688, 0.555, 0.555, 0.555, 0.555, 0.587, 0.587, 0.274, 0.632, 0.632, 0.632, 0.63, 0.63, 0.542, 0.306, 0.281, 0.247, 0.283, 0.528, 0.247, 0.282, 0.429, 0.581, 0.516, 0.595, 0.922, 0.631, 0.382, 0.381, 0.456, 0.236, 0.247, 0.566, 0.91, 0.688, 0.382, 0.383, 0.532, 0.603, 1],
  texto700: [0.697, 0.701, 0.693, 0.772, 0.645, 0.618, 0.781, 0.78, 0.555, 0.667, 0.742, 0.61, 0.878, 0.808, 0.81, 0.662, 0.81, 0.704, 0.635, 0.655, 0.764, 0.716, 0.998, 0.707, 0.69, 0.683, 0.566, 0.658, 0.545, 0.654, 0.587, 0.395, 0.67, 0.636, 0.321, 0.317, 0.627, 0.304, 0.962, 0.636, 0.64, 0.658, 0.658, 0.456, 0.495, 0.399, 0.643, 0.607, 0.834, 0.607, 0.621, 0.55, 0.672, 0.563, 0.548, 0.589, 0.661, 0.595, 0.577, 0.555, 0.598, 0.576, 0.697, 0.697, 0.697, 0.697, 0.645, 0.645, 0.555, 0.81, 0.81, 0.81, 0.764, 0.764, 0.693, 0.566, 0.566, 0.566, 0.566, 0.587, 0.587, 0.29, 0.64, 0.64, 0.64, 0.643, 0.643, 0.545, 0.319, 0.288, 0.256, 0.307, 0.537, 0.256, 0.292, 0.446, 0.593, 0.532, 0.597, 0.964, 0.635, 0.39, 0.389, 0.478, 0.251, 0.256, 0.592, 0.931, 0.73, 0.39, 0.398, 0.532, 0.622, 1],
};

const MEDIA: Record<Corte, number> = { titulo: 0.575, serifa700: 0.571, texto500: 0.589, texto600: 0.6, texto700: 0.61 };

// largura de um texto em px. `caixaAlta` mede como maiúsculas; `espacamento` em em por caractere.
export const medir = (texto: string, tamanho: number, corte: Corte = "titulo", espacamento = 0, caixaAlta = false) => {
  const tabela = TABELAS[corte];
  const t = caixaAlta ? texto.toUpperCase() : texto;
  let soma = 0;
  for (const c of t) {
    // o espaço entre palavras animadas é uma margem fixa de 0,26 do corpo (ver Palavras em anim.tsx)
    if (c === " ") {
      soma += 0.26;
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += i >= 0 ? tabela[i] : MEDIA[corte];
  }
  return (soma + espacamento * t.length) * tamanho;
};

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
// `equilibrar`: entre as quebras com a mesma linha mais larga, fica a de linhas mais parecidas
// (evita uma palavra sozinha na primeira linha: "Ciclo / de alta das / criptomoedas").
export const quebrarMedindo = (texto: string, tamanho: number, largura: number, max: number, corte: Corte = "titulo", equilibrar = false) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  const larguraDe = (l: string) => medir(l, tamanho, corte);
  let melhor: string[] = [texto];
  let melhorMaior = Infinity;
  let melhorDesvio = Infinity;
  const teto = Math.min(max, palavras.length);
  for (let n = 1; n <= teto; n++) {
    const busca = (inicio: number, resto: number, atual: string[]) => {
      if (resto === 1) {
        const ls = [...atual, palavras.slice(inicio).join(" ")];
        const ws = ls.map(larguraDe);
        const maior = Math.max(...ws);
        const desvio = equilibrar ? ws.reduce((s, w) => s + (maior - w) ** 2, 0) : 0;
        if (maior < melhorMaior - 0.5 || (equilibrar && maior <= melhorMaior + 0.5 && desvio < melhorDesvio - 1 && ls.length === melhor.length)) {
          melhorMaior = Math.min(melhorMaior, maior);
          melhorDesvio = desvio;
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
// (e, se dada, nesta altura). Devolve o corpo e as linhas já quebradas.
export const diagramar = (
  texto: string,
  { largura, maximo, minimo, linhas = 2, altura, entrelinha = 1.05, corte = "titulo", equilibrar = false }: {
    largura: number;
    maximo: number;
    minimo: number;
    linhas?: number;
    altura?: number;
    entrelinha?: number;
    corte?: Corte;
    equilibrar?: boolean;
  },
) => {
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const ls = quebrarMedindo(texto, tamanho, largura, linhas, corte, equilibrar);
    const cabe = ls.length <= linhas && Math.max(...ls.map((l) => medir(l, tamanho, corte))) <= largura;
    const cabeAltura = altura === undefined || ls.length * tamanho * entrelinha <= altura;
    if (cabe && cabeAltura) return { tamanho, linhas: ls };
  }
  return { tamanho: minimo, linhas: quebrarMedindo(texto, minimo, largura, linhas + 1, corte, equilibrar) };
};
