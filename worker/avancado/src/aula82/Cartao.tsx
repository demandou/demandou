import React from "react";
import { k, mix, SAIDA } from "../anim";
import { MARCA } from "../marca";

/** Ícones vetoriais do próprio projeto (grade de 24), desenhados por traço. */
const ICONES: Record<string, string> = {
  caixa: "M3 7.5 L12 3 L21 7.5 L21 16.5 L12 21 L3 16.5 Z M3 7.5 L12 12 L21 7.5 M12 12 L12 21",
  notebook: "M5 5 H19 A1 1 0 0 1 20 6 V15 H4 V6 A1 1 0 0 1 5 5 Z M2 15 H22 L21 18.5 H3 Z",
  celular: "M8 2.5 H16 A2 2 0 0 1 18 4.5 V19.5 A2 2 0 0 1 16 21.5 H8 A2 2 0 0 1 6 19.5 V4.5 A2 2 0 0 1 8 2.5 Z M11 18.5 H13",
};
// etiqueta de preço sem número: "mais caro" é o que ele disse, valor nenhum
const ETIQUETA = "M3 11.5 L11.5 3 H20.5 V12 L12 20.5 Z M16.6 6.9 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0";

/**
 * Cartão "X MAIS CARO": pequeno elemento À FRENTE da moldura (aula 8.2), com
 * preparação, entrada e permanência. Entra do lado de onde está, inclinado,
 * e o ícone se desenha por traço.
 */
export const Cartao: React.FC<{ t: number; inicio: number; titulo: string; icone: keyof typeof ICONES; x?: number; direita?: number; y: number; lado: -1 | 1 }> = ({
  t,
  inicio,
  titulo,
  icone,
  x,
  direita,
  y,
  lado,
}) => {
  const p = k(t, inicio, inicio + 0.5, SAIDA);
  if (p <= 0) return null;
  const traco = k(t, inicio + 0.08, inicio + 0.7);
  const etiqueta = k(t, inicio + 0.35, inicio + 0.8);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        right: direita,
        top: y,
        height: 128,
        whiteSpace: "nowrap",
        borderRadius: 22,
        backgroundColor: "rgba(42, 44, 48, 0.94)",
        border: `2px solid ${MARCA.linhaForte}`,
        boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 30px 0 22px",
        boxSizing: "border-box",
        opacity: p,
        translate: `${(1 - p) * lado * 90}px ${(1 - p) * 26}px`,
        rotate: `${mix(lado * -7, lado * -2, p)}deg`,
      }}
    >
      <svg width={70} height={70} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path d={ICONES[icone]} fill="none" stroke={MARCA.destaque} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - traco} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: MARCA.titulo, letterSpacing: "-0.01em", lineHeight: 1 }}>{titulo}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: etiqueta, translate: `${(1 - etiqueta) * -12}px 0px` }}>
          <svg width={30} height={30} viewBox="0 0 24 24">
            <path d={ETIQUETA} fill="none" stroke={MARCA.destaque} strokeWidth={2} strokeLinejoin="round" />
          </svg>
          <div style={{ fontWeight: 800, fontSize: 30, color: MARCA.destaque, lineHeight: 1 }}>MAIS CARO</div>
        </div>
      </div>
    </div>
  );
};
