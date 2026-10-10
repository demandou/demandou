import React, { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { mix } from "../anim";
import { MARCA } from "../marca";
import { ALTURA_BEIRAL, ALTURA_CUMEEIRA, camera, cordasEEstacas, elevacao, PROFUNDIDADE, type Estado } from "./roteiro";

/**
 * A MAQUETE 3D (aula 8.1): geometria real do Three.js, animada só pelo quadro
 * da composição (o Rig põe a câmera a cada render; nada de useFrame).
 *
 * Planos da vista explodida, de baixo para cima: CHÃO E ESTACAS, CORTINA (a
 * lona, com os mastros) e CORDAS. A lona é uma malha paramétrica: com a
 * corda frouxa e a estaca solta ela enruga e cede; "bem esticadinha" zera as
 * rugas. É sempre a mesma tenda: os mesmos pontos, só deslocados.
 */

const cor = (hex: string) => new THREE.Color(hex);
const LARANJA = cor(MARCA.destaque);
const TITULO = cor(MARCA.titulo);

export const Rig: React.FC<{ t: number }> = ({ t }) => {
  const { camera: cam } = useThree();
  useLayoutEffect(() => {
    const c = camera(t);
    const p = cam as THREE.PerspectiveCamera;
    p.fov = c.fov;
    p.position.set(...c.pos);
    p.lookAt(new THREE.Vector3(...c.alvo));
    p.updateProjectionMatrix();
  });
  return null;
};

/** Uma face da lona: grade u × v entre quatro cantos, enrugada por `ruga` e cedendo no meio. */
function faceDaLona(p00: THREE.Vector3, p10: THREE.Vector3, p01: THREE.Vector3, p11: THREE.Vector3, ruga: number, fase: number, cede: boolean) {
  const nu = 30;
  const nv = 12;
  const normal = new THREE.Vector3().subVectors(p10, p00).cross(new THREE.Vector3().subVectors(p01, p00)).normalize();
  const pos: number[] = [];
  const idx: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      a.lerpVectors(p00, p10, u);
      b.lerpVectors(p01, p11, u);
      const p = a.clone().lerp(b, v);
      const borda = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      const onda = 0.55 * Math.sin(2 * Math.PI * 3.5 * u + fase) + 0.45 * Math.sin(2 * Math.PI * 1.5 * v + 2 * fase) * Math.cos(2 * Math.PI * 2 * u);
      p.addScaledVector(normal, ruga * borda * onda);
      if (cede) p.y -= ruga * 1.6 * borda;
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const q = j * (nu + 1) + i;
      idx.push(q, q + nu + 1, q + 1, q + 1, q + nu + 1, q + nu + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function useDescartar<T extends { dispose: () => void }>(obj: T) {
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

const Lona: React.FC<{ e: Estado; foco: number }> = ({ e, foco }) => {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const ruga = 0.13 * (1 - e.estica) * mix(1, 0.75, e.tensao);
  const sobra = 0.12;
  const geo = useMemo(() => {
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const faces = [
      faceDaLona(V(-W / 2 - sobra, ALTURA_CUMEEIRA, 0), V(W / 2 + sobra, ALTURA_CUMEEIRA, 0), V(-W / 2 - sobra, ALTURA_BEIRAL, D / 2), V(W / 2 + sobra, ALTURA_BEIRAL, D / 2), ruga, 0.3, true),
      faceDaLona(V(W / 2 + sobra, ALTURA_CUMEEIRA, 0), V(-W / 2 - sobra, ALTURA_CUMEEIRA, 0), V(W / 2 + sobra, ALTURA_BEIRAL, -D / 2), V(-W / 2 - sobra, ALTURA_BEIRAL, -D / 2), ruga, 1.7, true),
      faceDaLona(V(-W / 2, ALTURA_BEIRAL, D / 2), V(W / 2, ALTURA_BEIRAL, D / 2), V(-W / 2, 0, D / 2), V(W / 2, 0, D / 2), ruga * 0.8, 2.4, false),
      faceDaLona(V(W / 2, ALTURA_BEIRAL, -D / 2), V(-W / 2, ALTURA_BEIRAL, -D / 2), V(W / 2, 0, -D / 2), V(-W / 2, 0, -D / 2), ruga * 0.8, 0.9, false),
    ];
    return faces;
  }, [W, D, ruga]);
  useEffect(() => () => geo.forEach((g) => g.dispose()), [geo]);
  const oitao = useMemo(() => {
    // a parede da ponta (pentágono), com a porta aberta na da frente
    const s = new THREE.Shape();
    s.moveTo(-D / 2, 0);
    s.lineTo(D / 2, 0);
    s.lineTo(D / 2, ALTURA_BEIRAL);
    s.lineTo(0, ALTURA_CUMEEIRA);
    s.lineTo(-D / 2, ALTURA_BEIRAL);
    s.closePath();
    const comPorta = s.clone();
    const porta = new THREE.Path();
    porta.moveTo(-0.34, 0);
    porta.lineTo(0.34, 0);
    porta.lineTo(0.34, 1.05);
    porta.lineTo(0, 1.32);
    porta.lineTo(-0.34, 1.05);
    porta.closePath();
    comPorta.holes.push(porta);
    return { fundo: new THREE.ShapeGeometry(s), frente: new THREE.ShapeGeometry(comPorta) };
  }, [D]);
  useEffect(() => () => {
    oitao.fundo.dispose();
    oitao.frente.dispose();
  }, [oitao]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.86, metalness: 0 }), []);
  useDescartar(material);
  material.color.copy(TITULO).lerp(cor("#8d9095"), 0.25 * (1 - foco) * (1 - e.une));
  material.emissive.copy(LARANJA);
  material.emissiveIntensity = 0.22 * foco + 0.08 * e.une;
  return (
    <group scale={[1, Math.max(0.001, e.ergue), 1]} visible={e.ergue > 0.04}>
      {geo.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow receiveShadow />
      ))}
      <mesh geometry={oitao.frente} material={material} position={[W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      <mesh geometry={oitao.fundo} material={material} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      {/* mastros e cumeeira */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[(l * W) / 2, ALTURA_CUMEEIRA / 2, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, ALTURA_CUMEEIRA + 0.12, 12]} />
          <meshStandardMaterial color="#5b5e64" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, ALTURA_CUMEEIRA + 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, W + 0.3, 12]} />
        <meshStandardMaterial color="#5b5e64" roughness={0.6} />
      </mesh>
    </group>
  );
};

const Cordas: React.FC<{ e: Estado; foco: number; dy: number }> = ({ e, foco, dy }) => {
  const lista = cordasEEstacas(e);
  const folga = 0.5 * (1 - e.tensao) + 0.12 * (1 - e.finca) * e.tensao;
  const geos = useMemo(
    () =>
      lista.map(({ ancora, estaca }) => {
        // o plano das cordas sobe inteiro na vista explodida: âncora e ponta juntas
        const A = new THREE.Vector3(ancora[0], ancora[1] * Math.max(0.001, e.ergue), ancora[2]);
        const B = new THREE.Vector3(estaca[0], estaca[1], estaca[2]);
        const M = A.clone().lerp(B, 0.5);
        M.y -= folga * A.distanceTo(B) * 0.35;
        return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 24, 0.022, 6, false);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [e.largura, e.ergue, e.finca, folga]
  );
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7 }), []);
  useDescartar(material);
  material.color.copy(TITULO).lerp(LARANJA, Math.max(foco, e.une * 0.6));
  material.emissive.copy(LARANJA);
  material.emissiveIntensity = 0.5 * foco + 0.15 * e.une;
  // Na vista explodida, o plano das cordas leva o contorno da tenda (beiral e cumeeira) em
  // traço fino: as cordas continuam presas a alguma coisa e o plano se lê como camada.
  const W = e.largura;
  const D = PROFUNDIDADE;
  const contorno = useMemo(() => {
    const y1 = ALTURA_BEIRAL * Math.max(0.001, e.ergue);
    const y2 = ALTURA_CUMEEIRA * Math.max(0.001, e.ergue);
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const trechos = [
      [P(-W / 2, y1, D / 2), P(W / 2, y1, D / 2)],
      [P(-W / 2, y1, -D / 2), P(W / 2, y1, -D / 2)],
      [P(-W / 2, y2, 0), P(W / 2, y2, 0)],
      [P(-W / 2, y1, D / 2), P(-W / 2, y2, 0)],
      [P(-W / 2, y2, 0), P(-W / 2, y1, -D / 2)],
      [P(W / 2, y1, D / 2), P(W / 2, y2, 0)],
      [P(W / 2, y2, 0), P(W / 2, y1, -D / 2)],
    ];
    return trechos.map(([a, b]) => new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.012, 5, false));
  }, [W, D, e.ergue]);
  useEffect(() => () => contorno.forEach((g) => g.dispose()), [contorno]);
  const fantasma = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }), []);
  useDescartar(fantasma);
  fantasma.color.copy(TITULO);
  fantasma.opacity = 0.55 * e.abre;
  return (
    <group position={[0, dy, 0]} visible={e.ergue > 0.6}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow />
      ))}
      {e.abre > 0.02 ? contorno.map((g, i) => <mesh key={`c${i}`} geometry={g} material={fantasma} />) : null}
    </group>
  );
};

const Estacas: React.FC<{ e: Estado; foco: number }> = ({ e, foco }) => {
  const lista = cordasEEstacas(e);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55 }), []);
  useDescartar(material);
  material.color.copy(cor("#a7abb1")).lerp(LARANJA, Math.max(foco, e.une * 0.5));
  material.emissive.copy(LARANJA);
  material.emissiveIntensity = 0.45 * foco + 0.1 * e.une;
  return (
    <group visible={e.ergue > 0.4}>
      {lista.map(({ estaca, inclina }, i) => {
        const comprimento = 0.62;
        // a estaca inclina para fora da tenda e afunda no chão conforme é fincada
        const ang = 0.32;
        return (
          <group key={i} position={[estaca[0], estaca[1], estaca[2]]} rotation={[inclina[1] * ang, 0, -inclina[0] * ang]}>
            <mesh position={[0, -comprimento / 2, 0]} material={material} castShadow>
              <cylinderGeometry args={[0.07, 0.018, comprimento, 12]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} material={material} castShadow>
              <boxGeometry args={[0.2, 0.08, 0.2]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** O chão, a planta desenhada nele e a seta da largura ("aumenta a casa"). */
const Chao: React.FC<{ e: Estado }> = ({ e }) => {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const grade = useMemo(() => {
    const g = new THREE.GridHelper(24, 48, TITULO, TITULO);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.07;
    m.depthWrite = false;
    return g;
  }, []);
  const lados: [number, number, number, number][] = [
    [-W / 2 - 0.2, D / 2 + 0.2, W / 2 + 0.2, D / 2 + 0.2],
    [W / 2 + 0.2, D / 2 + 0.2, W / 2 + 0.2, -D / 2 - 0.2],
    [W / 2 + 0.2, -D / 2 - 0.2, -W / 2 - 0.2, -D / 2 - 0.2],
    [-W / 2 - 0.2, -D / 2 - 0.2, -W / 2 - 0.2, D / 2 + 0.2],
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color={MARCA.fundo} roughness={0.95} />
      </mesh>
      <primitive object={grade} position={[0, 0.002, 0]} />
      {/* a planta: o contorno da tenda se desenha lado a lado */}
      {lados.map(([x1, z1, x2, z2], i) => {
        const p = Math.min(1, Math.max(0, e.planta * 4 - i));
        if (p <= 0) return null;
        const xm = x1 + (x2 - x1) * p * 0.5;
        const zm = z1 + (z2 - z1) * p * 0.5;
        const comprimento = Math.hypot(x2 - x1, z2 - z1) * p;
        const ang = Math.atan2(z2 - z1, x2 - x1);
        return (
          <mesh key={i} position={[xm, 0.006, zm]} rotation={[-Math.PI / 2, 0, -ang]}>
            <planeGeometry args={[comprimento, 0.06]} />
            <meshBasicMaterial color={MARCA.destaque} />
          </mesh>
        );
      })}
      {/* a seta da largura, na frente da tenda */}
      {e.casa > 0.01 ? (
        <group position={[0, 0.01, D / 2 + 0.75]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W, 0.05]} />
            <meshBasicMaterial color={MARCA.destaque} transparent opacity={e.casa} />
          </mesh>
          {[-1, 1].map((l) => (
            <mesh key={l} position={[(l * W) / 2, 0.11, 0]} rotation={[0, 0, (-l * Math.PI) / 2]}>
              <coneGeometry args={[0.11, 0.26, 16]} />
              <meshBasicMaterial color={MARCA.destaque} transparent opacity={e.casa} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};

export const Maquete: React.FC<{ t: number; e: Estado }> = ({ t, e }) => {
  const el = elevacao(e);
  return (
    <>
      <Rig t={t} />
      <fog attach="fog" args={[MARCA.fundo, 13, 26]} />
      <hemisphereLight args={[MARCA.titulo, MARCA.fundoProfundo, 0.75]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[5, 10, 4]}
        intensity={2.1}
        color="#fff6ec"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 4, -5]} intensity={0.45} color={MARCA.titulo} />
      <pointLight position={[0, 1.2, 2.6]} intensity={6 * e.une} distance={9} color={MARCA.destaque} />
      <Chao e={e} />
      <Estacas e={e} foco={e.foco.estacas} />
      <group position={[0, el.cortina, 0]}>
        <Lona e={e} foco={e.foco.cortina} />
      </group>
      <Cordas e={e} foco={e.foco.cordas} dy={el.cordas} />
    </>
  );
};
