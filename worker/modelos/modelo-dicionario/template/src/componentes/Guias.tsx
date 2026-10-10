import { useVideoConfig } from "remotion";
import type { Caixa } from "../motor/caixa";
import type { Regiao } from "../layout";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, caixa da pessoa,
// área do verbete, topo do frontispício, legenda e o limite da interface do app.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; regiao: Regiao | null; topoFrontispicio: number }> = ({ plano, caixa, regiao, topoFrontispicio }) => {
  const { width } = useVideoConfig();
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const cheia = caixa.w >= 1079;
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * 1920;
  return (
    <>
      {cheia ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: topoFrontispicio, height: 3, background: "#00E5FF", opacity: 0.8 }} />
          <div style={{ ...etiqueta, left: 20, top: topoFrontispicio - 40 }}>topo da página (frontispício) · {topoFrontispicio}</div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "4px dashed #3DDC84" }} />
          <div style={{ ...etiqueta, color: "#3DDC84", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
        </>
      )}
      {regiao ? (
        <>
          <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w, height: regiao.h, border: "3px dashed #FF9F1C" }} />
          <div style={{ ...etiqueta, color: "#FF9F1C", left: regiao.x + 8, top: regiao.y + regiao.h - 44 }}>verbete</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 74 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
