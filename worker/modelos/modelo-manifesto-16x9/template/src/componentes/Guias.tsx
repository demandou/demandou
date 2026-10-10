import { useVideoConfig } from "remotion";
import { X_DA_MOLDURA } from "../fileira";
import type { Plano } from "../plano";
import { BASE_UTIL, LIMITE_APP, MARGEM, mono, TOPO_UTIL } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado:
// onde o plano acha que está o rosto, a faixa útil dos pôsteres, o lugar da moldura (a janela com a
// pessoa, à direita, como manda a aula 9), a legenda, o selo e a linha dos controles do player.
export const Guias: React.FC<{ plano: Plano; legendaY: number; seloY: number }> = ({ plano, legendaY, seloY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: mono,
    fontWeight: 500,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const moldura = X_DA_MOLDURA * width;

  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: TOPO_UTIL, height: BASE_UTIL - TOPO_UTIL, border: "3px dashed rgba(0,229,255,0.6)" }} />
      <div style={{ ...etiqueta, left: MARGEM, top: TOPO_UTIL - 38 }}>faixa dos pôsteres</div>
      <div style={{ position: "absolute", left: moldura - 2, top: TOPO_UTIL, width: 4, height: BASE_UTIL - TOPO_UTIL, background: "rgba(255,159,28,0.8)" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: moldura + 12, top: TOPO_UTIL + 8 }}>centro da moldura</div>
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: legendaY, height: 64, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: legendaY - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: x - 320, width: 640, top: seloY, height: 270, border: "3px dashed #FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: x - 320, top: seloY + 276 }}>selo / placa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
