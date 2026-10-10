// Identidade do Devocional: uma página de livro de devoção, calma e viva.
// Pergaminho marfim (textura feita por código), tinta azul-noite para o texto, verde-oliva para os
// ornamentos e as palavras que acendem, e um acento suave de aurora (sol, selo, coração).
// Nada de preto + dourado. Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont as carregarGaramond } from "@remotion/google-fonts/EBGaramond";
import { loadFont as carregarManrope } from "@remotion/google-fonts/Manrope";

// EB Garamond: o texto lido (versículo, frases, títulos), grande e bem espaçado.
carregarGaramond("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });
export const serif = carregarGaramond("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] }).fontFamily;
// Manrope: só o que precisa ser lido rápido e pequeno (tarja de nome, legenda, rótulos de gráfico).
export const sans = carregarManrope("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o papel
  papel: "#F3EAD4",
  papelFundo: "#E4D6B8",
  // a tinta
  tinta: "#1E2945",
  tintaSuave: "#596079",
  // o que ainda vai ser dito (versículo "a lápis") e traços finos
  lapis: "rgba(30,41,69,0.13)",
  filete: "rgba(30,41,69,0.28)",
  // verde-oliva: ornamentos, capitular, referência, palavra que acende
  oliva: "#5B6A2E",
  olivaEscura: "#46521F",
  olivaClara: "#DDE2C2",
  // a luz que acende a palavra (creme) e a poeira de luz
  luz: "#FFFBEF",
  poeira: "#FFFDF6",
  // acento suave: aurora (sol, selo da carta, coração)
  aurora: "#C9866A",
  auroraClara: "#EFD2C3",
  // alerta (risco, "não faça"): tijolo sóbrio
  alerta: "#9C4535",
  // atrás do vídeo (só aparece se faltar vídeo)
  moldura: "#1B2236",
};

// ——— o palco (px, quadro 1080×1920) ———
// A pessoa fica numa moldura larga embaixo; a COSTURA é o topo da moldura. No versículo a página
// fica cheia e a pessoa vai para o medalhão de baixo (layout.ts).
export const COSTURA = 1000;
export const MOLDURA = { x: 36, w: 1008, raio: 44 };
// a área de texto da página: margem lateral de 64 px, topo livre da interface do app
export const MARGEM = 64;
export const TOPO = 150;
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
// a página vira em 0,5 s (o centro da folha nova aparece em ~0,3 s)
export const VIRADA = 0.5;
