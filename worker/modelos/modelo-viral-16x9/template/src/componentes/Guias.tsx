// Guias de conferência (stills --guias), no quadro deitado (16:9): rosto, faixa do peito, legenda,
// emenda e moldura da pessoa (à direita, como manda a aula 9), quadro da esquerda e a linha dos
// controles do player.
import { AREA, COSTURA, LIMITE_APP, MARGEM, QUADRO, type Layout } from "../layout";
import { rostoNaTela, type Caixa, type Rosto } from "../motor/caixa";
import type { Plano } from "../plano";

const linha = (y: number, c: string, rotulo: string, tracejado = true) => (
  <div key={rotulo} style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px ${tracejado ? "dashed" : "solid"} ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

const etiqueta = (x: number, y: number, c: string, texto: string) => (
  <div key={texto} style={{ position: "absolute", left: x, top: y, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{texto}</div>
);

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number; lay: Layout }> = ({ plano, caixa, t, lay }) => {
  // o rosto do plano é fração do quadro deitado (o cortar.mjs grava `rosto.quadro`; sem ele, vale o 1920×1080)
  const bruto = plano.rosto as Rosto;
  const rosto: Rosto = bruto.quadro ? bruto : { ...bruto, quadro: { largura: QUADRO.w, altura: QUADRO.h } };
  // sem rastro, o motor supõe o rosto do vertical (36% da largura); no 16:9 ele ocupa ~13%
  const fator = bruto.rastro?.largura ? 1 : 0.13 / 0.36;
  const r0 = rostoNaTela(caixa, rosto, plano.videoAltura ?? QUADRO.h, t);
  const r = { ...r0, largura: r0.largura * fator };
  const leg = lay.legenda(t);
  const rm0 = rostoNaTela(lay.caixaMoldura, rosto, plano.videoAltura ?? QUADRO.h, t);
  const rm = { ...rm0, largura: rm0.largura * fator };
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* o rosto no quadro cheio */}
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.65, width: r.largura, height: r.largura * 1.3, border: "4px solid #00E5FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: r.x - 30, top: r.y - 2, width: 60, height: 4, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x - 2, top: r.y - 30, width: 4, height: 60, background: "#00E5FF" }} />
      {/* a faixa do peito (textos de quadro cheio) */}
      <div style={{ position: "absolute", left: MARGEM, top: lay.peito.topo, width: QUADRO.w - 2 * MARGEM, height: lay.peito.base - lay.peito.topo, border: "3px dashed #7CFF6B", boxSizing: "border-box" }} />
      {etiqueta(MARGEM + 8, lay.peito.topo + 6, "#7CFF6B", "faixa do peito")}
      {/* a moldura da pessoa (à direita) e onde o rosto cai nela */}
      <div style={{ position: "absolute", left: COSTURA, top: 0, width: QUADRO.w - COSTURA, height: QUADRO.h, border: "3px dashed #FF6BD5", boxSizing: "border-box" }} />
      {etiqueta(COSTURA + 12, 24, "#FF6BD5", "moldura (pessoa na moldura)")}
      <div style={{ position: "absolute", left: rm.x - rm.largura / 2, top: rm.y - rm.largura * 0.65, width: rm.largura, height: rm.largura * 1.3, border: "3px dashed #FF6BD5", borderRadius: "45%" }} />
      {/* o quadro da esquerda */}
      <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.base - AREA.y, border: "3px dashed rgba(0,229,255,0.5)", boxSizing: "border-box" }} />
      {etiqueta(AREA.x + 8, AREA.y + 6, "rgba(0,229,255,0.9)", "quadro da esquerda")}
      {/* a legenda */}
      <div style={{ position: "absolute", left: leg.x - leg.largura / 2, top: leg.y - 45, width: leg.largura, height: 90, border: "3px dashed #FFD400", boxSizing: "border-box" }} />
      {etiqueta(leg.x - leg.largura / 2 + 8, leg.y - 80, "#FFD400", "legenda")}
      {linha(LIMITE_APP, "#FF4040", "abaixo daqui: controles do player", false)}
    </div>
  );
};
