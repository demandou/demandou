import { loadFont as carregarPlex } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as carregarMono } from "@remotion/google-fonts/RedHatMono";

// Interface: IBM Plex Sans — sans de interface de escritório, com números tabulares. O I maiúsculo
// tem serifa e o l minúsculo tem cauda: "IPTU", "Inglês" e "Il1" nunca se confundem.
export const sans = carregarPlex("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  ignoreTooManyRequestsWarning: true,
}).fontFamily;
// Fórmulas, endereço da célula: Red Hat Mono.
export const mono = carregarMono("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  ignoreTooManyRequestsWarning: true,
}).fontFamily;

// Uma planilha clara e fria, grafite para o texto e UM acento: framboesa (nunca o verde de planilha).
export const cor = {
  // fundo do aplicativo (barras) e das células
  app: "#F3F4F6",
  celula: "#FFFFFF",
  // cabeçalhos de linha/coluna
  cabecalho: "#ECEEF2",
  cabecalhoTexto: "#69717E",
  // linhas da grade
  grade: "#DCE0E6",
  gradeForte: "#C6CBD3",
  // texto
  tinta: "#15181D",
  tintaSuave: "#5A626F",
  // esboço "a lápis": o que ainda vai ser preenchido
  esboco: "#C3C8D0",
  esbocoClaro: "#E6E9EE",
  // o acento
  acento: "#D11F6A",
  acentoEscuro: "#A0144F",
  acentoFundo: "#FCE7F0",
  acentoFundo2: "#F8CFE0",
  // o acento em R,G,B (para seleções tingidas com transparência) — troque junto com o `acento`
  acentoRgb: "209,31,106",
};

export const W = 1080;
export const H = 1920;

// --- geometria fixa da interface (px no quadro 1080×1920) ---
// barra de título e barra de ferramentas: decoração, ficam embaixo das abas do app
export const BARRA_TITULO = { y: 0, h: 96 };
export const FERRAMENTAS = { y: 96, h: 80 };
// barra de fórmula: caixa de nome (endereço) + "fx" + o texto (uma linha de 46 px ou duas de 40 px)
export const FORMULA = { y: 176, h: 120, nomeX: 18, nomeW: 160, textoX: 276 };
// cabeçalho das colunas (A B C)
export const COLUNAS_Y = FORMULA.y + FORMULA.h;
export const COLUNAS_H = 52;
// coluna dos números das linhas
export const NUMEROS_W = 48;
// a grade começa aqui
export const GRADE_Y = COLUNAS_Y + COLUNAS_H;
// colunas A, B, C (bordas em x). D aparece cortada na direita. A–C fica centrada no quadro.
export const COL = [NUMEROS_W, 360, 592, 1040];
export const LETRAS = ["A", "B", "C", "D", "E"];
// linhas 1–5: a faixa de cima (pessoa + célula de destaque)
export const LINHA = 100;
export const FAIXA = { y: GRADE_Y, h: 5 * LINHA };
// tabela: com a sub-linha aberta, termina exatamente no fundo da grade
export const TABELA_Y = FAIXA.y + FAIXA.h;
export const TAB = { cabecalho: 68, linha: 128, sub: 100, total: 104 };
// fundo da grade; abaixo dele, as abas da planilha (acima da interface do app) e a barra de status
export const FUNDO_UTIL = 1504;
export const ABAS = { y: FUNDO_UTIL, h: 76 };
export const STATUS = { y: ABAS.y + ABAS.h };
export const LIMITE_APP = 1560;

// Largura média de um caractere, em frações do corpo (Plex Sans ~0,52; mono 0,6).
export const LARGURA_SANS = 0.53;
export const LARGURA_MONO = 0.6;
export const caber = (texto: string, largura: number, maximo: number, minimo = 40, fator = LARGURA_SANS) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));

// Rótulo em caixa alta espaçada ("DESPESA", "SAÚDE")
export const rotuloCaixaAlta: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 600,
  fontSize: 32,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  lineHeight: 1,
};

export const sombraCelula = "0 18px 40px rgba(21,24,29,0.16), 0 3px 8px rgba(21,24,29,0.08)";
