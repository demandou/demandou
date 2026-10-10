// Onde cada coisa fica nos momentos de carta dos blocos universais, para cada posição da ocular.
// A ocular (a pessoa) é sagrada: nenhum texto entra no círculo dela nem no anel.
//
// No quadro deitado (16:9), a regra da aula 9 do curso: a pessoa numa MOLDURA do lado direito (a
// ocular, com o rosto centralizado nela) e o bloco no QUADRO do lado esquerdo:
//
//   [ QUADRO: o conteúdo (estrelas, linhas, números)  |  MOLDURA: a ocular e o título ]
//
// A ocular sobe ou desce na coluna da direita a cada ideia (a luneta é reapontada):
// - topo-direita: a ocular no alto e o título do bloco embaixo dela (ao lado da ocular);
// - baixo-direita: a ocular embaixo e o título em cima dela;
// - meio-direita: a ocular grande no meio e o título no alto do quadro.
// As posições "-esquerda" e "baixo-centro" do vertical continuam valendo no plano e viram as da
// direita na mesma altura (ceu.ts, posicaoDeitada).
//
// - cab: o cabeçalho (título do bloco, rótulo), na coluna da ocular, centralizado nela;
// - corpo: o conteúdo, no quadro da esquerda (a altura toda da carta);
// - livre: o canto que sobra (não usado pelos blocos universais).
import type { PosicaoOcular } from "./plano";
import { MOLDURA, QUADRO } from "./tema";

export type Ret = { x: number; y: number; w: number; h: number };
export type Areas = { cab: Ret | null; corpo: Ret; livre: Ret | null; alto: boolean; centrar?: boolean };

const CORPO: Ret = { ...QUADRO };
// o título na coluna da ocular, embaixo dela (topo-direita) ou em cima (baixo-direita)
const CAB_EMBAIXO: Ret = { x: MOLDURA.x + 6, y: 684, w: MOLDURA.w - 12, h: 192 };
const CAB_EM_CIMA: Ret = { x: MOLDURA.x + 6, y: 88, w: MOLDURA.w - 12, h: 186 };

export const areasDe = (pos: PosicaoOcular): Areas => {
  switch (pos) {
    case "topo-direita":
    case "topo-esquerda":
      return { cab: CAB_EMBAIXO, corpo: CORPO, livre: null, alto: true, centrar: true };
    case "baixo-direita":
    case "baixo-esquerda":
      return { cab: CAB_EM_CIMA, corpo: CORPO, livre: null, alto: true, centrar: true };
    case "meio-direita":
    case "meio-esquerda":
    case "baixo-centro":
    default:
      return { cab: null, corpo: CORPO, livre: null, alto: false };
  }
};

// Separa um pedaço do alto de um retângulo (para o título quando não há cabeçalho ao lado da ocular).
export const cortarTopo = (r: Ret, altura: number, folga = 28): { topo: Ret; resto: Ret } => ({
  topo: { x: r.x, y: r.y, w: r.w, h: altura },
  resto: { x: r.x, y: r.y + altura + folga, w: r.w, h: Math.max(0, r.h - altura - folga) },
});
