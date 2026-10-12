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

// --- O quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Herbário, para o vídeo completo do YouTube. O estilo é o mesmo do vertical
// (as cores, as fontes, a prancha, as figuras, o movimento, os sons); muda só a diagramação, pela
// regra da aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a base e, quando
// o momento pede a prancha, ela vai para o OVAL na coluna da DIREITA (o rosto no meio dele, seguido
// pelo rastro) e o desenho ocupa o QUADRO da esquerda.
export const QUADRO = { w: 1920, h: 1080 };

// As pranchas são desenhadas numa camada LÓGICA com as medidas do vertical (1080 de largura) e
// encolhidas por esta escala: o traço, a tipografia, as proporções do desenho e a conta de medir e
// encolher texto continuam as mesmas. `x`/`y` = onde o canto (0, 0) da camada cai no quadro.
// Prancha de figura ou de bloco: o corpo (x 40–1040, y 556–1560 da camada) vira o quadro da
// esquerda (x 86–986, y 100–1004 da tela); o cabeçalho fica na coluna da direita, com o oval.
export const PRANCHA = { x: 50, y: -400, escala: 0.9 };
// Frontispício: a coluna do título e do espécime (y 930–1880 da camada) à esquerda; o oval grande à direita.
export const FRONTISPICIO = { x: 94, y: -727, escala: 0.9 };
// px da tela → px da camada da prancha
export const naCamada = (r: { x: number; y: number; w: number; h: number }, c = PRANCHA) => ({
  x: (r.x - c.x) / c.escala,
  y: (r.y - c.y) / c.escala,
  w: r.w / c.escala,
  h: r.h / c.escala,
});

// Espessuras de traço (px da camada da prancha, a medida do vertical)
export const traco = { forte: 4.5, medio: 3.2, fino: 2.2, cabelo: 1.4 };

// Tamanhos do texto (px da camada; na tela, × a escala da prancha)
export const corpo = { titulo: 112, tituloCapa: 124, etiqueta: 46, rotulo: 34, apoio: 54 };

export const MARGEM = 70;
// Legenda (quando aparece), na área segura de baixo, e o limite de baixo de todo texto: abaixo
// dele ficam os controles do player (barra de tempo, botões)
export const LEGENDA_Y = 892;
export const LIMITE_APP = 1004;

// Área padrão do texto em tela cheia (a faixa de baixo, do queixo até a margem). O plano pode
// mover com `zona` (o cortar.mjs calcula pelo queixo).
export const zona = { esquerda: 120, direita: 120, topo: 640, altura: 364 };

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
