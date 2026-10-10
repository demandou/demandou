// Palco 3D em DUAS camadas (profundidade de campo barata e estável no render):
// - FUNDO: céu, chão, cidade, postes, praça (desfocado por CSS enquanto a câmera está no nível da rua);
// - FRENTE: torre, lote, pino, rota, destino e a planta humanizada (nítidos). A frente recebe a cidade só
//   como profundidade (colorWrite off), então a torre continua escondida atrás dos prédios certos.
// No 16:9 as duas camadas cobrem a tela inteira (1920×1080) e a câmera põe a imagem do espaço do
// vertical no QUADRO da esquerda (geo.ts, applyCamTela); à direita a cidade continua atrás da moldura.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { lerp } from "../anim";
import { camEm, mapaK, MAP_TOWER_S, plantaAgora, type Roteiro } from "../roteiro";
import { City, CityDepth, Mapa3D } from "./Cidade3D";
import { applyCamTela, TELA_H, TELA_W } from "./geo";
import { col } from "./mat";
import { Planta3D } from "./Planta3D";
import { SombraDaTorre, Torre3D } from "./Torre3D";

const skyMaterial = (env: boolean) =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: col(env ? "#0B1426" : "#040810") },
      mid: { value: col(env ? "#26395E" : "#18284A") },
      glow: { value: col(env ? "#D19A62" : "#9A7F78") },
      bot: { value: col(env ? "#06080C" : "#070A10") },
      gk: { value: env ? 1.15 : 0.42 },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 glow; uniform vec3 bot; uniform float gk; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = mix(mid, top, smoothstep(0.0, 0.55, y)); c += glow * gk * exp(-abs(y) * 10.0);
      c = mix(c, bot, smoothstep(0.0, 0.2, -y)); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  });

/** mapa de ambiente: céu do entardecer (cidade/torre) ou estúdio neutro (planta) */
const Env: React.FC<{ kind: "sky" | "room" }> = ({ kind }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    if (kind === "room") {
      scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.32;
    } else {
      const s = new THREE.Scene();
      s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), skyMaterial(true)));
      const soft = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.5, 1.4), side: THREE.DoubleSide }));
      soft.position.set(-26, 22, 20);
      soft.lookAt(0, 0, 0);
      s.add(soft);
      scene.environment = pm.fromScene(s, 0.035).texture;
      scene.environmentIntensity = 1;
    }
    pm.dispose();
  }, [gl, scene, kind]);
  return null;
};

const Rig: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    applyCamTela(camera as THREE.PerspectiveCamera, camEm(R, t));
  });
  return null;
};

const CityLights: React.FC = () => (
  <>
    <hemisphereLight args={["#3A4E78", "#0B0D12", 0.75]} />
    <directionalLight
      position={[-9, 16, 8]}
      intensity={1.45}
      color="#C9D7FF"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-18}
      shadow-camera-right={18}
      shadow-camera-top={18}
      shadow-camera-bottom={-18}
      shadow-camera-near={1}
      shadow-camera-far={70}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
    />
    <directionalLight position={[8, 5, -12]} intensity={0.95} color="#FFB98A" />
  </>
);
const PlanLights: React.FC = () => (
  <>
    <hemisphereLight args={["#EEF0F6", "#4A3F34", 0.62]} />
    <directionalLight
      position={[-3.2, 9, 4.2]}
      intensity={2.9}
      color="#FFEBD2"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-3.6}
      shadow-camera-right={3.6}
      shadow-camera-top={3.6}
      shadow-camera-bottom={-3.6}
      shadow-camera-near={1}
      shadow-camera-far={25}
      shadow-bias={-0.0003}
      shadow-normalBias={0.01}
      shadow-radius={4}
    />
    <directionalLight position={[5, 6, -4]} intensity={0.5} color="#BFD0FF" />
  </>
);

const Sky: React.FC = () => {
  const m = useMemo(() => skyMaterial(false), []);
  return (
    <mesh material={m}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  );
};
const Ground: React.FC<{ grid: number; color: string }> = ({ grid, color }) => {
  const g = useMemo(() => {
    const h = new THREE.GridHelper(80, 160, col("#C9D6F0"), col("#C9D6F0"));
    const m = h.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.depthWrite = false;
    return h;
  }, []);
  (g.material as THREE.LineBasicMaterial).opacity = grid;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={color} roughness={0.92} metalness={0.05} />
      </mesh>
      {grid > 0.001 ? <primitive object={g} position={[0, 0.003, 0]} /> : null}
    </group>
  );
};

export const Palco: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const mk = mapaK(R, t);
  const P = plantaAgora(R, t);
  const planOn = P !== null;
  const towerScale = lerp(1, MAP_TOWER_S, mk);
  const blur = planOn ? 0 : 2.6 * (1 - mk);
  const fog: [string, number, number] = planOn ? ["#0A111F", 30, 80] : ["#121C31", lerp(42, 70, mk), lerp(120, 170, mk)];
  const intro = 1;
  const rota = R.rotas.find((r) => t >= r.tiro.de && t < r.tiro.ate + 0.4) ?? null;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.05 ? `blur(${blur}px)` : undefined, opacity: intro }}>
        <ThreeCanvas width={TELA_W} height={TELA_H} shadows gl={{ antialias: true }} style={{ position: "absolute", left: 0, top: 0 }}>
          <Rig t={t} R={R} />
          <Env kind="sky" />
          <Sky />
          <fog attach="fog" args={fog} />
          <CityLights />
          {planOn ? (
            <Ground grid={0.06} color="#0A1120" />
          ) : (
            <>
              <Ground grid={0} color="#0B0F16" />
              <City mk={mk} />
              <SombraDaTorre t={t} T={R.torre} scaleY={towerScale} />
            </>
          )}
        </ThreeCanvas>
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: intro }}>
        <ThreeCanvas width={TELA_W} height={TELA_H} shadows gl={{ antialias: true, alpha: true }} style={{ position: "absolute", left: 0, top: 0 }}>
          <Rig t={t} R={R} />
          <Env kind={planOn ? "room" : "sky"} />
          <fog attach="fog" args={fog} />
          {planOn && P ? (
            <>
              <PlanLights />
              <Planta3D t={t} P={P} />
            </>
          ) : (
            <>
              <CityLights />
              <CityDepth mk={mk} />
              <Torre3D t={t} T={R.torre} scaleY={towerScale} />
              {rota ? <Mapa3D t={t} r={rota} mk={mk} towerTop={(R.torre.m ? R.torre.h : 0.62) * towerScale + 0.4 * towerScale} /> : null}
            </>
          )}
        </ThreeCanvas>
      </div>
    </>
  );
};
