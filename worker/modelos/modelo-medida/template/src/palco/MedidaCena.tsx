import React from "react";
import type { Medida, ObjetoMomento, Plano } from "../plano";
import { EASE_IN, EASE_INOUT, prog, useTempo } from "../tema";
import { GLASS_X, PXU, alturaPx, montarCena, objetoAt, toPx } from "./cena";
import { Palco3D } from "./Palco3D";
import { RotulosDoPalco, Selo, seloDoMomento } from "./Rotulos";

/* A assinatura (medida) e o objeto sozinho (objeto): palco 3D + rótulos, com o empurrão lento de
   câmera durante a explicação e a saída que cruza com o próximo momento. */

/** sombra suave do objeto no peito enquanto ele está no ponto de entrega */
const SombraNoPeito: React.FC<{ m: Medida | ObjetoMomento; plano: Plano }> = ({ m, plano }) => {
  const t = useTempo();
  const c = montarCena(plano, m);
  if (!c.objeto || t < c.T.lata - 0.06 || t > c.T.tem + 0.25) return null;
  const p = objetoAt(c, t);
  const b = toPx(p.x, p.y);
  const h = alturaPx(c, p.s);
  const o = p.vis * (1 - Math.min(1, Math.max(0, (t - c.T.tem) / 0.25)));
  return <div style={{ position: "absolute", left: b.x - h * 0.34 + 26, top: b.y - h * 0.92 + 30, width: h * 0.68, height: h * 0.95, borderRadius: "40%", background: "rgba(8,12,8,0.42)", filter: "blur(26px)", opacity: o }} />;
};

export const MedidaCena: React.FC<{ m: Medida | ObjetoMomento; plano: Plano; fim: number }> = ({ m, plano, fim }) => {
  const t = useTempo();
  const c = montarCena(plano, m);
  const T = c.T;
  const inicio = c.objeto ? T.lata - 0.12 : Math.min(T.tem, T.trinta, T.copo) - 0.15;
  if (t < inicio || t > fim + 0.32) return null;
  const sai = prog(t, fim, fim + 0.3, EASE_IN);
  const empurra = m.tipo === "medida" && m.referencia ? prog(t, T.ideal - 0.2, (m.passou ? T.limite : m.ate) + 0.5, EASE_INOUT) : prog(t, T.tem + 0.6, m.ate, EASE_INOUT) * 0.6;
  const selo = seloDoMomento(c);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, transform: sai > 0 ? `translateY(${-sai * 24}px)` : undefined }}>
      <SombraNoPeito m={m} plano={plano} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${GLASS_X + 40}px 560px`, transform: `scale(${1 + 0.045 * empurra})` }}>
        <Palco3D cena={c} />
        <RotulosDoPalco cena={c} />
      </div>
      {selo ? <Selo texto={selo.texto} em={selo.em} /> : null}
    </div>
  );
};

export { PXU };
