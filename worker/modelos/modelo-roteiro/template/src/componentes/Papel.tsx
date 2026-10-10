// Peças de papel que os cartões compartilham: a moldura de papel (a lápis até ganhar tinta) e o rótulo.
import { limitar, misturarCor } from "../anim";
import { encaixar } from "../medida";
import { cor, sans, sombraPapel } from "../tema";

export type Caixa = { x: number; y: number; w: number; h: number };

// Moldura de papel de todo cartão: a lápis (tracejado, meio transparente) até ganhar tinta
export const Papel: React.FC<{ caixa: Caixa; tinta: number; giro: number; children: React.ReactNode }> = ({ caixa, tinta, giro, children }) => (
  <div
    style={{
      position: "absolute",
      left: caixa.x,
      top: caixa.y,
      width: caixa.w,
      height: caixa.h,
      borderRadius: 18,
      background: cor.papel,
      boxShadow: sombraPapel(0.45 + 0.55 * tinta),
      outline: tinta < 0.98 ? `3px dashed rgba(178,163,137,${1 - tinta})` : undefined,
      outlineOffset: -3,
      rotate: `${giro}deg`,
      translate: `0 ${-8 * Math.sin(Math.PI * limitar(tinta))}px`,
    }}
  >
    {/* filete interno de cartão-postal */}
    <div style={{ position: "absolute", inset: 10, borderRadius: 12, border: `2px solid ${cor.azulejo}`, opacity: 0.22 * tinta }} />
    {children}
  </div>
);

export const Rotulo: React.FC<{ numero?: number; texto: string; tinta: number; icone?: React.ReactNode; largura?: number }> = ({ numero, texto, tinta, icone, largura }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, height: 54 }}>
    {numero !== undefined ? (
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          background: misturarCor(cor.papel, cor.azulejo, tinta),
          border: `3px ${tinta > 0.5 ? "solid" : "dashed"} ${misturarCor(cor.lapis, cor.azulejo, tinta)}`,
          color: misturarCor(cor.lapis, cor.papel, tinta),
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {numero}
      </div>
    ) : null}
    {icone}
    <div
      style={{
        fontFamily: sans,
        fontWeight: 600,
        fontSize: largura ? encaixar(texto, { largura, max: 34, min: 22, linhas: 1, fonte: { familia: "sans", peso: 600, espacamento: 0.14, caixaAlta: true } }).tamanho : 34,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: misturarCor(cor.lapis, cor.azulejo, tinta),
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  </div>
);

export const PAINEL_FUNDO = (tinta: number) => `rgba(220,229,244,${tinta})`;

