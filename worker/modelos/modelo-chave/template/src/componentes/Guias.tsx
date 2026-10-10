import { useVideoConfig } from "remotion";
import { portaDeBaixo } from "../layout";
import type { Plano } from "../plano";
import { AREA, MARGEM, MARGEM_HALL, PISO_Y, PORTA_FAIXA, PORTA_FAIXA_LARGURA, PORTA_LATERAL, QUADRO, W } from "../tema";
import { LEGENDA_Y } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// faixa das artes no peito, quadro de chaves, portas dos itens, legenda e limite da interface.
export const Guias: React.FC<{ plano: Plano; topo: number }> = ({ plano, topo }) => {
  const { width, height } = useVideoConfig();
  const x = width / 2;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const limiteApp = 1560;
  const caixa = (l: number, t: number, w: number, h: number, c: string): React.CSSProperties => ({ position: "absolute", left: l, top: t, width: w, height: h, border: `3px dashed ${c}` });
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={caixa(60, topo, width - 120, 1540 - topo, "#00E5FF")} />
      <div style={{ ...etiqueta, left: 60, top: topo - 40 }}>artes no peito · topo {topo}</div>
      <div style={caixa(MARGEM, QUADRO.y, W - 2 * MARGEM, QUADRO.fundo - QUADRO.y, "#FF9F43")} />
      <div style={{ ...etiqueta, color: "#FF9F43", left: MARGEM, top: QUADRO.y - 40 }}>quadro de chaves (itens)</div>
      <div style={caixa(MARGEM_HALL, AREA.topo, PORTA_LATERAL, PISO_Y - AREA.topo, "#B388FF")} />
      <div style={caixa((W - PORTA_FAIXA_LARGURA) / 2, AREA.topo, PORTA_FAIXA_LARGURA, PORTA_FAIXA, "rgba(179,136,255,0.6)")} />
      <div style={{ ...etiqueta, color: "#B388FF", left: MARGEM_HALL + 10, top: AREA.topo + 40 }}>portas dos itens</div>
      {(() => {
        const p = portaDeBaixo(plano);
        return (
          <>
            <div style={caixa(p.x, p.y, p.w, p.h, "#7CFC9A")} />
            <div style={{ ...etiqueta, color: "#7CFC9A", left: p.x + 10, top: p.y + 10 }}>porta de baixo (blocos de parede)</div>
          </>
        );
      })()}
      <div style={caixa(60, LEGENDA_Y, width - 120, 74, "#FFD400")} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
