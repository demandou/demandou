import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { LIMITE_APP, type Rect, texto } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto que o plano mediu,
// a foto em arco da pessoa, a linha do meio do quadro e o limite da interface do aplicativo.
export const Guias: React.FC<{ plano: Plano; arco: Rect; legendaY: number | null }> = ({ plano, arco, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: texto,
    fontWeight: 600,
    fontSize: 30,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 20 }}>rosto (vídeo cheio)</div>
      <div style={{ position: "absolute", left: arco.x, top: arco.y, width: arco.w, height: arco.h, border: "3px dashed #B967FF", borderRadius: `${arco.w / 2}px ${arco.w / 2}px 0 0` }} />
      <div style={{ ...etiqueta, color: "#B967FF", left: arco.x, top: arco.y + arco.h + 8 }}>foto em arco</div>
      {legendaY !== null ? (
        <>
          <div style={{ position: "absolute", left: 140, right: 140, top: legendaY, height: 120, border: "3px dashed #FFD400" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: 140, top: legendaY + 124 }}>legenda</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
