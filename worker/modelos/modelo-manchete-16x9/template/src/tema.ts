// Identidade da Manchete (versão deitada, 16:9): a de um vídeo de notícia comentada. Fundo preto (as
// bordas ao redor do B-roll), a foto é o assunto, e UM destaque: o rosa-vermelho da tarja (que também
// pinta as marcas dos blocos universais). Texto branco bold sobre a pessoa, sem caixa. Nada muda a
// cor do vídeo.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO_16x9, QUADRO_16x9, enquadrar, type Caixa, type Rosto } from "./motor/caixa";
import type { Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  palco: "#050505",
  palco2: "#15171B",
  osso: "#FFFFFF",
  apagado: "#9AA0A8",
  fio: "rgba(255,255,255,0.18)",
  // o destaque (um só): a tarja
  cobalto: "#F2305B",
  tarja: "#F2305B",
  claro: "#F4F1EA",
  tinta: "#0B0B0D",
  branco: "#FFFFFF",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.7)";

// ——— a grade (quadro deitado, 16:9, 1920×1080) ———
// A versão deitada é o vídeo completo do YouTube. A regra da aula 9 do curso (editar uma aula
// horizontal) decide a composição: a pessoa em TELA CHEIA é a base (o vídeo 16:9 inteiro, sem
// recorte); quando a fala pede o B-roll ou um bloco, ela vai para uma MOLDURA do lado direito, com o
// rosto centralizado e acompanhado, e o B-roll (ou o bloco) ocupa o QUADRO do lado esquerdo, de
// cima a baixo, sempre preenchido pela imagem. No vertical isso era a faixa de cima (0 a 600) e a
// pessoa embaixo. A troca entre os dois é corte seco, como tudo na Manchete.
export const LARGURA = 1920;
export const ALTURA = 1080;
// a emenda: onde o quadro do B-roll encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1180;
// O QUADRO do B-roll (a "faixa" do vertical): o lado esquerdo inteiro. A imagem (ou vídeo) o
// PREENCHE (cover, com foco); nunca letterbox. Só o texto respeita a margem segura.
export const BANDA = { x: 0, y: 0, w: COSTURA, h: ALTURA };
// Os blocos são desenhados numa área de PALCO_W × PALCO_H (o quadro inteiro)
export const PALCO_W = BANDA.w;
export const PALCO_H = BANDA.h;
// a base útil do quadro para o conteúdo dos blocos: acima dos controles do player
export const PALCO_UTIL = 960;
// a MOLDURA da pessoa: a faixa da direita, na altura toda
export const MOLDURA = { x: COSTURA, y: 0, w: LARGURA - COSTURA, h: ALTURA };
// margem segura: texto ≥ 72 px das bordas do quadro, ≥ 120 px do topo
export const MARGEM = 72;
export const TOPO_SEGURO = 124;
// Limite dos controles do player do YouTube (só para as guias): nada importante abaixo de y 984
export const UI_BASE = 984;

// A tarja (px no quadro 1920×1080): pílula baixa, CENTRADA no quadro do B-roll, no terço de baixo
// dele, acima dos controles do player (no vertical ela montava na borda de baixo da faixa; aqui a
// borda com a pessoa é vertical e passaria pelo rosto). Sem selo.
export const TARJA = { y: UI_BASE - 40 - 84, altura: 84, raio: 18, max: 50, min: 34, padding: 34 };

// A legenda: em tela cheia, centrada no quadro todo, no terço de baixo; na moldura, centrada nela,
// logo abaixo do queixo (sobre o peito, como no vertical). Largura máxima em cada caso.
export const LEGENDA_TOPO_CHEIO = 870;
export const LEGENDA_CHEIO = 1500;
export const LEGENDA_MOLDURA = MOLDURA.w - 2 * 40;
const LEGENDA_ALTURA = 64;

// A pessoa. Na MOLDURA: plano fixo (um zoom só), rosto centralizado na largura dela, com os olhos a
// ~40% da altura e a largura do rosto ~36% da moldura (plano médio-peito, como no vertical). Em
// TELA CHEIA: o vídeo inteiro, sem aproximar (o rastro só corrige, sem passear).
const OLHOS_MOLDURA = 0.4;
const LARGURA_ROSTO = 0.36;
const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

export type Modo = "cheio" | "moldura";

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

const zoomFixo = (plano: Plano) => entre((LARGURA_ROSTO * MOLDURA.w) / (larguraDoRosto(plano) * LARGURA), 1, 1.6);

export const caixaDaPessoa = (plano: Plano, modo: Modo = "moldura"): Caixa => {
  const rosto = rostoDoPlano(plano);
  const vh = plano.videoAltura ?? ALTURA;
  if (modo === "cheio") {
    return { ...CHEIO_16x9, zoom: 1, ancoraX: entre(rosto.x, 0, 1), ancoraY: entre((rosto.y * ALTURA) / vh, 0.2, 0.6), raio: 0 };
  }
  return { ...MOLDURA, raio: 0, zoom: zoomFixo(plano), ancoraX: 0.5, ancoraY: OLHOS_MOLDURA };
};

// Onde o rosto fica na tela em cada modo (px, sem o seguimento): centro, largura, topo da cabeça e queixo.
export type RostoNaTela = { x: number; y: number; L: number; topoCabeca: number; queixo: number };
export type Medidas = { zoomMax: number; moldura: RostoNaTela; cheio: RostoNaTela; legTopo: number };

const guardadas = new WeakMap<object, Medidas>();
export const medidas = (plano: Plano): Medidas => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const rosto = rostoDoPlano(plano);
  const vh = plano.videoAltura ?? ALTURA;
  const naTela = (modo: Modo): RostoNaTela => {
    const caixa = caixaDaPessoa(plano, modo);
    const e = enquadrar(caixa, rosto, vh, rosto.rastro ? 0 : null);
    const L = larguraDoRosto(plano) * e.lv;
    const x = caixa.x + e.esquerda + rosto.x * e.lv;
    const y = caixa.y + e.topo + ((rosto.y * ALTURA) / vh) * e.av;
    return { x, y, L, topoCabeca: y - ATE_TOPO * L, queixo: y + ATE_QUEIXO * L };
  };
  const moldura = naTela("moldura");
  // na moldura, a legenda fica logo abaixo do queixo (sobre o peito), acima dos controles do player
  const legTopo = Math.round(entre(moldura.queixo + 22, 560, UI_BASE - 24 - LEGENDA_ALTURA));
  const m = { zoomMax: zoomFixo(plano), moldura, cheio: naTela("cheio"), legTopo };
  guardadas.set(plano, m);
  return m;
};
export const topoDaCabeca = (plano: Plano) => medidas(plano).moldura.topoCabeca;
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
