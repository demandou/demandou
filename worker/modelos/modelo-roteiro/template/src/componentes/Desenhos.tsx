// Biblioteca de ilustrações de viagem, todas do mesmo "ilustrador": traço em azul de azulejo, cantos
// redondos, cor chapada por baixo (papel, céu, areia, sol). Caixa 240 × 180 (4:3).
// Cada desenho se faz sozinho: os traços se desenham em sequência e a cor entra por baixo.
import { limitar } from "../anim";
import { cor } from "../tema";

export const NOMES_DESENHOS = [
  "torre",
  "doce",
  "bonde",
  "casario",
  "por-do-sol",
  "igreja",
  "museu",
  "praia",
  "prato",
  "cafe",
  "ponte",
  "barco",
  "parque",
  "montanha",
  "mercado",
  "trem",
  "metro",
  "onibus",
  "aviao",
  "a-pe",
  "bike",
  "carro",
  "foto",
] as const;
export type NomeDesenho = (typeof NOMES_DESENHOS)[number];

type Pincel = {
  // traço i (de n) com progresso de desenho, e preenchimento opcional que entra por baixo
  s: (i: number, preenchimento?: string) => React.SVGAttributes<SVGElement>;
  // só cor (sem traço)
  f: (c: string) => React.SVGAttributes<SVGElement>;
  // traço fino (detalhe) — mesmo progresso do traço i
  d: (i: number) => React.SVGAttributes<SVGElement>;
};

const pincel = (p: number, n: number, sw: number, lapis = false): Pincel => {
  const local = (i: number) => (lapis ? 1 : limitar((p * (n + 3) - i) / 4));
  // a lápis: só o traço, cinza, sem cor por baixo
  const cheio = lapis ? 0 : limitar((p - 0.3) / 0.45);
  const traco = (i: number, w: number): React.SVGAttributes<SVGElement> => {
    const l = local(i);
    return {
      stroke: lapis ? cor.lapis : cor.azulejo,
      strokeWidth: w,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...(l < 0.999 ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - l } : null),
      strokeOpacity: l > 0.001 ? 1 : 0,
    };
  };
  return {
    s: (i, preenchimento) => ({ ...traco(i, sw), fill: preenchimento ?? "none", fillOpacity: preenchimento ? cheio : undefined }),
    f: (c) => ({ fill: c, fillOpacity: cheio, stroke: "none" }),
    d: (i) => ({ ...traco(i, sw * 0.62), fill: "none" }),
  };
};

// ameias (o dente de castelo) de x0 a x1 sobre a linha y
const ameias = (x0: number, x1: number, y: number, dente = 9, alto = 8) => {
  let d = `M${x0} ${y}`;
  let x = x0;
  let sobe = true;
  while (x < x1 - 0.5) {
    const passo = Math.min(dente, x1 - x);
    d += sobe ? ` v${-alto} h${passo} v${alto}` : ` h${passo}`;
    x += passo;
    sobe = !sobe;
  }
  return d;
};

const ondas = (x0: number, x1: number, y: number, a = 6, passo = 24) => {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += passo) d += ` q${passo / 4} ${-a} ${passo / 2} 0 t${passo / 2} 0`;
  return d;
};

const DESENHOS: Record<NomeDesenho, { n: number; desenhar: (k: Pincel) => React.ReactNode }> = {
  torre: {
    n: 12,
    desenhar: (k) => (
      <>
        <rect x={0} y={150} width={240} height={30} {...k.f(cor.ceu)} />
        <path d={ondas(6, 234, 162)} {...k.d(0)} />
        <path d={ondas(28, 214, 174, 5, 20)} {...k.d(1)} />
        {/* baluarte */}
        <path d={`M36 152 V116 ${ameias(36, 204, 116).slice(ameias(36, 204, 116).indexOf(" "))} V152 Z`} {...k.s(2, cor.papel)} />
        {[56, 78, 162, 184].map((x, i) => (
          <path key={x} d={`M${x - 6} 140 v-8 a6 6 0 0 1 12 0 v8 z`} {...k.s(3 + (i % 2), cor.azulejo)} />
        ))}
        {/* guaritas nos cantos */}
        {[44, 196].map((x) => (
          <path key={x} d={`M${x - 7} 116 v-14 h14 v14 M${x - 8} 102 q8 -12 16 0`} {...k.s(5, cor.areiaFunda)} />
        ))}
        {/* torre */}
        <path d={`M92 116 V48 ${ameias(92, 152, 48).slice(ameias(92, 152, 48).indexOf(" "))} V116`} {...k.s(6, cor.papel)} />
        <path d="M86 52 v-14 h12 v14 M85 38 q7 -11 14 0 M146 52 v-14 h12 v14 M145 38 q7 -11 14 0" {...k.s(7, cor.areiaFunda)} />
        <path d="M114 94 V80 a8 8 0 0 1 16 0 V94 Z" {...k.s(8, cor.azulejo)} />
        <path d="M100 98 H144 M104 98 v6 M140 98 v6" {...k.s(9)} />
        <path d="M114 70 v-6 a4 4 0 0 1 8 0 v6 M122 70 v-6 a4 4 0 0 1 8 0 v6" {...k.d(10)} />
        <path d="M60 116 V96 h10 V116" {...k.d(11)} />
      </>
    ),
  },
  doce: {
    n: 7,
    desenhar: (k) => (
      <>
        <ellipse cx={120} cy={142} rx={98} ry={22} {...k.s(0, cor.branco)} />
        <ellipse cx={120} cy={140} rx={74} ry={14} {...k.d(1)} />
        {/* massa: a lateral folhada */}
        <path d="M58 104 C 60 132, 180 132, 182 104 L 176 126 C 168 146, 72 146, 64 126 Z" {...k.s(2, cor.areiaFunda)} />
        <path d="M70 120 l4 12 M90 126 l2 13 M112 128 l0 14 M134 128 l-1 14 M156 126 l-3 13 M172 120 l-4 11" {...k.d(3)} />
        <ellipse cx={120} cy={104} rx={62} ry={24} {...k.s(4, cor.areiaFunda)} />
        {/* creme */}
        <ellipse cx={120} cy={103} rx={50} ry={17} {...k.s(5, cor.sol)} />
        <ellipse cx={104} cy={98} rx={9} ry={4.5} {...k.f(cor.solFundo)} />
        <ellipse cx={134} cy={106} rx={11} ry={5} {...k.f(cor.solFundo)} />
        <ellipse cx={142} cy={96} rx={6} ry={3} {...k.f(cor.solFundo)} />
        <ellipse cx={112} cy={110} rx={5} ry={2.6} {...k.f(cor.solFundo)} />
        <path d="M88 96 q6 -4 12 -3" {...k.d(6)} />
      </>
    ),
  },
  bonde: {
    n: 12,
    desenhar: (k) => (
      <>
        <path d="M4 164 H236" {...k.s(0)} />
        <path d="M16 170 h12 M48 170 h12 M80 170 h12 M112 170 h12 M144 170 h12 M176 170 h12 M208 170 h12" {...k.d(0)} />
        <path d="M150 46 L196 12 M188 12 h16" {...k.s(1)} />
        <rect x={36} y={42} width={168} height={14} rx={6} {...k.s(2, cor.papel)} />
        <rect x={22} y={54} width={196} height={96} rx={16} {...k.s(3, cor.sol)} />
        <path d="M22 120 H218" {...k.s(4)} />
        <rect x={22} y={120} width={196} height={14} {...k.f(cor.papel)} />
        <path d="M22 134 H218" {...k.d(4)} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={38 + i * 34} y={76} width={26} height={32} rx={5} {...k.s(5 + (i % 3), cor.ceuClaro)} />
        ))}
        <rect x={38} y={61} width={46} height={11} rx={3} {...k.s(8, cor.tinta)} />
        <circle cx={66} cy={152} r={11} {...k.s(9, cor.azulejo)} />
        <circle cx={174} cy={152} r={11} {...k.s(10, cor.azulejo)} />
        <circle cx={210} cy={104} r={4} {...k.s(11, cor.papel)} />
      </>
    ),
  },
  casario: {
    n: 14,
    desenhar: (k) => (
      <>
        <path d="M0 160 C 60 130, 130 104, 240 96 V180 H0 Z" {...k.f(cor.areiaFunda)} />
        {/* casas em escada, de baixo para cima */}
        {[
          { x: 8, y: 120, w: 44, h: 46, c: cor.papel },
          { x: 52, y: 104, w: 40, h: 62, c: cor.azulejoVeu, azulejo: true },
          { x: 92, y: 92, w: 42, h: 74, c: cor.papel },
          { x: 134, y: 80, w: 36, h: 86, c: cor.ceuClaro },
          { x: 170, y: 88, w: 42, h: 78, c: cor.papel },
        ].map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} {...k.s(i * 2, c.c)} />
            <path d={`M${c.x - 3} ${c.y} L${c.x + c.w / 2} ${c.y - 12} L${c.x + c.w + 3} ${c.y} Z`} {...k.s(i * 2 + 1, cor.areiaFunda)} />
            {c.azulejo
              ? [0, 1, 2, 3, 4].map((r) =>
                  [0, 1, 2].map((q) => (
                    <path key={`${r}-${q}`} d={`M${c.x + 8 + q * 12} ${c.y + 10 + r * 11} l4 -4 l4 4 l-4 4 z`} {...k.f(cor.azulejo)} />
                  )),
                )
              : [0, 1].map((r) => (
                  <g key={r}>
                    <rect x={c.x + 8} y={c.y + 12 + r * 22} width={9} height={13} rx={2} {...k.f(cor.azulejo)} />
                    <rect x={c.x + c.w - 17} y={c.y + 12 + r * 22} width={9} height={13} rx={2} {...k.f(cor.azulejo)} />
                  </g>
                ))}
          </g>
        ))}
        {/* torre da igreja no alto */}
        <path d="M208 88 V40 h20 V88" {...k.s(10, cor.papel)} />
        <path d="M206 40 q12 -20 24 0" {...k.s(11, cor.areiaFunda)} />
        <path d="M218 20 v-10 M214 14 h8" {...k.d(12)} />
        <path d="M214 62 v-8 a4 4 0 0 1 8 0 v8" {...k.d(13)} />
        <path d="M0 168 C 70 150, 150 150, 240 140" {...k.d(13)} />
      </>
    ),
  },
  "por-do-sol": {
    n: 10,
    desenhar: (k) => (
      <>
        <rect x={0} y={0} width={240} height={118} {...k.f("#F7DFC0")} />
        <circle cx={150} cy={112} r={32} {...k.s(0, cor.sol)} />
        <path d="M150 64 v-14 M118 76 l-10 -10 M182 76 l10 -10 M104 104 h-14 M196 104 h14" {...k.d(1)} />
        <path d="M0 112 C 40 104, 70 108, 100 112 L 240 112" {...k.s(2)} />
        <rect x={0} y={112} width={240} height={30} {...k.f(cor.ceu)} />
        <path d="M128 122 h44 M138 130 h24" {...k.d(3)} />
        <path d="M0 112 c 14 -10 28 -12 40 -6 c 10 -8 24 -8 32 0 L72 112 Z" {...k.s(3, cor.areiaFunda)} />
        {/* pinheiro-manso */}
        <path d="M44 144 C 46 120, 50 96, 58 74" {...k.s(4)} />
        <path d="M14 78 C 18 58, 60 50, 96 62 C 104 72, 90 82, 62 82 C 40 84, 16 88, 14 78 Z" {...k.s(5, cor.azulejo)} />
        {/* balaustrada do mirante */}
        <rect x={0} y={138} width={240} height={9} rx={2} {...k.s(6, cor.papel)} />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${12 + i * 22} 147 c -5 6 -5 12 0 16 c 5 -4 5 -10 0 -16 Z M${12 + i * 22} 163 v9`} {...k.s(7 + (i % 3), cor.papel)} />
        ))}
        <path d="M0 174 H240" {...k.s(9)} />
      </>
    ),
  },
  igreja: {
    n: 10,
    desenhar: (k) => (
      <>
        <path d="M0 168 H240" {...k.s(0)} />
        <rect x={56} y={70} width={128} height={98} {...k.s(1, cor.papel)} />
        <path d="M50 70 L120 34 L190 70 Z" {...k.s(2, cor.areiaFunda)} />
        <rect x={28} y={42} width={34} height={126} {...k.s(3, cor.papel)} />
        <rect x={178} y={42} width={34} height={126} {...k.s(4, cor.papel)} />
        <path d="M24 42 q21 -26 42 0 M174 42 q21 -26 42 0" {...k.s(5, cor.azulejo)} />
        <circle cx={120} cy={88} r={13} {...k.s(6, cor.ceuClaro)} />
        <path d="M104 168 V132 a16 16 0 0 1 32 0 V168" {...k.s(7, cor.azulejo)} />
        <path d="M38 80 v-12 a7 7 0 0 1 14 0 v12 M188 80 v-12 a7 7 0 0 1 14 0 v12" {...k.d(8)} />
        <path d="M45 18 v-12 M40 11 h10 M195 18 v-12 M190 11 h10" {...k.d(9)} />
      </>
    ),
  },
  museu: {
    n: 10,
    desenhar: (k) => (
      <>
        <path d="M24 70 L120 30 L216 70 Z" {...k.s(0, cor.areiaFunda)} />
        <rect x={30} y={70} width={180} height={12} {...k.s(1, cor.papel)} />
        {[44, 76, 108, 140, 172].map((x, i) => (
          <rect key={x} x={x} y={82} width={22} height={66} {...k.s(2 + (i % 4), cor.papel)} />
        ))}
        <rect x={22} y={148} width={196} height={10} {...k.s(6, cor.papel)} />
        <rect x={12} y={158} width={216} height={12} {...k.s(7, cor.papel)} />
        <circle cx={120} cy={56} r={7} {...k.s(8, cor.sol)} />
        <path d="M50 168 h0" {...k.d(9)} />
      </>
    ),
  },
  praia: {
    n: 9,
    desenhar: (k) => (
      <>
        <circle cx={186} cy={44} r={22} {...k.s(0, cor.sol)} />
        <rect x={0} y={96} width={240} height={34} {...k.f(cor.ceu)} />
        <path d={ondas(0, 240, 98, 5, 30)} {...k.s(1)} />
        <path d={ondas(10, 230, 116, 4, 26)} {...k.d(2)} />
        <path d="M0 130 C 80 122, 160 124, 240 132 V180 H0 Z" {...k.s(3, cor.areiaFunda)} />
        <path d="M86 168 L112 70" {...k.s(4)} />
        <path d="M60 84 C 70 52, 150 44, 168 82 C 150 74, 134 76, 118 84 C 104 74, 84 74, 60 84 Z" {...k.s(5, cor.papel)} />
        <path d="M118 84 C 122 66, 124 56, 116 50" {...k.d(6)} />
        <path d="M140 160 h48 v8 h-48 z" {...k.s(7, cor.azulejo)} />
        <path d="M30 150 q10 -6 20 0" {...k.d(8)} />
      </>
    ),
  },
  prato: {
    n: 8,
    desenhar: (k) => (
      <>
        <ellipse cx={120} cy={98} rx={70} ry={66} {...k.s(0, cor.branco)} />
        <ellipse cx={120} cy={98} rx={50} ry={47} {...k.s(1, cor.papel)} />
        <path d="M100 86 C 104 70, 136 70, 140 86 C 150 100, 136 118, 120 116 C 102 116, 92 102, 100 86 Z" {...k.s(2, cor.sol)} />
        <circle cx={112} cy={92} r={5} {...k.f(cor.solFundo)} />
        <circle cx={128} cy={102} r={4} {...k.f(cor.solFundo)} />
        <path d="M30 40 V156 M22 40 v26 q8 8 16 0 v-26" {...k.s(3)} />
        <path d="M212 40 C 226 60, 224 84, 212 96 V156" {...k.s(4)} />
        <path d="M30 70 v0" {...k.d(5)} />
      </>
    ),
  },
  cafe: {
    n: 8,
    desenhar: (k) => (
      <>
        <ellipse cx={120} cy={152} rx={84} ry={16} {...k.s(0, cor.branco)} />
        <path d="M70 84 H170 V112 C 170 142, 70 142, 70 112 Z" {...k.s(1, cor.papel)} />
        <ellipse cx={120} cy={84} rx={50} ry={10} {...k.s(2, cor.solFundo)} />
        <path d="M170 94 c 22 -2 22 30 -4 30" {...k.s(3)} />
        <path d="M100 66 c -8 -10 8 -16 0 -28 M120 64 c -8 -10 8 -16 0 -28 M140 66 c -8 -10 8 -16 0 -28" {...k.d(4)} />
        <path d="M84 116 h72" {...k.d(5)} />
      </>
    ),
  },
  ponte: {
    n: 9,
    desenhar: (k) => (
      <>
        <rect x={0} y={128} width={240} height={52} {...k.f(cor.ceu)} />
        <path d={ondas(4, 236, 150, 4, 26)} {...k.d(0)} />
        <path d="M0 112 H240" {...k.s(1)} />
        <rect x={0} y={108} width={240} height={10} {...k.f(cor.papel)} />
        <rect x={62} y={36} width={14} height={110} {...k.s(2, cor.azulejo)} />
        <rect x={164} y={36} width={14} height={110} {...k.s(3, cor.azulejo)} />
        <path d="M0 96 C 30 96, 50 70, 69 40 C 90 92, 150 92, 171 40 C 190 70, 210 96, 240 96" {...k.s(4)} />
        {[86, 100, 114, 128, 142, 156].map((x) => (
          <path key={x} d={`M${x} ${x < 120 ? 72 + (x - 86) * 0.6 : 88 - (x - 128) * 0.6} V108`} {...k.d(5)} />
        ))}
        {[18, 36, 204, 222].map((x) => (
          <path key={x} d={`M${x} ${x < 120 ? 94 - (x - 18) * 0.5 : 86 + (x - 204) * 0.5} V108`} {...k.d(6)} />
        ))}
      </>
    ),
  },
  barco: {
    n: 8,
    desenhar: (k) => (
      <>
        <rect x={0} y={132} width={240} height={48} {...k.f(cor.ceu)} />
        <path d={ondas(0, 240, 136, 5, 30)} {...k.s(0)} />
        <path d={ondas(20, 220, 160, 4, 24)} {...k.d(1)} />
        <path d="M50 120 H196 L176 146 H70 Z" {...k.s(2, cor.papel)} />
        <path d="M120 120 V28" {...k.s(3)} />
        <path d="M124 34 L182 112 H124 Z" {...k.s(4, cor.papel)} />
        <path d="M116 46 L72 112 H116 Z" {...k.s(5, cor.azulejoVeu)} />
        <path d="M120 28 l14 6 l-14 5" {...k.s(6, cor.sol)} />
        <path d="M78 133 h80" {...k.d(7)} />
      </>
    ),
  },
  parque: {
    n: 8,
    desenhar: (k) => (
      <>
        <path d="M0 150 C 80 140, 160 140, 240 150 V180 H0 Z" {...k.f(cor.areiaFunda)} />
        <path d="M74 154 V104 M166 156 V112" {...k.s(0)} />
        <circle cx={74} cy={82} r={40} {...k.s(1, cor.azulejoVeu)} />
        <circle cx={166} cy={92} r={32} {...k.s(2, cor.azulejoVeu)} />
        <path d="M60 80 q8 -10 18 -4 M152 90 q8 -8 16 -2" {...k.d(3)} />
        <path d="M104 150 h40 M108 150 v-12 h32 v12 M106 138 h36" {...k.s(4, cor.papel)} />
        <path d="M0 152 H240" {...k.d(5)} />
      </>
    ),
  },
  montanha: {
    n: 7,
    desenhar: (k) => (
      <>
        <circle cx={184} cy={46} r={18} {...k.s(0, cor.sol)} />
        <path d="M0 160 L70 64 L112 118 L150 74 L240 160 Z" {...k.s(1, cor.azulejoVeu)} />
        <path d="M70 64 L56 84 L66 80 L74 88 L84 80 Z M150 74 L138 90 L148 88 L156 94 L164 88 Z" {...k.s(2, cor.papel)} />
        <path d="M0 160 H240" {...k.s(3)} />
        <path d="M30 170 h40 M120 170 h60" {...k.d(4)} />
      </>
    ),
  },
  mercado: {
    n: 9,
    desenhar: (k) => (
      <>
        <path d="M24 70 H216 L204 100 H36 Z" {...k.s(0, cor.papel)} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${36 + i * 28} 100 L${46 + i * 28} 70 H${60 + i * 28} L${50 + i * 28} 100 Z`} {...k.f(cor.azulejo)} />
        ))}
        <path d="M36 100 q14 12 28 0 q14 12 28 0 q14 12 28 0 q14 12 28 0 q14 12 28 0 q14 12 28 0" {...k.s(1, cor.papel)} />
        <path d="M44 106 V166 M196 106 V166" {...k.s(2)} />
        <rect x={56} y={134} width={128} height={32} {...k.s(3, cor.areiaFunda)} />
        <circle cx={78} cy={128} r={10} {...k.s(4, cor.sol)} />
        <circle cx={100} cy={128} r={10} {...k.s(5, cor.sol)} />
        <circle cx={140} cy={128} r={10} {...k.s(6, cor.azulejoVeu)} />
        <circle cx={162} cy={128} r={10} {...k.s(7, cor.azulejoVeu)} />
        <path d="M20 166 H220" {...k.s(8)} />
      </>
    ),
  },
  trem: {
    n: 10,
    desenhar: (k) => (
      <>
        <path d="M4 164 H236" {...k.s(0)} />
        <path d="M16 170 h12 M48 170 h12 M80 170 h12 M112 170 h12 M144 170 h12 M176 170 h12 M208 170 h12" {...k.d(0)} />
        <path d="M18 60 H180 C 206 60, 224 86, 226 116 V146 H18 Z" {...k.s(1, cor.papel)} />
        <rect x={18} y={118} width={208} height={12} {...k.f(cor.azulejo)} />
        <path d="M18 118 H226 M18 130 H226" {...k.d(2)} />
        {[30, 68, 106, 144].map((x, i) => (
          <rect key={x} x={x} y={74} width={28} height={30} rx={4} {...k.s(3 + (i % 3), cor.ceuClaro)} />
        ))}
        <path d="M184 74 C 200 76, 212 90, 214 104 H184 Z" {...k.s(6, cor.ceuClaro)} />
        <path d="M80 60 l10 -18 h24 l10 18 M96 42 l-6 -10 h24" {...k.d(7)} />
        {[48, 80, 164, 196].map((x) => (
          <circle key={x} cx={x} cy={150} r={9} {...k.s(8, cor.azulejo)} />
        ))}
        <circle cx={218} cy={136} r={3.5} {...k.s(9, cor.sol)} />
      </>
    ),
  },
  metro: {
    n: 9,
    desenhar: (k) => (
      <>
        <path d="M30 170 L90 40 M210 170 L150 40" {...k.d(0)} />
        <path d="M66 36 H174 C 186 36, 192 44, 192 56 V140 C 192 150, 186 156, 176 156 H64 C 54 156, 48 150, 48 140 V56 C 48 44, 54 36, 66 36 Z" {...k.s(1, cor.papel)} />
        <rect x={62} y={52} width={116} height={54} rx={8} {...k.s(2, cor.ceuClaro)} />
        <rect x={84} y={40} width={72} height={9} rx={3} {...k.s(3, cor.tinta)} />
        <rect x={48} y={116} width={144} height={10} {...k.f(cor.azulejo)} />
        <circle cx={76} cy={138} r={7} {...k.s(4, cor.sol)} />
        <circle cx={164} cy={138} r={7} {...k.s(5, cor.sol)} />
        <path d="M120 106 V156" {...k.d(6)} />
        <path d="M70 156 l-8 12 M170 156 l8 12" {...k.s(7)} />
        <path d="M20 168 H220" {...k.s(8)} />
      </>
    ),
  },
  onibus: {
    n: 10,
    desenhar: (k) => (
      <>
        <path d="M4 166 H236" {...k.d(0)} />
        <rect x={18} y={50} width={206} height={100} rx={14} {...k.s(1, cor.papel)} />
        <rect x={18} y={112} width={206} height={14} {...k.f(cor.azulejo)} />
        {[32, 70, 108, 146].map((x, i) => (
          <rect key={x} x={x} y={64} width={30} height={36} rx={5} {...k.s(2 + (i % 3), cor.ceuClaro)} />
        ))}
        <path d="M186 64 H210 C 216 64, 218 70, 218 76 V112 H186 Z" {...k.s(5, cor.ceuClaro)} />
        <path d="M184 112 V150" {...k.d(6)} />
        <circle cx={64} cy={150} r={14} {...k.s(7, cor.tinta)} />
        <circle cx={180} cy={150} r={14} {...k.s(8, cor.tinta)} />
        <circle cx={64} cy={150} r={5} {...k.f(cor.papel)} />
        <circle cx={180} cy={150} r={5} {...k.f(cor.papel)} />
        <rect x={212} y={128} width={8} height={8} rx={2} {...k.s(9, cor.sol)} />
      </>
    ),
  },
  aviao: {
    n: 7,
    desenhar: (k) => (
      <>
        <path d="M20 150 C 70 140, 150 140, 220 150" {...k.d(0)} />
        <path d="M30 96 C 30 84, 44 80, 60 80 H186 C 210 80, 224 90, 226 98 C 224 106, 210 112, 186 112 H60 C 44 112, 30 108, 30 96 Z" {...k.s(1, cor.papel)} />
        <path d="M96 96 L136 40 H154 L132 96 Z M98 104 L130 142 H146 L126 104 Z" {...k.s(2, cor.azulejoVeu)} />
        <path d="M40 84 L30 52 H44 L62 82 Z" {...k.s(3, cor.azulejo)} />
        <path d="M70 92 h80" {...k.d(4)} />
        <path d="M200 88 c 8 0 14 4 16 8 h-16 z" {...k.s(5, cor.ceuClaro)} />
        <circle cx={70} cy={60} r={0} {...k.d(6)} />
      </>
    ),
  },
  "a-pe": {
    n: 8,
    desenhar: (k) => (
      <>
        <path d="M14 160 H226" {...k.d(0)} strokeDasharray="2 12" />
        {/* tênis de lado */}
        <path d="M30 138 C 30 112, 44 96, 62 92 L 96 86 C 104 70, 120 62, 138 64 L 150 66 C 160 92, 190 104, 214 112 C 226 116, 230 126, 228 138 Z" {...k.s(1, cor.papel)} />
        <path d="M26 138 H230 C 230 148, 222 152, 212 152 H40 C 30 152, 26 148, 26 138 Z" {...k.s(2, cor.azulejo)} />
        <path d="M110 84 l14 20 M124 78 l14 22 M138 74 l14 24" {...k.s(3)} />
        <path d="M150 66 C 146 84, 140 98, 128 108" {...k.d(4)} />
        <path d="M44 120 C 70 118, 100 122, 130 128" {...k.s(5)} />
        <circle cx={62} cy={110} r={5} {...k.s(6, cor.sol)} />
        <path d="M0 0" {...k.d(7)} />
      </>
    ),
  },
  bike: {
    n: 8,
    desenhar: (k) => (
      <>
        <circle cx={66} cy={122} r={36} {...k.s(0)} />
        <circle cx={176} cy={122} r={36} {...k.s(1)} />
        <path d="M66 122 L104 68 H160 L176 122 M104 68 L124 122 L160 68 M66 122 H124" {...k.s(2)} />
        <path d="M96 58 h20 M160 68 l-6 -18 h18" {...k.s(3)} />
        <circle cx={124} cy={122} r={6} {...k.s(4, cor.sol)} />
        <circle cx={66} cy={122} r={4} {...k.f(cor.azulejo)} />
        <circle cx={176} cy={122} r={4} {...k.f(cor.azulejo)} />
        <path d="M10 166 H230" {...k.d(5)} />
      </>
    ),
  },
  carro: {
    n: 8,
    desenhar: (k) => (
      <>
        <path d="M4 158 H236" {...k.d(0)} />
        <path d="M22 132 V112 C 22 102, 30 98, 40 96 L70 92 L96 66 H158 L186 92 L208 96 C 216 98, 220 104, 220 112 V132 Z" {...k.s(1, cor.sol)} />
        <path d="M104 74 H150 L170 94 H90 Z" {...k.s(2, cor.ceuClaro)} />
        <path d="M128 74 V94" {...k.d(3)} />
        <circle cx={66} cy={134} r={16} {...k.s(4, cor.tinta)} />
        <circle cx={176} cy={134} r={16} {...k.s(5, cor.tinta)} />
        <circle cx={66} cy={134} r={6} {...k.f(cor.papel)} />
        <circle cx={176} cy={134} r={6} {...k.f(cor.papel)} />
        <path d="M210 108 h8" {...k.s(6)} />
      </>
    ),
  },
  foto: {
    n: 7,
    desenhar: (k) => (
      <>
        <rect x={34} y={56} width={172} height={104} rx={14} {...k.s(0, cor.papel)} />
        <path d="M84 56 L96 38 H144 L156 56" {...k.s(1, cor.papel)} />
        <circle cx={120} cy={108} r={34} {...k.s(2, cor.azulejoVeu)} />
        <circle cx={120} cy={108} r={20} {...k.s(3, cor.azulejo)} />
        <circle cx={112} cy={100} r={5} {...k.f(cor.papel)} />
        <rect x={176} y={68} width={18} height={10} rx={3} {...k.s(4, cor.sol)} />
      </>
    ),
  },
};

// `largura` em px; `traco` é a espessura do traço em px na tela (o desenho se adapta ao tamanho).
export const Desenho: React.FC<{
  nome: NomeDesenho;
  p?: number;
  largura: number;
  traco?: number;
  // esboço a lápis (antes de o lugar ser dito)
  lapis?: boolean;
  style?: React.CSSProperties;
}> = ({ nome, p = 1, largura, traco = 5, lapis, style }) => {
  const def = DESENHOS[nome] ?? DESENHOS.foto;
  const unidade = largura / 240;
  const k = pincel(p, def.n, (lapis ? traco * 0.7 : traco) / unidade, lapis);
  return (
    <svg width={largura} height={largura * 0.75} viewBox="0 0 240 180" style={{ overflow: "visible", ...style }}>
      {def.desenhar(k)}
    </svg>
  );
};
