import type { CenaNoTempo, Retangulo } from "../layout";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, janela da pessoa,
// anel da forma, área das notas, mapa, legenda e o limite da interface do aplicativo.
export const Guias: React.FC<{ plano: Plano; cena: CenaNoTempo; area: Retangulo | null }> = ({ plano, cena, area }) => {
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: 700,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const { janela, orbe, mapa } = cena;
  const cheia = janela.w > 1070;
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const R = orbe.rMax + 52;
  return (
    <>
      {cheia ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: janela.x, top: janela.y, width: janela.w, height: janela.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: janela.x + 12, top: janela.y + janela.h - 46 }}>pessoa</div>
      {orbe.rMax > 5 ? (
        <div style={{ position: "absolute", left: orbe.cx - R, top: orbe.cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", border: "3px dashed #E040FB" }} />
      ) : null}
      {area ? (
        <>
          <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: area.x + 6, top: area.y + 6 }}>notas</div>
        </>
      ) : null}
      {mapa.w > 20 ? <div style={{ position: "absolute", left: mapa.x, top: mapa.y, width: mapa.w, height: mapa.h, border: "3px dashed #00E5FF" }} /> : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 170, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 176 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
