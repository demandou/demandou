import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { LEGENDA, LIMITE_APP, MARGEM, type Rect, texto } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado: o rosto
// que o plano mediu (no vídeo em tela cheia), a foto em arco da pessoa (a moldura da direita), as
// margens laterais do YouTube, a faixa da legenda da tela cheia e o limite dos controles do player.
// (`arco` nulo: o vídeo está em tela cheia e não há foto)
export const Guias: React.FC<{ plano: Plano; arco: Rect | null; legenda: boolean }> = ({ plano, arco, legenda }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: texto,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: width - MARGEM - 2, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 20 }}>rosto (vídeo em tela cheia)</div>
      {arco ? (
        <>
          <div style={{ position: "absolute", left: arco.x, top: arco.y, width: arco.w, height: arco.h, border: "3px dashed #B967FF", borderRadius: `${arco.w / 2}px ${arco.w / 2}px 0 0` }} />
          <div style={{ ...etiqueta, color: "#B967FF", left: arco.x, top: arco.y + arco.h + 8 }}>foto em arco (moldura)</div>
        </>
      ) : null}
      {legenda ? (
        <>
          <div style={{ position: "absolute", left: (width - LEGENDA.largura) / 2, width: LEGENDA.largura, top: LEGENDA.base - 160, height: 160, border: "3px dashed #FFD400" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: (width - LEGENDA.largura) / 2, top: LEGENDA.base - 200 }}>legenda</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
