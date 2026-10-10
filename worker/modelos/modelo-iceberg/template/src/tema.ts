import { loadFont } from "@remotion/google-fonts/Outfit";
import { loadFont as carregarMono } from "@remotion/google-fonts/OverpassMono";

// Outfit: geométrica, larga e limpa (títulos, nomes dos níveis, textos). Nada condensado.
// Overpass Mono: só nos números do medidor de profundidade (instrumento).
export const fonte = loadFont("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;

export const cor = {
  // céu acima da linha d'água (claro, frio)
  ceuAlto: "#F4FBFF",
  ceuBaixo: "#CBEAF6",
  // a água, da superfície ao abismo
  agua0: "#3CC3DC",
  agua1: "#1683B3",
  agua2: "#0C4677",
  agua3: "#061F3F",
  abismo: "#020B19",
  // o gelo (acima da água, branco; embaixo, azul que escurece com a fundura)
  gelo: "#FFFFFF",
  geloLuz: "#E6F7FF",
  geloSombra: "#B4DDEE",
  geloFundo: "#5FA6CC",
  geloAbismo: "#173F66",
  // tinta: escura sobre gelo e céu; clara sobre a água
  tinta: "#062A44",
  tintaSuave: "rgba(6,42,68,0.72)",
  clara: "#F4FBFF",
  claraSuave: "rgba(226,246,255,0.78)",
  // ciano do instrumento (medidor, sonar, traços)
  sonar: "#8BEBFF",
  // ênfase: o trecho que importa, o nível atual, a marca do medidor
  enfase: "#FF7F50",
  enfaseEscura: "#C9532C",
  // alerta (problema, "não faça") e certo (o que funciona)
  alerta: "#FF4F6A",
  certo: "#4FE3A8",
  // placa escura (legenda, leitura do medidor)
  placa: "rgba(4,24,44,0.9)",
};

// sombra curta e escura embaixo das lajes de gelo (nunca brilho)
export const sombraLaje = "0 16px 34px rgba(2,14,30,0.42)";
