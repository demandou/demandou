import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { CAMAFEU, LIMITE_APP, texto } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// rosto, ficha, legenda, camafeu e o limite da interface do app.
export const Guias: React.FC<{
  plano: Plano;
  ficha: { x: number; y: number; w: number; h: number };
  legendaY: number;
}> = ({ plano, ficha, legendaY }) => {
  const { width } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: texto,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height: 1920, background: "rgba(0,229,255,0.35)" }} />
      <div
        style={{
          position: "absolute",
          left: ficha.x,
          top: ficha.y,
          width: ficha.w,
          height: ficha.h,
          border: "3px dashed #FF9F1C",
        }}
      />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: ficha.x, top: ficha.y - 40 }}>ficha · topo {ficha.y}</div>
      <div
        style={{
          position: "absolute",
          left: CAMAFEU.cx - CAMAFEU.rx,
          top: CAMAFEU.cy - CAMAFEU.ry,
          width: CAMAFEU.rx * 2,
          height: CAMAFEU.ry * 2,
          borderRadius: "50%",
          border: "3px dashed #B48CFF",
        }}
      />
      <div style={{ ...etiqueta, color: "#B48CFF", left: CAMAFEU.cx + CAMAFEU.rx + 10, top: CAMAFEU.cy - 18 }}>camafeu</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
