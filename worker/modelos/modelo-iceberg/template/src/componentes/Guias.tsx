// Guias de conferência (stills --guias): rosto, janela, zona de conteúdo, legenda e limites da interface.
import { JANELA, ZONA } from "../camera";
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
      <div style={{ position: "absolute", left: JANELA.x, top: caixa.y, width: JANELA.w, height: JANELA.h, border: "3px dashed #FF6BD5", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: ZONA.x, top: ZONA.y, width: ZONA.w, height: ZONA.h, border: "3px dashed #7CFF6B", boxSizing: "border-box" }} />
      {linha(caixa.y + caixa.h - 24, "#FFD400", "legenda (base da janela)")}
      {linha(110, "#FF4040", "interface (topo)")}
      {linha(1540, "#FF4040", "interface (base)")}
      <div style={{ position: "absolute", left: 950, top: 1080, width: 120, height: 620, border: "3px dashed #FF4040" }} />
    </div>
  );
};
