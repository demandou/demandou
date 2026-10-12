// A gramática de layout do Guia, versão deitada (16:9, 1920×1080, o vídeo longo do YouTube).
// A regra da composição é a da aula 9 do curso (editar uma aula horizontal):
// - TELA CHEIA é a base: fora dos momentos, a pessoa ocupa o quadro como foi gravada (sem zoom; o
//   Guia não dá zoom no rosto), com a câmera corrigindo de leve quando ela se mexe.
// - Num momento (o bloco pede apoio visual), corte seco para a tela de aula: o fundo branco, a tela
//   do bloco no QUADRO da esquerda e a pessoa numa MOLDURA do lado direito, com o rosto centralizado
//   e acompanhado pelo rastro (rosto.rastro). Com o recorte sem fundo (public/pessoa.webm), a pessoa
//   fica sem moldura, no mesmo lugar, com o corpo chegando à borda de baixo.
// - Ao fim da ideia, corte seco de volta à tela cheia. Vão curto entre duas telas não volta à tela
//   cheia (a tela anterior fica até a seguinte entrar): nada de piscar a pessoa por meio segundo.
// O campo `pessoa` do plano (as poses do vertical) é aceito e ignorado: no quadro deitado a pessoa
// fica sempre na moldura da direita.
import { getStaticFiles } from "remotion";
import { type Caixa, pontoDoRosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { MOLDURA, QUADRO, ROSTO_NA_MOLDURA } from "./tema";

// vão menor que isto entre duas telas emenda as duas (s)
export const VAO_MINIMO = 0.5;

export const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// a largura do rosto (fração da largura do quadro), do rastro do cortar.mjs ou o padrão do 16:9
export const larguraDoRosto = (plano: Plano) => {
  const l = plano.rosto.rastro?.largura;
  return l && l > 0.03 ? l : 0.13;
};

// A tela cheia: o vídeo inteiro, como foi gravado. As âncoras são o próprio rosto (sem deslocar).
export const caixaCheia = (plano: Plano): Caixa => {
  const h = alturaDoVideo(plano);
  return { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * QUADRO.h) / h, ancoraX: plano.rosto.x };
};

// A moldura: o rosto no meio dela (na horizontal) e a ~34% da altura visível, ocupando ~38% da
// largura (cabeça e ombros), seja a pessoa perto ou longe da câmera. `zoom` 1 = o menor
// enquadramento que cobre a moldura; nunca passa de 2,2 (o vídeo perderia nitidez).
export const caixaDaMoldura = (plano: Plano): Caixa => {
  const H0 = alturaDoVideo(plano);
  const cobre = Math.max(MOLDURA.w / QUADRO.w, MOLDURA.h / H0);
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * cobre;
  const zoom = Math.min(2.2, Math.max(1, (ROSTO_NA_MOLDURA.largura * MOLDURA.w) / rostoPx));
  const visivel = QUADRO.h - MOLDURA.y;
  return { x: MOLDURA.x, y: MOLDURA.y, w: MOLDURA.w, h: MOLDURA.h, raio: MOLDURA.raio, zoom, ancoraY: (ROSTO_NA_MOLDURA.altura * visivel) / MOLDURA.h, ancoraX: 0.5 };
};

// O recorte sem fundo existe? (public/pessoa.webm, do ferramentas/recortar.mjs). Sem ele, ou com
// `"recorte": false` no plano, a pessoa aparece no retângulo da moldura (o vídeo, sem recorte).
export const temRecorte = (plano: Plano) => {
  if (plano.recorte === false) return false;
  try {
    return getStaticFiles().some((f) => f.name === "pessoa.webm");
  } catch {
    return false;
  }
};

// Geometria do recorte (px) no lugar da moldura: o rosto no meio dela, na altura do rosto da
// moldura, seguindo o rosto no tempo; o corpo sempre chega à borda de baixo.
export const geometriaDoRecorte = (plano: Plano, t: number) => {
  const p = pontoDoRosto(plano.rosto, t, 0.35);
  const H0 = alturaDoVideo(plano);
  const fx = MOLDURA.x + MOLDURA.w / 2;
  const fy = MOLDURA.y + ROSTO_NA_MOLDURA.altura * (QUADRO.h - MOLDURA.y);
  // `rosto` é fração do quadro; no vídeo de trabalho a altura é H0
  const py = (p.y * QUADRO.h) / H0;
  const pelaFace = (ROSTO_NA_MOLDURA.largura * MOLDURA.w) / (larguraDoRosto(plano) * QUADRO.w);
  const pelaBase = (QUADRO.h - fy) / (H0 * Math.max(0.05, 1 - py)) + 0.02;
  const s = Math.max(pelaFace, pelaBase);
  const w = QUADRO.w * s;
  const h = H0 * s;
  return { left: fx - p.x * w, top: fy - py * h, w, h };
};

// Os momentos como vão para a tela: em ordem, sem sobreposição, e com os vãos curtos emendados (a
// tela anterior fica até a seguinte entrar). O primeiro momento que começa quase no 0 começa no 0;
// o último que termina quase no fim vai até o fim.
export const momentosNaTela = (plano: Plano): Momento[] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ordem.map((m, i) => {
    const proximo = ordem[i + 1];
    let ate = m.ate;
    if (proximo && proximo.de < ate) ate = proximo.de;
    if (proximo && proximo.de - ate < VAO_MINIMO) ate = proximo.de;
    if (!proximo && plano.duracao - ate < VAO_MINIMO) ate = plano.duracao + 1;
    const de = i === 0 && m.de < VAO_MINIMO ? 0 : m.de;
    return { ...m, de, ate } as Momento;
  });
};
