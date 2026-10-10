// Os corpos do espaço em 3D (three.js, sem pós-processamento: atrasaria um quadro).
// Sol e estrelas com granulação procedural e o "apagar" em brasa; a Terra com as texturas da NASA
// (Blue Marble e Black Marble, domínio público); Lua, planetas rochosos e gasosos, galáxia, buraco
// negro, átomo, célula e moeda, todos procedurais. Cada corpo recebe o estado do momento:
// `vis` (entra), `off` (apaga: 0 aceso → 1 apagado), `flash` (clarão) e a direção da luz.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { random, staticFile } from "remotion";
import { SNOISE } from "./glsl";
import { SORA } from "../tema";
import type { Corpo } from "../plano";

export type EstadoDoCorpo = {
  vis: number;
  off: number;
  flash: number;
  // escala extra (explosão)
  inchar?: number;
  // quanto do lado de dia da Terra (ou do destino) está aceso
  dia?: number;
  // o Sol "respira" quando a pessoa o segura
  boost?: number;
};

export type CorpoNaCena = {
  id: string;
  corpo: Corpo;
  pos: THREE.Vector3;
  r: number;
  cor?: string;
  simbolo?: string;
  anel?: boolean;
  // estrela pequena: só o ponto de luz (sem esfera)
  ponto?: boolean;
  // de onde vem a luz (posição no mundo); sem ela, do alto à esquerda, um pouco de frente
  luz?: THREE.Vector3;
  giro?: number;
  inclina?: [number, number, number];
  // deslocamento no tempo (corpo em órbita); somado a `pos`
  mover?: (t: number) => THREE.Vector3;
  estado: (t: number) => EstadoDoCorpo;
};

export const posicaoEm = (c: CorpoNaCena, t: number) => (c.mover ? c.pos.clone().add(c.mover(t)) : c.pos);

export const LUMINOSOS = new Set<Corpo>(["sol", "estrela"]);

const vetLuz = (c: CorpoNaCena) =>
  c.luz ? c.luz.clone().sub(c.pos).normalize().add(new THREE.Vector3(0, 0, 0.8)).normalize() : new THREE.Vector3(-0.55, 0.5, 0.67).normalize();

const VERT = /* glsl */ `varying vec3 vN; varying vec3 vP; varying vec3 vV; varying vec2 vUv;
  void main(){ vUv=uv; vP=position; vec4 wp=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`;

const corV = (hex: string | undefined, padrao: string) => new THREE.Color(hex ?? padrao);

// ——— textura do ponto de luz (estrelas, elétrons) ———
let PONTO: THREE.Texture | null = null;
export const texturaPonto = () => {
  if (PONTO) return PONTO;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const m = 128;
  const r = g.createRadialGradient(m, m, 0, m, m, m * 0.5);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.12, "rgba(255,255,255,0.9)");
  r.addColorStop(0.35, "rgba(255,255,255,0.22)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
  ]) {
    const lg = g.createLinearGradient(m - dx * m, m - dy * m, m + dx * m, m + dy * m);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(0.5, "rgba(255,255,255,0.75)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg;
    if (dx) g.fillRect(0, m - 1.2, 256, 2.4);
    else g.fillRect(m - 1.2, 0, 2.4, 256);
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return (PONTO = tx);
};

// ——— Sol / estrela ———
const PALETAS: Record<string, [number[], number[], number[], number[]]> = {
  sol: [
    [0.55, 0.17, 0.08],
    [0.851, 0.467, 0.341],
    [0.97, 0.64, 0.47],
    [1.0, 0.93, 0.84],
  ],
  estrela: [
    [0.22, 0.3, 0.55],
    [0.62, 0.74, 1.0],
    [0.86, 0.91, 1.0],
    [1.0, 1.0, 1.0],
  ],
};
const paletaDe = (corpo: Corpo, cor?: string) => {
  if (cor) {
    const c = new THREE.Color(cor);
    const b = new THREE.Color(1, 1, 1);
    return [c.clone().multiplyScalar(0.5), c, c.clone().lerp(b, 0.45), c.clone().lerp(b, 0.85)];
  }
  return (PALETAS[corpo] ?? PALETAS.sol).map((v) => new THREE.Color(v[0], v[1], v[2]));
};
const Estrela: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const mat = useMemo(() => {
    const [borda, aro, meio, nucleo] = paletaDe(c.corpo, c.cor);
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOff: { value: 0 },
        uBoost: { value: 1 },
        uA: { value: 1 },
        uFlash: { value: 0 },
        uEdge: { value: borda },
        uRim: { value: aro },
        uMid: { value: meio },
        uCore: { value: nucleo },
      },
      transparent: true,
      vertexShader: VERT,
      fragmentShader: `${SNOISE}
        uniform float uTime; uniform float uOff; uniform float uBoost; uniform float uA; uniform float uFlash;
        uniform vec3 uEdge; uniform vec3 uRim; uniform vec3 uMid; uniform vec3 uCore;
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){
          float mu=clamp(dot(normalize(vN),normalize(vV)),0.0,1.0);
          vec3 q=normalize(vP);
          float n=snoise(q*6.0+vec3(0.0,uTime*0.12,uTime*0.05))*0.35+snoise(q*18.0-vec3(uTime*0.25))*0.35+snoise(q*44.0+uTime*0.4)*0.3;
          float limb=pow(mu,0.5);
          vec3 col=mix(uEdge,uRim,smoothstep(0.0,0.38,limb));
          col=mix(col,uMid,smoothstep(0.35,0.75,limb));
          col=mix(col,uCore,smoothstep(0.78,1.0,limb)*0.85);
          col*=(0.95+0.07*n)*uBoost;
          col+=vec3(1.0,0.75,0.5)*pow(max(n,0.0),3.0)*0.12;
          // apagando: brasa vermelha -> quase preto, só um aro fraco
          float e1=smoothstep(0.0,0.45,uOff); float e2=smoothstep(0.35,1.0,uOff);
          vec3 ember=mix(vec3(0.42,0.08,0.03)*(0.8+0.3*n), vec3(0.018,0.012,0.012), e2);
          float rim=pow(1.0-mu,3.0);
          ember+=vec3(0.5,0.16,0.08)*rim*(1.0-e2)*0.6 + vec3(0.16,0.07,0.05)*rim*e2;
          col=mix(col,ember,e1);
          col=mix(col,vec3(1.0,0.97,0.92),uFlash);
          gl_FragColor=vec4(col,uA);
        }`,
    });
  }, [c.corpo, c.cor]);
  mat.uniforms.uTime.value = t;
  mat.uniforms.uOff.value = e.off;
  mat.uniforms.uBoost.value = e.boost ?? 1;
  mat.uniforms.uA.value = Math.min(1, e.vis * 1.5);
  mat.uniforms.uFlash.value = e.flash;
  const s = (0.85 + 0.15 * e.vis) * (e.inchar ?? 1);
  return (
    <mesh material={mat} position={c.pos} scale={s}>
      <sphereGeometry args={[c.r, 96, 64]} />
    </mesh>
  );
};

const PontoDeLuz: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const tw = 0.9 + 0.1 * Math.sin(t * 9.0 + c.pos.x);
  const s = c.r * 6 * tw * (1 - 0.85 * e.off) * (1 + e.flash);
  const cor = c.cor ?? (c.corpo === "sol" ? "#FFD2B0" : "#DCE8FF");
  return (
    <sprite position={c.pos} scale={[s, s, 1]}>
      <spriteMaterial map={texturaPonto()} color={new THREE.Color(cor)} transparent opacity={e.vis} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
};

// ——— Terra ———
const Terra: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const [dia, noite] = useLoader(THREE.TextureLoader, [staticFile("orbita/terra-dia.jpg"), staticFile("orbita/terra-noite.jpg")]);
  const mat = useMemo(() => {
    for (const x of [dia, noite]) {
      x.colorSpace = THREE.NoColorSpace;
      x.anisotropy = 8;
    }
    return new THREE.ShaderMaterial({
      uniforms: { uDay: { value: dia }, uNight: { value: noite }, uL: { value: new THREE.Vector3() }, uDayAmt: { value: 1 }, uFlash: { value: 0 }, uA: { value: 1 } },
      transparent: true,
      vertexShader: VERT,
      fragmentShader: `uniform sampler2D uDay; uniform sampler2D uNight; uniform vec3 uL; uniform float uDayAmt; uniform float uFlash; uniform float uA;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          vec3 N=normalize(vN); float d=dot(N,normalize(uL));
          float lit=smoothstep(-0.08,0.42,d)*uDayAmt;
          vec3 day=texture2D(uDay,vUv).rgb; day=pow(day,vec3(1.08))*1.08;
          vec3 night=texture2D(uNight,vUv).rgb;
          float nl=max(0.0,1.0-smoothstep(-0.2,0.15,d)*uDayAmt);
          vec3 col=day*(0.03+1.05*lit)+day*vec3(0.25,0.4,0.7)*0.05*(1.0-uDayAmt);
          col+=night*night*vec3(1.0,0.74,0.45)*nl*(1.6+1.6*(1.0-uDayAmt));
          float mu=max(dot(N,normalize(vV)),0.0);
          float fres=pow(1.0-mu,2.6);
          col+=vec3(0.38,0.62,1.0)*fres*((0.08+0.9*smoothstep(-0.15,0.5,d))*uDayAmt*1.1+0.12*(1.0-uDayAmt));
          col+=vec3(1.0,0.85,0.7)*fres*uFlash*0.9;
          gl_FragColor=vec4(col,uA);
        }`,
    });
  }, [dia, noite]);
  mat.uniforms.uL.value.copy(vetLuz(c));
  mat.uniforms.uDayAmt.value = e.dia ?? 1;
  mat.uniforms.uFlash.value = e.flash;
  mat.uniforms.uA.value = Math.min(1, e.vis * 1.5);
  return (
    <group position={c.pos} rotation={c.inclina ?? [-0.32, 0, 0.36]} scale={0.85 + 0.15 * e.vis}>
      <mesh material={mat} rotation={[0, -0.78 + (c.giro ?? 0.035) * t, 0]}>
        <sphereGeometry args={[c.r, 128, 96]} />
      </mesh>
    </group>
  );
};

// ——— Lua e planetas rochosos ———
const Rochoso: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 }, uL: { value: new THREE.Vector3() }, uC: { value: corV(c.cor, "#F2EEE8") }, uOff: { value: 0 }, uSeed: { value: random(c.id) * 10 } },
        transparent: true,
        vertexShader: VERT,
        fragmentShader: `${SNOISE} uniform float uA; uniform vec3 uL; uniform vec3 uC; uniform float uOff; uniform float uSeed; varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main(){ vec3 q=normalize(vP); float m=smoothstep(-0.15,0.55,fbm(q*1.5+3.1+uSeed)); float cr=fbm(q*9.0+uSeed)*0.5+0.5;
            float alb=mix(0.80,0.52,m)*(0.86+0.22*cr);
            float d=max(dot(normalize(vN),normalize(uL)),0.0);
            vec3 col=vec3(alb)*uC*(0.03+1.05*pow(d,0.8));
            float mu=max(dot(normalize(vN),normalize(vV)),0.0);
            col+=uC*0.08*pow(1.0-mu,3.0);
            col*=(1.0-0.88*uOff);
            gl_FragColor=vec4(col,uA); }`,
      }),
    [c.cor, c.id],
  );
  mat.uniforms.uA.value = Math.min(1, e.vis * 1.5);
  mat.uniforms.uL.value.copy(vetLuz(c));
  mat.uniforms.uOff.value = e.off;
  return (
    <mesh material={mat} position={c.pos} rotation={[0.2, (c.giro ?? 0.05) * t, 0]} scale={(0.85 + 0.15 * e.vis) * (e.inchar ?? 1)}>
      <sphereGeometry args={[c.r, 64, 48]} />
    </mesh>
  );
};

// ——— gigante gasoso (faixas) e anéis ———
const Gasoso: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 }, uL: { value: new THREE.Vector3() }, uC: { value: corV(c.cor, "#D9A77E") }, uOff: { value: 0 }, uTime: { value: 0 }, uSeed: { value: random(c.id) * 10 } },
        transparent: true,
        vertexShader: VERT,
        fragmentShader: `${SNOISE} uniform float uA; uniform vec3 uL; uniform vec3 uC; uniform float uOff; uniform float uTime; uniform float uSeed;
          varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main(){
            vec3 q=normalize(vP);
            float turb=fbm(vec3(q.x*2.0+uTime*0.03,q.y*7.0,q.z*2.0)+uSeed);
            float b1=sin(q.y*19.0+turb*2.4)*0.5+0.5;
            float b2=sin(q.y*7.0+turb*1.5+1.3)*0.5+0.5;
            vec3 c1=uC*0.52; vec3 c2=mix(uC,vec3(1.0,0.96,0.9),0.38); vec3 c3=uC*0.82;
            vec3 col=mix(c1,c2,b1); col=mix(col,c3,b2*0.4);
            float d=dot(normalize(vN),normalize(uL));
            col*=0.03+1.05*smoothstep(-0.15,0.55,d);
            float mu=max(dot(normalize(vN),normalize(vV)),0.0);
            col+=uC*0.55*pow(1.0-mu,2.6)*smoothstep(-0.25,0.6,d);
            col*=(1.0-0.88*uOff);
            gl_FragColor=vec4(col,uA);
          }`,
      }),
    [c.cor, c.id],
  );
  const anel = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 }, uC: { value: corV(c.cor, "#D9A77E") }, uR0: { value: c.r * 1.35 }, uR1: { value: c.r * 2.3 } },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        vertexShader: `varying float vR; void main(){ vR=length(position.xy); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `uniform float uA; uniform vec3 uC; uniform float uR0; uniform float uR1; varying float vR;
          void main(){ float u=(vR-uR0)/(uR1-uR0); float b=0.55+0.45*sin(u*46.0)*sin(u*13.0+1.0); float gap=smoothstep(0.58,0.6,u)*(1.0-smoothstep(0.64,0.66,u));
            float a=(0.75*b)*(1.0-gap*0.85)*smoothstep(0.0,0.05,u)*(1.0-smoothstep(0.95,1.0,u));
            gl_FragColor=vec4(mix(uC,vec3(1.0,0.97,0.92),0.4)*0.9,a*uA); }`,
      }),
    [c.cor, c.r],
  );
  mat.uniforms.uA.value = Math.min(1, e.vis * 1.5);
  mat.uniforms.uL.value.copy(vetLuz(c));
  mat.uniforms.uOff.value = e.off;
  mat.uniforms.uTime.value = t;
  anel.uniforms.uA.value = Math.min(1, e.vis * 1.5) * (1 - 0.8 * e.off);
  const s = (0.85 + 0.15 * e.vis) * (e.inchar ?? 1);
  return (
    <group position={c.pos} scale={s} rotation={c.inclina ?? [0.18, 0, -0.32]}>
      <mesh material={mat} rotation={[0, (c.giro ?? 0.08) * t, 0]}>
        <sphereGeometry args={[c.r, 96, 64]} />
      </mesh>
      {c.anel ? (
        <mesh material={anel} rotation={[-Math.PI / 2 + 0.32, 0, 0]}>
          <ringGeometry args={[c.r * 1.35, c.r * 2.3, 160, 1]} />
        </mesh>
      ) : null}
    </group>
  );
};

// ——— galáxia espiral ———
const Galaxia: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const geo = useMemo(() => {
    const N = 6000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const siz = new Float32Array(N);
    const quente = new THREE.Color(c.cor ?? "#F0A27F");
    const fria = new THREE.Color("#BFD6FF");
    for (let i = 0; i < N; i++) {
      const braco = i % 2;
      const u = Math.pow(random(`g${c.id}${i}`), 1.6);
      const r = u * c.r;
      const a = braco * Math.PI + u * 5.2 + (random(`ga${c.id}${i}`) - 0.5) * (0.9 - 0.5 * u);
      const h = (random(`gh${c.id}${i}`) - 0.5) * 0.12 * c.r * (1 - u);
      pos.set([Math.cos(a) * r, h, Math.sin(a) * r], i * 3);
      const k = quente.clone().lerp(fria, Math.min(1, u * 1.4));
      const b = 0.5 + 0.6 * (1 - u) + 0.3 * random(`gb${c.id}${i}`);
      col.set([k.r * b, k.g * b, k.b * b], i * 3);
      siz[i] = 1.6 + 2.6 * Math.pow(random(`gs${c.id}${i}`), 3) + 3 * (1 - u) * (1 - u);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(siz, 1));
    return g;
  }, [c.id, c.r, c.cor]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 } },
        vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=size; }`,
        fragmentShader: `varying vec3 vC; uniform float uA; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d)*2.0; float a=pow(smoothstep(1.0,0.0,r),1.6); gl_FragColor=vec4(vC, a*uA); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  mat.uniforms.uA.value = e.vis * (1 - 0.85 * e.off);
  return (
    <group position={c.pos} rotation={c.inclina ?? [0.95, 0, 0.35]} scale={(0.8 + 0.2 * e.vis) * (e.inchar ?? 1)}>
      <points geometry={geo} material={mat} rotation={[0, -(c.giro ?? 0.12) * t, 0]} />
    </group>
  );
};

// ——— buraco negro ———
const BuracoNegro: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const disco = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uA: { value: 1 }, uTime: { value: 0 }, uR0: { value: c.r * 1.45 }, uR1: { value: c.r * 3.6 } },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
        fragmentShader: `${SNOISE} uniform float uA; uniform float uTime; uniform float uR0; uniform float uR1; varying vec2 vP;
          void main(){ float r=length(vP); float u=(r-uR0)/(uR1-uR0); float ang=atan(vP.y,vP.x);
            float sw=fbm(vec3(cos(ang)*2.0,sin(ang)*2.0,u*4.0-uTime*0.6))*0.5+0.5;
            vec3 hot=mix(vec3(1.0,0.95,0.88),vec3(0.85,0.47,0.34),smoothstep(0.0,0.6,u));
            float a=(1.0-smoothstep(0.0,1.0,u))*smoothstep(0.0,0.04,u)*(0.55+0.6*sw);
            gl_FragColor=vec4(hot*a*1.4,a*uA); }`,
      }),
    [c.r],
  );
  disco.uniforms.uA.value = e.vis;
  disco.uniforms.uTime.value = t;
  const s = (0.85 + 0.15 * e.vis) * (e.inchar ?? 1);
  return (
    <group position={c.pos} scale={s} rotation={c.inclina ?? [0.25, 0, -0.18]}>
      <mesh rotation={[-Math.PI / 2 + 0.22, 0, 0]} material={disco}>
        <ringGeometry args={[c.r * 1.45, c.r * 3.6, 160, 1]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[c.r, 64, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={e.vis} />
      </mesh>
    </group>
  );
};

// ——— átomo ———
const Atomo: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const nucleo = useMemo(() => {
    const ps: { p: THREE.Vector3; q: boolean }[] = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const y = 1 - (2 * (i + 0.5)) / n;
      const rr = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      ps.push({ p: new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr).multiplyScalar(c.r * 0.3), q: i % 2 === 0 });
    }
    return ps;
  }, [c.r]);
  const matN = useMemo(
    () =>
      [corV(c.cor, "#D97757"), new THREE.Color("#EDE6DF")].map(
        (cc) =>
          new THREE.ShaderMaterial({
            uniforms: { uC: { value: cc }, uL: { value: new THREE.Vector3(-0.55, 0.5, 0.67).normalize() }, uA: { value: 1 } },
            transparent: true,
            vertexShader: VERT,
            fragmentShader: `uniform vec3 uC; uniform vec3 uL; uniform float uA; varying vec3 vN; varying vec3 vV;
              void main(){ float d=max(dot(normalize(vN),uL),0.0); float mu=max(dot(normalize(vN),normalize(vV)),0.0);
                vec3 col=uC*(0.18+0.9*d)+vec3(1.0)*pow(max(dot(reflect(-uL,normalize(vN)),normalize(vV)),0.0),24.0)*0.5+uC*0.3*pow(1.0-mu,2.0);
                gl_FragColor=vec4(col,uA); }`,
          }),
      ),
    [c.cor],
  );
  for (const m of matN) m.uniforms.uA.value = Math.min(1, e.vis * 1.5) * (1 - 0.7 * e.off);
  const orbitas = [
    [0.0, 0.0, 0.0],
    [Math.PI / 3, 0.0, 0.6],
    [-Math.PI / 3, 0.0, -0.6],
  ] as [number, number, number][];
  const R = c.r * 1.9;
  const elipse = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.36, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [R]);
  const s = (0.8 + 0.2 * e.vis) * (e.inchar ?? 1);
  return (
    <group position={c.pos} scale={s} rotation={[0, (c.giro ?? 0.25) * t, 0.15]}>
      {nucleo.map((n, i) => (
        <mesh key={i} position={n.p} material={matN[n.q ? 0 : 1]}>
          <sphereGeometry args={[c.r * 0.22, 32, 24]} />
        </mesh>
      ))}
      {orbitas.map((o, i) => {
        const a = t * (2.2 + i * 0.45) + i * 2.1;
        const el = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.36, 0);
        return (
          <group key={i} rotation={o}>
            <lineLoop geometry={elipse}>
              <lineBasicMaterial color="#FFF8F2" transparent opacity={0.38 * e.vis * (1 - 0.6 * e.off)} />
            </lineLoop>
            <sprite position={el} scale={[c.r * 0.9, c.r * 0.9, 1]}>
              <spriteMaterial map={texturaPonto()} color={new THREE.Color("#DCE8FF")} transparent opacity={e.vis * (1 - 0.8 * e.off)} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        );
      })}
    </group>
  );
};

// ——— célula ———
const Celula: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const mem = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uC: { value: corV(c.cor, "#8FD8D2") }, uA: { value: 1 }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        vertexShader: VERT,
        fragmentShader: `${SNOISE} uniform vec3 uC; uniform float uA; uniform float uTime; varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main(){ float mu=max(dot(normalize(vN),normalize(vV)),0.0); float fres=pow(1.0-mu,2.2);
            float n=fbm(normalize(vP)*3.0+uTime*0.08)*0.5+0.5;
            vec3 col=uC*(0.25+0.9*fres)+vec3(1.0)*pow(fres,5.0)*0.35;
            float a=(0.16+0.75*fres)*(0.8+0.4*n);
            gl_FragColor=vec4(col,a*uA); }`,
      }),
    [c.cor],
  );
  const nuc = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uC: { value: corV(c.cor, "#8FD8D2").multiplyScalar(0.55) }, uA: { value: 1 } },
        transparent: true,
        vertexShader: VERT,
        fragmentShader: `${SNOISE} uniform vec3 uC; uniform float uA; varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main(){ float mu=max(dot(normalize(vN),normalize(vV)),0.0); float n=fbm(normalize(vP)*5.0)*0.5+0.5;
            vec3 col=uC*(0.55+0.6*n)+uC*1.2*pow(1.0-mu,2.0); gl_FragColor=vec4(col,uA*0.9); }`,
      }),
    [c.cor],
  );
  const org = useMemo(() => {
    const N = 60;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = random(`co${c.id}${i}`) * 2 - 1;
      const th = random(`ct${c.id}${i}`) * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u);
      const d = c.r * (0.45 + 0.4 * random(`cd${c.id}${i}`));
      pos.set([rr * Math.cos(th) * d, u * d, rr * Math.sin(th) * d], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [c.id, c.r]);
  mem.uniforms.uA.value = e.vis * (1 - 0.6 * e.off);
  mem.uniforms.uTime.value = t;
  nuc.uniforms.uA.value = e.vis * (1 - 0.6 * e.off);
  const s = (0.85 + 0.15 * e.vis) * (e.inchar ?? 1) * (1 + 0.012 * Math.sin(t * 2.1));
  return (
    <group position={c.pos} scale={s} rotation={[0.2, (c.giro ?? 0.06) * t, 0]}>
      <mesh material={nuc} position={[c.r * 0.12, c.r * 0.05, 0]}>
        <sphereGeometry args={[c.r * 0.36, 48, 32]} />
      </mesh>
      <points geometry={org}>
        <pointsMaterial size={5} sizeAttenuation={false} color={new THREE.Color(c.cor ?? "#8FD8D2").lerp(new THREE.Color("#ffffff"), 0.5)} transparent opacity={0.7 * e.vis} depthWrite={false} />
      </points>
      <mesh material={mem}>
        <sphereGeometry args={[c.r, 64, 48]} />
      </mesh>
    </group>
  );
};

// ——— moeda (modo ilustrativo) ———
const Moeda: React.FC<{ c: CorpoNaCena; t: number; e: EstadoDoCorpo }> = ({ c, t, e }) => {
  const face = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 512;
    const g = cv.getContext("2d")!;
    const base = new THREE.Color(c.cor ?? "#D97757");
    const hex = (k: number) => `#${base.clone().multiplyScalar(k).getHexString()}`;
    const rg = g.createRadialGradient(200, 190, 20, 256, 256, 260);
    rg.addColorStop(0, hex(1.25));
    rg.addColorStop(0.55, hex(1.0));
    rg.addColorStop(1, hex(0.6));
    g.fillStyle = rg;
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = hex(0.55);
    g.lineWidth = 14;
    g.beginPath();
    g.arc(256, 256, 206, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = hex(1.35);
    g.lineWidth = 4;
    g.beginPath();
    g.arc(256, 256, 190, 0, Math.PI * 2);
    g.stroke();
    const s = (c.simbolo ?? "$").slice(0, 3);
    g.fillStyle = hex(0.5);
    g.font = `800 ${s.length > 1 ? 150 : 230}px "${SORA}"`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(s, 262, 270);
    g.fillStyle = hex(1.4);
    g.fillText(s, 256, 262);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, [c.cor, c.simbolo]);
  const mats = useMemo(() => {
    const borda = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.cor ?? "#D97757").multiplyScalar(0.55), transparent: true });
    const frente = new THREE.MeshBasicMaterial({ map: face, transparent: true });
    return [borda, frente, frente];
  }, [face, c.cor]);
  for (const m of mats) m.opacity = Math.min(1, e.vis * 1.5) * (1 - 0.75 * e.off);
  const s = (0.8 + 0.2 * e.vis) * (e.inchar ?? 1);
  return (
    <group position={c.pos} scale={s} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
      <mesh material={mats} rotation={[0, 0, 0.35 * Math.sin(t * (c.giro ?? 0.9))]}>
        <cylinderGeometry args={[c.r, c.r, c.r * 0.16, 96]} />
      </mesh>
    </group>
  );
};

export const CorpoEm3D: React.FC<{ c: CorpoNaCena; t: number }> = ({ c: c0, t }) => {
  const e = c0.estado(t);
  if (e.vis <= 0.001) return null;
  const c = c0.mover ? { ...c0, pos: posicaoEm(c0, t) } : c0;
  switch (c.corpo) {
    case "sol":
    case "estrela":
      return c.ponto ? <PontoDeLuz c={c} t={t} e={e} /> : <Estrela c={c} t={t} e={e} />;
    case "terra":
      return <Terra c={c} t={t} e={e} />;
    case "lua":
    case "rochoso":
      return <Rochoso c={c} t={t} e={e} />;
    case "planeta":
      return <Gasoso c={c} t={t} e={e} />;
    case "galaxia":
      return <Galaxia c={c} t={t} e={e} />;
    case "buraco-negro":
      return <BuracoNegro c={c} t={t} e={e} />;
    case "atomo":
      return <Atomo c={c} t={t} e={e} />;
    case "celula":
      return <Celula c={c} t={t} e={e} />;
    case "moeda":
      return <Moeda c={c} t={t} e={e} />;
    default:
      return null;
  }
};
