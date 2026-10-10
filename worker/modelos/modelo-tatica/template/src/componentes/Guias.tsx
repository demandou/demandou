import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { CABECALHO, CAIXA_TV, fonte, PLACAR } from "../tema";
import { LEGENDA_Y } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// faixa das artes de quadro cheio, caixa de transmissão, placar, legenda e limite da interface.
export const Guias: React.FC<{ plano: Plano; topo: number }> = ({ plano, topo }) => {
  const { width, height } = useVideoConfig();
  // o rosto na tela em quadro cheio: centro horizontal (o zoom centraliza) e a altura medida
  const x = width / 2;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const limiteApp = 1560;
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: topo, height: 1540 - topo, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 60, top: topo - 40 }}>artes de quadro cheio · topo {topo}</div>
      <div style={{ position: "absolute", left: CAIXA_TV.x, top: CAIXA_TV.y, width: CAIXA_TV.w, height: CAIXA_TV.h, border: "3px dashed #B388FF" }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: CAIXA_TV.x, top: CAIXA_TV.y + CAIXA_TV.h + 6 }}>caixa de transmissão</div>
      <div style={{ position: "absolute", left: PLACAR.x, top: PLACAR.y, width: 360, height: PLACAR.altura, border: "3px dashed #FF9F43" }} />
      <div style={{ position: "absolute", left: CABECALHO.x, top: CABECALHO.y, width: CABECALHO.largura, height: 380, border: "3px dashed #FF9F43" }} />
      <div style={{ ...etiqueta, color: "#FF9F43", left: CABECALHO.x, top: CABECALHO.y + 384 }}>placar e cabeçalho</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
