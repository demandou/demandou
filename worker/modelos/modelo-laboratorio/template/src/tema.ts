import { loadFont as carregarEdu } from "@remotion/google-fonts/EduSAHand";
import { loadFont as carregarLexend } from "@remotion/google-fonts/Lexend";
import { loadFont as carregarSpaceMono } from "@remotion/google-fonts/SpaceMono";

// Três vozes de texto, como num caderno de laboratório:
// - Edu SA Hand: a letra de quem anota (caligrafia escolar legível, I maiúsculo com serifa);
// - Space Mono: o que vem impresso no caderno e nos rótulos técnicos (FIG. 1, ~450 nm);
// - Lexend: a legenda (feita para leitura fácil; I com serifa, l e 1 diferentes).
const fonteMao = carregarEdu("normal", { weights: ["600", "700"], subsets: ["latin"] });
const fonteMono = carregarSpaceMono("normal", { weights: ["400", "700"], subsets: ["latin"] });
const fonteSans = carregarLexend("normal", { weights: ["500", "600"], subsets: ["latin"] });
export const mao = fonteMao.fontFamily;
export const mono = fonteMono.fontFamily;
export const sans = fonteSans.fontFamily;
export const esperarFontes = () => Promise.all([fonteMao.waitUntilDone(), fonteMono.waitUntilDone(), fonteSans.waitUntilDone()]);

// Papel milimetrado de caderno de laboratório, tinta azul-preta de caneta e lápis de cor.
// Duas cores de assunto: o azul (onda curta, céu) e o vermelhão (onda longa, pôr do sol);
// o âmbar só no Sol. As sete cores do espectro aparecem só no feixe que se abre.
export const cor = {
  papel: "#F2F2EA",
  papelClaro: "#F8F8F2",
  grade: "rgba(104,150,124,0.26)",
  gradeForte: "rgba(104,150,124,0.5)",
  tinta: "#1D2935",
  tintaSuave: "rgba(29,41,53,0.62)",
  // esboço a lápis do que ainda vai ser desenhado
  lapis: "#A7AEA9",
  azul: "#2361CF",
  azulClaro: "#9DBBEB",
  vermelho: "#DD5228",
  ambar: "#EFA634",
  // fita adesiva fosca que prende a foto da pessoa no caderno
  fita: "rgba(226,219,188,0.72)",
};

// O feixe que se abre (de cima para baixo: vermelho → violeta), em tons de lápis de cor
export const ESPECTRO = ["#D8462E", "#EC8A2C", "#E5BE34", "#5DA55A", "#2E7FC9", "#3C4AA6", "#7A4EB2"];

// As partes de um feixe que se abre (modo de qualquer assunto do `espectro`) e as fatias da pizza:
// tons de lápis de cor do espectro, escuros o bastante para escrever o nome na cor
export const PARTES = ["#D8462E", "#C9711C", "#3F8A3C", "#2E6FC0", "#6A45A6"];
export const corDasPartes = (n: number): string[] => {
  const escolha: Record<number, number[]> = { 1: [3], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };
  return (escolha[Math.max(1, Math.min(5, n))] ?? escolha[5]).map((i) => PARTES[i]);
};

// Número em pt-BR: 83000 → "83.000"; 1.5 com casas 1 → "1,5"
export const formatar = (n: number, casas = 0) => {
  const negativo = n < 0;
  const [inteiro, fracao] = Math.abs(n).toFixed(Math.max(0, casas)).split(".");
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "−" : ""}${milhar}${fracao ? `,${fracao}` : ""}`;
};

// Nome impresso de cada bloco na linha do caderno ("Fig. 3 · Medida") quando o plano não dá `rotulo`
export const NOME_DO_BLOCO: Record<string, string> = {
  topicos: "Observações",
  passos: "Procedimento",
  numero: "Medida",
  comparacao: "Amostras",
  grafico: "Gráfico",
  destaque: "Atenção",
  definicao: "Definição",
  frase: "Anotação",
  pergunta: "Pergunta",
  anotacoes: "Notas",
  espectro: "Decomposição",
  particulas: "Espalhamento",
  ondas: "Comparação",
  observador: "Observação",
  trajeto: "Trajeto",
  cta: "Próximo passo",
  abertura: "Experimento",
  titulo: "Experimento",
};

// Céu: dia (alto → horizonte) e pôr do sol (alto → horizonte)
export const CEU = {
  dia: ["#5A8CDA", "#97BAEA", "#D7E5F6"],
  tarde: ["#3A4E9C", "#C9637A", "#F2A23E"],
};

export const W = 1080;
export const H = 1920;
export const MARGEM = 64;
// tamanho do quadradinho do papel milimetrado (a linha forte vem a cada 5)
export const QUADRO = 36;

// Legenda: a etiqueta assenta a base aqui (cresce para cima), logo acima da interface do app
export const LEGENDA_BASE = 1552;
export const LEGENDA_CORPO = 54;
export const LIMITE_APP = 1560;
// Nada das figuras passa daqui quando a legenda pode aparecer
export const BASE_FIGURA = 1440;

// Menores tamanhos (px no quadro 1080×1920), para ler no celular
export const MIN = { titulo: 84, nota: 46, rotulo: 34, impresso: 30 };

// Rótulo impresso do caderno (FIG. 1 · LUZ BRANCA): mono em caixa-alta espaçada
export const estiloImpresso: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 700,
  fontSize: 34,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: cor.tintaSuave,
  whiteSpace: "nowrap",
};
