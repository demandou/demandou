// Os dois lugares da pessoa e a câmera dela no quadro deitado (16:9, 1920×1080), com a composição da
// aula 9 do curso (editar uma aula horizontal).
//
//  1. TELA CHEIA (a base): a pessoa como foi gravada, o vídeo 16:9 inteiro, com a legenda na área
//     segura de baixo. A fachada não aparece.
//  2. MOLDURA À DIREITA: quando um bloco acontece (todos os blocos do Balcão acontecem no vidro da
//     vitrine), a pessoa desliza para a moldura de madeira do lado direito, com o rosto centralizado nela
//     e seguido com suavidade (`rosto.rastro`, pela VideoNaCaixa), e a fachada aparece em volta: o toldo
//     no alto, a vitrine (o quadro da explicação) à esquerda e o balcão que sobe na frente das duas.
//     Blocos seguidos mantêm a moldura; quando a ideia termina, a pessoa volta à tela cheia.
//
// A câmera é a do vertical nos dois lugares: troca de escala em corte seco (100% ↔ 106%) só quando o
// trecho anterior durou mais de ~1 s, e um soco curto de aproximação quando o carimbo bate e quando o
// pino cai no mapa.
import { Easing, interpolate } from "remotion";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { LEGENDA_Y, MOLDURA, QUADRO } from "./tema";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sobe = Easing.bezier(0.16, 1, 0.3, 1);
const desce = Easing.bezier(0.65, 0, 0.35, 1);

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// largura do rosto no quadro deitado com zoom 1 (px): o vídeo de trabalho tem o tamanho do quadro.
// No 16:9 o rosto ocupa ~13% da largura (~250 px) quando o `rastro` não diz.
export const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  return (l && l > 0.03 ? l : 0.13) * QUADRO.w;
};

// instantes de soco de câmera: o carimbo do combo e o pino do mapa
const socos = (plano: Plano) =>
  (plano.momentos as Momento[])
    .flatMap((m) => (m.tipo === "combo" ? [m.valorEm ?? m.em] : m.tipo === "mapa" && m.numeroEm !== undefined ? [m.numeroEm] : []))
    .sort((a, b) => a - b);

const pulso = (t: number, e: number) => {
  if (t < e) return 0;
  const d = t - e;
  if (d < 0.14) return sobe(d / 0.14);
  if (d < 0.45) return 1;
  return 1 - desce(clamp((d - 0.45) / 0.9, 0, 1));
};

// A pessoa vai para a moldura um pouco antes do bloco entrar (o bloco entra com ela já quase lá) e
// volta em TROCA s depois que ele sai. Blocos com menos que JUNTA_SE_MENOR s entre eles mantêm a
// moldura (nada de vaivém).
export const ABRE_ANTES = 0.3;
export const TROCA = 0.45;
const JUNTA_SE_MENOR = 1.2;
// Na moldura, o rosto ocupa ~30% da largura dela (a do vertical era 29%), com ~56 px de folga acima
// do cabelo e o centro no eixo da moldura.
const ROSTO_NA_MOLDURA = 0.3;

export type Layout = {
  caixa: (t: number) => Caixa;
  // 0 = tela cheia, 1 = a pessoa na moldura da direita (com a fachada em volta)
  naMoldura: (t: number) => number;
  // os trechos com a pessoa na moldura [início, fim] (a troca acontece em volta de cada borda)
  trechos: [number, number][];
  yLegenda: number;
  zoomBase: number;
  // quando o letreiro do toldo desce: na palavra dita, ou quando a fachada aparece pela primeira vez
  // depois dela (o nome dito com a pessoa em tela cheia acende quando a vitrine abre)
  letreiroEm: number;
  // centro do rosto no quadro cheio (px)
  rostoX: number;
};

export const prepararLayout = (plano: Plano): Layout => {
  const ordem = ordenar(plano);
  const dur = plano.duracao;
  // o fim de cada bloco: sai quando o próximo entra; o último (ou o cta) fica até o fim do vídeo
  const fimDe = (i: number) => {
    const m = ordem[i];
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= dur - 0.4 || m.tipo === "cta" ? dur + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };
  const trechos: [number, number][] = [];
  ordem.forEach((m, i) => {
    const de = m.de;
    const ate = fimDe(i);
    const u = trechos[trechos.length - 1];
    if (u && de - u[1] < JUNTA_SE_MENOR) u[1] = Math.max(u[1], ate);
    else trechos.push([de, ate]);
  });
  const naMoldura = (t: number) => {
    let p = 0;
    for (const [a, b] of trechos) {
      // o 1º bloco do vídeo já está montado no quadro 0 (nada de pessoa deslizando no começo)
      const entra = a <= 0.05 ? 1 : interpolate(t, [a - ABRE_ANTES, a - ABRE_ANTES + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: desce });
      const sai = b >= dur ? 0 : interpolate(t, [b, b + TROCA], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: desce });
      p = Math.max(p, entra * (1 - sai));
    }
    return p;
  };

  // a pessoa na moldura: o rosto com ~30% da largura dela (o zoom que dá isso, entre 1 e 1,5)
  const vh = plano.videoAltura ?? QUADRO.h;
  const l1 = larguraDoRosto(plano) * Math.max(MOLDURA.w / QUADRO.w, MOLDURA.h / vh);
  const zoomBase = clamp((ROSTO_NA_MOLDURA * MOLDURA.w) / Math.max(1, l1), 1, 1.5);
  const lr = l1 * zoomBase;
  // o centro do rosto fica ~1,15 largura de rosto abaixo do topo da cabeça; 56 px de folga acima do cabelo
  const ancoraY = clamp((56 + 1.15 * lr) / MOLDURA.h, 0.2, 0.55);
  const rostoX = plano.rosto.x;
  const rostoY = clamp((plano.rosto.y * QUADRO.h) / Math.min(QUADRO.h, vh), 0, 1);

  const cortes = plano.cortesEm ?? [];
  const trocas: number[] = [];
  let ultima = 0;
  for (const c of cortes) {
    if (c - ultima >= 1) {
      trocas.push(c);
      ultima = c;
    }
  }
  const s = socos(plano);
  const caixa = (t: number): Caixa => {
    const k = trocas.filter((c) => c <= t + 1e-4).length;
    let z = k % 2 === 1 ? 1.06 : 1;
    for (const e of s) z *= 1 + 0.04 * pulso(t, e);
    const zCheio = Math.min(1.2, z);
    const p = naMoldura(t);
    // tela cheia: o zoom cresce em volta do rosto (ele fica onde foi gravado)
    if (p <= 0) return { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h, raio: 0, zoom: zCheio, ancoraX: rostoX, ancoraY: rostoY };
    const mix = (a: number, b: number) => a + (b - a) * p;
    return {
      x: mix(0, MOLDURA.x),
      y: mix(0, MOLDURA.y),
      w: mix(QUADRO.w, MOLDURA.w),
      h: mix(QUADRO.h, MOLDURA.h),
      raio: mix(0, MOLDURA.raio),
      zoom: mix(zCheio, Math.min(1.6, zoomBase * z)),
      ancoraX: mix(rostoX, 0.5),
      ancoraY: mix(rostoY, ancoraY),
    };
  };

  // o letreiro: na palavra dita se a fachada está à vista; senão, quando ela abre de novo
  const emDito = plano.fachada?.em ?? 0;
  const proximo = trechos.find(([, b]) => b > emDito);
  const letreiroEm = naMoldura(emDito) >= 0.5 || !proximo ? emDito : Math.max(emDito, proximo[0] + 0.05);

  return { caixa, naMoldura, trechos, yLegenda: LEGENDA_Y, zoomBase, letreiroEm, rostoX: rostoX * QUADRO.w };
};
