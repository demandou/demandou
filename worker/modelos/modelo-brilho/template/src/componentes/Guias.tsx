// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto (com o rastro), as zonas de maquiagem, a caixa da pessoa, a legenda e a interface.
// A grade em frações (0,05 em 0,05) serve para medir o rosto num quadro qualquer.
import type { Caixa } from "../motor/caixa";
import type { Plano, Zona } from "../plano";
import { type RostoNaTela, uv, ZONAS } from "../rosto";
import { fonte, LEGENDA_Y, LIMITE_APP } from "../tema";

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; rosto: RostoNaTela; t: number }> = ({ plano, caixa, rosto, t }) => {
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 700,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "1px 8px",
    whiteSpace: "nowrap",
  };
  const marcas = Array.from({ length: 19 }, (_, i) => (i + 1) * 5);
  const zonas = Object.keys(ZONAS) as Zona[];
  return (
    <>
      {marcas.map((m) => {
        const forte = m % 10 === 0;
        const linha = forte ? "rgba(0,229,255,0.5)" : "rgba(0,229,255,0.2)";
        return (
          <div key={m}>
            <div style={{ position: "absolute", left: `${m}%`, top: 0, bottom: 0, width: forte ? 2 : 1, background: linha }} />
            <div style={{ position: "absolute", top: `${m}%`, left: 0, right: 0, height: forte ? 2 : 1, background: linha }} />
            {forte ? (
              <>
                <div style={{ ...etiqueta, left: `calc(${m}% + 3px)`, top: 4, fontSize: 22 }}>{m / 100}</div>
                <div style={{ ...etiqueta, top: `calc(${m}% + 3px)`, left: 4, fontSize: 22 }}>{m / 100}</div>
              </>
            ) : null}
          </div>
        );
      })}
      {/* rosto: elipse com a largura medida e cruz no centro (segue o rastro) */}
      <div
        style={{
          position: "absolute",
          left: rosto.cx - rosto.W / 2,
          top: rosto.cy - rosto.W * 0.62,
          width: rosto.W,
          height: rosto.W * 1.3,
          borderRadius: "50%",
          border: "3px dashed #7CFC00",
        }}
      />
      <div style={{ position: "absolute", left: rosto.cx - 40, top: rosto.cy - 1.5, width: 80, height: 3, background: "#7CFC00" }} />
      <div style={{ position: "absolute", left: rosto.cx - 1.5, top: rosto.cy - 40, width: 3, height: 80, background: "#7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: rosto.cx + rosto.W / 2 + 8, top: rosto.cy - rosto.W * 0.6 }}>
        rosto {plano.rosto.rastro ? "(rastro)" : "(fixo)"} · t {t.toFixed(2)}
      </div>
      {zonas.map((z) =>
        ([1, -1] as const).map((s) => {
          if (ZONAS[z].u === 0 && s === -1) return null;
          const p = rosto.ponto(uv(z, s, plano));
          return (
            <div key={`${z}-${s}`}>
              <div style={{ position: "absolute", left: p.x - 7, top: p.y - 7, width: 14, height: 14, borderRadius: 7, background: "#FF3BD4", border: "2px solid #fff" }} />
              {s === 1 ? <div style={{ ...etiqueta, fontSize: 20, color: "#FF9BEA", left: p.x + 10, top: p.y - 12 }}>{z}</div> : null}
            </div>
          );
        }),
      )}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #FFD400", boxSizing: "border-box" }} />
      {/* a legenda fica em cima da pessoa (no layout "lado", só na largura dela) */}
      <div
        style={{
          position: "absolute",
          left: caixa.w < 1000 ? caixa.x + 30 : 60,
          width: caixa.w < 1000 ? caixa.w - 60 : 960,
          top: LEGENDA_Y,
          height: 70,
          border: "3px dashed #FFD400",
        }}
      />
      <div style={{ ...etiqueta, color: "#FFD400", left: caixa.w < 1000 ? caixa.x + 30 : 60, top: LEGENDA_Y + 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
