import type { Ilustracao as TIlustracao } from "../plano";

// Ilustrações simples e chapadas para o lugar da imagem na página limpa (viewBox 350×300).
// As cores saem da cor da marca e da tinta, então combinam com qualquer página.

const canal = (hex: string, s: number) => (parseInt(hex.slice(1, 7), 16) >> s) & 255;
export const tom = (hex: string, f: number) => {
  // f < 0 escurece, f > 0 clareia
  const c = [16, 8, 0].map((s) => {
    const v = canal(hex, s);
    return Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
  });
  return `#${c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
};

export const Ilustracao: React.FC<{ tipo: TIlustracao; cor: string; tinta: string; w: number; h: number }> = ({ tipo, cor, tinta, w, h }) => {
  const fundo = tom(cor, 0.55);
  const sombra = tom(cor, -0.18);
  return (
    <svg width={w} height={h} viewBox="0 0 350 300" style={{ display: "block" }}>
      <rect x={0} y={0} width={350} height={300} rx={22} fill={fundo} />
      <ellipse cx={175} cy={252} rx={128} ry={18} fill={sombra} opacity={0.5} />
      {tipo === "pao" ? <Pao tinta={tinta} /> : null}
      {tipo === "produto" ? <Produto tinta={tinta} cor={cor} /> : null}
      {tipo === "curso" ? <Curso tinta={tinta} cor={cor} /> : null}
      {tipo === "agenda" ? <Agenda tinta={tinta} cor={cor} /> : null}
      {tipo === "cafe" ? <Cafe tinta={tinta} cor={cor} /> : null}
    </svg>
  );
};

const Pao: React.FC<{ tinta: string }> = ({ tinta }) => (
  <g>
    {/* tábua */}
    <rect x={58} y={214} width={234} height={30} rx={15} fill="#9A6337" />
    <rect x={58} y={214} width={234} height={10} rx={5} fill="#B07546" />
    {/* pão */}
    <path d="M72 214 C 66 150, 120 104, 175 104 C 230 104, 284 150, 278 214 Z" fill="#C9772F" />
    <path d="M86 214 C 82 160, 126 122, 175 122 C 224 122, 268 160, 264 214 Z" fill="#DB8C3F" />
    {/* cortes */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M${118 + i * 44} ${178 - (i === 1 ? 14 : 0)} q 18 -26 40 -30`}
        stroke="#F6D3A0"
        strokeWidth={10}
        strokeLinecap="round"
        fill="none"
      />
    ))}
    {/* vapor */}
    {[0, 1].map((i) => (
      <path
        key={i}
        d={`M${160 + i * 32} 88 c -10 -12 10 -20 0 -32`}
        stroke={tinta}
        strokeOpacity={0.35}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    ))}
  </g>
);

const Produto: React.FC<{ tinta: string; cor: string }> = ({ tinta, cor }) => (
  <g>
    <path d="M95 120 L175 88 L255 120 L255 222 L175 254 L95 222 Z" fill={tom(cor, -0.35)} />
    <path d="M95 120 L175 152 L175 254 L95 222 Z" fill={tom(cor, -0.22)} />
    <path d="M175 152 L255 120 L255 222 L175 254 Z" fill={tom(cor, -0.45)} />
    <path d="M95 120 L175 88 L255 120 L175 152 Z" fill={tom(cor, -0.08)} />
    <path d="M135 104 L215 136 L215 166" stroke={tinta} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.8} />
  </g>
);

const Curso: React.FC<{ tinta: string; cor: string }> = ({ tinta, cor }) => (
  <g>
    <rect x={62} y={70} width={226} height={150} rx={18} fill={tinta} />
    <circle cx={175} cy={140} r={36} fill={cor} />
    <path d="M164 122 L192 140 L164 158 Z" fill={tinta} />
    <rect x={84} y={196} width={182} height={8} rx={4} fill="#ffffff" opacity={0.25} />
    <rect x={84} y={196} width={92} height={8} rx={4} fill={cor} />
  </g>
);

const Agenda: React.FC<{ tinta: string; cor: string }> = ({ tinta, cor }) => (
  <g>
    <rect x={80} y={74} width={190} height={170} rx={18} fill="#FFFFFF" />
    <rect x={80} y={74} width={190} height={44} rx={18} fill={tinta} />
    <rect x={80} y={100} width={190} height={18} fill={tinta} />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={98 + (i % 4) * 42} y={132 + Math.floor(i / 4) * 36} width={30} height={24} rx={6} fill={i === 6 ? cor : "#E6E2D8"} />
    ))}
    <path d="M182 200 l 7 7 l 13 -15" stroke={tinta} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </g>
);

const Cafe: React.FC<{ tinta: string; cor: string }> = ({ tinta, cor }) => (
  <g>
    <ellipse cx={175} cy={226} rx={92} ry={16} fill="#FFFFFF" />
    <path d="M110 120 L240 120 L228 214 Q 175 232 122 214 Z" fill={tinta} />
    <path d="M240 140 q 40 4 30 40 q -8 22 -36 20" stroke={tinta} strokeWidth={14} fill="none" strokeLinecap="round" />
    <ellipse cx={175} cy={120} rx={65} ry={12} fill={tom(cor, -0.5)} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${148 + i * 27} 98 c -10 -12 10 -20 0 -34`} stroke={tinta} strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" fill="none" />
    ))}
  </g>
);
