import { limitar } from "../anim";
import type { Caixa } from "../motor/caixa";
import { cor, QUADRO } from "../tema";

// O quanto a caixa da pessoa já virou círculo (0 = tela cheia, 1 = lupa)
export const circularidade = (c: Caixa) => limitar((c.raio ?? 0) / (Math.min(c.w, c.h) / 2));

// Campo da lupa, atrás da pessoa: anéis finos que se abrem quando o círculo se forma (a "focagem")
export const CampoDaLente: React.FC<{ caixa: Caixa; tempo: number; graduacao?: number }> = ({ caixa, tempo, graduacao = 1 }) => {
  const c = circularidade(caixa);
  if (c < 0.05) return null;
  const r = caixa.w / 2;
  const cx = caixa.x + r;
  const cy = caixa.y + caixa.h / 2;
  const abre = c * c;
  const aneis = [
    { d: 70, a: 0.13 },
    { d: 170, a: 0.085 },
    { d: 300, a: 0.055 },
  ];
  // um giro muito lento do anel graduado: o instrumento está ligado (nada fica parado)
  const giro = (tempo * 4) % 360;
  return (
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
      {aneis.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={r + a.d * abre} fill="none" stroke={cor.azul} strokeOpacity={a.a * abre} strokeWidth={2} />
      ))}
      {/* anel graduado entre a lupa e o primeiro anel */}
      <g transform={`translate(${cx} ${cy}) rotate(${giro})`} opacity={0.35 * abre * graduacao}>
        {Array.from({ length: 72 }, (_, i) => {
          const ang = (i / 72) * Math.PI * 2;
          const longo = i % 6 === 0;
          const r1 = r + 30 * abre;
          const r2 = r1 + (longo ? 16 : 8);
          return (
            <line
              key={i}
              x1={Math.cos(ang) * r1}
              y1={Math.sin(ang) * r1}
              x2={Math.cos(ang) * r2}
              y2={Math.sin(ang) * r2}
              stroke={cor.azul}
              strokeWidth={longo ? 2.5 : 1.6}
            />
          );
        })}
      </g>
    </svg>
  );
};

// Aro da lupa, por cima da pessoa: um filete azul afastado do vídeo, que acompanha a forma da caixa
export const AroDaLente: React.FC<{ caixa: Caixa }> = ({ caixa }) => {
  const c = circularidade(caixa);
  if (c < 0.05) return null;
  const folga = 11;
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x - folga,
        top: caixa.y - folga,
        width: caixa.w + 2 * folga,
        height: caixa.h + 2 * folga,
        borderRadius: (caixa.raio ?? 0) + folga,
        boxShadow: `inset 0 0 0 3.5px ${cor.azul}`,
        opacity: c,
      }}
    />
  );
};
