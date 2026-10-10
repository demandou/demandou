// Identidade da Aula: a edição de um curso gravado, em 16:9. Uma sala de aula moderna em papel:
// fundo de papel claro com uma grade quadriculada bem leve, slides em folha branca, tinta azul-noite
// e UM acento, o violeta (o marca-texto e a caneta do professor). Títulos e texto em Plus Jakarta
// Sans; fórmulas e variáveis na STIX Two (a tipografia dos livros de matemática), sempre grandes e
// bem espaçadas. Nada sobre a pessoa: a cor do vídeo nunca muda, nada de brilho ou halo atrás dela.
import { loadFont as carregarJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as carregarStix } from "@remotion/google-fonts/STIXTwoText";
import { Easing, interpolate } from "remotion";
import { CHEIO_16x9, rostoNaTela, type Caixa } from "./motor/caixa";
import type { Plano } from "./plano";

const jakarta = carregarJakarta("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const stix = carregarStix("normal", { weights: ["500"], subsets: ["latin", "latin-ext"] });
carregarStix("italic", { weights: ["500"], subsets: ["latin", "latin-ext"] });
export const FONTE = jakarta.fontFamily;
export const MATEMATICA = stix.fontFamily;

export const COR = {
  // o papel (fundo), a folha do slide e a grade quadriculada
  papel: "#ECEAE4",
  folha: "#FFFFFF",
  grade: "rgba(22,27,46,0.055)",
  // tinta azul-noite (texto) e o cinza de apoio
  tinta: "#161B2E",
  apoio: "#5F6678",
  linha: "#D8D5CC",
  trilho: "#E4E1D9",
  // o acento (um só): violeta; o marca-texto é o violeta claro
  violeta: "#6B3BF2",
  violetaEscuro: "#4C22CC",
  marcaTexto: "#E7DEFF",
  violetaFundo: "#F5F1FF",
  // alerta e risco (só no errado e no riscado)
  alerta: "#E5484D",
};

export const SOMBRA = "0 20px 50px rgba(22,27,46,0.13), 0 3px 10px rgba(22,27,46,0.08)";
export const RAIO = 28;

// ——— o quadro 16:9 ———
export const W = 1920;
export const H = 1080;
// margem segura: nada importante encosta nas bordas; nada abaixo de BASE (controles do player)
export const MARGEM_X = 96;
export const MARGEM_Y = 64;
export const BASE = H - 96;

// O cabeçalho da aula (barra de progresso): no alto, à esquerda, nos dois modos.
export const CABECALHO = { x: MARGEM_X, y: MARGEM_Y, h: 60 };

// ——— modo slide: o slide (~62% da largura) e a janela do professor ao lado ———
// A janela fica do lado em que a pessoa foi gravada (ela encolhe para o lado dela); o slide, no outro.
export type Lado = "esq" | "dir";
export const ladoDaJanela = (plano: Plano): Lado => (plano.rosto.x >= 0.5 ? "dir" : "esq");
export const JANELA = { w: 520, h: 660, raio: 32, zoom: 1.9, ancoraY: 0.4 };
const VAO = 32;
export const SLIDE_W = W - MARGEM_X * 2 - JANELA.w - VAO; // 1176 (61% da largura)
export const SLIDE_Y = 148;
// com legenda ligada, o slide sobe a base para a legenda caber embaixo dele
export const slideH = (plano: Plano) => (plano.legendas ? BASE - SLIDE_Y - 92 : BASE - SLIDE_Y);
export const slideX = (plano: Plano) => (ladoDaJanela(plano) === "dir" ? MARGEM_X : MARGEM_X + JANELA.w + VAO);
// na cauda, o último slide vai para o centro da tela
export const SLIDE_CENTRO = (W - SLIDE_W) / 2;
export const janelaX = (plano: Plano) => (ladoDaJanela(plano) === "dir" ? W - MARGEM_X - JANELA.w : MARGEM_X);
export const janelaY = (plano: Plano) => Math.round(SLIDE_Y + (slideH(plano) - JANELA.h) / 2);
export const caixaJanela = (plano: Plano): Caixa => ({
  x: janelaX(plano),
  y: janelaY(plano),
  w: JANELA.w,
  h: JANELA.h,
  raio: JANELA.raio,
  // rosto grande (gravado de perto): menos zoom, para a cabeça caber inteira
  zoom: JANELA.zoom * Math.min(1, Math.max(0.6, 0.1 / (plano.rosto.rastro?.largura ?? 0.1))),
  ancoraY: JANELA.ancoraY,
  ancoraX: 0.5,
});
// margem interna do slide
export const PAD = 56;

// ——— modo professor: a pessoa em quadro cheio; os cartões entram no lado livre ———
export const ladoLivre = (plano: Plano): Lado => (plano.rosto.x >= 0.5 ? "esq" : "dir");
export const LIVRE_W = 840;
// os cartões do modo professor ficam embaixo, no lado livre (cobrem o que estiver na mesa)
export const BASE_CARTAO = 960;
export const xLivre = (plano: Plano, w = LIVRE_W) => (ladoLivre(plano) === "esq" ? MARGEM_X : W - MARGEM_X - w);
// as câmeras do professor (1 = o quadro como foi gravado): alternam nos cortes
export const ABERTO = 1;
export const FECHADO = 1.12;
// a linha dos olhos fica na mesma altura em todas as câmeras
export const ancoraDo = (plano: Plano) => Math.min(0.42, Math.max(0.25, plano.rosto.y));
export const caixaCheia = (plano: Plano, zoom: number): Caixa => ({ ...CHEIO_16x9, zoom, ancoraY: ancoraDo(plano), ancoraX: 0.5 });
// onde o rosto fica num enquadramento cheio (sem seguir): para pôr a palavra-chave na altura dele
export const rostoNoQuadro = (plano: Plano, zoom: number) => rostoNaTela(caixaCheia(plano, zoom), plano.rosto, plano.videoAltura ?? H, 0, false);

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
