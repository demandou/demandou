// Guias de conferência (stills --guias), no quadro deitado (16:9, 1920×1080): o rosto, a moldura da
// direita, o quadro da esquerda (o palco), a faixa do peito, a legenda e a zona segura do YouTube.
import type { Layout } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { QUADRO, SEGURO } from "../tema";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

const caixa = (r: { x: number; y: number; w: number; h: number }, c: string, rotulo: string) => (
  <div key={rotulo} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 6, top: 6, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout; tVideo: number }> = ({ plano, caixa: cx, lay, tVideo }) => {
  const r = rostoNaTela(cx, plano.rosto, plano.videoAltura ?? QUADRO.h, tVideo);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      {caixa(lay.palco, "#18A058", "quadro da esquerda (palco)")}
      {caixa(lay.moldura, "#E07A00", "moldura da pessoa")}
      {lay.peito.h > 0 ? caixa(lay.peito, "#D94FB0", "peito (placas no quadro cheio)") : null}
      {linha(lay.yLegenda, "#E0A000", "centro da legenda")}
      {linha(SEGURO.topo, "#E03030", "zona segura do YouTube (topo)")}
      {linha(SEGURO.base, "#E03030", "zona segura do YouTube (controles do player)")}
      <div style={{ position: "absolute", left: SEGURO.margem, top: 0, width: QUADRO.w - 2 * SEGURO.margem, height: QUADRO.h, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
