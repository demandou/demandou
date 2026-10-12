// Guias de conferência (stills --guias), no quadro deitado (16:9): o rosto, a área útil do vidro, a
// moldura da pessoa (laranja), o tampo do balcão, o centro da legenda, a linha dos controles do player
// e as margens laterais de 96 px.
import type { Layout } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { AREA, BALCAO, LIMITE_PLAYER, MARGEM, MOLDURA, QUADRO } from "../tema";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout }> = ({ plano, caixa, t, lay }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? QUADRO.h, t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.base - AREA.y, border: "3px dashed #18A058" }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: BALCAO.y - MOLDURA.y, border: "3px dashed #FF8A00" }} />
      {linha(lay.yLegenda, "#E0A000", "centro da legenda")}
      {linha(BALCAO.y, "#D94FB0", "tampo do balcão")}
      {linha(LIMITE_PLAYER, "#E03030", "controles do player")}
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: QUADRO.w - 2 * MARGEM, height: QUADRO.h, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
