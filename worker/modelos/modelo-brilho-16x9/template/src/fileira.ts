// A FILEIRA: a diagramação do Brilho no quadro deitado (16:9, 1920×1080).
//
// No vertical, o Brilho empilha. O texto se monta no peito, abaixo do queixo, numa coluna alta; o
// cartão sobe de baixo e cresce para cima, item embaixo de item; no layout "lado" a pessoa desliza
// para um lado (56% da largura) e a página creme ocupa o outro, com tudo numa coluna só. No quadro
// deitado não cabe pilha alta: são 1080 px de altura, e abaixo de y 984 ficam os controles do
// player. A regra da aula 9 do curso (editar uma aula horizontal) decide a composição:
//
//   TELA CHEIA é a base. O texto no peito vira uma FAIXA larga logo abaixo do queixo (linhas largas,
//   menos linhas, a mesma ordem da fala); o cartão que sobe fica largo e baixo, com o cabeçalho de um
//   lado e os itens do outro:
//
//     [ 01 | TRUQUE 1 DE 3 / Corretivo  (godê) |  dica 1 / dica 2 / dica 3 ]
//
//   Quando o bloco pede apoio visual (os do painel), a pessoa vai para a MOLDURA do lado direito, do
//   topo à base, com o rosto centralizado e acompanhado com ajuste suave (o rastro do cortar.mjs), e
//   o painel creme abre do lado esquerdo, em colunas, com os itens encostados na costura:
//
//     [ rótulo / 02 / nome / amostra  |  dicas na costura  ||  MOLDURA com a pessoa ]
//
// A pessoa fica sempre à direita (a aula 9 fixa a moldura nesse lado): o `lado` do plano não vale
// aqui. Dois painéis colados não cruzam a tela como no vertical: a página que sai se apaga antes de
// a que entra se montar. Todo texto continua medido com a fonte de verdade e encolhe até caber.
import type { Plano } from "./plano";
import { BASE_TEXTO, LARGURA_LADO, LARGURA_UTIL, MARGEM, QUADRO } from "./tema";

// ---------- a moldura (a pessoa à direita) e o painel (à esquerda) ----------

// a moldura vai do topo à base, encostada na borda direita
export const MOLDURA = { x: QUADRO.w - LARGURA_LADO, y: 0, w: LARGURA_LADO, h: QUADRO.h };

// O rosto na moldura: a fração da largura dela que o rosto ocupa (cabeça e ombros, como na aula 9).
// O rosto gravado em 16:9 tem ~13% da largura do quadro (~250 px), que já dá isso sem aproximar;
// pessoa longe da câmera (rosto pequeno) ganha aproximação até ZOOM_MAX, nunca menos que 1.
const ROSTO_NA_MOLDURA = 0.34;
const ROSTO_PADRAO_16x9 = 0.13;
const ZOOM_MAX = 1.8;
export const larguraDoRosto16x9 = (plano: Plano) => {
  const l = plano.rostoLargura ?? plano.rosto.rastro?.largura;
  return l && l > 0.03 ? l : ROSTO_PADRAO_16x9;
};
export const zoomDaMoldura = (plano: Plano) => {
  if (plano.zoomLado !== undefined) return plano.zoomLado;
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const base = Math.max(MOLDURA.w / QUADRO.w, MOLDURA.h / videoAltura);
  const rostoPx = larguraDoRosto16x9(plano) * QUADRO.w * base;
  return Math.min(ZOOM_MAX, Math.max(1, (ROSTO_NA_MOLDURA * MOLDURA.w) / rostoPx));
};

// O painel: do lado esquerdo até a moldura. O conteúdo começa na margem segura e para na costura.
export const PAINEL = {
  // da borda esquerda até o começo do conteúdo (margem segura do YouTube)
  margem: MARGEM,
  // vão entre o conteúdo e a borda da pessoa
  costura: 56,
  // faixa útil: abaixo do topo, acima dos controles do player
  topo: 96,
  base: 940,
  // vão entre as duas colunas do painel
  vao: 72,
};
// largura total do conteúdo do painel (1008 px)
export const INTERNA_PAINEL = QUADRO.w - LARGURA_LADO - PAINEL.margem - PAINEL.costura;
// Colunas do painel: a de fora (cabeçalho: rótulo, número, nome, amostra) e a da costura (os itens,
// alinhados do lado da pessoa, com o círculo vinho na costura, onde chegam as linhas-guia).
export const colunasDoPainel = (fracaoFora = 0.46) => {
  const fora = Math.round((INTERNA_PAINEL - PAINEL.vao) * fracaoFora);
  const costura = INTERNA_PAINEL - PAINEL.vao - fora;
  return { fora: { x: PAINEL.margem, w: fora }, costura: { x: PAINEL.margem + fora + PAINEL.vao, w: costura } };
};

// ---------- a faixa do peito (texto direto sobre o vídeo, em tela cheia) ----------

// largura das linhas no peito (entre as margens) e o topo da faixa: logo abaixo do queixo, nunca
// tão baixo que a faixa fique sem lugar (o cortar.mjs do 16:9 põe a `zona` 60 px abaixo do queixo)
export const LARGURA_PEITO = LARGURA_UTIL;
export const topoDaFaixa = (plano: Plano) => Math.min(690, Math.max(520, (plano.zona?.topo ?? 640) - 44));
// Onde o bloco começa dentro da faixa: um respiro abaixo do queixo quando sobra lugar, nunca
// passando da base (o bloco já foi medido para caber entre `topo` e BASE_TEXTO).
export const assentar = (topo: number, altura: number, respiro = 24) => topo + Math.max(0, Math.min(respiro, BASE_TEXTO - topo - altura));

// ---------- o cartão que sobe de baixo (largo e baixo) ----------

export const CARTAO_LARGO = { x: MARGEM, w: LARGURA_UTIL, pad: 44 };
// cabeçalho (número/"?", rótulo, nome, godê) à esquerda e itens à direita, com uma divisória fina
export const COLUNA_CABECALHO = 820;
export const VAO_CARTAO = 56;
