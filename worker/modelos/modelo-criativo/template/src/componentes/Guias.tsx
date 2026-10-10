// Guias de conferência (stills --guias): rosto, legenda, botão, palco, margens e a zona segura do Ads.
import type { Layout } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { SEGURO } from "../tema";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout; tVideo: number }> = ({ plano, caixa, lay, tVideo }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, tVideo);
  const P = lay.palco;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, border: "3px dashed #18A058" }} />
      {linha(lay.yLegenda, "#E0A000", "centro da legenda")}
      {linha(lay.yBotao, "#D94FB0", "centro do botão (cta)")}
      {linha(SEGURO.topo, "#E03030", "zona segura do Ads (10% de cima)")}
      {linha(SEGURO.base, "#E03030", "zona segura do Ads (14% de baixo)")}
      <div style={{ position: "absolute", left: SEGURO.margem, top: 0, width: 1080 - 2 * SEGURO.margem, height: 1920, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
