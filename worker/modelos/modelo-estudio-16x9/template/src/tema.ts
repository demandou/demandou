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

// Geometria do quadro DEITADO (px, 16:9, 1920×1080): a versão do vídeo completo do YouTube.
// O estilo é o mesmo do vertical (cores, fontes, blocos, assinaturas, movimento e sons); muda só a
// diagramação, pela regra da aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é
// a base; quando um bloco pede apoio visual, ela vai para uma MOLDURA do lado direito (o quadro de
// câmera do estúdio, com o rosto centralizado e acompanhado) e o bloco ocupa o QUADRO do lado
// esquerdo. Veja src/layout.ts.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube nas laterais
export const MARGEM = 96;
// régua do episódio (chip EP, capítulo, tempo) e a barra de capítulos, no alto (no 16:9 não há abas
// de app em cima)
export const REGUA = { y: 40, altura: 56, barraY: 112 };
// a moldura da pessoa e o quadro do bloco começam aqui (logo abaixo da barra de capítulos)
export const TOPO = 144;
// abaixo desta linha ficam os controles do player do YouTube (barra de tempo, botões)
export const LIMITE_APP = 984;
// onde o conteúdo termina (cartões, frase, trilha, a onda embaixo da moldura)
export const FUNDO = 952;
// a legenda é ancorada pela base: a última linha termina aqui (duas linhas crescem para cima)
export const LEGENDA_BASE = 960;
// o vão entre o quadro do bloco (à esquerda) e a moldura da pessoa (à direita)
export const VAO_LADO = 56;

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
