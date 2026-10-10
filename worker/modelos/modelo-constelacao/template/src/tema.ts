import { loadFont as carregarReddit } from "@remotion/google-fonts/RedditSans";
import { loadFont as carregarSpectral } from "@remotion/google-fonts/Spectral";

// Spectral: serifada de leitura em tela, com itálico de atlas antigo — nomes de constelações, estrelas
// e títulos. Reddit Sans: sans nítida para rótulos, legenda e números de apoio; o l minúsculo tem
// cauda, então "Il1" não se confunde.
carregarSpectral("italic", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
export const serifa = carregarSpectral("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarReddit("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Carta celeste noturna: anil quase preto (o céu), branco quente (estrelas e texto), azul-gelo (as
// linhas da constelação) e UM vermelho de lanterna de observação (a luz que o astrônomo usa para não
// perder a visão noturna): ocular-guia, prolongamentos, o polo, confirmações.
export const cor = {
  ceu: "#0A0B1F",
  // céu um tom acima (anel da ocular, placas)
  ceuAlto: "#14162F",
  ceuBorda: "#252846",
  // grade de coordenadas
  grade: "rgba(150,166,226,0.16)",
  gradeTexto: "rgba(170,182,230,0.55)",
  // faixa da Via Láctea
  via: "rgba(156,174,236,0.032)",
  viaPonto: "rgba(196,206,244,0.5)",
  estrela: "#F6F1E6",
  // traço "a lápis": o que ainda vai acontecer
  lapis: "rgba(214,220,246,0.30)",
  linha: "#BFCBF2",
  texto: "#F3EEE4",
  textoSuave: "#A4ABCB",
  lanterna: "#FF5A47",
  lanternaClara: "#FF8A7A",
  branco: "#FFFFFF",
};

export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// conteúdo do lado direito nunca passa daqui (interface do app e respiro)
export const LIMITE_DIREITA = W - 120;
// faixa da legenda nas telas de carta, acima da interface do app
export const LEGENDA_CARTA_Y = 1446;
export const LIMITE_APP = 1560;

// Área padrão dos cartões em tela cheia (abertura e fechamento): altura do peito, abaixo do queixo.
export const zona = { esquerda: MARGEM, direita: MARGEM, topo: 1000, altura: 470 };

// Anel da ocular (px): espessura da borda escura graduada em volta da janela da pessoa
export const ANEL = 26;
