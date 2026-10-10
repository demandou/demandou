// A pessoa como mensagem de vídeo sendo gravada: o anel de progresso em volta da bolha (o tempo e o
// botão de enviar ficam na barra de gravação do app, embaixo). Some quando a bolha vira quadro cheio.
// Desenhado em px do quadro (1920×1080), como a caixa da pessoa; espessura e folga na escala do app.
import type { Caixa } from "../motor/caixa";
import { cor, ESCALA, QUADRO } from "../tema";

export const Gravacao: React.FC<{ caixa: Caixa; progresso: number; visivel: number }> = ({ caixa, progresso, visivel }) => {
  // o anel só aparece com a caixa já redonda (no meio da troca ela ainda é um retângulo arredondado)
  const redonda = Math.max(0, 1 - Math.abs(caixa.w - caixa.h) / 40);
  if (visivel * redonda <= 0.01) return null;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const r = caixa.w / 2 + 16 * ESCALA;
  const traco = 8 * ESCALA;
  return (
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, opacity: visivel * redonda, pointerEvents: "none" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(242,238,231,0.13)" strokeWidth={traco} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={cor.acento}
        strokeWidth={traco}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${Math.max(0.001, progresso)} 1`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
};
