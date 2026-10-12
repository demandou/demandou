import { loadFont } from "@remotion/google-fonts/Rubik";

// Uma família só, a Rubik (cantos levemente arredondados, larga e legível): 800 nos títulos e números,
// 700 nos nomes das etiquetas e na legenda, 500 nos detalhes. Nada condensado, nada com contorno.
export const fonte = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o tampo: carvalho claro (a textura é public/mesa.jpg; esta é a cor de baixo dela)
  mesa: "#DDBB92",
  mesaBorda: "#A97B4F",
  // papel das etiquetas, fichas e cartões
  papel: "#FFFDF7",
  papelSombra: "#EFE9DD",
  // a tinta (texto principal) e a tinta apagada (detalhes)
  tinta: "#1F2430",
  tintaSuave: "#5B6170",
  tintaApagada: "rgba(31,36,48,0.38)",
  // ênfase: azul cobalto (marca-texto, contador, número, linha do item atual)
  cobalto: "#2F56E0",
  cobaltoEscuro: "#1C3AAE",
  cobaltoClaro: "#DCE4FF",
  // alerta: vermelho de caneta (problema, "não faça", risco)
  alerta: "#E4462D",
  // certo / o que funciona
  certo: "#1E9E62",
  // fita crepe (legenda, rótulos, fita que segura os papéis)
  fita: "rgba(241,228,182,0.94)",
  fitaBorda: "rgba(160,140,90,0.25)",
  // kraft (cartão sem imagem, fundo de gráfico)
  kraft: "#C9A57A",
  // o contorno pontilhado do lugar vazio de cada item
  vazio: "rgba(31,36,48,0.32)",
};

// sombras de objeto deitado no tampo (luz de cima, um pouco à esquerda)
export const sombraPousada = "3px 6px 10px rgba(60,38,16,0.28), 0 1px 2px rgba(60,38,16,0.25)";
export const sombraNoAr = (p: number) => {
  // p = 1 no alto, 0 pousado
  const dx = 3 + 20 * p;
  const dy = 6 + 36 * p;
  const b = 10 + 36 * p;
  const a = 0.28 - 0.14 * p;
  return `${dx}px ${dy}px ${b}px rgba(60,38,16,${a.toFixed(3)}), 0 1px 2px rgba(60,38,16,${(0.25 * (1 - p)).toFixed(3)})`;
};
export const filtroNoAr = (p: number) => {
  const dx = 3 + 20 * p;
  const dy = 6 + 36 * p;
  const b = 5 + 18 * p;
  const a = 0.36 - 0.18 * p;
  return `drop-shadow(${dx}px ${dy}px ${b}px rgba(60,38,16,${a.toFixed(3)}))`;
};
