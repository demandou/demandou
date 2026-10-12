import { useVideoConfig } from "remotion";
import type { Faixa } from "../layout";
import type { Plano } from "../plano";
import { fonte, LIMITE_APP } from "../tema";
import { LEGENDA_BASE } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado:
// mostram onde o plano acha que estão o rosto, a zona abaixo do queixo, a faixa das etiquetas do
// peito (do topo dela até a base útil) e a legenda.
export const Guias: React.FC<{ plano: Plano; topo: number; altura: number; faixa: Faixa }> = ({ plano, topo, altura, faixa }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
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
      <div style={{ position: "absolute", left: 96, right: 96, top: topo, height: altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 96, top: topo - 40 }}>
        zona · topo {topo} · altura {altura}
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: faixa.topo, height: faixa.base - faixa.topo, border: "3px dashed #7CFF6B" }} />
      <div style={{ ...etiqueta, color: "#7CFF6B", right: 120, top: faixa.topo - 40 }}>etiquetas do peito</div>
      <div style={{ position: "absolute", left: 260, right: 260, top: LEGENDA_BASE - 86, height: 86, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 260, top: LEGENDA_BASE - 126 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
