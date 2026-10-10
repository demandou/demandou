import { loadFont as carregarGrotesca } from "@remotion/google-fonts/FamiljenGrotesk";
import { loadFont as carregarSerifa } from "@remotion/google-fonts/YoungSerif";

// Duas famílias, nenhuma condensada:
// - Young Serif: a serifa pesada e calorosa dos títulos, números de etiqueta e do "3×" — cara de
//   placa de prédio e de anúncio de imóvel bem impresso;
// - Familjen Grotesk: rótulos, valores, textos de apoio e legenda. O "l" tem perna e o "I" é reto,
//   então "Il1", "IPTU" e "Inquilinato" não confundem.
export const serifa = carregarSerifa("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const grotesca = carregarGrotesca("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

// O hall de um apartamento decorado: parede de cimento queimado, batente e quadro de chaves em
// madeira clara, ferragens pretas, chaves de latão, etiquetas de papel e um verde só para o que
// está acontecendo agora (a etiqueta da vez, o visto, o total).
export const cor = {
  parede: "#C9C4BB",
  paredeClara: "#D4D0C8",
  paredeEscura: "#B3ADA3",
  madeira: "#A8764A",
  madeiraClara: "#C49268",
  madeiraEscura: "#7A5233",
  veio: "rgba(74,44,22,0.18)",
  preto: "#1E1D1B",
  papel: "#F6F2EA",
  papelEscuro: "#E6DFD2",
  verde: "#1E6B53",
  verdeClaro: "#D3E6DC",
  latao: "#C39A4E",
  lataoClaro: "#DDBB75",
  lataoEscuro: "#8A6528",
  texto2: "#5E594F",
  // terracota: a cor de problema (alerta, risco, o lado que perde). Só nisso.
  alerta: "#A8452C",
  alertaClaro: "#EBCFC4",
  // esboço "a lápis": o que ainda vai acontecer
  lapis: "rgba(30,29,27,0.34)",
  lapisClaro: "rgba(30,29,27,0.17)",
};

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
export const MARGEM = 56;
// topo seguro (abaixo das abas do app)
export const TOPO = 176;
// abaixo disto: interface do app (legenda do post, botões)
export const LIMITE_APP = 1560;

// O quadro de chaves (faixa de cima nos momentos de item)
export const QUADRO = { y: 196, altura: 44, ganchoY: 240, etiquetaAltura: 250, fundo: 520 };
// O piso do hall: rodapé e porcelanato (fica sob a interface do app no celular)
export const PISO_Y = 1648;
// Área de baixo do quadro de chaves, onde ficam a porta (pessoa) e o painel do item.
// O texto termina em `base` (acima da interface do app); a porta lateral e os papéis descem até
// perto do piso (`papelBase`).
export const AREA = { topo: 524, base: 1552, papelBase: PISO_Y - 16 };
// Margem do hall nos itens (porta e painel ocupam quase a largura toda)
export const MARGEM_HALL = 24;
// Largura da porta nos itens laterais (rosto ≥ 300 px) e o vão entre ela e o painel
export const PORTA_LATERAL = 420;
export const VAO_PAINEL = 16;
// Porta do item "faixa" (chaveiro): centrada, entre o quadro de chaves e os chaveiros
export const PORTA_FAIXA = 530;
export const PORTA_FAIXA_LARGURA = 840;

// A parede: área do conteúdo dos blocos de parede (lista, passos, número, comparação, gráfico),
// acima da porta de baixo. O fim (y) depende do tamanho da porta (layout.ts → portaDeBaixo).
export const PAREDE = { x: MARGEM, w: W - 2 * MARGEM, topo: 196 };
// Porta de baixo: a pessoa numa porta larga apoiada no piso, centrada (altura padrão)
export const PORTA_BAIXO = { altura: 600, larguraMax: 860, larguraMin: 600 };

// Zona padrão das artes no peito (abaixo do queixo). O plano pode mover (campo `zona`).
export const zona = { topo: 996, altura: 465 };

// Estilos de texto
export const titulo: React.CSSProperties = {
  fontFamily: serifa,
  fontWeight: 400,
  lineHeight: 1.04,
  letterSpacing: "-0.01em",
  fontVariantNumeric: "lining-nums",
};
export const texto: React.CSSProperties = {
  fontFamily: grotesca,
  fontWeight: 600,
  lineHeight: 1.16,
};
// rótulo em caixa-alta espaçada (etiquetas, cabeçalhos)
export const rotulo: React.CSSProperties = {
  fontFamily: grotesca,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  lineHeight: 1,
};
