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

// Quadro 1080×1920: faixas reservadas pela interface do app
export const W = 1080;
export const H = 1920;
export const TOPO_APP = 150;
export const LIMITE_APP = 1560;

// Área dos cartões em tela cheia (abertura, fechamento): abaixo do queixo. O plano pode mover com `zona`.
export const zona = { esquerda: 64, direita: 64, topo: 1000, altura: 440 };

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
