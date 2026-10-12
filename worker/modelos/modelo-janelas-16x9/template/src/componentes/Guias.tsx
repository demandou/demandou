// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// janela da pessoa, coluna dos cartões (pessoa em tela cheia), faixa de cima (barra de menu) e o
// começo dos controles do player embaixo. Desenhadas na camada lógica do quadro deitado.
import { type CaixaJanela, caixaDoVideo, colunaDoCartao, FUNDO_PEITO, rostoNaCaixa } from "../geometria";
import type { Plano } from "../plano";
import { LIMITE_APP, sans, TOPO, W } from "../tema";

export const Guias: React.FC<{ plano: Plano; j: CaixaJanela }> = ({ plano, j }) => {
  const v = caixaDoVideo(j);
  const r = rostoNaCaixa({ ...v, x: j.x + v.x, y: j.y + v.y }, plano);
  const c = colunaDoCartao(plano);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: r.x - 60, top: r.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x, top: r.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: r.x + 70, top: r.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: j.x, top: j.y, width: j.w, height: j.h, border: "3px dashed #B78CFF", borderRadius: j.raio }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: j.x + 12, top: j.y + 12 }}>janela da pessoa</div>
      {/* coluna dos cartões (abertura, destaque, pergunta, com a pessoa em tela cheia) */}
      <div style={{ position: "absolute", left: c.x, width: c.w, top: TOPO, height: FUNDO_PEITO - TOPO, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: c.x + 12, top: TOPO + 12 }}>coluna dos cartões (o rosto fica ao lado)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 3, background: "#FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", right: 20, top: TOPO + 8 }}>acima daqui: barra de menu</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
