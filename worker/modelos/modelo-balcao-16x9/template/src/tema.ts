// Identidade do Balcão: a fachada de uma loja de bairro, quente e acolhedora.
// Em cima, o TOLDO listrado (tomate + creme) com o letreiro, a VITRINE de vidro com moldura de
// madeira-mel (é ali que tudo acontece) e o BALCÃO de madeira. Na versão deitada (16:9), a pessoa fala
// em tela cheia e, nos blocos, vai para uma moldura à direita da vitrine, atrás do balcão.
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

// ——— a fachada no quadro deitado (16:9, 1920×1080, o vídeo completo do YouTube) ———
// A composição é a da aula 9 do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é a base;
// quando um bloco acontece, ela vai para a MOLDURA do lado direito (o rosto no meio dela, seguido com
// ajuste suave) e a fachada aparece em volta: o toldo de ponta a ponta no alto, a VITRINE (o quadro da
// explicação) do lado esquerdo e o BALCÃO de madeira embaixo, na frente das duas. O vidro tem as
// mesmas medidas do vertical (920×658): tudo o que acontece dentro dele é o mesmo desenho, só que no
// lado esquerdo do quadro deitado.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_PLAYER = 984;
// toldo: inclinação de 0 a TOLDO.saia, saia listrada até TOLDO.base, e os recortes em meia-lua embaixo
// (de ponta a ponta do quadro, mais baixo que no vertical: o quadro deitado tem 1080 de altura)
export const TOLDO = { saia: 70, base: 100, listras: 24 };
// a vitrine: na margem da esquerda; o vidro fica 16 px para dentro da moldura
export const JANELA = { x: MARGEM, y: 176, w: 952, h: 690, borda: 16, raio: 30 };
export const VIDRO = { x: JANELA.x + JANELA.borda, y: JANELA.y + JANELA.borda, w: JANELA.w - 2 * JANELA.borda, h: JANELA.h - 2 * JANELA.borda };
// o eixo do vidro (no vertical, o meio do quadro): letreiro, títulos e blocos se centram nele
export const CENTRO_X = VIDRO.x + VIDRO.w / 2;
// o balcão de madeira: logo abaixo da vitrine e da moldura da pessoa, de ponta a ponta, até o fim do
// quadro (a pessoa fica atrás dele, como atrás do balcão de uma loja)
export const BALCAO = { y: JANELA.y + JANELA.h, h: QUADRO.h - (JANELA.y + JANELA.h) };
// A moldura da pessoa: do lado direito, da altura da vitrine até atrás do balcão (os cantos de baixo
// ficam escondidos atrás dele), na margem da direita, a 48 px da vitrine.
export const MOLDURA = { x: JANELA.x + JANELA.w + 48, y: JANELA.y, w: QUADRO.w - MARGEM - (JANELA.x + JANELA.w + 48), h: BALCAO.y + 44 - JANELA.y, raio: 40 };
// área útil dentro do vidro (folga de 28 px)
export const AREA = { x: VIDRO.x + 28, y: VIDRO.y + 26, w: VIDRO.w - 56, base: VIDRO.y + VIDRO.h - 24 };
// a legenda: centro da pílula na área segura de baixo (em quadro cheio, sobre o vídeo; com a fachada,
// na frente do balcão), entre o tampo do balcão e os controles do player
export const LEGENDA_Y = 934;
