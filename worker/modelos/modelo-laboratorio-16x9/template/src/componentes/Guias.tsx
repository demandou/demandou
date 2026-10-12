import type { Regiao } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { H, LEGENDA_BASE, LEGENDA_CORPO, LIMITE_APP, sans, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto, a janela da pessoa, o cabeçalho, a figura e a legenda.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; cabecalho: Regiao | null; corpo: Regiao | null }> = ({ plano, caixa, cabecalho, corpo }) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * H;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.7)",
    padding: "2px 10px",
  };
  const caixaGuia = (r: Regiao, c: string, nome: string) => (
    <>
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `3px dashed ${c}` }} />
      <div style={{ ...etiqueta, color: c, left: r.x + 8, top: r.y + r.h - 44 }}>{nome}</div>
    </>
  );
  return (
    <>
      {caixa.w > W - 10 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00B8D4" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00B8D4" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #39D353", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, color: "#39D353", left: caixa.x + caixa.w / 2 - 50, top: caixa.y + 8 }}>pessoa</div>
      {cabecalho ? caixaGuia(cabecalho, "#FF8C00", "cabeçalho") : null}
      {corpo ? caixaGuia(corpo, "#E040FB", "figura") : null}
      <div style={{ position: "absolute", left: 40, right: 40, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 28, height: LEGENDA_CORPO * 1.15 + 28, border: "3px dashed #FFC400" }} />
      <div style={{ ...etiqueta, color: "#FFC400", left: 40, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 72 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
