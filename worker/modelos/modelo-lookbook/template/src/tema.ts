// Identidade do modelo Lookbook: página de revista de moda masculina.
// Papel areia, tinta preta, um índigo de jeans como único acento.
import { loadFont as carregarPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as carregarPlex } from "@remotion/google-fonts/IBMPlexSans";

carregarPlayfair("italic", { weights: ["400", "500"], subsets: ["latin"] });
// Serifada de revista de moda: títulos, nomes das peças, números
export const serifa = carregarPlayfair("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
// Sans fina: rótulos em caixa alta, detalhes, legenda. O "I" maiúsculo tem serifa (não vira "l").
export const sans = carregarPlex("normal", { weights: ["300", "400", "500", "600"], subsets: ["latin"] }).fontFamily;

export const cor = {
  // a página (fundo) e o cartão (um tom mais claro)
  papel: "#EFEAE1",
  folha: "#F8F5EF",
  areia: "#E2D8C7",
  // tinta: textos, linhas, molduras
  tinta: "#171614",
  grafite: "#5E5951",
  // "a lápis": o que está esperando a palavra ser dita
  lapis: "#ADA597",
  lapisClaro: "#CFC8BB",
  // o acento: índigo de jeans (pino das chamadas, numeral, ênfase)
  indigo: "#2C4069",
  indigoClaro: "#5D74A3",
  // o alerta (risco, erro, "cuidado"): um vinho escuro de couro, usado com parcimônia
  vinho: "#7A2C2C",
};

// Amostras neutras para blocos sem cor dita (comparação, barras, fatias): pares de tecido
// sóbrios da cartela do modelo; o índigo de jeans fica para o que é "a resposta"/o maior.
export const CARTELA: { cor: string; tecido: "linho" | "sarja" | "la" | "algodao" }[] = [
  { cor: "#CBC2B2", tecido: "linho" },
  { cor: "#B5A27C", tecido: "sarja" },
  { cor: "#8D8C88", tecido: "la" },
  { cor: "#D8C7A8", tecido: "algodao" },
  { cor: "#666641", tecido: "sarja" },
  { cor: "#7E4A2A", tecido: "la" },
];

// Cores das peças, por nome. O plano também aceita "#RRGGBB".
export const CORES: Record<string, string> = {
  branco: "#F5F3EE",
  branca: "#F5F3EE",
  offwhite: "#ECE6DA",
  creme: "#E9DFC9",
  bege: "#D8C7A8",
  areia: "#D3C6AF",
  pedra: "#CBC2B2",
  neutro: "#CBC2B2",
  caqui: "#B5A27C",
  caramelo: "#A8693B",
  couro: "#7E4A2A",
  marrom: "#5B3A27",
  cinza: "#8D8C88",
  grafite: "#45464A",
  preto: "#1C1C1D",
  marinho: "#22304B",
  jeans: "#34496F",
  azul: "#3E5F96",
  oliva: "#666641",
  verde: "#2F5442",
  vinho: "#5E2430",
  vermelho: "#A3312B",
  rosa: "#D9A3A0",
  metal: "#B9BCC0",
  prata: "#BFC2C6",
  dourado: "#B79A5E",
};

export const corDe = (nome?: string, padrao = cor.areia) => {
  if (!nome) return padrao;
  if (nome.startsWith("#")) return nome;
  const chave = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
  return CORES[chave] ?? padrao;
};

// Cor clara pede tinta por cima; cor escura pede papel
export const escura = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

// Medidas da página (px no quadro 1080×1920)
export const MARGEM = 56;
// cartões do lado direito ficam longe da borda: ali o Instagram/TikTok põe os botões
export const MARGEM_DIREITA = 120;
// base dos cartões (acima da interface do app)
export const BASE_CARTAO = 1572;
// faixa do cabeçalho (LOOKBOOK · folio): a foto da pessoa nunca cobre
export const CABECALHO = 124;
// abaixo daqui fica a interface do aplicativo (legenda do post, botões)
export const LIMITE_APP = 1600;

// Rótulo em caixa alta espaçada (mínimo 30 px)
export const rotulo: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 500,
  fontSize: 32,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  lineHeight: 1.1,
};

// Largura média de um caractere em frações do corpo (para caber texto sem medir o DOM)
export const LARGURA_SERIFA = 0.5;
export const LARGURA_ITALICO = 0.44;

export const caber = (texto: string, largura: number, maximo: number, fator = LARGURA_SERIFA, minimo = 0) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));
