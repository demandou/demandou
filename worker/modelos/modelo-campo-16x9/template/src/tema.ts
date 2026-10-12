// Identidade do Campo: o caderno de campo do agrônomo. Fundo de palha com curvas de nível que
// derivam devagar, cartões creme com cabeçalho verde-lavoura, terra para o solo e o que cai, céu
// para água e chuva, e UM amarelo de sinalização (as estacas de levantamento: contornos de talhão,
// mira, grifo). Títulos em Plus Jakarta Sans; todo número em Fira Mono (leitura de instrumento).
// Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as carregarMono } from "@remotion/google-fonts/FiraMono";

export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const mono = carregarMono("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o chão do painel (palha) e as curvas de nível
  palha: "#EFE9DA",
  palhaFundo: "#E6DEC9",
  nivel: "rgba(120,96,56,0.16)",
  // cartões
  cartao: "#FFFDF7",
  cartaoBorda: "#E0D6BF",
  tinta: "#1E2B20",
  tintaSuave: "#5F6B58",
  linha: "#E4DCC8",
  // verde-lavoura (o que cresce, o que está certo, cabeçalhos)
  verde: "#2F7A3A",
  verdeEscuro: "#1F5A2A",
  verdeClaro: "#DDEBD2",
  // terra (solo, o que cai, o lado ruim)
  terra: "#9A5B2E",
  terraEscura: "#6E3E1E",
  terraClara: "#F1E1CF",
  // céu e água
  ceu: "#3D8FCC",
  ceuEscuro: "#22679E",
  ceuClaro: "#DCEEFA",
  // o amarelo de sinalização (estaca de levantamento, contorno, grifo)
  sinal: "#F4BE1B",
  sinalEscuro: "#B98A00",
  // alerta (destaque "alerta", ✗)
  alerta: "#B9412A",
  alertaClaro: "#F7DCD3",
  // apagado
  apagado: "#B9B29F",
};

export const sombra = "0 18px 40px rgba(46,38,20,0.16), 0 3px 8px rgba(46,38,20,0.08)";
export const sombraLeve = "0 8px 22px rgba(46,38,20,0.12), 0 2px 5px rgba(46,38,20,0.06)";
export const RAIO = 26;

// ——— o palco (px, quadro 1080×1920) ———
// A moldura da pessoa começa na COSTURA e vai até embaixo (os cantos de baixo ficam fora do quadro).
export const COSTURA = 1012;
export const MOLDURA = { x: 36, y: COSTURA, w: 1008, h: 1920 - COSTURA + 60, raio: 40 };
// O painel de campo: margem lateral de 64 px, topo livre da interface do app (≥ 120 px).
export const PAINEL = { x: 64, y: 132, w: 952, base: COSTURA - 36 };
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
