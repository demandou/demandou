// PLANTA HUMANIZADA 3D, como as plantas de lançamento de alto padrão: piso de madeira / porcelanato / deck,
// paredes com espessura, corte escuro e rodapé, janelas, portas abertas, móveis modelados, sombras reais +
// sombra de contato falsa sob cada móvel. Tudo em METROS (o grupo é escalado por `pm`).
// Formas: apartamento (o exemplo), casa (garagem, quintal, piscina), sala comercial e terreno.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_INOUT, EASE_OUT, lerp, prog } from "../anim";
import type { InfoPlanta } from "../roteiro";
import { col, fabricTex, rbox, rugTex, softDisc, softRect, tileTex, wallAO, woodTex } from "./mat";
import { DADOS, escalaDa, PLAN_Y, type DadosPlanta, type Forma, type Parede } from "./plantaDados";

const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/** grama aparada em faixas (quintal, terreno) */
const gramaTex = (() => {
  let tx: THREE.Texture | null = null;
  return () => {
    if (tx) return tx;
    const S = 512;
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    const g = cv.getContext("2d")!;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#4A6A44" : "#557A4D";
      g.fillRect(0, (i * S) / 8, S, S / 8);
    }
    const img = g.getImageData(0, 0, S, S);
    let a = 1234567;
    for (let i = 0; i < S * S; i++) {
      a = (a * 1103515245 + 12345) & 0x7fffffff;
      const n = ((a / 0x7fffffff) - 0.5) * 0.14;
      for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.max(0, Math.min(255, img.data[i * 4 + c] * (1 + n)));
    }
    g.putImageData(img, 0, 0);
    tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    return tx;
  };
})();

const H = 1.5; // altura do corte das paredes (m)
const TH_EXT = 0.2;
const TH_INT = 0.12;

/* ---------- materiais (criados uma vez) ---------- */
type Mats = ReturnType<typeof makeMats>;
let MATS: Mats | null = null;
const std = (color: string, roughness = 0.7, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: col(color), roughness, metalness, ...extra });
const makeMats = () => ({
  wall: std("#ECE8E1", 0.92),
  cut: std("#1A2335", 0.55, 0.1),
  base: std("#E2DDD4", 0.6),
  glass: new THREE.MeshStandardMaterial({ color: col("#BFD6EA"), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }),
  frame: std("#2B2F37", 0.4, 0.6),
  slab: std("#131B2A", 0.6, 0.2),
  white: std("#F3F1EC", 0.85, 0, { map: fabricTex("white", "#F3F1EC", 0.035) }),
  duvet: std("#E4DCCF", 0.95, 0, { map: fabricTex("duvet", "#E4DCCF", 0.05) }),
  greige: std("#B9AF9F", 0.95, 0, { map: fabricTex("greige", "#B9AF9F", 0.06) }),
  sofa: std("#CFC6B7", 0.95, 0, { map: fabricTex("sofa", "#CFC6B7", 0.06) }),
  navyFab: std("#27324A", 0.9, 0, { map: fabricTex("navy", "#27324A", 0.07) }),
  blueGrey: std("#5B6982", 0.9, 0, { map: fabricTex("bluegrey", "#5B6982", 0.07) }),
  champ: std("#C2A472", 0.85, 0, { map: fabricTex("champ", "#C2A472", 0.06) }),
  head: std("#3A4256", 0.9, 0, { map: fabricTex("head", "#3A4256", 0.06) }),
  walnut: std("#6A4A33", 0.5),
  oak: std("#B48C63", 0.55),
  graphite: std("#2D3139", 0.42, 0.1),
  quartz: std("#EDEBE6", 0.22),
  stoneDark: std("#3A3D43", 0.35),
  black: std("#121316", 0.25),
  steel: std("#B8BCC3", 0.3, 0.85),
  brass: std("#C8A66A", 0.3, 1),
  leather: std("#8B5838", 0.5),
  ceramic: std("#F6F5F2", 0.12),
  leaf: std("#4C6A45", 0.85, 0, { flatShading: true }),
  leaf2: std("#3C5A3C", 0.85, 0, { flatShading: true }),
  pot: std("#2F2D2C", 0.7),
  terracotta: std("#9C6749", 0.8),
  shade: new THREE.MeshStandardMaterial({ color: col("#F6E7CF"), roughness: 0.9, emissive: col("#FFD9A0"), emissiveIntensity: 0 }),
  tv: std("#0D0E10", 0.15, 0.3),
  rugLiving: std("#D9D0C2", 1, 0, { map: rugTex("liv", "#D8CEBF", "#A99C88") }),
  rugBed: std("#C9C2B6", 1, 0, { map: rugTex("bed", "#C7C0B4", "#8D8577") }),
  grassM: std("#3E5A3A", 0.95, 0, { map: gramaTex() }),
  concrete: std("#8C8F94", 0.85, 0, { map: tileTex("conc", "#8E9196", "#7C7F84", 3) }),
  water: new THREE.MeshStandardMaterial({ color: col("#3C93B8"), roughness: 0.04, metalness: 0.15, emissive: col("#1D6F92"), emissiveIntensity: 0.55, transparent: true, opacity: 0, envMapIntensity: 1.6 }),
  coping: std("#D8D2C6", 0.6),
  carBody: std("#2B3442", 0.25, 0.7),
  carGlass: std("#0E141C", 0.08, 0.6),
  tire: std("#111214", 0.9),
  stake: std("#C8A66A", 0.35, 0.8),
  gold: new THREE.MeshBasicMaterial({ color: col("#D9BE8A").multiplyScalar(1.5), toneMapped: false, transparent: true, opacity: 0 }),
});
const M = () => (MATS ??= makeMats());

/* ---------- peças básicas ---------- */
type P3 = [number, number, number];
/** caixa arredondada com a BASE em p */
const B: React.FC<{ s: P3; p?: P3; m: THREE.Material; r?: number; ry?: number; rx?: number; shadow?: boolean }> = ({ s, p = [0, 0, 0], m, r = 0.02, ry = 0, rx = 0, shadow = true }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], r)} material={m} position={[p[0], p[1] + s[1] / 2, p[2]]} rotation={[rx, ry, 0]} castShadow={shadow} receiveShadow />
);
const Cyl: React.FC<{ r: number; r2?: number; h: number; p?: P3; m: THREE.Material; seg?: number; shadow?: boolean }> = ({ r, r2, h, p = [0, 0, 0], m, seg = 28, shadow = true }) => (
  <mesh position={[p[0], p[1] + h / 2, p[2]]} material={m} castShadow={shadow} receiveShadow>
    <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
  </mesh>
);

/** móvel que "pousa" na planta: cai suave + sombra de contato que aparece no chão */
const Piece: React.FC<{ at: number; x: number; z: number; ry?: number; sh?: [number, number]; disc?: boolean; o?: number; children: React.ReactNode }> = ({ at, x, z, ry = 0, sh, disc, o = 0.55, children }) => {
  const t = useT();
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0, alphaMap: disc ? softDisc() : softRect(), depthWrite: false }), [disc]);
  const p = prog(t, at, at + 0.45, EASE_OUT);
  if (p <= 0) return null;
  mat.opacity = o * p;
  const s = lerp(0.9, 1, p);
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {sh ? (
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
          <planeGeometry args={[sh[0], sh[1]]} />
        </mesh>
      ) : null}
      <group position={[0, (1 - p) * 1.1, 0]} scale={[s, s, s]}>
        {children}
      </group>
    </group>
  );
};

/* ---------- móveis ---------- */
const Lamp: React.FC<{ p?: P3; on: number }> = ({ p = [0, 0, 0], on }) => {
  const m = M();
  m.shade.emissiveIntensity = 0.9 * on;
  return (
    <group position={p}>
      <Cyl r={0.07} h={0.03} m={m.brass} />
      <Cyl r={0.014} h={0.3} m={m.brass} />
      <Cyl r={0.15} r2={0.11} h={0.2} p={[0, 0.27, 0]} m={m.shade} shadow={false} />
    </group>
  );
};
const Nightstand: React.FC<{ on: number }> = ({ on }) => {
  const m = M();
  return (
    <group>
      <B s={[0.48, 0.46, 0.4]} m={m.walnut} r={0.02} />
      <B s={[0.44, 0.012, 0.02]} p={[0, 0.23, 0.2]} m={m.brass} r={0.004} shadow={false} />
      <Lamp p={[0.05, 0.46, -0.03]} on={on} />
    </group>
  );
};
/** cama de casal (cabeceira em −z, pé em +z) */
const Bed: React.FC<{ throwM: THREE.Material }> = ({ throwM }) => {
  const m = M();
  return (
    <group>
      <B s={[1.66, 0.26, 2.04]} p={[0, 0.02, 0]} m={m.greige} r={0.05} />
      <B s={[1.58, 0.22, 1.96]} p={[0, 0.26, 0.01]} m={m.white} r={0.07} />
      <B s={[1.68, 0.07, 1.34]} p={[0, 0.45, 0.34]} m={m.duvet} r={0.04} />
      <B s={[1.7, 0.075, 0.4]} p={[0, 0.462, 0.74]} m={throwM} r={0.03} />
      <B s={[0.64, 0.14, 0.38]} p={[-0.38, 0.47, -0.7]} m={m.white} r={0.065} rx={-0.25} />
      <B s={[0.64, 0.14, 0.38]} p={[0.38, 0.47, -0.7]} m={m.white} r={0.065} rx={-0.25} />
      <B s={[0.44, 0.13, 0.18]} p={[0, 0.5, -0.46]} m={throwM} r={0.05} rx={-0.2} />
      <B s={[2.0, 1.05, 0.1]} p={[0, 0, -1.07]} m={m.head} r={0.04} />
    </group>
  );
};
const Sofa: React.FC = () => {
  const m = M();
  return (
    <group>
      <B s={[2.24, 0.06, 0.82]} p={[0, 0, 0]} m={m.walnut} r={0.01} />
      <B s={[2.32, 0.22, 0.94]} p={[0, 0.06, 0]} m={m.sofa} r={0.05} />
      {[-0.66, 0, 0.66].map((x, i) => (
        <B key={i} s={[0.65, 0.15, 0.7]} p={[x, 0.27, 0.08]} m={m.sofa} r={0.06} />
      ))}
      <B s={[2.0, 0.44, 0.22]} p={[0, 0.27, -0.34]} m={m.sofa} r={0.08} />
      <B s={[0.17, 0.34, 0.94]} p={[-1.075, 0.2, 0]} m={m.sofa} r={0.06} />
      <B s={[0.17, 0.34, 0.94]} p={[1.075, 0.2, 0]} m={m.sofa} r={0.06} />
      <B s={[0.42, 0.38, 0.13]} p={[-0.68, 0.38, -0.18]} m={m.navyFab} r={0.06} rx={-0.25} ry={0.12} />
      <B s={[0.42, 0.38, 0.13]} p={[0.7, 0.38, -0.18]} m={m.champ} r={0.06} rx={-0.25} ry={-0.1} />
      <B s={[0.38, 0.34, 0.12]} p={[0.28, 0.38, -0.16]} m={m.white} r={0.05} rx={-0.25} />
    </group>
  );
};
const Armchair: React.FC = () => {
  const m = M();
  return (
    <group>
      <B s={[0.8, 0.24, 0.8]} p={[0, 0.08, 0]} m={m.leather} r={0.06} />
      <B s={[0.58, 0.13, 0.6]} p={[0, 0.32, 0.06]} m={m.leather} r={0.05} />
      <B s={[0.8, 0.42, 0.16]} p={[0, 0.3, -0.32]} m={m.leather} r={0.06} />
      <B s={[0.12, 0.26, 0.78]} p={[-0.34, 0.3, 0]} m={m.leather} r={0.05} />
      <B s={[0.12, 0.26, 0.78]} p={[0.34, 0.3, 0]} m={m.leather} r={0.05} />
      {[[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].map(([x, z], i) => (
        <Cyl key={i} r={0.02} h={0.08} p={[x, 0, z]} m={m.walnut} />
      ))}
    </group>
  );
};
const Chair: React.FC<{ fab?: THREE.Material }> = ({ fab }) => {
  const m = M();
  return (
    <group>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <Cyl key={i} r={0.017} h={0.42} p={[x, 0, z]} m={m.walnut} seg={8} />
      ))}
      <B s={[0.46, 0.07, 0.46]} p={[0, 0.42, 0]} m={fab ?? m.greige} r={0.025} />
      <B s={[0.44, 0.4, 0.05]} p={[0, 0.47, -0.21]} m={fab ?? m.greige} r={0.02} />
    </group>
  );
};
const Stool: React.FC = () => {
  const m = M();
  return (
    <group>
      <Cyl r={0.17} h={0.015} m={m.brass} />
      <Cyl r={0.025} h={0.64} m={m.brass} seg={12} />
      <Cyl r={0.19} h={0.07} p={[0, 0.64, 0]} m={m.leather} />
    </group>
  );
};
const Plant: React.FC<{ s?: number; tall?: boolean }> = ({ s = 1, tall }) => {
  const m = M();
  const blobs: Array<[number, number, number, number]> = tall
    ? [[0, 0.95, 0, 0.26], [0.14, 1.2, 0.05, 0.22], [-0.12, 1.15, -0.06, 0.2], [0.02, 1.42, -0.02, 0.18], [-0.05, 0.75, 0.12, 0.2]]
    : [[0, 0.62, 0, 0.27], [0.17, 0.72, 0.06, 0.21], [-0.16, 0.7, -0.05, 0.22], [0.03, 0.88, 0.1, 0.18]];
  return (
    <group scale={[s, s, s]}>
      <Cyl r={0.22} r2={0.26} h={0.5} m={tall ? m.pot : m.terracotta} />
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={i % 2 ? m.leaf2 : m.leaf} castShadow>
          <icosahedronGeometry args={[r, 1]} />
        </mesh>
      ))}
    </group>
  );
};
const Vanity: React.FC<{ w?: number }> = ({ w = 1.1 }) => {
  const m = M();
  return (
    <group>
      <B s={[w, 0.42, 0.45]} p={[0, 0.38, 0]} m={m.walnut} r={0.015} />
      <B s={[w + 0.02, 0.04, 0.47]} p={[0, 0.8, 0]} m={m.quartz} r={0.01} />
      <B s={[0.44, 0.12, 0.34]} p={[0, 0.84, 0.02]} m={m.ceramic} r={0.06} />
      <Cyl r={0.014} h={0.2} p={[0, 0.84, -0.18]} m={m.brass} seg={10} />
      <B s={[w * 0.82, 0.62, 0.025]} p={[0, 0.88, -0.215]} m={m.steel} r={0.01} shadow={false} />
    </group>
  );
};
const Toilet: React.FC = () => {
  const m = M();
  return (
    <group>
      <B s={[0.36, 0.4, 0.52]} p={[0, 0, 0.04]} m={m.ceramic} r={0.13} />
      <B s={[0.38, 0.34, 0.16]} p={[0, 0.3, -0.24]} m={m.ceramic} r={0.04} />
    </group>
  );
};
const Shower: React.FC<{ w: number; d: number; glassAt: number }> = ({ w, d, glassAt }) => {
  const m = M();
  return (
    <group>
      <B s={[w, 0.03, d]} m={m.stoneDark} r={0.005} shadow={false} />
      <mesh position={[glassAt, 0.75, 0]} material={m.glass}>
        <boxGeometry args={[0.015, 1.45, d]} />
      </mesh>
      <B s={[0.02, 1.45, 0.03]} p={[glassAt, 0, d / 2 - 0.02]} m={m.frame} r={0.005} />
    </group>
  );
};
const Rug: React.FC<{ w: number; d: number; m: THREE.Material }> = ({ w, d, m }) => (
  <mesh position={[0, 0.006, 0]} material={m} receiveShadow>
    <boxGeometry args={[w, 0.012, d]} />
  </mesh>
);


/* ---------- mobília do apartamento (o exemplo), cômodo a cômodo ---------- */
const estar = (n: () => number, lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={1.85} z={4.45} sh={[2.5, 2.1]} o={0.25}>
        <Rug w={2.4} d={2.0} m={m.rugLiving} />
      </Piece>
      <Piece at={n()} x={0.6} z={4.45} ry={Math.PI / 2} sh={[2.6, 1.2]}>
        <Sofa />
      </Piece>
      <Piece at={n()} x={1.95} z={4.45} sh={[1.1, 1.1]} disc>
        <Cyl r={0.17} h={0.34} m={m.walnut} />
        <Cyl r={0.46} h={0.045} p={[0, 0.34, 0]} m={m.quartz} seg={40} />
        <B s={[0.24, 0.04, 0.18]} p={[0.1, 0.385, -0.08]} m={m.navyFab} r={0.01} />
        <Cyl r={0.07} h={0.08} p={[-0.14, 0.385, 0.1]} m={m.brass} />
      </Piece>
      <Piece at={n()} x={3.15} z={3.55} ry={-Math.PI / 2 + 0.55} sh={[1.0, 1.0]}>
        <Armchair />
      </Piece>
      <Piece at={n()} x={4.7} z={4.45} ry={-Math.PI / 2} sh={[2.0, 0.6]}>
        <B s={[1.9, 0.42, 0.42]} p={[0, 0.06, 0]} m={m.walnut} r={0.015} />
        <B s={[1.5, 0.82, 0.05]} p={[0, 0.62, -0.14]} m={m.tv} r={0.01} />
      </Piece>
      <Piece at={n()} x={0.45} z={3.0} sh={[0.7, 0.7]} disc>
        <B s={[0.45, 0.5, 0.45]} m={m.oak} r={0.02} />
        <Lamp p={[0, 0.5, 0]} on={lampOn} />
      </Piece>
      <Piece at={n()} x={0.4} z={5.65} sh={[0.8, 0.8]} disc>
        <Plant tall />
      </Piece>
    </>
  );
};
const cozinha = (n: () => number, _lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={2.07} z={0.42} sh={[4.1, 0.9]}>
        <B s={[3.85, 0.82, 0.6]} p={[0, 0.04, 0]} m={m.graphite} r={0.01} />
        <B s={[3.9, 0.04, 0.64]} p={[0, 0.86, 0]} m={m.quartz} r={0.008} />
        <B s={[0.62, 0.012, 0.5]} p={[0.75, 0.9, 0]} m={m.black} r={0.004} shadow={false} />
        <B s={[0.7, 0.012, 0.4]} p={[-0.9, 0.9, 0]} m={m.steel} r={0.004} shadow={false} />
        <Cyl r={0.016} h={0.28} p={[-0.9, 0.9, -0.22]} m={m.brass} seg={10} />
      </Piece>
      <Piece at={n()} x={4.55} z={0.42} sh={[0.95, 0.95]}>
        <B s={[0.74, 1.46, 0.68]} m={m.steel} r={0.015} />
      </Piece>
      <Piece at={n()} x={1.9} z={1.75} sh={[2.4, 1.3]}>
        <B s={[1.9, 0.86, 0.82]} m={m.graphite} r={0.01} />
        <B s={[2.06, 0.05, 0.96]} p={[0, 0.86, 0]} m={m.quartz} r={0.01} />
      </Piece>
      {[1.2, 1.9, 2.6].map((x) => (
        <Piece key={x} at={n()} x={x} z={2.48} sh={[0.55, 0.55]} disc o={0.45}>
          <Stool />
        </Piece>
      ))}
      <Piece at={n()} x={3.95} z={1.75} sh={[1.5, 1.5]} disc o={0.45}>
        <Cyl r={0.08} h={0.72} m={m.walnut} />
        <Cyl r={0.3} h={0.03} m={m.walnut} />
        <Cyl r={0.56} h={0.04} p={[0, 0.72, 0]} m={m.oak} seg={40} />
        <Cyl r={0.09} r2={0.06} h={0.14} p={[0.05, 0.76, 0.02]} m={m.ceramic} />
      </Piece>
      {[0, 1, 2, 3].map((q) => {
        const a = (q * Math.PI) / 2 + Math.PI / 4;
        return (
          <Piece key={q} at={n()} x={3.95 + Math.sin(a) * 0.74} z={1.75 + Math.cos(a) * 0.74} ry={a + Math.PI} sh={[0.6, 0.6]} o={0.4}>
            <Chair />
          </Piece>
        );
      })}
    </>
  );
};
const varanda = (n: () => number, _lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={4.13} z={7.0} ry={-Math.PI / 2} sh={[2.1, 0.9]}>
        <B s={[1.9, 0.86, 0.6]} p={[0, 0.04, 0]} m={m.stoneDark} r={0.01} />
        <B s={[1.94, 0.04, 0.64]} p={[0, 0.86, 0]} m={m.quartz} r={0.008} />
        <B s={[0.62, 0.55, 0.54]} p={[-0.6, 0.9, -0.03]} m={m.steel} r={0.02} />
        <B s={[0.5, 0.02, 0.36]} p={[-0.6, 1.45, 0.02]} m={m.black} r={0.004} shadow={false} />
        <B s={[0.42, 0.012, 0.34]} p={[0.5, 0.9, 0]} m={m.steel} r={0.004} shadow={false} />
      </Piece>
      <Piece at={n()} x={2.0} z={7.0} sh={[1.9, 1.3]}>
        {[[-0.6, -0.32], [0.6, -0.32], [-0.6, 0.32], [0.6, 0.32]].map(([x, z], i) => (
          <B key={i} s={[0.05, 0.72, 0.05]} p={[x, 0, z]} m={m.walnut} r={0.01} />
        ))}
        <B s={[1.45, 0.045, 0.82]} p={[0, 0.72, 0]} m={m.oak} r={0.012} />
      </Piece>
      {[[1.62, 6.42, 0], [2.38, 6.42, 0], [1.62, 7.58, Math.PI], [2.38, 7.58, Math.PI]].map(([x, z, r], i) => (
        <Piece key={i} at={n()} x={x} z={z} ry={r} sh={[0.6, 0.6]} o={0.4}>
          <Chair fab={m.champ} />
        </Piece>
      ))}
      <Piece at={n()} x={0.38} z={7.62} sh={[0.8, 0.8]} disc>
        <Plant />
      </Piece>
      <Piece at={n()} x={3.3} z={7.66} sh={[0.7, 0.7]} disc>
        <Plant s={0.85} />
      </Piece>
      <Piece at={n()} x={0.38} z={6.4} sh={[0.7, 0.7]} disc>
        <Plant s={0.75} tall />
      </Piece>
    </>
  );
};
const suite1 = (n: () => number, lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={7.55} z={6.3} sh={[2.6, 2.7]} o={0.2}>
        <Rug w={2.3} d={2.5} m={m.rugBed} />
      </Piece>
      <Piece at={n()} x={7.88} z={6.3} ry={-Math.PI / 2} sh={[2.0, 2.4]}>
        <Bed throwM={m.blueGrey} />
      </Piece>
      <Piece at={n()} x={8.66} z={5.2} ry={-Math.PI / 2} sh={[0.7, 0.65]}>
        <Nightstand on={lampOn} />
      </Piece>
      <Piece at={n()} x={8.66} z={7.42} ry={-Math.PI / 2} sh={[0.7, 0.65]}>
        <Nightstand on={lampOn} />
      </Piece>
      <Piece at={n()} x={5.38} z={7.0} ry={Math.PI / 2} sh={[2.0, 0.85]}>
        <B s={[1.8, 1.46, 0.6]} m={m.oak} r={0.012} />
        <B s={[0.012, 1.3, 0.01]} p={[0, 0.08, 0.301]} m={m.walnut} r={0.002} shadow={false} />
      </Piece>
      <Piece at={n()} x={6.62} z={6.3} ry={-Math.PI / 2} sh={[1.4, 0.6]}>
        <B s={[1.3, 0.4, 0.42]} p={[0, 0.04, 0]} m={m.leather} r={0.05} />
      </Piece>
    </>
  );
};
const suite2 = (n: () => number, lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={7.6} z={1.55} sh={[2.5, 2.4]} o={0.2}>
        <Rug w={2.2} d={2.2} m={m.rugBed} />
      </Piece>
      <Piece at={n()} x={7.88} z={1.55} ry={-Math.PI / 2} sh={[2.0, 2.4]}>
        <Bed throwM={m.champ} />
      </Piece>
      <Piece at={n()} x={8.66} z={0.5} ry={-Math.PI / 2} sh={[0.7, 0.65]}>
        <Nightstand on={lampOn} />
      </Piece>
      <Piece at={n()} x={8.66} z={2.6} ry={-Math.PI / 2} sh={[0.7, 0.65]}>
        <Nightstand on={lampOn} />
      </Piece>
      <Piece at={n()} x={5.36} z={2.4} ry={Math.PI / 2} sh={[1.2, 0.8]}>
        <B s={[1.0, 0.04, 0.55]} p={[0, 0.74, 0]} m={m.oak} r={0.01} />
        <B s={[0.04, 0.74, 0.5]} p={[-0.46, 0, 0]} m={m.oak} r={0.005} />
        <B s={[0.04, 0.74, 0.5]} p={[0.46, 0, 0]} m={m.oak} r={0.005} />
        <Lamp p={[0.3, 0.78, -0.1]} on={lampOn} />
      </Piece>
      <Piece at={n()} x={5.95} z={2.4} ry={-Math.PI / 2} sh={[0.6, 0.6]} o={0.4}>
        <Chair fab={m.navyFab} />
      </Piece>
      <Piece at={n()} x={5.38} z={0.5} ry={Math.PI / 2} sh={[1.1, 0.85]}>
        <B s={[0.9, 1.46, 0.6]} m={m.oak} r={0.012} />
      </Piece>
    </>
  );
};
const banhos = (n: () => number, _lampOn: number) => {
  const m = M();
  return (
    <>

      <Piece at={n()} x={5.68} z={3.3} sh={[1.2, 0.6]}>
        <Vanity w={1.05} />
      </Piece>
      <Piece at={n()} x={6.62} z={3.75} sh={[0.7, 1.4]} o={0.2}>
        <Shower w={0.62} d={1.38} glassAt={-0.31} />
      </Piece>
      <Piece at={n()} x={5.32} z={4.08} ry={Math.PI / 2} sh={[0.6, 0.6]} o={0.4}>
        <Toilet />
      </Piece>
      <Piece at={n()} x={7.4} z={3.75} sh={[0.7, 1.4]} o={0.2}>
        <Shower w={0.68} d={1.38} glassAt={0.34} />
      </Piece>
      <Piece at={n()} x={8.4} z={4.2} ry={Math.PI} sh={[1.2, 0.6]}>
        <Vanity w={1.0} />
      </Piece>
      <Piece at={n()} x={8.66} z={3.42} ry={-Math.PI / 2} sh={[0.6, 0.6]} o={0.4}>
        <Toilet />
      </Piece>
    </>
  );
};

/* ---------- sala comercial ---------- */
const Monitor: React.FC<{ p?: P3 }> = ({ p = [0, 0, 0] }) => {
  const m = M();
  return (
    <group position={p}>
      <B s={[0.2, 0.012, 0.14]} m={m.steel} r={0.004} />
      <B s={[0.03, 0.26, 0.03]} p={[0, 0.012, -0.03]} m={m.steel} r={0.006} shadow={false} />
      <B s={[0.62, 0.36, 0.025]} p={[0, 0.2, -0.05]} m={m.tv} r={0.008} />
    </group>
  );
};
const Mesa: React.FC<{ w?: number; d?: number; tela?: boolean }> = ({ w = 1.4, d = 0.7, tela = true }) => {
  const m = M();
  return (
    <group>
      <B s={[0.04, 0.72, d - 0.08]} p={[-w / 2 + 0.06, 0, 0]} m={m.graphite} r={0.006} />
      <B s={[0.04, 0.72, d - 0.08]} p={[w / 2 - 0.06, 0, 0]} m={m.graphite} r={0.006} />
      <B s={[w, 0.035, d]} p={[0, 0.72, 0]} m={m.oak} r={0.01} />
      {tela ? <Monitor p={[0, 0.755, -d / 2 + 0.2]} /> : null}
    </group>
  );
};
const salaReuniao = (n: () => number) => {
  const m = M();
  return (
    <>
      <Piece at={n()} x={7.05} z={6.25} sh={[2.9, 1.8]}>
        <B s={[0.5, 0.7, 0.5]} p={[-0.7, 0, 0]} m={m.graphite} r={0.02} />
        <B s={[0.5, 0.7, 0.5]} p={[0.7, 0, 0]} m={m.graphite} r={0.02} />
        <B s={[2.5, 0.05, 1.1]} p={[0, 0.7, 0]} m={m.walnut} r={0.02} />
      </Piece>
      {[-0.85, 0, 0.85].flatMap((x) => [
        <Piece key={`a${x}`} at={n()} x={7.05 + x} z={5.4} sh={[0.6, 0.6]} o={0.4}>
          <Chair fab={m.navyFab} />
        </Piece>,
        <Piece key={`b${x}`} at={n()} x={7.05 + x} z={7.1} ry={Math.PI} sh={[0.6, 0.6]} o={0.4}>
          <Chair fab={m.navyFab} />
        </Piece>,
      ])}
      <Piece at={n()} x={8.8} z={6.25} ry={-Math.PI / 2} sh={[1.6, 0.4]}>
        <B s={[1.5, 0.86, 0.05]} p={[0, 0.7, 0]} m={m.tv} r={0.01} />
      </Piece>
      <Piece at={n()} x={5.45} z={7.6} sh={[0.7, 0.7]} disc>
        <Plant s={0.8} tall />
      </Piece>
    </>
  );
};
const salaDiretoria = (n: () => number, lampOn: number) => {
  const m = M();
  return (
    <>
      <Piece at={n()} x={7.3} z={1.2} ry={Math.PI} sh={[1.9, 1.0]}>
        <Mesa w={1.7} d={0.8} />
        <Lamp p={[0.6, 0.755, 0.15]} on={lampOn} />
      </Piece>
      <Piece at={n()} x={7.3} z={0.45} sh={[0.6, 0.6]} o={0.4}>
        <Armchair />
      </Piece>
      <Piece at={n()} x={6.8} z={2.25} ry={Math.PI} sh={[0.6, 0.6]} o={0.4}>
        <Chair fab={m.champ} />
      </Piece>
      <Piece at={n()} x={7.8} z={2.25} ry={Math.PI} sh={[0.6, 0.6]} o={0.4}>
        <Chair fab={m.champ} />
      </Piece>
      <Piece at={n()} x={5.38} z={1.5} ry={Math.PI / 2} sh={[1.9, 0.6]}>
        <B s={[1.8, 1.46, 0.4]} m={m.walnut} r={0.012} />
      </Piece>
      <Piece at={n()} x={8.6} z={2.6} sh={[0.7, 0.7]} disc>
        <Plant s={0.75} />
      </Piece>
    </>
  );
};
const salaOpen = (n: () => number) => {
  const m = M();
  const mesas: Array<[number, number, number]> = [
    [1.3, 3.75, 0],
    [3.4, 3.75, 0],
    [1.3, 5.05, Math.PI],
    [3.4, 5.05, Math.PI],
  ];
  return (
    <>
      {mesas.map(([x, z, r], i) => (
        <React.Fragment key={i}>
          <Piece at={n()} x={x} z={z} ry={r} sh={[1.6, 0.9]}>
            <Mesa />
          </Piece>
          <Piece at={n()} x={x} z={z + (r ? -0.62 : 0.62)} ry={r ? 0 : Math.PI} sh={[0.6, 0.6]} o={0.4}>
            <Chair fab={m.blueGrey} />
          </Piece>
        </React.Fragment>
      ))}
      <Piece at={n()} x={4.6} z={3.2} sh={[0.7, 0.7]} disc>
        <Plant tall />
      </Piece>
    </>
  );
};
const salaRecepcao = (n: () => number) => {
  const m = M();
  return (
    <>
      <Piece at={n()} x={2.5} z={6.75} sh={[2.4, 0.9]}>
        <B s={[2.2, 1.0, 0.6]} m={m.walnut} r={0.02} />
        <B s={[2.3, 0.04, 0.7]} p={[0, 1.0, 0]} m={m.quartz} r={0.01} />
      </Piece>
      <Piece at={n()} x={1.6} z={7.55} ry={Math.PI} sh={[2.6, 1.0]}>
        <Sofa />
      </Piece>
      <Piece at={n()} x={0.45} z={6.5} sh={[0.7, 0.7]} disc>
        <Plant tall />
      </Piece>
      <Piece at={n()} x={4.0} z={7.55} sh={[0.7, 0.7]} disc>
        <Plant s={0.8} />
      </Piece>
    </>
  );
};

/* ---------- casa: garagem com carro, piscina, espreguiçadeiras, jardim ---------- */
const Carro: React.FC = () => {
  const m = M();
  return (
    <group>
      <B s={[1.8, 0.55, 4.3]} p={[0, 0.2, 0]} m={m.carBody} r={0.18} />
      <B s={[1.58, 0.45, 2.2]} p={[0, 0.68, -0.2]} m={m.carGlass} r={0.16} />
      {[[-0.82, 1.35], [0.82, 1.35], [-0.82, -1.4], [0.82, -1.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.33, z]} rotation={[0, 0, Math.PI / 2]} material={m.tire} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.24, 20]} />
        </mesh>
      ))}
    </group>
  );
};
const casaExtras = (n: () => number) => {
  const m = M();
  return (
    <>
      <Piece at={n()} x={-1.7} z={2.9} sh={[2.2, 4.8]}>
        <Carro />
      </Piece>
      {[1.4, 3.2].map((x) => (
        <Piece key={x} at={n()} x={x} z={10.65} ry={Math.PI} sh={[0.8, 1.9]} o={0.35}>
          <B s={[0.7, 0.12, 1.8]} p={[0, 0.2, 0]} m={m.white} r={0.04} />
          <B s={[0.7, 0.5, 0.12]} p={[0, 0.25, -0.86]} m={m.white} r={0.04} rx={0.5} />
          <B s={[0.05, 0.2, 1.6]} p={[-0.3, 0, 0]} m={m.walnut} r={0.01} />
          <B s={[0.05, 0.2, 1.6]} p={[0.3, 0, 0]} m={m.walnut} r={0.01} />
        </Piece>
      ))}
      {[[6.0, 9.6, 1.0], [7.6, 10.3, 0.85], [8.5, 8.9, 0.7], [-2.6, 9.9, 0.9], [-1.4, 10.4, 0.75], [-2.8, 7.2, 0.7]].map(([x, z, s], i) => (
        <Piece key={`p${i}`} at={n()} x={x} z={z} sh={[1.0 * s, 1.0 * s]} disc>
          <Plant s={s} tall={i % 2 === 0} />
        </Piece>
      ))}
    </>
  );
};

/* ---------- terreno: árvores, estacas de topografia e cotas douradas ---------- */
const terrenoPecas = (n: () => number) => {
  const m = M();
  return (
    <>
      {[[0.15, 0.15], [11.85, 0.15], [11.85, 8.85], [0.15, 8.85]].map(([x, z], i) => (
        <Piece key={`e${i}`} at={n()} x={x} z={z} sh={[0.4, 0.4]} disc o={0.4}>
          <B s={[0.08, 0.5, 0.08]} m={m.oak} r={0.01} />
          <B s={[0.1, 0.06, 0.1]} p={[0, 0.5, 0]} m={m.stake} r={0.01} />
        </Piece>
      ))}
      {[[1.4, 1.2, 1.2], [10.6, 1.4, 1.0], [2.2, 7.8, 0.9], [9.8, 7.6, 1.1], [6.0, 0.9, 0.8]].map(([x, z, s], i) => (
        <Piece key={`a${i}`} at={n()} x={x} z={z} sh={[1.3 * s, 1.3 * s]} disc>
          <Plant s={s * 1.3} tall />
        </Piece>
      ))}
    </>
  );
};

/* ---------- paredes, aberturas ---------- */
const wallGeo = (L: number, h: number, th: number) => new THREE.BoxGeometry(L, h, th);
const Walls: React.FC<{ t: number; P: InfoPlanta; d: DadosPlanta }> = ({ t, P, d }) => {
  const m = M();
  const draw = (k: number) => prog(t, P.on + 0.02 + k * 0.016, P.on + 0.36 + k * 0.016, EASE_INOUT);
  const rise = prog(t, P.a0 - 0.05, P.a1, EASE_INOUT);
  const line = 1 - prog(t, P.a0, P.a0 + 0.7);
  m.wall.emissive.set("#FFFFFF");
  m.wall.emissiveIntensity = 0.5 * line;
  m.cut.emissive.set("#FFFFFF");
  m.cut.emissiveIntensity = 0.6 * line;
  const aoMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0, alphaMap: wallAO(), depthWrite: false }), []);
  aoMat.opacity = 0.42 * rise;
  const wallMats = useMemo(() => [m.wall, m.wall, m.cut, m.wall, m.wall, m.wall], [m]);
  return (
    <group>
      {d.paredes.map((w: Parede, k) => {
        const [ax, az, bx, bz, kind] = w;
        const p = draw(k);
        if (p <= 0) return null;
        const L = Math.hypot(bx - ax, bz - az);
        const yaw = -Math.atan2(bz - az, bx - ax);
        const th = kind === 4 ? 0.15 : kind === 5 ? 0.05 : d.externas(w) ? TH_EXT : TH_INT;
        const Lp = L * p + (kind === 0 || kind === 4 ? th : 0);
        const cx = ax + (bx - ax) * p * 0.5;
        const cz = az + (bz - az) * p * 0.5;
        const hh = (full: number) => lerp(0.05, full, rise);
        return (
          <group key={k} position={[cx, 0, cz]} rotation={[0, yaw, 0]}>
            {kind === 0 || kind === 4 ? (
              <>
                <mesh position={[0, hh(kind === 4 ? 0.45 : H) / 2, 0]} geometry={wallGeo(Lp, hh(kind === 4 ? 0.45 : H), th)} material={wallMats} castShadow receiveShadow />
                {rise > 0.2 && kind === 0 ? <mesh position={[0, 0.04, 0]} geometry={wallGeo(Lp, 0.08, th + 0.024)} material={m.base} receiveShadow /> : null}
                {[1, -1].map((sd) => (
                  <mesh key={sd} position={[0, 0.007, sd * (th / 2 + 0.17)]} rotation={[-Math.PI / 2, 0, sd > 0 ? 0 : Math.PI]} material={aoMat}>
                    <planeGeometry args={[Lp, 0.34]} />
                  </mesh>
                ))}
              </>
            ) : kind === 1 ? (
              <>
                <mesh position={[0, hh(1.0) / 2, 0]} geometry={wallGeo(Lp, hh(1.0), th)} material={wallMats} castShadow receiveShadow />
                <mesh position={[0, hh(1.0) + (hh(H) - hh(1.0)) / 2, 0]} material={m.glass}>
                  <boxGeometry args={[Lp, Math.max(0.001, hh(H) - hh(1.0)), 0.03]} />
                </mesh>
                <mesh position={[0, hh(1.0) + 0.015, 0]} material={m.frame}>
                  <boxGeometry args={[Lp, 0.03, 0.06]} />
                </mesh>
              </>
            ) : kind === 2 ? (
              <>
                <mesh position={[0, hh(0.12) / 2, 0]} geometry={wallGeo(Lp, hh(0.12), 0.14)} material={wallMats} receiveShadow />
                <mesh position={[0, hh(1.05) / 2, 0]} material={m.glass}>
                  <boxGeometry args={[Lp, hh(1.05), 0.025]} />
                </mesh>
                <mesh position={[0, hh(1.05), 0]} material={m.frame}>
                  <boxGeometry args={[Lp, 0.04, 0.05]} />
                </mesh>
              </>
            ) : kind === 5 ? (
              <>
                {new Array(Math.max(1, Math.floor(Lp / 1.0)) + 1).fill(0).map((_, i, arr) => (
                  <mesh key={i} position={[-Lp / 2 + (i * Lp) / (arr.length - 1), hh(0.9) / 2, 0]} material={m.frame} castShadow>
                    <boxGeometry args={[0.06, hh(0.9), 0.06]} />
                  </mesh>
                ))}
                {[0.35, 0.8].map((y) => (
                  <mesh key={y} position={[0, hh(y), 0]} material={m.frame}>
                    <boxGeometry args={[Lp, 0.025, 0.03]} />
                  </mesh>
                ))}
              </>
            ) : (
              <>
                <mesh position={[0, hh(H) / 2, 0]} material={m.glass}>
                  <boxGeometry args={[Lp, hh(H), 0.03]} />
                </mesh>
                {[-0.5, -0.25, 0, 0.25, 0.5].map((f, i) => (
                  <mesh key={i} position={[f * Lp, hh(H) / 2, 0]} material={m.frame}>
                    <boxGeometry args={[0.04, hh(H), 0.06]} />
                  </mesh>
                ))}
                <mesh position={[0, 0.01, 0]} material={m.frame}>
                  <boxGeometry args={[Lp, 0.02, 0.08]} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
      {d.portas.map(([x, z, ang, wd], k) => {
        const sw = prog(t, P.portas + k * 0.08, P.portas + 0.55 + k * 0.08, EASE_INOUT);
        if (sw <= 0) return null;
        const a = ang - (1 - sw) * (Math.PI / 2) * (k % 2 ? -1 : 1);
        return (
          <group key={k} position={[x, 0, z]} rotation={[0, -a, 0]}>
            <B s={[wd, Math.min(H, 2.1) * sw, 0.04]} p={[wd / 2, 0, 0]} m={m.oak} r={0.008} />
          </group>
        );
      })}
    </group>
  );
};

/** traço de planta: paredes em linha dupla (como no desenho do arquiteto), desenhadas em sequência */
const tracoDa = (d: DadosPlanta) => {
  const pts: number[] = [];
  for (const w of d.paredes) {
    const [ax, az, bx, bz, kind] = w;
    const L = Math.hypot(bx - ax, bz - az);
    const dx = (bx - ax) / L;
    const dz = (bz - az) / L;
    const dupla = kind === 0 || kind === 1 || kind === 4;
    const th = dupla ? (kind === 4 ? 0.15 : d.externas(w) ? TH_EXT : TH_INT) : 0.04;
    const e = kind === 0 || kind === 4 ? th / 2 : 0;
    for (const sd of dupla ? [1, -1] : [0]) {
      const ox = -dz * sd * (th / 2);
      const oz = dx * sd * (th / 2);
      pts.push(ax - dx * e + ox, 0, az - dz * e + oz, bx + dx * e + ox, 0, bz + dz * e + oz);
    }
  }
  // divisões das áreas (terreno, quintal): o contorno de cada peça sem parede
  if (!d.paredes.some((w) => w[4] <= 3)) {
    for (const p of d.pecas) {
      const r = [[p.x0, p.z0], [p.x1, p.z0], [p.x1, p.z1], [p.x0, p.z1]];
      for (let i = 0; i < 4; i++) pts.push(r[i][0], 0, r[i][1], r[(i + 1) % 4][0], 0, r[(i + 1) % 4][1]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
};
const Blueprint: React.FC<{ t: number; P: InfoPlanta; d: DadosPlanta; forma: Forma }> = ({ t, P, d, forma }) => {
  const geo = useMemo(() => tracoDa(d), [d]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: col("#EEF3FF"), transparent: true, opacity: 1, toneMapped: false, depthWrite: false }), []);
  const n = geo.getAttribute("position").count;
  const dd = prog(t, P.on + 0.05, P.a0 + 0.1, EASE_INOUT);
  geo.setDrawRange(0, Math.floor((dd * n) / 2) * 2);
  mat.opacity = 0.95 * (1 - prog(t, P.a0 + 0.2, P.a1 - 0.1, EASE_INOUT)) + (forma === "terreno" ? 0.35 : 0);
  if (mat.opacity <= 0.01) return null;
  return <lineSegments geometry={geo} material={mat} position={[0, 0.02, 0]} />;
};

/** cotas douradas do terreno (linhas com marcas nas pontas), desenhadas junto com a área */
const Cotas: React.FC<{ t: number; P: InfoPlanta; d: DadosPlanta }> = ({ t, P, d }) => {
  const m = M();
  const p = prog(t, P.a0, P.a1, EASE_INOUT);
  if (p <= 0) return null;
  m.gold.opacity = p;
  const W0 = d.x1 - d.x0;
  const D0 = d.z1 - d.z0;
  return (
    <group position={[0, 0.03, 0]}>
      <mesh position={[d.x0 + (W0 * p) / 2, 0, d.z1 + 0.7]} material={m.gold}>
        <boxGeometry args={[W0 * p, 0.02, 0.05]} />
      </mesh>
      <mesh position={[d.x1 + 0.7, 0, d.z0 + (D0 * p) / 2]} material={m.gold}>
        <boxGeometry args={[0.05, 0.02, D0 * p]} />
      </mesh>
      {[[d.x0, d.z1 + 0.7, 0], [d.x1, d.z1 + 0.7, 0], [d.x1 + 0.7, d.z0, 1], [d.x1 + 0.7, d.z1, 1]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0, z]} rotation={[0, r ? Math.PI / 2 : 0, 0]} material={m.gold}>
          <boxGeometry args={[0.05, 0.02, 0.5]} />
        </mesh>
      ))}
    </group>
  );
};

/** pisos por peça: começam azul-planta e "materializam"; as peças ditas acendem com borda dourada */
const Floors: React.FC<{ t: number; P: InfoPlanta; d: DadosPlanta }> = ({ t, P, d }) => {
  const m = M();
  const mats = useMemo(
    () =>
      d.pecas.map((r) => {
        const w = r.x1 - r.x0;
        const dd = r.z1 - r.z0;
        if (r.floor === "water") return m.water;
        const base =
          r.floor === "wood"
            ? woodTex("oak2", [29, 42, 47])
            : r.floor === "deck"
              ? woodTex("deck2", [21, 42, 31], 40)
              : r.floor === "tile"
                ? tileTex("porc", "#D9D4CC", "#BDB5AA", 4)
                : r.floor === "grass"
                  ? gramaTex()
                  : r.floor === "concrete"
                    ? tileTex("conc", "#8E9196", "#7C7F84", 3)
                    : tileTex("marble", "#E8E5E0", "#C9C3BA", 6, true);
        const tx = base.clone();
        tx.needsUpdate = true;
        const per = r.floor === "tile" ? 3.6 : r.floor === "stone" ? 1.8 : r.floor === "grass" ? 4 : r.floor === "concrete" ? 3 : 2.4;
        tx.repeat.set(w / per, dd / per);
        return new THREE.MeshStandardMaterial({ map: tx, roughness: r.floor === "tile" || r.floor === "stone" ? 0.28 : r.floor === "grass" ? 0.95 : 0.5, metalness: 0, transparent: true, opacity: 0 });
      }),
    [d, m],
  );
  const glow = useMemo(() => d.pecas.map(() => new THREE.MeshBasicMaterial({ color: col("#E8C88A"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })), [d]);
  const edge = useMemo(() => d.pecas.map(() => new THREE.MeshBasicMaterial({ color: col("#E9CF98").multiplyScalar(1.4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false })), [d]);
  const mat = prog(t, P.a0 + 0.1, P.a1 + 0.2, EASE_INOUT);
  const dim = P.fimPreco ? prog(t, P.fimPreco - 0.1, P.fimPreco + 0.5, EASE_INOUT) : 0;
  return (
    <group>
      {d.pecas.map((r, i) => {
        mats[i].opacity = mat;
        let on = 0;
        for (const a of P.acesos) if (a.id === r.id) on = Math.max(on, prog(t, a.em - 0.08, a.em + 0.35, EASE_OUT));
        on *= 1 - dim * 0.6;
        glow[i].opacity = on * 0.16;
        edge[i].opacity = on;
        const w = r.x1 - r.x0;
        const dd = r.z1 - r.z0;
        const cx = (r.x0 + r.x1) / 2;
        const cz = (r.z0 + r.z1) / 2;
        const e = 0.16;
        const agua = r.floor === "water";
        return (
          <group key={r.id}>
            {agua ? (
              <>
                <mesh position={[cx, 0.012, cz]} rotation={[-Math.PI / 2, 0, 0]} material={mats[i]}>
                  <planeGeometry args={[w, dd]} />
                </mesh>
                {mat > 0.01
                  ? [
                      [cx, r.z0 - 0.1, w + 0.4, 0.2],
                      [cx, r.z1 + 0.1, w + 0.4, 0.2],
                      [r.x0 - 0.1, cz, 0.2, dd],
                      [r.x1 + 0.1, cz, 0.2, dd],
                    ].map(([x, z, ww, d2], j) => <B key={j} s={[ww, 0.06 * mat, d2]} p={[x, 0, z]} m={m.coping} r={0.01} />)
                  : null}
              </>
            ) : (
              <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]} material={mats[i]} receiveShadow renderOrder={-1}>
                <planeGeometry args={[w, dd]} />
              </mesh>
            )}
            {on > 0.001 ? (
              <>
                <mesh position={[cx, 0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} material={glow[i]}>
                  <planeGeometry args={[w - 0.1, dd - 0.1]} />
                </mesh>
                {[
                  [cx, r.z0 + e, w - 2 * e, 0.035],
                  [cx, r.z1 - e, w - 2 * e, 0.035],
                  [r.x0 + e, cz, 0.035, dd - 2 * e],
                  [r.x1 - e, cz, 0.035, dd - 2 * e],
                ].map(([x, z, ww, d2], j) => (
                  <mesh key={j} position={[x, 0.022, z]} rotation={[-Math.PI / 2, 0, 0]} material={edge[i]}>
                    <planeGeometry args={[ww, d2]} />
                  </mesh>
                ))}
              </>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/* ---------- mobília da forma ---------- */
const Mobilia: React.FC<{ t: number; P: InfoPlanta; forma: Forma }> = ({ t, P, forma }) => {
  const st = (k: number) => P.moveis + k * 0.045;
  const lampOn = prog(t, P.luz, P.luz + 0.6);
  let k = 0;
  const n = () => st(k++);
  if (forma === "terreno") return <group>{terrenoPecas(n)}</group>;
  if (forma === "sala")
    return (
      <group>
        {salaOpen(n)}
        {cozinha(n, lampOn)}
        {salaRecepcao(n)}
        {salaReuniao(n)}
        {salaDiretoria(n, lampOn)}
        {banhos(n, lampOn)}
      </group>
    );
  return (
    <group>
      {estar(n, lampOn)}
      {cozinha(n, lampOn)}
      {varanda(n, lampOn)}
      {suite1(n, lampOn)}
      {suite2(n, lampOn)}
      {banhos(n, lampOn)}
      {forma === "casa" ? casaExtras(n) : null}
    </group>
  );
};

/* ---------- conjunto: laje + pisos + paredes + móveis ---------- */
export const Planta3D: React.FC<{ t: number; P: InfoPlanta }> = ({ t, P }) => {
  const m = M();
  const forma: Forma = P.m.forma ?? "apartamento";
  const d = DADOS[forma];
  const { pm, cx, cz } = escalaDa(d);
  const under = useMemo(() => new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.7, alphaMap: softRect(), depthWrite: false }), []);
  const lift = prog(t, P.on, P.on + 0.5, EASE_OUT);
  under.opacity = 0.75 * lift;
  m.slab.color.set("#15284D").lerp(col("#131B2A"), prog(t, P.a0, P.a1 + 0.2, EASE_INOUT));
  m.water.opacity = 0.92 * prog(t, P.a0 + 0.1, P.a1 + 0.2, EASE_INOUT);
  const W0 = d.x1 - d.x0;
  const D0 = d.z1 - d.z0;
  return (
    <group>
      <mesh position={[0, 0.006, 0.15]} rotation={[-Math.PI / 2, 0, 0]} material={under}>
        <planeGeometry args={[W0 * pm * 1.6, D0 * pm * 1.6]} />
      </mesh>
      <group position={[-cx * pm, PLAN_Y, -cz * pm]} scale={[pm, pm, pm]}>
        <mesh position={[cx, -0.16, cz]} material={m.slab} receiveShadow castShadow>
          <boxGeometry args={[W0 + 0.5, 0.3, D0 + 0.5]} />
        </mesh>
        <Floors t={t} P={P} d={d} />
        <Blueprint t={t} P={P} d={d} forma={forma} />
        <Walls t={t} P={P} d={d} />
        {forma === "terreno" ? <Cotas t={t} P={P} d={d} /> : null}
        <Mobilia t={t} P={P} forma={forma} />
      </group>
    </group>
  );
};
