// Guias de conferência (stills --guias), no quadro deitado: rosto, caixa da pessoa (tela cheia ou
// janela), quadro do conteúdo, faixa do nível, legenda e as margens seguras do YouTube.
import { FAIXA, LIMITE_PLAYER, MARGEM, QUADRO, ZONA, legendaNaCaixa } from "../layout";
import { rostoNaTela, type Caixa, type Rosto } from "../motor/caixa";
import type { Plano } from "../plano";

const linha = (y: number, c: string, rotulo: string) => (
  <div key={rotulo + y} style={{ position: "absolute", left: 0, top: y, width: QUADRO.w, borderTop: `3px dashed ${c}` }}>
    <div style={{ position: "absolute", left: 8, top: 4, fontFamily: "Helvetica", fontSize: 22, color: c, background: "rgba(0,0,0,0.5)", padding: "1px 6px" }}>{rotulo}</div>
  </div>
);

const coluna = (x: number, c: string) => <div key={`col-${x}`} style={{ position: "absolute", left: x, top: 0, height: QUADRO.h, borderLeft: `3px dashed ${c}` }} />;

export const Guias: React.FC<{ plano: Plano; caixa: Caixa; t: number }> = ({ plano, caixa, t }) => {
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? QUADRO.h, t);
  // sem rastro, o motor supõe o rosto do vertical (36% da largura); no 16:9 ele tem ~13%
  const largura = (plano.rosto as Rosto).rastro?.largura ? r.largura : (r.largura * 0.13) / 0.36;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: r.x - largura / 2, top: r.y - largura * 0.65, width: largura, height: largura * 1.3, border: "4px solid #00E5FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, border: "3px dashed #FF6BD5", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: ZONA.x, top: ZONA.y, width: ZONA.w, height: ZONA.h, border: "3px dashed #7CFF6B", boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: FAIXA.x, top: FAIXA.y, width: FAIXA.w, height: FAIXA.h, border: "3px dashed #FFA040", boxSizing: "border-box" }} />
      {linha(legendaNaCaixa(caixa).base, "#FFD400", "legenda (base)")}
      {linha(LIMITE_PLAYER, "#FF4040", "controles do player")}
      {coluna(MARGEM, "#FF4040")}
      {coluna(QUADRO.w - MARGEM, "#FF4040")}
    </div>
  );
};
