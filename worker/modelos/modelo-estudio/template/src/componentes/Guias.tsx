import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { H, LIMITE_APP, sans, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o quadro da pessoa agora,
// onde o rosto cai dentro dele, a linha do centro, a legenda, o limite da interface e a área dos
// botões do app (à direita, embaixo).
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; legendaY: number | null }> = ({ plano, caixa, legendaY }) => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  // mesma conta do VideoNaCaixa: onde o rosto cai dentro do quadro
  const escala = Math.max(caixa.w / W, caixa.h / videoAltura) * (caixa.zoom ?? 1);
  const lv = W * escala;
  const av = videoAltura * escala;
  const fy = (plano.rosto.y * H) / videoAltura;
  const esquerda = Math.min(0, Math.max(caixa.w - lv, caixa.w / 2 - plano.rosto.x * lv));
  const topo = Math.min(0, Math.max(caixa.h - av, caixa.h * (caixa.ancoraY ?? 0.3) - fy * av));
  const x = caixa.x + esquerda + plano.rosto.x * lv;
  const y = caixa.y + topo + fy * av;
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
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, width: 2, height: H, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #00E5FF", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, left: caixa.x + 10, top: caixa.y + caixa.h + 6 }}>
        quadro {Math.round(caixa.w)}×{Math.round(caixa.h)} · zoom {(caixa.zoom ?? 1).toFixed(2)}
      </div>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      {legendaY !== null ? (
        <>
          <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 66, border: "3px dashed #FFD400" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 70 }}>legenda</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 960, top: 1150, width: W - 960, height: LIMITE_APP - 1150, border: "3px dashed #FF3B6B" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui e à direita: interface do app</div>
    </>
  );
};
