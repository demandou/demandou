// Na pausa, a pessoa vai para o centro entre dois mostradores na parede: o relógio (o ponteiro dá
// uma volta quando ela diz "a cada hora") e o cronômetro (o anel se completa no tempo da caminhada).
// Antes de serem ditos, os dois ficam em esboço.
import { prog, saindo } from "../anim";
import type { Pausa } from "../plano";
import { ARO, cor, LUZ, marcacao, PESSOA_CENTRO } from "../tema";

const R = 92;

const Mostrador: React.FC<{
  cx: number;
  cy: number;
  p: number;
  aceso: number;
  texto?: string;
  cronometro?: boolean;
}> = ({ cx, cy, p, aceso, texto, cronometro }) => {
  const traco = aceso > 0 ? cor.ciano : cor.esbocoTraco;
  const ang = p * 360;
  const arco = (frac: number) => {
    const a = (frac * 360 - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(a) * (R - 4), y: cy + Math.sin(a) * (R - 4) };
  };
  const fim = arco(Math.min(0.9999, p));
  const ponteiro = (comp: number, graus: number) => {
    const a = (graus - 90) * (Math.PI / 180);
    return { x: cx + Math.cos(a) * comp, y: cy + Math.sin(a) * comp };
  };
  const minuto = ponteiro(R * 0.72, ang);
  const hora = ponteiro(R * 0.46, cronometro ? ang : 300 + ang / 12);
  return (
    <svg width={2 * R + 60} height={2 * R + 120} style={{ position: "absolute", left: cx - R - 30, top: cy - R - 50, overflow: "visible" }} viewBox={`${cx - R - 30} ${cy - R - 50} ${2 * R + 60} ${2 * R + 120}`}>
      <defs>
        <filter id={`luz-m-${cx}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {cronometro ? (
        <>
          <rect x={cx - 14} y={cy - R - 26} width={28} height={16} rx={4} fill="none" stroke={traco} strokeWidth={3} />
          <line x1={cx + R * 0.7} y1={cy - R * 0.7} x2={cx + R * 0.8} y2={cy - R * 0.8} stroke={traco} strokeWidth={5} strokeLinecap="round" />
        </>
      ) : null}
      <circle cx={cx} cy={cy} r={R} fill="rgba(3,8,13,0.6)" stroke={cor.esbocoTraco} strokeWidth={3} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const r0 = i % 3 === 0 ? R - 22 : R - 15;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * (R - 8)}
            y2={cy + Math.sin(a) * (R - 8)}
            stroke={cor.osso}
            strokeOpacity={0.3 + 0.5 * aceso}
            strokeWidth={i % 3 === 0 ? 3.5 : 2}
            strokeLinecap="round"
          />
        );
      })}
      {p > 0.002 ? (
        <path
          d={p >= 0.999 ? `M ${cx} ${cy - R + 4} A ${R - 4} ${R - 4} 0 1 1 ${cx - 0.01} ${cy - R + 4}` : `M ${cx} ${cy - R + 4} A ${R - 4} ${R - 4} 0 ${p > 0.5 ? 1 : 0} 1 ${fim.x} ${fim.y}`}
          fill="none"
          stroke={cor.ciano}
          strokeWidth={7}
          strokeLinecap="round"
          filter={`url(#luz-m-${cx})`}
        />
      ) : null}
      <line x1={cx} y1={cy} x2={hora.x} y2={hora.y} stroke={traco} strokeWidth={6} strokeLinecap="round" opacity={cronometro ? 0 : 1} />
      <line x1={cx} y1={cy} x2={minuto.x} y2={minuto.y} stroke={aceso > 0 ? cor.osso : cor.esbocoTraco} strokeWidth={4} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={7} fill={traco} />
      {texto ? (
        <text x={cx} y={cy + R + 52} textAnchor="middle" fill={aceso > 0 ? cor.texto : cor.esboco} style={{ ...marcacao, textTransform: "none", letterSpacing: "0.02em", fontSize: 40, fontWeight: 700 }}>
          {texto}
        </text>
      ) : null}
    </svg>
  );
};

export const PausaTopo: React.FC<{ m: Pausa; t: number; inicio: number; fim: number }> = ({ m, t, inicio, fim }) => {
  const entrada = prog(t, inicio, 0.4);
  const saida = saindo(t, fim, 0.26);
  if (entrada <= 0 || saida >= 1) return null;
  const caixa = PESSOA_CENTRO;
  const cy = caixa.y + caixa.h / 2 - 10;
  const esquerda = (60 + (caixa.x - LUZ - ARO)) / 2;
  const direita = (caixa.x + caixa.w + LUZ + ARO + 960) / 2;
  const rel = m.relogio;
  const relFim = rel ? (rel.ate ?? rel.em + 1) : 0;
  const pRel = rel ? prog(t, rel.em, Math.max(0.3, relFim - rel.em), (x) => x) : 0;
  const pTempo = m.tempo ? prog(t, m.tempo.em, 0.85, (x) => x) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - saida), translate: `0 ${((1 - entrada) * 16).toFixed(1)}px` }}>
      {rel ? <Mostrador cx={esquerda} cy={cy} p={pRel} aceso={rel && t >= rel.em ? 1 : 0} texto={rel.texto} /> : null}
      {m.tempo ? <Mostrador cx={direita} cy={cy} p={pTempo} aceso={t >= m.tempo.em ? 1 : 0} texto={m.tempo.texto} cronometro /> : null}
    </div>
  );
};
