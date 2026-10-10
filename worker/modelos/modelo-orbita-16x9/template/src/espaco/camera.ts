// A câmera do espaço: uma só fonte de verdade para o 3D e para os textos presos aos corpos.
//
// Os momentos que acontecem no espaço (a órbita, o céu e os blocos universais) formam "janelas":
// momentos seguidos (com menos de JUNTA s entre eles) ficam no mesmo espaço. Cada momento de uma
// janela é uma "estação": o mesmo cenário local (câmera em z = 20 olhando a origem), empilhado
// SUBIDA unidades acima da estação anterior. Na troca de momento a câmera sobe até a estação nova
// (a grua do "olhar pro céu"): o momento que sai desce para fora do quadro, o novo entra por cima
// e as estrelas passam. Dentro da órbita, a câmera recua (ou mergulha) pela escala.
//
// No 16:9 a câmera continua a mesma do vertical (FOV 30, quadro 1080×1920): os blocos e os corpos
// moram nas coordenadas desse quadro, o PALCO (tema.ts). `projetar` e `daTela` falam em px do
// palco. Só o canvas 3D vê mais: a câmera dele desenha a janela do palco que cai no quadro deitado
// (setViewOffset), com o palco no lugar e na escala do quadro da explicação. Mesma perspectiva,
// mesma composição, e as estrelas cobrem o quadro inteiro.
import * as THREE from "three";
import { Easing } from "remotion";
import type { Momento, Plano } from "../plano";
import { EASE_INOUT, H, PALCO, W, clamp01, lerp } from "../tema";

export const FOV = 30;
// o quadro do palco (as medidas do vertical)
export const ASPECT = PALCO.w / PALCO.h;
export const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
export const SUBIDA = 9;
export const JUNTA = 2.5;
// a grua entre estações
export const GRUA_ANTES = 0.06;
export const GRUA = 0.85;

export const TIPOS_ESPACO = new Set([
  "orbita",
  "ceu",
  "abertura",
  "topicos",
  "passos",
  "numero",
  "comparacao",
  "grafico",
  "destaque",
  "definicao",
  "frase",
  "pergunta",
  "cta",
]);

export type Estacao = {
  m: Momento;
  // posição na janela (0 = a primeira) e a base da estação no mundo
  k: number;
  base: THREE.Vector3;
  de: number;
  ate: number;
  // até quando os corpos desta estação podem aparecer (a grua seguinte termina)
  fim: number;
  // a câmera olha um pouco mais para baixo (o conteúdo sobe) quando a pessoa está na moldura
  descer: number;
};
export type Janela = { de: number; ate: number; estacoes: Estacao[] };

const guardadas = new WeakMap<Plano, Janela[]>();
export const janelasDo = (plano: Plano): Janela[] => {
  const pronto = guardadas.get(plano);
  if (pronto) return pronto;
  const ms = plano.momentos.filter((m) => TIPOS_ESPACO.has(m.tipo)).sort((a, b) => a.de - b.de);
  const js: Janela[] = [];
  // a órbita e o céu foram desenhados para a pessoa recortada; na moldura, o conteúdo sobe um pouco
  const descerDe = (m: Momento) => (plano.recorte || (m.tipo !== "orbita" && m.tipo !== "ceu") ? 0 : 0.34);
  for (const m of ms) {
    const descer = descerDe(m);
    const ult = js[js.length - 1];
    if (ult && m.de - ult.ate < JUNTA) {
      const k = ult.estacoes.length;
      ult.estacoes.push({ m, k, base: new THREE.Vector3(0, SUBIDA * k, 0), de: m.de, ate: m.ate, fim: m.ate + 0.6, descer });
      ult.ate = Math.max(ult.ate, m.ate);
    } else {
      js.push({ de: m.de, ate: m.ate, estacoes: [{ m, k: 0, base: new THREE.Vector3(0, 0, 0), de: m.de, ate: m.ate, fim: m.ate + 0.6, descer }] });
    }
  }
  for (const j of js) {
    j.estacoes.forEach((e, i) => {
      const prox = j.estacoes[i + 1];
      // a órbita sai de cena logo no começo da grua (como no original: o Sol apagado não fica sobrando)
      e.fim = prox ? (e.m.tipo === "orbita" ? prox.de + 0.5 : Math.max(e.ate, prox.de + GRUA)) : j.ate + 0.6;
    });
  }
  guardadas.set(plano, js);
  return js;
};

export const janelaEm = (plano: Plano, t: number, antes = 0, depois = 0.6) =>
  janelasDo(plano).find((j) => t >= j.de - antes && t < j.ate + depois) ?? null;

// a estação que manda na câmera em t (a última que já começou a grua)
export const estacaoEm = (j: Janela, t: number) => {
  let e = j.estacoes[0];
  for (const x of j.estacoes) if (t >= x.de - GRUA_ANTES) e = x;
  return e;
};

// ——— a cena da órbita (fora de escala; a distância real vem no rótulo) ———
// origem no alto à esquerda, destino à direita (no 16:9, no quadro da explicação, ao lado da
// moldura), o caminho da luz passando por cima
export const ORIGEM = new THREE.Vector3(-2.5, 4.35, -4);
export const R_ORIGEM = 1.34;
export const DESTINO = new THREE.Vector3(1.95, 1.86, 0);
export const R_DESTINO = 0.5;
export const RECUO = 1.15;

export type Pose = { pos: THREE.Vector3; look: THREE.Vector3; roll: number };

const PUXA = Easing.bezier(0.42, 0, 0.16, 1);
const Z1 = 20;
const Z2 = 20.9;

const poseOrbita = (e: Estacao, t: number): Pose => {
  const m = e.m as Extract<Momento, { tipo: "orbita" }>;
  const A = e.de;
  const B = A + RECUO;
  const p = PUXA(clamp01((t - A) / (B - A)));
  const drift = clamp01((t - B) / Math.max(0.5, e.ate - B));
  if (m.camera === "mergulho") {
    // vem de longe (os dois corpos pequenos, estrelas passando) e mergulha até o plano geral
    const zFar = 140;
    const z = zFar * Math.pow(Z1 / zFar, p) + (Z2 - Z1) * drift;
    const pos = new THREE.Vector3(lerp(-1.2, 0, p) + 0.12 * drift, lerp(2.4, 0, p), z);
    const look = new THREE.Vector3(lerp(-0.6, 0, p) + 0.12 * drift, lerp(1.2, 0, p), 0);
    return { pos, look, roll: 0.1 * (1 - p) };
  }
  // recuo: de colado no destino até o plano geral (zoom exponencial para o recuo parecer contínuo)
  const z0 = 2.5;
  const z = z0 * Math.pow(Z1 / z0, p) + (Z2 - Z1) * drift;
  const pos = new THREE.Vector3(lerp(DESTINO.x, 0, p) + 0.12 * drift, lerp(DESTINO.y + 0.5, 0, p), z);
  const look = new THREE.Vector3(pos.x, pos.y, 0);
  return { pos, look, roll: -0.07 * (1 - p) };
};

const poseCalma = (e: Estacao, t: number, empurra = 0.6): Pose => {
  // um empurrão lento até o fim do momento, com um balanço lateral mínimo
  const r = clamp01((t - e.de) / Math.max(0.5, e.ate - e.de));
  const pos = new THREE.Vector3(0.1 * Math.sin(r * 1.7), 0, 20 - empurra * r);
  return { pos, look: new THREE.Vector3(pos.x * 0.5, 0, 0), roll: 0 };
};

export const poseLocal = (e: Estacao, t: number): Pose => {
  if (e.m.tipo === "orbita") return poseOrbita(e, t);
  if (e.m.tipo === "ceu") {
    const r = clamp01((t - (e.de + GRUA)) / Math.max(0.5, e.ate - e.de - GRUA));
    return { pos: new THREE.Vector3(0, 0, 20 - 0.9 * r), look: new THREE.Vector3(0, 0, 0), roll: 0 };
  }
  return poseCalma(e, t);
};

const noMundo = (e: Estacao, p: Pose): Pose => ({
  pos: p.pos.clone().add(e.base).add(new THREE.Vector3(0, -e.descer, 0)),
  look: p.look.clone().add(e.base).add(new THREE.Vector3(0, -e.descer, 0)),
  roll: p.roll,
});

// a pose da câmera em t (mundo): a estação da vez e, na troca, a grua desde a estação anterior
export const poseEm = (plano: Plano, t: number): Pose => {
  const j = janelaEm(plano, t, 1, 1) ?? janelasDo(plano)[0];
  if (!j) return { pos: new THREE.Vector3(0, 0, 20), look: new THREE.Vector3(), roll: 0 };
  const e = estacaoEm(j, t);
  const agora = noMundo(e, poseLocal(e, t));
  const anterior = j.estacoes[e.k - 1];
  if (!anterior || e.m.tipo === "orbita") return agora;
  const a = e.de - GRUA_ANTES;
  const q = EASE_INOUT(clamp01((t - a) / GRUA));
  if (q >= 1) return agora;
  const antes = noMundo(anterior, poseLocal(anterior, a));
  return {
    pos: antes.pos.clone().lerp(agora.pos, q),
    look: antes.look.clone().lerp(agora.look, q),
    roll: lerp(antes.roll, agora.roll, q),
  };
};

const cam = new THREE.PerspectiveCamera(FOV, ASPECT, 0.05, 2000);
// `noQuadro`: a câmera do canvas (1920×1080) desenha a janela do palco que cai no quadro deitado;
// sem ele (a conta de `projetar`), a câmera vê o palco inteiro, como no vertical
export const aplicarPose = (c: THREE.PerspectiveCamera, g: Pose, noQuadro = false) => {
  c.fov = FOV;
  c.aspect = ASPECT;
  c.near = 0.05;
  c.far = 2000;
  c.position.copy(g.pos);
  c.up.set(Math.sin(g.roll), Math.cos(g.roll), 0);
  c.lookAt(g.look);
  if (noQuadro) c.setViewOffset(PALCO.w, PALCO.h, -PALCO.x / PALCO.escala, -PALCO.y / PALCO.escala, W / PALCO.escala, H / PALCO.escala);
  else c.clearViewOffset();
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
};

let ultimo: { plano: Plano | null; t: number } = { plano: null, t: NaN };
const prepararCam = (plano: Plano, t: number) => {
  if (ultimo.plano === plano && ultimo.t === t) return;
  aplicarPose(cam, poseEm(plano, t));
  ultimo = { plano, t };
};

export type NaTela = { x: number; y: number; k: number; atras: boolean };
// ponto 3D (mundo) → palco (px) + escala (px do palco por unidade naquela profundidade)
export const projetar = (plano: Plano, v: THREE.Vector3, t: number): NaTela => {
  prepararCam(plano, t);
  const d = v.clone().applyMatrix4(cam.matrixWorldInverse);
  const p = v.clone().project(cam);
  return { x: ((p.x + 1) / 2) * PALCO.w, y: ((1 - p.y) / 2) * PALCO.h, k: PALCO.h / 2 / (Math.max(0.01, -d.z) * TAN), atras: d.z > 0 };
};

// ponto do palco (px) → ponto local de uma estação, na profundidade z (câmera local em z = 20)
export const daTela = (x: number, y: number, z = 0) => {
  const d = 20 - z;
  const mx = PALCO.w / 2;
  const my = PALCO.h / 2;
  return new THREE.Vector3(((x - mx) / mx) * d * TAN * ASPECT, ((my - y) / my) * d * TAN, z);
};
// tamanho em px do palco (no início do momento) → raio na profundidade z
export const raioDaTela = (px: number, z = 0) => (px / (PALCO.h / 2)) * (20 - z) * TAN;
