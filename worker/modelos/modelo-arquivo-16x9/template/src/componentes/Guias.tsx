import type { Regiao } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_BASE, LEGENDA_Y, LIMITE_APP, MARGEM, QUADRO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado
// (1920×1080): onde o plano acha que estão o rosto, a faixa dos supers, a caixa da pessoa (a foto na
// moldura da direita, como manda a aula 9), a região do documento (o quadro da esquerda), a legenda
// e a linha dos controles do player.
export const Guias: React.FC<{
  plano: Plano;
  area: { x: number; y: number; w: number; h: number };
  caixa: Caixa;
  regiao: Regiao | null;
}> = ({ plano, area, caixa, regiao }) => {
  const x = plano.rosto.x * QUADRO.w;
  const y = plano.rosto.y * QUADRO.h;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      {caixa.w > QUADRO.w - 10 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: area.x, top: area.y - 38 }}>
        supers · topo {Math.round(area.y)} · altura {Math.round(area.h)}
      </div>
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
      {regiao ? (
        <>
          <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w, height: regiao.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: regiao.x + 8, top: regiao.y + regiao.h - 40 }}>documento</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: LEGENDA_Y, height: LEGENDA_BASE - LEGENDA_Y, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: LEGENDA_Y - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
