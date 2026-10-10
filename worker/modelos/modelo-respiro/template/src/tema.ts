import { loadFont as carregarCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as carregarNewsreader } from "@remotion/google-fonts/Newsreader";

// Duas fontes: uma serifada macia (títulos, números da contagem, legenda) e uma escrita à mão
// legível (as notas do "diário"). Nada condensado.
carregarNewsreader("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
export const serif = carregarNewsreader("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mao = carregarCaveat("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Paleta "fim de tarde": papel de linho pêssego, a forma do respiro em damasco (três tons chapados,
// sem brilho) e uma tinta de cacau para o texto. Poucas cores: o resto é variação dessas.
export const cor = {
  papel: "#F4E4D6",
  // papel um pouco mais fundo (fundo da janela antes do vídeo, sombras de papel)
  papelFundo: "#ECD6C5",
  // o respiro: núcleo, meio e véu externo
  damasco: "#E59A74",
  damascoMedio: "#EEB492",
  damascoClaro: "#F6D2BB",
  // marca-texto (grifo) por trás de uma palavra
  grifo: "#F0B997",
  tinta: "#3C2A2B",
  tintaSuave: "#7A605E",
  // esboço "a lápis": o lugar do que ainda vai ser dito
  lapis: "#C2A595",
};

// Interface do aplicativo (Reels/TikTok) cobre o quadro daqui para baixo
export const LIMITE_APP = 1560;
// Legenda (só aparece fora dos momentos, com a pessoa na janela grande)
export const LEGENDA_Y = 1366;
export const MARGEM = 64;
