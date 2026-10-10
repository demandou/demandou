// Guias de conferência (só nos quadros de teste, nunca no vídeo final): rosto dentro da célula da
// pessoa, linha do centro, célula da pessoa, célula de destaque, topo seguro e interface do app.
import type { CaixaPessoa, Ret } from "../grade";
import type { Plano } from "../plano";
import { FORMULA, LIMITE_APP, sans } from "../tema";

// onde o rosto cai no quadro (mesma conta do VideoNaCaixa do motor)
export const rostoNaCaixa = (c: CaixaPessoa, rosto: { x: number; y: number }, videoAltura: number) => {
  const W0 = 1080;
  const H0 = videoAltura;
  const fy = (rosto.y * 1920) / H0;
  const escala = Math.max(c.w / W0, c.h / H0) * c.zoom;
  const lv = W0 * escala;
  const av = H0 * escala;
  const esquerda = Math.min(0, Math.max(c.w - lv, c.w / 2 - rosto.x * lv));
  const topo = Math.min(0, Math.max(c.h - av, c.h * c.ancoraY - fy * av));
  return { x: c.x + esquerda + rosto.x * lv, y: c.y + topo + fy * av, escala };
};

export const Guias: React.FC<{ plano: Plano; c: CaixaPessoa; destaque: Ret | null }> = ({ plano, c, destaque }) => {
  const r = rostoNaCaixa(c, plano.rosto, Math.min(1920, plano.videoAltura ?? 1920));
  const etiqueta: React.CSSProperties = { position: "absolute", fontFamily: sans, fontWeight: 700, fontSize: 26, color: "#00E5FF", background: "rgba(0,0,0,0.6)", padding: "2px 10px" };
  return (
    <>
      <div style={{ position: "absolute", left: r.x - 60, top: r.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x, top: r.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: r.x + 70, top: r.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 539, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, border: "3px dashed #B78CFF", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: "#B78CFF", left: c.x + 12, top: c.y + 12 }}>célula da pessoa</div>
      {destaque ? (
        <>
          <div style={{ position: "absolute", left: destaque.x, top: destaque.y, width: destaque.w, height: destaque.h, border: "3px dashed #FFD400", boxSizing: "border-box" }} />
          <div style={{ ...etiqueta, color: "#FFD400", left: destaque.x + 12, top: destaque.y + destaque.h - 44 }}>destaque</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 0, right: 0, top: FORMULA.y, height: 3, background: "#FF9F1C" }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", right: 20, top: FORMULA.y - 40 }}>acima daqui: abas do app (só decoração)</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
