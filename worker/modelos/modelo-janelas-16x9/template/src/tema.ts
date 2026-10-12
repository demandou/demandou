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

// --- Quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Janelas, para o vídeo completo do YouTube. O estilo é o mesmo do vertical
// (cores, fontes, janelas, teclas, mouse, sons); muda só a diagramação, pela regra da aula 9 do
// curso (editar uma aula horizontal): a pessoa em tela cheia é a base e, quando um bloco pede apoio
// visual, a janela da chamada vai para uma MOLDURA do lado direito (o rosto no meio dela, seguido
// pelo rastro) e a janela do bloco ocupa o QUADRO do lado esquerdo (geometria.ts).
export const QUADRO = { w: 1920, h: 1080 };
// O desktop inteiro é desenhado numa camada "lógica" maior que o quadro e encolhida por esta
// escala (Edicao.tsx): as janelas, as teclas e a tipografia mantêm as medidas e as proporções do
// vertical, e a conta de medir e encolher texto continua a mesma.
export const ESCALA = 0.8;
// tamanho da camada lógica (px antes da escala): 2400×1350
export const W = QUADRO.w / ESCALA;
export const H = QUADRO.h / ESCALA;
// px do quadro → px da camada lógica
export const logico = (px: number) => px / ESCALA;
export const MARGEM = 60;
// margem lateral das janelas (px lógicos)
export const MARGEM_JANELA = 64;
// topo seguro (abaixo da barra de menu) e, embaixo, o começo dos controles do player do YouTube
export const TOPO = 112;
export const LIMITE_APP = logico(984);

// Barra de cima (menu) e dock (embaixo, no meio): decoração do desktop
export const BARRA_TOPO = 76;
export const DOCK = { y: H - 122, h: 100, icone: 68, vao: 20 };

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
