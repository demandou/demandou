// O batente: a moldura de porta em volta da pessoa. Desenhado por dentro da caixa dela, então a
// mesma moldura serve para a tela cheia (a tela é o vão da porta) e para a porta da direita (a
// moldura da aula 9, no quadro deitado), e engrossa na troca entre as duas.
import type { Caixa } from "../motor/caixa";
import { cor, grotesca } from "../tema";

const lateral = `linear-gradient(90deg, ${cor.madeiraEscura} 0%, ${cor.madeira} 16%, ${cor.madeiraClara} 52%, ${cor.madeira} 84%, ${cor.madeiraEscura} 100%)`;
const travessa = `linear-gradient(180deg, ${cor.madeiraEscura} 0%, ${cor.madeira} 16%, ${cor.madeiraClara} 52%, ${cor.madeira} 84%, ${cor.madeiraEscura} 100%)`;

export const Batente: React.FC<{ caixa: Caixa; espessura: number; numero?: string; placa?: number; base?: boolean }> = ({
  caixa,
  espessura: e,
  numero,
  placa = 0,
  base = true,
}) => {
  const { x, y, w, h } = caixa;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, pointerEvents: "none" }}>
      {/* profundidade do vão: sombra curta por dentro da moldura (não é brilho) */}
      <div
        style={{
          position: "absolute",
          left: e,
          top: e,
          right: e,
          bottom: base ? e : 0,
          boxShadow: "inset 0 18px 24px -16px rgba(20,14,8,0.55), inset 14px 0 20px -16px rgba(20,14,8,0.45), inset -14px 0 20px -16px rgba(20,14,8,0.45)",
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: e, height: h, background: lateral }} />
      <div style={{ position: "absolute", right: 0, top: 0, width: e, height: h, background: lateral }} />
      {base ? <div style={{ position: "absolute", left: 0, bottom: 0, width: w, height: e, background: travessa }} /> : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: e, background: travessa }} />
      {/* filete escuro na junta interna */}
      <div style={{ position: "absolute", left: e - 2, top: e - 2, right: e - 2, bottom: base ? e - 2 : -4, border: "2px solid rgba(40,26,14,0.55)" }} />
      {numero && placa > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: w / 2,
            top: e * 0.5,
            translate: "-50% -50%",
            scale: `${0.8 + 0.2 * placa}`,
            opacity: placa,
            background: cor.preto,
            color: cor.papel,
            fontFamily: grotesca,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.06em",
            lineHeight: 1,
            padding: "8px 16px 9px",
            borderRadius: 6,
            boxShadow: "0 4px 8px rgba(20,14,8,0.3)",
          }}
        >
          {numero}
        </div>
      ) : null}
    </div>
  );
};
