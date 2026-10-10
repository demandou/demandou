// Peças de cordas reaproveitadas pelos blocos: o ○ (corda que soa) e o × (corda que não toca) de cima do
// diagrama de acorde, e uma faixa com as seis cordas deitadas, tocadas num instante (a mão desce: de cima
// para baixo) — que soam por um tempo ou abafam logo em seguida.
import { prog } from "../anim";
import { cor } from "../tema";

// ○ (soa) ou × (não toca), como em cima do diagrama de acorde
export const Marca: React.FC<{ tipo: "soa" | "abafa"; p: number; tamanho?: number; corTraco?: string }> = ({ tipo, p, tamanho = 60, corTraco }) => {
  const r = tamanho * 0.36;
  const c = tamanho / 2;
  if (p <= 0)
    return (
      <svg width={tamanho} height={tamanho}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 7" />
      </svg>
    );
  if (tipo === "soa")
    return (
      <svg width={tamanho} height={tamanho} style={{ overflow: "visible" }}>
        <circle cx={c} cy={c} r={r * (0.6 + 0.4 * p)} fill="none" stroke={corTraco ?? cor.azul} strokeWidth={tamanho * 0.09} opacity={p} />
      </svg>
    );
  const d = r * 0.85 * (0.6 + 0.4 * p);
  return (
    <svg width={tamanho} height={tamanho} style={{ overflow: "visible" }}>
      <g stroke={corTraco ?? cor.marfim} strokeWidth={tamanho * 0.09} strokeLinecap="round" opacity={p}>
        <line x1={c - d} y1={c - d} x2={c + d} y2={c + d} />
        <line x1={c - d} y1={c + d} x2={c + d} y2={c - d} />
      </g>
    </svg>
  );
};

// as seis cordas deitadas; `em` = quando são tocadas; `abafaEm` = quando param (ficam tracejadas);
// `azul` = a 3ª corda acende azul depois do toque (o que soa agora)
export const SeisCordas: React.FC<{
  w: number;
  h?: number;
  t: number;
  em: number;
  // quando ganham tinta (antes: tracejado a lápis)
  tintaEm?: number;
  abafaEm?: number;
  decai?: number;
  azul?: boolean;
}> = ({ w, h = 84, t, em, tintaEm, abafaEm, decai = 0.55, azul = false }) => {
  const pAbafa = abafaEm !== undefined ? prog(t, abafaEm, 0.2) : 0;
  const tinta = prog(t, tintaEm ?? em - 0.25, 0.3);
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {Array.from({ length: 6 }, (_, k) => {
        const y = 8 + (k * (h - 16)) / 5;
        const d = t - (em + k * 0.025);
        const fimDaVibracao = abafaEm !== undefined ? Math.max(0, abafaEm - em) + 0.05 : 99;
        const amp = d > 0 && d < Math.min(decai * 6, fimDaVibracao) ? 8 * Math.exp(-d / decai) : 0;
        const pts = Array.from({ length: 49 }, (_, j) => {
          const x = (w * j) / 48;
          return `${x.toFixed(1)} ${(y + amp * Math.sin(2 * Math.PI * 7 * d + k) * Math.sin((Math.PI * x) / w)).toFixed(1)}`;
        });
        const corCorda = azul && k === 2 && t >= em ? cor.azul : cor.niquel;
        return (
          <g key={k}>
            <line x1={0} y1={y} x2={w} y2={y} stroke={cor.lapisForte} strokeWidth={2.5} strokeDasharray="8 9" opacity={Math.max(1 - tinta, pAbafa)} />
            <path d={`M ${pts.join(" L ")}`} fill="none" stroke={corCorda} strokeWidth={azul && k === 2 && t >= em ? 4.5 : 2 + (5 - k) * 0.5} opacity={tinta * (1 - pAbafa)} />
          </g>
        );
      })}
    </svg>
  );
};
