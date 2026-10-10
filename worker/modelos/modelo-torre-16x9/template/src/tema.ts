// Identidade do modelo Torre: lançamento imobiliário à noite.
// Azul-noite e grafite no fundo, marfim no texto, UM acento champanhe (dourado claro) nos traços,
// pinos, etiquetas e rotas. Serifa elegante só nos números grandes e no nome do empreendimento;
// Manrope nos rótulos (caixa alta espaçada) e Sora nos títulos e na legenda.
import { loadFont as carregarSerifa } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as carregarManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";

const serifa = carregarSerifa("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] });
const manrope = carregarManrope("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const sora = carregarSora("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });

export const FONTE = { serifa: serifa.fontFamily, sans: manrope.fontFamily, sora: sora.fontFamily };

export const K = {
  noite: "#070C17",
  navy: "#0E1729",
  tinta: "#0A1120",
  marfim: "#F5F0E6",
  marfimSuave: "rgba(245,240,230,0.72)",
  ouro: "#D9BE8A",
  ouroClaro: "#F1DFB6",
  ouroFundo: "#A7884F",
  linha: "rgba(236,242,255,0.85)",
  // cor de problema (destaque "alerta", lado perdedor): coral queimado, nunca vermelho puro
  alerta: "#E58A6E",
  vidro: "rgba(9,15,28,0.82)",
};

// ---------- o quadro deitado (16:9, 1920×1080): a versão do vídeo completo do YouTube ----------
// A composição segue a aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é a
// base; quando um bloco pede apoio visual, ela vai para a MOLDURA do lado direito (o rosto no meio
// dela, acompanhado com ajuste suave) e o QUADRO da esquerda recebe o mundo 3D e o bloco. Quando a
// ideia termina, ela volta à tela cheia.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM_X = 96;
export const LIMITE_PLAYER = 984;

// ---------- a pessoa ----------
// A moldura da direita: cantos arredondados, filete champanhe, o fundo natural da pessoa.
export const MOLDURA = { x: 1096, y: 96, w: 728, h: 784, raio: 46 };
// tamanho do rosto que a moldura procura (px); gravação de perto não aproxima
export const ROSTO_MOLDURA_PX = 260;

// ---------- o quadro da esquerda (o mundo 3D, as colunas e os blocos) ----------
// Os blocos, as colunas da assinatura e os rótulos presos ao mundo 3D são medidos no ESPAÇO do
// vertical (a metade de cima do 1080×1920, onde o mesmo texto já cabe com as fontes de verdade) e
// desenhados no quadro: o ponto (X, Y) desse espaço cai em (QUADRO.x + QUADRO.escala·X,
// QUADRO.y + QUADRO.escala·Y) na tela. A câmera 3D usa a mesma conta (mundo/geo.ts), então o
// rótulo continua preso ao prédio, à rota e aos cômodos. A faixa dos blocos (x 64 a 1016, y 60 a 930
// no espaço) vira x 115 a 991, y 63 a 864 na tela: acima da legenda, longe da moldura.
export const ESPACO = { w: 1080, h: 1920 };
export const QUADRO = { x: 56, y: 8, escala: 0.92 };

// ---------- legenda ----------
// no terço de baixo, centrada na tela e acima dos controles do player: sobre a pessoa em tela
// cheia, logo abaixo do quadro e da moldura quando eles estão abertos
export const LEGENDA_Y = 932;
export const LEGENDA_LARGURA = 1500;

// ---------- área do mundo / dos blocos (no ESPAÇO do vertical, dentro do QUADRO) ----------
export const AREA = { x: 64, y: 290, w: 952, base: 930 };
export const MARGEM = 64;
export const TOPO = 120;
