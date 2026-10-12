import { useVideoConfig } from "remotion";
import { caixaDoVideo, type Janela } from "../cena";
import type { Plano } from "../plano";
import { BASE_PEITO, H, LIMITE_APP, MARGEM, sans, TOPO_APP, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9):
// o rosto dentro da janela da pessoa, a faixa do peito dos cartões em tela cheia, a legenda, as
// margens seguras do YouTube e os controles do player.
export const Guias: React.FC<{
  plano: Plano;
  area: { x: number; y: number; w: number; h: number };
  legendaBase: number;
  janela: Janela;
}> = ({ plano, area, legendaBase, janela }) => {
  const { width } = useVideoConfig();
  const v = caixaDoVideo(janela);
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  // onde o rosto cai dentro da caixa (mesma conta do VideoNaCaixa, sem o rastro): o vídeo de
  // trabalho tem a largura do quadro (1920)
  const escala = Math.max(v.w / W, v.h / videoAltura) * (v.zoom ?? 1);
  const lv = W * escala;
  const av = videoAltura * escala;
  const fy = (plano.rosto.y * H) / videoAltura;
  const esquerda = Math.min(0, Math.max(v.w - lv, v.w / 2 - plano.rosto.x * lv));
  const topo = Math.min(0, Math.max(v.h - av, v.h * (v.ancoraY ?? 0.3) - fy * av));
  const x = v.x + esquerda + plano.rosto.x * lv;
  const y = v.y + topo + fy * av;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height: H, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: 2, height: H, background: "rgba(255,159,28,0.6)" }} />
      <div style={{ position: "absolute", left: W - MARGEM, top: 0, width: 2, height: H, background: "rgba(255,159,28,0.6)" }} />
      <div style={{ position: "absolute", left: v.x, top: v.y, width: v.w, height: v.h, border: "3px dashed #B36BFF" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: BASE_PEITO - area.y, border: "3px dashed #FFD400", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: area.x, top: area.y - 36 }}>
        cartões em tela cheia (faixa do peito) · topo {area.y} · base {BASE_PEITO}
      </div>
      <div style={{ position: "absolute", left: (W - 1240) / 2, width: 1240, top: legendaBase - 70, height: 70, border: "3px dashed #FFFFFF", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: "#FFFFFF", left: (W - 1240) / 2, top: legendaBase - 106 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO_APP, height: 3, background: "#FF9F1C" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
