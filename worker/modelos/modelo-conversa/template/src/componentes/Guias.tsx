import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { CAMPO, fonte, LIMITE_APP, PILULA, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// rosto e linha do centro, zona dos balões no peito, pílula do topo, campo da legenda,
// caixa da pessoa naquele instante e o limite da interface do app.
export const Guias: React.FC<{ plano: Plano; zonaTopo: number; caixa: Caixa }> = ({ plano, zonaTopo, caixa }) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: 56, right: 56, top: PILULA.topo, height: PILULA.altura, border: "3px dashed #FF9F1C", borderRadius: 50 }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: 70, top: PILULA.topo + PILULA.altura + 6 }}>pílula do topo</div>
      <div style={{ position: "absolute", left: 56, right: 56, top: zonaTopo, height: CAMPO.base - 120 - zonaTopo, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 56, top: zonaTopo - 40 }}>balões no peito · topo {zonaTopo}</div>
      <div style={{ position: "absolute", left: 56, right: 56, top: CAMPO.base - 108, height: 108, border: "3px dashed #FFD400", borderRadius: 54 }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 70, top: CAMPO.base - 150 }}>legenda (campo de texto)</div>
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #B78CFF", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: caixa.x + 20, top: caixa.y + 20 }}>pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
