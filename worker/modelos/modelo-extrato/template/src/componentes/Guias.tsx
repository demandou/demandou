import { useVideoConfig } from "remotion";
import { cupomCima, limiteDaTira } from "../layout";
import type { Plano } from "../plano";
import { CARTAO, CIMA, CUPOM_ABERTURA, LIMITE_APP, LINHA_DE_IMPRESSAO, MARGEM, MOLDURA, PAPEL, sans, TIRA, TOPO, zona as zonaPadrao } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto e linha do centro,
// legenda do quadro cheio, a faixa das tiras (abaixo do queixo), a moldura da pessoa e o rolo (ou,
// no layout "lado", as duas posições do cartão e do cupom) e os limites do app.
export const Guias: React.FC<{ plano: Plano; legendaY: number }> = ({ plano, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = width / 2;
  const y = plano.rosto.y * height;
  const zona = { ...zonaPadrao, ...plano.zona };
  const cima = (plano.layout ?? "cima") !== "lado";
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const caixa = (l: number, t: number, w: number, h: number, c: string): React.CSSProperties => ({ position: "absolute", left: l, top: t, width: w, height: h, border: `3px dashed ${c}` });
  const limite = limiteDaTira(plano, zona.topo);
  const rolo = cupomCima();
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={caixa(60, legendaY, width - 120, 70, "#FFD400")} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda (quadro cheio)</div>
      {/* a faixa das tiras do quadro cheio: do queixo até a linha de impressão */}
      <div style={caixa(TIRA.margem, limite, PAPEL * TIRA.escala, TIRA.linha - limite, "#4ADE80")} />
      <div style={{ ...etiqueta, color: "#4ADE80", left: TIRA.margem, top: TIRA.linha + 6 }}>tira (quadro cheio)</div>
      {cima ? (
        <>
          <div style={caixa(MOLDURA.x, MOLDURA.y, MOLDURA.w, MOLDURA.h, "#B388FF")} />
          <div style={{ ...etiqueta, color: "#B388FF", left: MOLDURA.x + 12, top: MOLDURA.y + 10 }}>moldura da pessoa (tela dividida)</div>
          <div style={caixa(rolo.x, CIMA.topo, PAPEL * CIMA.escala, rolo.linha - CIMA.topo, "#FF9F43")} />
          <div style={{ ...etiqueta, color: "#FF9F43", left: rolo.x + 8, top: CIMA.topo + 8 }}>rolo · linha de impressão embaixo</div>
        </>
      ) : (
        <>
          <div style={caixa(width - MARGEM - CARTAO.w, CARTAO.y, CARTAO.w, CARTAO.h, "#B388FF")} />
          <div style={caixa(MARGEM, CARTAO.y, CARTAO.w, CARTAO.h, "rgba(179,136,255,0.45)")} />
          <div style={{ ...etiqueta, color: "#B388FF", left: width - MARGEM - CARTAO.w, top: CARTAO.y + CARTAO.h + 6 }}>cartão da pessoa</div>
          <div style={caixa(MARGEM, TOPO, PAPEL, LINHA_DE_IMPRESSAO - TOPO, "#FF9F43")} />
          <div style={{ position: "absolute", left: MARGEM, top: LINHA_DE_IMPRESSAO, width: PAPEL, height: 3, background: "#FF9F43" }} />
          <div style={{ ...etiqueta, color: "#FF9F43", left: MARGEM, top: LINHA_DE_IMPRESSAO + 8 }}>cupom · linha de impressão</div>
          <div style={{ position: "absolute", left: CUPOM_ABERTURA.x, top: CUPOM_ABERTURA.linha, width: PAPEL * CUPOM_ABERTURA.escala, height: 3, background: "#FF9F43" }} />
          <div style={{ ...etiqueta, color: "#FF9F43", left: CUPOM_ABERTURA.x, top: CUPOM_ABERTURA.linha + 8 }}>cupom da abertura</div>
        </>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 2, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
