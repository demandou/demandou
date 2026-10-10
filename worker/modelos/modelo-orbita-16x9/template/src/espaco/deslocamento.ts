import * as THREE from "three";
import type { Plano } from "../plano";
import { PALCO } from "../tema";
import { ASPECT, TAN, type Estacao, poseLocal, projetar } from "./camera";

// quanto o conteúdo de uma estação está deslocado no palco agora: a grua leva junto o que é dela
// (entra por cima quando a câmera sobe até ela, sai por baixo quando a câmera sobe para a próxima)
export const deslocamento = (plano: Plano, e: Estacao, t: number) => {
  const p = projetar(plano, e.base, t);
  const g = poseLocal(e, t);
  const rel = new THREE.Vector3(-g.pos.x, -g.pos.y + e.descer, -g.pos.z);
  const d = Math.max(0.1, -rel.z);
  const mx = PALCO.w / 2;
  const my = PALCO.h / 2;
  const xRest = mx + (rel.x / (d * TAN * ASPECT)) * mx;
  const yRest = my - (rel.y / (d * TAN)) * my;
  return { dx: p.x - xRest, dy: p.y - yRest };
};
