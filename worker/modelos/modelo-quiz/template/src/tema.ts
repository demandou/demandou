// Identidade do Quiz: programa de perguntas de TV, claro e refinado (nada de cassino).
// Fundo de estúdio claro, cartões brancos, tinta azul-marinho, UMA cor de destaque (cobalto) para
// letras, anel e ênfase, e o verde reservado para a resposta certa. Sora em tudo (legível no celular).
// Nada mexe na pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Sora";

export const fonte = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const cor = {
  // o estúdio (fundo do painel)
  estudio: "#ECEFF7",
  estudioFundo: "#DFE4F2",
  cenario: "rgba(47,75,255,0.06)",
  // cartões e texto
  cartao: "#FFFFFF",
  tinta: "#13183A",
  tintaSuave: "#5B6183",
  linha: "#DADFEE",
  // o destaque: cobalto (letras, anel, palavra-chave)
  acento: "#2F4BFF",
  acentoEscuro: "#1D34CC",
  acentoClaro: "#E3E7FF",
  // a resposta certa (só ela é verde)
  certo: "#12B76A",
  certoEscuro: "#0B8A4F",
  certoClaro: "#DDF6E9",
  // o que apaga na revelação
  apagado: "#A9AFC6",
  // alerta ("não faça", erro): coral, só no destaque de alerta e no ✗ do errado-certo
  alerta: "#F2553D",
  alertaClaro: "#FDE6E2",
};

export const sombra = "0 18px 40px rgba(19,24,58,0.13), 0 3px 8px rgba(19,24,58,0.08)";
export const sombraLeve = "0 8px 22px rgba(19,24,58,0.10), 0 2px 5px rgba(19,24,58,0.06)";
export const RAIO = 30;

// ——— o palco (px, quadro 1080×1920) ———
// A moldura da pessoa começa na COSTURA e vai até embaixo (os cantos de baixo ficam fora do quadro).
export const COSTURA = 1000;
export const MOLDURA = { x: 30, y: COSTURA, w: 1020, h: 1920 - COSTURA + 60, raio: 46 };
// O painel: margem lateral de 64 px, topo livre da interface do app (≥ 120 px).
export const PAINEL = { x: 64, y: 132, w: 952, base: COSTURA - 34 };
// nada importante abaixo disto (interface do app)
export const UI_BASE = 1700;
