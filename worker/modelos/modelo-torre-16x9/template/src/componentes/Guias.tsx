// Guias de conferência (stills --guias), no quadro deitado (16:9): o rosto, a moldura da direita,
// o quadro da esquerda (a área dos blocos), o centro da legenda, as margens do YouTube e a linha dos
// controles do player.
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { AREA, H, LIMITE_PLAYER, MARGEM_X, MOLDURA, QUADRO, W } from "../tema";
import { rostoDoPlano } from "./Moldura";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: W, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.55)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

// a área dos blocos (no espaço do vertical) na tela
const area = {
  x: QUADRO.x + QUADRO.escala * AREA.x,
  y: QUADRO.y + QUADRO.escala * AREA.y,
  w: QUADRO.escala * AREA.w,
  h: QUADRO.escala * (AREA.base - AREA.y),
};

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; yLegenda: number }> = ({ plano, caixa, t, yLegenda }) => {
  const r = rostoNaTela(caixa, rostoDoPlano(plano), plano.videoAltura ?? H, t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00C2E0", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, border: "3px dashed #18A058" }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, borderRadius: MOLDURA.raio, border: "3px dashed #D94FB0" }} />
      {linha(yLegenda, "#E0A000", "centro da legenda")}
      {linha(LIMITE_PLAYER, "#E03030", "controles do player")}
      <div style={{ position: "absolute", left: MARGEM_X, top: 0, width: W - 2 * MARGEM_X, height: H, borderLeft: "2px dotted #E03030", borderRight: "2px dotted #E03030" }} />
    </div>
  );
};
