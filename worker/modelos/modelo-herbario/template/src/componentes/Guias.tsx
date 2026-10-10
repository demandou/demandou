import { CABECALHO, TOPO_DESENHO, type Layout } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto, a linha do centro,
// o oval da pessoa, o cabeçalho e a área do desenho de cada layout, a legenda e o limite da interface.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  caixa: Caixa;
  layout: Layout;
}> = ({ plano, zona, caixa, layout }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const cab = layout === "canto" || layout === "lado" ? CABECALHO[layout] : null;
  return (
    <>
      {caixa.w > 1070 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: 539, top: 0, width: 1.5, height: 1920, background: "rgba(0,229,255,0.5)" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>cartão em tela cheia · topo {zona.topo}</div>
        </>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: caixa.w > 1070 ? 0 : "50%",
          border: "3px solid #7CFC00",
        }}
      />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + caixa.w / 2 - 50, top: caixa.y + 12 }}>pessoa</div>
      {cab ? (
        <>
          <div style={{ position: "absolute", left: cab.x, top: cab.y, width: cab.w, height: cab.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: cab.x + 6, top: cab.y + cab.h - 40 }}>cabeçalho</div>
          <div style={{ position: "absolute", left: 40, right: 40, top: TOPO_DESENHO, height: LIMITE_APP - 20 - TOPO_DESENHO, border: "3px dashed #E040FB" }} />
          <div style={{ ...etiqueta, color: "#E040FB", left: 50, top: LIMITE_APP - 70 }}>desenho</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
