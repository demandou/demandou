// Guias de conferência (stills --guias): rosto, moldura da pessoa, mesa dos cartões, legenda e a interface.
import { COSTURA, MESA } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number }> = ({ plano, caixa, t }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00E5FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: MESA.x, top: MESA.topo, width: MESA.w, height: MESA.base - MESA.topo, border: "3px dashed #7CFF6B", boxSizing: "border-box" }} />
      {linha(COSTURA, "#FF6BD5", "emenda (pessoa embaixo)")}
      {linha(110, "#FF4040", "interface (topo)")}
      {linha(1540, "#FF4040", "interface (base)")}
    </div>
  );
};
