// Identidade do Wireframe: um canvas de design (grafite com grade de pontos), um celular em
// wireframe cinza revisado a caneta vermelha (redlines) e a página que se reconstrói com a cor
// da marca do cliente. Poucas cores: grafite, cinzas do wireframe, vermelho de revisão e a cor
// da página (do plano). Inclusive Sans (I com serifa, l com cauda) + Red Hat Mono para medidas;
// Young Serif só no título da página reconstruída.
import { loadFont as carregarInclusive } from "@remotion/google-fonts/InclusiveSans";
import { loadFont as carregarMono } from "@remotion/google-fonts/RedHatMono";
import { loadFont as carregarSerif } from "@remotion/google-fonts/YoungSerif";

const inclusive = carregarInclusive("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] });
const redHat = carregarMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
const young = carregarSerif("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
export const sans = inclusive.fontFamily;
export const mono = redHat.fontFamily;
export const serif = young.fontFamily;

// Resolve quando as três fontes carregaram: só então dá para medir o texto de verdade.
export const fontesCarregadas = Promise.all([inclusive.waitUntilDone(), redHat.waitUntilDone(), young.waitUntilDone()]);

export const W = 1080;
export const H = 1920;

export const cor = {
  // canvas
  canvas: "#1C1D20",
  ponto: "#34363C",
  painel: "#26282C",
  painelBorda: "#373A40",
  hud: "#9497A0",
  hudForte: "#E9EAEC",
  // aparelho
  moldura: "#0D0E10",
  molduraBorda: "#41444B",
  // wireframe (cinzas)
  tela: "#F3F4F6",
  bloco: "#DCDFE4",
  linha: "#CDD1D7",
  traco: "#B4B9C1",
  textoFraco: "#C5C9CF",
  textoMedio: "#9097A1",
  // revisão
  vermelho: "#FF4733",
  vermelhoFundo: "rgba(255,71,51,0.10)",
  // claros
  papel: "#F6F6F3",
  tinta: "#17181B",
  tintaSuave: "#5E626B",
};

// Cores da página reconstruída (padrão do demo; o plano pode trocar em `pagina.cor` e `pagina.tinta`)
export const PAGINA_COR = "#FFD95A";
export const PAGINA_TINTA = "#17130E";

// ——— Geometria (quadro 1080×1920) ———

// O celular no canvas
export const CELULAR = { x: 40, y: 324, w: 556, h: 1198, borda: 12, raio: 70 };
export const TELA = {
  x: CELULAR.x + CELULAR.borda,
  y: CELULAR.y + CELULAR.borda,
  w: CELULAR.w - 2 * CELULAR.borda,
  h: CELULAR.h - 2 * CELULAR.borda,
  raio: 58,
};
// a página é desenhada em unidades de 390 de largura (como um celular de verdade) e ampliada
export const LARGURA_PAGINA = 390;
export const ESCALA = TELA.w / LARGURA_PAGINA;
export const ALTURA_VISIVEL = TELA.h / ESCALA;

// A pessoa como comentário fixado no canvas: canto inferior esquerdo em ponta, apontando o celular
export const PINO = { x: 620, y: 230, w: 416, h: 470, raio: 46, zoom: 1.75, ancoraY: 0.5 };
// O balão do comentário (a fala da pessoa) logo abaixo do pino
export const BALAO = { x: 620, y: 718, w: 416, h: 282 };
// O inspetor (medidas, contraste, rolagem): fica à esquerda dos botões do aplicativo
export const INSPETOR = { x: 620, y: 1024, w: 340, h: 470 };
// A barra de cima do canvas (nome da página e contador de problemas)
export const HUD_Y = 142;

// Cartões de quadro cheio (abertura, frase, fechamento): na altura do peito
export const CARTAO = { x: 76, w: 928 };

// Tamanho de texto que cabe numa largura (aproximação para Inclusive Sans negrito)
export const caberNaLargura = (linhas: string[], largura: number, maximo: number, fator = 0.53) => {
  const maior = Math.max(1, ...linhas.map((l) => l.length));
  return Math.min(maximo, Math.floor(largura / (maior * fator)));
};

export const rotulo: React.CSSProperties = {
  fontFamily: mono,
  fontWeight: 500,
  fontSize: 30,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

// Contraste WCAG entre duas cores (#RRGGBB)
const canal = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminancia = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6), 16);
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
};
export const contraste = (a: string, b: string) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
export const formatarRazao = (r: number) => `${r.toFixed(1).replace(".", ",")}:1`;
export const milhar = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
