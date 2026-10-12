import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { LIMITE_APP, sora } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final). A pessoa aparece em quadro
// cheio (16:9): a cruz tem que cair no rosto, a legenda na área segura de baixo e tudo acima da
// linha vermelha (controles do player).
export const Guias: React.FC<{ plano: Plano; legendaY: number }> = ({ plano, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sora,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };

  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ ...etiqueta, left: width / 2 + 10, top: 40, color: "rgba(0,229,255,0.9)" }}>centro</div>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
