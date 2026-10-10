import { loadFont } from "@remotion/google-fonts/Montserrat";

// Uma família só, em três pesos: a Montserrat larga e cheia das legendas de retenção.
// Nada condensado, nada com contorno: o contraste vem das tarjas (fundos de cor atrás do texto).
export const fonte = loadFont("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // fundo do quadro da esquerda quando a pessoa vai para a moldura da direita (no vertical, a
  // metade de cima quando ela descia)
  fundo: "#121016",
  // placas escuras atrás do texto branco (legenda, gancho, número)
  placa: "rgba(18,16,22,0.9)",
  placaSolida: "#1C1922",
  // o texto
  tinta: "#FFFFFF",
  tintaEscura: "#141218",
  suave: "rgba(255,255,255,0.7)",
  apagado: "rgba(255,255,255,0.42)",
  // a tarja: a palavra falada, o trecho que importa, a barra de progresso
  tarja: "#FF2E63",
  tarjaBorda: "#B8123F",
  // alerta (problema, perigo, "não faça"): fita amarela com texto escuro
  alerta: "#FFC21A",
  alertaBorda: "#B88300",
  // o lado certo / o que funciona
  certo: "#2BD97C",
  // cartões claros (itens de lista, opções)
  papel: "#FFFFFF",
  linha: "rgba(255,255,255,0.18)",
};

// sombra dura curta embaixo das tarjas e cartões (cara de adesivo), nunca brilho
export const sombraDura = (c: string, y = 7) => `0 ${y}px 0 ${c}`;
export const sombraCartao = "0 18px 40px rgba(0,0,0,0.38)";
