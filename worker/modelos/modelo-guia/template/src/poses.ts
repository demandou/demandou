// Onde o recorte da pessoa fica, e quando ele troca de lugar.
import { interpolate } from "remotion";
import { pontoDoRosto } from "./motor/caixa";
import type { Momento, Plano, PoseNome, TrocaDePose } from "./plano";
import { suave } from "./tema";

// fx, fy: onde o centro do rosto cai na tela (frações); s: escala do quadro 1080×1920 do vídeo;
// rot: graus; frente: o conteúdo cobre a pessoa (ela é miniatura no topo, cortada na cintura).
export type Pose = { fx: number; fy: number; s: number; rot: number; frente: boolean };
export const POSES: Record<PoseNome, Pose> = {
  // meio corpo grande: rosto a 58% da altura, corpo com ~65 a 80% da largura do quadro
  dir: { fx: 0.66, fy: 0.58, s: 0.8, rot: 0, frente: false },
  esq: { fx: 0.34, fy: 0.58, s: 0.8, rot: 0, frente: false },
  centro: { fx: 0.5, fy: 0.58, s: 0.84, rot: 0, frente: false },
  // no mapa inteiro a pessoa fica menor, no canto de baixo à direita
  canto: { fx: 0.76, fy: 0.64, s: 0.62, rot: 0, frente: false },
  // só para prints muito altos: ainda com mais da metade da largura
  topo: { fx: 0.5, fy: 0.15, s: 0.62, rot: 0, frente: true },
  borda: { fx: 0.78, fy: 0.3, s: 0.8, rot: -6, frente: false },
};

const ALTERNA: PoseNome[] = ["dir", "centro", "esq", "centro"];

export type Troca = { em: number; pose: PoseNome; suave: boolean };

// A lista de trocas de pose do vídeo, em ordem. Cada momento começa num corte seco; trocas dentro
// do momento deslizam em 0,3 s. Sem `pessoa`, o template alterna sozinho (direita, centro, esquerda…).
export const trocasDePose = (plano: Plano): Troca[] => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  const out: Troca[] = [{ em: 0, pose: "dir", suave: false }];
  let i = 0;
  let anterior: PoseNome = "dir";
  for (const m of ms) {
    const lista: TrocaDePose[] = Array.isArray(m.pessoa) ? m.pessoa : [{ em: m.de, pose: (m.pessoa as PoseNome | undefined) ?? padraoDe(m, i, anterior) }];
    lista.forEach((tp, k) => {
      out.push({ em: k === 0 ? m.de : tp.em, pose: tp.pose, suave: k > 0 });
      anterior = tp.pose;
    });
    i++;
  }
  return out;
};

// O padrão por tipo: o mapa inteiro com a pessoa no canto; prints pedem a pessoa embaixo no centro;
// o resto alterna.
const padraoDe = (m: Momento, i: number, anterior: PoseNome): PoseNome => {
  if (m.tipo === "mapa" && m.foco === undefined) return "canto";
  if (m.tipo === "print") return "centro";
  if (m.tipo === "cta") return "dir";
  const prox = ALTERNA[i % ALTERNA.length];
  return prox === anterior ? ALTERNA[(i + 1) % ALTERNA.length] : prox;
};

export const poseNoTempo = (trocas: Troca[], t: number): Pose => {
  let k = 0;
  for (let j = 0; j < trocas.length; j++) if (trocas[j].em <= t + 1e-6) k = j;
  const atual = trocas[k];
  const pa = POSES[atual.pose];
  if (!atual.suave || k === 0) return pa;
  const ant = POSES[trocas[k - 1].pose];
  const e = interpolate(t, [atual.em, atual.em + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const m = (a: number, b: number) => a + (b - a) * e;
  return { fx: m(ant.fx, pa.fx), fy: m(ant.fy, pa.fy), s: m(ant.s, pa.s), rot: m(ant.rot, pa.rot), frente: e > 0.5 ? pa.frente : ant.frente };
};

// Geometria do recorte (px) para o rosto cair em (fx, fy) com a escala s, seguindo o rosto no tempo.
export const geometriaDaPessoa = (plano: Plano, pose: Pose, t: number) => {
  const p = pontoDoRosto(plano.rosto, t, 0.35);
  const W = plano.largura;
  const H = plano.altura;
  // o corpo precisa chegar à borda de baixo (exceto na miniatura do topo)
  let s = pose.s;
  if (!pose.frente) s = Math.max(s, (1 - pose.fy) / (1 - p.y) + (pose.rot ? 0.12 : 0.02));
  const w = W * s;
  const h = (plano.videoAltura ?? H) * s;
  const ox = p.x * w;
  const oy = p.y * h;
  return { left: pose.fx * W - ox, top: pose.fy * H - oy, w, h, ox, oy, rot: pose.rot };
};
