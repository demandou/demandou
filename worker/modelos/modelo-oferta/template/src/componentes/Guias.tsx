// Guias de conferência (stills --guias): rosto, legenda, painel, margens e a interface do app.
import type { Layout } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { COSTURA, PAINEL, UI_BASE } from "../tema";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout }> = ({ plano, caixa, t, lay }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: PAINEL.w, height: PAINEL.base - PAINEL.y, border: "3px dashed #18A058" }} />
      {linha(lay.yLegenda, "#E0A000", "centro da legenda")}
      {linha(COSTURA, "#D94FB0", "moldura da pessoa")}
      {linha(120, "#E03030", "interface (topo)")}
      {linha(UI_BASE, "#E03030", "interface (base)")}
      <div style={{ position: "absolute", left: 64, top: 0, width: 952, height: 1920, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
