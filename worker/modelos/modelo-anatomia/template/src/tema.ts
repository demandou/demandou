// Identidade do Anatomia: ilustração médica premium e fácil de ler. Papel branco-azulado, azul-gelo,
// traço fino de tinta e UM acento azul clínico. O vermelho-músculo só aparece na anatomia (fibras).
// A pessoa fica numa moldura com o fundo natural; em cima, a "prancha" clínica.
import { continueRender, delayRender, Easing, interpolate, staticFile } from "remotion";

// ——— fonte: Sora variável (100–800), arquivo local (renderiza sem internet) ———
export const FONT = "Sora Anatomia";
if (typeof document !== "undefined" && typeof FontFace !== "undefined") {
  const espera = delayRender("fonte Sora");
  const face = new FontFace(FONT, `url(${staticFile("fonts/Sora-Variable.ttf")}) format("truetype")`, { weight: "100 800" });
  face
    .load()
    .then(() => {
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
      continueRender(espera);
    })
    .catch((e) => {
      console.error("fonte Sora", e);
      continueRender(espera);
    });
}

export const K = {
  acc: "#2F6FE4",
  accHi: "#5B97FF",
  accSoft: "rgba(47,111,228,0.14)",
  // "alerta": vermelho clínico (só em destaque de alerta e no lado errado)
  alerta: "#C2413A",
  ink: "#13202F",
  ink2: "#3E4E62",
  slate: "#6A7C92",
  line: "#9EB0C4",
  ice: "#DCE9F7",
  ice2: "#EEF4FB",
  paper: "#F7FAFD",
  paperRGB: "247,250,253",
  white: "#FFFFFF",
};

// o músculo (ilustração): vermelho anatômico, nunca usado em texto
export const MUS = { base: "#B4554D", light: "#F0AA9F", dark: "#A3473F", edge: "#7A2E29", tendon: "#F5EAE5" };

// ——— a grade do quadro 1080×1920 ———
// a moldura da pessoa quando a tela divide: larga, embaixo; a prancha clínica fica em cima (0 → CARD.y)
export const CARD = { x: 60, y: 840, w: 960, h: 1016, raio: 44 };
// a moldura do "consultório" (virada sem vídeo de figurino): a pessoa grande, sobre o papel
export const CARD_GRANDE = { x: 44, y: 300, w: 992, h: 1556, raio: 44 };
// área segura da prancha (texto e desenho)
export const PRANCHA = { x0: 64, x1: 1016, y0: 130, y1: 800 };
// nada importante abaixo disto (interface do app)
export const LIMITE_APP = 1700;

// ——— movimento ———
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.25, 1);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** 0→1 entre dois instantes (s) */
export const prog = (now: number, a: number, b: number, easing: (x: number) => number = EASE_OUT) =>
  b <= a ? (now >= a ? 1 : 0) : interpolate(now, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
/** entra em a (dura i) → segura → sai em b (dura o) */
export const win = (t: number, a: number, b: number, i = 0.35, o = 0.4) => Math.min(prog(t, a, a + i, EASE_OUT), 1 - prog(t, b, b + o, EASE_IN));
/** interpolação por chaves [t, v] com easing em cada trecho */
export const keys = (now: number, ks: Array<[number, number]>, easing: (x: number) => number = EASE_INOUT) => {
  if (now <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (now <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], easing((now - ks[i - 1][0]) / Math.max(1e-6, ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
};

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mix = (a: string, b: string, p: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp01(p))).join(",")})`;
};
