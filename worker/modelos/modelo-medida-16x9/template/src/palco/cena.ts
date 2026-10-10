import * as THREE from "three";
import { random } from "remotion";
import { H, LEGENDA_CHEIA, LEGENDA_CORPO, MARGEM, PALCO, W, rostoNaTelaAgora, videoParaTela } from "../layout";
import type { Maos, Medida, Objeto, ObjetoMomento, Plano } from "../plano";
import { EASE_INOUT, EASE_OUT, chaves, clamp01, lerp, prog } from "../tema";

/* A cena do Medida: tudo o que é função do tempo e precisa ser IGUAL no 3D e no 2D (poses, níveis,
   contadores). Os tempos vêm dos campos do momento (as palavras ditas).

   Versão deitada (16:9). O palco foi desenhado no papel do vertical (x 72 a 1008, y 150 a 820, com
   1 unidade = 200 px). Aqui o MESMO desenho vai para o quadro da esquerda (layout.PALCO), numa escala
   só (ESCALA_DA_CENA, ~1,09) e centrado nele. Por isso há dois sistemas de px:
   - a CENA: as posições do desenho do vertical (as constantes daqui e os rótulos de Rotulos.tsx);
   - a TELA: px do quadro 1920×1080 (o 3D, o objeto no peito, a moldura, a legenda).
   `cenaNaTela` e `telaNaCena` levam de um para o outro. Mundo 3D: câmera quase ortográfica, origem
   no centro do quadro, 1 unidade = PXU px de tela no plano z = 0; a câmera fica à mesma distância
   do vertical (24,7 unidades), então a perspectiva dos objetos é a mesma. */
const PAPEL_DA_CENA = { x: 72, y: 150, w: 936, h: 670 };
export const ESCALA_DA_CENA = Math.min(PALCO.w / PAPEL_DA_CENA.w, PALCO.h / PAPEL_DA_CENA.h);
const CENA_X = PALCO.x + (PALCO.w - PAPEL_DA_CENA.w * ESCALA_DA_CENA) / 2 - PAPEL_DA_CENA.x * ESCALA_DA_CENA;
const CENA_Y = PALCO.y + (PALCO.h - PAPEL_DA_CENA.h * ESCALA_DA_CENA) / 2 - PAPEL_DA_CENA.y * ESCALA_DA_CENA;
/** px da cena (o desenho do vertical) → px de tela */
export const cenaNaTela = (x: number, y: number) => ({ x: CENA_X + x * ESCALA_DA_CENA, y: CENA_Y + y * ESCALA_DA_CENA });
/** px de tela → px da cena */
export const telaNaCena = (x: number, y: number) => ({ x: (x - CENA_X) / ESCALA_DA_CENA, y: (y - CENA_Y) / ESCALA_DA_CENA });
/** a transformação CSS que desenha a cena (posições do vertical) no lugar dela na tela */
export const TRANSFORMA_CENA = `translate(${CENA_X}px, ${CENA_Y}px) scale(${ESCALA_DA_CENA})`;

export const PXU = 200 * ESCALA_DA_CENA;
export const toWorld = (x: number, y: number) => ({ x: (x - W / 2) / PXU, y: (H / 2 - y) / PXU });
export const toPx = (wx: number, wy: number) => ({ x: W / 2 + wx * PXU, y: H / 2 - wy * PXU });
// a câmera dos canvas 3D (palco e gráfico): no vertical era fov 22 num quadro de 1920 de altura
const DISTANCIA = 24.7;
export const TELA_3D = { largura: W, altura: H };
export const CAMERA = {
  fov: (2 * Math.atan(H / 2 / PXU / DISTANCIA) * 180) / Math.PI,
  position: [0, 0, DISTANCIA] as [number, number, number],
  near: 0.1,
  far: 100,
};

export const TABLE_Y = cenaNaTela(0, 724).y; // linha da "mesa" (base dos objetos), px de tela
export const PITCH = 0.2; // objetos vistos levemente de cima
export const GLASS_X = cenaNaTela(470, 0).x; // px de tela
export const GLASS_S = 1.1;
export const BASE_IN = 0.17; // fundo interno do recipiente (local)
const HERO_X = cenaNaTela(318, 0).x;
const REST_X = cenaNaTela(170, 0).x;
// sem copo, o objeto descansa no meio do lado esquerdo do papel
const SOLO_X = cenaNaTela(330, 0).x;

// ---------- objetos: altura do modelo (unidades), boca para despejar, escala de normalização ----------
export const OBJ = {
  lata: { h: 1.185, k: 1, boca: new THREE.Vector3(0, 1.16, 0.165), despeja: true },
  garrafa: { h: 1.62, k: 0.82, boca: new THREE.Vector3(0, 1.62, 0), despeja: true },
  caixa: { h: 1.2, k: 0.98, boca: new THREE.Vector3(0, 1.2, 0), despeja: false },
  pote: { h: 1.02, k: 1.05, boca: new THREE.Vector3(0, 1.02, 0), despeja: false },
} as const;
export const alturaObjeto = (o: Objeto) => OBJ[o.forma].h;

// ---------- unidades ----------
export const UNI = {
  sache: { w: 0.84, t: 0.11, d: 0.55, camada: 1, L: 0.122, Lr: 0.016 },
  moeda: { w: 0.72, t: 0.07, d: 0.72, camada: 1, L: 0.074, Lr: 0.008 },
  cubo: { w: 0.4, t: 0.4, d: 0.4, camada: 2, L: 0.4, Lr: 0.01 },
  comprimido: { w: 0.56, t: 0.24, d: 0.24, camada: 2, L: 0.25, Lr: 0.01 },
} as const;

export const G = 58; // gravidade (unid/s²)
const V0 = 2.6;
const Y0 = 4.9; // altura de nascimento (local do recipiente), acima da borda do quadro

export type Unidade = {
  t0: number;
  tl: number;
  xr: number;
  zr: number;
  yr: number;
  xs: number;
  zs: number;
  rx: number;
  ry: number;
  rz: number;
  ax: number;
  ay: number;
  az: number;
  top: number;
};

export type Tempos = {
  de: number;
  ate: number;
  lata: number;
  refri: number;
  tem: number;
  trinta: number;
  contaFim: number;
  gramas: number;
  acucar: number;
  sete: number;
  saches: number;
  detalhe: number;
  ideal: number;
  oms: number;
  menos: number;
  vinte: number;
  uma2: number;
  ultra: number;
  limite: number;
  // quando o recipiente aparece (as unidades ou a linha, o que vier antes)
  copo: number;
};

export type Cena = {
  plano: Plano;
  m: Medida | ObjetoMomento;
  T: Tempos;
  objeto?: Objeto;
  temCopo: boolean;
  recipiente: "copo" | "pote";
  forma: keyof typeof UNI;
  escalaUni: number;
  unidades: Unidade[];
  LINE_H: number | null;
  FULL_H: number;
  passa: boolean;
  despeja: boolean;
  POUR_IN: number;
  POUR_ON: number;
  POUR_OFF: number;
  LEVEL_END: number;
  T_OPEN: number;
  maos?: Maos;
};

const cache = new WeakMap<object, Cena>();

export const montarCena = (plano: Plano, m: Medida | ObjetoMomento): Cena => {
  const g = cache.get(m);
  if (g) return g;
  const ob = m.objeto;
  const lata = ob ? ob.em : m.de;
  const refri = ob ? (ob.rotuloEm ?? lata + 0.36) : lata;
  const tem = Math.max(m.de, m.palcoEm ?? (ob ? ob.em + 1.2 : m.de));
  const md = m.tipo === "medida" ? m : null;
  const q = md?.quantidade;
  const trinta = q?.em ?? tem + 0.25;
  const gramas = q?.sufixoEm ?? trinta + 0.66;
  const contaFim = q?.sufixoEm !== undefined ? q.sufixoEm - 0.06 : trinta + 0.66;
  const acucar = q?.rotuloEm ?? gramas + 0.3;
  const sete = md ? md.unidades.em : m.ate + 10;
  const saches = md?.unidades.rotuloEm ?? sete + 0.34;
  const detalhe = md?.unidades.detalheEm ?? saches + 0.14;
  const ref = md?.referencia;
  const ideal = ref?.em ?? m.ate + 10;
  const oms = ref?.fonteEm ?? ideal + 0.6;
  const vinte = ref?.valorEm ?? (ref?.prefixoEm !== undefined ? ref.prefixoEm + 0.3 : ideal + 1.2);
  const menos = ref?.prefixoEm ?? vinte;
  const ultra = md?.passou?.em ?? m.ate + 10;
  const uma2 = md?.passou?.despejarEm ?? ultra - 0.9;
  const limite = Math.min(ultra + 0.68, m.ate);
  const copo = Math.min(sete, ideal);
  const T: Tempos = { de: m.de, ate: m.ate, lata, refri, tem, trinta, contaFim, gramas, acucar, sete, saches, detalhe, ideal, oms, menos, vinte, uma2, ultra, limite, copo };

  // unidades: pilha determinística
  const forma = md?.unidades.forma ?? "sache";
  const U = UNI[forma];
  const n = md ? Math.max(1, Math.min(12, Math.round(md.unidades.numero))) : 0;
  const camadas = Math.ceil(n / U.camada);
  const alturaBruta = camadas * (U.L + U.Lr / 2);
  const escalaUni = Math.min(1, 1.3 / Math.max(0.01, alturaBruta));
  const semente = forma === "sache" ? "g4-sache" : `medida-${forma}`;
  const r = (i: number, k: string) => random(`${semente}-${i}-${k}`);
  const unidades: Unidade[] = [];
  let h = BASE_IN;
  for (let c = 0; c < camadas; c++) {
    const L = (U.L + r(c, "L") * U.Lr) * escalaUni;
    for (let s = 0; s < U.camada; s++) {
      const i = c * U.camada + s;
      if (i >= n) break;
      const yr = h + L / 2;
      const t0 = sete - 0.32 + i * 0.115;
      const tl = t0 + (-V0 + Math.sqrt(V0 * V0 + 2 * G * (Y0 - yr))) / G;
      const lado = U.camada === 2 ? (s === 0 ? -1 : 1) * 0.22 * escalaUni : 0;
      unidades.push({
        t0,
        tl,
        yr,
        top: h + L,
        xr: lado + (r(i, "x") - 0.5) * (forma === "sache" ? 0.16 : 0.1),
        zr: (r(i, "z") - 0.5) * 0.12,
        xs: (r(i, "xs") - 0.5) * 1.1,
        zs: (r(i, "zs") - 0.5) * 0.4,
        rx: (r(i, "rx") - 0.5) * 0.12,
        ry: r(i, "ry") * Math.PI,
        rz: (r(i, "rz") - 0.5) * 0.12,
        ax: (r(i, "ax") - 0.5) * 3.2,
        ay: (r(i, "ay") - 0.5) * 2.0,
        az: (r(i, "az") > 0.5 ? 1 : -1) * (1.8 + r(i, "azm") * 1.6),
      });
    }
    h += L;
  }
  const FULL_H = unidades.length ? unidades[unidades.length - 1].top : BASE_IN + 0.6;
  // altura (local) de u unidades (u pode ser fracionário)
  const alturaDe = (u: number) => {
    // acima da pilha (meta que não foi atingida): continua com a altura média de uma camada
    if (u > n) return Math.min(1.5, FULL_H + ((u - n) / U.camada) * ((FULL_H - BASE_IN) / Math.max(1, camadas)));
    const uu = Math.max(0, Math.min(n, u));
    const c = uu / U.camada;
    const ci = Math.floor(c);
    const base = ci === 0 ? BASE_IN : unidades[Math.min(unidades.length - 1, ci * U.camada - 1)].top;
    if (ci >= camadas) return FULL_H;
    const topo = unidades[Math.min(unidades.length - 1, ci * U.camada)].top;
    return base + (topo - base) * (c - ci);
  };
  let LINE_H: number | null = null;
  if (md?.referencia) {
    let u = md.referencia.unidades;
    if (u === undefined) {
      if (md.referencia.valor !== undefined && q?.valor) u = (n * md.referencia.valor) / q.valor;
      // sem quantidade, o valor da referência é contado em unidades ("o máximo são 4 comprimidos")
      else if (md.referencia.valor !== undefined) u = md.referencia.valor;
      else u = n * 0.7;
    }
    LINE_H = alturaDe(u);
  }
  const passa = !!md?.passou && LINE_H !== null && FULL_H > LINE_H + 0.01;
  const despeja = !!(passa && ob && OBJ[ob.forma].despeja && md?.passou?.despejarEm !== undefined);

  // líquido: a lata/garrafa despeja no copo; o nível cruza a linha exatamente em `passou.em`
  const POUR_IN = uma2 - 0.02;
  const POUR_ON = uma2 + 0.36;
  const frac = LINE_H !== null ? (LINE_H - BASE_IN) / Math.max(0.01, FULL_H - BASE_IN) : 0.7;
  const LEVEL_END = despeja ? POUR_ON + (ultra - POUR_ON) / Math.max(0.2, frac) : ultra + 0.6;
  const POUR_OFF = LEVEL_END - 0.06;

  const cena: Cena = {
    plano,
    m,
    T,
    objeto: ob,
    temCopo: !!md,
    recipiente: md?.recipiente ?? "copo",
    forma,
    escalaUni,
    unidades,
    LINE_H,
    FULL_H,
    passa,
    despeja,
    POUR_IN,
    POUR_ON,
    POUR_OFF,
    LEVEL_END,
    T_OPEN: tem + 0.62,
    maos: plano.maos,
  };
  cache.set(m, cena);
  return cena;
};

/** estado de uma unidade (coordenadas locais do recipiente) ou null antes de nascer */
export const unidadeAt = (c: Cena, i: number, t: number) => {
  const s = c.unidades[i];
  if (t < s.t0) return null;
  let x: number, y: number, z: number, rx: number, ry: number, rz: number;
  if (t < s.tl) {
    const tau = t - s.t0;
    const f = tau / (s.tl - s.t0);
    y = Y0 - V0 * tau - 0.5 * G * tau * tau;
    const k0 = EASE_OUT(clamp01(f * 1.3));
    x = lerp(s.xr + s.xs, s.xr, k0);
    z = lerp(s.zr + s.zs, s.zr, k0);
    const k = Math.pow(1 - f, 1.15);
    rx = s.rx + s.ax * k;
    ry = s.ry + s.ay * k;
    rz = s.rz + s.az * k;
  } else {
    const u = t - s.tl;
    y = s.yr + 0.07 * c.escalaUni * Math.exp(-11 * u) * Math.abs(Math.sin(17 * u));
    x = s.xr + 0.012 * Math.exp(-9 * u) * Math.sin(23 * u);
    z = s.zr;
    rx = s.rx + 0.16 * Math.exp(-10 * u) * Math.sin(21 * u);
    ry = s.ry;
    rz = s.rz - Math.sign(s.az) * 0.22 * Math.exp(-9 * u) * Math.sin(19 * u + 0.6);
    // quem cai em cima empurra a pilha um tiquinho
    for (let j = i + 1; j < c.unidades.length; j++) {
      const v = t - c.unidades[j].tl;
      if (v > 0) y -= 0.016 * Math.exp(-16 * v) * Math.sin(30 * v);
    }
  }
  return { x, y, z, rx, ry, rz };
};
/** quantas unidades já pousaram */
export const pousadas = (c: Cena, t: number) => c.unidades.filter((s) => t >= s.tl).length;

/** nível (local do recipiente): com despejo, o líquido; sem, o marcador que sobe da linha ao topo */
export const nivelAt = (c: Cena, t: number) => {
  const L = c.LINE_H ?? BASE_IN;
  if (c.despeja) {
    if (t <= c.POUR_ON + 0.05) return BASE_IN;
    return chaves(t, [
      [c.POUR_ON + 0.05, BASE_IN],
      [c.T.ultra, L],
      [c.LEVEL_END, c.FULL_H],
    ], (x) => x);
  }
  return chaves(t, [
    [c.T.ultra - 0.02, L],
    [c.T.ultra + 0.6, c.FULL_H],
  ], EASE_OUT);
};
/** quantidade mostrada pelo nível (a quantidade × fração do recipiente) */
export const nivelValor = (c: Cena, t: number) => {
  const md = c.m.tipo === "medida" ? c.m : null;
  const total = md?.quantidade?.valor ?? 0;
  return total * clamp01((nivelAt(c, t) - BASE_IN) / Math.max(0.01, c.FULL_H - BASE_IN));
};
export const vermelhoAt = (c: Cena, t: number) => (c.passa ? prog(t, c.T.ultra - 0.03, c.T.ultra + 0.22) : 0);

/* ---------------- recipiente ---------------- */
export const PERFIL = {
  copo: {
    pontos: [
      [0.0, 0.0],
      [0.6, 0.0],
      [0.672, 0.008],
      [0.698, 0.04],
      [0.702, 0.08],
      [0.8, 1.6],
      [0.799, 1.612],
      [0.79, 1.62],
      [0.78, 1.617],
      [0.773, 1.605],
      [0.672, 0.22],
      [0.66, 0.188],
      [0.63, 0.174],
      [0.0, BASE_IN],
    ] as Array<[number, number]>,
    interno: (y: number) => 0.672 + ((0.773 - 0.672) * (y - 0.22)) / (1.605 - 0.22),
    externo: (y: number) => 0.7 + 0.1 * (y / 1.62),
    borda: 1.62,
  },
  pote: {
    pontos: [
      [0.0, 0.0],
      [0.74, 0.0],
      [0.8, 0.02],
      [0.83, 0.07],
      [0.84, 0.14],
      [0.84, 1.32],
      [0.8, 1.42],
      [0.74, 1.47],
      [0.75, 1.56],
      [0.74, 1.585],
      [0.71, 1.585],
      [0.7, 1.56],
      [0.7, 1.46],
      [0.77, 1.4],
      [0.79, 1.32],
      [0.79, 0.22],
      [0.77, 0.19],
      [0.72, 0.174],
      [0.0, BASE_IN],
    ] as Array<[number, number]>,
    interno: (y: number) => (y > 1.32 ? 0.72 : 0.79),
    externo: (y: number) => (y > 1.32 ? 0.8 : 0.84),
    borda: 1.585,
  },
};
export const perfilDe = (c: Cena) => PERFIL[c.recipiente];

export const copoAt = (c: Cena, t: number) => {
  const a = prog(t, c.T.copo - 0.14, c.T.copo + 0.26, EASE_OUT);
  const w = toWorld(GLASS_X, TABLE_Y);
  return { a, x: w.x + (1 - a) * 0.7, y: w.y - (1 - a) * 0.2, s: GLASS_S * (0.94 + 0.06 * a) };
};
/** ponto local do recipiente → tela (px), já assentado */
export const copoPx = (c: Cena, lx: number, ly: number, lz = 0) => {
  const g = copoAt(c, 1e9);
  const wy = g.y + g.s * (ly * Math.cos(PITCH) - lz * Math.sin(PITCH));
  return toPx(g.x + g.s * lx, wy);
};

/* ---------------- objeto ---------------- */
export type Pose = { vis: number; x: number; y: number; z: number; s: number; spin: number; tilt: number; pitch: number; tab: number; hole: number; shadow: number };
const S_HAND = 1.42;
const S_HERO = 1.68;
const S_REST = 1.02;

/** onde o objeto fica no peito: o meio das mãos (rastreio) ou o ponto de entrega */
const maosNoTempo = (c: Cena, t: number): { x: number; y: number } | null => {
  const m = c.maos;
  if (!m || !m.x?.length) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let k = -4; k <= 4; k++) {
    const tt = t + k / 30;
    const i = Math.round(tt / m.passo);
    const x = m.x[i];
    const y = m.y[i];
    if (x === null || y === null || x === undefined || y === undefined) continue;
    const p = videoParaTela(c.plano, x, y, tt);
    sx += p.x;
    sy += p.y;
    n++;
  }
  return n ? { x: sx / n, y: sy / n } : null;
};
// O objeto nas mãos tem o tamanho do rosto, como no vertical (lá, ~1 largura de rosto de altura).
// No 16:9 o rosto é bem menor na tela, então a escala na mão sai da largura do rosto, não do PXU.
const ROSTO_DO_VERTICAL = (0.32 * 1080) / 200; // largura do rosto do exemplo vertical, em unidades
const escalaNaMao = (c: Cena, t: number) => {
  const r = rostoNaTelaAgora(c.plano, t);
  return S_HAND * escalaObj(c) * Math.max(0.45, Math.min(1.1, r.largura / PXU / ROSTO_DO_VERTICAL));
};
export const pontoDeEntrega = (c: Cena, t: number) => {
  const r = rostoNaTelaAgora(c.plano, t);
  const h = objHpx(c, escalaNaMao(c, t), 0.12);
  // no peito, abaixo do queixo, e acima da faixa da legenda (área segura de baixo); no meio do quadro
  const yMax = LEGENDA_CHEIA.y - LEGENDA_CORPO * 0.7 - 32 - h / 2;
  const yMin = Math.min(yMax, r.y + r.largura * 0.75 + h / 2);
  const xMin = MARGEM + W * 0.22;
  const xMax = W - MARGEM - W * 0.22;
  const mm = maosNoTempo(c, t);
  if (mm) return { x: Math.max(xMin, Math.min(xMax, mm.x)), y: Math.max(yMin, Math.min(yMax, mm.y - 0.71 * h)) };
  // sem rastreio de mãos: à altura do peito, no eixo do rosto, dentro do quadro
  return {
    x: Math.max(xMin, Math.min(xMax, r.x + 10 * Math.sin(t * 1.3))),
    y: Math.max(yMin, Math.min(yMax, r.y + r.largura * 1.55 + 14 * Math.sin(t * 1.9))),
  };
};

const escalaObj = (c: Cena) => (c.objeto ? OBJ[c.objeto.forma].k * Math.min(1, 1.22 / OBJ[c.objeto.forma].h) : 1);
const objHpx = (c: Cena, s: number, pitch: number) => (c.objeto ? OBJ[c.objeto.forma].h : 1.2) * s * PXU * Math.cos(pitch);
const baseDoCentro = (c: Cena, cx: number, cy: number, s: number, pitch: number) => toWorld(cx, cy + objHpx(c, s, pitch) / 2);

export const bocaNoMundo = (c: Cena, p: { x: number; y: number; z: number; s: number; spin: number; tilt: number; pitch: number }) => {
  const b = c.objeto ? OBJ[c.objeto.forma].boca : OBJ.lata.boca;
  const v = b.clone().multiplyScalar(p.s);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), p.spin);
  v.applyAxisAngle(new THREE.Vector3(0, 0, 1), p.tilt);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), p.pitch);
  return { x: p.x + v.x, y: p.y + v.y, z: p.z + v.z };
};
const poseDescanso = (c: Cena) => {
  const w = toWorld(REST_X, TABLE_Y);
  return { x: w.x, y: w.y, z: 0, s: S_REST * escalaObj(c), spin: -0.42, tilt: 0, pitch: PITCH };
};
const posePeDespejo = (c: Cena, t: number) => {
  const garrafa = c.objeto?.forma === "garrafa";
  const t0 = garrafa ? -2.05 : -1.76;
  const tilt = lerp(t0, t0 - 0.19, prog(t, c.POUR_ON, c.POUR_OFF, EASE_INOUT));
  const base = { x: 0, y: 0, z: 0.6, s: S_REST * escalaObj(c), spin: Math.PI / 2, tilt, pitch: PITCH };
  const m = bocaNoMundo(c, base);
  const perfil = perfilDe(c);
  const alvo = copoPx(c, -perfil.interno(perfil.borda) * 0.57, perfil.borda + 0.04, 0);
  const w = toWorld(alvo.x, alvo.y);
  return { ...base, x: w.x - m.x, y: w.y - m.y };
};

export const objetoAt = (c: Cena, t: number): Pose => {
  const T = c.T;
  const k = escalaObj(c);
  const vis = prog(t, T.lata - 0.06, T.lata + 0.3, EASE_OUT);
  const ehLata = c.objeto?.forma === "lata";
  const nod = ehLata
    ? chaves(t, [
        [c.T_OPEN - 0.32, 0],
        [c.T_OPEN - 0.04, 1],
        [c.T_OPEN + 0.55, 1],
        [c.T_OPEN + 0.95, 0],
      ])
    : 0;
  const tab = ehLata
    ? chaves(t, [
        [c.T_OPEN - 0.02, 0],
        [c.T_OPEN + 0.1, 1.15],
        [c.T_OPEN + 0.34, 0.3],
      ])
    : 0;
  const hole = ehLata ? prog(t, c.T_OPEN + 0.02, c.T_OPEN + 0.12) : 0;
  // 1) no peito, gira até mostrar o rótulo
  const spinIn = lerp(-2.7, 0, EASE_OUT(clamp01((t - (T.lata - 0.06)) / Math.max(0.2, T.refri + 0.4 - T.lata)))) + 0.07 * Math.sin(t * 2.3);
  if (t < T.tem) {
    const p0 = pontoDeEntrega(c, t);
    const s = escalaNaMao(c, t) * (0.35 + 0.65 * vis);
    const b = baseDoCentro(c, p0.x, p0.y, s, 0.12);
    return { vis, x: b.x, y: b.y, z: 0.4, s, spin: spinIn, tilt: 0.06 * Math.sin(t * 1.7), pitch: 0.12, tab: 0, hole: 0, shadow: 0 };
  }
  // 2) voo até o papel da esquerda (por baixo do rosto, num arco raso) com um giro completo
  const f = prog(t, T.tem, T.tem + 0.54, EASE_INOUT);
  const c0 = pontoDeEntrega(c, T.tem - 1 / 30);
  const sHero = S_HERO * k;
  const heroH = objHpx(c, sHero, PITCH);
  const c2 = { x: c.temCopo ? HERO_X : SOLO_X, y: TABLE_Y - heroH / 2 };
  const c1 = { x: (c0.x + c2.x) / 2, y: Math.max(c0.y, c2.y) + 90 };
  const bx = (1 - f) * (1 - f) * c0.x + 2 * f * (1 - f) * c1.x + f * f * c2.x;
  const by = (1 - f) * (1 - f) * c0.y + 2 * f * (1 - f) * c1.y + f * f * c2.y;
  let s = lerp(escalaNaMao(c, T.tem - 1 / 30), sHero, f);
  const pitch = lerp(0.12, PITCH, f) + nod * 0.3;
  // no papel, sem copo: o objeto segue girando devagar (nunca parado)
  const deriva = c.temCopo ? 0.22 * Math.sin((t - T.tem) * 0.9) * f : 0.35 * Math.sin((t - T.tem) * 0.7) * f;
  let spin = spinIn + f * Math.PI * 2 - 0.34 * EASE_INOUT(f) + deriva;
  const tilt = Math.sin(f * Math.PI) * 0.22;
  const p = baseDoCentro(c, bx, by, s, pitch);
  let x = p.x;
  let y = p.y;
  const z = lerp(0.4, 0, f);
  // 3) ao lado do recipiente (quando as unidades começam)
  const g = c.temCopo ? prog(t, T.copo - 0.34, T.copo + 0.12, EASE_INOUT) : 0;
  if (g > 0) {
    const rp = poseDescanso(c);
    x = lerp(x, rp.x, g);
    y = lerp(y, rp.y, g);
    s = lerp(s, rp.s, g);
    spin = lerp(spin, rp.spin, g);
  }
  const shadow = prog(t, T.tem + 0.4, T.tem + 0.56);
  // 4) despeja no copo
  if (c.despeja) {
    const pin = prog(t, c.POUR_IN, c.POUR_ON - 0.02, EASE_INOUT);
    const pout = prog(t, c.POUR_OFF + 0.02, c.POUR_OFF + 0.42, EASE_INOUT);
    const w = pin * (1 - pout);
    if (w > 0) {
      const rp = poseDescanso(c);
      const pp = posePeDespejo(c, t);
      const lift = Math.sin(w * Math.PI) * 0.25;
      return {
        vis,
        x: lerp(rp.x, pp.x, w),
        y: lerp(rp.y, pp.y, w) + lift,
        z: lerp(0, pp.z, w),
        s: rp.s,
        spin: lerp(rp.spin, pp.spin, w),
        tilt: lerp(0, pp.tilt, w),
        pitch: PITCH,
        tab: ehLata ? 0.3 : 0,
        hole: ehLata ? 1 : 0,
        shadow: 1 - Math.min(1, w * 3),
      };
    }
  }
  return { vis, x, y, z, s, spin, tilt, pitch, tab, hole, shadow };
};
export const bocaAgora = (c: Cena, t: number) => bocaNoMundo(c, objetoAt(c, t));
/** altura do objeto em px na tela para uma pose */
export const alturaPx = (c: Cena, s: number) => (c.objeto ? OBJ[c.objeto.forma].h : 1.2) * s * PXU;
