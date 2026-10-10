import { CARD, PALCO } from "../layout";
import type { Plano } from "../plano";
import { SORA } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto, a área do papel
// onde os blocos desenham, a moldura da pessoa, a legenda e o limite da interface do aplicativo.
export const Guias: React.FC<{ plano: Plano; legendaY: number }> = ({ plano, legendaY }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = { position: "absolute", fontFamily: SORA, fontWeight: 600, fontSize: 26, color: "#00E5FF", background: "rgba(0,0,0,0.6)", padding: "2px 10px" };
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto (tela cheia)</div>
      <div style={{ position: "absolute", left: PALCO.x, top: PALCO.y, width: PALCO.w, height: PALCO.h, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: PALCO.x, top: PALCO.y - 40 }}>papel (blocos)</div>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, border: "3px dashed #7CFF6B", borderRadius: CARD.r }} />
      <div style={{ ...etiqueta, color: "#7CFF6B", left: CARD.x + 20, top: CARD.y + 10 }}>moldura</div>
      <div style={{ position: "absolute", left: 70, width: 940, top: legendaY - 38, height: 76, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 70, top: legendaY + 44 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1700, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: 1708 }}>abaixo daqui: interface do app</div>
    </>
  );
};
