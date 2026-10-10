import { AREA_DO_PAINEL, colunaDoCartao, JANELA } from "../layout";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_PLAYER, MARGEM, QUADRO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9):
// onde o plano acha que está o rosto, a coluna dos cartões de quadro cheio, a área do painel, a
// moldura da pessoa, a faixa da legenda e a linha dos controles do player.
export const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const x = plano.rosto.x * QUADRO.w;
  const y = plano.rosto.y * QUADRO.h;
  const coluna = colunaDoCartao(plano);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 22,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const caixa = (l: number, t: number, w: number, h: number, c: string): React.CSSProperties => ({
    position: "absolute",
    left: l,
    top: t,
    width: w,
    height: h,
    border: `3px dashed ${c}`,
  });

  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 16 }}>rosto</div>
      <div style={caixa(coluna.x, coluna.y, coluna.w, coluna.h, "#00E5FF")} />
      <div style={{ ...etiqueta, left: coluna.x + 8, top: coluna.y + 8 }}>
        cartões (quadro cheio) · {coluna.w} px · {coluna.caixa.zoom && coluna.caixa.zoom > 1 ? `vídeo desliza (zoom ${coluna.caixa.zoom.toFixed(2)})` : "sem deslize"}
      </div>
      <div style={caixa(AREA_DO_PAINEL.x, AREA_DO_PAINEL.topo, AREA_DO_PAINEL.direita - AREA_DO_PAINEL.x, AREA_DO_PAINEL.base - AREA_DO_PAINEL.topo, "#7CFFB2")} />
      <div style={{ ...etiqueta, color: "#7CFFB2", left: AREA_DO_PAINEL.x + 8, top: AREA_DO_PAINEL.base - 36 }}>painel</div>
      <div style={{ ...caixa(JANELA.x, JANELA.y, JANELA.w, JANELA.h, "#B388FF"), borderRadius: JANELA.raio }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: JANELA.x + 12, top: JANELA.y + 12 }}>moldura</div>
      <div style={caixa(MARGEM, LEGENDA_Y, QUADRO.w - 2 * MARGEM, 80, "#FFD400")} />
      <div style={{ ...etiqueta, color: "#FFD400", right: MARGEM, top: LEGENDA_Y - 32 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_PLAYER, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_PLAYER + 6 }}>abaixo daqui: controles do player</div>
    </>
  );
};
