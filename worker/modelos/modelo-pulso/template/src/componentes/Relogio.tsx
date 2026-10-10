// O relógio esportivo em volta da pessoa: a caixa preta fosca com as alças curtas, o aro com os
// numerais das zonas, o anel das cinco zonas e o ponteiro do batimento. A pessoa é o visor redondo
// no meio — nada passa por cima dela. `Corpo` fica atrás do vídeo; `Anel` na frente (fora do visor).
import { misturaCor } from "../anim";
import type { Caixa } from "../motor/caixa";
import type { EstadoDoRelogio } from "../relogio";
import { cor, H, mostrador, W } from "../tema";
import { Icone } from "./Icones";

// medidas do relógio em função do raio do visor
export const medidas = (r: number) => ({
  anelDentro: r * 1.05,
  anelFora: r * 1.05 + Math.max(30, r * 0.13),
  numeral: r * 1.05 + Math.max(30, r * 0.13) + Math.max(23, r * 0.095),
  fora: r * 1.05 + Math.max(30, r * 0.13) + Math.max(48, r * 0.2),
  alca: r * 1.47,
});

// ângulo (graus, 0 = em cima, sentido horário) de uma posição em "unidades de zona" (0–5)
const INICIO = -135;
const ABERTURA = 270;
export const anguloDe = (pos: number) => INICIO + (ABERTURA / 5) * pos;
const ponto = (cx: number, cy: number, raio: number, a: number) => {
  const rad = (a * Math.PI) / 180;
  return { x: cx + raio * Math.sin(rad), y: cy - raio * Math.cos(rad) };
};
const arco = (cx: number, cy: number, raio: number, a0: number, a1: number) => {
  const p0 = ponto(cx, cy, raio, a0);
  const p1 = ponto(cx, cy, raio, a1);
  return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}A${raio} ${raio} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
};

const centro = (c: Caixa) => ({ cx: c.x + c.w / 2, cy: c.y + c.h / 2, r: Math.min(c.w, c.h) / 2 });

export const RelogioCorpo: React.FC<{ caixa: Caixa; estado: EstadoDoRelogio }> = ({ caixa, estado }) => {
  if (estado.visivel < 0.01) return null;
  const { cx, cy, r } = centro(caixa);
  const M0 = medidas(r);
  const v = estado.visivel;
  // a caixa cresce a partir da borda do visor (o relógio se fecha em volta da pessoa)
  const cresce = 1 - (1 - v) ** 2;
  const M = { ...M0, fora: r + (M0.fora - r) * cresce, alca: r + (M0.alca - r) * cresce, anelFora: r + (M0.anelFora - r) * cresce };
  const largAlca = r * 0.92;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, v * 1.8) }}>
      <defs>
        <filter id="sombraRelogio" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy={18} stdDeviation={22} floodColor="#101412" floodOpacity={0.28} />
        </filter>
      </defs>
      <g filter="url(#sombraRelogio)">
        {/* alças curtas em cima e embaixo */}
        <rect x={cx - largAlca / 2} y={cy - M.alca} width={largAlca} height={M.alca * 2} rx={r * 0.12} fill="#1C1F23" />
        {/* caixa */}
        <circle cx={cx} cy={cy} r={M.fora} fill={cor.caixa} />
      </g>
      {/* furinhos discretos das alças */}
      {[-1, 1].map((s) => (
        <rect key={s} x={cx - r * 0.07} y={cy + s * (M.alca - r * 0.075) - r * 0.02} width={r * 0.14} height={r * 0.04} rx={r * 0.02} fill="#2E3237" />
      ))}
      <circle cx={cx} cy={cy} r={M.fora - 1.5} fill="none" stroke={cor.caixaBorda} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={M.anelFora + 4} fill="none" stroke="#24282D" strokeWidth={2} />
      {/* fundo do visor (aparece só se o vídeo atrasar um quadro) */}
      <circle cx={cx} cy={cy} r={r} fill={cor.visor} />
    </svg>
  );
};

export const RelogioAnel: React.FC<{ caixa: Caixa; estado: EstadoDoRelogio }> = ({ caixa, estado }) => {
  if (estado.visivel < 0.01) return null;
  const { cx, cy, r } = centro(caixa);
  const M = medidas(r);
  const rMeio = (M.anelDentro + M.anelFora) / 2;
  const espessura = M.anelFora - M.anelDentro;
  const folga = estado.segmentos.length > 1 ? 1.6 : 0;
  const pont = ponto(cx, cy, rMeio, INICIO + ABERTURA * estado.ponteiro);
  const tamNumeral = 34;
  const coracao = Math.max(48, r * 0.17);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: estado.visivel, overflow: "visible" }}>
      {/* borda do visor */}
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="#000000" strokeWidth={5} />
      {estado.segmentos.map((sg, i) => {
        const a0 = INICIO + ABERTURA * sg.a + folga;
        const a1 = INICIO + ABERTURA * sg.b - folga;
        const acesa = sg.acesa;
        const corSeg = misturaCor(sg.cor, "#3A3F45", sg.apaga * 0.86);
        const larg = espessura * (0.25 + 0.75 * acesa) * (1 + 0.42 * sg.foco);
        // o arco cresce para fora quando está em foco (nunca invade o visor)
        const raioArco = rMeio + Math.max(0, larg - espessura) / 2;
        const numeral = ponto(cx, cy, M.numeral + sg.foco * 6, (a0 + a1) / 2);
        return (
          <g key={i}>
            {/* a lápis: a parte espera tracejada */}
            <path d={arco(cx, cy, rMeio, a0, a1)} fill="none" stroke="#454B53" strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round" opacity={1 - acesa} />
            {acesa > 0.01 ? (
              <path d={arco(cx, cy, raioArco, a0, a0 + (a1 - a0) * Math.min(1, acesa * 1.4))} fill="none" stroke={corSeg} strokeWidth={larg} strokeLinecap="butt" />
            ) : null}
            {sg.numeral ? (
              <text
                x={numeral.x}
                y={numeral.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={mostrador}
                fontWeight={700}
                fontSize={tamNumeral + sg.foco * 8}
                fill={sg.foco > 0.01 ? misturaCor(cor.numeral, sg.cor, sg.foco) : misturaCor("#5B626A", cor.numeral, acesa * (1 - sg.apaga * 0.55))}
              >
                {sg.numeral}
              </text>
            ) : null}
          </g>
        );
      })}
      {/* ponteiro: um botão branco sobre o anel */}
      {estado.ponteiroVisivel > 0.01 ? (
        <g opacity={estado.ponteiroVisivel}>
          <circle cx={pont.x} cy={pont.y} r={espessura * 0.62 + 6} fill={cor.caixa} />
          <circle cx={pont.x} cy={pont.y} r={espessura * 0.62} fill="#FFFFFF" />
        </g>
      ) : null}
      {/* coração na abertura de baixo, batendo */}
      <foreignObject x={cx - coracao / 2 - 10} y={cy + (M.anelDentro + M.fora) / 2 - coracao / 2 - 10} width={coracao + 20} height={coracao + 20}>
        <div style={{ width: coracao + 20, height: coracao + 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone
            nome="coracaoCheio"
            tamanho={coracao}
            cor={estado.coracao ? misturaCor("#E9ECEF", estado.coracao.cor, estado.coracao.p) : "#E9ECEF"}
            style={{ scale: String(1 + 0.12 * estado.batida) }}
          />
        </div>
      </foreignObject>
    </svg>
  );
};
