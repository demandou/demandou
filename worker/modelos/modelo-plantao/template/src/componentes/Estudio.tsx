// O fundo do estúdio, que aparece atrás dos painéis quando a pessoa encolhe: azul profundo com uma
// grade fina de "parede de dados" que corre devagar. Nunca brilho, nunca degradê colorido.
import { AbsoluteFill } from "remotion";
import { cor, H, W } from "../tema";

const PASSO = 72;

export const Estudio: React.FC<{ t: number }> = ({ t }) => {
  const dx = -((t * 9) % PASSO);
  return (
    <AbsoluteFill style={{ backgroundColor: cor.estudio }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="grade-estudio" width={PASSO} height={PASSO} patternUnits="userSpaceOnUse" patternTransform={`translate(${dx} 0)`}>
            <path d={`M ${PASSO} 0 L 0 0 0 ${PASSO}`} fill="none" stroke="rgba(169,195,255,0.075)" strokeWidth={2} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grade-estudio)" />
      </svg>
    </AbsoluteFill>
  );
};
