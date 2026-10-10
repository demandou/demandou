// Chamada de editorial de moda: um pino na peça (anel de tinta + ponto índigo) e uma linha fina
// que sai dele, faz um cotovelo e corre na horizontal até a etiqueta ou o cartão.
import { prog } from "../anim";
import { cor } from "../tema";

type Pt = { x: number; y: number };

// "cotovelo": sobe/desce na diagonal até a altura do alvo e segue reto;
// "L": segue reto na horizontal e desce (ou sobe) na vertical até o alvo
const caminho = (de: Pt, ate: Pt, rota: "cotovelo" | "L" = "cotovelo") => {
  if (rota === "L") {
    const quina = { x: ate.x, y: de.y };
    return {
      d: `M${de.x.toFixed(1)} ${de.y.toFixed(1)} L${quina.x.toFixed(1)} ${quina.y.toFixed(1)} L${ate.x.toFixed(1)} ${ate.y.toFixed(1)}`,
      total: Math.abs(quina.x - de.x) + Math.abs(ate.y - quina.y),
    };
  }
  const dx = ate.x - de.x;
  const dy = ate.y - de.y;
  const lado = Math.sign(dx) || 1;
  const diagonal = Math.min(Math.abs(dy), Math.abs(dx) * 0.55);
  const cotovelo = { x: de.x + lado * diagonal, y: ate.y };
  // se a diagonal não alcança a altura, sobe na vertical o resto
  const sobra = Math.abs(dy) - diagonal;
  const meio = { x: de.x, y: de.y + Math.sign(dy) * sobra };
  const pontos = sobra > 1 ? [de, meio, cotovelo, ate] : [de, cotovelo, ate];
  let total = 0;
  for (let i = 1; i < pontos.length; i++) total += Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y);
  return { d: pontos.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "), total };
};

export const Pino: React.FC<{ x: number; y: number; p: number; numero?: number }> = ({ x, y, p, numero }) => {
  // anel de ~52 px: legível na tela do celular
  const r = 26;
  const volta = 2 * Math.PI * r;
  const anel = prog(p, 0, 0.7);
  const ponto = prog(p, 0.25, 0.75);
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="rgba(248,245,239,0.28)" opacity={anel} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={cor.tinta}
        strokeWidth={3.6}
        strokeDasharray={volta}
        strokeDashoffset={volta * (1 - anel)}
        transform={`rotate(-90 ${x} ${y})`}
      />
      <circle cx={x} cy={y} r={numero ? 17 : 11.5} fill={cor.indigo} transform={`translate(${x} ${y}) scale(${ponto}) translate(${-x} ${-y})`} />
      {numero ? (
        <text x={x} y={y + 7} textAnchor="middle" fontSize={20} fontWeight={600} fill={cor.folha} opacity={ponto} style={{ fontFamily: "inherit" }}>
          {numero}
        </text>
      ) : null}
    </g>
  );
};

// Pino + linha. A linha nasce no centro do pino, mas uma máscara esconde o trecho dentro do anel.
export const Chamada: React.FC<{
  id: string;
  de: Pt;
  ate: Pt;
  t: number;
  em: number;
  // progresso da saída (0 = na tela, 1 = saiu)
  fora?: number;
  // ponto final da linha: tracinho, bolinha ou nada
  fim?: "traco" | "bolinha" | "nada";
  rota?: "cotovelo" | "L";
}> = ({ id, de, ate, t, em, fora = 0, fim = "traco", rota = "cotovelo" }) => {
  const p = prog(t, em, 0.7);
  const linha = prog(t, em + 0.12, 0.55);
  const { d, total } = caminho(de, ate, rota);
  // tracinho no fim: perpendicular ao último trecho
  const vertical = rota === "L" && Math.abs(ate.y - de.y) > 2;
  if (p <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - fora }}>
      <defs>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill="white" />
          <circle cx={de.x} cy={de.y} r={29} fill="black" />
        </mask>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={cor.tinta}
        strokeWidth={3.2}
        strokeLinejoin="round"
        strokeDasharray={total}
        strokeDashoffset={total * (1 - linha)}
        mask={`url(#${id}-m)`}
      />
      {fim === "traco" ? (
        vertical ? (
          <line x1={ate.x - 11} x2={ate.x + 11} y1={ate.y} y2={ate.y} stroke={cor.tinta} strokeWidth={3} opacity={prog(linha, 0.85, 0.15)} />
        ) : (
          <line x1={ate.x} x2={ate.x} y1={ate.y - 11} y2={ate.y + 11} stroke={cor.tinta} strokeWidth={3} opacity={prog(linha, 0.85, 0.15)} />
        )
      ) : fim === "bolinha" ? (
        <circle cx={ate.x} cy={ate.y} r={6} fill={cor.tinta} opacity={prog(linha, 0.85, 0.15)} />
      ) : null}
      <Pino x={de.x} y={de.y} p={p} />
    </svg>
  );
};
