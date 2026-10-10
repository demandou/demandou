import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// mostram onde o plano acha que estão o rosto, a zona dos componentes e a legenda.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  legendaY: number;
}> = ({ plano, zona, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  // abaixo desta linha fica a interface do aplicativo (legenda do post, botões)
  const limiteApp = height - 320;

  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div
        style={{
          position: "absolute",
          left: zona.esquerda,
          right: zona.direita,
          top: zona.topo,
          height: zona.altura,
          border: "3px dashed #00E5FF",
        }}
      />
      <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>
        zona · topo {zona.topo} · altura {zona.altura}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 54, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 60 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
