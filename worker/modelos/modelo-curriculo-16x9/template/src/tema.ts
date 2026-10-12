import { loadFont as carregarInclusive } from "@remotion/google-fonts/InclusiveSans";
import { loadFont as carregarLiterata } from "@remotion/google-fonts/Literata";
import { loadFont as carregarPlaypen } from "@remotion/google-fonts/PlaypenSans";

// Literata: a serifa do documento (nome, linhas do currículo, títulos grandes).
// Inclusive Sans: a interface da revisão (comentário, rótulos, legenda) — I maiúsculo com serifa.
// Playpen Sans: a letra da caneta vermelha (notas, reescrita) — legível, I ≠ l ≠ 1.
const fonteSerifa = carregarLiterata("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const fonteSans = carregarInclusive("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const fonteMao = carregarPlaypen("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
export const serifa = fonteSerifa.fontFamily;
export const sans = fonteSans.fontFamily;
export const mao = fonteMao.fontFamily;
// o <Edicao> só desenha depois disto: a folha mede o texto com a própria fonte (src/medida.ts)
export const fontesCarregadas = Promise.all([fonteSerifa.waitUntilDone(), fonteSans.waitUntilDone(), fonteMao.waitUntilDone()]);

// Poucas cores: a mesa cinza-fria, o papel branco, a tinta do documento e a caneta vermelha.
export const cor = {
  mesa: "#D3D8DE",
  // sombra/linha da mesa e bordas de cartão
  mesaEscura: "#B9C0C9",
  papel: "#FFFFFF",
  tinta: "#1C2129",
  // texto secundário do documento
  cinza: "#5E6773",
  // esboço a lápis: o que ainda vai ser escrito, linhas do resto da página
  lapis: "#BAC0C8",
  // a caneta
  vermelho: "#D9352A",
  // o bilhete adesivo da pessoa: papel um tom mais quente que a folha
  nota: "#FFFDF6",
  // fundo claro da caneta (marca de seleção, etiqueta)
  vermelhoClaro: "#FBE3E0",
  // texto claro sobre o vídeo
  claro: "#FFFFFF",
};

// --- O quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Currículo, para o vídeo completo do YouTube. A revisão a caneta é a mesma (a
// folha, o bilhete adesivo da pessoa, a caneta vermelha, os sons), mas a composição segue a aula 9
// do curso (editar uma aula horizontal): a pessoa em TELA CHEIA é a base (o vídeo deitado inteiro);
// quando um bloco pede a folha, a pessoa vira o bilhete na MOLDURA do lado direito (rosto
// centralizado e acompanhado) e a folha ocupa o QUADRO do lado esquerdo. As posições de cada lugar
// estão em src/cena.ts.
export const W = 1920;
export const H = 1080;
// margens seguras do YouTube: 96 px nas laterais
export const MARGEM = 96;
// no YouTube não há interface por cima do vídeo no alto: só uma folga
export const TOPO_APP = 64;
// abaixo desta linha ficam os controles do player (barra de tempo, botões)
export const LIMITE_APP = 984;

// Área dos cartões em tela cheia (abertura, destaque, fechamento): a faixa do peito, do queixo até a
// base útil. O cortar.mjs do 16:9 grava a `zona` ~60 px abaixo do queixo; o plano pode mover com `zona`.
export const zona = { esquerda: 96, direita: 96, topo: 640, altura: 368 };
// a faixa do peito termina aqui (acima da legenda e dos controles do player)
export const BASE_PEITO = 948;
// largura máxima de um cartão no peito (centrado no rosto): uma fileira larga em vez da pilha alta
export const LARGURA_CARTAO = 1320;

// Legenda: a tira de papel assenta a base aqui (cresce para cima), na área segura de baixo
export const LEGENDA_BASE = 968;
export const LEGENDA_LARGURA = 1240;

// A folha, em unidades da página (na escala 1 vale px na tela)
export const FOLHA = { w: 720, h: 1400, margem: 48 };

// Sombra de papel sobre a mesa (não é brilho: é a folha fora da mesa)
export const sombraFolha = "0 2px 4px rgba(28,33,41,0.10), 0 18px 40px rgba(28,33,41,0.16)";
export const sombraCartao = "0 2px 4px rgba(28,33,41,0.12), 0 14px 34px rgba(28,33,41,0.20)";

// Rótulo de seção do documento (caixa alta espaçada)
export const rotuloSecao: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 700,
  fontSize: 30,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  lineHeight: 1,
  color: "#1C2129",
};
