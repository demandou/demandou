// Identidade do Anatomia: ilustração médica premium e fácil de ler. Papel branco-azulado, azul-gelo,
// traço fino de tinta e UM acento azul clínico. O vermelho-músculo só aparece na anatomia (fibras).
// A pessoa fica numa moldura com o fundo natural, à direita; à esquerda, a "prancha" clínica.
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

// ——— a grade do quadro deitado (16:9, 1920×1080) ———
// A versão deitada do Anatomia, para o vídeo completo do YouTube. A diagramação segue a aula 9 do
// curso (editar uma aula horizontal): a pessoa em TELA CHEIA como base; quando um bloco de prancha
// pede apoio visual, ela vai para uma MOLDURA do lado direito, com o rosto centralizado e seguido
// suavemente, e a prancha clínica ocupa o QUADRO do lado esquerdo. No vertical a prancha ficava em
// cima e a pessoa embaixo; aqui as duas ficam lado a lado.
export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_APP = 984;
// A PRANCHA é desenhada na mesma grade do vertical (1080 de largura, do topo até FUNDO), com a área
// útil x 64 a 1016 e y 130 a FUNDO − 40. Ela entra no quadro deitado ampliada por `escala`, com o
// canto em (x, y): a área útil cai em x 96 a 1144 e y 80 a 828 da tela, à esquerda da moldura.
// Assim o rosto em ilustração, o corte, a linha do tempo e os blocos mantêm as medidas e o encaixe de
// texto do vertical (nada vaza), só que no quadro da esquerda.
export const FUNDO = 850;
export const PRANCHA = { x0: 64, x1: 1016, y0: 130, y1: FUNDO - 40 };
export const PRANCHA_NA_TELA = { x: 26, y: -63, escala: 1.1 };
// prancha (grade do vertical) → tela, e o caminho de volta
export const naTela = (x: number, y: number) => ({ x: PRANCHA_NA_TELA.x + x * PRANCHA_NA_TELA.escala, y: PRANCHA_NA_TELA.y + y * PRANCHA_NA_TELA.escala });
export const naPrancha = (x: number, y: number) => ({ x: (x - PRANCHA_NA_TELA.x) / PRANCHA_NA_TELA.escala, y: (y - PRANCHA_NA_TELA.y) / PRANCHA_NA_TELA.escala });
// a moldura da pessoa quando a prancha abre: à direita, em pé, ao lado do quadro da prancha
// (a borda direita da prancha cai em x 1214; a moldura começa em 1216 e termina na margem segura)
export const CARD = { x: 1216, y: 72, w: 608, h: 800, raio: 44 };
// quanto do quadro o rosto ocupa na moldura (largura do rosto ÷ largura da moldura)
export const ROSTO_NA_MOLDURA = 0.42;
// a moldura do "consultório" (virada sem vídeo de figurino): a pessoa grande, centrada, sobre o
// papel, com o cabeçalho do mito acima dela
export const CARD_GRANDE = { x: 160, y: 196, w: 1600, h: 676, raio: 44 };
// a legenda: sempre na faixa segura de baixo (centro), abaixo da prancha e da moldura e acima dos
// controles do player
export const LEGENDA_Y = 928;

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
