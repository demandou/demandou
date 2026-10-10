// Medidas de texto sem DOM: a largura de cada caractere da Schibsted Grotesk (em frações do corpo),
// medida na própria fonte, em cada peso usado. Com isso o template escolhe o corpo e quebra as
// linhas antes de desenhar, e nada estoura a tarja, a coluna ou o painel.

const CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÁÂÃÀÉÊÍÓÔÕÚÜÇáâãàéêíóôõúüçÑñ ,.!?:;-–/×+%$()\"'·…▲▼";

export type Peso = 600 | 700 | 800 | 900;

const TABELAS: Record<Peso, number[]> = {
  600: [0.724, 0.666, 0.712, 0.721, 0.598, 0.575, 0.725, 0.74, 0.398, 0.568, 0.7, 0.566, 0.909, 0.752, 0.769, 0.65, 0.769, 0.667, 0.635, 0.671, 0.7, 0.7, 0.98, 0.703, 0.645, 0.619, 0.579, 0.613, 0.571, 0.613, 0.588, 0.359, 0.569, 0.59, 0.268, 0.291, 0.586, 0.284, 0.897, 0.603, 0.605, 0.614, 0.613, 0.436, 0.532, 0.365, 0.603, 0.585, 0.854, 0.588, 0.585, 0.528, 0.624, 0.381, 0.587, 0.592, 0.611, 0.602, 0.607, 0.554, 0.6, 0.608, 0.724, 0.724, 0.724, 0.724, 0.598, 0.598, 0.398, 0.769, 0.769, 0.769, 0.7, 0.7, 0.712, 0.579, 0.579, 0.579, 0.579, 0.588, 0.588, 0.268, 0.605, 0.605, 0.605, 0.603, 0.603, 0.571, 0.752, 0.603, 0.227, 0.282, 0.295, 0.265, 0.551, 0.295, 0.285, 0.473, 0.5, 0.466, 0.635, 0.635, 0.888, 0.586, 0.333, 0.333, 0.382, 0.213, 0.295, 0.786, 0.99, 0.99],
  700: [0.738, 0.679, 0.717, 0.736, 0.606, 0.584, 0.73, 0.753, 0.426, 0.589, 0.726, 0.579, 0.935, 0.767, 0.768, 0.672, 0.768, 0.689, 0.648, 0.689, 0.718, 0.714, 1.008, 0.735, 0.659, 0.634, 0.596, 0.628, 0.583, 0.628, 0.596, 0.37, 0.578, 0.603, 0.284, 0.303, 0.607, 0.298, 0.913, 0.617, 0.611, 0.628, 0.628, 0.458, 0.544, 0.38, 0.617, 0.604, 0.88, 0.606, 0.609, 0.543, 0.632, 0.404, 0.597, 0.603, 0.628, 0.616, 0.616, 0.568, 0.612, 0.617, 0.738, 0.738, 0.738, 0.738, 0.606, 0.606, 0.426, 0.768, 0.768, 0.768, 0.718, 0.718, 0.717, 0.596, 0.596, 0.596, 0.596, 0.596, 0.596, 0.284, 0.611, 0.611, 0.611, 0.617, 0.617, 0.583, 0.767, 0.617, 0.21, 0.292, 0.304, 0.281, 0.564, 0.304, 0.296, 0.463, 0.5, 0.479, 0.635, 0.635, 0.911, 0.6, 0.348, 0.348, 0.4, 0.221, 0.304, 0.824, 0.99, 0.99],
  800: [0.754, 0.693, 0.723, 0.752, 0.614, 0.594, 0.735, 0.767, 0.456, 0.61, 0.753, 0.593, 0.963, 0.783, 0.767, 0.695, 0.767, 0.712, 0.663, 0.707, 0.736, 0.728, 1.038, 0.769, 0.673, 0.65, 0.614, 0.643, 0.595, 0.643, 0.606, 0.382, 0.588, 0.618, 0.301, 0.315, 0.63, 0.312, 0.929, 0.632, 0.617, 0.644, 0.644, 0.481, 0.557, 0.396, 0.632, 0.625, 0.908, 0.626, 0.634, 0.558, 0.64, 0.429, 0.606, 0.614, 0.645, 0.631, 0.624, 0.583, 0.626, 0.626, 0.754, 0.754, 0.754, 0.754, 0.614, 0.614, 0.456, 0.767, 0.767, 0.767, 0.736, 0.736, 0.723, 0.614, 0.614, 0.614, 0.614, 0.606, 0.606, 0.301, 0.617, 0.617, 0.617, 0.632, 0.632, 0.595, 0.783, 0.632, 0.192, 0.304, 0.314, 0.297, 0.578, 0.314, 0.307, 0.454, 0.5, 0.493, 0.635, 0.635, 0.936, 0.614, 0.364, 0.364, 0.419, 0.23, 0.314, 0.864, 0.99, 0.99],
  900: [0.769, 0.707, 0.728, 0.768, 0.622, 0.603, 0.74, 0.779, 0.483, 0.63, 0.778, 0.605, 0.988, 0.798, 0.767, 0.717, 0.767, 0.733, 0.676, 0.725, 0.753, 0.742, 1.066, 0.801, 0.687, 0.665, 0.631, 0.658, 0.607, 0.658, 0.615, 0.393, 0.597, 0.632, 0.317, 0.327, 0.651, 0.326, 0.945, 0.646, 0.622, 0.659, 0.658, 0.502, 0.569, 0.412, 0.646, 0.644, 0.934, 0.644, 0.657, 0.573, 0.648, 0.452, 0.616, 0.624, 0.662, 0.645, 0.632, 0.597, 0.639, 0.635, 0.769, 0.769, 0.769, 0.769, 0.622, 0.622, 0.483, 0.767, 0.767, 0.767, 0.753, 0.753, 0.728, 0.631, 0.631, 0.631, 0.631, 0.615, 0.615, 0.317, 0.622, 0.622, 0.622, 0.646, 0.646, 0.607, 0.798, 0.646, 0.176, 0.314, 0.323, 0.313, 0.591, 0.323, 0.318, 0.444, 0.5, 0.507, 0.635, 0.635, 0.959, 0.628, 0.379, 0.379, 0.437, 0.238, 0.323, 0.901, 0.99, 0.99],
};

// algarismos tabulares (relógio, preços que rolam): todos com a largura do mais largo
const TABULAR: Record<Peso, number> = { 600: 0.624, 700: 0.632, 800: 0.645, 900: 0.662 };
const MEDIA: Record<Peso, number> = { 600: 0.58, 700: 0.6, 800: 0.62, 900: 0.64 };
// o espaço entre palavras animadas é uma margem fixa (ver `Palavras` em anim.tsx), não o caractere
export const ESPACO = 0.26;

export type Corte = {
  peso: Peso;
  // caixa-alta (manchete, rótulo): mede as maiúsculas
  alta?: boolean;
  // espaçamento entre letras, em frações do corpo (rótulo = 0,06)
  espacamento?: number;
  tabular?: boolean;
  // texto corrido (não animado palavra por palavra): o espaço tem a largura do caractere da fonte
  espacoReal?: boolean;
};

// largura de um texto em px
export const medir = (texto: string, tamanho: number, corte: Corte) => {
  const tabela = TABELAS[corte.peso];
  const t = corte.alta ? texto.toUpperCase() : texto;
  let soma = 0;
  let letras = 0;
  for (const c of t) {
    if (c === " " && !corte.espacoReal) {
      soma += ESPACO;
      continue;
    }
    letras++;
    if (corte.tabular && /\d/.test(c)) {
      soma += TABULAR[corte.peso];
      continue;
    }
    const i = CARACTERES.indexOf(c);
    soma += i >= 0 ? tabela[i] : MEDIA[corte.peso];
  }
  return (soma + (corte.espacamento ?? 0) * letras) * tamanho;
};

// Quebra em até `max` linhas equilibradas (a mais larga o menor possível), medindo de verdade.
export const quebrar = (texto: string, tamanho: number, largura: number, max: number, corte: Corte) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length <= 1) return [palavras.join(" ")];
  const larguraDe = (l: string) => medir(l, tamanho, corte);
  let melhor: string[] = [palavras.join(" ")];
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

// O maior corpo (de `maximo` até `minimo`) em que o texto cabe em até `linhas` linhas nesta largura.
// Devolve as linhas já quebradas e o corpo.
export const diagramar = (
  texto: string,
  { largura, maximo, minimo, linhas = 2, corte }: { largura: number; maximo: number; minimo: number; linhas?: number; corte: Corte },
) => {
  for (let n = 1; n <= linhas; n++) {
    for (let tam = maximo; tam >= minimo; tam -= 2) {
      // prefere menos linhas, desde que o corpo não caia mais que 18% por isso
      if (n < linhas && tam < maximo * 0.82) break;
      const ls = quebrar(texto, tam, largura, n, corte);
      if (ls.length <= n && ls.every((l) => medir(l, tam, corte) <= largura)) return { linhas: ls, tam };
    }
  }
  return { linhas: quebrar(texto, minimo, largura, linhas, corte), tam: minimo };
};

// Como `diagramar`, mas garante que nenhuma linha passa da largura: uma palavra longa demais
// ("criptomoedas", "posicionamento") reduz o corpo até caber, em vez de vazar.
export const caber = (
  texto: string,
  opcoes: { largura: number; maximo: number; minimo: number; linhas?: number; corte: Corte },
) => {
  const d = diagramar(texto, opcoes);
  const maior = Math.max(1, ...d.linhas.map((l) => medir(l, d.tam, opcoes.corte)));
  if (maior > opcoes.largura) return { linhas: d.linhas, tam: Math.floor((d.tam * opcoes.largura) / maior) };
  return d;
};

// O maior corpo em que o texto cabe na largura E na altura. A altura do bloco é
// linhas × corpo × `entrelinha` + corpo × `extraPorTam` (margens que crescem com o corpo) + `extra` (px fixos).
// Testa 1, 2, … `linhas` linhas e fica com o corpo maior (empate: menos linhas).
export const caberNaAltura = (
  texto: string,
  {
    largura,
    maximo,
    minimo,
    linhas = 2,
    corte,
    alturaMax,
    entrelinha = 1.06,
    extraPorTam = 0,
    extra = 0,
  }: { largura: number; maximo: number; minimo: number; linhas?: number; corte: Corte; alturaMax: number; entrelinha?: number; extraPorTam?: number; extra?: number },
) => {
  const altura = (n: number, tam: number) => n * tam * entrelinha + tam * extraPorTam + extra;
  let melhor: { linhas: string[]; tam: number } | null = null;
  const total = Math.min(linhas, Math.max(1, texto.split(/\s+/).filter(Boolean).length));
  for (let n = 1; n <= total; n++) {
    for (let tam = maximo; tam >= minimo; tam -= 2) {
      if (melhor && tam <= melhor.tam) break;
      if (altura(n, tam) > alturaMax) continue;
      const ls = quebrar(texto, tam, largura, n, corte);
      if (ls.length <= n && ls.every((l) => medir(l, tam, corte) <= largura)) {
        melhor = { linhas: ls, tam };
        break;
      }
    }
  }
  if (melhor) return melhor;
  // nem no mínimo: o texto é longo demais para o espaço. Reduz abaixo do mínimo (até 75%), sem vazar.
  const d = caber(texto, { largura, maximo: minimo, minimo, linhas, corte });
  const h = altura(d.linhas.length, d.tam);
  if (h > alturaMax && h > 0) {
    const k = Math.max(0.75, (alturaMax - extra) / (h - extra));
    return { linhas: d.linhas, tam: Math.floor(d.tam * k) };
  }
  return d;
};
