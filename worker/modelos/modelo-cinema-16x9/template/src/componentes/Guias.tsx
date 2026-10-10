import { useVideoConfig } from "remotion";
import { centroDaNarracao, LIMITE_APP, MOLDURA, MOLDURA_BAIXA, QUADRO_TEXTO, type Estado } from "../layout";
import type { Plano } from "../plano";
import { sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9):
// onde o plano acha que estão o rosto e o queixo, as janelas dos níveis 1 a 3 (a largura toda), a
// moldura da direita dos blocos e a moldura baixa da cartela alta (listas, passos e gráficos), o
// quadro do texto à esquerda, a faixa da narração e a linha dos controles do player.
const JANELAS = [
  { nivel: 1, nome: "janela 1", esq: 0, dir: 1920, topo: 50, base: 850 },
  { nivel: 2, nome: "janela 2", esq: 0, dir: 1920, topo: 80, base: 790 },
  { nivel: 3, nome: "janela 3", esq: 0, dir: 1920, topo: 120, base: 720 },
  { nivel: 4, nome: "moldura", ...MOLDURA },
  { nivel: 5, nome: "moldura das listas", ...MOLDURA_BAIXA },
];

export const Guias: React.FC<{ plano: Plano; estado: Estado; queixo: number }> = ({ plano, estado, queixo }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 500,
    fontSize: 22,
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
      <div style={{ position: "absolute", left: 420, right: 420, top: queixo, height: 3, background: "#00E5FF", opacity: 0.8 }} />
      <div style={{ ...etiqueta, left: 430, top: queixo + 6 }}>queixo agora</div>
      {JANELAS.map((j) => (
        <div key={j.nivel}>
          <div
            style={{
              position: "absolute",
              left: j.esq + 8 + j.nivel * 6,
              width: j.dir - j.esq - 2 * (8 + j.nivel * 6),
              top: j.topo,
              height: j.base - j.topo,
              border: "3px dashed #B388FF",
              opacity: 0.75,
            }}
          />
          <div style={{ ...etiqueta, color: "#B388FF", left: j.dir - 300 - j.nivel * 6, top: j.topo + 6 }}>{j.nome}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: QUADRO_TEXTO.x, width: QUADRO_TEXTO.largura, top: QUADRO_TEXTO.topo, height: QUADRO_TEXTO.base - QUADRO_TEXTO.topo, border: "3px dashed #7CFC00", opacity: 0.6 }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: QUADRO_TEXTO.x + 10, top: QUADRO_TEXTO.topo + 10 }}>quadro do texto</div>
      <div style={{ position: "absolute", left: 160, right: 160, top: centro - 34, height: 68, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 160, top: centro - 70 }}>narração (agora)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
