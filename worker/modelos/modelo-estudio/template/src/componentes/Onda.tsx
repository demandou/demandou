// A faixa da onda: o áudio de verdade passando por uma agulha fixa no meio, como no editor de um
// podcast. À esquerda da agulha (já falado) no acento; à direita (o que vem) a lápis.
import type { Onda } from "../onda";
import { cor } from "../tema";

const PASSO = 14;
const BARRA = 6;

export const FaixaDaOnda: React.FC<{ onda: Onda; t: number; x: number; y: number; w: number; h: number; opacidade?: number }> = ({
  onda,
  t,
  x,
  y,
  w,
  h,
  opacidade = 1,
}) => {
  if (h < 6 || opacidade <= 0.01) return null;
  const agora = t * onda.porSegundo;
  const meio = w / 2;
  const metade = Math.ceil(meio / PASSO) + 1;
  const barras: React.ReactNode[] = [];
  for (let k = -metade; k <= metade; k++) {
    const j = Math.floor(agora) + k;
    const bx = meio + (j - agora) * PASSO;
    if (bx < -BARRA || bx > w + BARRA) continue;
    const v = j >= 0 && j < onda.valores.length ? onda.valores[j] : 0;
    const alt = Math.max(5, v * (h - 4));
    // as pontas da faixa somem aos poucos (nada surge do nada na borda)
    const borda = Math.min(1, Math.min(bx, w - bx) / 70);
    const falado = j <= agora;
    // o rastro já falado esmaece devagar para a esquerda
    const rastro = falado ? 0.45 + 0.55 * Math.max(0, 1 - (agora - j) / (meio / PASSO)) : 1;
    barras.push(
      <rect
        key={j}
        x={bx - BARRA / 2}
        y={h / 2 - alt / 2}
        width={BARRA}
        height={alt}
        rx={BARRA / 2}
        fill={falado ? cor.acento : cor.apagadoForte}
        opacity={Math.max(0, borda) * rastro}
      />,
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: opacidade }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {barras}
      </svg>
      {/* a agulha */}
      <div style={{ position: "absolute", left: meio - 1.5, top: -8, width: 3, height: h + 16, borderRadius: 2, background: cor.texto }} />
    </div>
  );
};
