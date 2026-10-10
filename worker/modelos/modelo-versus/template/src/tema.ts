import { loadFont } from "@remotion/google-fonts/Kanit";

// Kanit: larga, firme e legível, com cara de cartaz de luta.
// Itálico 800/900 em caixa alta para nomes, placar, rodadas e títulos; reta 600/700 para o texto corrido.
// Nada condensado, nada com contorno: o contraste vem das placas e das cores dos dois cantos.
const italico = loadFont("italic", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
loadFont("normal", { weights: ["600", "700"], subsets: ["latin", "latin-ext"] });
export const fonte = italico.fontFamily;

export const cor = {
  // a arena (metade de cima): grafite arroxeado
  fundo: "#16141C",
  arena: "#1E1B26",
  // os dois cantos: vermelho (lado A, à esquerda) e azul-ciano (lado B, à direita)
  a: "#FF4438",
  aEscuro: "#B8231A",
  b: "#22B8F0",
  bEscuro: "#0E78A8",
  // o texto
  papel: "#FFF7EC",
  // tinta = texto claro sobre as placas escuras e as cores; tintaEscura = texto sobre papel e amarelo
  tinta: "#FFFFFF",
  tintaEscura: "#16121E",
  tintaSuave: "#6A6478",
  suave: "rgba(255,247,236,0.72)",
  apagado: "rgba(255,247,236,0.38)",
  linha: "rgba(255,247,236,0.16)",
  // quem perde a rodada fica cinza
  perde: "#5E5A68",
  // alerta (problema, "não faça"), a palavra falada na legenda: âmbar, com texto escuro
  alerta: "#FFC233",
  alertaBorda: "#B5811A",
  // a cor neutra dos blocos (títulos, tarjas, passos): índigo, com texto claro
  tarja: "#5B4BFF",
  tarjaBorda: "#3427BF",
  // o lado certo
  certo: "#1FC98A",
  placa: "rgba(22,18,30,0.92)",
  placaSolida: "#16121E",
  vazio: "rgba(255,247,236,0.10)",
  vazioTraco: "rgba(255,247,236,0.40)",
};

// a cor de cada lado (0 = A, 1 = B); sem lado, o papel
export const corDoLado = (lado: 0 | 1 | undefined | null) => (lado === 0 ? cor.a : lado === 1 ? cor.b : cor.papel);
export const escuroDoLado = (lado: 0 | 1 | undefined | null) => (lado === 0 ? cor.aEscuro : lado === 1 ? cor.bEscuro : "#8C8578");

// sombra dura e curta (cartaz impresso), nunca brilho
export const sombraDura = (c: string, y = 8, x = 0) => `${x}px ${y}px 0 ${c}`;
export const sombraCartao = "0 22px 44px rgba(0,0,0,0.45)";
// inclinação do cartaz de luta (as placas são paralelogramos)
export const INCLINA = -9;
