import { useVideoConfig } from "remotion";
import type { Plano } from "../plano";
import { BALAO, CELULAR, INSPETOR, PINO, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// zona dos cartões de quadro cheio, legenda, o pino da pessoa e as áreas do canvas, e o limite da
// interface do aplicativo (embaixo e na coluna de botões à direita).
export const Guias: React.FC<{ plano: Plano; zona: { topo: number; altura: number }; legendaY: number; canvas: boolean }> = ({ plano, zona, legendaY, canvas }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  const limiteApp = height - 320;
  const caixa = (r: { x: number; y: number; w: number; h: number }, c: string, nome: string) => (
    <>
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, border: `3px dashed ${c}`, boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: c, left: r.x + 6, top: r.y + 6 }}>{nome}</div>
    </>
  );

  const app = (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ position: "absolute", left: 965, top: 1050, width: 115, height: limiteApp - 1050, background: "rgba(255,59,107,0.25)" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui e na faixa rosa: interface do app</div>
    </>
  );

  // no canvas: as áreas fixas (o rosto tem que aparecer inteiro no pino)
  if (canvas) {
    return (
      <>
        {caixa(PINO, "#C084FC", "pessoa (rosto inteiro aqui)")}
        {caixa(BALAO, "#C084FC", "balão")}
        {caixa(INSPETOR, "#FB923C", "inspetor")}
        {caixa(CELULAR, "#FB923C", "celular")}
        {app}
      </>
    );
  }

  // quadro cheio: rosto na linha do centro, cartões abaixo do queixo, legenda
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 76, right: 76, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 76, top: zona.topo - 40 }}>cartões · topo {zona.topo}</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 76 }}>legenda</div>
      {app}
    </>
  );
};
