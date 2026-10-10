import { useVideoConfig } from "remotion";
import { centroDaNarracao, LIMITE_APP, type Estado } from "../layout";
import type { Plano } from "../plano";
import { sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): onde o plano acha que
// estão o rosto e o queixo, as janelas dos níveis 1 a 3 e da cartela alta (listas, passos e
// gráficos: a janela desce para a base), a faixa da narração e a interface do app.
const JANELAS = [
  { nivel: 1, nome: "janela 1", topo: 230, base: 1360 },
  { nivel: 2, nome: "janela 2", topo: 470, base: 1250 },
  { nivel: 3, nome: "janela 3", topo: 600, base: 1120 },
  { nivel: 4, nome: "janela das listas", topo: 990, base: 1560 },
];

export const Guias: React.FC<{ plano: Plano; estado: Estado; queixo: number }> = ({ plano, estado, queixo }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const centro = centroDaNarracao(estado);
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto (gravação)</div>
      <div style={{ position: "absolute", left: 220, right: 220, top: queixo, height: 3, background: "#00E5FF", opacity: 0.8 }} />
      <div style={{ ...etiqueta, left: 230, top: queixo + 6 }}>queixo agora</div>
      {JANELAS.map((j) => (
        <div key={j.nivel}>
          <div style={{ position: "absolute", left: 8 + j.nivel * 8, right: 8 + j.nivel * 8, top: j.topo, height: j.base - j.topo, border: "3px dashed #B388FF", opacity: 0.75 }} />
          <div style={{ ...etiqueta, color: "#B388FF", right: 24 + j.nivel * 8, top: j.topo + 6 }}>{j.nome}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 70, right: 70, top: centro - 40, height: 80, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 70, top: centro + 46 }}>narração (agora)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: height - 1920 + 200, height: 2, background: "#FF3B6B", opacity: 0.6 }} />
    </>
  );
};
