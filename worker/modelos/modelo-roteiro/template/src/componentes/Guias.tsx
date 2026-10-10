import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { CARTOES, LIMITE_APP, RELOGIO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, zona dos cartões de
// tela cheia, caixa da pessoa, barra do dia e faixa dos cartões do mapa, legenda e limite da interface.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  caixa: Caixa;
  noMapa: boolean;
  legendaY: number;
}> = ({ plano, zona, caixa, noMapa, legendaY }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: 539, top: 0, width: 2, height: 1920, background: "rgba(0,229,255,0.35)" }} />
      {caixa.w > 1070 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>
            cartões · topo {zona.topo} · altura {zona.altura}
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: RELOGIO.x, top: RELOGIO.y, width: RELOGIO.w, height: RELOGIO.rotulosY + 52 - RELOGIO.y, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: RELOGIO.x, top: RELOGIO.y - 40 }}>barra do dia</div>
          <div style={{ position: "absolute", left: 60, right: 60, top: CARTOES.topo, height: CARTOES.base - CARTOES.topo, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: 60, top: CARTOES.topo - 40 }}>cartões das paradas</div>
        </>
      )}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa{noMapa ? " (postal)" : ""}</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
