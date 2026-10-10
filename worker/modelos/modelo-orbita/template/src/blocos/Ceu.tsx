// A assinatura 2: o céu. A câmera sobe (a grua do "olhar pro céu") e cada corpo aparece na palavra
// que o nomeia, com o nome e o valor ("Lua · 1,3 s"); no `grifoEm` os valores ganham o traço.
// Porte do fim do G5 (Lua, Sol pequeno e Sirius), com até 4 corpos de qualquer tipo.
import React from "react";
import * as THREE from "three";
import type { CorpoNaCena } from "../espaco/Corpos";
import { GRUA, type Estacao, projetar, raioDaTela } from "../espaco/camera";
import type { Ceu as CeuM, Corpo, Plano } from "../plano";
import { COR, EASE_INOUT, EASE_OUT, SORA, prog } from "../tema";

// lugares no céu (coordenadas locais, câmera em z = 20): embaixo à esquerda, no meio, no alto à direita
type Lugar = { pos: THREE.Vector3; px: number };
const LUGARES: Lugar[] = [
  { pos: new THREE.Vector3(-1.78, 2.35, 0), px: 68 },
  { pos: new THREE.Vector3(2.35, 3.7, -6), px: 56 },
  { pos: new THREE.Vector3(0.02, 5.25, -10), px: 50 },
  { pos: new THREE.Vector3(3.95, 11.3, -30), px: 60 },
];
// ordem de leitura (de baixo para cima) por quantidade de corpos
const ORDEM: Record<number, number[]> = { 1: [2], 2: [0, 3], 3: [0, 2, 3], 4: [0, 1, 2, 3] };

const itensDo = (m: CeuM) => [...m.itens].sort((a, b) => a.em - b.em).slice(0, 4);
const lugarDe = (m: CeuM, i: number) => LUGARES[ORDEM[Math.min(4, Math.max(1, itensDo(m).length))][i]];
const pontual = (c: Corpo, l: Lugar) => c === "estrela" && l.pos.z <= -20;

export const corposDoCeu = (e: Estacao): CorpoNaCena[] => {
  const m = e.m as CeuM;
  return itensDo(m).map((it, i) => {
    const l = lugarDe(m, i);
    const ponto = pontual(it.corpo, l);
    const r = raioDaTela(l.px, l.pos.z) * (ponto ? 0.64 : 1);
    const vis = (t: number) => prog(t, it.em - 0.12, it.em + 0.35, EASE_OUT);
    return {
      id: `c${m.de}-${i}`,
      corpo: it.corpo,
      pos: l.pos.clone().add(e.base),
      r,
      cor: it.cor,
      ponto,
      luz: new THREE.Vector3(30, 30, 40).add(e.base),
      estado: (t: number) => {
        const v = vis(t);
        return { vis: v, off: 0, flash: 0, inchar: it.corpo === "sol" ? Math.max(0.02, v) : 1 };
      },
    };
  });
};

// o calor em volta de um Sol no céu (fundo)
export const CoronaDoCeu: React.FC<{ plano: Plano; e: Estacao; t: number }> = ({ plano, e, t }) => {
  const m = e.m as CeuM;
  return (
    <>
      {itensDo(m).map((it, i) => {
        if (it.corpo !== "sol" && it.corpo !== "estrela") return null;
        const l = lugarDe(m, i);
        if (pontual(it.corpo, l)) return null;
        const p = projetar(plano, l.pos.clone().add(e.base), t);
        const rs = raioDaTela(l.px, l.pos.z) * p.k * prog(t, it.em - 0.12, it.em + 0.35, EASE_OUT);
        if (rs < 0.5) return null;
        const c = it.corpo === "sol" ? ["244,160,118", "226,128,90", "217,119,87"] : ["200,220,255", "170,195,255", "150,180,255"];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at ${p.x}px ${p.y}px, rgba(${c[0]},0.6) ${rs * 0.95}px, rgba(${c[1]},0.2) ${rs * 1.5}px, rgba(${c[2]},0.06) ${rs * 3}px, rgba(${c[2]},0) ${rs * 5}px)`,
            }}
          />
        );
      })}
    </>
  );
};

export const RotulosDoCeu: React.FC<{ plano: Plano; e: Estacao; t: number }> = ({ plano, e, t }) => {
  const m = e.m as CeuM;
  if (t < m.de || t > e.fim) return null;
  const sai = 1 - prog(t, e.ate, e.ate + 0.35);
  const grifo = m.grifoEm !== undefined ? prog(t, m.grifoEm - 0.1, m.grifoEm + 0.35, EASE_INOUT) : 0;
  const tit = m.titulo ? prog(t, m.de + GRUA * 0.6, m.de + GRUA + 0.3) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: sai }}>
      {itensDo(m).map((it, i) => {
        const a = prog(t, it.em - 0.02, it.em + 0.4, EASE_OUT);
        if (a <= 0) return null;
        const l = lugarDe(m, i);
        const ponto = pontual(it.corpo, l);
        const p = projetar(plano, l.pos.clone().add(e.base), t);
        const r = ponto ? 0.55 : raioDaTela(l.px, l.pos.z);
        const y = p.y + r * p.k + 22;
        const x = Math.max(64 + 170, Math.min(1016 - 170, p.x));
        const traco = m.grifoEm !== undefined ? prog(t, m.grifoEm - 0.05 + i * 0.07, m.grifoEm + 0.3 + i * 0.07, EASE_OUT) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translateX(-50%) translateY(${(1 - a) * 16}px)`, textAlign: "center", whiteSpace: "nowrap", opacity: a, filter: a < 1 ? `blur(${(1 - a) * 8}px)` : undefined }}>
            <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: 40, color: COR.branco, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>{it.nome}</span>
            {it.valor ? (
              <>
                <span style={{ fontFamily: SORA, fontWeight: 500, fontSize: 40, color: COR.fraco }}> · </span>
                <span style={{ position: "relative", display: "inline-block", fontFamily: SORA, fontWeight: 700, fontSize: 42, color: grifo > 0 ? `rgba(255,${Math.round(162 + 70 * grifo)},${Math.round(127 + 90 * grifo)},1)` : COR.solClaro }}>
                  {it.valor}
                  <span style={{ position: "absolute", left: 0, bottom: -6, height: 3, width: `${100 * traco}%`, background: COR.sol, borderRadius: 2 }} />
                </span>
              </>
            ) : null}
          </div>
        );
      })}
      {m.titulo ? (
        <div style={{ position: "absolute", left: 64, width: 952, top: 690, textAlign: "center", opacity: tit, transform: `translateY(${(1 - tit) * 16}px)` }}>
          <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 44, letterSpacing: "-0.01em", color: COR.branco, textShadow: "0 3px 18px rgba(0,0,0,0.6)" }}>{m.titulo}</span>
        </div>
      ) : null}
    </div>
  );
};
