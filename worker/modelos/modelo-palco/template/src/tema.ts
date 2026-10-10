// Identidade do Palco: sóbria e escura, como um palco apagado onde só o assunto acende.
// Grafite quase preto no fundo, texto claro, e UM destaque: o azul-cobalto das anotações (círculo,
// seta, marca-texto, foco), do sublinhado da palavra falada e dos marcadores. Nada sobre a pessoa:
// a cor do vídeo nunca muda (sem filtro, LUT, vinheta, brilho ou desfoque).
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // o palco e os painéis
  palco: "#131518",
  painel: "#1D2024",
  painelClaro: "#272B30",
  linha: "#353A41",
  // texto
  texto: "#F2F1ED",
  apagado: "#8D939C",
  // o destaque (anotações, sublinhado, marcadores)
  azul: "#3D7BFF",
  // marca-texto: o azul translúcido que grifa por trás do texto
  grifo: "rgba(61, 123, 255, 0.42)",
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.45)";
export const SOMBRA_PECA = "0 14px 36px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.22)";
// sombra das anotações sobre a foto: discreta, só para ler em qualquer imagem
export const SOMBRA_TRACO = "drop-shadow(0 2px 5px rgba(0,0,0,0.35))";

// Zooms da câmera nos cortes do modo (a) (1 = quadro como foi gravado)
export const ZOOMS = [1, 1.12, 1.24];
export const ZOOM_MAX = 1.24;

// Limites da interface do app (Reels/TikTok/Shorts): nada importante abaixo nem à direita disto
export const UI_BASE = 1490;
export const UI_DIREITA = 960;
export const UI_TOPO = 140;
export const MARGEM = 64;

// ——— o palco (modo b) ———
// O painel do assunto ocupa a tela; a janela da pessoa flutua num canto de baixo, por cima da
// borda do painel; a legenda fica ao lado da janela.
export const PAINEL = { x: 36, y: 140, w: 1008, h: 1280, raio: 34 };
export const JANELA = { w: 360, h: 450, raio: 40, y: UI_BASE - 450, zoom: 2.1, ancoraY: 0.4 };
// x da janela em cada canto (a da direita não entra nos botões do app mais que a borda)
export const xDaJanela = (canto: "esq" | "dir") => (canto === "esq" ? 36 : 1004 - JANELA.w);
// a faixa da legenda no palco: ao lado da janela, abaixo do painel
export const faixaDaLegenda = (canto: "esq" | "dir") => {
  const x0 = canto === "esq" ? xDaJanela("esq") + JANELA.w + 40 : 60;
  const x1 = canto === "esq" ? UI_DIREITA - 4 : xDaJanela("dir") - 40;
  return { x: x0, w: x1 - x0, topo: PAINEL.y + PAINEL.h + 36, base: UI_BASE - 10 };
};

// ——— onde as coisas ficam no modo (a), a partir do rosto ———
// A legenda fica numa faixa fixa logo abaixo do queixo (calculada para o zoom mais fechado, para
// nunca encostar nele); a etiqueta do destaque fica abaixo dela, na altura do peito.
export type Medidas = { rostoY: number; rostoX: number; rostoL: number; queixo: number; legTopo: number; zonaTopo: number };

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const vh = plano.videoAltura ?? 1920;
  const caixa = { ...CHEIO, zoom: ZOOM_MAX * 1.04, ancoraY: ancoraDo(plano) };
  const r = rostoNaTela(caixa, plano.rosto, vh, 0, false);
  const r1 = rostoNaTela({ ...CHEIO, ancoraY: ancoraDo(plano) }, plano.rosto, vh, 0, false);
  // do centro do rosto (olhos/nariz) ao queixo: ~0,7 da largura do rosto
  const queixo = r.y + r.largura * 0.7;
  const legTopo = Math.round(Math.min(1150, Math.max(760, queixo + 34)));
  const zonaTopo = legTopo + 176;
  const m = { rostoY: r1.y, rostoX: r1.x, rostoL: r1.largura, queixo, legTopo, zonaTopo };
  guardadas.set(plano, m);
  return m;
};

// o rosto fica na mesma altura em qualquer zoom (o reenquadramento só aproxima)
export const ancoraDo = (plano: Plano) => Math.min(0.42, Math.max(0.24, plano.rosto.y));

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
// a troca de modo e de página: começa e termina macia, sem quicar
export const troca = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
