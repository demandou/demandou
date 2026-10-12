// Identidade do Etapas: sóbria, a do Reel de origem. A tela do quadro é uma gravação de tela real
// (clara ou escura, a que a página tiver); os blocos de texto vivem num grafite quente. Um destaque
// só: o laranja da ferramenta (#D97757), na pílula, nos círculos numerados e nas marcas pequenas.
// Nada sobre a pessoa além da legenda: a cor do vídeo nunca muda.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing, interpolate } from "remotion";
import { CHEIO_16x9, QUADRO_16x9, enquadrar, type Caixa, type Rosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
export const FONTE = fontFamily;

export const COR = {
  // a tela escura dos blocos de texto
  palco: "#17120F",
  palco2: "#221A15",
  osso: "#F4EEE8",
  apagado: "#9C9086",
  fio: "rgba(244,238,232,0.16)",
  // o destaque (um só)
  laranja: "#D97757",
  // alerta invertido
  claro: "#F4EEE8",
  tinta: "#17120F",
  branco: "#FFFFFF",
  // o fundo atrás de tudo (no modo B, o quadro da esquerda em volta da tela)
  preto: "#000000",
};

export const SOMBRA_TEXTO = "0 2px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)";

// --- o quadro deitado (16:9, 1920×1080) ---
// A versão deitada do Etapas, para o vídeo completo do YouTube, pela regra da aula 9 do curso
// (editar uma aula horizontal): a pessoa em tela cheia é a base (modos A e C, o vídeo deitado
// inteiro); quando um bloco pede apoio visual (modo B), ela vai para a MOLDURA da direita, com o
// rosto centralizado e acompanhado, e a TELA (gravação de tela ou bloco de texto) ocupa o QUADRO da
// esquerda, com a pílula da etapa na borda de baixo dela. Terminada a ideia, corte seco de volta
// para a tela cheia. No vertical a tela ficava em cima e o rosto embaixo; no deitado não cabe uma
// pilha alta, então tela e pessoa ficam lado a lado.
export const QUADRO = { w: 1920, h: 1080 };
export const CANVAS_W = QUADRO.w;
// margem segura do YouTube nas laterais
export const MARGEM_SEGURA = 96;
// abaixo desta linha ficam os controles do player (barra de tempo, botões): nada importante ali
export const UI_BASE = 984;
// onde o quadro da esquerda encontra a moldura da pessoa (px, na horizontal)
export const COSTURA = 1216;
// a moldura da pessoa no modo B: a faixa da direita, na altura toda
export const MOLDURA = { x: COSTURA, y: 0, w: QUADRO.w - COSTURA, h: QUADRO.h };
// a tela, no quadro da esquerda: 80 px de folga de cada lado (da borda e da costura), 100 px em cima;
// termina em y 860, e a pílula (até y 906) fica acima dos controles do player
export const TELA = { x: 80, y: 100, w: COSTURA - 160, h: 760 };
// os blocos de texto são desenhados para a tela: LARGURA × PALCO_H
export const LARGURA = TELA.w;
export const PALCO_H = TELA.h;
export const MARGEM = 56;
// a pílula fica centrada na borda de baixo da tela (a junção da tela com o quadro)
export const PILULA = { w: 724, h: 84, cx: TELA.x + TELA.w / 2, cy: TELA.y + TELA.h + 4 };
// o topo da cabeça na moldura (modo B), fixo em qualquer zoom: aproximar só desce o queixo
export const CABECA_B = 180;
// largura do rosto na moldura (px) no zoom base
const ROSTO_B = 290;
// tela cheia (modos A e C): o vídeo inteiro, com o zoom do salto 1 da câmera. O menor salto (0,96)
// ainda cobre o quadro; o maior (1,15) aproxima uns 20%
const ZOOM_CHEIO = 1.05;
// largura do rosto (fração da largura do quadro) quando o plano não tem rastro
const ROSTO_PADRAO = 0.14;
// a legenda: na área segura de baixo, sempre abaixo do queixo, nunca nos controles do player
export const LEGENDA_TOPO = 846;
export const LEGENDA_H = 70;
const LEGENDA_LIMITE = UI_BASE - LEGENDA_H - 20;
// largura máxima da legenda em tela cheia e na moldura
const LEGENDA_CHEIO = 880;
const LEGENDA_MOLDURA = MOLDURA.w - 144;
// o cabeçalho do modo A vai numa coluna ao lado do rosto: largura mínima e máxima dela
const COLUNA_MIN = 440;
const COLUNA_MAX = 600;

const ATE_TOPO = 0.84;
const ATE_QUEIXO = 0.68;

const entre = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export type Modo = "A" | "B" | "C";

// O momento ativo em t (o último que já começou e ainda não acabou).
export const momentoEm = (plano: Plano, t: number): Momento | undefined => {
  let achado: Momento | undefined;
  for (const m of plano.momentos) if (t >= m.de && t < m.ate && (!achado || m.de >= achado.de)) achado = m;
  return achado;
};
export const modoDe = (m?: Momento): Modo => (!m || m.tipo === "cta" ? "C" : m.tipo === "abertura" ? "A" : "B");
export const modoEm = (plano: Plano, t: number): Modo => modoDe(momentoEm(plano, t));

// o rosto do plano sempre com o quadro deitado (o cortar grava `rosto.quadro`; plano antigo sem ele
// também vale como 16:9)
const rostosGuardados = new WeakMap<object, Rosto>();
export const rostoDo = (plano: Plano): Rosto => {
  if (plano.rosto.quadro) return plano.rosto;
  let r = rostosGuardados.get(plano.rosto);
  if (!r) {
    r = { ...plano.rosto, quadro: QUADRO_16x9 };
    rostosGuardados.set(plano.rosto, r);
  }
  return r;
};
const alturaDoVideo = (plano: Plano) => plano.videoAltura ?? QUADRO.h;
const larguraRosto = (plano: Plano) => plano.rosto.rastro?.largura ?? ROSTO_PADRAO;
// zoom em que o rosto tem, na moldura, a largura que o modo B pede (cada gravação é enquadrada diferente)
const zoomMoldura = (plano: Plano) => entre(ROSTO_B / (larguraRosto(plano) * QUADRO.w), 1.05, 1.6);
// escala do vídeo numa caixa (com a folga de seguir o rosto, quando há rastro)
const escalaNa = (plano: Plano, caixa: Caixa) => enquadrar(caixa, rostoDo(plano), alturaDoVideo(plano), plano.rosto.rastro ? 0 : null).escala;
const rostoPx = (plano: Plano, escala: number) => larguraRosto(plano) * QUADRO.w * escala;

// o topo da cabeça em tela cheia: onde foi gravado, no zoom do salto 1
const cabecaCheia = (plano: Plano) => {
  const r = rostoDo(plano);
  const base: Caixa = { ...CHEIO_16x9, zoom: ZOOM_CHEIO, ancoraX: r.x, ancoraY: r.y };
  return r.y * QUADRO.h - ATE_TOPO * rostoPx(plano, escalaNa(plano, base));
};
const topoDaCabeca = (plano: Plano, modo: Modo) => (modo === "B" ? CABECA_B : cabecaCheia(plano));

// De que lado fica o cabeçalho do modo A: do lado contrário ao rosto (gravação com a pessoa no meio
// ou à direita: cabeçalho à esquerda).
export const ladoDoCabecalho = (plano: Plano): "esq" | "dir" => (rostoDo(plano).x >= 0.42 ? "esq" : "dir");

// A caixa da pessoa em cada modo. O topo da cabeça fica sempre na mesma linha do modo; aproximar
// só desce o queixo. `mult` é o salto de escala do trecho (camera.ts).
//   B: a moldura da direita, com o rosto no meio da largura dela;
//   A e C: o quadro inteiro (o vídeo deitado como foi gravado). No A o rosto anda um pouco para o
//   lado contrário ao cabeçalho (até onde o zoom deixa, sem borda vazia).
export const caixaDaPessoa = (plano: Plano, modo: Modo, mult = 1): Caixa => {
  const r = rostoDo(plano);
  const topo = topoDaCabeca(plano, modo);
  if (modo === "B") {
    const zoom = Math.max(1, zoomMoldura(plano) * mult);
    let ancoraY = 0.4;
    for (let k = 0; k < 2; k++) {
      const caixa: Caixa = { ...MOLDURA, raio: 0, zoom, ancoraX: 0.5, ancoraY };
      ancoraY = entre((topo - MOLDURA.y + ATE_TOPO * rostoPx(plano, escalaNa(plano, caixa))) / MOLDURA.h, 0.15, 0.7);
    }
    return { ...MOLDURA, raio: 0, zoom, ancoraX: 0.5, ancoraY };
  }
  const zoom = Math.max(1, ZOOM_CHEIO * mult);
  const ancoraX = modo === "A" ? entre(r.x + (ladoDoCabecalho(plano) === "esq" ? 0.12 : -0.12), 0.2, 0.8) : r.x;
  let ancoraY = r.y;
  for (let k = 0; k < 2; k++) {
    const caixa: Caixa = { ...CHEIO_16x9, zoom, ancoraX, ancoraY };
    ancoraY = entre((topo + ATE_TOPO * rostoPx(plano, escalaNa(plano, caixa))) / QUADRO.h, 0.12, 0.8);
  }
  return { ...CHEIO_16x9, raio: 0, zoom, ancoraX, ancoraY };
};

// Onde o rosto cai na tela (enquadramento fixo, sem o balanço do rastro): centro e largura, em px.
export const rostoFixo = (plano: Plano, modo: Modo, mult = 1) => {
  const r = rostoDo(plano);
  const caixa = caixaDaPessoa(plano, modo, mult);
  const vh = alturaDoVideo(plano);
  const e = enquadrar(caixa, r, vh, null);
  return {
    x: caixa.x + e.esquerda + r.x * e.lv,
    y: caixa.y + e.topo + ((r.y * QUADRO_16x9.altura) / vh) * e.av,
    largura: rostoPx(plano, escalaNa(plano, caixa)),
  };
};

// Onde o queixo cai (px) em cada modo.
export const queixoDe = (plano: Plano, modo: Modo, mult = 1) => {
  const L = rostoPx(plano, escalaNa(plano, caixaDaPessoa(plano, modo, mult)));
  return topoDaCabeca(plano, modo) + (ATE_TOPO + ATE_QUEIXO) * L;
};

// A legenda: o topo (na área segura de baixo, abaixo do queixo), o centro na horizontal e a largura
// máxima. Na moldura fica centrada nela; em tela cheia, embaixo do rosto, sem sair das margens.
export const legendaNaTela = (plano: Plano, modo: Modo, mult = 1) => {
  const topo = Math.round(Math.min(LEGENDA_LIMITE, Math.max(LEGENDA_TOPO, queixoDe(plano, modo, mult) + 34)));
  if (modo === "B") return { topo, cx: MOLDURA.x + MOLDURA.w / 2, largura: LEGENDA_MOLDURA };
  const x = rostoFixo(plano, modo, 1).x;
  return { topo, cx: entre(x, MARGEM_SEGURA + LEGENDA_CHEIO / 2, QUADRO.w - MARGEM_SEGURA - LEGENDA_CHEIO / 2), largura: LEGENDA_CHEIO };
};
export const legendaTopo = (plano: Plano, modo: Modo, mult = 1) => legendaNaTela(plano, modo, mult).topo;

// A coluna do cabeçalho do modo A: ao lado do rosto (medido no maior salto da câmera, para nunca
// cobri-lo), entre a margem segura e o rosto; `cy` é a altura do centro do rosto.
export const colunaDoCabecalho = (plano: Plano) => {
  const lado = ladoDoCabecalho(plano);
  const f = rostoFixo(plano, "A", 1.2);
  const folga = 56;
  if (lado === "esq") {
    const w = entre(f.x - f.largura * 0.62 - folga - MARGEM_SEGURA, COLUNA_MIN, COLUNA_MAX);
    return { lado, x: MARGEM_SEGURA, w, cy: f.y };
  }
  const w = entre(QUADRO.w - MARGEM_SEGURA - (f.x + f.largura * 0.62 + folga), COLUNA_MIN, COLUNA_MAX);
  return { lado, x: QUADRO.w - MARGEM_SEGURA - w, w, cy: f.y };
};
// o cabeçalho termina acima da legenda
export const BASE_CABECALHO = LEGENDA_TOPO - 40;

// --- animação ---
export const saida = Easing.bezier(0.16, 1, 0.3, 1);
export const suave = Easing.bezier(0.65, 0, 0.35, 1);
export const prog = (t: number, de: number, dur: number, easing = saida) =>
  dur <= 0 ? (t >= de ? 1 : 0) : interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// aproximação lenta do conteúdo dos blocos de texto: ~1,2% por segundo, no máximo 6%
export const aproximacao = (t: number, de: number) => 1 + Math.min(0.06, Math.max(0, t - de) * 0.012);

// Formato pt-BR (83.000; 1,5)
export const formatar = (v: number, casas = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v);
