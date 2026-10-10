// Identidade da Órbita: o espaço profundo (azul-noite quase preto), um Sol no laranja quente,
// tipografia científica limpa: Sora para tudo que se lê e IBM Plex Mono para números e relógios.
// A pessoa fica numa moldura embaixo, com o fundo natural; o espaço e a informação ficam em cima.
// Nada mexe na cor do vídeo da pessoa: nada de brilho, halo ou luz atrás dela.
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";
import { loadFont as carregarMono } from "@remotion/google-fonts/IBMPlexMono";
import { Easing, interpolate } from "remotion";

const sora = carregarSora("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const mono = carregarMono("normal", { weights: ["500", "600"], subsets: ["latin", "latin-ext"] });
export const SORA = sora.fontFamily;
export const MONO = mono.fontFamily;
export const fontesCarregadas = Promise.all([sora.waitUntilDone(), mono.waitUntilDone()]);

export const COR = {
  // o espaço (fundo do 3D, em degradê)
  espaco: "#04050A",
  espacoAlto: "#0A0E1C",
  espacoMeio: "#05070F",
  // o Sol (o único destaque quente) e as versões clara e quente
  sol: "#D97757",
  solClaro: "#F0A27F",
  quente: "#FFE6DA",
  // texto
  branco: "#FFF8F2",
  mudo: "rgba(255,248,242,0.66)",
  fraco: "rgba(255,248,242,0.32)",
  linha: "rgba(255,240,228,0.42)",
  // luz fria (estrelas azuladas, a Terra) e o alerta (brasa)
  frio: "#BFD6FF",
  alerta: "#FF6A4D",
};

// ——— o quadro vertical ———
export const W = 1080;
export const H = 1920;
export const MARGEM = 64;
// a moldura da pessoa no espaço (cantos arredondados, borda fina, sombra suave, fundo natural)
export const MOLDURA = { x: 64, y: 800, w: 952, h: 1056, raio: 44 };
// a faixa de cima, onde fica a informação quando a pessoa está na moldura
export const AREA = { x: 64, y: 150, w: 952, base: 760 };
// legenda: centro da linha, na altura do peito (abaixo do queixo)
export const LEGENDA_Y = 1330;
export const LEGENDA_Y_MOLDURA = 1420;

// ——— tempo ———
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.25, 1);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// 0→1 entre dois instantes (s)
export const prog = (t: number, a: number, b: number, easing: (x: number) => number = EASE_OUT) =>
  b <= a ? (t >= b ? 1 : 0) : interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
// entra → segura → sai
export const inOut = (t: number, a: number, b: number, entrada = 0.35, saida = 0.3) => {
  if (t < a || t > b + saida) return 0;
  return Math.min(prog(t, a, a + entrada), 1 - prog(t, b, b + saida, EASE_IN));
};

// entrada padrão de um texto: sobe 18 px saindo do desfoque
export const entrada = (p: number, dy = 18): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dy}px)`,
  filter: p < 0.999 ? `blur(${(1 - p) * 8}px)` : undefined,
});

// número em pt-BR (1.234,5)
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const SOMBRA_TEXTO = "0 4px 24px rgba(0,0,0,0.55)";
