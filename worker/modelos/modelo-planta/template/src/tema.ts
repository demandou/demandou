import { loadFont as carregarMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";

// Sora: títulos, números e legenda (leve e média). IBM Plex Mono: rótulos, medidas e anotações.
export const sans = carregarSora("normal", { weights: ["300", "400", "600"], subsets: ["latin"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

// Prancheta de arquiteto: papel, grafite, um cinza e UM acento.
export const cor = {
  papel: "#F3F0E8",
  grafite: "#1F1F1D",
  cinza: "#8A867D",
  cinzaClaro: "#C9C4B8",
  acento: "#C4623A",
  // texto "a lápis": o título da prancha aparece assim e é passado a nanquim quando é falado
  rascunho: "#ADA89D",
  // o acento bem diluído, só para preencher áreas (nunca texto)
  acentoVeu: "rgba(196,98,58,0.10)",
  grade: "rgba(31,31,29,0.045)",
  gradeForte: "rgba(31,31,29,0.085)",
};

// Espessuras de traço (px no quadro 1080×1920), pensadas para a tela do celular:
// paredes (poché) > contorno dos móveis > detalhes e linhas de chamada
export const traco = { forte: 5, medio: 3.6, fino: 2.4 };

// Menor corpo de rótulo técnico dentro dos desenhos (mono): legível no celular
export const ROTULO = 28;

// Margem da prancha e posição da legenda (a mesma em todos os layouts)
export const MARGEM = 36;
export const LEGENDA_Y = 1440;
export const LIMITE_APP = 1560;

// Área padrão dos cartões em tela cheia (altura do peito). O plano pode mover (campo `zona`).
export const zona = { esquerda: 70, direita: 70, topo: 905, altura: 465 };

// Largura média de um caractere, em frações do tamanho da fonte (para caber texto sem medir o DOM)
export const LARGURA_SORA = 0.6;
export const LARGURA_MONO = 0.6;

export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_SORA) =>
  Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator)));

// Rótulo técnico: mono em caixa alta, espaçado
export const rotuloMono: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 500,
  fontSize: 28,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  lineHeight: 1,
};
