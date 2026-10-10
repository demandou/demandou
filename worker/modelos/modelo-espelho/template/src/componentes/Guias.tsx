import { pessoaNaCaixa, QUEIXO_MAX } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { FOLGA_DA_LINHA, LIMITE_APP, LIMITE_DIREITO, sans, TOPO_SEGURO } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o modelo acha que
// estão o alto da cabeça, o centro do rosto e o queixo da pessoa, a moldura dela, a linha do
// espelho, a faixa de cima (onde ficam desenho e textos), o queixo máximo e a interface do app.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa }> = ({ plano, caixa }) => {
  const p = pessoaNaCaixa(caixa, plano);
  const x = caixa.x + caixa.w / 2;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const dividida = caixa.y > 40;
  return (
    <>
      {/* rosto: cruz no centro, traços no alto da cabeça e no queixo */}
      <div style={{ position: "absolute", left: x - 60, top: p.centro, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: p.centro - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: p.centro - 18 }}>rosto</div>
      {[
        { y: p.topo, nome: "alto da cabeça (estimado)" },
        { y: p.queixo, nome: "queixo (estimado)" },
      ].map((g) => (
        <div key={g.nome}>
          <div style={{ position: "absolute", left: x - 200, top: g.y, width: 400, height: 3, background: "#00E5FF", opacity: 0.8 }} />
          <div style={{ ...etiqueta, left: x + 210, top: g.y - 18 }}>{g.nome}</div>
        </div>
      ))}
      {dividida ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 60,
              width: LIMITE_DIREITO - 60,
              top: TOPO_SEGURO,
              height: caixa.y - FOLGA_DA_LINHA - TOPO_SEGURO,
              border: "3px dashed #FF8C00",
            }}
          />
          <div style={{ ...etiqueta, color: "#FF8C00", left: 70, top: TOPO_SEGURO + 6 }}>faixa de cima · linha em {Math.round(caixa.y)} px</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: QUEIXO_MAX, height: 2, background: "#FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 20, top: QUEIXO_MAX + 6 }}>queixo máximo</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
      <div style={{ position: "absolute", left: LIMITE_DIREITO, top: 0, width: 2, height: 1920, background: "#FF3B6B", opacity: 0.6 }} />
    </>
  );
};
