import type { Plano } from "../plano";
import { VIVO } from "../layout";
import { sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que está
// o rosto, a área do visor, a faixa da legenda e o limite da interface do aplicativo.
export const Guias: React.FC<{ plano: Plano; legendaY: number; rosto: { x: number; y: number } }> = ({ legendaY, rosto }) => {
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const limiteApp = 1920 - 320;
  return (
    <>
      <div style={{ position: "absolute", left: rosto.x - 60, top: rosto.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: rosto.x, top: rosto.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: rosto.x + 70, top: rosto.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: VIVO.x, top: VIVO.y, width: VIVO.w, height: VIVO.h, border: "3px dashed #00E5FF", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, left: VIVO.x, top: VIVO.y + VIVO.h + 6 }}>visor</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY - 40 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
