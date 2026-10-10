// Identidade do Balcão: a fachada de uma loja de bairro, quente e acolhedora.
// Em cima, o TOLDO listrado (tomate + creme) com o letreiro, a VITRINE de vidro com moldura de
// madeira-mel (é ali que tudo acontece) e o BALCÃO de madeira; embaixo, a pessoa numa moldura larga.
// Tinta café (nunca preto), adesivo de preço mostarda, carimbo e pino em tomate.
// Plus Jakarta Sans em todo texto de leitura; Fraunces itálica só no letreiro do toldo (rótulo curto).
// Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont as carregarFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const fonteLetreiro = carregarFraunces("italic", { weights: ["600"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // a parede da fachada (creme-manteiga) e as tábuas
  parede: "#F3E1C1",
  paredeEscura: "#E6CDA3",
  tabua: "rgba(122,74,38,0.07)",
  // o toldo: listras tomate e creme
  toldo: "#D8432A",
  toldoEscuro: "#A92F1C",
  toldoCreme: "#FFF2DE",
  toldoCremeSombra: "#E9D3B4",
  // madeira-mel (moldura da vitrine, prateleira, balcão)
  madeira: "#C17E43",
  madeiraClara: "#E2AE72",
  madeiraEscura: "#8A5228",
  // o vidro da vitrine (um creme quase branco) e os reflexos
  vidro: "#FFF8EC",
  vidroFundo: "#F7E8CF",
  reflexo: "rgba(255,255,255,0.5)",
  // tinta café (texto), café suave (detalhe)
  tinta: "#3B2416",
  tintaSuave: "#7A5A45",
  // papel das etiquetas e cartões
  papel: "#FFFBF3",
  papelBorda: "#EAD8BC",
  // o adesivo de preço (mostarda) e a sua tinta
  adesivo: "#F4B731",
  adesivoEscuro: "#C98C10",
  // ênfase / carimbo / pino / alerta: tomate
  acento: "#D8432A",
  acentoEscuro: "#A92F1C",
  acentoClaro: "#FBE3DA",
  // o verde-sálvia (mapa, "certo")
  salvia: "#8FA66E",
  salviaClara: "#DCE3C6",
  salviaEscura: "#5E7444",
  // o kraft do laço do combo
  kraft: "#C9A06A",
  kraftEscuro: "#9C7744",
  // apagado (o que perde numa comparação)
  apagado: "rgba(59,36,22,0.32)",
};

export const sombra = "0 16px 34px rgba(59,36,22,0.18), 0 3px 8px rgba(59,36,22,0.10)";
export const sombraLeve = "0 8px 20px rgba(59,36,22,0.13), 0 2px 5px rgba(59,36,22,0.08)";

// ——— a fachada (px, quadro 1080×1920) ———
// toldo: inclinação de 0 a TOLDO.saia, saia listrada até TOLDO.base, e os recortes em meia-lua embaixo
export const TOLDO = { saia: 128, base: 190, listras: 14 };
// a vitrine: margem lateral de 64 px; o vidro fica 16 px para dentro da moldura
export const JANELA = { x: 64, y: 262, w: 952, h: 690, borda: 16, raio: 30 };
export const VIDRO = { x: JANELA.x + JANELA.borda, y: JANELA.y + JANELA.borda, w: JANELA.w - 2 * JANELA.borda, h: JANELA.h - 2 * JANELA.borda };
// o balcão de madeira, logo abaixo da vitrine
export const BALCAO = { y: JANELA.y + JANELA.h, h: 56 };
// A moldura da pessoa começa embaixo do balcão e vai até o fim (os cantos de baixo ficam fora do quadro).
export const COSTURA = BALCAO.y + BALCAO.h;
export const MOLDURA = { x: 30, y: COSTURA, w: 1020, h: 1920 - COSTURA + 60, raio: 40 };
// área útil dentro do vidro (folga de 28 px)
export const AREA = { x: VIDRO.x + 28, y: VIDRO.y + 26, w: VIDRO.w - 56, base: VIDRO.y + VIDRO.h - 24 };
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
