import React, { useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { LETRA } from "./letra";
import { comAlfa, misturar, MARCA } from "./marca";
import { mix, MEIO, useTempo } from "./tempo";

/**
 * O 3D DE VERDADE (aula 8.1 e remotion-best-practices/3d): Three.js com React
 * Three Fiber dentro do <ThreeCanvas> do @remotion/three, com largura e altura,
 * luz de verdade e TUDO movido pelo quadro da composição. useFrame() é
 * proibido (o portão do worker reprova); a câmera anda por pontos-chave com
 * curva suave e pausas, sem giro completo e sem atravessar a geometria; os
 * rótulos ficam presos aos objetos pela MESMA câmera, fora do canvas.
 *
 * O servidor não tem GPU: o GL é o SwiftShader ("swangle"). Geometria simples
 * e paramétrica (caixa, cilindro, cone, plano, forma extrudada, tubo) e no
 * máximo uma luz com sombra: cada quadro custa CPU.
 */

export type Vetor = [number, number, number];
/** Um ponto-chave da câmera: no instante `em` (s), na posição `pos`, olhando para `alvo`. */
export type ChaveDeCamera = { em: number; pos: Vetor; alvo: Vetor; fov?: number };

/** As cores do 3D: só as da marca (superfícies no tom do título, detalhes no destaque). */
export const COR_3D = {
  superficie: MARCA.titulo,
  superficieEscura: misturar(MARCA.titulo, MARCA.fundo, 0.45),
  destaque: MARCA.destaque,
  fundo: MARCA.fundo,
  metal: misturar(MARCA.titulo, MARCA.fundo, 0.6),
  linha: MARCA.titulo,
};

const catmull = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

/** A câmera no instante t: curva suave pelos pontos-chave, com assentamento perto de cada um (as "pausas curtas" da aula). */
export function cameraEm(t: number, chaves: ChaveDeCamera[]): { pos: Vetor; alvo: Vetor; fov: number } {
  if (!chaves.length) return { pos: [6, 5, 7], alvo: [0, 0.8, 0], fov: 40 };
  if (chaves.length === 1 || t <= chaves[0].em) return { pos: chaves[0].pos, alvo: chaves[0].alvo, fov: chaves[0].fov ?? 40 };
  let i = chaves.findIndex((c, j) => j < chaves.length - 1 && t >= c.em && t < chaves[j + 1].em);
  if (i < 0) {
    const u = chaves[chaves.length - 1];
    return { pos: u.pos, alvo: u.alvo, fov: u.fov ?? 40 };
  }
  const c1 = chaves[i];
  const c2 = chaves[i + 1];
  const c0 = chaves[Math.max(0, i - 1)];
  const c3 = chaves[Math.min(chaves.length - 1, i + 2)];
  const bruto = Math.min(1, Math.max(0, (t - c1.em) / Math.max(1e-3, c2.em - c1.em)));
  const u = mix(bruto, MEIO(bruto), 0.5);
  const pos = [0, 1, 2].map((j) => catmull(c0.pos[j], c1.pos[j], c2.pos[j], c3.pos[j], u)) as Vetor;
  const alvo = [0, 1, 2].map((j) => catmull(c0.alvo[j], c1.alvo[j], c2.alvo[j], c3.alvo[j], u)) as Vetor;
  return { pos, alvo, fov: mix(c1.fov ?? 40, c2.fov ?? 40, u) };
}

const camProj = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
/** Onde um ponto do 3D cai na tela (px dentro do canvas), pela mesma câmera do canvas. */
export function projetar(t: number, chaves: ChaveDeCamera[], ponto: Vetor, largura: number, altura: number): { x: number; y: number; atras: boolean } {
  const c = cameraEm(t, chaves);
  camProj.fov = c.fov;
  camProj.aspect = largura / altura;
  camProj.position.set(...c.pos);
  camProj.lookAt(new THREE.Vector3(...c.alvo));
  camProj.updateProjectionMatrix();
  camProj.updateMatrixWorld();
  const v = new THREE.Vector3(...ponto).project(camProj);
  return { x: ((v.x + 1) / 2) * largura, y: ((1 - v.y) / 2) * altura, atras: v.z > 1 };
}

/** Põe a câmera do canvas no ponto do quadro atual (sem useFrame: a cada render). */
const Rig: React.FC<{ chaves: ChaveDeCamera[] }> = ({ chaves }) => {
  const { camera } = useThree();
  const { t } = useTempo();
  useLayoutEffect(() => {
    const c = cameraEm(t, chaves);
    const p = camera as THREE.PerspectiveCamera;
    p.fov = c.fov;
    p.position.set(...c.pos);
    p.lookAt(new THREE.Vector3(...c.alvo));
    p.updateProjectionMatrix();
  });
  return null;
};

/** Descarta geometria e material criados com useMemo quando saem (o render longo não acumula memória). */
export function useDescartar<T extends { dispose: () => void }>(obj: T): T {
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

export type Rotulo3D = {
  texto: string;
  /** O ponto do objeto, no espaço do 3D. */
  ponto: Vetor;
  /** 0 a 1 (aparece e some com a fala). */
  visivel: number;
  /** 0 a 1: o rótulo da parte que está sendo explicada vai para o destaque. */
  ativo?: number;
  /** Onde a caixa do rótulo fica: na margem direita, na esquerda, ou acima do ponto. */
  lado?: "direita" | "esquerda" | "acima";
};

const RotulosPresos: React.FC<{ rotulos: Rotulo3D[]; chaves: ChaveDeCamera[]; largura: number; altura: number }> = ({ rotulos, chaves, largura, altura }) => {
  const { t } = useTempo();
  const tamanho = 28;
  const alto = 52;
  const medidos = rotulos
    .filter((r) => r.visivel > 0.01)
    .map((r) => {
      const p = projetar(t, chaves, r.ponto, largura, altura);
      const l = Math.round(r.texto.length * tamanho * 0.8 + 48);
      const lado = r.lado ?? "direita";
      const x = lado === "direita" ? largura - 36 - l : lado === "esquerda" ? 36 : p.x - l / 2;
      const y = lado === "acima" ? p.y - 96 : p.y - alto / 2;
      return { r, p, l, x, y, lado };
    })
    .sort((a, b) => a.y - b.y);
  // sem rótulo em cima de rótulo: empurra para baixo o que encostou, e mantém dentro do canvas
  for (let i = 1; i < medidos.length; i++) if (medidos[i].y < medidos[i - 1].y + alto + 12) medidos[i].y = medidos[i - 1].y + alto + 12;
  for (const m of medidos) m.y = Math.min(altura - alto - 16, Math.max(16, m.y));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {medidos.map(({ r, p, l, x, y, lado }, i) => {
        const cor = (r.ativo ?? 0) > 0.5 ? MARCA.destaque : MARCA.titulo;
        const pontaX = lado === "direita" ? x : lado === "esquerda" ? x + l : p.x;
        const pontaY = lado === "acima" ? y + alto : y + alto / 2;
        return (
          <React.Fragment key={i}>
            <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, opacity: r.visivel, overflow: "visible" }}>
              <line x1={pontaX} y1={pontaY} x2={p.x} y2={p.y} stroke={cor} strokeWidth={2.5} strokeOpacity={0.9} />
              <circle cx={p.x} cy={p.y} r={7} fill={cor} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: l,
                height: alto,
                lineHeight: `${alto}px`,
                textAlign: "center",
                borderRadius: 10,
                border: `2px solid ${cor}`,
                backgroundColor: comAlfa(MARCA.fundoProfundo, 0.86),
                color: cor,
                fontFamily: LETRA.texto,
                fontWeight: 800,
                fontSize: tamanho,
                letterSpacing: "0.1em",
                whiteSpace: "nowrap",
                opacity: r.visivel,
                scale: mix(0.9, 1, r.visivel) * mix(1, 1.06, r.ativo ?? 0),
              }}
            >
              {r.texto}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * Um canvas 3D numa área do quadro, com a câmera por pontos-chave e os rótulos
 * presos aos objetos. Os filhos são a cena do React Three Fiber (malhas, luzes).
 */
export const Cena3D: React.FC<{
  x?: number;
  y?: number;
  largura: number;
  altura: number;
  chaves: ChaveDeCamera[];
  rotulos?: Rotulo3D[];
  opacidade?: number;
  sombras?: boolean;
  children: React.ReactNode;
}> = ({ x = 0, y = 0, largura, altura, chaves, rotulos = [], opacidade = 1, sombras = true, children }) => {
  const inicio = cameraEm(0, chaves);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largura, height: altura, opacity: opacidade }}>
      <ThreeCanvas width={largura} height={altura} shadows={sombras} gl={{ antialias: true, alpha: true }} camera={{ fov: inicio.fov, near: 0.1, far: 200, position: inicio.pos }}>
        <Rig chaves={chaves} />
        {children}
      </ThreeCanvas>
      {rotulos.length ? <RotulosPresos rotulos={rotulos} chaves={chaves} largura={largura} altura={altura} /> : null}
    </div>
  );
};

/** A luz da cena nas cores da marca: céu no título, chão no fundo, uma luz com sombra e um realce no destaque. */
export const LuzesDaMarca: React.FC<{ destaque?: number; alvo?: Vetor }> = ({ destaque = 0, alvo = [0, 1.2, 2.6] }) => (
  <>
    <fog attach="fog" args={[MARCA.fundo, 13, 28]} />
    <hemisphereLight args={[MARCA.titulo, MARCA.fundoProfundo, 0.75]} />
    <ambientLight intensity={0.18} />
    <directionalLight
      position={[5, 10, 4]}
      intensity={2.1}
      color={misturar(MARCA.titulo, "#ffffff", 0.6)}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-near={1}
      shadow-camera-far={30}
      shadow-bias={-0.0005}
      shadow-normalBias={0.02}
    />
    <directionalLight position={[-6, 4, -5]} intensity={0.45} color={MARCA.titulo} />
    {destaque > 0.001 ? <pointLight position={alvo} intensity={6 * destaque} distance={9} color={MARCA.destaque} /> : null}
  </>
);

/** O chão: um disco no fundo da marca que recebe sombra, com uma grade bem fraca. */
export const ChaoDaMarca: React.FC<{ raio?: number; grade?: boolean }> = ({ raio = 14, grade = true }) => {
  const g = React.useMemo(() => {
    const h = new THREE.GridHelper(24, 48, MARCA.titulo, MARCA.titulo);
    const m = h.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.07;
    m.depthWrite = false;
    return h;
  }, []);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[raio, 64]} />
        <meshStandardMaterial color={MARCA.fundo} roughness={0.95} />
      </mesh>
      {grade ? <primitive object={g} position={[0, 0.002, 0]} /> : null}
    </group>
  );
};
