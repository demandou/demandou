import React from "react";
import { k } from "../anim";
import { MARCA } from "../marca";

/**
 * O fundo de estúdio gráfico (aula 8.2), só com as cores da marca: o grafite
 * do fundo em degradê, uma grade fina no tom do título, dois arcos grandes e
 * um brilho laranja discreto atrás da cabeça. Fica maior que o quadro para a
 * paralaxe não mostrar borda.
 */
export const Estudio: React.FC<{ t: number }> = ({ t }) => {
  const brilho = 0.75 + 0.25 * k(t, 0, 3);
  return (
    <div style={{ position: "absolute", left: -80, top: -80, width: 1240, height: 2080 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 45% at 50% 34%, ${MARCA.painelClaro} 0%, ${MARCA.fundo} 55%, ${MARCA.fundoProfundo} 100%)`,
        }}
      />
      {/* luz de recorte atrás da cabeça (no tom do título): o cabelo escuro não some no grafite */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: brilho,
          background: "radial-gradient(ellipse 36% 22% at 50% 35%, rgba(219,222,225,0.16) 0%, rgba(219,222,225,0.05) 55%, transparent 100%)",
        }}
      />
      {/* o laranja só num detalhe: um filete no canto de cima */}
      <div style={{ position: "absolute", left: 1240 - 80 - 210, top: 80 + 150, width: 150, height: 6, borderRadius: 3, backgroundColor: MARCA.destaque, opacity: 0.85 * k(t, 0.4, 1.2) }} />
      <svg width={1240} height={2080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="grade" width={64} height={64} patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke={MARCA.titulo} strokeOpacity={0.05} strokeWidth={1.5} />
          </pattern>
          <radialGradient id="esmaece" cx="50%" cy="38%" r="65%">
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="mascaraGrade">
            <rect width={1240} height={2080} fill="url(#esmaece)" />
          </mask>
        </defs>
        <rect width={1240} height={2080} fill="url(#grade)" mask="url(#mascaraGrade)" />
        <circle cx={620} cy={700} r={520} fill="none" stroke={MARCA.titulo} strokeOpacity={0.07} strokeWidth={2} />
        <circle cx={620} cy={700} r={760} fill="none" stroke={MARCA.titulo} strokeOpacity={0.045} strokeWidth={2} />
      </svg>
    </div>
  );
};
