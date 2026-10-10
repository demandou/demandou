import { loadFont as carregarFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as carregarSora } from "@remotion/google-fonts/Sora";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Identidade do Medida: laboratório de cozinha. Papel creme, tinta verde-escura, sálvia profunda,
// menta para luz e líquido; vermelho SÓ quando passa do limite. Números em Sora, rótulos em
// Fraunces itálica. Nada de preto com dourado.
const sora = carregarSora("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
const fraunces = carregarFraunces("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] });

export const SORA = sora.fontFamily;
export const SERIF = fraunces.fontFamily;
export const fontesCarregadas = Promise.all([sora.waitUntilDone(), fraunces.waitUntilDone()]);

export const P = {
  papel: "#F3EEE4",
  papel2: "#E9E2D4",
  papelClaro: "#F8F4EC",
  tinta: "#1C2A22",
  tintaSuave: "rgba(28,42,34,0.62)",
  tintaFraca: "rgba(28,42,34,0.32)",
  fio: "rgba(28,42,34,0.18)",
  salvia: "#7FA88A",
  fundo: "#2B5A44",
  menta: "#A9D8B6",
  vermelho: "#CF4536",
  branco: "#FFF8F2",
  sache: "#FBF8F1",
};

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_INOUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.45, 0, 0.25, 1);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0→1 entre dois tempos absolutos (s) */
export const prog = (agora: number, a: number, b: number, easing: (x: number) => number = EASE_OUT) =>
  interpolate(agora, [a, Math.max(b, a + 0.001)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** interpolação por chaves [t, v] com easing em cada trecho */
export const chaves = (agora: number, ks: Array<[number, number]>, easing: (x: number) => number = EASE_INOUT) => {
  if (agora <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++)
    if (agora <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], easing((agora - ks[i - 1][0]) / Math.max(0.001, ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
};

/** tempo do vídeo (s) */
export const useTempo = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/** número em pt-BR (83.000; 1,5) */
export const numeroBR = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

const GRAO =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
export const GRAO_PAPEL = GRAO;

// medida de texto com a fonte real (as fontes já carregaram quando os blocos desenham)
let tela: CanvasRenderingContext2D | null = null;
export const larguraTexto = (texto: string, px: number, familia: string, peso = 700, italico = false, tracking = 0) => {
  if (!tela) tela = document.createElement("canvas").getContext("2d");
  if (!tela) return texto.length * px * 0.6;
  tela.font = `${italico ? "italic " : ""}${peso} ${px}px ${familia}`;
  return tela.measureText(texto).width + tracking * px * texto.length;
};

/** maior tamanho (até `max`, no mínimo `min`) em que o texto cabe numa linha de `largura` px */
export const caber = (texto: string, largura: number, max: number, min: number, familia: string, peso = 700, italico = false, tracking = 0) => {
  let px = max;
  while (px > min && larguraTexto(texto, px, familia, peso, italico, tracking) > largura) px -= 2;
  return px;
};

/** quebra em até `linhas` linhas e acha o maior tamanho em que cabe (largura e altura) */
export const quebrar = (
  texto: string,
  largura: number,
  max: number,
  min: number,
  familia: string,
  peso = 700,
  italico = false,
  linhasMax = 3,
  alturaMax = Infinity,
  entrelinha = 1.08,
) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const montar = (px: number) => {
    const linhas: string[] = [];
    let atual = "";
    for (const w of palavras) {
      const teste = atual ? `${atual} ${w}` : w;
      if (atual && larguraTexto(teste, px, familia, peso, italico) > largura) {
        linhas.push(atual);
        atual = w;
      } else atual = teste;
    }
    if (atual) linhas.push(atual);
    return linhas;
  };
  for (let px = max; px >= min; px -= 2) {
    const linhas = montar(px);
    const larga = Math.max(...linhas.map((l) => larguraTexto(l, px, familia, peso, italico)));
    if (linhas.length <= linhasMax && larga <= largura && linhas.length * px * entrelinha <= alturaMax) return { px, linhas };
  }
  return { px: min, linhas: montar(min) };
};
