import type { Regiao } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_BASE, LEGENDA_CORPO, LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto, a janela da pessoa, o cabeçalho, a conta e a legenda.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; cabecalho: Regiao | null; principal: Regiao | null }> = ({
  plano,
  caixa,
  cabecalho,
  principal,
}) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const caixaGuia = (r: Regiao, corGuia: string, nome: string) => (
    <>
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `3px dashed ${corGuia}` }} />
      <div style={{ ...etiqueta, color: corGuia, left: r.x + 8, top: r.y + r.h - 44 }}>{nome}</div>
    </>
  );
  return (
    <>
      {caixa.w > 1070 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + 8, top: caixa.y + 8 }}>pessoa</div>
      {cabecalho ? caixaGuia(cabecalho, "#FF8C00", "cabeçalho") : null}
      {principal ? caixaGuia(principal, "#FF5CF0", "conta") : null}
      <div
        style={{ position: "absolute", left: 40, right: 40, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 27, height: LEGENDA_CORPO * 1.15 + 27, border: "3px dashed #FFD400" }}
      />
      <div style={{ ...etiqueta, color: "#FFD400", left: 40, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 70 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
