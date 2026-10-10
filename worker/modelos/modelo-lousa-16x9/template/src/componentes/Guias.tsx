import type { Regiao } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { H, LEGENDA_BASE, LEGENDA_CORPO, LIMITE_APP, MARGEM, sans, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado: onde o
// plano acha que estão o rosto, a moldura da pessoa (à direita), o cabeçalho, a conta, a legenda
// e a linha dos controles do player.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; cabecalho: Regiao | null; principal: Regiao | null }> = ({
  plano,
  caixa,
  cabecalho,
  principal,
}) => {
  const x = plano.rosto.x * W;
  const y = plano.rosto.y * H;
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
      {caixa.w > W - 10 ? (
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
        style={{ position: "absolute", left: MARGEM, right: MARGEM, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 25, height: LEGENDA_CORPO * 1.15 + 25, border: "3px dashed #FFD400" }}
      />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 66 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
