import type { Areas } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP, MARGEM, QUADRO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que estão
// o rosto, a faixa do texto em tela cheia, a lupa (a moldura da direita), o cabeçalho, o corpo do
// exame e a legenda, no quadro deitado 1920×1080.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  caixa: Caixa;
  areas: Areas | null;
}> = ({ plano, zona, caixa, areas }) => {
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
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 38 }}>
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
          <div style={{ ...etiqueta, color: "#E040FB", left: areas.corpo.x + 6, top: areas.corpo.y + areas.corpo.h - 42 }}>desenho</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: LEGENDA_Y, height: 76, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: LEGENDA_Y - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
