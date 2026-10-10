import { useVideoConfig } from "remotion";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { BASE_CONTEUDO, CONTADOR, fonte, LEGENDA_Y, LIMITE_APP, PONTOS_ALTURA, PONTOS_Y } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// rosto, zona dos cartões nas páginas da pessoa, caixa da pessoa, legenda, pontinhos e interface do app.
export const Guias: React.FC<{ plano: Plano; zonaTopo: number; caixa: Caixa | null }> = ({ plano, zonaTopo, caixa }) => {
  const { width } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * 1920;
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
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: zonaTopo,
          height: BASE_CONTEUDO - zonaTopo,
          border: "3px dashed #00E5FF",
        }}
      />
      <div style={{ ...etiqueta, left: 60, top: zonaTopo - 40 }}>zona dos cartões · topo {zonaTopo}</div>
      {caixa ? (
        <>
          <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #B78CFF", borderRadius: caixa.raio }} />
          <div style={{ ...etiqueta, color: "#B78CFF", left: caixa.x + 10, top: caixa.y + 10 }}>pessoa</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 74 }}>legenda</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: PONTOS_Y, height: PONTOS_ALTURA, border: "3px dashed #FF9F1C" }} />
      {/* canto do contador "3/7": nenhuma página põe conteúdo aqui */}
      <div style={{ position: "absolute", right: CONTADOR.direita, top: CONTADOR.topo, width: CONTADOR.largura, height: CONTADOR.altura, border: "3px dashed #FF9F1C" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
