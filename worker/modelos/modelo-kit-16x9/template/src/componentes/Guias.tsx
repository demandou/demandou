// Guias de conferência (stills --guias), no quadro deitado: rosto, borda da mesa (costura vertical),
// área útil da mesa, legenda, margens seguras e a faixa dos controles do player do YouTube.
import { AREA, COSTURA, LEGENDA_Y, LIMITE_APP, MARGEM, QUADRO } from "../layout";
import { rostoNaTela, type Caixa } from "../motor/caixa";
import type { Plano } from "../plano";

const linha = (y: number, c: string, rotulo: string, tracejado = true) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px ${tracejado ? "dashed" : "solid"} ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);
const coluna = (x: number, c: string, rotulo: string, tracejado = true) => (
  <div key={rotulo + x} style={{ position: "absolute", left: x, top: 0, height: QUADRO.h, borderLeft: `3px ${tracejado ? "dashed" : "solid"} ${c}` }}>
    <div style={{ position: "absolute", left: 4, top: 40, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px", whiteSpace: "nowrap" }}>{rotulo}</div>
  </div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number }> = ({ plano, caixa, t }) => {
  const r = rostoNaTela(caixa, plano.rosto, Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h), t);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00E5FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: caixa.x + caixa.w / 2 - 1, top: 0, width: 2, height: QUADRO.h, background: "rgba(0,229,255,0.5)" }} />
      <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.h, border: "3px dashed #7CFF6B" }} />
      {linha(LEGENDA_Y - 50, "#FFD400", "legenda")}
      {linha(LEGENDA_Y + 50, "#FFD400", "")}
      {linha(LIMITE_APP, "#FF4040", "controles do player")}
      {coluna(COSTURA, "#FF6BD5", "borda da mesa")}
      {coluna(MARGEM, "#FF4040", "margem")}
      {coluna(QUADRO.w - MARGEM, "#FF4040", "margem")}
    </div>
  );
};
