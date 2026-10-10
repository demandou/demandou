import { loadFont as carregarCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as carregarJost } from "@remotion/google-fonts/Jost";

// Duas fontes: uma serifada de livro/cinema (Cormorant Garamond) para tudo que é narrado,
// e uma sans geométrica discreta (Jost), só em caixa alta espaçada, como crédito de filme.
carregarCormorant("italic", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
export const serif = carregarCormorant("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = carregarJost("normal", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // preto quente das barras e das cartelas
  preto: "#0B0806",
  // texto: marfim quente, e a versão apagada para o que é secundário
  marfim: "#F0E6D2",
  marfimSuave: "rgba(240,230,210,0.64)",
  marfimApagado: "rgba(240,230,210,0.34)",
  // o único acento: âmbar de luz de abajur
  ambar: "#D9A45B",
  ambarClaro: "#E9BE7E",
  // o que esfriou / apagou (usado com parcimônia nos desenhos)
  frio: "#8C9196",
};

// Rótulo de crédito de cinema: caixa alta, espaçada, âmbar.
export const credito: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 500,
  fontSize: 32,
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  color: cor.ambar,
};

// Sombra suave para texto claro sobre a imagem (não é contorno nem brilho).
export const sombra = "0 2px 18px rgba(6,4,3,0.7)";

// Para medir e encaixar texto (qualquer texto do plano cabe no lugar dele), veja `medida.ts`.
