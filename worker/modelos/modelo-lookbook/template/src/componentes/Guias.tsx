// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto, a foto da pessoa
// com uma grade em frações (para medir os pontos das roupas), os pontos das roupas com o nome,
// a faixa da legenda e o limite da interface do aplicativo.
import type { Plano } from "../plano";
import { naTela, PONTOS_PADRAO, resolverPonto, type Foto } from "../pessoa";
import { LIMITE_APP, sans } from "../tema";

export const Guias: React.FC<{ plano: Plano; foto: Foto; legendaY: number; t?: number }> = ({ plano, foto, legendaY, t = null as number | null }) => {
  const c = foto.caixa;
  const rosto = naTela({ x: plano.rosto.x, y: (plano.rosto.y * 1920) / Math.min(1920, plano.videoAltura ?? 1920) }, c, plano, t);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "1px 8px",
    whiteSpace: "nowrap",
  };
  const nomes = [...new Set([...Object.keys(PONTOS_PADRAO), ...Object.keys(plano.pontos ?? {})])];
  const marcas = Array.from({ length: 9 }, (_, i) => (i + 1) / 10);
  const canto = naTela({ x: 0, y: 0 }, c, plano, t);
  const fim = naTela({ x: 1, y: 1 }, c, plano, t);
  return (
    <>
      {/* grade em frações do vídeo da pessoa (0,1 em 0,1), recortada à foto */}
      <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, overflow: "hidden", outline: "3px dashed #00E5FF" }}>
        {marcas.map((m) => {
          const x = canto.x + (fim.x - canto.x) * m - c.x;
          const y = canto.y + (fim.y - canto.y) * m - c.y;
          return (
            <div key={m}>
              <div style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1.5, background: "rgba(0,229,255,0.45)" }} />
              <div style={{ position: "absolute", top: y, left: 0, right: 0, height: 1.5, background: "rgba(0,229,255,0.45)" }} />
              <div style={{ ...etiqueta, fontSize: 20, left: x + 3, top: 4 }}>{m.toFixed(1)}</div>
              <div style={{ ...etiqueta, fontSize: 20, top: y + 3, left: 4 }}>{m.toFixed(1)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: rosto.x - 50, top: rosto.y, width: 100, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: rosto.x, top: rosto.y - 50, width: 3, height: 100, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: rosto.x + 58, top: rosto.y - 16 }}>rosto</div>
      {nomes.map((n) => {
        const p = naTela(resolverPonto(n, plano), c, plano, t);
        if (p.x < c.x || p.x > c.x + c.w || p.y < c.y || p.y > c.y + c.h) return null;
        const doPlano = !!plano.pontos?.[n];
        return (
          <div key={n}>
            <div style={{ position: "absolute", left: p.x - 9, top: p.y - 9, width: 18, height: 18, borderRadius: 9, background: doPlano ? "#FFD400" : "#FF3B9A", border: "2px solid #000" }} />
            <div style={{ ...etiqueta, color: doPlano ? "#FFD400" : "#FF8CC6", left: p.x + 14, top: p.y - 14 }}>{n}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaY, height: 70, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 60, top: legendaY + 74 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
