import type { Retangulo } from "../layout";
import type { Caixa } from "../motor/caixa";
import { fonte, LIMITE_APP, TOPO, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que está o
// rosto (cruz), a linha do centro, a caixa da pessoa no modo atual, a tela central e os limites do app.
export const Guias: React.FC<{ rosto: { x: number; y: number }; pessoa: Caixa; tela: Retangulo; modo: string }> = ({ rosto, pessoa, tela, modo }) => {
  const x = rosto.x * W;
  const y = rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
    fontSize: 28,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, width: 2, height: 1920, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto (quadro cheio)</div>
      <div style={{ position: "absolute", left: pessoa.x, top: pessoa.y, width: pessoa.w, height: pessoa.h, border: "3px dashed #B07CFF" }} />
      <div style={{ ...etiqueta, color: "#B07CFF", left: pessoa.x + 8, top: pessoa.y + pessoa.h - 44 }}>pessoa · modo {modo}</div>
      <div style={{ position: "absolute", left: tela.x, top: tela.y, width: tela.w, height: tela.h, border: "3px dashed #FFB020" }} />
      <div style={{ ...etiqueta, color: "#FFB020", left: tela.x + 8, top: tela.y + 6 }}>tela central</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: TOPO + 8 }}>acima daqui: abas do app</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
