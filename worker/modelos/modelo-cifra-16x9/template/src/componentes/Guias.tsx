import { areaDe, janelasDo, ladoDe, type Zona } from "../layout";
import type { Plano } from "../plano";
import { fonte, H, LIMITE_APP, MARGEM, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (1920×1080):
// onde o plano acha que está o rosto, o cartão de quadro cheio (no peito), as quatro molduras da
// direita com o quadro da arte à esquerda, a coluna do metrônomo, a legenda e os controles do player.
export const Guias: React.FC<{ plano: Plano; zona: Zona; legendaY: number }> = ({ plano, zona, legendaY }) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * H;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  const cartao = areaDe("cheio", zona);
  const quadro = areaDe("topo", zona);
  const lado = ladoDe("canto");
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: cartao.x, top: cartao.y, width: cartao.w, height: cartao.h, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: cartao.x, top: cartao.y - 38 }}>
        cartão (zona) · topo {zona.topo} · altura {zona.altura}
      </div>
      <div style={{ position: "absolute", left: quadro.x, top: quadro.y, width: quadro.w, height: quadro.h, border: "2px dashed rgba(255,170,0,0.7)" }}>
        <div style={{ ...etiqueta, color: "#FFAA00", left: 8, top: 8 }}>quadro (a arte)</div>
      </div>
      {lado ? (
        <div style={{ position: "absolute", left: lado.x, top: lado.y, width: lado.w, height: lado.h, border: "2px dotted rgba(255,170,0,0.5)" }}>
          <div style={{ ...etiqueta, color: "#FFAA00", fontSize: 20, left: 8, bottom: 8 }}>metrônomo (canto)</div>
        </div>
      ) : null}
      {Object.entries(janelasDo(plano)).map(([nome, c]) => (
        <div key={nome} style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, border: "2px dotted rgba(255,255,255,0.45)", borderRadius: c.raio }}>
          <div style={{ ...etiqueta, color: "#fff", fontSize: 20, left: 8, top: 8 }}>moldura {nome}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: legendaY - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8, fontSize: 20 }}>abaixo daqui: controles do player</div>
    </>
  );
};
