// Identidade da Órbita: o espaço profundo (azul-noite quase preto), um Sol no laranja quente,
// tipografia científica limpa: Sora para tudo que se lê e IBM Plex Mono para números e relógios.
// Versão deitada (16:9, 1920×1080), para o vídeo completo do YouTube: a pessoa fica numa moldura do
// lado direito, com o fundo natural; o espaço e a informação ficam no quadro do lado esquerdo.
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

// --- o quadro deitado (16:9, 1920×1080) ---
// A regra da aula 9 do curso (editar uma aula horizontal): o apresentador em tela cheia é a base;
// quando a fala pede apoio visual, ele vai para uma MOLDURA do lado direito, com o rosto no meio
// dela (acompanhado suavemente pelo rastro), e o QUADRO com a explicação abre do lado esquerdo.
export const W = 1920;
export const H = 1080;
// margem segura do YouTube nas laterais; abaixo de LIMITE_PLAYER ficam os controles do player
export const MARGEM = 96;
export const LIMITE_PLAYER = 984;
// a moldura da pessoa no espaço (cantos arredondados, borda fina, sombra suave, fundo natural)
export const MOLDURA = { x: 1184, y: 120, w: 640, h: 840, raio: 36 };
// onde o rosto fica dentro da moldura (centralizado na horizontal, com respiro em cima) e quanto
// da largura dela ele ocupa: um rosto gravado de longe ganha aproximação até MOLDURA_ZOOM_MAX
export const MOLDURA_ANCORA_Y = 0.34;
export const ROSTO_NA_MOLDURA = 0.27;
export const MOLDURA_ZOOM_MAX = 2.2;
// o quadro da explicação: do lado esquerdo, até a moldura (com um vão de 48 px)
export const QUADRO_DA_EXPLICACAO = { x: MARGEM, y: MARGEM, w: MOLDURA.x - 48 - MARGEM, h: MOLDURA.y + MOLDURA.h - MARGEM };

// O PALCO dos blocos do espaço. Os blocos da Órbita são diagramados na faixa de cima do vertical
// (a AREA de 952 × 610 px acima da moldura, num quadro de 1080 de largura): uma faixa deitada, que
// já tem o formato do quadro da explicação. No 16:9 cada bloco desenha nas mesmas medidas (o mesmo
// texto medido e encolhido até caber, as mesmas posições, a mesma câmera 3D) e o palco inteiro é
// posto no quadro da esquerda: a AREA fica centrada nele, na escala PALCO.escala.
export const AREA = { x: 64, y: 150, w: 952, base: 760 };
export const PALCO = (() => {
  const escala = 1;
  // a faixa do palco que vai para o quadro: a AREA na largura e, na altura, do alto da origem da
  // órbita (y ~60) até onde a moldura começava no vertical (y 800)
  const meioX = AREA.x + AREA.w / 2;
  const meioY = (60 + 800) / 2;
  const q = QUADRO_DA_EXPLICACAO;
  return { w: 1080, h: 1920, escala, x: Math.round(q.x + q.w / 2 - meioX * escala), y: Math.round(q.y + q.h / 2 - meioY * escala) };
})();
// o quadro inteiro (1920×1080) nas coordenadas do palco, com folga: os brilhos e fundos dos blocos
// cobrem esta superfície (e não só os 1080 px do palco), para nunca aparecer a borda deles
export const SUPERFICIE = (() => {
  const folga = 480;
  const x = -PALCO.x / PALCO.escala - folga;
  const y = -PALCO.y / PALCO.escala - folga;
  return { x, y, w: W / PALCO.escala + 2 * folga, h: H / PALCO.escala + 2 * folga };
})();
// um brilho radial (corona, calor) centrado em (x, y) do palco, cobrindo a superfície inteira
export const brilhoNaSuperficie = (x: number, y: number, paradas: string): React.CSSProperties => ({
  position: "absolute",
  left: SUPERFICIE.x,
  top: SUPERFICIE.y,
  width: SUPERFICIE.w,
  height: SUPERFICIE.h,
  background: `radial-gradient(circle at ${x - SUPERFICIE.x}px ${y - SUPERFICIE.y}px, ${paradas})`,
});
// um ponto do palco no quadro deitado (px)
export const doPalco = (x: number, y: number) => ({ x: PALCO.x + x * PALCO.escala, y: PALCO.y + y * PALCO.escala });

// Legenda: em quadro cheio, centrada na área segura de baixo (acima dos controles do player);
// com a pessoa na moldura, no peito dela, dentro da moldura (a explicação fica livre à esquerda).
export const LEGENDA = {
  cheia: { x: W / 2, y: 912, largura: 1400, tamanho: 62 },
  moldura: { x: MOLDURA.x + MOLDURA.w / 2, y: MOLDURA.y + MOLDURA.h - 92, largura: MOLDURA.w - 48, tamanho: 54 },
};

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
