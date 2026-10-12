import { loadFont } from "@remotion/google-fonts/Sora";

// Uma família só, a Sora: larga, redonda, com algarismos grandes e claros para os preços.
// Nada condensado, nada com contorno: o contraste vem do papel da etiqueta (creme, tinta verde e tomate).
export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // a parede da loja (o quadro da esquerda, com a pessoa na moldura da direita; no vertical, a
  // metade de cima): verde-menta fundo, bem aberto
  fundo: "#0E7C66",
  fundoBaixo: "#09574A",
  // placas escuras sobre a pessoa
  placa: "rgba(9,87,74,0.92)",
  placaSolida: "#09574A",
  // o texto sobre a parede e sobre a tarja (creme, nunca branco puro)
  tinta: "#FFFBF0",
  suave: "rgba(255,251,240,0.80)",
  apagado: "rgba(255,251,240,0.46)",
  // a tinta: texto nas etiquetas de papel (verde-garrafa, nunca preto)
  tintaEscura: "#10352D",
  tintaSuave: "#4C7A6E",
  // a tarja: a palavra falada, títulos, o preço, a barra de progresso (tomate)
  tarja: "#E8402B",
  tarjaBorda: "#A82413",
  // o limão: o que muda, o destaque, o selo (texto escuro em cima)
  alerta: "#FFE14D",
  alertaBorda: "#C9A800",
  // o lado certo
  certo: "#8DF0B8",
  // o lado bom do medidor
  bom: "#18A66B",
  // etiquetas e cartões de papel
  papel: "#FFF6E3",
  papelSombra: "#E8DABB",
  // a madeira da prateleira
  degrau: "#F1E3C2",
  degrauFrente: "#D9C698",
  linha: "rgba(255,251,240,0.24)",
  // casa vazia
  vazio: "rgba(255,251,240,0.10)",
  vazioTraco: "rgba(255,251,240,0.42)",
};

// sombra dura curta embaixo das etiquetas e tarjas, nunca brilho
export const sombraDura = (c: string, y = 7) => `0 ${y}px 0 ${c}`;
export const sombraCartao = "0 16px 36px rgba(4,50,42,0.45)";
