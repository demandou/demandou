import { JANELAS } from "../layout";
import type { Plano } from "../plano";
import { fonte, H, LIMITE_APP, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que está
// o rosto, a faixa das artes de quadro cheio, a legenda, o limite da interface do app e as janelas.
export const Guias: React.FC<{ plano: Plano; zona: { topo: number; altura: number }; legendaY: number }> = ({ plano, zona, legendaY }) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * H;
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
      <div style={{ position: "absolute", left: 60, right: 60, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 60, top: zona.topo - 40 }}>
        zona · topo {zona.topo} · altura {zona.altura}
      </div>
      {Object.entries(JANELAS).map(([nome, c]) => (
        <div key={nome} style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, border: "2px dotted rgba(255,255,255,0.45)", borderRadius: c.raio }}>
          <div style={{ ...etiqueta, color: "#fff", fontSize: 22, left: 8, top: 8 }}>janela {nome}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
