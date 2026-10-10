// O rosto na tela: onde ele está em cada instante (rastro) e onde ficam as zonas de maquiagem.
//
// Sistema de medidas das zonas: a origem é o centro do rosto (entre os olhos e a ponta do nariz);
// u vai para a DIREITA da imagem e v para BAIXO, os dois em larguras de rosto (1 = a largura do
// rosto de bochecha a bochecha na altura dos olhos). Assim as anotações acompanham rostos grandes,
// pequenos, perto ou longe da câmera. As zonas laterais são do lado direito da imagem; o lado
// esquerdo é o espelho (u negativo).
import { type Caixa, enquadrar, rostoNoTempo as rostoDoMotor } from "./motor/caixa";
import type { Plano, Ponto, Zona } from "./plano";

export const ZONAS: Record<Zona, { u: number; v: number }> = {
  // centro da base do triângulo, logo abaixo da linha dos cílios de baixo
  // (com óculos, a base vai para baixo da armação: veja `zonas` no plano)
  olhos: { u: 0.225, v: -0.08 },
  olheira: { u: 0.22, v: -0.02 },
  // centro da maçã (bochecha, onde nasce o sorriso)
  maca: { u: 0.25, v: 0.1 },
  // ponto alto da maçã (osso da bochecha, embaixo do canto de fora do olho)
  macaAlta: { u: 0.33, v: -0.02 },
  // têmpora: na lateral, na altura do olho (onde passa a haste dos óculos)
  tempora: { u: 0.47, v: -0.19 },
  // arco do cupido (logo acima do lábio de cima)
  cupido: { u: 0, v: 0.22 },
  labios: { u: 0, v: 0.33 },
  testa: { u: 0, v: -0.52 },
  sobrancelha: { u: 0.26, v: -0.32 },
  nariz: { u: 0, v: 0.04 },
  queixo: { u: 0, v: 0.66 },
  mandibula: { u: 0.36, v: 0.42 },
  raizCabelo: { u: 0, v: -0.7 },
};

export const LARGURA_PADRAO = 0.4;

// Um ponto do plano em (u, v), já espelhado para o lado pedido (lado = 1 direita, -1 esquerda)
export const uv = (p: Ponto, lado: 1 | -1, plano: Plano) => {
  const base = typeof p === "string" ? { ...ZONAS[p], ...(plano.zonas?.[p] ?? {}) } : p;
  return { u: base.u * lado, v: base.v };
};

export const lados = (l: "ambos" | "esquerda" | "direita" | undefined, p?: Ponto): (1 | -1)[] => {
  // zona no meio do rosto (cupido, lábios, testa…) aparece uma vez só
  if (p !== undefined && typeof p === "string" && ZONAS[p].u === 0) return [1];
  if (p !== undefined && typeof p !== "string" && p.u === 0) return [1];
  if (l === "esquerda") return [-1];
  if (l === "direita") return [1];
  return [-1, 1];
};

// Largura do rosto: a medida no passo 5 (rostoLargura) ou a do rastreador do motor
export const larguraDoRosto = (plano: Plano) => plano.rostoLargura ?? plano.rosto.rastro?.largura ?? LARGURA_PADRAO;

// Centro do rosto no instante t, em frações do quadro 1080×1920 (mesma convenção de `rosto`):
// o rastro do motor (rosto.rastro), quadro a quadro. Sem rastro, o rosto fixo.
export const rostoNoTempo = (plano: Plano, t: number) => rostoDoMotor(plano.rosto, t);

// A mesma conta do VideoNaCaixa (motor/caixa.tsx): onde o vídeo cai dentro da caixa no instante t
// (a caixa segue o rosto, então o enquadramento muda com o tempo)
export const enquadramento = (caixa: Caixa, plano: Plano, t: number) => {
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  return { ...enquadrar(caixa, plano.rosto, H0, t), H0 };
};

// Rosto na tela no instante t: centro em px, largura em px e a função que leva (u, v) para a tela
export type RostoNaTela = {
  cx: number;
  cy: number;
  W: number;
  ponto: (p: { u: number; v: number }) => { x: number; y: number };
};

export const rostoNaTela = (plano: Plano, caixa: Caixa, t: number): RostoNaTela => {
  const e = enquadramento(caixa, plano, t);
  const r = rostoNoTempo(plano, t);
  const cx = caixa.x + e.esquerda + r.x * e.lv;
  const cy = caixa.y + e.topo + ((r.y * 1920) / e.H0) * e.av;
  const W = larguraDoRosto(plano) * e.lv;
  return { cx, cy, W, ponto: (p) => ({ x: cx + p.u * W, y: cy + p.v * W }) };
};

// Onde fica o queixo na tela com o enquadramento fixo desta caixa (sem o rastro): o limite de cima
// dos cartões que sobem de baixo, para o rosto ficar livre
export const queixoNaTela = (plano: Plano, caixa: Caixa) => {
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const e = enquadrar(caixa, plano.rosto, H0, null);
  const cy = caixa.y + e.topo + ((plano.rosto.y * 1920) / H0) * e.av;
  return cy + larguraDoRosto(plano) * e.lv * 0.76;
};
