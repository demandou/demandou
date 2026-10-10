import { Easing, interpolate } from "remotion";
import { limitar, ruido } from "../anim";
import { caligrafia, cor } from "../tema";

// Contorno irregular da cera derramada (determinístico).
const contornoDaCera = (R: number, semente: number) => {
  const pontos: string[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r =
      R *
      (1 +
        0.035 * Math.sin(7 * a + semente) +
        0.022 * Math.sin(12 * a + semente * 2.3) +
        0.012 * Math.sin(19 * a + semente * 0.7));
    pontos.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pontos.join(" L")} Z`;
};

// Ornamento neutro (quando não há letra para o monograma): uma estrela de quatro pontas com um
// losango no meio, como o relevo de um sinete sem iniciais.
const Ornamento: React.FC<{ r: number; corDe: string }> = ({ r, corDe }) => {
  const a = r * 0.4;
  const b = r * 0.09;
  return (
    <g fill="none" stroke={corDe} strokeWidth={r * 0.055} strokeLinejoin="round">
      <path d={`M0 ${-a} L${b} ${-b} L${a} 0 L${b} ${b} L0 ${a} L${-b} ${b} L${-a} 0 L${-b} ${-b} Z`} />
      <path d={`M0 ${-r * 0.12} L${r * 0.12} 0 L0 ${r * 0.12} L${-r * 0.12} 0 Z`} fill={corDe} stroke="none" />
    </g>
  );
};

// Lacre de cera azul com monograma (ou um ornamento, sem nome). `p` (0→1) é a estampa: o lacre desce decidido sobre o papel,
// pousa e, quando o sinete sobe, o relevo aparece. `relevo` (0→1) permite re-estampar no fechamento.
export const Selo: React.FC<{
  cx: number;
  cy: number;
  diametro: number;
  p: number;
  letra?: string;
  semente?: number;
  // 0→1→0: o sinete levanta de novo (re-estampa)
  levanta?: number;
  // 0→1: um reflexo de luz atravessa a cera (o último instante do vídeo)
  reflexo?: number;
}> = ({ cx, cy, diametro, p, letra, semente = 1.7, levanta = 0, reflexo = 0 }) => {
  if (p <= 0.001) return null;
  const R = diametro / 2;
  // desce: grande e transparente → tamanho certo; sem quique
  const desce = interpolate(p, [0, 0.62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const escala = 1 + 0.55 * (1 - desce) + 0.12 * levanta;
  const opacidade = limitar(p / 0.28);
  // o relevo do monograma aparece quando o sinete sai (fim da estampa)
  const relevo = limitar((p - 0.6) / 0.4) * (1 - levanta);
  // a sombra encurta à medida que o lacre encosta no papel
  const altura = (1 - desce) * 26 + levanta * 18;
  const id = `selo-${Math.round(cx)}-${Math.round(cy)}-${Math.round(semente * 10)}`;
  const inicial = (letra ?? "").trim().slice(0, 1).toUpperCase();
  return (
    <svg
      width={diametro * 1.6}
      height={diametro * 1.6}
      viewBox={`${-R * 1.6} ${-R * 1.6} ${R * 3.2} ${R * 3.2}`}
      style={{
        position: "absolute",
        left: cx - diametro * 0.8,
        top: cy - diametro * 0.8,
        overflow: "visible",
        opacity: opacidade,
        scale: String(escala),
      }}
    >
      <defs>
        <radialGradient id={`${id}-cera`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor={cor.ceraBrilho} />
          <stop offset="48%" stopColor={cor.cera} />
          <stop offset="100%" stopColor={cor.ceraSombra} />
        </radialGradient>
        <radialGradient id={`${id}-disco`} cx="60%" cy="66%" r="80%">
          <stop offset="0%" stopColor={cor.ceraBrilho} stopOpacity={0.55} />
          <stop offset="60%" stopColor={cor.cera} />
          <stop offset="100%" stopColor={cor.ceraSombra} />
        </radialGradient>
        <clipPath id={`${id}-recorte`}>
          <path d={contornoDaCera(R, semente)} />
        </clipPath>
        <linearGradient id={`${id}-luz`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}-sombra`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3 + altura * 0.5} />
        </filter>
      </defs>
      {/* sombra no papel */}
      <path
        d={contornoDaCera(R, semente)}
        fill="rgba(30,40,58,0.42)"
        transform={`translate(${2 + altura * 0.35} ${5 + altura * 0.8})`}
        filter={`url(#${id}-sombra)`}
      />
      {/* a cera */}
      <path d={contornoDaCera(R, semente)} fill={`url(#${id}-cera)`} />
      {/* borda derramada: um fio mais claro por dentro do contorno */}
      <path d={contornoDaCera(R * 0.93, semente + 0.4)} fill="none" stroke={cor.ceraBrilho} strokeOpacity={0.35} strokeWidth={R * 0.03} />
      {/* o disco estampado pelo sinete */}
      <g opacity={0.35 + 0.65 * relevo}>
        <circle r={R * 0.72} fill={`url(#${id}-disco)`} />
        <circle r={R * 0.72} fill="none" stroke={cor.ceraSombra} strokeWidth={R * 0.05} />
        <circle r={R * 0.665} fill="none" stroke={cor.ceraBrilho} strokeOpacity={0.55} strokeWidth={R * 0.022} />
        <circle r={R * 0.56} fill="none" stroke={cor.ceraSombra} strokeOpacity={0.7} strokeWidth={R * 0.018} strokeDasharray={`${R * 0.035} ${R * 0.05}`} />
        {inicial ? (
          <g opacity={relevo}>
            <text
              x={-R * 0.02}
              y={R * 0.3}
              textAnchor="middle"
              fontFamily={caligrafia}
              fontSize={R * 0.98}
              fill={cor.ceraBrilho}
              opacity={0.75}
              transform={`translate(${-R * 0.025} ${-R * 0.025})`}
            >
              {inicial}
            </text>
            <text x={-R * 0.02} y={R * 0.3} textAnchor="middle" fontFamily={caligrafia} fontSize={R * 0.98} fill={cor.ceraSombra}>
              {inicial}
            </text>
          </g>
        ) : (
          <g opacity={relevo}>
            <g transform={`translate(${-R * 0.02} ${-R * 0.02})`} opacity={0.7}>
              <Ornamento r={R} corDe={cor.ceraBrilho} />
            </g>
            <Ornamento r={R} corDe={cor.ceraSombra} />
          </g>
        )}
      </g>
      {/* o reflexo que atravessa a cera, de cima à esquerda para baixo à direita (só no objeto) */}
      {reflexo > 0.001 && reflexo < 0.999 ? (
        <g clipPath={`url(#${id}-recorte)`}>
          <rect
            x={-R * 0.22 + (reflexo * 2.8 - 1.4) * R}
            y={-R * 1.6}
            width={R * 0.44}
            height={R * 3.2}
            fill={`url(#${id}-luz)`}
            opacity={0.55 * Math.sin(Math.PI * reflexo)}
            transform={`rotate(28 ${(reflexo * 2.8 - 1.4) * R} 0)`}
          />
        </g>
      ) : null}
      {/* brilho da cera, pequeno e no alto (só no objeto) */}
      <ellipse cx={-R * 0.42} cy={-R * 0.5} rx={R * 0.16} ry={R * 0.07} fill="#FFFFFF" opacity={0.22 + 0.06 * ruido(semente)} transform={`rotate(-35 ${-R * 0.42} ${-R * 0.5})`} />
    </svg>
  );
};
