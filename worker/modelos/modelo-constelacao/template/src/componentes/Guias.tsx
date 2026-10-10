import type { EstadoOcular, Ocular } from "../ceu";
import type { Areas } from "../layout";
import type { Plano } from "../plano";
import { LIMITE_APP, LIMITE_DIREITA, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto e zona em tela cheia;
// na carta, o círculo da ocular, o palco da carta e a área livre; legenda, limite direito e interface.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  ocular: EstadoOcular;
  palco: Ocular | null;
  legendaY: number;
  // áreas do bloco universal vigente (título e conteúdo), quando a entrada não é uma carta de céu real
  areas?: Areas | null;
}> = ({ plano, zona, ocular, palco, legendaY, areas }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: 539, top: 0, width: 2, height: 1920, background: "rgba(0,229,255,0.35)" }} />
      {ocular.cheio ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 40 }}>
            título e fechamento · topo {zona.topo}
          </div>
        </>
      ) : ocular.janela > 0.5 ? (
        <>
          <div style={{ position: "absolute", left: ocular.cx - ocular.R, top: ocular.cy - ocular.R, width: 2 * ocular.R, height: 2 * ocular.R, borderRadius: "50%", border: "3px solid #7CFC00" }} />
          <div style={{ position: "absolute", left: ocular.rx - 40, top: ocular.ry, width: 80, height: 3, background: "#7CFC00" }} />
          <div style={{ ...etiqueta, color: "#7CFC00", left: ocular.cx - 60, top: ocular.cy + ocular.R - 44 }}>pessoa</div>
          {areas ? (
            <>
              {areas.cab ? <div style={{ position: "absolute", left: areas.cab.x, top: areas.cab.y, width: areas.cab.w, height: areas.cab.h, border: "3px dotted #C77DFF" }} /> : null}
              {areas.cab ? <div style={{ ...etiqueta, color: "#C77DFF", left: areas.cab.x + 6, top: areas.cab.y + 6 }}>título</div> : null}
              <div style={{ position: "absolute", left: areas.corpo.x, top: areas.corpo.y, width: areas.corpo.w, height: areas.corpo.h, border: "3px dashed #FF8C00" }} />
              <div style={{ ...etiqueta, color: "#FF8C00", left: areas.corpo.x + 6, top: areas.corpo.y + 6 }}>conteúdo</div>
            </>
          ) : palco ? (
            <>
              <div style={{ position: "absolute", left: palco.palco.x, top: palco.palco.y, width: palco.palco.w, height: palco.palco.h, border: "3px dashed #FF8C00" }} />
              <div style={{ ...etiqueta, color: "#FF8C00", left: palco.palco.x + 6, top: palco.palco.y + 6 }}>carta</div>
              <div style={{ position: "absolute", left: palco.livre.x, top: palco.livre.y, width: palco.livre.w, height: palco.livre.h, border: "3px dotted #C77DFF" }} />
              <div style={{ ...etiqueta, color: "#C77DFF", left: palco.livre.x + 6, top: palco.livre.y + 6 }}>livre</div>
            </>
          ) : null}
        </>
      ) : null}
      <div style={{ position: "absolute", left: LIMITE_DIREITA, top: 0, width: 2, height: 1920, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
