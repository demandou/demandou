// Amostras de cor: o "godê" (pó compacto redondo) e a "passada" (produto espalhado no papel).
import { prog, vaiVem } from "../anim";
import { cor as tema } from "../tema";

const clarear = (hex: string, k: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (k > 0 ? (255 - v) * k : v * k)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// Godê: círculo do produto prensado, com um aro fino e a marca de uma pincelada que passa por cima
// `rascunho`: a partir deste instante o godê já aparece "a lápis" (aro tracejado), antes de ganhar cor
export const Gode: React.FC<{ cor: string; t: number; em: number; tamanho: number; id: string; rascunho?: number }> = ({
  cor: c,
  t,
  em,
  tamanho,
  id,
  rascunho,
}) => {
  const p = prog(t, em, 0.55);
  const lapis = rascunho === undefined ? 0 : prog(t, rascunho, 0.4) * (1 - p);
  const pincel = prog(t, em + 0.35, 0.7, vaiVem);
  const r = tamanho / 2;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={clarear(c, 0.28)} />
          <stop offset="0.6" stopColor={c} />
          <stop offset="1" stopColor={clarear(c, -0.12)} />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <circle cx={r} cy={r} r={r * 0.84 * p} />
        </clipPath>
      </defs>
      {lapis > 0 ? (
        <circle cx={r} cy={r} r={r * 0.84} fill="rgba(201,185,189,0.18)" stroke={tema.lapis} strokeWidth={3.5} strokeDasharray="7 9" opacity={lapis} />
      ) : null}
      <circle cx={r} cy={r} r={r * 0.97} fill="none" stroke="rgba(58,35,48,0.22)" strokeWidth={2} opacity={Math.max(p, lapis)} />
      <circle cx={r} cy={r} r={r * 0.84 * p} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        <path
          d={`M${r * 0.35},${r * 1.25} Q${r},${r * 0.55} ${r * 1.7},${r * 0.95}`}
          fill="none"
          stroke={clarear(c, 0.45)}
          strokeWidth={r * 0.22}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${pincel} 1`}
          opacity={pincel > 0 ? 0.55 : 0}
        />
      </g>
    </svg>
  );
};

// Passada: o produto espalhado numa faixa (começo redondo, fim que se desfaz como um dedo que
// levanta), revelada da esquerda para a direita. Com `brilho`, um reflexo atravessa a faixa.
export const Passada: React.FC<{
  cor: string;
  t: number;
  em: number;
  largura: number;
  altura: number;
  id: string;
  espelhar?: boolean;
  brilho?: boolean;
  // a partir deste instante a faixa já aparece "a lápis" (contorno tracejado), antes de ganhar cor
  rascunho?: number;
}> = ({ cor: c, t, em, largura: w, altura: h, id, espelhar, brilho, rascunho }) => {
  const p = prog(t, em, 0.7, vaiVem);
  const lapis = rascunho === undefined ? 0 : prog(t, rascunho, 0.4) * (1 - prog(t, em + 0.5, 0.4));
  const r = h * 0.5;
  // faixa levemente irregular: mais grossa no começo, afinando e se abrindo em fiapos no fim
  const d = `M${r},${h * 0.06}
    C${w * 0.3},${h * 0.0} ${w * 0.62},${h * 0.1} ${w * 0.86},${h * 0.16}
    L${w * 0.97},${h * 0.2} L${w * 0.9},${h * 0.32} L${w * 1.0},${h * 0.42} L${w * 0.9},${h * 0.52} L${w * 0.98},${h * 0.64} L${w * 0.86},${h * 0.74}
    C${w * 0.6},${h * 0.9} ${w * 0.3},${h * 0.98} ${r},${h * 0.94}
    A${r * 0.94},${r * 0.94} 0 0 1 ${r},${h * 0.06} Z`;
  const reflexo = brilho ? ((t - em - 0.6) * 0.5) % 1.5 : -1;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible", transform: espelhar ? "scaleX(-1)" : undefined }}>
      <defs>
        <clipPath id={`${id}-rev`}>
          <rect x={-10} y={-h} width={(w + 20) * p} height={h * 3} />
        </clipPath>
        <linearGradient id={`${id}-lg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={clarear(c, 0.32)} />
          <stop offset="0.42" stopColor={c} />
          <stop offset="1" stopColor={clarear(c, -0.12)} />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.62" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity={0.25} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse">
          <rect x={0} y={-h} width={w} height={h * 3} fill={`url(#${id}-fade)`} />
        </mask>
        <linearGradient id={`${id}-rf`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.85} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-forma`}>
          <path d={d} />
        </clipPath>
      </defs>
      {lapis > 0 ? (
        <path d={d} fill="rgba(201,185,189,0.16)" stroke={tema.lapis} strokeWidth={3.5} strokeDasharray="8 10" strokeLinejoin="round" opacity={lapis} />
      ) : null}
      <g clipPath={`url(#${id}-rev)`} mask={`url(#${id}-m)`}>
        <path d={d} fill={`url(#${id}-lg)`} />
        <g clipPath={`url(#${id}-forma)`}>
          {/* estrias finas do produto arrastado */}
          {[0.3, 0.47, 0.62, 0.76].map((k, i) => (
            <path
              key={k}
              d={`M${r * 0.6},${h * k} C${w * 0.35},${h * (k - 0.04)} ${w * 0.7},${h * (k + 0.03)} ${w},${h * (k + 0.01)}`}
              stroke={i % 2 ? clarear(c, -0.1) : "#fff"}
              strokeOpacity={i % 2 ? 0.25 : 0.3}
              strokeWidth={2}
              fill="none"
            />
          ))}
          {reflexo >= 0 && reflexo <= 1.2 ? <rect x={(reflexo - 0.25) * w} y={0} width={w * 0.25} height={h} fill={`url(#${id}-rf)`} /> : null}
        </g>
      </g>
    </svg>
  );
};
