import React from "react";
import { ALTURA, LARGURA } from "./dados";
import { comAlfa, MARCA } from "./marca";
import { k, useTempo } from "./tempo";

/**
 * O FUNDO DO QUADRO, só com as cores da marca (aula 8.2: "fundo de estúdio
 * gráfico"; aula 7: "uma grade ou textura discreta no fundo"). Maior que o
 * quadro, para a paralaxe nunca mostrar a borda.
 *
 *   estudio  degradê do fundo, luz de recorte atrás da cabeça, grade fina e dois arcos
 *   grade    degradê e grade, sem os arcos
 *   liso     só o degradê
 */
export const Fundo: React.FC<{ tipo?: "estudio" | "liso" | "grade"; luzY?: number }> = ({ tipo = "estudio", luzY = 0.34 }) => {
  const { t } = useTempo();
  const S = 80;
  const L = LARGURA + 2 * S;
  const A = ALTURA + 2 * S;
  const brilho = 0.75 + 0.25 * k(t, 0, 3);
  return (
    <div style={{ position: "absolute", left: -S, top: -S, width: L, height: A }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 45% at 50% ${Math.round(luzY * 100)}%, ${MARCA.painelClaro} 0%, ${MARCA.fundo} 55%, ${MARCA.fundoProfundo} 100%)`,
        }}
      />
      {tipo !== "liso" ? (
        <>
          {/* a luz de recorte atrás da cabeça (no tom do título): o cabelo escuro não some no fundo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: brilho,
              background: `radial-gradient(ellipse 36% 22% at 50% ${Math.round(luzY * 100) + 1}%, ${comAlfa(MARCA.titulo, 0.16)} 0%, ${comAlfa(MARCA.titulo, 0.05)} 55%, transparent 100%)`,
            }}
          />
          <svg width={L} height={A} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <pattern id="kit-grade" width={64} height={64} patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke={MARCA.titulo} strokeOpacity={0.05} strokeWidth={1.5} />
              </pattern>
              <radialGradient id="kit-esmaece" cx="50%" cy="38%" r="65%">
                <stop offset="0" stopColor="#fff" stopOpacity={1} />
                <stop offset="1" stopColor="#fff" stopOpacity={0} />
              </radialGradient>
              <mask id="kit-mascara-da-grade">
                <rect width={L} height={A} fill="url(#kit-esmaece)" />
              </mask>
            </defs>
            <rect width={L} height={A} fill="url(#kit-grade)" mask="url(#kit-mascara-da-grade)" />
            {tipo === "estudio" ? (
              <>
                <circle cx={L / 2} cy={A * 0.34} r={520} fill="none" stroke={MARCA.titulo} strokeOpacity={0.07} strokeWidth={2} />
                <circle cx={L / 2} cy={A * 0.34} r={760} fill="none" stroke={MARCA.titulo} strokeOpacity={0.045} strokeWidth={2} />
              </>
            ) : null}
          </svg>
          {/* o destaque só num detalhe: um filete no canto de cima */}
          <div style={{ position: "absolute", left: L - S - 210, top: S + 150, width: 150, height: 6, borderRadius: 3, backgroundColor: MARCA.destaque, opacity: 0.85 * k(t, 0.4, 1.2) }} />
        </>
      ) : null}
    </div>
  );
};
