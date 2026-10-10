// A câmera da Manchete: plano fixo. Um zoom só, o vídeo inteiro (tema.ts → caixaDaPessoa): o rosto
// fica na linha central, sem punch-in e sem reenquadramento nos cortes. O dinamismo é do B-roll.
import type { Plano } from "./plano";
import { medidas } from "./tema";

export const zoomNoTempo = (plano: Plano, _t?: number) => medidas(plano).zoomMax;
