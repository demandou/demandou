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

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// topo seguro (abaixo das abas do app)
export const TOPO = 150;
// abaixo disto: interface do app (legenda do post, botões)
export const LIMITE_APP = 1560;
export const RAIO = 36;

// Faixa padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 980, altura: 460 };

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
