import { loadFont } from "@remotion/google-fonts/Rubik";

// Uma família só, a Rubik: larga, de cantos levemente redondos, com algarismos fortes para as posições.
// Nada condensado, nada com contorno: o contraste vem das casas do placar (giz, tinta e limão).
export const fonte = loadFont("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o placar (a metade de cima): azul de quadra, bem fundo
  fundo: "#101A8C",
  fundoBaixo: "#0B1266",
  // placas escuras sobre a pessoa
  placa: "rgba(11,18,102,0.92)",
  placaSolida: "#0B1266",
  // o texto sobre azul e sobre a tarja
  tinta: "#FFFFFF",
  suave: "rgba(255,255,255,0.74)",
  apagado: "rgba(255,255,255,0.42)",
  // a tinta: texto nas casas de giz
  tintaEscura: "#0B1040",
  tintaSuave: "#5A6094",
  // a tarja: a palavra falada, títulos, a barra de progresso (azul vivo)
  tarja: "#3347FF",
  tarjaBorda: "#1B2AC4",
  // o limão: a casa da vez, o 1º lugar, o foco de luz (texto escuro em cima)
  alerta: "#D2F43C",
  alertaBorda: "#92B20F",
  // o lado certo
  certo: "#18C27C",
  // casas e cartões de giz
  papel: "#F6F3E8",
  linha: "rgba(255,255,255,0.22)",
  // casa vazia do placar
  vazio: "rgba(255,255,255,0.10)",
  vazioTraco: "rgba(255,255,255,0.40)",
};

// sombra dura curta embaixo das casas e tarjas (cara de peça de placar), nunca brilho
export const sombraDura = (c: string, y = 7) => `0 ${y}px 0 ${c}`;
export const sombraCartao = "0 16px 36px rgba(4,8,60,0.45)";
