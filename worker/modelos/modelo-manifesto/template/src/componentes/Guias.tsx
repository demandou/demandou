import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { BASE_UTIL, LIMITE_APP, mono, TOPO_UTIL } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// mostram onde o plano acha que está o rosto, a faixa útil dos pôsteres, a legenda e o selo.
export const Guias: React.FC<{ plano: Plano; legendaY: number; seloY: number }> = ({ plano, legendaY, seloY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  // abaixo desta linha fica a interface do aplicativo (legenda do post, botões)
  const limiteApp = LIMITE_APP;

  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 40, right: 40, top: TOPO_UTIL, height: BASE_UTIL - TOPO_UTIL, border: "3px dashed rgba(0,229,255,0.6)" }} />
      <div style={{ ...etiqueta, left: 40, top: TOPO_UTIL - 40 }}>faixa dos pôsteres</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 180, right: 180, top: seloY, height: 300, border: "3px dashed #FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: 180, top: seloY + 306 }}>selo (quando houver)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
