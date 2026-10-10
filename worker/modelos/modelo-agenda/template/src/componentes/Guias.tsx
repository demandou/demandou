// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto, linha do centro,
// caixa da pessoa, folha da agenda, cartões no peito e os limites do app.
import { type Agenda, CARTAO_CTA } from "../agenda";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { FOLHA, LIMITE_APP, sans, TOPO, W } from "../tema";

// onde o rosto cai no quadro para uma caixa (mesma conta do VideoNaCaixa do motor)
export const rostoNaCaixa = (c: Caixa, rosto: { x: number; y: number }, videoAltura: number) => {
  const W0 = 1080;
  const H0 = videoAltura;
  const fy = (rosto.y * 1920) / H0;
  const escala = Math.max(c.w / W0, c.h / H0) * (c.zoom ?? 1);
  const lv = W0 * escala;
  const av = H0 * escala;
  const esquerda = Math.min(0, Math.max(c.w - lv, c.w / 2 - rosto.x * lv));
  const topo = Math.min(0, Math.max(c.h - av, c.h * (c.ancoraY ?? 0.3) - fy * av));
  return { x: c.x + esquerda + rosto.x * lv, y: c.y + topo + fy * av, escala };
};

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; ag: Agenda }> = ({ plano, caixa, ag }) => {
  const r = rostoNaCaixa(caixa, plano.rosto, Math.min(1920, plano.videoAltura ?? 1920));
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
      <div style={{ position: "absolute", left: r.x - 60, top: r.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x, top: r.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: r.x + 70, top: r.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #B78CFF", borderRadius: caixa.raio }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: caixa.x + 12, top: caixa.y + 12 }}>pessoa</div>
      <div style={{ position: "absolute", left: FOLHA.x, top: FOLHA.y, width: FOLHA.w, height: FOLHA.h, border: "2px dashed rgba(255,159,28,0.6)", borderRadius: FOLHA.raio }} />
      <div style={{ position: "absolute", left: CARTAO_CTA.x, width: CARTAO_CTA.w, top: ag.peito, height: 1540 - ag.peito, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: CARTAO_CTA.x, top: ag.peito - 40 }}>cartões no peito (o queixo fica acima)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOPO, height: 3, background: "#FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", right: 20, top: TOPO + 8 }}>acima daqui: só fundo (abas do app)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
