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

// --- Geometria do quadro deitado (px, 16:9, 1920×1080) ---
// A versão deitada do Chave, para o vídeo completo do YouTube. O hall continua o mesmo (parede de
// cimento, batente, piso, quadro de chaves, etiquetas), mas a pilha vertical vira a composição da
// aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA como base (a tela é o vão da
// porta, arte no peito) e, quando um bloco pede apoio visual, a pessoa numa PORTA do lado direito
// (a moldura, com o rosto centralizado e acompanhado) e o objeto na PAREDE do lado esquerdo (o quadro).
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// topo seguro (nada de texto acima disto)
export const TOPO = 56;
// abaixo disto: os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;
// onde o texto e os objetos terminam (acima dos controles do player)
export const BASE = 960;

// O piso do hall: rodapé e porcelanato (fica sob os controles do player)
export const PISO_Y = 996;

// A MOLDURA (aula 9): a porta da pessoa no lado direito, apoiada no piso, do alto até o chão.
// O rosto fica no meio dela (na horizontal) e a cabeça inteira, com folga em cima (layout.ts).
export const PORTA = { x: 1264, y: 48, w: 560 };
// vão entre a parede (o quadro da esquerda) e o batente da porta
export const VAO_PORTA = 48;

// O QUADRO (aula 9): a parede do lado esquerdo, da margem até a porta. É onde ficam os blocos de
// parede (lista, passos, número, comparação, gráfico, "N×"), o quadro de chaves e os painéis dos itens.
export const PAREDE = { x: MARGEM, w: PORTA.x - VAO_PORTA - MARGEM, topo: 72 };
// Margem do hall (as peças da parede encostam nela)
export const MARGEM_HALL = MARGEM;
// O quadro de chaves (faixa de cima da parede nos momentos de item): régua em `y`, etiquetas
// penduradas de `ganchoY` até ~`fundo`. Os painéis dos itens ficam embaixo dele.
export const QUADRO = { y: 60, altura: 40, ganchoY: 100, etiquetaAltura: 196, fundo: 316 };
// Área dos painéis dos itens: embaixo do quadro de chaves, até a base
export const AREA = { topo: QUADRO.fundo + 10, base: BASE };

// As artes no peito (pessoa em tela cheia): logo abaixo do queixo, centradas no rosto, numa fileira
// larga (no quadro deitado não cabe uma pilha alta). Zona padrão; o plano pode mover (campo `zona`).
export const zona = { topo: 660, altura: 300 };
// largura máxima de uma arte no peito
export const LARGURA_PEITO = 1240;
// abaixo desta altura de faixa (px), a arte do peito vai para o lado livre do rosto (layout.ts)
export const PEITO_MINIMO = 230;

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
