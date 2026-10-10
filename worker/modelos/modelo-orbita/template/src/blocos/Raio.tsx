// O raio: um feixe de luz quente entra do canto de cima (de onde a origem vai aparecer no espaço) e
// bate no lado do rosto. Cresce em `em`, a fonte acende em `fonteEm` e o feixe bate em `bateEm`.
// Porte do `SunRay` do G5; o rosto vem do rastreio do motor.
import React from "react";
import { rostoNaTela } from "../motor/caixa";
import type { Plano, Raio as RaioM } from "../plano";
import { caixaDaPessoa } from "../layout";
import { EASE_IN, EASE_INOUT, EASE_OUT, prog } from "../tema";

export const Raio: React.FC<{ plano: Plano; m: RaioM; t: number }> = ({ plano, m, t }) => {
  if (t < m.em - 0.2 || t > m.ate + 0.6) return null;
  const { caixa } = caixaDaPessoa(plano, t);
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  const fw = r.largura;
  const dir = m.lado === "direita";
  const O = { x: dir ? 1140 : -60, y: -120 };
  const Pt = { x: r.x + (dir ? 0.3 : -0.3) * fw, y: r.y + fw * 0.02 };
  const dx = Pt.x - O.x;
  const dy = Pt.y - O.y;
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const cresce = prog(t, m.em - 0.12, m.em + 0.6, EASE_OUT);
  const bate = prog(t, m.bateEm - 0.15, m.bateEm + 0.45, EASE_INOUT);
  const sai = prog(t, m.ate - 0.05, m.ate + 0.4, EASE_IN);
  const fonte = m.fonteEm !== undefined ? prog(t, m.fonteEm - 0.12, m.fonteEm + 0.45, EASE_OUT) : cresce;
  const vis = 1 - sai;
  const len = (L + 180) * cresce;
  const w0 = 46;
  const w1 = 60 + 0.17 * len;
  const E = { x: O.x + ux * len, y: O.y + uy * len };
  const poly = [
    [O.x + nx * w0, O.y + ny * w0],
    [E.x + nx * w1, E.y + ny * w1],
    [E.x - nx * w1, E.y - ny * w1],
    [O.x - nx * w0, O.y - ny * w0],
  ]
    .map((q) => q.join(","))
    .join(" ");
  const brilho = 0.92 + 0.08 * Math.sin(t * 5.3);
  const id = `raio${Math.round(m.em * 100)}`;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen", opacity: vis * brilho }}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={O.x} y1={O.y} x2={E.x} y2={E.y}>
            <stop offset="0" stopColor="#FFE2B8" stopOpacity={0.7} />
            <stop offset="0.45" stopColor="#FFB878" stopOpacity={0.36} />
            <stop offset="0.84" stopColor="#F7A06A" stopOpacity={0.26 + 0.1 * bate} />
            <stop offset="1" stopColor="#F0A27F" stopOpacity={0} />
          </linearGradient>
          <filter id={`${id}b`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={20} />
          </filter>
        </defs>
        <polygon points={poly} fill={`url(#${id})`} filter={`url(#${id}b)`} />
      </svg>
      {/* a fonte: o Sol fora de quadro, no canto */}
      <div style={{ position: "absolute", left: O.x - 300, top: O.y - 300, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,240,220,0.95) 0%, rgba(247,178,126,0.6) 22%, rgba(217,119,87,0.22) 48%, rgba(217,119,87,0) 70%)", opacity: (0.35 + 0.65 * fonte) * cresce * vis, transform: `scale(${0.75 + 0.25 * fonte})`, mixBlendMode: "screen" }} />
      {/* a luz quente no lado do rosto (sutil) */}
      <div style={{ position: "absolute", left: Pt.x - fw * 0.5, top: Pt.y - fw * 0.75, width: fw, height: fw * 1.5, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,150,80,0.95), rgba(255,150,80,0.4) 55%, rgba(255,150,80,0) 100%)", mixBlendMode: "soft-light", opacity: (0.25 + 0.75 * bate) * cresce * vis }} />
      <div style={{ position: "absolute", left: Pt.x - fw * 0.45, top: Pt.y - fw * 0.65, width: fw * 0.9, height: fw * 1.3, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,196,140,0.42), rgba(255,196,140,0) 100%)", mixBlendMode: "screen", opacity: bate * vis }} />
    </>
  );
};
