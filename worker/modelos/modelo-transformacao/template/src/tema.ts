import { loadFont } from "@remotion/google-fonts/Outfit";

// Transformação: revista de casa. Linho claro, tinta verde-escura, um verde-mar para o "depois",
// um cinza-pedra para o "antes" e argila para o alerta. Uma família só (Outfit), larga e redonda,
// sem condensada e sem contorno: o contraste vem dos cartões claros e da cortina.
export const fonte = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o papel de linho (painel de cima, cartões)
  linho: "#EFE9DF",
  cartao: "#F8F4ED",
  cartaoVidro: "rgba(248,244,237,0.95)",
  // a tinta
  tinta: "#1D2B27",
  tintaSuave: "rgba(29,43,39,0.66)",
  tintaApagada: "rgba(29,43,39,0.38)",
  linha: "rgba(29,43,39,0.14)",
  // o depois / a ênfase / os marcadores numerados
  depois: "#137A6A",
  depoisClaro: "#CFE7DF",
  depoisEscuro: "#0C5348",
  // o antes
  antes: "#8A7E73",
  antesClaro: "#E4DDD4",
  // alerta (problema, "não faça")
  alerta: "#C8552E",
  alertaClaro: "#F6DCCF",
  branco: "#FFFFFF",
};

export const sombraCartao = "0 14px 36px rgba(29,43,39,0.20)";
export const sombraLeve = "0 6px 18px rgba(29,43,39,0.16)";
