import { useVideoConfig } from "remotion";
import { type Arranjo, lugarDoPeito } from "../layout";
import type { Momento, Plano } from "../plano";
import { LIMITE_APP, MARGEM, MOLDURA, QUADRO_ESQUERDO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado:
// onde o plano acha que está o rosto, a faixa do peito (blocos da tela cheia), o quadro da esquerda
// e a moldura da direita (blocos de apoio visual, regra da aula 9), a legenda e a linha dos
// controles do player.
export const Guias: React.FC<{
  plano: Plano;
  mapa: Map<Momento, Arranjo>;
  legendaY: number;
}> = ({ plano, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const peito = lugarDoPeito(plano, false);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };

  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      {peito ? (
        <>
          <div style={{ position: "absolute", left: peito.x, top: peito.y, width: peito.w, height: peito.h, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: peito.x, top: peito.y - 38 }}>
            peito ({peito.lado}) · topo {peito.y} · altura {peito.h}
          </div>
        </>
      ) : (
        <div style={{ ...etiqueta, left: MARGEM, top: 40 }}>sem lugar no peito: todos os blocos vão para o quadro</div>
      )}
      <div style={{ position: "absolute", left: QUADRO_ESQUERDO.x, top: QUADRO_ESQUERDO.y, width: QUADRO_ESQUERDO.w, height: QUADRO_ESQUERDO.h, border: "3px dashed rgba(255,159,28,0.7)" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: QUADRO_ESQUERDO.x, top: QUADRO_ESQUERDO.y + 8 }}>quadro (bloco de apoio)</div>
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, border: "3px dashed rgba(255,159,28,0.7)" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: MOLDURA.x + 8, top: MOLDURA.y + 8 }}>moldura (a pessoa)</div>
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: legendaY, height: 54, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: legendaY - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: Math.min(height - 40, LIMITE_APP + 8) }}>abaixo daqui: controles do player</div>
    </>
  );
};
