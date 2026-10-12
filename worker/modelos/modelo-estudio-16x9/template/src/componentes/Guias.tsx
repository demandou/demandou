import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { H, LIMITE_APP, MARGEM, sans, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9): o
// quadro da pessoa agora (tela cheia ou a moldura da direita), onde o rosto cai dentro dele, a linha
// do centro, as margens seguras laterais, a legenda e o limite dos controles do player.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa; legenda: { x: number; w: number; base: number } | null }> = ({ plano, caixa, legenda }) => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  // mesma conta do VideoNaCaixa (sem o rastro): onde o rosto cai dentro do quadro
  const escala = Math.max(caixa.w / W, caixa.h / videoAltura) * (caixa.zoom ?? 1);
  const lv = W * escala;
  const av = videoAltura * escala;
  const fy = (plano.rosto.y * H) / videoAltura;
  const alvoX = caixa.ancoraX === undefined ? caixa.w / 2 : caixa.w * caixa.ancoraX;
  const esquerda = Math.min(0, Math.max(caixa.w - lv, alvoX - plano.rosto.x * lv));
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
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: 2, height: H, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: W - MARGEM, top: 0, width: 2, height: H, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #00E5FF", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, left: caixa.x + 10, top: Math.min(H - 40, caixa.y + caixa.h + 6) }}>
        quadro {Math.round(caixa.w)}×{Math.round(caixa.h)} · zoom {(caixa.zoom ?? 1).toFixed(2)}
      </div>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      {legenda !== null ? (
        <>
          <div style={{ position: "absolute", left: legenda.x, width: legenda.w, top: legenda.base - 132, height: 132, border: "3px dashed #FFD400" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: legenda.x, top: legenda.base - 170 }}>legenda (até 2 linhas)</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
