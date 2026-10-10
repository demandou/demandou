// Torre de lançamento: térreo com portaria iluminada e marquise, andares de vidro com varandas em L (laje
// branca + guarda-corpo de vidro), ripado de madeira na empena, coroamento com fita de LED. Sobe andar por
// andar, cada um pousando no seu tempo. Fachada "comercial": pele de vidro contínua, luz fria, sem varandas.
import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EASE_INOUT, EASE_OUT, prog } from "../anim";
import { andarEm, andaresEm, FH, POD, TD, TW, type InfoTorre } from "../roteiro";
import { col, floorInteriorTex } from "./mat";

const BAL = 0.26; // profundidade da varanda (frente, +z)
const BALX = 0.22; // varanda lateral (+x)

export const towerMats = (() => {
  let m: ReturnType<typeof make> | null = null;
  const make = () => ({
    slab: new THREE.MeshStandardMaterial({ color: col("#E6E2DA"), roughness: 0.55 }),
    railGlass: new THREE.MeshStandardMaterial({ color: col("#B7CCE2"), roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.34, depthWrite: false, envMapIntensity: 1.4 }),
    rail: new THREE.MeshStandardMaterial({ color: col("#2A2E36"), roughness: 0.35, metalness: 0.7 }),
    wood: new THREE.MeshStandardMaterial({ color: col("#93623F"), roughness: 0.55, emissive: col("#5A3416"), emissiveIntensity: 0.55 }),
    core: new THREE.MeshStandardMaterial({ color: col("#D9D4CA"), roughness: 0.6 }),
    led: new THREE.MeshBasicMaterial({ color: col("#F3D9A4").multiplyScalar(2.2), toneMapped: false }),
    lobby: new THREE.MeshStandardMaterial({ color: col("#1A1410"), roughness: 0.2, metalness: 0.5, emissive: col("#FFD8A8"), emissiveIntensity: 1.25 }),
    paving: new THREE.MeshStandardMaterial({ color: col("#2B2F37"), roughness: 0.8 }),
    lawn: new THREE.MeshStandardMaterial({ color: col("#1E3026"), roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: col("#2D4A36"), roughness: 0.95, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: col("#3A3026"), roughness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: col("#D9BE8A"), roughness: 0.3, metalness: 1, envMapIntensity: 1.6, emissive: col("#5A4320"), emissiveIntensity: 0.6 }),
    mullion: new THREE.MeshStandardMaterial({ color: col("#1C222C"), roughness: 0.3, metalness: 0.8 }),
  });
  return () => (m ??= make());
})();

/* geometrias de um andar-tipo (iguais em todos os andares) */
const box = (w: number, h: number, d: number, x: number, y: number, z: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const FLOOR_GEO = (() => {
  const h = FH - 0.04;
  const slab = mergeGeometries([
    box(TW + 0.06, 0.04, TD + 0.06, 0, 0.02, 0),
    box(TW + 0.06 + BALX, 0.04, BAL, BALX / 2, 0.02, TD / 2 + 0.03 + BAL / 2),
    box(BALX, 0.04, TD + 0.06, TW / 2 + 0.03 + BALX / 2, 0.02, 0),
  ])!;
  const fx0 = -TW / 2 - 0.03;
  const fx1 = TW / 2 + 0.03 + BALX;
  const fz = TD / 2 + 0.03 + BAL;
  const glass = mergeGeometries([box(fx1 - fx0, 0.11, 0.012, (fx0 + fx1) / 2, 0.04 + 0.055, fz), box(0.012, 0.11, fz + TD / 2 + 0.03, fx1, 0.04 + 0.055, (fz - TD / 2 - 0.03) / 2)])!;
  const rail = mergeGeometries([box(fx1 - fx0, 0.012, 0.02, (fx0 + fx1) / 2, 0.155, fz), box(0.02, 0.012, fz + TD / 2 + 0.03, fx1, 0.155, (fz - TD / 2 - 0.03) / 2)])!;
  const slats: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) slats.push(box(0.03, h, 0.035, -TW / 2 - 0.05, 0.04 + h / 2, -TD / 2 + 0.06 + i * ((TD - 0.12) / 15)));
  for (let i = 0; i < 6; i++) slats.push(box(0.035, h, 0.03, -TW / 2 + 0.05 + i * 0.07, 0.04 + h / 2, TD / 2 + 0.05));
  const wood = mergeGeometries(slats)!;
  const core = mergeGeometries([box(0.08, h, 0.08, TW / 2 - 0.02, 0.04 + h / 2, -TD / 2 + 0.02), box(0.08, h, 0.08, -TW / 2 + 0.02, 0.04 + h / 2, -TD / 2 + 0.02)])!;
  // comercial: laje fina contínua + montantes verticais da pele de vidro
  const slabC = box(TW + 0.04, 0.035, TD + 0.04, 0, 0.0175, 0);
  const mull: THREE.BufferGeometry[] = [];
  for (let i = 0; i <= 10; i++) {
    mull.push(box(0.018, h, 0.02, -TW / 2 + (i * TW) / 10, 0.04 + h / 2, TD / 2 + 0.005));
    mull.push(box(0.018, h, 0.02, -TW / 2 + (i * TW) / 10, 0.04 + h / 2, -TD / 2 - 0.005));
  }
  for (let i = 0; i <= 7; i++) {
    mull.push(box(0.02, h, 0.018, TW / 2 + 0.005, 0.04 + h / 2, -TD / 2 + (i * TD) / 7));
    mull.push(box(0.02, h, 0.018, -TW / 2 - 0.005, 0.04 + h / 2, -TD / 2 + (i * TD) / 7));
  }
  return { slab, glass, rail, wood, core, h, slabC, mull: mergeGeometries(mull)! };
})();

const Floor: React.FC<{ k: number; t: number; T: InfoTorre }> = ({ k, t, T }) => {
  const m = towerMats();
  const a = andarEm(T, k);
  const comercial = T.fachada === "comercial";
  const gm = useMemo(() => {
    const tex = floorInteriorTex(`tw${k % 6}`, comercial ? 0.86 : 0.66).clone();
    tex.needsUpdate = true;
    tex.offset.x = random(`off${k}`);
    return new THREE.MeshStandardMaterial({ color: col("#0B1422"), roughness: 0.06, metalness: 0.92, emissive: col(comercial ? "#DCE8FF" : "#FFE0B8"), emissiveMap: tex, emissiveIntensity: 0, envMapIntensity: 1.35 });
  }, [k, comercial]);
  if (t < a - 0.001) return null;
  const p = prog(t, a, a + 0.3, EASE_OUT);
  const d = T.m?.andarDestaque;
  const dk = d && d.andar - 1 === k ? prog(t, d.em - 0.05, d.em + 0.4, EASE_INOUT) : 0;
  gm.emissiveIntensity = (comercial ? 0.95 : 1.15) * prog(t, a + 0.12, a + 0.55, EASE_INOUT) + dk * 0.9;
  gm.emissive.set(comercial ? "#DCE8FF" : "#FFE0B8").lerp(col("#F3C77A"), dk);
  const y = POD + k * FH + (1 - p) * 0.6;
  const s = 1 + (1 - p) * 0.05;
  return (
    <group position={[0, y, 0]} scale={[s, 1, s]}>
      {comercial ? (
        <>
          <mesh geometry={FLOOR_GEO.slabC} material={m.slab} castShadow receiveShadow />
          <mesh position={[0, 0.04 + FLOOR_GEO.h / 2, 0]} material={gm} castShadow receiveShadow>
            <boxGeometry args={[TW, FLOOR_GEO.h, TD]} />
          </mesh>
          <mesh geometry={FLOOR_GEO.mull} material={m.mullion} />
        </>
      ) : (
        <>
          <mesh geometry={FLOOR_GEO.slab} material={m.slab} castShadow receiveShadow />
          <mesh position={[0, 0.04 + FLOOR_GEO.h / 2, 0]} material={gm} castShadow receiveShadow>
            <boxGeometry args={[TW, FLOOR_GEO.h, TD]} />
          </mesh>
          <mesh geometry={FLOOR_GEO.core} material={m.core} castShadow />
          <mesh geometry={FLOOR_GEO.wood} material={m.wood} castShadow />
          <mesh geometry={FLOOR_GEO.glass} material={m.railGlass} />
          <mesh geometry={FLOOR_GEO.rail} material={m.rail} />
        </>
      )}
      {dk > 0 ? (
        <mesh position={[0, 0.04 + FLOOR_GEO.h / 2, 0]} material={m.led} scale={[1 + 0.02 * dk, 1, 1 + 0.02 * dk]}>
          <boxGeometry args={[TW + 0.07, 0.012, TD + 0.07]} />
        </mesh>
      ) : null}
    </group>
  );
};

/* térreo + lote paisagístico */
const TREES_LOT: Array<[number, number, number]> = [
  [-1.45, 1.05, 0.2],
  [1.55, 1.1, 0.22],
  [-1.5, -0.7, 0.18],
  [1.6, -0.6, 0.2],
  [-0.95, 1.3, 0.15],
  [1.0, 1.32, 0.15],
];
const Podium: React.FC<{ t: number; T: InfoTorre }> = ({ t, T }) => {
  const m = towerMats();
  const p = prog(t, T.podio, T.podio + 0.53, EASE_OUT);
  if (p <= 0) return null;
  return (
    <group scale={[1, p, 1]}>
      <mesh position={[0, 0.02, 0.25]} material={m.paving} receiveShadow>
        <boxGeometry args={[3.6, 0.04, 3.1]} />
      </mesh>
      <mesh position={[-1.35, 0.05, 0.25]} material={m.lawn} receiveShadow>
        <boxGeometry args={[0.7, 0.04, 2.7]} />
      </mesh>
      <mesh position={[1.42, 0.05, 0.25]} material={m.lawn} receiveShadow>
        <boxGeometry args={[0.6, 0.04, 2.7]} />
      </mesh>
      {TREES_LOT.map(([x, z, r], i) => (
        <group key={i} position={[x, 0.06, z]}>
          <mesh position={[0, r * 1.2, 0]} material={m.trunk} castShadow>
            <cylinderGeometry args={[0.015, 0.022, r * 2.4, 6]} />
          </mesh>
          <mesh position={[0, r * 2.6, 0]} material={m.leaf} castShadow>
            <icosahedronGeometry args={[r, 1]} />
          </mesh>
        </group>
      ))}
      {[-0.55, -0.25, 0.25, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.08, 1.45]} material={m.led}>
          <cylinderGeometry args={[0.018, 0.018, 0.08, 8]} />
        </mesh>
      ))}
      <mesh position={[0, POD / 2 + 0.04, 0]} material={m.lobby} castShadow>
        <boxGeometry args={[TW - 0.12, POD - 0.04, TD - 0.12]} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (TW / 2 - 0.04), POD / 2 + 0.02, sz * (TD / 2 - 0.04)]} material={m.core} castShadow>
          <boxGeometry args={[0.09, POD, 0.09]} />
        </mesh>
      ))}
      {new Array(9).fill(0).map((_, i) => (
        <mesh key={i} position={[-TW / 2 + 0.12 + i * 0.065, POD / 2 + 0.04, TD / 2 - 0.02]} material={m.wood} castShadow>
          <boxGeometry args={[0.035, POD - 0.06, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0.35, POD - 0.06, TD / 2 + 0.3]} material={m.slab} castShadow>
        <boxGeometry args={[1.25, 0.045, 0.62]} />
      </mesh>
      <mesh position={[0.35, POD - 0.088, TD / 2 + 0.6]} material={m.led}>
        <boxGeometry args={[1.2, 0.01, 0.012]} />
      </mesh>
      <mesh position={[0, POD - 0.01, 0]} material={m.slab} castShadow receiveShadow>
        <boxGeometry args={[TW + 0.1, 0.05, TD + 0.1]} />
      </mesh>
    </group>
  );
};

/* coroamento: cobertura recuada + moldura branca com LED */
const Crown: React.FC<{ t: number; T: InfoTorre }> = ({ t, T }) => {
  const m = towerMats();
  const ult = andarEm(T, T.nf - 1);
  const c = prog(t, ult + 0.12, ult + 0.6, EASE_OUT);
  const led = prog(t, ult + 0.35, ult + 0.9, EASE_INOUT);
  if (c <= 0) return null;
  const y0 = POD + T.nf * FH;
  const fw = TW + 0.1;
  const fd = TD + 0.1;
  const fh = 0.42;
  return (
    <group position={[0, y0, 0]} scale={[1, c, 1]}>
      <mesh position={[0, 0.025, 0]} material={m.slab} castShadow>
        <boxGeometry args={[TW + 0.12, 0.05, TD + 0.12]} />
      </mesh>
      <mesh position={[-0.2, 0.17, -0.15]} castShadow>
        <boxGeometry args={[1.2, 0.24, 0.9]} />
        <meshStandardMaterial color="#121A28" roughness={0.1} metalness={0.9} emissive="#FFD9A8" emissiveIntensity={0.5} />
      </mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * fw) / 2, fh / 2, (sz * fd) / 2]} material={m.slab} castShadow>
          <boxGeometry args={[0.06, fh, 0.06]} />
        </mesh>
      ))}
      {[
        [0, fd / 2, fw, 0.06],
        [0, -fd / 2, fw, 0.06],
        [fw / 2, 0, 0.06, fd],
        [-fw / 2, 0, 0.06, fd],
      ].map(([x, z, w, d], i) => (
        <group key={i}>
          <mesh position={[x, fh, z]} material={m.slab} castShadow>
            <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} />
          </mesh>
          <mesh position={[x, fh - 0.045, z]} material={m.led} scale={[1, led, 1]}>
            <boxGeometry args={[w, 0.014, d]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** contorno-fantasma (a torre em traço branco) + anel dourado de obra que sobe junto */
const Ghost: React.FC<{ t: number; T: InfoTorre }> = ({ t, T }) => {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const x = TW / 2 + 0.05;
    const z = TD / 2 + 0.05;
    const rect = (y: number) => {
      const r = [[-x, -z], [x, -z], [x, z], [-x, z]];
      for (let i = 0; i < 4; i++) pts.push(r[i][0], y, r[i][1], r[(i + 1) % 4][0], y, r[(i + 1) % 4][1]);
    };
    for (let k = 0; k <= T.nf; k++) rect(POD + k * FH);
    for (const [a, b] of [[-x, -z], [x, -z], [x, z], [-x, z]]) pts.push(a, POD, b, a, T.h, b);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [T.nf, T.h]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: col("#E8EEFF"), transparent: true, opacity: 0.3, depthWrite: false }), []);
  const ring = useMemo(() => new THREE.LineBasicMaterial({ color: col("#D9BE8A").multiplyScalar(1.7), transparent: true, opacity: 1, toneMapped: false }), []);
  const ringGeo = useMemo(() => {
    const x = TW / 2 + 0.3;
    const z = TD / 2 + 0.34;
    return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-x, 0, -z), new THREE.Vector3(x, 0, -z), new THREE.Vector3(x, 0, z), new THREE.Vector3(-x, 0, z), new THREE.Vector3(-x, 0, -z)]);
  }, []);
  const ult = andarEm(T, T.nf - 1);
  const on = prog(t, T.ghostDe, Math.max(T.ghostDe + 0.3, T.t0), EASE_OUT) * (1 - prog(t, ult, ult + 0.6));
  if (on <= 0.001) return null;
  mat.opacity = 0.36 * on;
  ring.opacity = prog(t, T.t0, T.t0 + 0.2) * (1 - prog(t, ult + 0.1, ult + 0.5));
  return (
    <group>
      <lineSegments geometry={geo} material={mat} />
      <lineLoop geometry={ringGeo} material={ring} position={[0, POD + andaresEm(T, t) * FH + 0.02, 0]} />
    </group>
  );
};

export const Torre3D: React.FC<{ t: number; T: InfoTorre; scaleY: number }> = ({ t, T, scaleY }) => (
  <group scale={[1, scaleY, 1]}>
    <Podium t={t} T={T} />
    {T.m
      ? new Array(T.nf).fill(0).map((_, k) => <Floor key={k} k={k} t={t} T={T} />)
      : null}
    {T.m ? <Crown t={t} T={T} /> : null}
    {T.m ? <Ghost t={t} T={T} /> : null}
  </group>
);

/** volume invisível que só projeta sombra (a cidade desfocada do fundo recebe a sombra da torre) */
export const SombraDaTorre: React.FC<{ t: number; T: InfoTorre; scaleY: number }> = ({ t, T, scaleY }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), []);
  const n = T.m ? andaresEm(T, t) : 0;
  const h = (prog(t, T.podio, T.podio + 0.53) > 0 ? POD : 0) + n * FH;
  if (h <= 0.01) return null;
  return (
    <mesh position={[0, (h * scaleY) / 2, 0]} material={mat} castShadow>
      <boxGeometry args={[TW + 0.2, h * scaleY, TD + 0.3]} />
    </mesh>
  );
};
