import { useVideoConfig } from "remotion";
import { BLOCO } from "../layout";
import { FUNIL } from "../funil";
import type { Plano } from "../plano";
import { fonte, LIMITE_APP } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto, a faixa dos cartões, a coluna do funil, o caminho do bloco e a legenda.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  legendaY: number;
}> = ({ plano, zona, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.45)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>
        cartões · topo {zona.topo} · altura {zona.altura}
      </div>
      <div style={{ position: "absolute", left: FUNIL.centro - FUNIL.larguraMax / 2, width: FUNIL.larguraMax, top: FUNIL.boca, height: FUNIL.base - FUNIL.boca, border: "3px dashed #B48CFF" }} />
      <div style={{ ...etiqueta, color: "#B48CFF", left: FUNIL.centro - FUNIL.larguraMax / 2 + 10, top: FUNIL.boca - 40 }}>área do funil</div>
      <div style={{ position: "absolute", left: width - BLOCO.margem - BLOCO.max, width: BLOCO.max, top: 130, height: 1250 - 130, border: "3px dashed #FF9F45" }} />
      <div style={{ position: "absolute", left: width - BLOCO.margemBaixo - BLOCO.min, width: BLOCO.min, top: 1250, height: LIMITE_APP - 1250, border: "3px dashed #FF9F45" }} />
      <div style={{ ...etiqueta, color: "#FF9F45", left: width - BLOCO.margem - BLOCO.max, top: 90 }}>faixa do bloco (embaixo, longe dos botões do app)</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 64, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 70 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
