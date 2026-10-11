// A diagramação do Iceberg no quadro deitado (16:9, 1920×1080), para o vídeo completo do YouTube.
//
// No vertical o vídeo inteiro acontece no mundo do iceberg: o conteúdo em cima (y 150 a 980) e a
// pessoa numa janela larga embaixo, que desce junto. No quadro deitado não cabe uma pilha alta. A
// regra é a da aula 9 do curso (editar uma aula horizontal):
//
//   - a pessoa em TELA CHEIA é a base: o vídeo deitado inteiro, sem recorte vertical, com a legenda
//     na área segura de baixo;
//   - quando um momento pede apoio visual (qualquer bloco ou o mergulho), a pessoa vai para a JANELA
//     do lado DIREITO (a moldura de gelo do vertical), com o rosto centralizado nela e acompanhado
//     com ajuste suave (o rastro do cortar.mjs), e o mundo do iceberg aparece em volta: o QUADRO do
//     conteúdo (placas de gelo, cartões dos níveis) fica do lado ESQUERDO e o medidor na borda;
//   - terminada a explicação (um vão de mais de ~1,6 s sem momento), a pessoa volta à tela cheia.
//
//   [ medidor | QUADRO: placas e cartões do nível (880 × 800) | JANELA da pessoa (730 × 660) ]
//   [         |                                                | faixa do nível (730 × 84)     ]
//
// O quadro tem quase a forma da zona de conteúdo do vertical (960 × 830): os blocos mantêm a
// composição e medem pelo quadro novo (o texto encolhe até caber na largura e na altura; nada vaza).
import { CHEIO_16x9, caixaNoTempo, type Caixa, type EstadoDaCaixa, type Rosto } from "./motor/caixa";
import type { Momento, Plano } from "./plano";

export const QUADRO = { w: 1920, h: 1080 };
// margens seguras do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player)
export const MARGEM = 96;
export const LIMITE_PLAYER = 984;

// o medidor de profundidade, na borda esquerda: a leitura no alto e a régua embaixo dela
export const MEDIDOR = { leitura: { x: 40, y: 32, w: 250, h: 104 }, regua: { topo: 156, alto: 780 } };

// o quadro do conteúdo (a zona do vertical), à esquerda, ao lado da régua do medidor
export const ZONA = { x: 152, y: 136, w: 880, h: 800 };
// a janela da pessoa (a moldura), presa à margem direita, alinhada ao topo do quadro
export const JANELA = { x: QUADRO.w - MARGEM - 730, y: 136, w: 730, h: 660 };
// a faixa do nível, embaixo da janela (termina junto com o quadro)
export const FAIXA = { x: JANELA.x, y: JANELA.y + JANELA.h + 52, w: JANELA.w, h: 84 };
// a base da legenda com a pessoa em tela cheia (área segura de baixo, acima dos controles)
export const LEGENDA_BASE = 956;

// A câmera do mundo: o ponto do mundo que ela mira fica no centro do quadro.
export const CX = ZONA.x + ZONA.w / 2;
export const FY = ZONA.y + ZONA.h / 2;
// Visão geral (abertura, resumo): a linha d'água na altura 560 da tela e o corpo do iceberg com
// 380 px de altura, embaixo da placa do título.
export const AGUA_GERAL = 560;
export const CORPO_GERAL = 380;

// --- a pessoa: tela cheia ou janela ---

// o rosto ocupa esta fração da largura da janela (a cabeça inteira, com ombros, como no vertical)
const ROSTO_NA_JANELA = 0.3;
// o rosto gravado em 16:9 tem ~13% da largura do quadro (sem rastro, vale isto)
const ROSTO_PADRAO_16x9 = 0.13;
// teto da aproximação (acima disso a imagem perde nitidez)
const ZOOM_MAX = 2.2;
// a troca entre tela cheia e janela: quanto dura e quanto antes do momento a janela já chega
const TROCA = 0.55;
const ANTES = 0.6;
// vão entre momentos abaixo do qual a pessoa continua na janela (não pula para a tela cheia)
const VAO_PARA_TELA_CHEIA = 1.6;

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
const larguraDoRosto = (plano: Plano) => {
  const l = (plano.rosto as Rosto).rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};

// Zoom que deixa o rosto com `fracao` da largura da caixa. O zoom nunca fica abaixo de 1 (o vídeo
// sempre cobre a caixa): gravação muito perto da câmera aproxima menos sozinha.
const zoomPara = (plano: Plano, caixa: { w: number; h: number }, fracao: number) => {
  const base = Math.max(caixa.w / QUADRO.w, caixa.h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * base;
  return Math.min(ZOOM_MAX, Math.max(1, (fracao * caixa.w) / rostoPx));
};

// tela cheia: o vídeo como foi gravado (o zoom da troca parte do rosto, onde ele está)
export const caixaCheia = (plano: Plano): Caixa => ({
  ...CHEIO_16x9,
  ancoraX: plano.rosto.x,
  ancoraY: (plano.rosto.y * QUADRO.h) / alturaDoVideo(plano),
});

// a janela: o rosto no centro dela, com respiro em cima da cabeça
export const caixaDaMoldura = (plano: Plano): Caixa => ({
  ...JANELA,
  raio: 46,
  zoom: zoomPara(plano, JANELA, ROSTO_NA_JANELA),
  ancoraX: 0.5,
  ancoraY: 0.42,
});

// Os trechos com apoio visual: cada momento, juntando os que têm um vão curto entre si. O último
// momento (o fechamento) vai até o fim do vídeo.
export const trechosComApoio = (plano: Plano): [number, number][] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  const fimDe = (m: Momento, i: number) => (!ordem[i + 1] && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3) ? plano.duracao + 1 : m.ate);
  const trechos: [number, number][] = [];
  ordem.forEach((m, i) => {
    const a = m.de;
    const b = fimDe(m, i);
    if (!(b > a)) return;
    const ultimo = trechos[trechos.length - 1];
    if (ultimo && a - ultimo[1] < VAO_PARA_TELA_CHEIA) ultimo[1] = Math.max(ultimo[1], b);
    else trechos.push([a, b]);
  });
  return trechos;
};

// Os estados da caixa da pessoa ao longo do vídeo: tela cheia nos respiros, janela nos trechos
// com apoio. A janela chega ~0,6 s antes do momento (as placas entram com a pessoa já no lugar) e
// a pessoa volta à tela cheia quando o momento termina.
const guardados = new WeakMap<Plano, EstadoDaCaixa[]>();
export const estadosDaPessoa = (plano: Plano): EstadoDaCaixa[] => {
  const ja = guardados.get(plano);
  if (ja) return ja;
  const cheia = caixaCheia(plano);
  const janela = caixaDaMoldura(plano);
  const trechos = trechosComApoio(plano);
  const estados: EstadoDaCaixa[] = [];
  trechos.forEach(([a, b], i) => {
    const ida = a - ANTES;
    if (i === 0 && ida <= 0.05) estados.push({ de: -1, caixa: janela });
    else {
      if (i === 0) estados.push({ de: -1, caixa: cheia });
      estados.push({ de: ida, caixa: janela, dur: TROCA });
    }
    if (b < plano.duracao - 0.3) estados.push({ de: b, caixa: cheia, dur: TROCA });
  });
  if (!estados.length) estados.push({ de: -1, caixa: cheia });
  guardados.set(plano, estados);
  return estados;
};

// A caixa da pessoa no instante t (sem o balanço da água, que a Janela acrescenta).
export const caixaDaPessoa = (plano: Plano, t: number): Caixa => caixaNoTempo(t, estadosDaPessoa(plano), CHEIO_16x9);

// O quanto a pessoa saiu da tela cheia: 0 = tela cheia, 1 = na janela. Liga a moldura de gelo,
// as bolhas, a água por cima do vídeo e a faixa do nível.
export const naJanela = (caixa: Caixa) => Math.max(0, Math.min(1, (QUADRO.w - caixa.w) / (QUADRO.w - JANELA.w)));

// Onde a legenda assenta: na base da caixa da pessoa (abaixo do queixo, como no vertical), nunca
// abaixo da área segura do player; centrada na caixa e no máximo da largura dela.
export const legendaNaCaixa = (caixa: Caixa) => ({
  base: Math.min(caixa.y + caixa.h - 24, LEGENDA_BASE),
  cx: caixa.x + caixa.w / 2,
  largura: Math.max(360, Math.min(1240, caixa.w - 110)),
});
