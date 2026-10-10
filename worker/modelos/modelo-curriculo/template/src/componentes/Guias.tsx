import { useVideoConfig } from "remotion";
import { caixaDoVideo, type Janela } from "../cena";
import type { Plano } from "../plano";
import { LIMITE_APP, sans, TOPO_APP } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto dentro da janela
// da pessoa, a zona dos cartões em tela cheia, a legenda e os limites da interface do app.
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  legendaY: number;
  janela: Janela;
}> = ({ plano, zona, legendaY, janela }) => {
  const { width } = useVideoConfig();
  const v = caixaDoVideo(janela);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  // onde o rosto cai dentro da caixa (mesma conta do VideoNaCaixa)
  const escala = Math.max(v.w / 1080, v.h / videoAltura) * (v.zoom ?? 1);
  const lv = 1080 * escala;
  const av = videoAltura * escala;
  const fy = (plano.rosto.y * 1920) / videoAltura;
  const esquerda = Math.min(0, Math.max(v.w - lv, v.w / 2 - plano.rosto.x * lv));
  const topo = Math.min(0, Math.max(v.h - av, v.h * (v.ancoraY ?? 0.3) - fy * av));
  const x = v.x + esquerda + plano.rosto.x * lv;
  const y = v.y + topo + fy * av;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height: 1920, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: v.x, top: v.y, width: v.w, height: v.h, border: "3px dashed #B36BFF" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: zona.esquerda, top: zona.topo - 40 }}>
        cartões em tela cheia · topo {zona.topo} · altura {zona.altura}
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 64, border: "3px dashed #FFFFFF" }} />
      <div style={{ ...etiqueta, color: "#FFFFFF", left: 60, top: legendaY + 70 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO_APP, height: 3, background: "#FF9F1C" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
