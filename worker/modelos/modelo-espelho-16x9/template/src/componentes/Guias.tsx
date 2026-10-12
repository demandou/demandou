import { paginaNoQuadro, pessoaNaCaixa } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { FOLGA_DA_LINHA, LEGENDA_Y, LIMITE_APP, LIMITE_DIREITO, MARGEM_ESQUERDA, QUADRO, sans, TOPO_SEGURO } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado: onde o
// modelo acha que estão o alto da cabeça, o centro do rosto e o queixo da pessoa, a moldura dela
// (à direita; a borda esquerda é a linha do espelho de pé), a faixa da página no quadro da
// esquerda, a linha da legenda e o começo dos controles do player.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; linha?: number }> = ({ plano, caixa, linha }) => {
  const p = pessoaNaCaixa(caixa, plano);
  const x = caixa.x + caixa.w / 2;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const dividida = caixa.x > 40 && linha !== undefined;
  const pagina = linha !== undefined ? paginaNoQuadro(linha) : { x: 0, y: 0 };
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
          <div style={{ position: "absolute", left: x - 160, top: g.y, width: 320, height: 3, background: "#00E5FF", opacity: 0.8 }} />
          <div style={{ ...etiqueta, left: x - 160, top: g.y + 6 }}>{g.nome}</div>
        </div>
      ))}
      {dividida && linha !== undefined ? (
        <>
          <div
            style={{
              position: "absolute",
              left: MARGEM_ESQUERDA + pagina.x,
              width: LIMITE_DIREITO - MARGEM_ESQUERDA,
              top: TOPO_SEGURO + pagina.y,
              height: linha - FOLGA_DA_LINHA - TOPO_SEGURO,
              border: "3px dashed #FF8C00",
            }}
          />
          <div style={{ ...etiqueta, color: "#FF8C00", left: MARGEM_ESQUERDA + pagina.x + 10, top: TOPO_SEGURO + pagina.y + 6 }}>
            página · linha do espelho em x {Math.round(caixa.x)}
          </div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #7CFC00", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LEGENDA_Y, height: 2, background: "#FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 20, top: LEGENDA_Y - 34 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP - 36 }}>abaixo daqui: controles do player</div>
      <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: QUADRO.h, boxSizing: "border-box", border: "1px solid rgba(255,59,107,0.4)" }} />
    </>
  );
};
