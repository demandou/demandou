import { loadFont as carregarAtkinson } from "@remotion/google-fonts/AtkinsonHyperlegibleNext";
import { loadFont as carregarJetBrains } from "@remotion/google-fonts/JetBrainsMono";

// Interface: Atkinson Hyperlegible Next — sans de interface feita para leitura difícil (tela pequena,
// movimento). O I maiúsculo tem serifa e o l tem cauda: "IPTU", "Inglês", "Il1" nunca se confundem.
export const sans = carregarAtkinson("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;
// Teclas, comandos, medidas: JetBrains Mono.
export const mono = carregarJetBrains("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

// Um desktop calmo, com UM acento violeta-elétrico. Papel de parede lavanda-ardósia em tom médio
// (as janelas brancas destacam de verdade), grafite para texto e teclas.
export const cor = {
  // papel de parede (tom médio: contraste real com as janelas brancas)
  parede: "#A39DBD",
  paredeClara: "#B3AECB",
  paredeFunda: "#958FB1",
  paredeMaisFunda: "#8A84A7",
  // esboço desenhado direto no papel de parede (teclas e vagas que esperam)
  esbocoParede: "rgba(255,255,255,0.78)",
  // janelas
  janela: "#FFFFFF",
  barra: "#F3F2F7",
  painel: "#F7F6FA",
  linha: "rgba(23,20,38,0.10)",
  linhaForte: "rgba(23,20,38,0.16)",
  // texto
  tinta: "#17141F",
  tintaSuave: "#5F5A72",
  // esboço "a lápis": o que ainda vai ser preenchido
  esboco: "#B8B3C8",
  esbocoClaro: "#E4E1EC",
  // o acento
  violeta: "#5B3DF5",
  violetaFundo: "#ECE8FE",
  violetaFundo2: "#DCD5FD",
  // teclas (grafite) e tecla apertada (violeta)
  tecla: "#23202C",
  teclaLado: "#0E0C13",
  teclaLegenda: "#F5F3FA",
  teclaApertadaLado: "#3820B8",
  // escurecimento do recorte de tela
  veu: "rgba(16,12,30,0.48)",
};

export const W = 1080;
export const H = 1920;
export const MARGEM = 60;
// margem das janelas grandes (92% da largura)
export const MARGEM_JANELA = 40;
// topo seguro (abaixo das abas do app) e interface do app embaixo
export const TOPO = 176;
export const LIMITE_APP = 1560;

// Barra de cima (menu) e dock — decoração do desktop
export const BARRA_TOPO = 76;
export const DOCK = { y: 1452, h: 100, icone: 68, vao: 20 };

// Barra de título das janelas
export const BARRA_JANELA = 80;
export const RAIO_JANELA = 30;

// Sombra de janela: macia e baixa (não é brilho)
export const sombraJanela = "0 34px 70px rgba(30,22,60,0.30), 0 6px 16px rgba(30,22,60,0.16)";
export const sombraLeve = "0 14px 34px rgba(30,22,60,0.22), 0 2px 6px rgba(30,22,60,0.10)";

// Largura média de um caractere, em frações do corpo (Atkinson Next ~0,53; JetBrains Mono 0,60).
export const LARGURA_SANS = 0.56;
export const LARGURA_MONO = 0.6;
export const caber = (texto: string, largura: number, maximo: number, minimo = 34, fator = LARGURA_SANS) =>
  Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * fator))));

// Rótulo em caixa alta espaçada ("ATALHO 1")
export const rotuloCaixaAlta: React.CSSProperties = {
  fontFamily: sans,
  fontWeight: 800,
  fontSize: 36,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
};
