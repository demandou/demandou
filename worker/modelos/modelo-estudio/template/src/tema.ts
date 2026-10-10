import { loadFont as carregarMartian } from "@remotion/google-fonts/MartianMono";
import { loadFont as carregarSchibsted } from "@remotion/google-fonts/SchibstedGrotesk";

// Duas famílias, nada condensado:
// - Schibsted Grotesk (600/700/800): títulos, perguntas, citações, legenda. O I maiúsculo tem
//   serifa, então "Iogurte", "IPTU" e "Il1" não confundem I com l.
// - Martian Mono (500): rótulos de estúdio (EP. 12, CAM 2, capítulo, tempo, contadores).
export const sans = carregarSchibsted("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mono = carregarMartian("normal", { weights: ["500"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Estúdio escuro com UM acento: o rosa-elétrico da luz de "no ar".
export const cor = {
  // fundo do estúdio e os painéis (cartões, player)
  fundo: "#0C0B0E",
  fundoBaixo: "#121116",
  painel: "#17161B",
  painelClaro: "#211F26",
  borda: "rgba(243,239,232,0.10)",
  // texto
  texto: "#F3EFE8",
  textoSuave: "rgba(243,239,232,0.64)",
  // esboço "a lápis": o que ainda vai acender (palavra não dita, barra não preenchida)
  apagado: "rgba(243,239,232,0.24)",
  apagadoForte: "rgba(243,239,232,0.36)",
  // o acento: onda, chip do episódio, palavra em destaque, marco
  acento: "#FF3D7F",
  acentoSuave: "rgba(255,61,127,0.22)",
  // texto sobre o acento
  sobreAcento: "#160A10",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 36;
// régua do episódio (chip EP, capítulo, tempo) e a barra de capítulos, abaixo das abas do app
export const REGUA = { y: 156, altura: 56, barraY: 236 };
// a caixa da pessoa começa aqui
export const TOPO = 262;
// nada importante abaixo disto (legenda do post e botões do app)
export const LIMITE_APP = 1570;
// onde o conteúdo de baixo termina (cartões, frase, trilha, legenda)
export const FUNDO = 1540;

// Estilos de texto
export const rotulo: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  lineHeight: 1,
};
export const titulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 800,
  letterSpacing: "-0.012em",
  lineHeight: 1.04,
};

// o acento com transparência (para preenchimentos que acendem aos poucos)
export const comAlfa = (hex: string, alfa: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa.toFixed(3)})`;
};
