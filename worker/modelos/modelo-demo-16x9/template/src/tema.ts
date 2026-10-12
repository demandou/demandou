// Identidade do Demo (versão deitada, 16:9): quase nada de desenho. O que aparece no quadro é
// material real (gravação de tela com cursor, imagem, print); o modelo só desenha a faixa-rótulo
// verde na emenda do split e, quando o vídeo pede, blocos simples no palco (verde-garrafa quase
// preto, texto branco, UM destaque em verde). A legenda é laranja-ouro, caixa-alta, fonte display
// condensada, no terço de baixo. Nada sobre a pessoa: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { loadFont as loadBebas } from "@remotion/google-fonts/BebasNeue";
import { Easing, interpolate } from "remotion";
import { CHEIO_16x9, QUADRO_16x9, enquadrar, type Caixa, type Rosto } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;
export const FONTE_LEGENDA = loadBebas("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] }).fontFamily;

export const COR = {
  // o fundo do quadro e o palco dos blocos (verde-garrafa quase preto, o clima do estúdio)
  fundo: "#050A08",
  palco: "#0B1714",
  palco2: "#14241F",
  // texto no palco
  osso: "#F4F7F5",
  apagado: "#8FA39B",
  fio: "rgba(244,247,245,0.18)",
  // o destaque (um só): o verde da faixa-rótulo
  neon: "#4CD137",
  // palco invertido do alerta
  claro: "#F4F7F5",
  tinta: "#07100D",
  // a legenda: laranja-ouro com contorno marrom-escuro
  ouro: "#F4A53C",
  ouroContorno: "#3A1E08",
  // o rótulo
  rotulo: "#4CD137",
  // texto sobre o vídeo
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.4)";

// ——— a grade (quadro deitado, 16:9, 1920×1080) ———
// A versão deitada é o vídeo completo do YouTube. A regra da aula 9 do curso (editar uma aula
// horizontal) decide a composição: a pessoa em TELA CHEIA é a base; quando a fala pede o material,
// ela vai para uma MOLDURA do lado direito, com o rosto centralizado e acompanhado com suavidade, e
// o material ocupa o QUADRO do lado esquerdo. No Demo isso é o split deitado. Três layouts, sempre
// trocados em corte seco (os mesmos do vertical, com outra geometria):
//  split = o insert no quadro da esquerda (x 0 a 1180, na altura toda, sem borda) e a pessoa na
//          moldura da direita (no vertical: o insert nos 44% de cima e a pessoa embaixo);
//  cheio = o insert no quadro inteiro (a pessoa some, só a voz fica);
//  eu    = a pessoa em tela cheia, um pouco mais fechada (zoom 1,12), sem insert. No vídeo longo é
//          a base: fora dos momentos, ela volta para cá.
export type Layout = "split" | "cheio" | "eu";
export const LARGURA = 1920;
export const ALTURA = 1080;
// a emenda do split: onde o quadro do insert encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1180;
// o palco do insert no split (os blocos são desenhados nele): o quadro da esquerda inteiro
export const PALCO_W = COSTURA;
export const PALCO_H = ALTURA;
// a altura útil do palco para o conteúdo dos blocos: acima dos controles do player
export const PALCO_UTIL = 1000;
// a moldura da pessoa no split: a faixa da direita, na altura toda
export const MOLDURA = { x: COSTURA, y: 0, w: LARGURA - COSTURA, h: ALTURA };
// centro vertical da legenda: no terço de baixo (~82% da altura), o mesmo em todos os layouts.
// Com a pessoa na moldura, a legenda fica centrada na moldura (em cima do peito, como no vertical)
export const LEGENDA_Y = 884;
// largura máxima da legenda no quadro cheio e na moldura (o corpo encolhe até caber)
export const LEGENDA_CHEIO = 1500;
export const LEGENDA_MOLDURA = MOLDURA.w - 64;
// margem interna do palco
export const MARGEM = 80;
// Limite dos controles do player do YouTube (só para as guias): nada importante abaixo de y 984
export const UI_BASE = 984;
// A faixa-rótulo verde fica centrada na emenda do split (a linha vertical x 1180), no terço de
// baixo, entre o queixo e a legenda (ou acima da cabeça, se ali não couber): nunca sobre o rosto
// (`yReserva`: a base da faixa quando nenhum dos dois lugares cabe, colada acima da legenda)
export const ROTULO = { x: COSTURA, larguraMax: 720, yReserva: LEGENDA_Y - 64 };

// folga acima da cabeça na moldura (px)
const FOLGA_SPLIT = 150;
// tela cheia: um pouco mais perto que a gravação, mantendo a composição dela (sem recorte vertical)
export const ZOOM_EU = 1.12;
// na moldura a pessoa vem um pouco mais perto (como no split vertical)
export const ZOOM_SPLIT = 1.08;
// do centro do rosto (olhos/nariz) ao topo da cabeça e ao queixo, em larguras de rosto
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

// O `rosto` do plano sempre com o quadro deitado (o cortar.mjs do 16:9 já grava `rosto.quadro`; um
// plano antigo sem ele seria lido como vertical pelo motor)
const rostos = new WeakMap<object, Rosto>();
export const rostoDoPlano = (plano: Plano): Rosto => {
  if (plano.rosto.quadro) return plano.rosto;
  let r = rostos.get(plano.rosto);
  if (!r) {
    r = { ...plano.rosto, quadro: QUADRO_16x9 };
    rostos.set(plano.rosto, r);
  }
  return r;
};
// a largura média do rosto (fração da largura do quadro), do rastro ou o padrão do 16:9
export const larguraDoRosto = (plano: Plano) => {
  const l = plano.rosto.rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// A caixa da pessoa em cada layout. Na moldura, o rosto fica centralizado na largura dela, com a
// cabeça a FOLGA_SPLIT do topo; em tela cheia, a composição da gravação, um pouco mais perto.
export const caixaDaPessoa = (plano: Plano, modo: Layout = "split"): Caixa => {
  const rosto = rostoDoPlano(plano);
  const vh = plano.videoAltura ?? ALTURA;
  if (modo !== "split") {
    return { ...CHEIO_16x9, zoom: ZOOM_EU, ancoraX: entre(rosto.x, 0, 1), ancoraY: entre((rosto.y * ALTURA) / vh, 0.2, 0.6), raio: 0 };
  }
  const largura = larguraDoRosto(plano);
  let ancoraY = 0.4;
  for (let k = 0; k < 2; k++) {
    const caixa: Caixa = { ...MOLDURA, raio: 0, zoom: ZOOM_SPLIT, ancoraX: 0.5, ancoraY };
    const esc = enquadrar(caixa, rosto, vh, rosto.rastro ? 0 : null).escala;
    const L = largura * LARGURA * esc;
    ancoraY = entre((FOLGA_SPLIT + ATE_TOPO * L) / MOLDURA.h, 0.25, 0.55);
  }
  return { ...MOLDURA, raio: 0, zoom: ZOOM_SPLIT, ancoraX: 0.5, ancoraY };
};

// Onde o rosto fica na tela em cada layout (px): centro, largura, topo da cabeça e queixo.
export type RostoNaTela = { x: number; y: number; L: number; topoCabeca: number; queixo: number };
export type Medidas = { split: RostoNaTela; eu: RostoNaTela };
const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const rosto = rostoDoPlano(plano);
  const vh = plano.videoAltura ?? ALTURA;
  const naTela = (modo: Layout): RostoNaTela => {
    const caixa = caixaDaPessoa(plano, modo);
    const e = enquadrar(caixa, rosto, vh, rosto.rastro ? 0 : null);
    const L = larguraDoRosto(plano) * e.lv;
    const x = caixa.x + e.esquerda + rosto.x * e.lv;
    const y = caixa.y + e.topo + ((rosto.y * ALTURA) / vh) * e.av;
    return { x, y, L, topoCabeca: y - ATE_TOPO * L, queixo: y + ATE_QUEIXO * L };
  };
  const r = { split: naTela("split"), eu: naTela("eu") };
  guardadas.set(plano, r);
  return r;
};

// Onde a faixa-rótulo (de altura `altura`) fica no split: o topo dela em px, ou null se não cabe
// sem encostar no rosto. Primeiro no terço de baixo (entre o queixo e a legenda, em cima do peito);
// senão, acima da cabeça.
export const topoDoRotulo = (plano: Plano, altura: number): number | null => {
  const r = medidas(plano).split;
  const abaixo = r.queixo + 28;
  if (abaixo + altura <= LEGENDA_Y - 64) return Math.max(abaixo, Math.min(LEGENDA_Y - 64 - altura, abaixo + 40));
  const acima = r.topoCabeca - 28 - altura;
  if (acima >= 36) return acima;
  return null;
};

// ——— animação ———
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// aproximação lenta do conteúdo do palco: ~2% por segundo, no máximo 6%
export const aproximacao = (t: number, de: number) => 1 + Math.min(0.06, Math.max(0, t - de) * 0.012);

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
