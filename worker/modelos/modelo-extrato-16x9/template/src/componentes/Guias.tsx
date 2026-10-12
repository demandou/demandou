import { useVideoConfig } from "remotion";
import { cupomRolo } from "../layout";
import type { Plano } from "../plano";
import { CUPOM_ABERTURA, LEGENDA, LIMITE_APP, MOLDURA, PAPEL, QUADRO, ROLO, sans, TIRA, TOPO } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado: o rosto,
// a legenda do quadro cheio, a faixa das tiras (ao lado do rosto, da linha de impressão até o topo
// seguro, dos dois lados), a moldura da pessoa à direita e o quadro do rolo à esquerda (como manda a
// aula 9), o cupom da abertura do layout "lado" e a linha dos controles do player.
export const Guias: React.FC<{ plano: Plano; legendaY: number }> = ({ plano, legendaY }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const lado = plano.layout === "lado";
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const caixa = (l: number, t: number, w: number, h: number, c: string): React.CSSProperties => ({ position: "absolute", left: l, top: t, width: w, height: h, border: `3px dashed ${c}` });
  const rolo = cupomRolo();
  const larguraTira = PAPEL * TIRA.escala;
  const legendaX = (width - LEGENDA.largura) / 2;
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={caixa(legendaX, legendaY, LEGENDA.largura, 70, "#FFD400")} />
      <div style={{ ...etiqueta, color: "#FFD400", left: legendaX, top: legendaY - 36 }}>legenda (quadro cheio)</div>
      {/* as tiras do quadro cheio: ao lado do rosto, do topo seguro até a linha de impressão */}
      <div style={caixa(TIRA.margem, TIRA.topo, larguraTira, TIRA.linha - TIRA.topo, "rgba(74,222,128,0.7)")} />
      <div style={caixa(width - TIRA.margem - larguraTira, TIRA.topo, larguraTira, TIRA.linha - TIRA.topo, "rgba(74,222,128,0.7)")} />
      <div style={{ ...etiqueta, color: "#4ADE80", left: TIRA.margem, top: TIRA.linha + 6 }}>tira (quadro cheio, ao lado do rosto)</div>
      {/* tela dividida: a moldura da pessoa à direita e o quadro do rolo à esquerda */}
      <div style={caixa(MOLDURA.x, MOLDURA.y, MOLDURA.w, MOLDURA.h, "#B388FF")} />
      <div style={{ position: "absolute", left: MOLDURA.x + MOLDURA.w / 2 - 1, top: MOLDURA.y, width: 2, height: MOLDURA.h, background: "rgba(179,136,255,0.5)" }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: MOLDURA.x + 12, top: MOLDURA.y + 10 }}>moldura da pessoa (tela dividida)</div>
      <div style={caixa(QUADRO.x, ROLO.topo, QUADRO.w, ROLO.linha - ROLO.topo, "rgba(255,159,67,0.55)")} />
      <div style={{ position: "absolute", left: rolo.x, top: ROLO.linha, width: PAPEL * ROLO.escala, height: 3, background: "#FF9F43" }} />
      <div style={{ ...etiqueta, color: "#FF9F43", left: QUADRO.x + 8, top: ROLO.linha + 8 }}>quadro do rolo · linha de impressão</div>
      {lado ? (
        <>
          <div style={{ position: "absolute", left: CUPOM_ABERTURA.margem, top: CUPOM_ABERTURA.linha, width: PAPEL * CUPOM_ABERTURA.escala, height: 3, background: "#FF9F43" }} />
          <div style={{ ...etiqueta, color: "#FF9F43", left: CUPOM_ABERTURA.margem, top: CUPOM_ABERTURA.linha - 36 }}>cupom da abertura</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 2, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
