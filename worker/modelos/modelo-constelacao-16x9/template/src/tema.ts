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

// --- Medidas do quadro deitado (16:9, 1920×1080) ---
// A versão deitada da Constelação, para o vídeo completo do YouTube. O estilo é o mesmo do vertical;
// muda a diagramação, pela aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a
// base; na carta ela vai para a ocular, uma MOLDURA redonda no lado direito, e o bloco ocupa o
// QUADRO do lado esquerdo (veja layout.ts).
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// conteúdo do lado direito nunca passa daqui
export const LIMITE_DIREITA = W - MARGEM;
// a legenda: uma linha numa placa, no terço de baixo (tela cheia e carta), acima dos controles do player
export const LEGENDA_Y = 894;
export const LEGENDA_CARTA_Y = LEGENDA_Y;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// até onde desce o texto de tela cheia quando a legenda não está na tela
export const LIMITE_TEXTO_CHEIO = 968;

// O QUADRO (o lado esquerdo da carta): onde os blocos se desenham quando a pessoa está na ocular
export const QUADRO = { x: MARGEM + 10, y: 116, w: 994, h: 764 };
// A MOLDURA (o lado direito da carta): a coluna da ocular, com o rosto centralizado nela
export const MOLDURA = { x: 1130, w: 694, cx: 1472 };

// Área padrão dos cartões em tela cheia (abertura e fechamento): no peito, abaixo do queixo, numa
// faixa larga e baixa (fileiras em vez da pilha alta do vertical). `topo` vem do plano (cortar.mjs).
export const zona = { esquerda: 210, direita: 210, topo: 680, altura: LIMITE_TEXTO_CHEIO - 680 };
// o topo da faixa do peito fica entre estes limites (gravação de perto deixa pouco peito)
export const TOPO_PEITO = { min: 600, max: 700 };

// Anel da ocular (px): espessura da borda escura graduada em volta da janela da pessoa
export const ANEL = 26;
