// Identidade da Oferta: a página de uma oferta premium, impressa em papel marfim.
// Fundo marfim com uma gravura fina de certificado (guilhoché) girando devagar, cartões de papel
// claro, tinta VERDE PROFUNDO para texto, preço, selo e botão; um VERMELHO só no risco do preço
// âncora (e no risco das frases). Nada de preto + dourado, nada de neon ou luz piscando.
// Uma família só, a Plus Jakarta Sans (larga, algarismos claros para os preços).
// Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";

export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o papel da página (fundo do painel)
  pagina: "#F3EDE1",
  paginaFundo: "#E7DECD",
  gravura: "rgba(16,64,48,0.075)",
  // cartões e texto
  cartao: "#FFFCF6",
  cartaoBorda: "#E6DCC9",
  tinta: "#0F3328",
  tintaSuave: "#5D7569",
  linha: "#DCD2BF",
  // o destaque: verde profundo (preço, selo, botão, palavra-chave)
  acento: "#13573F",
  acentoEscuro: "#0B3D2C",
  acentoClaro: "#DCE9DF",
  salvia: "#9DB9A8",
  // o que "está certo"/escolhido (o mesmo verde)
  certo: "#13573F",
  certoEscuro: "#0B3D2C",
  certoClaro: "#DCE9DF",
  // o que apaga
  apagado: "#B9B2A3",
  // o risco (só no preço âncora e no trecho riscado de uma frase)
  risco: "#C8372D",
  // alerta ("não faça"): o mesmo vermelho, só no destaque de alerta
  alerta: "#C8372D",
  alertaClaro: "#F6E0DB",
  // a moldura da pessoa
  moldura: "#1B2A24",
};

export const sombra = "0 18px 40px rgba(15,51,40,0.14), 0 3px 8px rgba(15,51,40,0.08)";
export const sombraLeve = "0 8px 22px rgba(15,51,40,0.11), 0 2px 5px rgba(15,51,40,0.06)";
export const RAIO = 26;

// ——— o palco (px, quadro 1080×1920) ———
// A moldura da pessoa começa na COSTURA e vai até embaixo (os cantos de baixo ficam fora do quadro).
export const COSTURA = 1000;
export const MOLDURA = { x: 30, y: COSTURA, w: 1020, h: 1920 - COSTURA + 60, raio: 44 };
// A página: margem lateral de 64 px, topo livre da interface do app (≥ 120 px).
export const PAINEL = { x: 64, y: 132, w: 952, base: COSTURA - 34 };
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
