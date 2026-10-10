import { loadFont as carregarBitter } from "@remotion/google-fonts/Bitter";
import { loadFont as carregarReadex } from "@remotion/google-fonts/ReadexPro";
import type { Caixa } from "./motor/caixa";

// Duas famílias gratuitas do Google Fonts, as duas com o I maiúsculo serifado ("Iogurte", "IPTU" e
// "Il1" nunca confundem I com l) e sem corte condensado:
// - Bitter (serifa egípcia, de apostila): títulos, números grandes e frases de destaque;
// - Readex Pro (sans de leitura): nós do mapa, rótulos, cartões, legenda.
const bitter = carregarBitter("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });
const readex = carregarReadex("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
export const serifa = bitter.fontFamily;
export const sans = readex.fontFamily;
export const fontesProntas = () => Promise.all([bitter.waitUntilDone(), readex.waitUntilDone()]);

// Papel pontilhado, tinta índigo e um marca-texto amarelo. Nada mais.
export const cor = {
  // o papel do mapa (branco levemente lilás) e os pontos da grade
  papel: "#F2F1F5",
  ponto: "#CDC9DC",
  // cartões e nós (branco puro, um degrau acima do papel)
  cartao: "#FFFFFF",
  // tinta: texto, ramos, contornos, a curva
  tinta: "#1E1A3C",
  tintaSuave: "rgba(30,26,60,0.64)",
  // lápis: o que ainda vai ser escrito, o que foi esquecido
  lapis: "#A6A2BB",
  lapisClaro: "#D9D6E4",
  // esboço de texto: a palavra que ainda vai ser dita, legível mas apagada
  esboco: "#C6C2D6",
  // o acento: marca-texto (revisão, o que fixa, o que importa)
  marca: "#F6E24A",
  marcaForte: "#EBCB12",
  // sombra dos cartões (nunca brilho)
  sombra: "0 14px 34px rgba(30,26,60,0.16), 0 2px 6px rgba(30,26,60,0.10)",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// abaixo das abas do app
export const TOPO = 150;
// conteúdo não passa daqui (interface do app embaixo)
export const BASE = 1520;
// à direita, na metade de baixo, ficam os botões do app (curtir, comentar…): conteúdo até aqui
export const DIREITA_BAIXO = 960;

// Passo da grade de pontos do papel
export const GRADE = 44;

// Onde fica o cartão da pessoa em cada tipo de momento (px, no quadro 1080×1920).
// `zoom` > 1 aproxima no rosto; `ancoraY` é a altura do rosto dentro do cartão (0 = topo).
export const CARTAO: Record<string, Caixa> = {
  cheio: { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: 1, ancoraY: 0.303 },
  // mapa mental: cartão grande em cima, o mapa embaixo
  mapa: { x: 60, y: 150, w: 960, h: 760, raio: 34, zoom: 1.14, ancoraY: 0.47 },
  // título: cartão médio à direita, o título embaixo
  titulo: { x: 470, y: 150, w: 550, h: 660, raio: 30, zoom: 1.3, ancoraY: 0.46 },
  // curva: cartão pequeno à esquerda, a curva ocupando o corpo
  curva: { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // contador: cartão à direita
  contador: { x: 590, y: 150, w: 430, h: 540, raio: 28, zoom: 1.5, ancoraY: 0.46 },
  // barras: cartão embaixo à esquerda
  barras: { x: 60, y: 960, w: 430, h: 560, raio: 28, zoom: 1.5, ancoraY: 0.46 },
  // cartões de pergunta: cartão pequeno à esquerda
  cartoes: { x: 60, y: 150, w: 380, h: 470, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // fechamento: cartão grande
  cta: { x: 60, y: 150, w: 960, h: 900, raio: 34, zoom: 1.1, ancoraY: 0.46 },
  // trecho sem momento: cartão grande com a legenda embaixo
  fala: { x: 60, y: 150, w: 960, h: 1130, raio: 34, zoom: 1.04, ancoraY: 0.42 },
  // ---- blocos universais ----
  // abertura: cartão grande em cima, o título embaixo
  abertura: { x: 60, y: 150, w: 960, h: 760, raio: 34, zoom: 1.14, ancoraY: 0.47 },
  // frase: cartão médio à direita (as aspas à esquerda), a frase embaixo
  frase: { x: 470, y: 150, w: 550, h: 660, raio: 30, zoom: 1.3, ancoraY: 0.46 },
  // destaque: o cartão no alto, no centro; a palavra enorme embaixo, ligada a ele por um ramo
  destaque: { x: 300, y: 150, w: 480, h: 540, raio: 28, zoom: 1.45, ancoraY: 0.46 },
  // pergunta: cartão pequeno à esquerda, o "?" circulado à direita, a pergunta e as opções embaixo
  pergunta: { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // número: cartão à direita, o rótulo à esquerda, o número circulado no meio
  numero: { x: 590, y: 150, w: 430, h: 540, raio: 28, zoom: 1.5, ancoraY: 0.46 },
  // comparação: cartão pequeno à esquerda, o título à direita, os dois lados embaixo
  comparacao: { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // definição: cartão à direita, o termo à esquerda, o cartão de anotação embaixo
  definicao: { x: 590, y: 150, w: 430, h: 540, raio: 28, zoom: 1.5, ancoraY: 0.46 },
  // tópicos: cartão pequeno à esquerda (o tronco desce dele), o título à direita
  topicos: { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // passos: cartão à direita, o título à esquerda, o caminho de passos embaixo
  passos: { x: 590, y: 150, w: 430, h: 540, raio: 28, zoom: 1.5, ancoraY: 0.46 },
  // mapa com foco no mapa (no meio do vídeo): cartão pequeno à esquerda, título ao lado, mapa grande embaixo
  "mapa-foco": { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
  // gráfico: igual à curva (cartão pequeno à esquerda, o cartão do gráfico embaixo)
  grafico: { x: 60, y: 150, w: 400, h: 500, raio: 28, zoom: 1.6, ancoraY: 0.46 },
};

// o selo "ilustrativo" (pílula a lápis), igual em todas as estações
export const selo: React.CSSProperties = {
  display: "inline-block",
  padding: "6px 18px 8px",
  borderRadius: 999,
  border: `3px solid ${cor.lapis}`,
  fontFamily: sans,
  fontWeight: 500,
  fontSize: 34,
  color: cor.tintaSuave,
  lineHeight: 1,
};

export const titulo: React.CSSProperties = { fontFamily: serifa, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.012em", color: cor.tinta };
export const texto: React.CSSProperties = { fontFamily: sans, fontWeight: 500, lineHeight: 1.2, color: cor.tinta };
// letreiro pequeno em caixa-alta espaçada (≥ 30 px)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 600,
  fontSize: 32,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: cor.tintaSuave,
  lineHeight: 1,
};
