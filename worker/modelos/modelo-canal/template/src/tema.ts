// Identidade do Canal: o pacote gráfico de um canal de YouTube bem editado, em 16:9.
// Painéis de vidro escuro (tinta translúcida com desfoque do fundo) no lado livre do quadro,
// texto giz em Inter, rótulos e contadores em DM Mono (como os carimbos de tempo dos capítulos)
// e um único destaque: o cobalto. Coral só para alerta. Nada sobre a pessoa: a cor do vídeo
// nunca muda, nada de brilho ou halo atrás dela.
import { loadFont as carregarInter } from "@remotion/google-fonts/Inter";
import { loadFont as carregarMono } from "@remotion/google-fonts/DMMono";
import { Easing, interpolate } from "remotion";
import { rostoNaTela, CHEIO_16x9 } from "./motor/caixa";
import type { Plano } from "./plano";

const inter = carregarInter("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const mono = carregarMono("normal", { weights: ["500"], subsets: ["latin", "latin-ext"] });
export const FONTE = inter.fontFamily;
export const MONO = mono.fontFamily;

export const COR = {
  // o vidro dos painéis e o que fica por baixo do texto
  vidro: "rgba(17,19,24,0.80)",
  tinta: "#111318",
  trilho: "#2A2E37",
  // texto
  giz: "#F6F5F1",
  apoio: "#A3A9B4",
  // o destaque (um só) e a versão clara para texto sobre o vidro
  cobalto: "#3D63FF",
  cobaltoClaro: "#9CB2FF",
  // alerta e risco
  coral: "#FF5B4A",
};

export const RAIO = 22;
export const SOMBRA = "0 18px 48px rgba(0,0,0,0.30), 0 3px 10px rgba(0,0,0,0.18)";
export const VIDRO: React.CSSProperties = {
  background: COR.vidro,
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: SOMBRA,
};

// ——— o quadro 16:9 ———
export const W = 1920;
export const H = 1080;
// margem segura: nada importante encosta nas bordas (o player do YouTube cobre o rodapé)
export const MARGEM_X = 96;
export const MARGEM_Y = 72;
export const BASE = H - 96; // a linha de baixo das tarjas (acima dos controles do player)

// As câmeras virtuais (1 = o quadro como foi gravado)
export const ABERTO = 1;
export const MEDIO = 1.15;
export const FECHADO = 1.3;

// ——— o lado livre ———
// A informação entra do lado oposto ao rosto; no reframe a câmera aproxima e empurra a pessoa
// para o outro lado. O painel lateral ocupa a metade livre.
export type Lado = "esq" | "dir";
export const ladoLivre = (plano: Plano, pedido?: Lado): Lado => pedido ?? (plano.rosto.x <= 0.5 ? "dir" : "esq");
export const LATERAL = { w: 824, topo: 116, base: 964 };
export const xLateral = (lado: Lado) => (lado === "dir" ? W - MARGEM_X - LATERAL.w : MARGEM_X);

// O reframe: onde o rosto fica (fração da tela) e quanto a câmera aproxima para levá-lo até lá.
// O vídeo nunca deixa borda vazia: o zoom mínimo é o que leva o rosto até a âncora.
export const ANCORA_REFRAME = 0.27;
export const reframe = (plano: Plano, lado: Lado) => {
  const fx = plano.rosto.x;
  const a = lado === "dir" ? ANCORA_REFRAME : 1 - ANCORA_REFRAME;
  const preciso = Math.max((1 - a) / Math.max(0.05, 1 - fx), a / Math.max(0.05, fx));
  return { zoom: Math.min(1.5, Math.max(1.3, preciso)), ancoraX: a, ancoraY: ancoraDo(plano) + 0.02 };
};

// o rosto fica na mesma altura em todas as câmeras (a linha dos olhos não pula no corte)
export const ancoraDo = (plano: Plano) => Math.min(0.42, Math.max(0.25, plano.rosto.y));

// Onde o rosto está na tela num enquadramento cheio com `zoom` (sem seguir): para pôr as palavras-chave
// na altura do rosto.
export const rostoNoQuadro = (plano: Plano, zoom: number) =>
  rostoNaTela({ ...CHEIO_16x9, zoom, ancoraY: ancoraDo(plano) }, plano.rosto, plano.videoAltura ?? H, 0, false);

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.45, 0, 0.55, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
