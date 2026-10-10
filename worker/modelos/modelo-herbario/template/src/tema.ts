import { loadFont as carregarAlegreya } from "@remotion/google-fonts/Alegreya";
import { loadFont as carregarAlegreyaSC } from "@remotion/google-fonts/AlegreyaSC";
import { loadFont as carregarAlegreyaSans } from "@remotion/google-fonts/AlegreyaSans";

// Uma família só, com o ar de livro de botânica antigo: Alegreya (romana e itálica caligráfica),
// Alegreya SC (versaletes dos rótulos de prancha) e Alegreya Sans (legenda de redes sociais).
carregarAlegreya("italic", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
export const serif = carregarAlegreya("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const versalete = carregarAlegreyaSC("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarAlegreyaSans("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Prancha botânica: papel de herbário cinza-sálvia, tinta ferrogálica verde-negra, grafite para o
// esboço, aquarelas leves só dentro do desenho. Na interface, um verde-musgo e, para o erro, garança.
export const cor = {
  papel: "#E9EBE2",
  // papel mais claro das etiquetas e do cartão de herbário
  etiqueta: "#F4F4EC",
  tinta: "#1F2620",
  // esboço a lápis (o que ainda vai ser dito)
  grafite: "#A3A89D",
  grafiteClaro: "#C6CABF",
  // acento da interface: rótulos, números, grifo
  musgo: "#2F5B45",
  musgoClaro: "#6E8F72",
  // o erro (✗, o que mata a planta)
  garanca: "#A8432F",
  // aquarelas do desenho
  folha: "#86A66F",
  folhaTinta: "#3E5A3A",
  folhaPalida: "#CDC98C",
  terra: "#9C7A5B",
  terraUmida: "#4E3A2B",
  terraSeca: "#C6AE8C",
  vaso: "#C98B6B",
  vasoCorte: "#8E5038",
  agua: "#7FA3B8",
  aguaTinta: "#3E6A85",
  raiz: "#CDB88C",
  raizPodre: "#33251C",
  sol: "#E6C26A",
  pele: "#E3BFA2",
};

// Espessuras de traço (px no quadro 1080×1920)
export const traco = { forte: 4.5, medio: 3.2, fino: 2.2, cabelo: 1.4 };

// Tamanhos mínimos de celular (quadro de 1080 de largura)
export const corpo = { titulo: 112, tituloCapa: 124, etiqueta: 46, rotulo: 34, apoio: 54 };

export const MARGEM = 70;
// Legenda (quando aparece) e limite da interface do aplicativo
export const LEGENDA_Y = 1440;
export const LIMITE_APP = 1560;

// Área padrão do texto em tela cheia (abaixo do queixo). O plano pode mover com `zona`.
export const zona = { esquerda: 80, direita: 80, topo: 980, altura: 470 };

// Largura média de um caractere da Alegreya, em frações do corpo (para caber sem medir o DOM)
export const LARGURA_SERIF = 0.5;
export const LARGURA_ITALICO = 0.44;

// Quantas linhas um texto ocupa numa largura, quebrando nas palavras (estimativa)
export const linhasDoTexto = (texto: string, largura: number, tamanho: number, fator = LARGURA_SERIF) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  let linhas = 1;
  let atual = 0;
  for (const w of palavras) {
    const lw = w.length * tamanho * fator;
    const espaco = atual > 0 ? tamanho * 0.26 : 0;
    if (lw > largura) return 99;
    if (atual > 0 && atual + espaco + lw > largura) {
      linhas++;
      atual = lw;
    } else atual += espaco + lw;
  }
  return linhas;
};

// Maior corpo (entre mínimo e máximo) em que cada linha cabe inteira na largura
export const corpoQueCabe = (linhas: string[], largura: number, maximo: number, minimo: number, fator = LARGURA_SERIF) => {
  const maior = Math.max(...linhas.map((l) => l.length), 1);
  return Math.max(minimo, Math.min(maximo, Math.floor(largura / (maior * fator))));
};
