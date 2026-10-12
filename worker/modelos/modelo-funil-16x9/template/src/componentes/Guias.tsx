import { useVideoConfig } from "remotion";
import { FUNIL } from "../funil";
import { PAGINA } from "../pagina";
import type { Plano } from "../plano";
import { AREA_DA_PAGINA, BASE_CARTAO, ESCALA, fonte, LIMITE_APP, MOLDURA } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado: onde o
// plano acha que está o rosto, a faixa dos cartões (do queixo até a base), a área da página e a do
// funil (à esquerda), a moldura da pessoa (à direita) e a legenda.
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
    fontSize: 22,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  const topoCartao = Math.min(zona.topo - 50, BASE_CARTAO - 240);
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.45)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: topoCartao, height: BASE_CARTAO - topoCartao, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: zona.esquerda, top: topoCartao - 34 }}>
        cartões · do queixo ({topoCartao}) até a base ({BASE_CARTAO})
      </div>
      <div
        style={{
          position: "absolute",
          left: AREA_DA_PAGINA.esquerda,
          width: AREA_DA_PAGINA.direita - AREA_DA_PAGINA.esquerda,
          top: AREA_DA_PAGINA.topo,
          height: AREA_DA_PAGINA.base - AREA_DA_PAGINA.topo,
          border: "3px dashed #7CFF6B",
        }}
      />
      <div style={{ ...etiqueta, color: "#7CFF6B", left: AREA_DA_PAGINA.esquerda + 10, top: AREA_DA_PAGINA.topo + 6 }}>página</div>
      <div
        style={{
          position: "absolute",
          left: (FUNIL.centro - FUNIL.larguraMax / 2) * ESCALA,
          width: FUNIL.larguraMax * ESCALA,
          top: FUNIL.boca * ESCALA,
          height: (FUNIL.base - FUNIL.boca) * ESCALA,
          border: "3px dashed #B48CFF",
        }}
      />
      <div style={{ ...etiqueta, color: "#B48CFF", left: (FUNIL.centro - FUNIL.larguraMax / 2) * ESCALA + 10, top: FUNIL.boca * ESCALA - 34 }}>área do funil</div>
      <div style={{ position: "absolute", left: MOLDURA.x, width: MOLDURA.w, top: MOLDURA.y, height: MOLDURA.h, border: "3px dashed #FF9F45" }} />
      <div style={{ ...etiqueta, color: "#FF9F45", left: MOLDURA.x, top: MOLDURA.y - 34 }}>moldura da pessoa</div>
      <div style={{ position: "absolute", left: 96, right: 96, top: legendaY, height: 72, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 96, top: legendaY - 34 }}>legenda</div>
      <div style={{ position: "absolute", left: PAGINA.esquerda * ESCALA, top: PAGINA.base * ESCALA, width: (PAGINA.direita - PAGINA.esquerda) * ESCALA, height: 2, background: "#7CFF6B" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
