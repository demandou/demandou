// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// janela da pessoa, faixa das teclas, faixa dos cartões no peito e interface do app.
import { useVideoConfig } from "remotion";
import { type CaixaJanela, CARTAO_CTA, FUNDO_PEITO, rostoNaCaixa, caixaDoVideo, topoDoPeito } from "../geometria";
import type { Plano } from "../plano";
import { LIMITE_APP, sans, TOPO } from "../tema";

export const Guias: React.FC<{ plano: Plano; j: CaixaJanela }> = ({ plano, j }) => {
  const { width } = useVideoConfig();
  const v = caixaDoVideo(j);
  const r = rostoNaCaixa({ ...v, x: j.x + v.x, y: j.y + v.y }, plano.rosto, Math.min(1920, plano.videoAltura ?? 1920));
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
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: j.x, top: j.y, width: j.w, height: j.h, border: "3px dashed #B78CFF", borderRadius: j.raio }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: j.x + 12, top: j.y + 12 }}>janela da pessoa</div>
      {/* faixa dos cartões no peito (abertura e fechamento, com a pessoa em tela cheia) */}
      <div style={{ position: "absolute", left: CARTAO_CTA.x, width: CARTAO_CTA.w, top: topoDoPeito(plano), height: FUNDO_PEITO - topoDoPeito(plano), border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: CARTAO_CTA.x, top: topoDoPeito(plano) - 40 }}>cartões no peito (o queixo fica acima)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 3, background: "#FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", right: 20, top: TOPO + 8 }}>acima daqui: abas do app</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
