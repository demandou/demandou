import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { EASE_OUT, P, clamp01, prog, useTempo } from "../tema";
import {
  BASE_IN,
  PITCH,
  UNI,
  bocaAgora,
  copoAt,
  nivelAt,
  objetoAt,
  perfilDe,
  unidadeAt,
  vermelhoAt,
  type Cena,
} from "./cena";
import { useTexturas, type Texturas } from "./texturas";

/* Palco 3D do Medida: objeto SEM marca, recipiente de vidro, unidades com física, líquido, linha
   tracejada. Sem pós-processamento (atrasa 1 quadro no render): só material + luz + reflexo de
   ambiente procedural. */

/* ---------- ambiente procedural (estúdio claro com softboxes) ---------- */
export const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const es = new THREE.Scene();
    const sg = new THREE.SphereGeometry(30, 64, 32);
    const top = new THREE.Color("#fffaf2");
    const mid = new THREE.Color("#e7e0d1");
    const bot = new THREE.Color("#55574f");
    const cols: number[] = [];
    const pos = sg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 30;
      const c = y > 0 ? mid.clone().lerp(top, Math.pow(y, 0.6)) : mid.clone().lerp(bot, Math.pow(-y, 0.5));
      cols.push(c.r, c.g, c.b);
    }
    sg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const box = (w: number, h: number, p: [number, number, number], k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.99, 0.96).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...p);
      m.lookAt(0, 0, 0);
      es.add(m);
    };
    box(3.2, 24, [-13, 2, 9], 4.2);
    box(1.8, 24, [13, 1, 7], 3.0);
    box(14, 14, [0, 18, 2], 2.2);
    box(10, 4, [0, -1, 18], 0.7);
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(es, 0.015);
    scene.environment = rt.texture;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    return () => {
      rt.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
};

export const Luzes: React.FC = () => (
  <>
    <hemisphereLight args={["#fff8ee", "#8b8778", 0.55]} />
    <directionalLight position={[-5, 7, 9]} intensity={1.35} color="#fff6ea" />
    <directionalLight position={[6, 2, 4]} intensity={0.35} color="#eaf4ec" />
  </>
);

/* ---------- vidro: transparência por Fresnel (bordas mais densas, centro limpo, brilhos opacos) ---------- */
export const materialDeVidro = (fade: { value: number }, tinta = new THREE.Vector3(0.24, 0.29, 0.27)) => {
  const m = new THREE.MeshPhysicalMaterial({
    color: "#000000",
    metalness: 0,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.9,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFade = fade;
    sh.uniforms.uTint = { value: tinta };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uFade;\nuniform vec3 uTint;")
      .replace(
        "#include <opaque_fragment>",
        `
        vec3 vd = normalize(vViewPosition);
        float fr = pow(1.0 - abs(dot(normalize(normal), vd)), 2.0);
        float lum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
        vec3 col = mix(uTint, outgoingLight, smoothstep(0.04, 0.45, lum));
        float a = 0.018 + pow(fr, 1.4) * 0.6 + smoothstep(0.28, 0.9, lum) * 0.85;
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.94) * uFade);
        `,
      );
  };
  return m;
};

export const Sombra: React.FC<{ tex: THREE.Texture; w: number; d: number; o: number }> = ({ tex, w, d, o }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={[w, d, 1]} renderOrder={-1}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={tex} transparent opacity={o} depthWrite={false} color="#2b2a22" />
  </mesh>
);

const lathe = (pts: Array<[number, number]>, seg = 128) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

/* ---------- lata ---------- */
const Lata: React.FC<{ tex: Texturas; tab: number; hole: number }> = ({ tex, tab, hole }) => {
  const g = useMemo(() => {
    const bottom = lathe([
      [0.0, 0.062],
      [0.12, 0.057],
      [0.2, 0.036],
      [0.24, 0.009],
      [0.255, 0.0],
      [0.272, 0.004],
      [0.292, 0.022],
      [0.316, 0.062],
      [0.33, 0.1],
    ]);
    const top = lathe([
      [0.33, 1.02],
      [0.322, 1.05],
      [0.3, 1.09],
      [0.278, 1.125],
      [0.268, 1.15],
      [0.27, 1.17],
      [0.266, 1.182],
      [0.256, 1.185],
      [0.249, 1.177],
      [0.247, 1.161],
      [0.238, 1.153],
      [0.0, 1.153],
    ]);
    const body = new THREE.CylinderGeometry(0.33, 0.33, 0.92, 160, 1, true, -Math.PI, Math.PI * 2);
    body.translate(0, 0.56, 0);
    const sh = new THREE.Shape();
    const w = 0.052;
    sh.moveTo(-w, 0.07);
    sh.quadraticCurveTo(-w, 0.1, 0, 0.1);
    sh.quadraticCurveTo(w, 0.1, w, 0.07);
    sh.lineTo(w * 1.1, -0.12);
    sh.quadraticCurveTo(w * 1.1, -0.175, 0, -0.175);
    sh.quadraticCurveTo(-w * 1.1, -0.175, -w * 1.1, -0.12);
    sh.closePath();
    const furo = new THREE.Path();
    furo.absellipse(0, -0.115, 0.034, 0.038, 0, Math.PI * 2, false, 0);
    sh.holes.push(furo);
    const tabG = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 });
    tabG.rotateX(Math.PI / 2);
    tabG.translate(0, 0.012, 0);
    const holeG = new THREE.CircleGeometry(1, 40);
    holeG.rotateX(-Math.PI / 2);
    return { bottom, top, body, tabG, holeG };
  }, []);
  const m = useMemo(() => {
    const alu = new THREE.MeshStandardMaterial({ color: "#d9dbdb", metalness: 1, roughness: 0.24, envMapIntensity: 1.3, side: THREE.DoubleSide });
    const lid = new THREE.MeshStandardMaterial({ color: "#c4c7c7", metalness: 1, roughness: 0.3, envMapIntensity: 1.2, side: THREE.DoubleSide });
    const label = new THREE.MeshPhysicalMaterial({ map: tex.rotulo, roughnessMap: tex.rm, metalnessMap: tex.rm, roughness: 1, metalness: 1, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 1.25 });
    const dark = new THREE.MeshStandardMaterial({ color: "#121512", roughness: 0.6, metalness: 0.2 });
    return { alu, lid, label, dark };
  }, [tex]);
  return (
    <group>
      <mesh geometry={g.body} material={m.label} />
      <mesh geometry={g.bottom} material={m.alu} />
      <mesh geometry={g.top} material={m.lid} />
      <mesh geometry={g.holeG} material={m.dark} position={[0, 1.1545, 0.158]} scale={[0.078 * hole + 0.0001, 1, 0.06 * hole + 0.0001]} />
      <group position={[0, 1.158, 0.0]} rotation={[tab, 0, 0]}>
        <mesh geometry={g.tabG} material={m.alu} />
      </group>
      <mesh position={[0, 1.163, 0]} material={m.alu}>
        <cylinderGeometry args={[0.014, 0.016, 0.01, 20]} />
      </mesh>
    </group>
  );
};

/* ---------- garrafa (vidro com rótulo em faixa e tampa na cor do rótulo) ---------- */
const Garrafa: React.FC<{ tex: Texturas; cor: string; liquido?: string }> = ({ tex, cor, liquido }) => {
  const fade = useMemo(() => ({ value: 1 }), []);
  const g = useMemo(() => {
    const corpo = lathe([
      [0.0, 0.0],
      [0.26, 0.0],
      [0.295, 0.025],
      [0.3, 0.08],
      [0.3, 0.98],
      [0.285, 1.08],
      [0.22, 1.2],
      [0.14, 1.32],
      [0.115, 1.4],
      [0.115, 1.5],
      [0.125, 1.515],
      [0.125, 1.53],
      [0.0, 1.53],
    ]);
    const liquido = lathe([
      [0.0, 0.03],
      [0.27, 0.03],
      [0.282, 0.08],
      [0.282, 0.98],
      [0.268, 1.07],
      [0.0, 1.07],
    ]);
    const rotulo = new THREE.CylinderGeometry(0.304, 0.304, 0.5, 120, 1, true, -Math.PI, Math.PI * 2);
    rotulo.translate(0, 0.6, 0);
    const tampa = new THREE.CylinderGeometry(0.132, 0.135, 0.1, 48);
    tampa.translate(0, 1.57, 0);
    return { corpo, liquido, rotulo, tampa };
  }, []);
  const m = useMemo(() => {
    const vidro = materialDeVidro(fade, new THREE.Vector3(0.2, 0.26, 0.22));
    const liq = new THREE.MeshPhysicalMaterial({ color: liquido ? new THREE.Color(liquido) : new THREE.Color(cor).lerp(new THREE.Color("#ffffff"), 0.25), transparent: true, opacity: 0.82, roughness: 0.08, clearcoat: 0.6, envMapIntensity: 1.1 });
    const rot = new THREE.MeshPhysicalMaterial({ map: tex.rotulo, roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.0 });
    const tam = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.35, metalness: 0.1, envMapIntensity: 1.1 });
    return { vidro, liq, rot, tam };
  }, [tex, cor, fade, liquido]);
  return (
    <group>
      <mesh geometry={g.liquido} material={m.liq} renderOrder={1} />
      <mesh geometry={g.rotulo} material={m.rot} renderOrder={2} />
      <mesh geometry={g.corpo} material={m.vidro} renderOrder={5} />
      <mesh geometry={g.tampa} material={m.tam} />
    </group>
  );
};

/* ---------- caixa (pacote, maço, caixa de remédio) ---------- */
const Caixa: React.FC<{ tex: Texturas; cor: string }> = ({ tex, cor }) => {
  const g = useMemo(() => {
    const b = new THREE.BoxGeometry(0.9, 1.2, 0.36, 1, 1, 1);
    b.translate(0, 0.6, 0);
    return b;
  }, []);
  const mats = useMemo(() => {
    const f = new THREE.MeshPhysicalMaterial({ map: tex.frente, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.95 });
    const l = new THREE.MeshPhysicalMaterial({ map: tex.lado, roughness: 0.55, clearcoat: 0.3, envMapIntensity: 0.9 });
    const t = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).lerp(new THREE.Color("#000000"), 0.15), roughness: 0.55, envMapIntensity: 0.9 });
    return [l, l, t, t, f, f];
  }, [tex, cor]);
  return <mesh geometry={g} material={mats} />;
};

/* ---------- pote (frasco de comprimidos, pote de creme) ---------- */
const Pote: React.FC<{ tex: Texturas; cor: string }> = ({ tex, cor }) => {
  const g = useMemo(() => {
    const corpo = lathe([
      [0.0, 0.0],
      [0.39, 0.0],
      [0.42, 0.03],
      [0.42, 0.74],
      [0.4, 0.78],
      [0.36, 0.8],
      [0.0, 0.8],
    ]);
    const rotulo = new THREE.CylinderGeometry(0.424, 0.424, 0.46, 120, 1, true, -Math.PI, Math.PI * 2);
    rotulo.translate(0, 0.38, 0);
    const tampa = lathe([
      [0.0, 0.8],
      [0.43, 0.8],
      [0.445, 0.82],
      [0.445, 0.99],
      [0.43, 1.02],
      [0.0, 1.02],
    ]);
    return { corpo, rotulo, tampa };
  }, []);
  const m = useMemo(() => {
    const plast = new THREE.MeshPhysicalMaterial({ color: "#f3f0e8", roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.0 });
    const rot = new THREE.MeshPhysicalMaterial({ map: tex.rotulo, roughness: 0.45, clearcoat: 0.5, envMapIntensity: 1.0 });
    const tam = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.4, metalness: 0.05, envMapIntensity: 1.0 });
    return { plast, rot, tam };
  }, [tex, cor]);
  return (
    <group>
      <mesh geometry={g.corpo} material={m.plast} />
      <mesh geometry={g.rotulo} material={m.rot} />
      <mesh geometry={g.tampa} material={m.tam} />
    </group>
  );
};

const ObjetoModelo: React.FC<{ cena: Cena; tex: Texturas; tab: number; hole: number }> = ({ cena, tex, tab, hole }) => {
  const o = cena.objeto;
  if (!o) return null;
  const cor = o.cor ?? "#24503C";
  if (o.forma === "lata") return <Lata tex={tex} tab={tab} hole={hole} />;
  if (o.forma === "garrafa") return <Garrafa tex={tex} cor={cor} liquido={o.liquido} />;
  if (o.forma === "caixa") return <Caixa tex={tex} cor={cor} />;
  return <Pote tex={tex} cor={cor} />;
};

const ObjetoNoPalco: React.FC<{ cena: Cena; tex: Texturas }> = ({ cena, tex }) => {
  const t = useTempo();
  const p = objetoAt(cena, t);
  if (!cena.objeto || p.vis <= 0.001) return null;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[p.pitch, 0, 0]}>
      <group scale={p.s}>
        <Sombra tex={tex.sombra} w={1.25} d={1.25} o={0.42 * p.shadow} />
      </group>
      <group rotation={[0, 0, p.tilt]}>
        <group rotation={[0, p.spin, 0]} scale={p.s}>
          <ObjetoModelo cena={cena} tex={tex} tab={p.tab} hole={p.hole} />
        </group>
      </group>
    </group>
  );
};

/* ---------- unidades ---------- */
const useGeometriaUnidade = (cena: Cena) =>
  useMemo(() => {
    const k = cena.escalaUni;
    const U = UNI[cena.forma];
    if (cena.forma === "sache") {
      const geo = new THREE.BoxGeometry(U.w * k, U.t * k, U.d * k, 16, 1, 12);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) / ((U.w * k) / 2);
        const z = pos.getZ(i) / ((U.d * k) / 2);
        const y = pos.getY(i);
        const puff = (1 - Math.pow(Math.abs(x), 6)) * (1 - Math.pow(Math.abs(z), 6));
        pos.setY(i, y * (0.12 + 0.88 * Math.max(0, puff)));
      }
      geo.computeVertexNormals();
      return geo;
    }
    if (cena.forma === "moeda") return new THREE.CylinderGeometry((U.w / 2) * k, (U.w / 2) * k, U.t * k, 64);
    if (cena.forma === "cubo") {
      const geo = new THREE.BoxGeometry(U.w * k, U.t * k, U.d * k, 4, 4, 4);
      // cantos levemente gastos
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const m = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
        v.multiplyScalar(1 - 0.06 * Math.pow(v.length() / (m * 1.732), 4));
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    }
    const geo = new THREE.CapsuleGeometry((U.t / 2) * k, (U.w - U.t) * k, 8, 24);
    geo.rotateZ(Math.PI / 2);
    const pos = geo.attributes.position;
    const cols: number[] = [];
    const a = new THREE.Color("#f6f3ec");
    const b = new THREE.Color(P.fundo);
    for (let i = 0; i < pos.count; i++) {
      const c = pos.getX(i) > 0 ? b : a;
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    return geo;
  }, [cena]);

const Unidades: React.FC<{ cena: Cena; tex: Texturas }> = ({ cena, tex }) => {
  const t = useTempo();
  const geo = useGeometriaUnidade(cena);
  const mats = useMemo((): THREE.Material | THREE.Material[] => {
    if (cena.forma === "sache") {
      const face = new THREE.MeshStandardMaterial({ map: tex.sache, roughness: 0.72, metalness: 0, envMapIntensity: 0.9 });
      const side = new THREE.MeshStandardMaterial({ color: "#efe9dc", roughness: 0.8, envMapIntensity: 0.8 });
      return [side, side, face, face, side, side];
    }
    if (cena.forma === "moeda") {
      const borda = new THREE.MeshStandardMaterial({ color: "#cdd1ce", metalness: 1, roughness: 0.3, envMapIntensity: 1.3 });
      const face = new THREE.MeshStandardMaterial({ map: tex.moeda, metalness: 0.85, roughness: 0.34, envMapIntensity: 1.3 });
      return [borda, face, face];
    }
    if (cena.forma === "cubo") return new THREE.MeshStandardMaterial({ map: tex.cubo, roughness: 0.92, envMapIntensity: 0.85 });
    return new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.0 });
  }, [cena, tex]);
  return (
    <>
      {cena.unidades.map((_, i) => {
        const s = unidadeAt(cena, i, t);
        if (!s) return null;
        return (
          <group key={i} position={[s.x, s.y, s.z]} rotation={[s.rx, s.ry, s.rz, "YXZ"]}>
            <mesh geometry={geo} material={mats} />
          </group>
        );
      })}
    </>
  );
};

/* ---------- líquido, bolhas, excesso vermelho ---------- */
const materialLiquido = (color: string, opacity: number) =>
  new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity, roughness: 0.06, metalness: 0, envMapIntensity: 1.1, clearcoat: 0.6, depthWrite: false });
const Liquido: React.FC<{ cena: Cena }> = ({ cena }) => {
  const t = useTempo();
  const perfil = perfilDe(cena);
  const lv = nivelAt(cena, t);
  const red = vermelhoAt(cena, t);
  const LINE = cena.LINE_H ?? BASE_IN;
  const cor = cena.objeto?.liquido ?? "#cfe5c4";
  const mats = useMemo(
    () => ({
      body: materialLiquido(cor, cena.objeto?.liquido ? 0.42 : 0.34),
      top: materialLiquido(cena.objeto?.liquido ? `#${new THREE.Color(cor).lerp(new THREE.Color("#ffffff"), 0.4).getHexString()}` : "#e6f3dd", 0.5),
      ex: materialLiquido("#e9a79c", 0.0),
      bub: new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.75, depthWrite: false }),
    }),
    [cor, cena.objeto?.liquido],
  );
  const h = lv - BASE_IN;
  const despeja = cena.despeja;
  const body = useMemo(
    () => (despeja && h > 0.004 ? new THREE.CylinderGeometry(perfil.interno(lv) - 0.006, perfil.interno(BASE_IN + 0.05) - 0.03, h, 72, 1, true) : null),
    [h, lv, despeja, perfil],
  );
  const exH = Math.max(0, lv - LINE);
  const ex = useMemo(() => (exH > 0.004 ? new THREE.CylinderGeometry(perfil.interno(lv) - 0.004, perfil.interno(LINE) - 0.004, exH, 72, 1, true) : null), [exH, lv, LINE, perfil]);
  const bubGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  if (!cena.passa) return null;
  mats.ex.opacity = (despeja ? 0.42 : 0.3) * red;
  if (!despeja) {
    // sem despejo: só a faixa acima da linha fica vermelha (sobe da linha até o topo da pilha)
    return ex ? <mesh geometry={ex} material={mats.ex} position={[0, LINE + exH / 2, 0]} renderOrder={2} /> : null;
  }
  if (!body) return null;
  const pouring = t > cena.POUR_ON && t < cena.POUR_OFF + 0.2;
  const wob = pouring ? 0.035 * Math.sin(t * 19) : 0.012 * Math.sin(t * 9) * Math.exp(-(t - cena.POUR_OFF) * 3);
  const bubbles = Array.from({ length: 36 }, (_, i) => {
    const a = (i * 2.399) % (Math.PI * 2);
    const rr = 0.12 + ((i * 0.37) % 1) * 0.42;
    const sp = 0.35 + ((i * 0.53) % 1) * 0.6;
    const y = BASE_IN + 0.04 + (((((t - cena.POUR_ON) * sp + i * 0.137) % 1) + 1) % 1) * Math.max(0.01, h - 0.08);
    const sz = 0.009 + ((i * 0.71) % 1) * 0.016;
    return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, y, sz };
  });
  return (
    <group>
      <mesh geometry={body} material={mats.body} position={[0, BASE_IN + h / 2, 0]} renderOrder={1} />
      {ex ? <mesh geometry={ex} material={mats.ex} position={[0, LINE + exH / 2, 0]} renderOrder={2} /> : null}
      <mesh position={[0, lv, 0]} rotation={[-Math.PI / 2 + wob, 0, wob * 0.6]} renderOrder={2} material={mats.top}>
        <circleGeometry args={[perfil.interno(lv) - 0.006, 72]} />
      </mesh>
      {bubbles.map((b, i) => (
        <mesh key={i} geometry={bubGeo} material={mats.bub} position={[b.x, b.y, b.z]} scale={b.sz} renderOrder={2} />
      ))}
    </group>
  );
};

/* ---------- linha tracejada da referência (anel em volta do recipiente + guia para o rótulo) ---------- */
const N_DASH = 60;
export const Anel: React.FC<{ altura: number; raio: number; em: number; vermelho: number; pulsoEm?: number; guia?: boolean }> = ({ altura, raio, em, vermelho, pulsoEm, guia = true }) => {
  const t = useTempo();
  const draw = prog(t, em - 0.04, em + 0.55, EASE_OUT);
  const lead = prog(t, em + 0.2, em + 0.6, EASE_OUT);
  const pulse = pulsoEm === undefined ? 1 : 1 + 0.5 * Math.exp(-Math.pow((t - pulsoEm - 0.1) / 0.18, 2));
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: P.fundo, toneMapped: false }), []);
  mat.color.set(P.fundo).lerp(new THREE.Color(P.vermelho), vermelho);
  const dash = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  if (draw <= 0) return null;
  const r = raio + 0.016;
  const arc = ((Math.PI * 2) / N_DASH) * r * 0.55;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < N_DASH; i++) {
    if (i / N_DASH > draw) break;
    const th = Math.PI * 0.5 + (i / N_DASH) * Math.PI * 2;
    items.push(<mesh key={i} geometry={dash} material={mat} position={[r * Math.sin(th), altura, r * Math.cos(th)]} rotation={[0, th, 0]} scale={[arc, 0.026 * pulse, 0.014]} />);
  }
  if (guia) {
    const nLead = 6;
    for (let k = 0; k < nLead; k++) {
      if (k / nLead > lead) break;
      const x0 = r + 0.05 + k * 0.066;
      items.push(<mesh key={`l${k}`} geometry={dash} material={mat} position={[x0, altura, 0]} scale={[0.036, 0.026 * pulse, 0.014]} />);
    }
  }
  return <group>{items}</group>;
};

const Recipiente: React.FC<{ cena: Cena; tex: Texturas }> = ({ cena, tex }) => {
  const t = useTempo();
  const g = copoAt(cena, t);
  const perfil = perfilDe(cena);
  const fade = useMemo(() => ({ value: 0 }), []);
  const mat = useMemo(() => materialDeVidro(fade), [fade]);
  const geo = useMemo(() => lathe(perfil.pontos, 160), [perfil]);
  fade.value = g.a;
  if (g.a <= 0.001) return null;
  const md = cena.m.tipo === "medida" ? cena.m : null;
  return (
    <group position={[g.x, g.y, 0]} rotation={[PITCH, 0, 0]} scale={g.s}>
      <Sombra tex={tex.sombra} w={2.3} d={2.3} o={0.34 * g.a} />
      <Unidades cena={cena} tex={tex} />
      <Liquido cena={cena} />
      {md?.referencia && cena.LINE_H !== null ? (
        <Anel altura={cena.LINE_H} raio={perfil.externo(cena.LINE_H)} em={cena.T.ideal} vermelho={vermelhoAt(cena, t)} pulsoEm={cena.passa ? cena.T.limite : undefined} />
      ) : null}
      <mesh geometry={geo} material={mat} renderOrder={5} />
    </group>
  );
};

/* ---------- fio de líquido da boca do objeto até o nível ---------- */
const Fio: React.FC<{ cena: Cena }> = ({ cena }) => {
  const t = useTempo();
  const on = prog(t, cena.POUR_ON - 0.04, cena.POUR_ON + 0.1);
  const off = prog(t, cena.POUR_OFF - 0.04, cena.POUR_OFF + 0.12);
  const mat = useMemo(() => materialLiquido(cena.objeto?.liquido ?? "#cfe6c2", 0.78), [cena]);
  if (!cena.despeja || on <= 0 || off >= 1) return null;
  const m = bocaAgora(cena, t);
  const g = copoAt(cena, t);
  const lv = nivelAt(cena, t);
  const toW = (lx: number, ly: number) => ({ x: g.x + g.s * lx, y: g.y + g.s * ly * Math.cos(PITCH), z: g.s * ly * Math.sin(PITCH) });
  const end = toW(-0.18, lv);
  const a = new THREE.Vector3(m.x, m.y, m.z);
  const b = new THREE.Vector3(end.x, end.y, end.z);
  const head = a.clone().lerp(b, clamp01(on));
  const tail = a.clone().lerp(b, clamp01(off));
  const mid = tail.clone().lerp(head, 0.5).add(new THREE.Vector3(0.06, 0.04, 0));
  const curve = new THREE.QuadraticBezierCurve3(tail, mid, head);
  const geo = new THREE.TubeGeometry(curve, 24, 0.05 + 0.006 * Math.sin(t * 40), 12, false);
  return <mesh geometry={geo} material={mat} renderOrder={1} />;
};

export const Palco3D: React.FC<{ cena: Cena }> = ({ cena }) => {
  const md = cena.m.tipo === "medida" ? cena.m : null;
  const tex = useTexturas(cena.objeto, md?.unidades.etiqueta ?? {});
  const t = useTempo();
  return (
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 22, position: [0, 0, 24.7], near: 0.1, far: 100 }} dpr={1} style={{ position: "absolute", left: 0, top: 0 }}>
      <Ambiente />
      <Luzes />
      {tex ? (
        <>
          <ObjetoNoPalco cena={cena} tex={tex} />
          {cena.temCopo && t >= cena.T.copo - 0.4 ? <Recipiente cena={cena} tex={tex} /> : null}
          <Fio cena={cena} />
        </>
      ) : null}
    </ThreeCanvas>
  );
};
