// Guias de conferência (stills --guias): rosto, legenda, metade de cima (mundo), margens e a interface do app.
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { AREA, CARTAO } from "../tema";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; yLegenda: number }> = ({ plano, caixa, t, yLegenda }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.base - AREA.y, border: "3px dashed #18A058" }} />
      {linha(yLegenda, "#E0A000", "centro da legenda")}
      {linha(CARTAO.y, "#D94FB0", "moldura de baixo")}
      {linha(120, "#E03030", "interface (topo)")}
      {linha(1700, "#E03030", "interface (base)")}
      <div style={{ position: "absolute", left: 64, top: 0, width: 952, height: 1920, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
