import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { fonte, LIMITE_APP } from "../tema";
import { LEGENDA_Y } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// mostram onde o plano acha que estão o rosto, a zona das etiquetas e a legenda.
export const Guias: React.FC<{ plano: Plano; topo: number; altura: number }> = ({ plano, topo, altura }) => {
  const { width } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * 1920;
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
      <div style={{ position: "absolute", left: 64, right: 64, top: topo, height: altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 64, top: topo - 40 }}>
        zona · topo {topo} · altura {altura}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 80, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 86 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
