// Desenhos de dicionário ilustrado: silhueta de tinta, legível em qualquer quadro.
// Antes do `em`, o desenho inteiro aparece "a lápis" (cinza claro); no `em`, ganha tinta parte por parte.
// Para criar um desenho novo: um componente com { t, em, cor, tamanho } que desenha num viewBox 400×400,
// registrado em FIGURAS e no tipo `Figura` de src/plano.ts.
import { acaso, limitar, prog } from "../anim";
import type { Figura } from "../plano";
import { cor as paleta } from "../tema";

type PropsFigura = { t: number; em: number; cor: string; tamanho: number; riscaEm?: number };

// ---------- polvo (o animal) ----------

const CABECA = "M 124 176 C 112 96, 150 34, 200 34 C 250 34, 288 96, 276 176 C 271 206, 240 218, 200 218 C 160 218, 129 206, 124 176 Z";
const BRACOS_ESQ = [
  "M 140 198 C 98 214, 64 250, 60 292 C 57 326, 86 338, 98 320 C 106 306, 94 296, 86 306",
  "M 154 208 C 124 244, 106 290, 113 330 C 119 360, 147 366, 151 346 C 154 332, 141 328, 135 338",
  "M 172 213 C 160 256, 154 302, 164 344 C 170 372, 196 378, 199 358 C 201 345, 188 341, 184 351",
  "M 190 216 C 186 262, 184 304, 192 342 C 197 364, 216 362, 214 346",
];
const espelhar = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${400 - Number(x)} ${y}`);
const BRACOS = [...BRACOS_ESQ, ...BRACOS_ESQ.map(espelhar)];
// ventosas: pontinhos claros nos braços de fora
const VENTOSAS: [number, number][] = [
  [71, 268], [64, 292], [74, 318], [116, 300], [116, 326], [160, 318], [164, 342],
];

export const Polvo: React.FC<PropsFigura> = ({ t, em, cor, tamanho }) => {
  const cabeca = prog(t, em, 0.32);
  const lapis = paleta.lapis;
  return (
    <svg width={tamanho} height={tamanho} viewBox="30 18 340 372" style={{ overflow: "visible" }}>
      {/* esboço a lápis: o desenho inteiro, apagado */}
      <g opacity={1 - limitar(prog(t, em + 0.6, 0.3))}>
        <path d={CABECA} fill="none" stroke={lapis} strokeWidth={5} />
        {BRACOS.map((d, i) => (
          <path key={`l${i}`} d={d} fill="none" stroke={lapis} strokeWidth={5} strokeLinecap="round" />
        ))}
      </g>
      {/* tinta: a cabeça surge de cima para baixo, os braços se estendem um a um */}
      <defs>
        <clipPath id={`cabeca-${String(em).replace(".", "-")}`}>
          <rect x={0} y={0} width={400} height={30 + 200 * cabeca} />
        </clipPath>
      </defs>
      <g clipPath={`url(#cabeca-${String(em).replace(".", "-")})`}>
        <path d={CABECA} fill={cor} />
        <circle cx={172} cy={170} r={14} fill={paleta.cartao} />
        <circle cx={228} cy={170} r={14} fill={paleta.cartao} />
        <circle cx={174} cy={173} r={6.5} fill={cor} />
        <circle cx={230} cy={173} r={6.5} fill={cor} />
      </g>
      {BRACOS.map((d, i) => {
        const ordem = [0, 4, 1, 5, 2, 6, 3, 7].indexOf(i);
        const p = prog(t, em + 0.18 + ordem * 0.05, 0.5);
        return (
          <path
            key={`b${i}`}
            d={d}
            fill="none"
            stroke={cor}
            strokeWidth={17}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
          />
        );
      })}
      {VENTOSAS.flatMap(([x, y], i) => [
        [x, y],
        [400 - x, y],
      ].map(([vx, vy], k) => (
        <circle key={`v${i}-${k}`} cx={vx} cy={vy} r={3.6} fill={paleta.cartao} opacity={prog(t, em + 0.7, 0.2)} />
      )))}
    </svg>
  );
};

// ---------- poeira (pó) ----------

const GRAOS = Array.from({ length: 120 }, (_, i) => {
  const a = acaso(i * 3 + 1) * Math.PI * 2;
  const r = Math.pow(acaso(i * 3 + 2), 0.6);
  return {
    x: 200 + Math.cos(a) * r * 172,
    y: 212 + Math.sin(a) * r * 112 - (1 - r) * 14,
    raio: 3.2 + acaso(i * 7 + 5) * 8.5 * (1 - r * 0.5),
    vx: (acaso(i * 11 + 3) - 0.35) * 26,
    vy: -(acaso(i * 13 + 7) * 22 + 6),
    atraso: r * 0.16 + acaso(i) * 0.08,
    tom: acaso(i * 5),
  };
});

// cinza quente do pó (alguns grãos mais escuros, na cor do traço)
const POEIRA = "#9A928F";

export const Poeira: React.FC<PropsFigura> = ({ t, em, cor, tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 400 400" style={{ overflow: "visible" }}>
    {/* a nuvem de pó se espalha do centro e fica flutuando devagar */}
    {GRAOS.map((g, i) => {
      const p = prog(t, em + g.atraso, 0.38);
      const deriva = Math.max(0, t - em);
      const x = 200 + (g.x - 200) * (0.25 + 0.75 * p) + g.vx * deriva * 0.35;
      const y = 214 + (g.y - 214) * (0.25 + 0.75 * p) + g.vy * deriva * 0.35 + Math.sin(deriva * 2 + i) * 3;
      return <circle key={i} cx={x} cy={y} r={g.raio} fill={g.tom > 0.75 ? cor : POEIRA} opacity={p * (0.4 + g.tom * 0.5)} />;
    })}
    {/* esboço: o contorno da nuvem a lápis, até a poeira chegar */}
    <ellipse cx={200} cy={210} rx={150} ry={92} fill="none" stroke={paleta.lapis} strokeWidth={4} strokeDasharray="10 12" opacity={1 - prog(t, em, 0.3)} />
  </svg>
);

export const FIGURAS: Record<Figura, React.FC<PropsFigura>> = { polvo: Polvo, poeira: Poeira };

// Desenho com o risco diagonal (quando a leitura é "errada")
export const FiguraRiscavel: React.FC<PropsFigura & { nome: Figura }> = ({ nome, riscaEm, ...props }) => {
  const Desenho = FIGURAS[nome];
  const p = riscaEm === undefined ? 0 : prog(props.t, riscaEm, 0.24);
  return (
    <div style={{ position: "relative", width: props.tamanho, height: props.tamanho }}>
      <Desenho {...props} />
      {p > 0 ? (
        <svg width={props.tamanho} height={props.tamanho} viewBox="0 0 400 400" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={40} y1={56} x2={40 + 320 * p} y2={56 + 300 * p} stroke={paleta.ameixa} strokeWidth={14} strokeLinecap="round" />
        </svg>
      ) : null}
    </div>
  );
};
