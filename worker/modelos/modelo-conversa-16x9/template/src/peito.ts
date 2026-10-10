// O lugar do balão do quadro cheio no quadro deitado (16:9).
//
// No vertical o balão fica no peito, embaixo do queixo, numa pilha alta (pílula, rosto, balão,
// legenda). No quadro deitado não sobra altura embaixo do queixo, mas sobra largura dos lados da
// pessoa: o balão vai numa COLUNA LIVRE ao lado do rosto, na altura do peito (centrado na linha do
// queixo), como uma fileira. As suas mensagens vão à direita da pessoa e as do outro lado à esquerda
// (como na conversa); se aquele lado for estreito demais (a pessoa gravou fora do centro), o balão
// vai para o lado mais largo. A coluna é medida com o rosto em todo o trecho do momento (o rastro):
// o balão nunca cobre o rosto, mesmo quando a pessoa se mexe.
import { CHEIO_16x9, QUADRO_16x9, type Rosto, rostoNaTela } from "./motor/caixa";
import type { Plano } from "./plano";
import { CAMPO, emUnidades, MARGEM, PEITO, QUADRO, ROSTO_LARGURA_PADRAO, W, zona as zonaPadrao } from "./tema";

export type Lado = {
  // a coluna (unidades da tela virtual)
  x: number;
  w: number;
  // "direita" = o balão encosta na borda direita da coluna (as suas mensagens); "esquerda" = na esquerda
  alinhar: "direita" | "esquerda";
  // a linha em que o bloco se centra (o queixo) e os limites de cima e de baixo
  yCentro: number;
  topoMin: number;
  fim: number;
};

// altura máxima do campo da legenda (duas linhas): o balão fica acima dele quando os dois aparecem
const ALTURA_DA_LEGENDA = 34 + 2 * CAMPO.alturaLinha;
export const TOPO_DA_LEGENDA = CAMPO.base - ALTURA_DA_LEGENDA;

const CAIXA_CHEIA = { ...CHEIO_16x9, zoom: 1 };

// O rosto (px do quadro) no começo, no meio e a cada ~0,2 s do trecho: o menor e o maior x
const faixaDoRosto = (plano: Plano, de: number, ate: number) => {
  const r = plano.rosto as Rosto;
  const rosto: Rosto = r.quadro ? r : { ...r, quadro: QUADRO_16x9 };
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const passos = Math.max(2, Math.min(60, Math.ceil((ate - de) / 0.2)));
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= passos; i++) {
    const t = de + ((ate - de) * i) / passos;
    const p = rostoNaTela(CAIXA_CHEIA, rosto, videoAltura, t);
    min = Math.min(min, p.x);
    max = Math.max(max, p.x);
  }
  if (!Number.isFinite(min)) min = max = rosto.x * QUADRO.w;
  const largura = (r.rastro?.largura && r.rastro.largura > 0.02 ? r.rastro.largura : ROSTO_LARGURA_PADRAO) * QUADRO.w;
  return { min, max, largura };
};

// A coluna do balão de um momento de quadro cheio (de quem é a mensagem e o trecho dela)
export const ladoDoBalao = (plano: Plano, de: "eu" | "cliente", inicio: number, fim: number, comLegenda = false): Lado => {
  const rosto = faixaDoRosto(plano, inicio, fim);
  // meia largura do rosto com o cabelo e as orelhas, mais a folga (px do quadro)
  const meio = Math.max(150, rosto.largura * 0.75) + PEITO.folgaDoRosto;
  const direita = { x0: emUnidades(rosto.max + meio), x1: W - MARGEM };
  const esquerda = { x0: MARGEM, x1: emUnidades(rosto.min - meio) };
  const largura = (c: { x0: number; x1: number }) => Math.max(0, c.x1 - c.x0);
  const preferido = de === "eu" ? direita : esquerda;
  const outro = de === "eu" ? esquerda : direita;
  const c = largura(preferido) >= PEITO.ladoMin || largura(preferido) >= largura(outro) ? preferido : outro;
  const w = Math.min(PEITO.larguraMax, largura(c));
  // a caixa encosta na margem da tela (como as mensagens da conversa): à direita na coluna da direita
  const x = c === direita ? c.x1 - w : c.x0;
  const alinhar: Lado["alinhar"] = de === "eu" ? "direita" : "esquerda";
  const zona = { ...zonaPadrao, ...(plano.zona ?? {}) };
  // o queixo fica ~60 px acima do topo da zona (o cortar.mjs mede assim)
  const yCentro = emUnidades(zona.topo - 60);
  const fimDoBloco = comLegenda ? TOPO_DA_LEGENDA - 24 : PEITO.fim;
  return { x, w, alinhar, yCentro, topoMin: PEITO.topo, fim: fimDoBloco };
};

// O topo do bloco (altura h) centrado na linha do queixo, sem passar dos limites
export const topoNoLado = (lado: Lado, h: number) => Math.round(Math.max(lado.topoMin, Math.min(lado.fim - h, lado.yCentro - h / 2)));
