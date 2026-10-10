import { useVideoConfig } from "remotion";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { BASE, DIREITA_BAIXO, MARGEM, sans, TOPO } from "../tema";
import { LEGENDA_BAIXO } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): linha do centro, onde o rosto
// deve cair dentro do cartão da pessoa, o cartão, a área útil (topo, base, margem dos botões do app) e
// a faixa da legenda.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa }> = ({ caixa }) => {
  const { width, height } = useVideoConfig();
  // o rosto fica no centro do cartão, na altura `ancoraY`
  const x = caixa.x + caixa.w / 2;
  const y = caixa.y + caixa.h * (caixa.ancoraY ?? 0.3);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(255,255,255,0.85)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,184,212,0.4)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00B8D4" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00B8D4" }} />
      <div style={{ ...etiqueta, left: x + 20, top: y + 14 }}>rosto</div>
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #B388FF" }} />
      <div style={{ ...etiqueta, color: "#7C4DFF", left: caixa.x + 8, top: caixa.y + 8 }}>cartão da pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 3, background: "#FF9F43" }} />
      <div style={{ ...etiqueta, color: "#E67E22", left: MARGEM, top: TOPO + 6 }}>topo seguro</div>
      <div style={{ position: "absolute", left: DIREITA_BAIXO, top: 1000, width: 3, height: BASE - 1000, background: "#FF3B6B" }} />
      <div style={{ position: "absolute", left: MARGEM, top: LEGENDA_BAIXO, width: DIREITA_BAIXO - MARGEM, height: 64, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#B8860B", left: MARGEM, top: LEGENDA_BAIXO + 70 }}>legenda (momentos com legenda)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: BASE, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: BASE + 8 }}>abaixo daqui e à direita da linha: interface do app</div>
    </>
  );
};
