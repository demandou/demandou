import { useVideoConfig } from "remotion";
import { useTempo } from "../anim";
import { MOLDURA, PAINEL } from "../layout";
import { CHEIO, rostoNaTela, type Rosto } from "../motor/caixa";
import type { Plano } from "../plano";
import { sans } from "../tema";
import type { Zona } from "./Cartoes";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto (seguido pelo
// rastreio), a zona do cartão no peito, a legenda, o painel e a moldura.
export const Guias: React.FC<{ plano: Plano; zona: Zona; legendaCheia: number }> = ({ plano, zona, legendaCheia }) => {
  const { width, height } = useVideoConfig();
  const t = useTempo();
  const r = rostoNaTela(CHEIO, plano.rosto as Rosto, Math.min(1920, plano.videoAltura ?? 1920), t);
  const etiqueta: React.CSSProperties = { position: "absolute", fontFamily: sans, fontWeight: 700, fontSize: 26, color: "#00E5FF", background: "rgba(0,0,0,0.6)", padding: "2px 10px" };
  const limiteApp = height - 320;
  return (
    <>
      <div style={{ position: "absolute", left: r.x - 60, top: r.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x, top: r.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: r.x + 70, top: r.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
      <div style={{ ...etiqueta, left: 60, top: zona.topo + zona.altura + 8 }}>cartão no peito · topo {zona.topo}</div>
      <div style={{ position: "absolute", left: 60, right: 60, top: legendaCheia, height: 64, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", right: 60, top: legendaCheia - 38 }}>legenda</div>
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: PAINEL.w, height: PAINEL.h, border: "3px dashed #B388FF", opacity: 0.7 }} />
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, borderRadius: MOLDURA.raio, border: "3px dashed #B388FF" }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: MOLDURA.x + 16, top: MOLDURA.y + 12 }}>moldura (painel)</div>
      <div style={{ position: "absolute", left: 0, width, top: limiteApp, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: limiteApp + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
