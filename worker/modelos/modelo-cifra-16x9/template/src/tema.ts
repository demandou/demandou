import { loadFont } from "@remotion/google-fonts/SchibstedGrotesk";

// Schibsted Grotesk: grotesca de cartaz, larga o bastante e sem nada condensado. Uma família só:
// 800/900 nos títulos e cifras, 600/700 nos textos e nos números de dedo.
// Escolhida também porque o I maiúsculo tem serifa: "Iogurte", "IPTU" e "Il1" não confundem I com l.
export const fonte = loadFont("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Palco escuro de ébano (a escala do violão), traço de marfim (o osso do rastilho) e UM acento:
// o azul do jeans / do "sonic blue" das guitarras. O azul marca o que está sendo tocado agora:
// dedos no diagrama, compasso em curso, a seta da batida, o pulso da janela.
export const cor = {
  palco: "#14110F",
  palcoClaro: "#1E1A16",
  // marfim: texto e traço principal
  marfim: "#F3EBDD",
  marfimSuave: "rgba(243,235,221,0.72)",
  // trastes e cordas
  niquel: "rgba(243,235,221,0.58)",
  // esboço "a lápis": o que ainda vai ser tocado
  lapis: "rgba(243,235,221,0.3)",
  lapisForte: "rgba(243,235,221,0.46)",
  // o acento
  azul: "#86C5EE",
  azulFundo: "rgba(134,197,238,0.16)",
  // azul mais fundo, para texto sobre o papel da cifra
  azulTinta: "#2C6A9C",
  // a folha de cifra (papel) e a tinta dela
  papel: "#F3EBDD",
  tinta: "#1B1714",
  tintaSuave: "rgba(27,23,20,0.55)",
  tintaLapis: "rgba(27,23,20,0.22)",
};

// --- Geometria do quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Cifra, para o vídeo completo do YouTube. O estilo é o mesmo do vertical; muda a
// diagramação, que segue a aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia como
// base; quando um bloco pede apoio visual, ela vai para uma MOLDURA do lado direito (o rosto
// centralizado e acompanhado com suavidade) e a arte ocupa o QUADRO do lado esquerdo.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// topo seguro (o título do player aparece por cima no começo e ao pausar)
export const TOPO = 96;
// abaixo disto: os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// onde a arte do quadro termina (a legenda, quando aparece junto, fica abaixo dela)
export const BASE_ARTE = 948;
// o cartão de quadro cheio pode descer até perto dos controles do player
export const BASE_CARTAO = 976;
// topo da linha da legenda (terço de baixo, terminando antes dos controles do player)
export const LEGENDA_Y = 900;
// o cartão de palco de quadro cheio: largura e a menor altura (com a pessoa gravada muito baixa,
// ele sobe um pouco em vez de ficar sem lugar para o texto)
export const LARGURA_CARTAO = 1360;
export const ALTURA_MINIMA_CARTAO = 270;
export const RAIO = 36;

// Faixa padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`);
// o cortar.mjs do 16:9 grava a zona 60 px abaixo do queixo.
export const zona = { topo: 640, altura: 368 };

// Estilos de texto
export const titulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "-0.02em",
};
export const corpo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 600,
  lineHeight: 1.15,
};
// rótulo em caixa-alta espaçada (nunca abaixo de 30 px)
export const rotulo: React.CSSProperties = {
  fontFamily: fonte,
  fontWeight: 700,
  fontSize: 32,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};
