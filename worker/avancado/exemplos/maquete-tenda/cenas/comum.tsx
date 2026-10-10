import React, { useMemo } from "react";
import * as THREE from "three";
import { ChaoDaMarca, COR_3D, dito, ENTRADA, k, LuzesDaMarca, MEIO, mix, SAIDA, useDescartar, type ChaveDeCamera, type Vetor } from "../kit";

/**
 * A MAQUETE DA TENDA (aula 8.1), a mesma em todos os estados: o estado é uma
 * função do instante t, e cada instante vem de uma palavra dita. Planos da
 * vista explodida, de baixo para cima: chão e estacas, lona (com os mastros) e
 * cordas. A lona é uma malha paramétrica: com a corda frouxa ela enruga e cede;
 * "bem esticadinha" zera as rugas. Nada se move sozinho.
 */
export const PROFUNDIDADE = 2.6;
export const ALTURA_CUMEEIRA = 1.95;
export const ALTURA_BEIRAL = 0.6;
export const AFASTA_ESTACA = 1.25;

// os instantes da fala, uma vez só
const M = {
  prepara: dito("prepara"),
  receber: dito("receber"),
  nao: dito("não"),
  aumenta: dito("aumenta a casa"),
  estica: dito("estica a corda"),
  finca: dito("finca"),
  estaca: dito("estaca"),
  deixa: dito("deixa a cortina"),
  faca: dito("faça o essencial"),
  essencial: dito("essencial"),
};

export function estado(t: number) {
  const cordas = k(t, M.estica - 0.09, M.estica + 0.23) * (1 - k(t, M.finca - 0.11, M.finca + 0.19));
  const estacas = k(t, M.finca - 0.16, M.finca + 0.09) * (1 - k(t, M.deixa - 0.13, M.deixa + 0.17));
  const cortina = k(t, M.deixa - 0.06, M.deixa + 0.27) * (1 - k(t, M.faca - 0.02, M.faca + 0.38));
  return {
    planta: k(t, M.prepara + 0.03, M.prepara + 1.08, MEIO),
    ergue: k(t, M.receber + 0.14, M.receber + 1.44, MEIO),
    largura: mix(2.7, 4.3, k(t, M.aumenta - 0.04, M.estica - 0.02, MEIO)),
    casa: k(t, M.aumenta - 0.21, M.aumenta + 0.09) * (1 - k(t, M.estica - 0.02, M.estica + 0.33)),
    abre: k(t, M.estica - 0.12, M.estica + 0.58, MEIO) * (1 - k(t, M.faca + 0.03, M.faca + 1.08, MEIO)),
    tensao: k(t, M.estica + 0.18, M.estica + 0.88, SAIDA),
    finca: 0.55 * k(t, M.finca - 0.06, M.finca + 0.19, ENTRADA) + 0.45 * k(t, M.estaca - 0.1, M.estaca + 0.18, ENTRADA),
    estica: k(t, M.deixa + 0.12, M.deixa + 2.02, MEIO),
    foco: { cordas, estacas, cortina },
    une: k(t, M.essencial - 0.3, M.essencial + 0.8, MEIO),
    rotulos: k(t, M.estica + 0.23, M.estica + 0.73) * (1 - k(t, M.faca + 0.03, M.faca + 0.48)),
  };
}
export type Estado = ReturnType<typeof estado>;

/** Elevação de cada plano na vista explodida. */
export const elevacao = (e: Estado) => ({ chao: 0, cortina: 1.6 * e.abre, cordas: 3.5 * e.abre });

/** A câmera: de cima (a planta), revela a profundidade, recua para a vista explodida e volta (sem giro completo). */
export const CAMERA: ChaveDeCamera[] = [
  { em: 0, pos: [0.4, 10.6, 1.4], alvo: [0, 0, 0] },
  { em: M.receber + 0.09, pos: [0.8, 9.6, 2.6], alvo: [0, 0.2, 0] },
  { em: M.nao + 0.23, pos: [6.1, 4.3, 7.3], alvo: [0, 0.95, 0] },
  { em: M.aumenta, pos: [6.7, 3.9, 6.5], alvo: [0, 0.95, 0] },
  { em: M.estica - 0.07, pos: [7.6, 5.0, 8.4], alvo: [0, 1.5, 0] },
  { em: M.estica + 0.68, pos: [9.8, 7.2, 11.2], alvo: [0, 2.65, 0] },
  { em: M.finca + 0.04, pos: [9.4, 7.4, 10.8], alvo: [0, 2.85, 0] },
  { em: M.estaca + 0.12, pos: [9.2, 5.2, 10.8], alvo: [0, 2.1, 0] },
  { em: M.deixa + 0.22, pos: [8.8, 6.0, 10.4], alvo: [0, 2.6, 0] },
  { em: M.faca - 0.07, pos: [8.0, 5.8, 9.6], alvo: [0, 2.6, 0] },
  { em: M.essencial + 0.6, pos: [7.0, 4.4, 8.1], alvo: [0, 0.95, 0] },
  { em: M.essencial + 2.1, pos: [6.2, 3.8, 7.1], alvo: [0, 0.95, 0] },
];

/** Pontos das cordas: do beiral (e das pontas da cumeeira) até o topo de cada estaca. */
export function cordasEEstacas(e: Estado) {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const sobra = mix(0.42, 0.06, e.finca); // quanto da estaca fica fora do chão
  const lista: { ancora: Vetor; estaca: Vetor; inclina: [number, number] }[] = [];
  for (const lado of [-1, 1]) {
    for (const x of [-W / 2, 0, W / 2]) {
      lista.push({ ancora: [x, ALTURA_BEIRAL, (lado * D) / 2], estaca: [x * 1.08, sobra, lado * (D / 2 + AFASTA_ESTACA)], inclina: [0, lado] });
    }
    lista.push({ ancora: [(lado * W) / 2, ALTURA_CUMEEIRA, 0], estaca: [lado * (W / 2 + 1.5), sobra, 0], inclina: [lado, 0] });
  }
  return lista;
}

const cor = (hex: string) => new THREE.Color(hex);

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

const Lona: React.FC<{ e: Estado; foco: number }> = ({ e, foco }) => {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const ruga = 0.13 * (1 - e.estica) * mix(1, 0.75, e.tensao);
  const sobra = 0.12;
  const faces = useMemo(() => {
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const lista = [
      faceDaLona(V(-W / 2 - sobra, ALTURA_CUMEEIRA, 0), V(W / 2 + sobra, ALTURA_CUMEEIRA, 0), V(-W / 2 - sobra, ALTURA_BEIRAL, D / 2), V(W / 2 + sobra, ALTURA_BEIRAL, D / 2), ruga, 0.3, true),
      faceDaLona(V(W / 2 + sobra, ALTURA_CUMEEIRA, 0), V(-W / 2 - sobra, ALTURA_CUMEEIRA, 0), V(W / 2 + sobra, ALTURA_BEIRAL, -D / 2), V(-W / 2 - sobra, ALTURA_BEIRAL, -D / 2), ruga, 1.7, true),
      faceDaLona(V(-W / 2, ALTURA_BEIRAL, D / 2), V(W / 2, ALTURA_BEIRAL, D / 2), V(-W / 2, 0, D / 2), V(W / 2, 0, D / 2), ruga * 0.8, 2.4, false),
      faceDaLona(V(W / 2, ALTURA_BEIRAL, -D / 2), V(-W / 2, ALTURA_BEIRAL, -D / 2), V(W / 2, 0, -D / 2), V(-W / 2, 0, -D / 2), ruga * 0.8, 0.9, false),
    ];
    return { lista, dispose: () => lista.forEach((x) => x.dispose()) };
  }, [W, D, ruga]);
  useDescartar(faces);
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
    const fundo = new THREE.ShapeGeometry(s);
    const frente = new THREE.ShapeGeometry(comPorta);
    return { fundo, frente, dispose: () => (fundo.dispose(), frente.dispose()) };
  }, [D]);
  useDescartar(oitao);
  const material = useDescartar(useMemo(() => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.86, metalness: 0 }), []));
  material.color.copy(cor(COR_3D.superficie)).lerp(cor(COR_3D.superficieEscura), 0.25 * (1 - foco) * (1 - e.une));
  material.emissive.copy(cor(COR_3D.destaque));
  material.emissiveIntensity = 0.22 * foco + 0.08 * e.une;
  return (
    <group scale={[1, Math.max(0.001, e.ergue), 1]} visible={e.ergue > 0.04}>
      {faces.lista.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow receiveShadow />
      ))}
      <mesh geometry={oitao.frente} material={material} position={[W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      <mesh geometry={oitao.fundo} material={material} position={[-W / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />
      {/* mastros e cumeeira */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[(l * W) / 2, ALTURA_CUMEEIRA / 2, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, ALTURA_CUMEEIRA + 0.12, 12]} />
          <meshStandardMaterial color={COR_3D.metal} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, ALTURA_CUMEEIRA + 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, W + 0.3, 12]} />
        <meshStandardMaterial color={COR_3D.metal} roughness={0.6} />
      </mesh>
    </group>
  );
};

const Cordas: React.FC<{ e: Estado; foco: number; dy: number }> = ({ e, foco, dy }) => {
  const folga = 0.5 * (1 - e.tensao) + 0.12 * (1 - e.finca) * e.tensao;
  const W = e.largura;
  const D = PROFUNDIDADE;
  const tubos = useMemo(() => {
    const lista = cordasEEstacas(e).map(({ ancora, estaca }) => {
      // o plano das cordas sobe inteiro na vista explodida: âncora e ponta juntas
      const A = new THREE.Vector3(ancora[0], ancora[1] * Math.max(0.001, e.ergue), ancora[2]);
      const B = new THREE.Vector3(...estaca);
      const meio = A.clone().lerp(B, 0.5);
      meio.y -= folga * A.distanceTo(B) * 0.35;
      return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, meio, B), 24, 0.022, 6, false);
    });
    // na vista explodida, o plano das cordas leva o contorno da tenda em traço fino
    const y1 = ALTURA_BEIRAL * Math.max(0.001, e.ergue);
    const y2 = ALTURA_CUMEEIRA * Math.max(0.001, e.ergue);
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const contorno = [
      [P(-W / 2, y1, D / 2), P(W / 2, y1, D / 2)],
      [P(-W / 2, y1, -D / 2), P(W / 2, y1, -D / 2)],
      [P(-W / 2, y2, 0), P(W / 2, y2, 0)],
      [P(-W / 2, y1, D / 2), P(-W / 2, y2, 0)],
      [P(-W / 2, y2, 0), P(-W / 2, y1, -D / 2)],
      [P(W / 2, y1, D / 2), P(W / 2, y2, 0)],
      [P(W / 2, y2, 0), P(W / 2, y1, -D / 2)],
    ].map(([a, b]) => new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.012, 5, false));
    return { lista, contorno, dispose: () => [...lista, ...contorno].forEach((g) => g.dispose()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, D, e.ergue, e.finca, folga]);
  useDescartar(tubos);
  const material = useDescartar(useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.7 }), []));
  material.color.copy(cor(COR_3D.superficie)).lerp(cor(COR_3D.destaque), Math.max(foco, e.une * 0.6));
  material.emissive.copy(cor(COR_3D.destaque));
  material.emissiveIntensity = 0.5 * foco + 0.15 * e.une;
  const fantasma = useDescartar(useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }), []));
  fantasma.color.copy(cor(COR_3D.linha));
  fantasma.opacity = 0.55 * e.abre;
  return (
    <group position={[0, dy, 0]} visible={e.ergue > 0.6}>
      {tubos.lista.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow />
      ))}
      {e.abre > 0.02 ? tubos.contorno.map((g, i) => <mesh key={`c${i}`} geometry={g} material={fantasma} />) : null}
    </group>
  );
};

const Estacas: React.FC<{ e: Estado; foco: number }> = ({ e, foco }) => {
  const material = useDescartar(useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.55 }), []));
  material.color.copy(cor(COR_3D.superficieEscura)).lerp(cor(COR_3D.destaque), Math.max(foco, e.une * 0.5));
  material.emissive.copy(cor(COR_3D.destaque));
  material.emissiveIntensity = 0.45 * foco + 0.1 * e.une;
  const comprimento = 0.62;
  const ang = 0.32; // a estaca inclina para fora da tenda e afunda no chão conforme é fincada
  return (
    <group visible={e.ergue > 0.4}>
      {cordasEEstacas(e).map(({ estaca, inclina }, i) => (
        <group key={i} position={estaca} rotation={[inclina[1] * ang, 0, -inclina[0] * ang]}>
          <mesh position={[0, -comprimento / 2, 0]} material={material} castShadow>
            <cylinderGeometry args={[0.07, 0.018, comprimento, 12]} />
          </mesh>
          <mesh position={[0, 0.03, 0]} material={material} castShadow>
            <boxGeometry args={[0.2, 0.08, 0.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** A planta desenhada no chão, lado a lado, e a seta da largura ("aumenta a casa"). */
const Planta: React.FC<{ e: Estado }> = ({ e }) => {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const lados: [number, number, number, number][] = [
    [-W / 2 - 0.2, D / 2 + 0.2, W / 2 + 0.2, D / 2 + 0.2],
    [W / 2 + 0.2, D / 2 + 0.2, W / 2 + 0.2, -D / 2 - 0.2],
    [W / 2 + 0.2, -D / 2 - 0.2, -W / 2 - 0.2, -D / 2 - 0.2],
    [-W / 2 - 0.2, -D / 2 - 0.2, -W / 2 - 0.2, D / 2 + 0.2],
  ];
  return (
    <group>
      {lados.map(([x1, z1, x2, z2], i) => {
        const p = Math.min(1, Math.max(0, e.planta * 4 - i));
        if (p <= 0) return null;
        const comprimento = Math.hypot(x2 - x1, z2 - z1) * p;
        const ang = Math.atan2(z2 - z1, x2 - x1);
        return (
          <mesh key={i} position={[x1 + (x2 - x1) * p * 0.5, 0.006, z1 + (z2 - z1) * p * 0.5]} rotation={[-Math.PI / 2, 0, -ang]}>
            <planeGeometry args={[comprimento, 0.06]} />
            <meshBasicMaterial color={COR_3D.destaque} />
          </mesh>
        );
      })}
      {e.casa > 0.01 ? (
        <group position={[0, 0.01, D / 2 + 0.75]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[W, 0.05]} />
            <meshBasicMaterial color={COR_3D.destaque} transparent opacity={e.casa} />
          </mesh>
          {[-1, 1].map((l) => (
            <mesh key={l} position={[(l * W) / 2, 0.11, 0]} rotation={[0, 0, (-l * Math.PI) / 2]}>
              <coneGeometry args={[0.11, 0.26, 16]} />
              <meshBasicMaterial color={COR_3D.destaque} transparent opacity={e.casa} />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
};

/** A maquete inteira num estado: luzes, chão, planta, estacas, lona e cordas nos seus planos. */
export const Maquete: React.FC<{ e: Estado }> = ({ e }) => {
  const el = elevacao(e);
  return (
    <>
      <LuzesDaMarca destaque={e.une} alvo={[0, 1.2, 2.6]} />
      <ChaoDaMarca />
      <Planta e={e} />
      <Estacas e={e} foco={e.foco.estacas} />
      <group position={[0, el.cortina, 0]}>
        <Lona e={e} foco={e.foco.cortina} />
      </group>
      <Cordas e={e} foco={e.foco.cordas} dy={el.cordas} />
    </>
  );
};
