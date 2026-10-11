import { useVideoConfig } from "remotion";
import { useTempo } from "../anim";
import { CARTAO, LEGENDA, LEGENDA_CHEIA, LEGENDA_NO_PAINEL, LIMITE_PLAYER, MARGEM, MOLDURA, PAINEL, QUADRO } from "../layout";
import { CHEIO_16x9, rostoNaTela, type Rosto } from "../motor/caixa";
import type { Plano } from "../plano";
import { sans } from "../tema";
import type { Zona } from "./Cartoes";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado (16:9):
// o rosto (seguido pelo rastreio), a área do cartão no peito (do queixo até a área segura de
// baixo, centrada no rosto), os dois lugares da legenda, o quadro do painel (esquerda), a moldura
// da pessoa (direita, como manda a aula 9 do curso), as margens laterais e a linha dos controles
// do player.
export const Guias: React.FC<{ plano: Plano; zona: Zona }> = ({ plano, zona }) => {
  const { width } = useVideoConfig();
  const t = useTempo();
  const rosto = { ...(plano.rosto as Rosto), quadro: (plano.rosto as Rosto).quadro ?? { largura: QUADRO.w, altura: QUADRO.h } };
  const r = rostoNaTela(CHEIO_16x9, rosto, Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h), t);
  const etiqueta: React.CSSProperties = { position: "absolute", fontFamily: sans, fontWeight: 700, fontSize: 24, color: "#00E5FF", background: "rgba(0,0,0,0.6)", padding: "2px 10px" };
  const queixo = zona.topo - 60;
  const xCartao = Math.min(Math.max(MARGEM, plano.rosto.x * QUADRO.w - CARTAO.largura / 2), QUADRO.w - MARGEM - CARTAO.largura);
  // `aDireita`: a etiqueta vai no canto direito da faixa (as duas faixas começam quase juntas)
  const legenda = (l: typeof LEGENDA_CHEIA, cor: string, nome: string, aDireita = false) => (
    <>
      <div style={{ position: "absolute", left: l.cx - l.largura / 2, width: l.largura, top: l.base - LEGENDA.altura, height: LEGENDA.altura, border: `3px dashed ${cor}`, boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: cor, ...(aDireita ? { right: QUADRO.w - (l.cx + l.largura / 2) + 8 } : { left: l.cx - l.largura / 2 + 8 }), top: l.base - LEGENDA.altura - 34 }}>{nome}</div>
    </>
  );
  return (
    <>
      <div style={{ position: "absolute", left: r.x - 60, top: r.y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: r.x, top: r.y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: r.x + 70, top: r.y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: xCartao, width: CARTAO.largura, top: queixo + 14, height: LIMITE_PLAYER - 16 - queixo - 14, border: "3px dashed #00E5FF", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, left: xCartao + 8, top: queixo + 22 }}>cartão no peito · queixo {Math.round(queixo)}</div>
      {legenda(LEGENDA_CHEIA, "#FFD400", "legenda (tela cheia)", true)}
      {legenda(LEGENDA_NO_PAINEL, "#FFB000", "legenda (painel)")}
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: PAINEL.w, height: PAINEL.h, border: "3px dashed #B388FF", boxSizing: "border-box", opacity: 0.8 }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: PAINEL.x + 12, top: PAINEL.y + 10 }}>quadro (painel)</div>
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, borderRadius: MOLDURA.raio, border: "3px dashed #B388FF", boxSizing: "border-box" }} />
      <div style={{ ...etiqueta, color: "#B388FF", left: MOLDURA.x + 16, top: MOLDURA.y + 12 }}>moldura (painel)</div>
      <div style={{ position: "absolute", left: MARGEM, top: 0, width: 2, height: QUADRO.h, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: width - MARGEM, top: 0, width: 2, height: QUADRO.h, background: "rgba(255,59,107,0.5)" }} />
      <div style={{ position: "absolute", left: 0, width, top: LIMITE_PLAYER, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_PLAYER + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
