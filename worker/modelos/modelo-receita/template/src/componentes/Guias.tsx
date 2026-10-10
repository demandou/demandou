import { useVideoConfig } from "remotion";
import type { Janela, Rect } from "../layout";
import type { Plano } from "../plano";
import { LIMITE_APP, texto } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final):
// rosto, altura da ficha no peito, janela da pessoa, cabeçalho, corpo, legenda e interface do app.
// Com a pessoa em quadro cheio (antes de planejar, abertura, dica, fechamento): rosto, altura da
// ficha no peito e legenda. Com a ficha em cima: a janela da pessoa, o cabeçalho e o corpo.
export const Guias: React.FC<{ plano: Plano; fichaPeito: number; janela: Janela; cabecalho: Rect | null; corpo: Rect | null; legendaY: number }> = ({
  plano,
  fichaPeito,
  janela,
  cabecalho,
  corpo,
  legendaY,
}) => {
  const naFicha = cabecalho !== null;
  const { width } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: texto,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const caixa = (r: Rect, corBorda: string, nome: string, raio = 0) => (
    <>
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `3px dashed ${corBorda}`, borderRadius: raio }} />
      <div style={{ ...etiqueta, color: corBorda, left: r.x + 8, top: r.y + 8 }}>{nome}</div>
    </>
  );
  return (
    <>
      {naFicha ? (
        <>
          {caixa(janela, "#B78CFF", "pessoa", janela.raio)}
          {cabecalho ? caixa(cabecalho, "#7CFC9A", "cabeçalho") : null}
          {corpo ? caixa(corpo, "#00E5FF", "corpo") : null}
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: width / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: fichaPeito, height: 3, background: "#FF9F1C" }} />
          <div style={{ ...etiqueta, color: "#FF9F1C", right: 20, top: fichaPeito + 8 }}>ficha no peito · {Math.round(fichaPeito)}</div>
          <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 74 }}>legenda</div>
        </>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
