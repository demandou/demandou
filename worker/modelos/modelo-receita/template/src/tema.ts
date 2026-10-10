import { loadFont as carregarDisplay } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as carregarTexto } from "@remotion/google-fonts/DMSerifText";

// DM Serif Display (títulos e números) + DM Serif Text (rótulos, ingredientes, anotações):
// serifada de contraste alto, de cardápio de confeitaria francesa — elegante, com números de
// gota (1, 2, 3) bonitos em tamanho grande, e estreita o bastante para textos grandes caberem.
// As duas têm um peso só (400) e itálico de verdade. O I maiúsculo tem serifa dos dois lados e o
// l só à esquerda, mais alto: "Iogurte", "Il1", "IPTU" não se confundem.
export const fonte = carregarDisplay("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
carregarDisplay("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });
export const texto = carregarTexto("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;
carregarTexto("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });

// Tamanhos (px num quadro de 1080 de largura). Pensados para o celular: na tela de 540 px
// cada um fica com a metade — rótulos ≥ 28, ingredientes ≥ 34, anotações ≥ 38, apoio ≥ 40.
export const TAM = {
  rotulo: 56,
  tituloAbertura: 100,
  tituloCabecalho: 84,
  passos: 60,
  assinatura: 60,
  quantidade: 150,
  ingrediente: 68,
  numeroPasso: 380,
  deN: 60,
  tituloPasso: 96,
  tituloPassoMinimo: 76,
  anotacao: 76,
  indice: 56,
  fechamento: 104,
  fechamentoMinimo: 80,
  apoio: 80,
  dica: 96,
  dicaMinimo: 80,
  legenda: 54,
};

// Cozinha refinada: cacau (a mesa e a tinta), creme de leite (a ficha) e UM acento pistache.
// O caramelo aparece só no calor (a chama). A massa é a cor do doce que está sendo feito.
export const cor = {
  cacau: "#3A2621",
  // tinta secundária sobre o creme
  cacauSuave: "rgba(58,38,33,0.66)",
  cacauApagado: "rgba(58,38,33,0.40)",
  // a mesa onde a ficha está (um pouco mais funda que a tinta)
  mesa: "#2E1E1A",
  creme: "#F6EFE4",
  // vagas, áreas internas, fundo dos cartões de ingrediente
  cremeFundo: "#EDE3D3",
  // esboço "a lápis": traço tracejado, ícone apagado
  lapis: "#C9B9A6",
  // pauta da ficha
  pauta: "rgba(58,38,33,0.085)",
  pistache: "#A9BD6C",
  pistacheClaro: "#DDE6BE",
  // pistache mais fundo: só traço fino ou preenchimento (não é cor de texto sobre o creme)
  pistacheFundo: "#8A9E4F",
  caramelo: "#D4883F",
  carameloClaro: "#EDB676",
  // a panela vista de cima
  metal: "#D9D0C3",
  metalParede: "#C7BCAD",
  metalFundo: "#E9E2D6",
};

// Cores que um ingrediente vira dentro da panela (e a cor da massa pronta).
export const tintas = {
  creme: "#EEDDB8",
  manteiga: "#F0D98E",
  cacau: "#6A4434",
  massa: "#4E3128",
  caramelo: "#C98A4B",
  branco: "#F7F3EA",
  pistache: "#B9C987",
  framboesa: "#B85A6B",
  morango: "#C9606A",
  limao: "#D8DC8A",
};
export type Tinta = keyof typeof tintas;

// Geometria do quadro (px, 1080×1920)
export const W = 1080;
export const H = 1920;
// a ficha ocupa a tela com uma borda de mesa
export const FICHA = { x: 36, w: 1008, raio: 46, topoCheio: 112 };
// margem interna do conteúdo
export const X0 = 96;
export const X1 = 984;
export const LARGURA_UTIL = X1 - X0;
// topo seguro (abaixo das abas do app) e limite da interface do app
export const TOPO = 168;
export const LIMITE_APP = 1556;
// desenhos (panela, pote) podem descer um pouco mais que o texto: só a borda deles fica sob a interface
export const BASE_DESENHO = 1712;
// rodapé da ficha (marca e índice da receita), relativo ao topo da ficha
export const RODAPE = 1704;
// a janela da pessoa nos cantos
export const JANELA = { w: 372, h: 476, raio: 48 };

// Largura média de um caractere das DM Serif, em frações do corpo (medida: de ~0,45 em palavras
// estreitas a ~0,52 em texto com muitos "m", "e", "o"; 0,53 dá folga). Serve para caber texto sem
// medir o DOM.
export const LARGURA_FONTE = 0.53;
export const caber = (texto: string, largura: number, maximo: number, minimo = 44) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * LARGURA_FONTE))));
// largura estimada de um texto (para posicionar linhas e sublinhados sem medir o DOM)
export const largura = (t: string, corpo: number, italico = false) => t.length * corpo * (italico ? 0.48 : 0.5);

// Rótulo em caixa alta espaçada ("RECEITA", "INGREDIENTES", "PASSO")
export const rotulo: React.CSSProperties = {
  fontFamily: texto,
  fontWeight: 400,
  fontSize: TAM.rotulo,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  lineHeight: 1,
  color: cor.cacauSuave,
};

// Trecho em destaque: itálico com o traço pistache por baixo (como um grifo de caneta)
export const destaque: React.CSSProperties = {
  fontStyle: "italic",
  backgroundImage: `linear-gradient(${cor.pistache}, ${cor.pistache})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "0 90%",
  backgroundSize: "100% 0.16em",
};

// Sombra de objeto sobre a ficha: macia e baixa (não é brilho nem contorno)
export const sombra = "0 22px 50px rgba(46,30,26,0.30), 0 3px 8px rgba(46,30,26,0.16)";
