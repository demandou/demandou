// Carimbo de "visitado": marca postal redonda em tinta de azulejo, com as linhas onduladas de
// obliteração. Bate decidido (chega um pouco maior e assenta), sem quicar.
import { limitar, prog } from "../anim";
import { cor, sans } from "../tema";

export const Carimbo: React.FC<{
  x: number;
  y: number;
  // raio em px
  r?: number;
  // instante em que bate
  em: number;
  t: number;
  // texto de cima (padrão VISITADO) e de baixo (ex.: o período)
  topo?: string;
  base?: string;
  giro?: number;
  // com as ondas de obliteração à direita
  ondas?: boolean;
  // já começa batido (sem animação)
  pronto?: boolean;
  // tinta "a lápis": vaga de um carimbo que ainda vai bater
  lapis?: boolean;
  centro?: React.ReactNode;
  // tinta de telha (alerta) em vez de azulejo
  alerta?: boolean;
}> = ({ x, y, r = 104, em, t, topo = "VISITADO", base, giro = -12, ondas = true, pronto, lapis, centro, alerta }) => {
  const p = pronto ? 1 : prog(t, em - 0.06, 0.2);
  if (p <= 0) return null;
  const id = `carimbo-${Math.round(x)}-${Math.round(y)}-${Math.round(em * 100)}`;
  const escala = 1 + 0.3 * (1 - p);
  const fonte = Math.max(30, Math.round(r * 0.28));
  const rCima = r - fonte * 1.3;
  const rBaixo = r - fonte * 0.5;
  const rMiolo = r - fonte * 1.62;
  const tinta = lapis ? cor.lapis : alerta ? cor.telha : cor.azulejo;
  const largura = r * 2 + (ondas ? 160 : 0);
  return (
    <svg
      width={largura}
      height={r * 2}
      viewBox={`${-r} ${-r} ${largura} ${r * 2}`}
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        overflow: "visible",
        opacity: limitar(p * 1.4) * (lapis ? 1 : 0.92),
        transform: `rotate(${giro + 3 * (1 - p)}deg) scale(${escala})`,
        transformOrigin: `${r}px ${r}px`,
        mixBlendMode: lapis ? "normal" : "multiply",
      }}
    >
      <defs>
        {/* arco de cima um pouco maior que meia volta: cabe "VISITADO" com folga */}
        <path
          id={`${id}-cima`}
          d={`M ${-rCima * Math.cos(0.4)} ${rCima * Math.sin(0.4)} A ${rCima} ${rCima} 0 1 1 ${rCima * Math.cos(0.4)} ${rCima * Math.sin(0.4)}`}
        />
        <path id={`${id}-baixo`} d={`M ${-rBaixo} 0 A ${rBaixo} ${rBaixo} 0 0 0 ${rBaixo} 0`} />
      </defs>
      {ondas
        ? [-26, 0, 26].map((dy) => (
            <path key={dy} d={`M ${r - 4} ${dy} q 20 -12 40 0 t 40 0 t 40 0 t 40 0`} fill="none" stroke={tinta} strokeWidth={5} strokeLinecap="round" />
          ))
        : null}
      <circle r={r - 3} fill={lapis ? "rgba(251,246,236,0.4)" : "rgba(251,246,236,0.3)"} stroke={tinta} strokeWidth={lapis ? 3 : 6} strokeDasharray={lapis ? "8 8" : undefined} />
      <circle r={rMiolo} fill="none" stroke={tinta} strokeWidth={lapis ? 2 : 3} strokeDasharray={lapis ? "4 8" : undefined} />
      <text fontFamily={sans} fontWeight={700} fontSize={fonte} letterSpacing="0.06em" fill={tinta} textAnchor="middle">
        <textPath href={`#${id}-cima`} startOffset="50%">
          {topo.toUpperCase()}
        </textPath>
      </text>
      {base ? (
        <text fontFamily={sans} fontWeight={700} fontSize={fonte} letterSpacing="0.05em" fill={tinta} textAnchor="middle">
          <textPath href={`#${id}-baixo`} startOffset="50%">
            {base.toUpperCase()}
          </textPath>
        </text>
      ) : null}
      {centro ?? (
        <path
          d={`M ${-rMiolo * 0.5} ${rMiolo * 0.04} l ${rMiolo * 0.34} ${rMiolo * 0.34} l ${rMiolo * 0.66} ${-rMiolo * 0.7}`}
          fill="none"
          stroke={tinta}
          strokeWidth={Math.max(6, rMiolo * 0.16)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
