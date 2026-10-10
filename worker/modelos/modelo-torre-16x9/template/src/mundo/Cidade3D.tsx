import React, { useMemo } from "react";
import * as THREE from "three";
import { random } from "remotion";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EASE_INOUT, EASE_OUT, clamp01, keys, lerp, prog } from "../anim";
import type { InfoRota } from "../roteiro";
import { BX, BZ, DESTINO, OZ, PATH, PX, PZ, streetX, streetZ, type V3 } from "./geo";
import { col, windowsTex } from "./mat";
import { towerMats } from "./Torre3D";

// A cidade à noite (estilizada): quarteirões grandes com lotes, casas baixas, prédios médios e algumas torres,
// postes de luz quentes e árvores nas calçadas, praça com espelho d'água. Vira MAPA em relevo no bloco `rota`.

const I0 = -4;
const I1 = 5;
const J0 = -5;
const J1 = 3;
const PARK = { i: 0, j: -1 };
type Bld = { x: number; z: number; w: number; d: number; h: number; v: number };
const CITY: Bld[] = (() => {
  const out: Bld[] = [];
  for (let i = I0; i <= I1; i++)
    for (let j = J0; j <= J1; j++) {
      if (i === PARK.i && j === PARK.j) continue;
      const cx = i * PX;
      const cz = OZ + j * PZ;
      const camSide = i >= 0 && j >= 0 && i + j >= 1;
      const near = Math.abs(i) <= 1 && Math.abs(j) <= 1;
      for (let c = 0; c < 3; c++)
        for (let r = 0; r < 2; r++) {
          if (i === 0 && j === 0 && c === 1 && r === 1) continue; // lote da torre
          const id = `b${i}_${j}_${c}_${r}`;
          const q = random(id);
          const lw = BX / 3;
          const ld = BZ / 2;
          const lx = cx - BX / 2 + lw * (c + 0.5);
          const lz = cz - BZ / 2 + ld * (r + 0.5);
          let h: number;
          if (i === 0 && j === 0) h = 0.25 + q * 0.35;
          else if (camSide) h = 0.2 + q * (near ? 0.3 : i + j <= 3 ? 0.45 : 0.85);
          else h = q < 0.55 ? 0.25 + random(`${id}h`) * 0.45 : q < 0.86 ? 0.8 + random(`${id}h`) * 1.5 : 2.3 + random(`${id}h`) * 2.6;
          const tall = h > 2;
          const w = tall ? lw * 0.62 : lw * (0.78 + 0.16 * random(`${id}w`));
          const d = tall ? ld * 0.62 : ld * (0.74 + 0.18 * random(`${id}d`));
          const v = h < 0.75 ? 2 : tall && random(`${id}o`) < 0.5 ? 1 : 0;
          out.push({ x: lx + (random(`${id}x`) - 0.5) * (lw - w) * 0.8, z: lz + (random(`${id}z`) - 0.5) * (ld - d) * 0.8, w, d, h, v });
        }
    }
  return out;
})();

/* geometria mesclada por tipo, com UV em escala real (janelas do mesmo tamanho em qualquer prédio) e telhado claro */
const CELL_U = 0.34 * 8;
const CELL_V = 0.32 * 8;
const buildGeo = (b: Bld) => {
  const g = new THREE.BoxGeometry(b.w, b.h, b.d).translate(b.x, b.h / 2, b.z);
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const uv = g.getAttribute("uv");
  const colors: number[] = [];
  for (let k = 0; k < pos.count; k++) {
    const nx = nor.getX(k);
    const ny = nor.getY(k);
    if (Math.abs(ny) > 0.5) {
      uv.setXY(k, 0.004, 0.004);
      colors.push(1.5, 1.5, 1.55);
    } else {
      const hor = Math.abs(nx) > 0.5 ? pos.getZ(k) : pos.getX(k);
      uv.setXY(k, (hor + 50) / CELL_U, pos.getY(k) / CELL_V);
      colors.push(1, 1, 1);
    }
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return g;
};
const GEO = (() => {
  const byV: THREE.BufferGeometry[][] = [[], [], []];
  const edges: THREE.BufferGeometry[] = [];
  const unitEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  for (const b of CITY) {
    byV[b.v].push(buildGeo(b));
    edges.push(unitEdges.clone().scale(b.w, b.h, b.d).translate(b.x, 0, b.z));
  }
  const plates: THREE.BufferGeometry[] = [];
  const plateEdges: THREE.BufferGeometry[] = [];
  const unitPlateEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(BX, 0.05, BZ));
  for (let i = I0; i <= I1; i++)
    for (let j = J0; j <= J1; j++) {
      if (i === PARK.i && j === PARK.j) continue;
      plates.push(new THREE.BoxGeometry(BX, 0.05, BZ).translate(i * PX, 0.025, OZ + j * PZ));
      plateEdges.push(unitPlateEdges.clone().translate(i * PX, 0.025, OZ + j * PZ));
    }
  const all = mergeGeometries(byV.flat().map((g) => g.clone().deleteAttribute("color").deleteAttribute("uv").deleteAttribute("normal")))!;
  return { meshes: byV.map((gs) => mergeGeometries(gs)!), edges: mergeGeometries(edges)!, plates: mergeGeometries(plates)!, plateEdges: mergeGeometries(plateEdges)!, all };
})();

/* postes e árvores de calçada (instanciados) */
const LAMPS: V3[] = (() => {
  const o: V3[] = [];
  for (let j = J0 - 1; j <= J1; j++) for (let x = I0 * PX - BX / 2; x <= I1 * PX + BX / 2; x += 1.7) for (const s of [-1, 1]) o.push([x + (s > 0 ? 0.85 : 0), 0.32, streetZ(j) + s * 0.52]);
  for (let i = I0 - 1; i <= I1; i++) for (let z = OZ + J0 * PZ - BZ / 2; z <= OZ + J1 * PZ + BZ / 2; z += 1.7) for (const s of [-1, 1]) o.push([streetX(i) + s * 0.52, 0.32, z + (s > 0 ? 0.85 : 0)]);
  return o;
})();
const STREET_TREES: V3[] = (() => {
  const o: V3[] = [];
  for (let j = J0 - 1; j <= J1; j++)
    for (let x = I0 * PX - BX / 2; x <= I1 * PX + BX / 2; x += 1.25) if (random(`st${j}_${x.toFixed(2)}`) < 0.55) o.push([x, 0.3, streetZ(j) - 0.42 + (random(`sz${j}_${x}`) < 0.5 ? 0 : 0.84)]);
  for (let i = I0 - 1; i <= I1; i++)
    for (let z = OZ + J0 * PZ - BZ / 2; z <= OZ + J1 * PZ + BZ / 2; z += 1.25) if (random(`sti${i}_${z.toFixed(2)}`) < 0.45) o.push([streetX(i) - 0.42 + (random(`sx${i}_${z}`) < 0.5 ? 0 : 0.84), 0.3, z]);
  const pc: V3 = [PARK.i * PX, 0, OZ + PARK.j * PZ];
  for (let k = 0; k < 46; k++) {
    const a = random(`pa${k}`) * Math.PI * 2;
    const r = 1.75 + random(`pr${k}`) * 1.0;
    o.push([pc[0] + Math.cos(a) * r * 1.25, 0.34, pc[2] + Math.sin(a) * r * 0.78]);
  }
  return o;
})();
const Instanced: React.FC<{ pts: V3[]; geo: THREE.BufferGeometry; mat: THREE.Material; scale?: (k: number) => number; cast?: boolean }> = ({ pts, geo, mat, scale, cast }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, pts.length);
    const o = new THREE.Object3D();
    pts.forEach((p, k) => {
      o.position.set(...p);
      const s = scale ? scale(k) : 1;
      o.scale.set(s, s, s);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    });
    m.castShadow = !!cast;
    m.receiveShadow = true;
    return m;
  }, [pts, geo, mat, scale, cast]);
  return <primitive object={mesh} />;
};

const useCityMats = () =>
  useMemo(() => {
    const res = new THREE.MeshStandardMaterial({ color: col("#2B313D"), roughness: 0.7, metalness: 0.15, vertexColors: true, emissive: col("#FFD3A0"), emissiveMap: windowsTex("res", 0.36, 8, 8, 0.85), emissiveIntensity: 0.9, envMapIntensity: 0.7 });
    const off = new THREE.MeshStandardMaterial({ color: col("#1B2333"), roughness: 0.25, metalness: 0.6, vertexColors: true, emissive: col("#DDE8FF"), emissiveMap: windowsTex("off", 0.5, 8, 8, 0.35), emissiveIntensity: 0.65, envMapIntensity: 1.1 });
    const house = new THREE.MeshStandardMaterial({ color: col("#2D2A29"), roughness: 0.85, vertexColors: true, emissive: col("#FFC98C"), emissiveMap: windowsTex("house", 0.18, 8, 8, 0.95), emissiveIntensity: 0.9 });
    return {
      mats: [res, off, house],
      base: [col("#2B313D"), col("#1B2333"), col("#2D2A29")],
      edge: new THREE.LineBasicMaterial({ color: col("#E9EEF8"), transparent: true, opacity: 0, depthWrite: false }),
      plate: new THREE.MeshStandardMaterial({ color: col("#161C26"), roughness: 0.95 }),
      plateEdge: new THREE.LineBasicMaterial({ color: col("#E9EEF8"), transparent: true, opacity: 0, depthWrite: false }),
      lamp: new THREE.MeshBasicMaterial({ color: col("#FFC98A").multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 1 }),
      tree: new THREE.MeshStandardMaterial({ color: col("#24392C"), roughness: 1, flatShading: true }),
      lawn: new THREE.MeshStandardMaterial({ color: col("#1C2F25"), roughness: 1 }),
      path: new THREE.MeshStandardMaterial({ color: col("#3A3E46"), roughness: 0.9 }),
      water: new THREE.MeshStandardMaterial({ color: col("#13253A"), roughness: 0.08, metalness: 0.8, envMapIntensity: 1.5 }),
      depth: new THREE.MeshBasicMaterial({ colorWrite: false }),
    };
  }, []);

const lampGeo = new THREE.SphereGeometry(0.035, 8, 6);
const treeGeo = new THREE.IcosahedronGeometry(0.17, 0);
const treeScale = (k: number) => 0.8 + random(`ts${k}`) * 0.55;

/** cidade completa (canvas do fundo — desfocado no plano da torre) */
export const City: React.FC<{ mk: number }> = ({ mk }) => {
  const m = useCityMats();
  m.mats.forEach((mm, i) => {
    mm.emissiveIntensity = lerp(i === 1 ? 0.65 : 0.9, 0.0, mk);
    mm.color.copy(m.base[i]).lerp(col("#3B4762"), mk);
    mm.metalness = lerp(i === 1 ? 0.6 : 0.15, 0.05, mk);
  });
  m.edge.opacity = 0.34 * mk;
  m.plateEdge.opacity = 0.18 * mk;
  m.plate.color.set("#161C26").lerp(col("#29334A"), mk);
  m.lamp.opacity = 1 - mk;
  m.lawn.color.set("#1C2F25").lerp(col("#2C4537"), mk);
  m.path.color.set("#3A3E46").lerp(col("#5A6170"), mk);
  const pc: V3 = [PARK.i * PX, 0, OZ + PARK.j * PZ];
  return (
    <group>
      <mesh geometry={GEO.plates} material={m.plate} receiveShadow />
      <lineSegments geometry={GEO.plateEdges} material={m.plateEdge} />
      <group scale={[1, lerp(1, 0.28, mk), 1]} position={[0, 0.05, 0]}>
        {GEO.meshes.map((g, v) => (
          <mesh key={v} geometry={g} material={m.mats[v]} castShadow receiveShadow />
        ))}
        <lineSegments geometry={GEO.edges} material={m.edge} />
      </group>
      {/* praça */}
      <mesh position={[pc[0], 0.04, pc[2]]} material={m.lawn} receiveShadow>
        <boxGeometry args={[BX, 0.06, BZ]} />
      </mesh>
      <mesh position={[pc[0], 0.075, pc[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 0.78, 1]} material={m.path} receiveShadow>
        <ringGeometry args={[1.45, 1.6, 64]} />
      </mesh>
      <mesh position={[pc[0], 0.076, pc[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 0.78, 1]} material={m.water}>
        <circleGeometry args={[0.95, 64]} />
      </mesh>
      {[0, 1].map((k) => (
        <mesh key={k} position={[pc[0] + (k ? 2.6 : -2.6), 0.075, pc[2]]} rotation={[-Math.PI / 2, 0, 0]} material={m.path}>
          <planeGeometry args={[1.8, 0.14]} />
        </mesh>
      ))}
      <Instanced pts={STREET_TREES} geo={treeGeo} mat={m.tree} scale={treeScale} cast />
      {mk < 0.99 ? <Instanced pts={LAMPS} geo={lampGeo} mat={m.lamp} /> : null}
    </group>
  );
};

/** a mesma cidade só em profundidade (no canvas da frente: esconde a torre/rota atrás dos prédios) */
export const CityDepth: React.FC<{ mk: number }> = ({ mk }) => {
  const m = useCityMats();
  return (
    <group scale={[1, lerp(1, 0.28, mk), 1]} position={[0, 0.05, 0]}>
      <mesh geometry={GEO.all} material={m.depth} />
    </group>
  );
};

/* ---------- mapa: rota dourada animada, pino, destino, paradas ---------- */
const SEG = 420;
const RAD = 10;
const routeGeo = new THREE.TubeGeometry(PATH, SEG, 0.11, RAD, false);
const glowGeo = new THREE.TubeGeometry(PATH, SEG, 0.32, RAD, false);
export const progressoDaRota = (r: InfoRota, t: number) => keys(t, r.chaves, EASE_INOUT);
const ponto = (u: number): V3 => {
  const p = PATH.getPointAt(clamp01(u));
  return [p.x, p.y, p.z];
};

export const Mapa3D: React.FC<{ t: number; r: InfoRota; mk: number; towerTop: number }> = ({ t, r, mk, towerTop }) => {
  const g = towerMats();
  const mats = useMemo(
    () => ({
      line: new THREE.MeshBasicMaterial({ color: col("#F0D9A8").multiplyScalar(1.5), toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({ color: col("#D9BE8A"), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      ring: new THREE.MeshBasicMaterial({ color: col("#D9BE8A").multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }),
      ring2: new THREE.MeshBasicMaterial({ color: col("#D9BE8A").multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }),
      navy: new THREE.MeshStandardMaterial({ color: col("#0E1729"), roughness: 0.4 }),
      pin: new THREE.MeshStandardMaterial({ color: col("#E2C690"), roughness: 0.25, metalness: 0.85, envMapIntensity: 1.6, emissive: col("#9A7840"), emissiveIntensity: 0.75 }),
    }),
    [],
  );
  if (mk <= 0.001) return null;
  const fim = r.tiro.ate;
  const gone = prog(t, fim + 0.05, fim + 0.35);
  mats.line.color.set("#F0D9A8").multiplyScalar(1.5 * (1 - gone));
  mats.glow.opacity = 0.22 * (1 - gone);
  const drop = prog(t, r.pino - 0.05, r.pino + 0.45, EASE_OUT);
  const pinOut = 1 - prog(t, fim - 0.1, fim + 0.25, EASE_INOUT);
  const pinY = towerTop + 0.3 + (1 - drop) * 5;
  const pulse = clamp01((t - (r.pino + 0.35)) / 1.1);
  mats.ring.opacity = drop > 0.99 ? (1 - pulse) * 0.9 * (1 - gone) : 0;
  const rp = progressoDaRota(r, t);
  const n = Math.floor(rp * SEG) * RAD * 6;
  routeGeo.setDrawRange(0, n);
  glowGeo.setDrawRange(0, n);
  const head = ponto(rp);
  const chegada = r.destino ? r.destino.em : r.fim;
  const arrive = clamp01((t - (chegada + 0.05)) / 1.0);
  mats.ring2.opacity = t > chegada ? (1 - arrive) * 0.9 * (1 - gone) : 0;
  const destIn = prog(t, chegada - 0.15, chegada + 0.3, EASE_OUT);
  const fimPt = r.destino ? DESTINO : ponto(1);
  return (
    <group>
      {drop > 0 && pinOut > 0.001 ? (
        <group position={[0, pinY + (1 - pinOut) * 2, 0]} scale={pinOut * 2.3}>
          <mesh position={[0, 0.95, 0]} material={mats.pin} castShadow>
            <sphereGeometry args={[0.6, 40, 28]} />
          </mesh>
          <mesh position={[0, 0.36, 0]} rotation={[Math.PI, 0, 0]} material={mats.pin} castShadow>
            <coneGeometry args={[0.5, 1.15, 40, 1, true]} />
          </mesh>
          <mesh position={[0, 1.33, 0.2]} material={mats.navy}>
            <sphereGeometry args={[0.24, 24, 16]} />
          </mesh>
        </group>
      ) : null}
      {mats.ring.opacity > 0 ? (
        <mesh position={[0, towerTop + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.8 + pulse * 3.2} material={mats.ring}>
          <ringGeometry args={[0.93, 1, 64]} />
        </mesh>
      ) : null}
      {rp > 0 && gone < 1 ? (
        <>
          <mesh geometry={glowGeo} material={mats.glow} />
          <mesh geometry={routeGeo} material={mats.line} />
        </>
      ) : null}
      {rp > 0 && rp < 1 ? (
        <mesh position={[head[0], 0.2, head[2]]} material={mats.line}>
          <sphereGeometry args={[0.28, 24, 16]} />
        </mesh>
      ) : null}
      {/* paradas no caminho: discos dourados que acendem quando a rota passa */}
      {gone < 1
        ? r.paradas.map((p, i) => {
            const on = prog(t, p.em - 0.1, p.em + 0.3, EASE_OUT);
            if (on <= 0 || (!r.destino && i === r.paradas.length - 1)) return null;
            const q = ponto(p.u);
            return (
              <group key={i} position={[q[0], 0.07, q[2]]} scale={[on, 1, on]}>
                <mesh receiveShadow material={mats.navy}>
                  <cylinderGeometry args={[0.62, 0.62, 0.06, 40]} />
                </mesh>
                <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} material={g.gold}>
                  <ringGeometry args={[0.48, 0.62, 48]} />
                </mesh>
              </group>
            );
          })
        : null}
      {destIn > 0 && gone < 1 ? (
        <group position={[fimPt[0], 0.06, fimPt[2]]} scale={[destIn, 1, destIn]}>
          <mesh receiveShadow material={mats.navy}>
            <cylinderGeometry args={[1.1, 1.1, 0.07, 48]} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={g.gold}>
            <ringGeometry args={[0.92, 1.1, 64]} />
          </mesh>
        </group>
      ) : null}
      {mats.ring2.opacity > 0 ? (
        <mesh position={[fimPt[0], 0.12, fimPt[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={0.9 + arrive * 2.6} material={mats.ring2}>
          <ringGeometry args={[0.93, 1, 64]} />
        </mesh>
      ) : null}
    </group>
  );
};
