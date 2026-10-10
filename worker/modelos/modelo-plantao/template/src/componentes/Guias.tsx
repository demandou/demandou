import { useVideoConfig } from "remotion";
import { caixaDe, divisaDe, painelDe, queixoDe, topoDasArtes } from "../layout";
import type { Plano } from "../plano";
import { BARRA, fonte, LETREIRO, LIMITE_APP } from "../tema";
import { LEGENDA_Y } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto, a linha do centro, a zona das artes de quadro cheio, a linha da tela dividida,
// a coluna da pessoa no quadro lateral, a barra "EXPLICANDO", a legenda e o letreiro.
export const Guias: React.FC<{ plano: Plano; topo: number }> = ({ plano, topo }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const divisa = divisaDe(plano);
  const lateral = caixaDe("lateral", plano);
  const dividida = caixaDe("dividida", plano);
  const queixo = queixoDe(plano);
  const topoArtes = topoDasArtes(plano);
  const painelLateral = painelDe("lateral", plano);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.45)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>

      <div style={{ position: "absolute", left: BARRA.x, top: BARRA.y, width: 720, height: BARRA.h, border: "3px dashed #FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: BARRA.x, top: BARRA.y + BARRA.h + 6 }}>barra EXPLICANDO</div>

      <div style={{ position: "absolute", left: 60, right: 60, top: topo, bottom: height - (LETREIRO.y - 30), border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 64, top: topo + 6 }}>artes de quadro cheio · topo {topo}</div>

      <div style={{ position: "absolute", left: 0, right: 0, top: divisa - 2, height: 4, background: "#B388FF" }} />
      <div style={{ ...etiqueta, color: "#B388FF", right: 20, top: divisa + 8 }}>linha da tela dividida · {divisa}</div>
      {dividida.x > 0 ? (
        <div style={{ position: "absolute", left: dividida.x, top: 0, width: dividida.w, height: dividida.h, border: "3px dashed #B388FF" }} />
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: queixo - 1, height: 2, background: "#FF6BD6" }} />
      <div style={{ ...etiqueta, color: "#FF6BD6", left: 20, top: queixo - 40 }}>queixo (estimado) · {Math.round(queixo)}</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: topoArtes - 1, height: 2, background: "#00E5FF", opacity: 0.6 }} />

      <div style={{ position: "absolute", left: lateral.x, top: painelLateral.y, width: lateral.w, height: LETREIRO.y - painelLateral.y, border: "3px dashed #7CFC8A" }} />
      <div style={{ ...etiqueta, color: "#7CFC8A", left: lateral.x + 10, top: painelLateral.y + 8 }}>coluna do quadro lateral</div>

      <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 64, top: LEGENDA_Y - 40 }}>legenda</div>

      <div style={{ position: "absolute", left: 0, right: 0, top: LETREIRO.y, height: LETREIRO.h, border: "3px dashed #FFFFFF" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
