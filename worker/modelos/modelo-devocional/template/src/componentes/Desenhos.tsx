// Desenhos de traço fino (vetor), no estilo de ilustração de livro: tinta azul-noite, oliva e aurora.
// Cada traço se desenha na palavra que o nomeia; depois o desenho tem um movimento próprio e lento
// (o sol nasce, a chama tremula, o ramo balança). Também os ícones do fechamento (carta, marcador…).
import { limitar, prog, respira, suave } from "../anim";
import type { Desenho as NomeDesenho } from "../plano";
import { cor } from "../tema";

export type NomeIcone = "carta" | "marcador" | "balao" | "mais" | "elo";
type Nome = NomeDesenho | NomeIcone;

type Traco = { d: string; c?: "tinta" | "oliva" | "aurora" | "filete"; w?: number; fundo?: string; tracejado?: boolean };

const CORES = { tinta: cor.tinta, oliva: cor.oliva, aurora: cor.aurora, filete: cor.filete };

const estrela = (x: number, y: number, r: number) =>
  `M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`;

// folha de oliveira em (x, y), apontando para `a` graus, comprimento `l`
const folha = (x: number, y: number, a: number, l: number) => {
  const r = (a * Math.PI) / 180;
  const p = (u: number, v: number) => `${(x + u * Math.cos(r) - v * Math.sin(r)).toFixed(1)} ${(y + u * Math.sin(r) + v * Math.cos(r)).toFixed(1)}`;
  return `M${p(0, 0)} C${p(l * 0.3, -l * 0.24)} ${p(l * 0.72, -l * 0.2)} ${p(l, 0)} C${p(l * 0.72, l * 0.2)} ${p(l * 0.3, l * 0.24)} ${p(0, 0)} Z`;
};

const RAMO: Traco[] = [
  { d: "M44 208 C84 176 128 128 198 48", c: "oliva", w: 3.2 },
  ...[
    [70, 186, -160, 34],
    [84, 175, -40, 36],
    [104, 156, -150, 36],
    [118, 143, -30, 38],
    [138, 122, -140, 36],
    [152, 106, -24, 36],
    [170, 84, -128, 32],
    [182, 70, -20, 30],
    [196, 50, -70, 26],
  ].map(([x, y, a, l]) => ({ d: folha(x, y, a, l), c: "oliva" as const, w: 2.4, fundo: cor.olivaClara })),
  { d: "M96 176 m-6 0 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0", c: "oliva", w: 2, fundo: cor.oliva },
  { d: "M146 128 m-6 0 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0", c: "oliva", w: 2, fundo: cor.oliva },
];

const DESENHOS: Record<Nome, Traco[]> = {
  amanhecer: [
    { d: "M60 214 L60 104 A60 60 0 0 1 180 104 L180 214", c: "tinta", w: 3.4 },
    { d: "M44 214 L196 214", c: "tinta", w: 3.4 },
    { d: "M60 168 L180 168", c: "tinta", w: 2.4 },
    { d: "M60 168 C84 156 100 156 118 166 C134 154 158 152 180 162", c: "oliva", w: 2.4 },
    { d: "M150 118 q6 -6 12 0 q6 -6 12 0", c: "tinta", w: 2 },
  ],
  vela: [
    { d: "M72 212 C92 202 148 202 168 212 C148 222 92 222 72 212 Z", c: "tinta", w: 2.8 },
    { d: "M98 208 L98 112 C98 106 142 106 142 112 L142 208", c: "tinta", w: 3.2 },
    { d: "M98 112 C98 118 142 118 142 112", c: "tinta", w: 2.2 },
    { d: "M142 124 C137 132 136 142 140 150", c: "tinta", w: 2.2 },
    { d: "M120 113 L120 100", c: "tinta", w: 2.6 },
  ],
  livro: [
    { d: "M120 78 C100 64 70 60 34 66 L34 184 C70 178 100 182 120 196", c: "tinta", w: 3.2 },
    { d: "M120 78 C140 64 170 60 206 66 L206 184 C170 178 140 182 120 196", c: "tinta", w: 3.2 },
    { d: "M120 78 L120 196", c: "tinta", w: 2.4 },
    { d: "M48 94 C68 89 88 89 106 95", c: "filete", w: 2.2 },
    { d: "M48 112 C68 107 88 107 106 113", c: "filete", w: 2.2 },
    { d: "M48 130 C68 125 88 125 106 131", c: "filete", w: 2.2 },
    { d: "M48 148 C62 144 76 144 90 147", c: "filete", w: 2.2 },
    { d: "M134 95 C152 89 172 89 192 94", c: "filete", w: 2.2 },
    { d: "M134 113 C152 107 172 107 192 112", c: "filete", w: 2.2 },
    { d: "M134 131 C152 125 172 125 192 130", c: "filete", w: 2.2 },
    { d: "M162 74 L162 216 L168 207 L174 216 L174 72", c: "oliva", w: 2.6, fundo: cor.olivaClara },
  ],
  ramo: RAMO,
  coracao: [
    {
      d: "M120 196 C70 160 40 132 40 100 C40 76 58 60 80 60 C98 60 112 70 120 86 C128 70 142 60 160 60 C182 60 200 76 200 100 C200 132 170 160 120 196 Z",
      c: "aurora",
      w: 3.4,
      fundo: cor.auroraClara,
    },
    { d: "M66 98 C66 86 74 78 86 78", c: "aurora", w: 2.4 },
  ],
  caminho: [
    { d: "M28 110 L212 110", c: "tinta", w: 2.2 },
    { d: "M106 110 A14 14 0 0 1 134 110", c: "aurora", w: 2.8 },
    { d: "M60 226 C96 186 112 150 116 112", c: "tinta", w: 3.2 },
    { d: "M180 226 C144 186 128 150 124 112", c: "tinta", w: 3.2 },
    { d: "M28 150 C60 140 80 132 102 118", c: "oliva", w: 2.2 },
    { d: "M212 150 C180 140 160 132 138 118", c: "oliva", w: 2.2 },
    { d: "M120 224 C120 190 120 150 120 118", c: "oliva", w: 3, tracejado: true },
  ],
  lua: [
    { d: "M148 44 A78 78 0 1 0 188 170 A62 62 0 1 1 148 44 Z", c: "tinta", w: 3.2, fundo: "rgba(221,226,194,0.55)" },
    { d: estrela(58, 62, 11), c: "aurora", w: 2.2, fundo: cor.auroraClara },
    { d: estrela(196, 98, 8), c: "aurora", w: 2.2, fundo: cor.auroraClara },
    { d: estrela(70, 196, 7), c: "aurora", w: 2, fundo: cor.auroraClara },
  ],
  semente: [
    { d: "M34 194 C80 186 160 186 206 194", c: "tinta", w: 3 },
    { d: "M104 210 C104 202 136 202 136 210 C136 218 104 218 104 210 Z", c: "tinta", w: 2.6, fundo: cor.auroraClara },
    { d: "M120 203 C120 178 116 158 122 132", c: "oliva", w: 3 },
    { d: "M121 152 C100 148 88 134 90 118 C108 120 120 134 121 152 Z", c: "oliva", w: 2.4, fundo: cor.olivaClara },
    { d: "M122 142 C138 130 156 130 166 140 C152 152 136 152 122 142 Z", c: "oliva", w: 2.4, fundo: cor.olivaClara },
  ],
  carta: [
    { d: "M36 72 L204 72 L204 188 L36 188 Z", c: "tinta", w: 3.4, fundo: "rgba(255,251,239,0.7)" },
    { d: "M36 188 L102 130", c: "filete", w: 2.2 },
    { d: "M204 188 L138 130", c: "filete", w: 2.2 },
    { d: "M36 72 L120 138 L204 72", c: "tinta", w: 3.4 },
  ],
  marcador: [{ d: "M82 34 L158 34 L158 212 L120 180 L82 212 Z", c: "oliva", w: 3.4, fundo: cor.olivaClara }],
  balao: [
    {
      d: "M48 52 L192 52 C202 52 208 58 208 68 L208 148 C208 158 202 164 192 164 L108 164 L74 200 L80 164 L48 164 C38 164 32 158 32 148 L32 68 C32 58 38 52 48 52 Z",
      c: "tinta",
      w: 3.4,
      fundo: "rgba(255,251,239,0.7)",
    },
  ],
  mais: [
    { d: "M120 40 A80 80 0 1 1 119.9 40", c: "tinta", w: 3.4 },
    { d: "M120 82 L120 158", c: "oliva", w: 4 },
    { d: "M82 120 L158 120", c: "oliva", w: 4 },
  ],
  elo: [
    { d: "M104 152 L84 172 C70 186 70 204 84 216 C98 230 116 228 128 216 L150 194", c: "tinta", w: 4 },
    { d: "M136 88 L156 68 C170 54 188 54 200 68 C214 82 214 100 200 112 L178 134", c: "tinta", w: 4 },
    { d: "M100 140 L140 100", c: "oliva", w: 4 },
  ],
};

// partes que se mexem sozinhas depois de desenhadas
const Vivo: React.FC<{ nome: Nome; t: number; em: number; fim: number }> = ({ nome, t, em, fim }) => {
  const p = prog(t, fim - 0.2, 0.6, suave);
  if (nome === "amanhecer") {
    // o sol nasce devagar atrás do horizonte, com raios que respiram
    const nasce = prog(t, em + 0.3, 3.2, suave);
    const y = 34 * (1 - nasce);
    const raios = [-160, -135, -110, -90, -70, -45, -20];
    return (
      <g clipPath="url(#janela-amanhecer)">
        <g transform={`translate(0 ${y})`} opacity={limitar(nasce * 2)}>
          <circle cx={120} cy={168} r={26} fill={cor.auroraClara} stroke={cor.aurora} strokeWidth={2.8} />
          {raios.map((a, i) => {
            const r = (a * Math.PI) / 180;
            const k = 0.75 + 0.25 * respira(t, 2.6, i * 0.4);
            return (
              <line
                key={a}
                x1={120 + Math.cos(r) * 34}
                y1={168 + Math.sin(r) * 34}
                x2={120 + Math.cos(r) * (34 + 14 * k)}
                y2={168 + Math.sin(r) * (34 + 14 * k)}
                stroke={cor.aurora}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </g>
    );
  }
  if (nome === "vela") {
    const k = 1 + 0.06 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1);
    const sk = 3 * Math.sin(t * 4.7);
    return (
      <g opacity={p} transform={`translate(120 98) scale(${1 / k} ${k}) skewX(${sk}) translate(-120 -98)`}>
        <circle cx={120} cy={74} r={34} fill={cor.luz} opacity={0.9} />
        <path d="M120 98 C106 84 110 66 120 50 C130 66 134 84 120 98 Z" fill={cor.auroraClara} stroke={cor.aurora} strokeWidth={2.4} />
        <path d="M120 94 C114 86 115 77 120 69 C125 77 126 86 120 94 Z" fill={cor.aurora} />
      </g>
    );
  }
  if (nome === "carta") {
    // o selo (um coração) fecha a carta
    const s = prog(t, fim + 0.1, 0.4, suave);
    return (
      <g opacity={s} transform={`translate(120 138) scale(${0.5 + 0.5 * s}) translate(-120 -138)`}>
        <path d="M120 156 C106 146 100 139 100 131 C100 125 104 121 110 121 C115 121 118 124 120 128 C122 124 125 121 130 121 C136 121 140 125 140 131 C140 139 134 146 120 156 Z" fill={cor.aurora} />
      </g>
    );
  }
  if (nome === "balao") {
    return (
      <g opacity={p}>
        {[88, 120, 152].map((x, i) => (
          <circle key={x} cx={x} cy={108} r={8 + 2 * Math.max(0, respira(t, 1.4, i * 0.5))} fill={cor.aurora} />
        ))}
      </g>
    );
  }
  return null;
};

// Movimento do desenho inteiro depois de pronto (lento)
const movimento = (nome: Nome, t: number) => {
  if (nome === "ramo") return `rotate(${1.6 * respira(t, 4.6)} 44 208)`;
  if (nome === "coracao") return `translate(120 128) scale(${1 + 0.035 * Math.pow(Math.max(0, Math.sin((t * Math.PI) / 0.8)), 6)}) translate(-120 -128)`;
  if (nome === "marcador" || nome === "carta" || nome === "balao" || nome === "mais" || nome === "elo") return `translate(0 ${4 * respira(t, 3.4)})`;
  return undefined;
};

export const duracaoDoDesenho = (nome: Nome) => (DESENHOS[nome]?.length > 6 ? 1.5 : 1.15);

export const Desenho: React.FC<{ nome: Nome; t: number; em: number; x: number; y: number; tamanho: number }> = ({ nome, t, em, x, y, tamanho }) => {
  const tracos = DESENHOS[nome];
  if (!tracos || t < em) return null;
  const dur = duracaoDoDesenho(nome);
  const fim = em + dur;
  const n = tracos.length;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 240 240" style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <defs>
        <clipPath id="janela-amanhecer">
          <path d="M60 168 L60 104 A60 60 0 0 1 180 104 L180 168 Z" />
        </clipPath>
      </defs>
      {nome === "amanhecer" ? <Vivo nome={nome} t={t} em={em} fim={fim} /> : null}
      <g transform={movimento(nome, t)}>
        {tracos.map((tr, i) => {
          const ini = em + (i / n) * dur * 0.7;
          const p = prog(t, ini, dur * 0.45, suave);
          if (p <= 0) return null;
          const c = CORES[tr.c ?? "tinta"];
          const enche = tr.fundo ? prog(t, ini + dur * 0.3, 0.4, suave) : 0;
          const anda = tr.tracejado ? -((t - em) * 0.08) % 1 : 0;
          return (
            <g key={i}>
              {tr.fundo && enche > 0 ? <path d={tr.d} fill={tr.fundo} opacity={enche} stroke="none" /> : null}
              <path
                d={tr.d}
                fill="none"
                stroke={c}
                strokeWidth={tr.w ?? 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={tr.tracejado && p >= 1 ? "0.05 0.05" : "1 1"}
                strokeDashoffset={tr.tracejado && p >= 1 ? anda : 1 - p}
              />
            </g>
          );
        })}
        {nome !== "amanhecer" ? <Vivo nome={nome} t={t} em={em} fim={fim} /> : null}
      </g>
    </svg>
  );
};
