// A pessoa como mensagem de vídeo sendo gravada: o anel de progresso em volta da bolha (o tempo e o
// botão de enviar ficam na barra de gravação do app, embaixo). Some quando a bolha vira quadro cheio.
import type { Caixa } from "../motor/caixa";
import { cor, W } from "../tema";

export const Gravacao: React.FC<{ caixa: Caixa; progresso: number; visivel: number }> = ({ caixa, progresso, visivel }) => {
  // o anel só aparece com a caixa já redonda (no meio da troca ela ainda é um retângulo arredondado)
  const redonda = Math.max(0, 1 - Math.abs(caixa.w - caixa.h) / 40);
  if (visivel * redonda <= 0.01) return null;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const r = caixa.w / 2 + 16;
  return (
    <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: visivel * redonda, pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(242,238,231,0.13)" strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={cor.acento}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.001, progresso)} 1`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
};
