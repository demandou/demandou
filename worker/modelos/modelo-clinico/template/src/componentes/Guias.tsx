import type { Areas } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que estão
// o rosto, a zona do texto em tela cheia, a lupa, o cabeçalho, o corpo do desenho e a legenda.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  caixa: Caixa;
  areas: Areas | null;
}> = ({ plano, zona, caixa, areas }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      {caixa.w > 1070 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>
            texto em tela cheia · topo {zona.topo}
          </div>
        </>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: caixa.raio,
          border: "3px solid #7CFC00",
        }}
      />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + caixa.w / 2 - 50, top: caixa.y + 12 }}>pessoa</div>
      {areas ? (
        <>
          <div style={{ position: "absolute", left: areas.cabecalho.x, top: areas.cabecalho.y, width: areas.cabecalho.w, height: areas.cabecalho.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: areas.cabecalho.x + 6, top: areas.cabecalho.y + 6 }}>cabeçalho</div>
          <div style={{ position: "absolute", left: areas.corpo.x, top: areas.corpo.y, width: areas.corpo.w, height: areas.corpo.h, border: "3px dashed #E040FB" }} />
          <div style={{ ...etiqueta, color: "#E040FB", left: areas.corpo.x + 6, top: areas.corpo.y + areas.corpo.h - 44 }}>desenho</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: LEGENDA_Y + 80 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
