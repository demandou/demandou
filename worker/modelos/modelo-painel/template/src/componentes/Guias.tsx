import { useVideoConfig } from "remotion";
import { JANELA, PAINEL, xDaJanela } from "../layout";
import type { Plano } from "../plano";
import { sans } from "../tema";
import type { Zona } from "./Cartao";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto, a zona dos componentes de quadro cheio, as legendas e as duas janelas.
export const Guias: React.FC<{ plano: Plano; zona: Zona; legendaCheia: number }> = ({ plano, zona, legendaCheia }) => {
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
      <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo + zona.altura + 8 }}>
        zona (quadro cheio) · topo {zona.topo} · altura {zona.altura}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaCheia, height: 58, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", right: 60, top: legendaCheia - 38 }}>legenda (quadro cheio)</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: PAINEL.legenda, height: 58, border: "3px dashed #FFD400", opacity: 0.6 }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: PAINEL.legenda + 64 }}>legenda (painel)</div>
      {(["esq", "dir"] as const).map((lado) => (
        <div key={lado}>
          <div
            style={{
              position: "absolute",
              left: xDaJanela(lado),
              top: JANELA.y,
              width: JANELA.w,
              height: JANELA.h,
              borderRadius: JANELA.raio,
              border: "3px dashed #B388FF",
            }}
          />
          <div style={{ ...etiqueta, color: "#B388FF", left: xDaJanela(lado) + 12, top: JANELA.y + 12 }}>janela {lado}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
