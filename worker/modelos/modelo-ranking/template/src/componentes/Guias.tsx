// Guias de conferência (stills --guias): rosto, zona do peito, faixa da legenda, emenda e a interface.
import { COSTURA, type Layout } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";

const linha = (y: number, c: string, rotulo: string, tracejado = true) => (
  <div key={rotulo} style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px ${tracejado ? "dashed" : "solid"} ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout }> = ({ plano, caixa, t, lay }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  const zona = plano.zona ?? { topo: 976, altura: 465 };
  const yL = lay.yLegenda(t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00E5FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: r.x - 30, top: r.y - 2, width: 60, height: 4, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x - 2, top: r.y - 30, width: 4, height: 60, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: 0, top: zona.topo, width: 1080, height: zona.altura, border: "3px dashed #7CFF6B", boxSizing: "border-box" }} />
      {linha(yL - 50, "#FFD400", "legenda")}
      {linha(yL + 50, "#FFD400", "")}
      {linha(COSTURA, "#FF6BD5", "emenda (pessoa embaixo)")}
      {linha(lay.yPeito, "#7CFF6B", "centro do peito", false)}
      {linha(110, "#FF4040", "interface (topo)")}
      {linha(1540, "#FF4040", "interface (base)")}
      <div style={{ position: "absolute", left: 950, top: 1080, width: 120, height: 620, border: "3px dashed #FF4040" }} />
    </div>
  );
};
