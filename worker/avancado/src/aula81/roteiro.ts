import * as THREE from "three";
import { ENTRADA, k, MEIO, mix, SAIDA } from "../anim";

/**
 * O ROTEIRO DA MAQUETE (aula 8.1) na fala real do Bruno, 957,85 s a 969,85 s:
 *
 *   "se prepara pra receber essa benção. Não, trabalha, aumenta a casa, estica
 *    a corda, o finca e estaca, deixa a cortina bem esticadinha, faça o
 *    essencial bem feito,"
 *
 * Instantes relativos ao trecho, da transcrição:
 *   0,27 "prepara"     a planta da tenda se desenha no chão
 *   0,90 "receber"     a planta se eleva até virar a tenda (câmera revela a profundidade)
 *   4,27 "aumenta a casa"   a tenda alarga (o lugar da tenda, Isaías 54:2)
 *   5,06 "estica a corda"   a maquete se abre em três planos; as cordas saem do frouxo para o esticado
 *   6,03 "finca e estaca"   as estacas entram no chão em duas batidas
 *   7,18 "deixa a cortina bem esticadinha"   a lona perde as rugas
 *   9,42 "faça o essencial bem feito"   os planos voltam à mesma tenda e os destaques se unem
 *
 * Tudo é função do instante t (segundos): a mesma maquete em todos os estados,
 * nada se move sozinho.
 */
export const PROFUNDIDADE = 2.6;
export const ALTURA_CUMEEIRA = 1.95;
export const ALTURA_BEIRAL = 0.6;
export const AFASTA_ESTACA = 1.25;

export function estado(t: number) {
  const cordas = k(t, 4.98, 5.3) * (1 - k(t, 6.0, 6.3));
  const estacas = k(t, 5.95, 6.2) * (1 - k(t, 7.05, 7.35));
  const cortina = k(t, 7.12, 7.45) * (1 - k(t, 9.4, 9.8));
  return {
    planta: k(t, 0.3, 1.35, MEIO),
    ergue: k(t, 1.05, 2.35, MEIO),
    largura: mix(2.7, 4.3, k(t, 4.22, 5.05, MEIO)),
    casa: k(t, 4.05, 4.35) * (1 - k(t, 5.05, 5.4)),
    abre: k(t, 4.95, 5.65, MEIO) * (1 - k(t, 9.45, 10.5, MEIO)),
    tensao: k(t, 5.25, 5.95, SAIDA),
    finca: 0.55 * k(t, 6.05, 6.3, ENTRADA) + 0.45 * k(t, 6.48, 6.76, ENTRADA),
    estica: k(t, 7.3, 9.2, MEIO),
    foco: { cordas, estacas, cortina },
    une: k(t, 9.6, 10.7, MEIO),
    rotulos: k(t, 5.3, 5.8) * (1 - k(t, 9.45, 9.9)),
  };
}
export type Estado = ReturnType<typeof estado>;

/** Elevação de cada plano na vista explodida. */
export const elevacao = (e: Estado) => ({ chao: 0, cortina: 1.6 * e.abre, cordas: 3.5 * e.abre });

// A câmera por pontos-chave (instante, posição, alvo), com curva suave entre eles e
// pausas curtas nas posições principais. Sem giro completo, sem atravessar a lona.
const CHAVES: [number, [number, number, number], [number, number, number]][] = [
  [0.0, [0.4, 10.6, 1.4], [0, 0, 0]],
  [1.0, [0.8, 9.6, 2.6], [0, 0.2, 0]],
  [2.5, [6.1, 4.3, 7.3], [0, 0.95, 0]],
  [4.25, [6.7, 3.9, 6.5], [0, 0.95, 0]],
  [5.0, [7.6, 5.0, 8.4], [0, 1.5, 0]],
  [5.75, [9.8, 7.2, 11.2], [0, 2.65, 0]],
  [6.15, [9.4, 7.4, 10.8], [0, 2.85, 0]],
  [6.7, [9.2, 5.2, 10.8], [0, 2.1, 0]],
  [7.4, [8.8, 6.0, 10.4], [0, 2.6, 0]],
  [9.35, [8.0, 5.8, 9.6], [0, 2.6, 0]],
  [10.5, [7.0, 4.4, 8.1], [0, 0.95, 0]],
  [12.0, [6.2, 3.8, 7.1], [0, 0.95, 0]],
];

const catmull = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

export function camera(t: number) {
  let i = CHAVES.findIndex((c, j) => j < CHAVES.length - 1 && t >= c[0] && t < CHAVES[j + 1][0]);
  if (i < 0) i = t < CHAVES[0][0] ? 0 : CHAVES.length - 2;
  const [t1, p1, a1] = CHAVES[i];
  const [t2, p2, a2] = CHAVES[i + 1];
  const [, p0, a0] = CHAVES[Math.max(0, i - 1)];
  const [, p3, a3] = CHAVES[Math.min(CHAVES.length - 1, i + 2)];
  const bruto = Math.min(1, Math.max(0, (t - t1) / (t2 - t1)));
  const u = mix(bruto, MEIO(bruto), 0.5);
  const pos = [0, 1, 2].map((j) => catmull(p0[j], p1[j], p2[j], p3[j], u)) as [number, number, number];
  const alvo = [0, 1, 2].map((j) => catmull(a0[j], a1[j], a2[j], a3[j], u)) as [number, number, number];
  return { pos, alvo, fov: 40 };
}

/** A mesma câmera fora do canvas, para prender rótulos e linhas de chamada aos objetos. */
const camProj = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
export function projetar(t: number, ponto: [number, number, number], largura: number, altura: number) {
  const c = camera(t);
  camProj.fov = c.fov;
  camProj.aspect = largura / altura;
  camProj.position.set(...c.pos);
  camProj.lookAt(new THREE.Vector3(...c.alvo));
  camProj.updateProjectionMatrix();
  camProj.updateMatrixWorld();
  const v = new THREE.Vector3(...ponto).project(camProj);
  return { x: ((v.x + 1) / 2) * largura, y: ((1 - v.y) / 2) * altura };
}

/** Pontos das cordas: do beiral (e das pontas da cumeeira) até o topo de cada estaca. */
export function cordasEEstacas(e: Estado) {
  const W = e.largura;
  const D = PROFUNDIDADE;
  const sobra = mix(0.42, 0.06, e.finca); // quanto da estaca fica fora do chão
  const lista: { ancora: [number, number, number]; estaca: [number, number, number]; inclina: [number, number] }[] = [];
  for (const lado of [-1, 1]) {
    for (const x of [-W / 2, 0, W / 2]) {
      const sx = x * 1.08;
      lista.push({ ancora: [x, ALTURA_BEIRAL, (lado * D) / 2], estaca: [sx, sobra, lado * (D / 2 + AFASTA_ESTACA)], inclina: [0, lado] });
    }
    lista.push({ ancora: [(lado * W) / 2, ALTURA_CUMEEIRA, 0], estaca: [lado * (W / 2 + 1.5), sobra, 0], inclina: [lado, 0] });
  }
  return lista;
}
