import { useVideoConfig } from "remotion";
import { areaDaParede, caixaDaPorta, lugarDoPeito } from "../layout";
import type { Plano } from "../plano";
import { BASE, LIMITE_APP, MARGEM, PAREDE, QUADRO } from "../tema";
import { LEGENDA_Y } from "./Legendas";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9):
// rosto, linha do centro, faixa das artes no peito, a parede da esquerda (blocos de parede), o
// quadro de chaves, a porta da direita (a moldura da pessoa), a legenda e o limite dos controles do player.
export const Guias: React.FC<{ plano: Plano; topo: number }> = ({ plano, topo }) => {
  const { width, height } = useVideoConfig();
  const x = plano.rosto.x * width;
  const y = plano.rosto.y * height;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: 600,
    fontSize: 24,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
  };
  const caixa = (l: number, t: number, w: number, h: number, c: string): React.CSSProperties => ({ position: "absolute", left: l, top: t, width: w, height: h, border: `3px dashed ${c}` });
  const peito = lugarDoPeito({ ...plano, zona: { topo, altura: BASE - topo } });
  const porta = caixaDaPorta(plano);
  const parede = areaDaParede();
  return (
    <>
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={caixa(peito.centro - peito.largura / 2, peito.topo, peito.largura, BASE - peito.topo, "#00E5FF")} />
      <div style={{ ...etiqueta, left: peito.centro - peito.largura / 2, top: peito.topo - 36 }}>
        artes no peito · topo {Math.round(peito.topo)}
        {peito.lado ? " (lado livre)" : ""}
      </div>
      <div style={caixa(parede.x, parede.y, parede.w, parede.h, "#7CFC9A")} />
      <div style={{ ...etiqueta, color: "#7CFC9A", left: parede.x + 10, top: parede.y + parede.h - 40 }}>parede (blocos de parede e painéis)</div>
      <div style={caixa(PAREDE.x, QUADRO.y, PAREDE.w, QUADRO.fundo - QUADRO.y, "#FF9F43")} />
      <div style={{ ...etiqueta, color: "#FF9F43", left: PAREDE.x + 10, top: QUADRO.fundo - 40 }}>quadro de chaves (itens)</div>
      <div style={caixa(porta.x, porta.y, porta.w, porta.h, "#B388FF")} />
      <div style={{ ...etiqueta, color: "#B388FF", left: porta.x + 10, top: porta.y + 40 }}>porta da direita (moldura)</div>
      <div style={caixa(MARGEM, LEGENDA_Y, width - 2 * MARGEM, 78, "#FFD400")} />
      <div style={{ ...etiqueta, color: "#FFD400", left: MARGEM, top: LEGENDA_Y - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
