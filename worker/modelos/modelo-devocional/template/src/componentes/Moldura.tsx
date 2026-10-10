// A moldura da pessoa (sombra macia para fora e um filete oliva, como passe-partout de livro) e a
// tarja do nome. Nada disso toca na pessoa: a cor do vídeo não muda, nada de brilho atrás dela.
import { prog } from "../anim";
import { TARJA } from "../layout";
import { caberLinha } from "../medida";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { cor, sans, serif } from "../tema";

export const SombraDaMoldura: React.FC<{ caixa: Caixa }> = ({ caixa }) => (
  <div
    style={{
      position: "absolute",
      left: caixa.x,
      top: caixa.y,
      width: caixa.w,
      height: caixa.h,
      borderRadius: caixa.raio,
      background: cor.moldura,
      boxShadow: "0 -6px 30px rgba(40,30,15,0.20), 0 2px 8px rgba(40,30,15,0.12)",
    }}
  />
);

// filete fino em volta da moldura (por cima do papel, fora do vídeo)
export const Filete: React.FC<{ caixa: Caixa }> = ({ caixa }) => {
  const f = 10;
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x - f,
        top: caixa.y - f,
        width: caixa.w + 2 * f,
        height: caixa.h + 2 * f,
        borderRadius: (caixa.raio ?? 0) + f,
        border: `2px solid rgba(91,106,46,0.55)`,
        boxSizing: "border-box",
      }}
    />
  );
};

// A tarja: um cartão de papel claro com uma fita oliva (marcador de livro) à esquerda.
// Nome em Manrope 700 (48 px, nunca menos de 40) e área em EB Garamond itálico (34 px, nunca menos de 28).
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number }> = ({ t, plano, de, ate }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || ate <= de || t < de || t > ate + 0.4) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.5);
  const s = prog(t, ate, 0.35);
  const larg = 1080 - 2 * TARJA.x - 34 - 26 - 40 - 28;
  const tN = caberLinha(nome, larg, 48, 40, { familia: "sans", peso: 700 });
  const tA = area ? caberLinha(area, larg, 34, 28, { italico: true }) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: TARJA.x,
        top: TARJA.y,
        height: TARJA.h,
        maxWidth: 1080 - 2 * TARJA.x,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "0 40px 0 26px",
        borderRadius: 14,
        background: "#FBF7EC",
        boxShadow: "0 8px 22px rgba(40,30,15,0.14), 0 1px 3px rgba(40,30,15,0.10)",
        opacity: p * (1 - s),
        transform: p >= 1 && s <= 0 ? undefined : `translateX(${(1 - p) * -30 + s * -20}px)`,
      }}
    >
      {/* a fita do marcador */}
      <svg width={34} height={80} viewBox="0 0 30 66" style={{ flexShrink: 0 }}>
        <path d="M2 0 H28 V62 L15 50 L2 62 Z" fill={cor.oliva} />
      </svg>
      <div>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tN, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{nome}</div>
        {area ? (
          <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500, fontSize: tA, color: cor.tintaSuave, lineHeight: 1.2, whiteSpace: "nowrap" }}>{area}</div>
        ) : null}
      </div>
    </div>
  );
};
