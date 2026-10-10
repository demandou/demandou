import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { ARO, DIREITA_SEGURA, LIMITE_APP, LUZ, NEGATOSCOPIO, PESSOA_CENTRO, PESSOA_DIREITA, PESSOA_ESQUERDA, sans, TOPO } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto e linha do centro,
// zona das artes de quadro cheio, as três chapas da pessoa, o negatoscópio, a legenda e os limites
// do aplicativo (topo, base e coluna de botões à direita).
export const Guias: React.FC<{ plano: Plano; zona: { topo: number; altura: number }; legendaY: number }> = ({ plano, zona, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  const caixa = (c: { x: number; y: number; w: number; h: number }, corG: string, nome: string, folga = LUZ + ARO) => (
    <>
      <div style={{ position: "absolute", left: c.x - folga, top: c.y - folga, width: c.w + 2 * folga, height: c.h + 2 * folga, border: `3px dashed ${corG}` }} />
      <div style={{ ...etiqueta, color: corG, left: c.x - folga + 6, top: c.y - folga + 6 }}>{nome}</div>
    </>
  );
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, color: "#00E5FF", left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: zona.topo, height: zona.altura, border: "3px dashed #4DA3FF" }} />
      <div style={{ ...etiqueta, color: "#4DA3FF", left: 66, top: zona.topo + 6 }}>artes de quadro cheio · topo {zona.topo}</div>
      {caixa(PESSOA_ESQUERDA, "#C77DFF", "pessoa · esquerda")}
      {caixa(PESSOA_DIREITA, "#C77DFF", "pessoa · direita")}
      {caixa(PESSOA_CENTRO, "#E0AAFF", "pessoa · pausa")}
      {caixa(NEGATOSCOPIO, "#FF9F43", "negatoscópio", 0)}
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 56, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 66, top: legendaY + 62 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 2, background: "#FF3B6B" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
      <div style={{ position: "absolute", left: DIREITA_SEGURA, top: 0, width: 0, height, borderLeft: "2px dashed rgba(255,59,107,0.7)" }} />
    </>
  );
};
