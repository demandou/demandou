// O espaço em 3D: as estrelas (com a faixa discreta da Via Láctea) e os corpos das estações que
// estão na tela. Um só canvas para o vídeo inteiro; ele só existe enquanto há espaço na tela.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { random } from "remotion";
import type { Plano } from "../plano";
import { CorpoEm3D, type CorpoNaCena } from "./Corpos";
import { GRUA_ANTES, aplicarPose, poseEm, type Janela } from "./camera";

const Camera: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { camera } = useThree();
  useLayoutEffect(() => aplicarPose(camera as THREE.PerspectiveCamera, poseEm(plano, t)));
  return null;
};

const Estrelas: React.FC<{ t: number; alfa: number }> = ({ t, alfa }) => {
  const geo = useMemo(() => {
    const N = 4200;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const siz = new Float32Array(N);
    const ph = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const faixa = i > 2200;
      let x: number, y: number, z: number;
      if (!faixa) {
        const u = random(`su${i}`) * 2 - 1;
        const th = random(`st${i}`) * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        x = r * Math.cos(th);
        y = u;
        z = r * Math.sin(th);
      } else {
        const th = random(`bt${i}`) * Math.PI * 2;
        const off = (random(`bo${i}`) + random(`bo2${i}`) + random(`bo3${i}`) - 1.5) * 0.16;
        x = Math.cos(th);
        y = off;
        z = Math.sin(th);
        const a = 0.95;
        const yy = y * Math.cos(a) - x * Math.sin(a);
        const xx = y * Math.sin(a) + x * Math.cos(a);
        x = xx;
        y = yy;
      }
      const R = 150;
      pos.set([x * R, y * R + 8, z * R - 20], i * 3);
      const k = random(`sk${i}`);
      const quente = random(`sw${i}`);
      const b = faixa ? 0.45 + 0.4 * k : 0.6 + 0.7 * Math.pow(k, 2.0);
      const c = quente < 0.18 ? [1, 0.82, 0.66] : quente > 0.86 ? [0.75, 0.85, 1] : [1, 0.97, 0.93];
      col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
      siz[i] = faixa ? 2.0 + 1.4 * k : 2.4 + 4.2 * Math.pow(k, 3);
      ph[i] = random(`sp${i}`) * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(siz, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 } },
        vertexShader: `attribute float size; attribute float phase; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uTime;
          void main(){ vC=color; vA=0.82+0.18*sin(uTime*2.2+phase*3.0); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=size; }`,
        fragmentShader: `varying vec3 vC; varying float vA; uniform float uAlpha;
          void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d)*2.0; float a=pow(smoothstep(1.0,0.0,r),1.6); a=max(a,smoothstep(0.42,0.0,r)); gl_FragColor=vec4(vC*vA*1.25, a*uAlpha); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  mat.uniforms.uTime.value = t;
  mat.uniforms.uAlpha.value = alfa;
  return <points geometry={geo} material={mat} />;
};

export const Espaco3D: React.FC<{ plano: Plano; janela: Janela; t: number; alfa: number; corpos: CorpoNaCena[][] }> = ({ plano, janela, t, alfa, corpos }) => (
  <ThreeCanvas width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} gl={{ alpha: true, antialias: true }} flat dpr={1} camera={{ fov: 30, position: [0, 0, 20] }}>
    <Camera plano={plano} t={t} />
    <Estrelas t={t} alfa={alfa} />
    {janela.estacoes.map((e, i) =>
      t >= e.de - GRUA_ANTES - 0.1 && t <= e.fim ? (
        <React.Fragment key={i}>
          {corpos[i].map((c) => (
            <CorpoEm3D key={c.id} c={c} t={t} />
          ))}
        </React.Fragment>
      ) : null,
    )}
  </ThreeCanvas>
);
