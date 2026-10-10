// Onde cada coisa fica nos momentos de carta dos blocos universais, para cada posição da ocular.
// A ocular (a pessoa) é sagrada: nenhum texto entra no círculo dela nem no anel.
//
// - cab: o cabeçalho (título do bloco, rótulo), ao lado da ocular quando ela está no alto;
// - corpo: o conteúdo (estrelas, linhas, números), na largura toda da carta;
// - livre: o canto ao lado da ocular quando ela está embaixo (nota, etiqueta "ilustrativo").
import type { PosicaoOcular } from "./plano";
import { LIMITE_DIREITA, MARGEM } from "./tema";

export type Ret = { x: number; y: number; w: number; h: number };
export type Areas = { cab: Ret | null; corpo: Ret; livre: Ret | null; alto: boolean };

const X0 = MARGEM + 10;
const LARGURA = LIMITE_DIREITA - X0;

export const areasDe = (pos: PosicaoOcular): Areas => {
  switch (pos) {
    case "topo-direita":
      // o cabeçalho para antes do anel e da assinatura em arco (o arco desce até ~x 470 no alto)
      return { cab: { x: X0, y: 196, w: 384, h: 410 }, corpo: { x: X0, y: 668, w: LARGURA, h: 832 }, livre: null, alto: true };
    case "topo-esquerda":
      return { cab: { x: 620, y: 196, w: LIMITE_DIREITA - 620, h: 410 }, corpo: { x: X0, y: 668, w: LARGURA, h: 832 }, livre: null, alto: true };
    case "baixo-centro":
      return { cab: null, corpo: { x: X0, y: 168, w: LARGURA, h: 770 }, livre: null, alto: false };
    case "baixo-direita":
      return { cab: null, corpo: { x: X0, y: 168, w: LARGURA, h: 752 }, livre: { x: X0, y: 975, w: 420, h: 420 }, alto: false };
    case "baixo-esquerda":
      return { cab: null, corpo: { x: X0, y: 168, w: LARGURA, h: 752 }, livre: { x: 612, y: 975, w: LIMITE_DIREITA - 612, h: 420 }, alto: false };
    case "meio-direita":
      return { cab: null, corpo: { x: X0, y: 168, w: 440, h: 1240 }, livre: null, alto: false };
    case "meio-esquerda":
    default:
      return { cab: null, corpo: { x: 590, y: 168, w: LIMITE_DIREITA - 590, h: 1240 }, livre: null, alto: false };
  }
};

// Separa um pedaço do alto de um retângulo (para o título quando não há cabeçalho ao lado da ocular).
export const cortarTopo = (r: Ret, altura: number, folga = 28): { topo: Ret; resto: Ret } => ({
  topo: { x: r.x, y: r.y, w: r.w, h: altura },
  resto: { x: r.x, y: r.y + altura + folga, w: r.w, h: Math.max(0, r.h - altura - folga) },
});
