import { loadFont as carregarInclusive } from "@remotion/google-fonts/InclusiveSans";
import { loadFont as carregarMono } from "@remotion/google-fonts/RedditMono";

// Duas famílias gratuitas do Google Fonts:
// - Inclusive Sans (títulos, apoio, legenda): sans humanista de leitura fácil. O I maiúsculo tem
//   serifa e o 1 tem bandeira, então "Iogurte", "IPTU" e "Il1" nunca confundem I com l.
// - Reddit Mono (rótulos da chapa, etiquetas, números de medida): a cara das marcações de um filme
//   de raio-x. Monoespaçada, sem ambiguidade de I/l/1.
// Nada de fonte condensada.
export const sans = carregarInclusive("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Sala de laudos: fundo quase preto azulado, chapa em negativo, traço de osso luminoso, um ciano de
// medida (linhas de alinhamento, arcos de ângulo, o que é certo) e um vermelho só para tensão.
export const cor = {
  // a sala e a parede onde ficam os negatoscópios
  sala: "#04080D",
  parede: "#08111A",
  // o aro de metal do negatoscópio
  aro: "#111B25",
  aroClaro: "#22313E",
  // o painel aceso (aparece na borda em volta da chapa e na moldura da pessoa)
  luz: "#D9E9F0",
  luzSuave: "rgba(217,233,240,0.55)",
  // o filme: negativo azulado, mais escuro nas bordas
  chapa: "#0B1824",
  chapaCentro: "#12263A",
  chapaBorda: "#050C13",
  // o traço do esqueleto (luminoso) e dos objetos (mais apagado)
  osso: "#E4F4FB",
  objeto: "rgba(228,244,251,0.42)",
  // o acento: medida, alinhamento, o que ficou certo
  ciano: "#5CC8E8",
  cianoSuave: "rgba(92,200,232,0.45)",
  // só nos pontos de tensão (e na palavra de dor do título)
  tensao: "#FF5446",
  tensaoSuave: "rgba(255,84,70,0.35)",
  // texto
  texto: "#EEF5F8",
  textoSuave: "rgba(238,245,248,0.68)",
  // esboço "a lápis": o que ainda vai acender
  esboco: "rgba(238,245,248,0.17)",
  esbocoTraco: "rgba(228,244,251,0.22)",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// topo seguro (abaixo das abas do app)
export const TOPO = 170;
// abaixo disto: interface do app (legenda do post, botões)
export const LIMITE_APP = 1560;
// texto e rótulos não passam daqui à direita (coluna de botões do app)
export const DIREITA_SEGURA = 960;

// A moldura da pessoa: o vídeo fica dentro de uma "chapa iluminada" (aro escuro + borda de luz).
// Estas são as caixas do VÍDEO; o aro e a luz são desenhados por fora (ARO + LUZ px).
export const ARO = 12;
export const LUZ = 9;
const PESSOA_LARGURA = 372;
const PESSOA_ALTURA = 456;
// zoom 1,55 mostra rosto e ombros; ancoraY 0,45 deixa respiro acima do cabelo (se a gravação for
// muito fechada e a cabeça cortar no alto, diminua o zoom)
export const PESSOA_ESQUERDA = { x: MARGEM + ARO + LUZ, y: TOPO + 8 + ARO + LUZ, w: PESSOA_LARGURA, h: PESSOA_ALTURA, raio: 6, zoom: 1.55, ancoraY: 0.45 };
export const PESSOA_DIREITA = { ...PESSOA_ESQUERDA, x: W - MARGEM - ARO - LUZ - PESSOA_LARGURA };
// na pausa a pessoa vai para o centro, entre o relógio e o cronômetro
export const PESSOA_CENTRO = { ...PESSOA_ESQUERDA, x: Math.round((W - 404) / 2) - 18, w: 404, h: 456 };

// O negatoscópio grande (a chapa de raio-x), embaixo da faixa da pessoa
export const NEGATOSCOPIO = { x: 40, y: 718, w: 1000, h: 812 };
// a chapa fica dentro do painel, com a borda de luz aparecendo em volta
export const PAINEL_INSET = 14;
export const CHAPA_INSET = 12;
export const areaDaChapa = () => {
  const n = NEGATOSCOPIO;
  const i = PAINEL_INSET + CHAPA_INSET;
  return { x: n.x + i, y: n.y + i, w: n.w - 2 * i, h: n.h - 2 * i };
};

// Bloco do título do ajuste, ao lado da pessoa
export const BLOCO_TITULO = { y: TOPO + 14, h: 500, largura: 448 };

// Zona padrão das artes de quadro cheio (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 960, altura: 460 };

// Estilos de texto
export const titulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  lineHeight: 1.04,
  letterSpacing: "-0.012em",
  color: cor.texto,
};
export const apoio: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 500,
  lineHeight: 1.16,
  color: cor.textoSuave,
};
// marcação de filme: caixa-alta espaçada, monoespaçada
export const marcacao: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  lineHeight: 1,
};
