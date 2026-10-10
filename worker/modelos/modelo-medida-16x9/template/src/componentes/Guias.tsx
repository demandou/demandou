import { CARD, H, LIMITE_PLAYER, PALCO, W, type CaixaDaLegenda } from "../layout";
import type { Plano } from "../plano";
import { SORA } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado
// (1920×1080): o rosto, o papel da esquerda onde os blocos desenham, a moldura da pessoa à direita,
// a legenda e o limite dos controles do player.
export const Guias: React.FC<{ plano: Plano; legenda: CaixaDaLegenda }> = ({ plano, legenda }) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * H;
  const etiqueta: React.CSSProperties = { position: "absolute", fontFamily: SORA, fontWeight: 600, fontSize: 24, color: "#00E5FF", background: "rgba(0,0,0,0.6)", padding: "2px 10px", whiteSpace: "nowrap" };
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto (tela cheia)</div>
      <div style={{ position: "absolute", left: PALCO.x, top: PALCO.y, width: PALCO.w, height: PALCO.h, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: PALCO.x, top: PALCO.y - 38 }}>papel (blocos)</div>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, border: "3px dashed #7CFF6B", borderRadius: CARD.r }} />
      <div style={{ ...etiqueta, color: "#7CFF6B", left: CARD.x + 20, top: CARD.y + 10 }}>moldura</div>
      <div style={{ position: "absolute", left: legenda.x, width: legenda.w, top: legenda.y - 36, height: 72, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: legenda.x, top: legenda.y - 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_PLAYER, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_PLAYER + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
