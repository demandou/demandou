// Geometria do mundo (1 u ≈ 9 m): quarteirões, ruas, a rota a pé e a projeção 3D → tela.
import * as THREE from "three";
import { camEm, type CamState, type Roteiro, type V3 } from "../roteiro";

export type { V3 };
export const BX = 7;
export const BZ = 5;
export const ST = 1.2; // rua
export const PX = BX + ST;
export const PZ = BZ + ST;
export const OZ = -1.2; // centro do quarteirão da torre em z
/** eixo da rua no sentido x (z constante) e no sentido z (x constante) */
export const streetZ = (j: number) => OZ + BZ / 2 + ST / 2 + j * PZ;
export const streetX = (i: number) => BX / 2 + ST / 2 + i * PX;

/* rota: portaria → rua do prédio → vira à direita → segue duas quadras até o destino */
export const ROUTE: V3[] = [
  [0, 0.04, 1.05],
  [0, 0.04, streetZ(0)],
  [streetX(0), 0.04, streetZ(0)],
  [streetX(0), 0.04, streetZ(-2)],
];
export const DESTINO: V3 = [streetX(0), 0, streetZ(-2)];
/** onde os nomes de rua ficam deitados (1ª rua = a da curva; 2ª = a do destino) */
export const RUAS: Array<{ a: V3; b: V3 }> = [
  { a: [streetX(0) + 1.1, 0.05, streetZ(-1) + 2.6], b: [streetX(0) + 1.1, 0.05, streetZ(-1) - 2.6] },
  { a: [streetX(0) - 7.5, 0.05, streetZ(-2)], b: [streetX(0) - 2.0, 0.05, streetZ(-2)] },
];

export const CW = 1080;
export const CH = 1920;
export const applyCam = (cam: THREE.PerspectiveCamera, c: CamState) => {
  cam.position.set(...c.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...c.look);
  cam.fov = c.fov;
  cam.aspect = CW / CH;
  cam.near = 0.1;
  cam.far = 600;
  cam.setViewOffset(CW, CH, c.sx, c.sy, CW, CH);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};
const PROJ = new THREE.PerspectiveCamera();
const V = new THREE.Vector3();
/** ponto do mundo → pixel da tela (1080×1920) */
export const projetar = (R: Roteiro, t: number, p: V3) => {
  applyCam(PROJ, camEm(R, t));
  V.set(...p).project(PROJ);
  return { x: ((V.x + 1) / 2) * CW, y: ((1 - V.y) / 2) * CH, ok: V.z < 1 };
};

/* ---------- a rota como curva (cantos arredondados) ---------- */
export const PATH = (() => {
  const cp = new THREE.CurvePath<THREE.Vector3>();
  const v = ROUTE.map((p) => new THREE.Vector3(...p));
  const rad = 0.45;
  let prev = v[0].clone();
  for (let i = 1; i < v.length; i++) {
    const a = v[i - 1];
    const b = v[i];
    const c = v[i + 1];
    if (!c) {
      cp.add(new THREE.LineCurve3(prev, b));
      break;
    }
    const inDir = b.clone().sub(a).normalize();
    const outDir = c.clone().sub(b).normalize();
    const r = Math.min(rad, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().addScaledVector(inDir, -r);
    const p2 = b.clone().addScaledVector(outDir, r);
    cp.add(new THREE.LineCurve3(prev, p1));
    cp.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  return cp;
})();
export const pontoDaRota = (u: number): V3 => {
  const p = PATH.getPointAt(Math.max(0, Math.min(1, u)));
  return [p.x, p.y, p.z];
};
