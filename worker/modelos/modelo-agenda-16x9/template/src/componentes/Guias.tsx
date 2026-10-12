// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// caixa da pessoa, folha da agenda, a coluna dos cartões ao lado do peito e o limite do player.
// Medidas da tela virtual (src/tema.ts); o componente é desenhado dentro da Tela.
import { type Agenda, colunaDoPeito } from "../agenda";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { FOLHA, LIMITE_APP, LIMITE_PEITO, MARGEM, sans, TOPO_PEITO, W } from "../tema";
import { rostoNaCaixa } from "./Pessoa";

export { rostoNaCaixa };

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; ag: Agenda; t: number }> = ({ plano, caixa, ag, t }) => {
  const r = rostoNaCaixa(caixa, ag.rosto, ag.videoAltura);
  // a coluna dos cartões no trecho em volta de agora (o rosto em todo o trecho)
  const coluna = colunaDoPeito(ag, Math.max(0, t - 2), Math.min(plano.duracao, t + 2));
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
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #B78CFF", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: caixa.x + 12, top: caixa.y + 12 }}>pessoa</div>
      <div style={{ position: "absolute", left: FOLHA.x, top: FOLHA.y, width: FOLHA.w, height: FOLHA.h, border: "2px dashed rgba(255,159,28,0.6)", borderRadius: FOLHA.raio }} />
      <div style={{ position: "absolute", left: coluna.x, width: coluna.w, top: TOPO_PEITO, height: LIMITE_PEITO - TOPO_PEITO, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: coluna.x + 8, top: TOPO_PEITO + 8 }}>{`cartões da tela cheia (coluna ${coluna.lado}): o rosto fica fora dela`}</div>
      <div style={{ position: "absolute", left: MARGEM, top: 0, bottom: 0, width: 2, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", right: MARGEM, top: 0, bottom: 0, width: 2, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
