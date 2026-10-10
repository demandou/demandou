// Identidade do modelo Prompt: uma bancada cinza-clara onde um prompt se monta com quatro peças
// coloridas (anil, jade, mostarda e framboesa), uma janela de chat branca e tinta quase preta.
// A cor só existe nas peças e no que cada peça muda na resposta; todo o resto é neutro.
import { loadFont as carregarAnuphan } from "@remotion/google-fonts/Anuphan";
import { loadFont as carregarSometype } from "@remotion/google-fonts/SometypeMono";

// Anuphan: o I maiúsculo tem serifa e o l tem cauda ("IA", "Il1" nunca se confundem)
export const sans = carregarAnuphan("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
// Sometype Mono: rótulos em caixa alta, números da tabela
export const mono = carregarSometype("normal", { weights: ["500", "600", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const W = 1080;
export const H = 1920;
// margens do quadro: nada encosta na esquerda, nada passa de 960 (botões do app à direita)
export const ESQ = 60;
export const DIR = 960;
// acima daqui ficam as abas do app; abaixo de BASE, só respiro; abaixo de LIMITE_APP, a interface do app
export const TOPO = 176;
export const BASE = 1500;
export const LIMITE_APP = 1560;

export const cor = {
  bancada: "#DFE2E6",
  bancadaFunda: "#CDD2D8",
  cartao: "#FFFFFF",
  cartaoFundo: "#F2F3F5",
  linha: "#E3E6EA",
  tinta: "#15171C",
  tintaSuave: "#5A606B",
  lapis: "#9CA3AD",
  lapisClaro: "#C9CED5",
  borrado: "#9AA0A9",
  sombra: "rgba(21,23,28,0.18)",
};

export type CorDaPeca = {
  // cor cheia da peça
  forte: string;
  // texto em cima da cor cheia
  texto: string;
  // a mesma cor, escura o bastante para texto sobre a bancada ou o cartão branco
  escura: string;
  // fundo claro (chips, coluna da tabela)
  clara: string;
};

// As quatro cores das peças, na ordem em que entram. Uma quinta peça repete a primeira.
export const PECAS: CorDaPeca[] = [
  { forte: "#3157D5", texto: "#FFFFFF", escura: "#2645B0", clara: "#DFE6FB" },
  { forte: "#0F8A65", texto: "#FFFFFF", escura: "#0B6F51", clara: "#D6EFE6" },
  { forte: "#E6A61F", texto: "#2A1E04", escura: "#93650A", clara: "#FBEDCC" },
  { forte: "#D2457A", texto: "#FFFFFF", escura: "#B23462", clara: "#F9DFE8" },
];
export const corDaPeca = (i: number) => PECAS[((i % PECAS.length) + PECAS.length) % PECAS.length];

// sombra das janelas e cartões: macia, um pouco mais marcada embaixo
export const sombra = (forca = 1) =>
  `0 ${Math.round(18 * forca)}px ${Math.round(48 * forca)}px rgba(21,23,28,${(0.16 * forca).toFixed(3)}), 0 2px 6px rgba(21,23,28,${(0.08 * forca).toFixed(3)})`;
