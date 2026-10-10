// Desenhos a traço das cartelas (e dos letreiros, da abertura e do número). Cada um se desenha quando a cartela abre e tem uma pequena ação
// com significado (o sol se põe, o vapor sobe e some quando o café esfria, o poste acende).
// Traço grosso o bastante para ler no celular (~4 px na tela).
import { interpolate, interpolateColors } from "remotion";
import { prog, travelling } from "../anim";
import type { Desenho } from "../plano";
import { cor } from "../tema";

type Props = { t: number; inicio: number; fim: number; passos: number[]; hora?: string };

// traço que se desenha: pathLength=1 deixa o comprimento de todo traço igual a 1
const traco = (p: number): React.SVGProps<SVGPathElement> => ({
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1 - p,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

// ——— pôr do sol: a linha do horizonte se abre do centro e o sol afunda devagar ———
const Sol: React.FC<Props> = ({ t, inicio, fim }) => {
  const horizonte = prog(t, inicio, 1.0, travelling);
  const circulo = prog(t, inicio + 0.25, 1.1, travelling);
  // afunda do começo ao fim da cartela, sem parar
  const afunda = interpolate(t, [inicio, fim + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = 112 + afunda * 78;
  const raios = [-150, -120, -90, -60, -30];
  return (
    <svg viewBox="0 0 600 240" width="100%" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="acima-do-horizonte">
          <rect x={0} y={-200} width={600} height={360} />
        </clipPath>
      </defs>
      <g clipPath="url(#acima-do-horizonte)" stroke={cor.ambar} strokeWidth={4}>
        <circle cx={300} cy={cy} r={62} {...(traco(circulo) as React.SVGProps<SVGCircleElement>)} />
        {raios.map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const vis = prog(t, inicio + 0.9 + i * 0.08, 0.5) * (1 - afunda * 1.3);
          return (
            <line
              key={a}
              x1={300 + Math.cos(rad) * 82}
              y1={cy + Math.sin(rad) * 82}
              x2={300 + Math.cos(rad) * 104}
              y2={cy + Math.sin(rad) * 104}
              strokeLinecap="round"
              opacity={Math.max(0, vis)}
            />
          );
        })}
      </g>
      <path d="M300 160 L40 160" stroke={cor.ambar} strokeWidth={4} {...traco(horizonte)} />
      <path d="M300 160 L560 160" stroke={cor.ambar} strokeWidth={4} {...traco(horizonte)} />
      {/* reflexo na água: aparece enquanto o sol desce */}
      {[
        { y: 184, w: 150 },
        { y: 204, w: 96 },
        { y: 222, w: 46 },
      ].map((r, i) => (
        <path
          key={r.y}
          d={`M${300 - r.w / 2} ${r.y} L${300 + r.w / 2} ${r.y}`}
          stroke={cor.ambar}
          strokeWidth={3.5}
          opacity={0.75 * Math.min(1, afunda * 2.2 - i * 0.25)}
          {...traco(prog(t, inicio + 0.6 + i * 0.15, 0.8))}
        />
      ))}
    </svg>
  );
};

// ——— duas xícaras: o vapor sobe; passo 1 = a primeira é bebida; passo 2 = a segunda esfria ———
const Vapor: React.FC<{ cx: number; t: number; forca: number; fase: number }> = ({ cx, t, forca, fase }) => (
  <g mask="url(#vapor-some)" opacity={forca}>
    {[-26, 0, 26].map((dx, i) => {
      const x = cx + dx + Math.sin(t * 1.3 + fase + i * 1.7) * 4;
      // o trecho visível do traço corre de baixo para cima: o vapor subindo
      const corre = (t * 0.32 + i * 0.29 + fase * 0.1) % 1;
      return (
        <path
          key={dx}
          d={`M${x} 172 C${x - 18} 146 ${x + 18} 120 ${x} 96 C${x - 16} 72 ${x + 14} 56 ${x} 34`}
          stroke={cor.marfim}
          strokeWidth={3.6}
          strokeOpacity={0.62}
          fill="none"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${(0.34 + 0.2 * forca).toFixed(3)} 0.66`}
          strokeDashoffset={-corre + 0.4}
        />
      );
    })}
  </g>
);

const Xicara: React.FC<{ cx: number; p: number; cafe: number; corDoCafe: string }> = ({ cx, p, cafe, corDoCafe }) => (
  <g stroke={cor.marfim} strokeWidth={4}>
    {/* pires */}
    <ellipse cx={cx} cy={318} rx={118} ry={20} {...(traco(prog(p, 0.35, 0.65)) as React.SVGProps<SVGEllipseElement>)} />
    {/* corpo */}
    <path
      d={`M${cx - 78} 196 C${cx - 76} 262 ${cx - 52} 300 ${cx - 28} 306 L${cx + 28} 306 C${cx + 52} 300 ${cx + 76} 262 ${cx + 78} 196`}
      {...traco(prog(p, 0.1, 0.7))}
    />
    {/* borda */}
    <ellipse cx={cx} cy={196} rx={78} ry={15} {...(traco(prog(p, 0, 0.6)) as React.SVGProps<SVGEllipseElement>)} />
    {/* asa */}
    <path d={`M${cx + 70} 222 C${cx + 122} 212 ${cx + 124} 272 ${cx + 60} 274`} {...traco(prog(p, 0.3, 0.6))} />
    {/* o café: some quando é bebido, perde a cor quando esfria */}
    <ellipse cx={cx} cy={203} rx={64} ry={9} stroke={corDoCafe} strokeWidth={3.5} fill={corDoCafe} fillOpacity={0.22} opacity={cafe * prog(p, 0.5, 0.5)} />
  </g>
);

const Xicaras: React.FC<Props> = ({ t, inicio, passos }) => {
  const p = prog(t, inicio, 1.1, travelling);
  const bebe = passos[0] ?? Infinity;
  const esfria = passos[1] ?? Infinity;
  const vapor1 = prog(t, inicio + 0.7, 0.8) * (1 - prog(t, bebe, 0.5));
  const vapor2 = prog(t, inicio + 0.8, 0.8) * (1 - prog(t, esfria, 1.9, travelling));
  const cafe1 = 1 - prog(t, bebe + 0.1, 0.6);
  const corDoCafe2 = interpolateColors(prog(t, esfria, 2.0, travelling), [0, 1], [cor.ambar, cor.frio]);
  return (
    <svg viewBox="0 0 640 360" width="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="vapor-degrade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity={0.2} />
          <stop offset="0.25" stopColor="white" stopOpacity={1} />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </linearGradient>
        <mask id="vapor-some" maskUnits="userSpaceOnUse" x={0} y={20} width={640} height={160}>
          <rect x={0} y={20} width={640} height={160} fill="url(#vapor-degrade)" />
        </mask>
      </defs>
      <Vapor cx={185} t={t} forca={vapor1} fase={0} />
      <Vapor cx={455} t={t} forca={vapor2} fase={2.1} />
      <Xicara cx={185} p={p} cafe={cafe1} corDoCafe={cor.ambar} />
      <Xicara cx={455} p={prog(t, inicio + 0.15, 1.1, travelling)} cafe={1} corDoCafe={corDoCafe2} />
    </svg>
  );
};

// ——— relógio: os ponteiros andam até a hora ———
const Relogio: React.FC<Props> = ({ t, inicio, hora }) => {
  const [h, m] = (hora ?? "18:00").split(/[:h]/).map((x) => Number(x) || 0);
  const alvo = ((h % 12) + m / 60) * 60; // minutos no mostrador
  const anda = prog(t, inicio + 0.5, 1.8, travelling);
  const minutos = alvo - 75 + 75 * anda;
  const aro = prog(t, inicio, 1.1, travelling);
  const angHora = (minutos / 720) * 360 - 90;
  const angMin = ((minutos % 60) / 60) * 360 - 90;
  const ponteiro = (ang: number, len: number, w: number) => {
    const r = (ang * Math.PI) / 180;
    return <line x1={200} y1={200} x2={200 + Math.cos(r) * len} y2={200 + Math.sin(r) * len} stroke={cor.marfim} strokeWidth={w} strokeLinecap="round" opacity={prog(t, inicio + 0.35, 0.4)} />;
  };
  return (
    <svg viewBox="0 0 400 400" width="100%" style={{ overflow: "visible" }}>
      <circle cx={200} cy={200} r={168} stroke={cor.ambar} strokeWidth={4} {...(traco(aro) as React.SVGProps<SVGCircleElement>)} />
      {Array.from({ length: 12 }, (_, i) => {
        const r = (i * 30 * Math.PI) / 180;
        const grande = i % 3 === 0;
        return (
          <line
            key={i}
            x1={200 + Math.cos(r) * (grande ? 128 : 140)}
            y1={200 + Math.sin(r) * (grande ? 128 : 140)}
            x2={200 + Math.cos(r) * 154}
            y2={200 + Math.sin(r) * 154}
            stroke={cor.ambar}
            strokeWidth={grande ? 5 : 3.5}
            strokeLinecap="round"
            opacity={prog(t, inicio + 0.2 + i * 0.04, 0.3)}
          />
        );
      })}
      {ponteiro(angHora, 86, 7)}
      {ponteiro(angMin, 128, 4.5)}
      <circle cx={200} cy={200} r={7} fill={cor.ambar} opacity={prog(t, inicio + 0.35, 0.4)} />
    </svg>
  );
};

// ——— banco de praça com poste: passo 1 = o poste acende; passo 2 = uma xícara aparece no banco ———
const Banco: React.FC<Props> = ({ t, inicio, passos }) => {
  const p = (d: number, dur = 0.7) => prog(t, inicio + d, dur, travelling);
  const acende = prog(t, passos[0] ?? Infinity, 0.9);
  const xicara = prog(t, passos[1] ?? Infinity, 0.8);
  const s = { stroke: cor.marfim, strokeWidth: 4 };
  return (
    <svg viewBox="0 0 640 340" width="100%" style={{ overflow: "visible" }}>
      {/* chão */}
      <path d="M30 300 L610 300" stroke={cor.marfimApagado} strokeWidth={3} {...traco(p(0, 1.0))} />
      {/* encosto */}
      <path d="M96 150 L436 150" {...s} {...traco(p(0.15))} />
      <path d="M96 180 L436 180" {...s} {...traco(p(0.22))} />
      {/* assento */}
      <path d="M80 232 L452 232" {...s} {...traco(p(0.3))} />
      <path d="M92 246 L440 246" {...s} {...traco(p(0.36))} />
      {/* pés e apoios */}
      {[
        "M110 150 L110 232",
        "M422 150 L422 232",
        "M104 246 L96 300",
        "M428 246 L436 300",
        "M80 232 C74 210 84 196 104 196",
        "M452 232 C458 210 448 196 428 196",
      ].map((d, i) => (
        <path key={d} d={d} {...s} {...traco(p(0.4 + i * 0.05, 0.5))} />
      ))}
      {/* poste */}
      <path d="M548 300 L548 70" {...s} {...traco(p(0.3, 0.8))} />
      <path d="M526 70 L570 70 L562 42 L534 42 Z" {...s} {...traco(p(0.8, 0.5))} />
      {/* a luz do poste: um cone de traços, sem brilho */}
      <g stroke={cor.ambar} strokeWidth={3.5} strokeLinecap="round" opacity={acende}>
        <path d="M536 74 L488 296" {...traco(acende)} />
        <path d="M560 74 L608 296" {...traco(acende)} />
        <path d="M534 42 L562 42 L570 70 L526 70 Z" fill={cor.ambar} fillOpacity={0.35 * acende} stroke="none" />
      </g>
      {/* a xícara no banco */}
      <g opacity={xicara} stroke={cor.marfim} strokeWidth={3.5} fill="none" strokeLinecap="round">
        <path d="M314 206 C316 222 322 230 330 231 L346 231 C354 230 360 222 362 206 Z" />
        <path d="M360 212 C376 210 376 226 358 226" />
        <path d="M330 194 C324 186 336 180 330 170" stroke={cor.marfimSuave} strokeDashoffset={-t * 0.3} />
        <path d="M346 194 C340 186 352 180 346 170" stroke={cor.marfimSuave} />
      </g>
    </svg>
  );
};

// ——— moedas: três pilhas que crescem (ou desmoronam), moeda a moeda, do começo ao fim ———
// sentido "sobe" (padrão): as moedas caem e assentam nas pilhas · "cai": as pilhas perdem as moedas de cima
const Moedas: React.FC<Props & { sentido?: "sobe" | "cai" }> = ({ t, inicio, fim, sentido = "sobe" }) => {
  const chao = prog(t, inicio, 0.8, travelling);
  const pilhas = [
    { cx: 140, n: 3 },
    { cx: 300, n: 5 },
    { cx: 460, n: 8 },
  ];
  const total = pilhas.reduce((s, p) => s + p.n, 0);
  const dur = Math.max(1.2, fim - inicio - 0.6);
  const h = 17;
  const base = 288;
  let ordem = 0;
  return (
    <svg viewBox="0 0 600 300" width="100%" style={{ overflow: "visible" }}>
      <path d="M40 300 L560 300" stroke={cor.marfimApagado} strokeWidth={3} {...traco(chao)} />
      {pilhas.map((pl) =>
        Array.from({ length: pl.n }, (_, j) => {
          const k = ordem++;
          // cada moeda tem seu instante, espalhado pelo momento (de baixo para cima, pilha a pilha)
          const quando = inicio + 0.3 + (dur * k) / total;
          const y = base - j * h;
          let dy = 0;
          let vis = 1;
          if (sentido === "sobe") {
            const q = prog(t, quando, 0.45, travelling);
            dy = -(1 - q) * 70;
            vis = q;
          } else {
            // as de cima saem primeiro: moeda some quando chega a vez dela (pilhas ficam baixas)
            const fica = j < Math.ceil(pl.n * 0.35);
            const q = fica ? 0 : prog(t, inicio + 0.6 + (dur * (total - k)) / total, 0.5);
            const aparece = prog(t, inicio + 0.05 * k, 0.4);
            dy = q * 40;
            vis = aparece * (1 - q);
          }
          const topo = j === pl.n - 1 || sentido === "cai";
          return (
            <g key={`${pl.cx}-${j}`} opacity={vis} transform={`translate(0 ${dy.toFixed(1)})`} stroke={j === pl.n - 1 ? cor.ambar : cor.marfim} strokeWidth={3.5} fill="none">
              {/* a borda de baixo e os lados da moeda */}
              <path d={`M${pl.cx - 62} ${y - 6} L${pl.cx - 62} ${y} A62 14 0 0 0 ${pl.cx + 62} ${y} L${pl.cx + 62} ${y - 6}`} fill={cor.preto} />
              {topo ? <ellipse cx={pl.cx} cy={y - 6} rx={62} ry={14} fill={cor.preto} /> : null}
            </g>
          );
        }),
      )}
    </svg>
  );
};

// ——— balança: passo 1 = pende para um lado; passo 2 = pende para o outro (sem passos: oscila e equilibra) ———
const Balanca: React.FC<Props> = ({ t, inicio, passos }) => {
  const p = (d: number, dur = 0.7) => prog(t, inicio + d, dur, travelling);
  const um = prog(t, passos[0] ?? Infinity, 0.8, travelling);
  const dois = prog(t, passos[1] ?? Infinity, 0.8, travelling);
  const livre = passos.length ? 0 : Math.exp(-Math.max(0, t - inicio - 1) * 0.9) * Math.sin(Math.max(0, t - inicio - 1) * 3.2) * 9;
  const ang = livre + -11 * um + 22 * dois * (um > 0 ? 1 : 0.5);
  const r = (ang * Math.PI) / 180;
  const bx = (dx: number) => 300 + Math.cos(r) * dx;
  const by = (dx: number) => 92 + Math.sin(r) * dx;
  const prato = (dx: number, k: number) => {
    const x = bx(dx);
    const y = by(dx);
    return (
      <g stroke={cor.marfim} strokeWidth={3.5} fill="none">
        <path d={`M${x} ${y} L${x - 58} ${y + 120} M${x} ${y} L${x + 58} ${y + 120}`} {...traco(p(0.6 + k * 0.1, 0.5))} />
        <path d={`M${x - 74} ${y + 120} C${x - 60} ${y + 156} ${x + 60} ${y + 156} ${x + 74} ${y + 120} Z`} stroke={cor.ambar} strokeWidth={4} {...traco(p(0.8 + k * 0.1, 0.6))} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 600 330" width="100%" style={{ overflow: "visible" }}>
      <path d="M300 300 L300 92" stroke={cor.marfim} strokeWidth={4} {...traco(p(0, 0.7))} />
      <path d="M236 304 L364 304" stroke={cor.marfim} strokeWidth={4} {...traco(p(0.1, 0.6))} />
      {/* o travessão se abre do centro para os dois lados */}
      <path d={`M300 92 L${bx(-190)} ${by(-190)}`} stroke={cor.ambar} strokeWidth={4.5} strokeLinecap="round" {...traco(p(0.35, 0.6))} />
      <path d={`M300 92 L${bx(190)} ${by(190)}`} stroke={cor.ambar} strokeWidth={4.5} strokeLinecap="round" {...traco(p(0.35, 0.6))} />
      <circle cx={300} cy={92} r={9} fill={cor.ambar} opacity={p(0.5, 0.3)} />
      {prato(-190, 0)}
      {prato(190, 1)}
    </svg>
  );
};

// ——— estrada: o caminho em perspectiva, as faixas do meio correndo para quem assiste;
// cada passo acende um marco mais perto do horizonte ———
const Estrada: React.FC<Props> = ({ t, inicio, passos }) => {
  const p = (d: number, dur = 0.8) => prog(t, inicio + d, dur, travelling);
  const fuga = { x: 300, y: 70 };
  const ponto = (u: number, lado: number) => {
    // u: 0 = perto (embaixo), 1 = horizonte; lado: −1 esquerda, 1 direita, 0 meio
    const y = 300 - (300 - fuga.y) * u;
    const meia = 250 * (1 - u) + 4 * u;
    return { x: fuga.x + lado * meia, y };
  };
  const anda = Math.max(0, t - inicio) * 0.55;
  const faixas = Array.from({ length: 7 }, (_, i) => {
    // posição em "profundidade" que corre para perto com o tempo (perspectiva: 1/(z))
    const z = ((i / 7 + 1 - (anda % 1) / 7) % 1) * 0.92 + 0.04;
    const u0 = z;
    const u1 = Math.min(0.98, z + 0.06 * (1 - z));
    const a = ponto(u0, 0);
    const b = ponto(u1, 0);
    return <path key={i} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={cor.ambar} strokeWidth={4 * (1 - u0) + 1.5} strokeLinecap="round" opacity={p(0.6, 0.6) * (1 - u0 * 0.7)} />;
  });
  const marcos = passos.map((em, i) => {
    const u = 0.25 + (0.6 * (i + 1)) / (passos.length + 1);
    const q = prog(t, em - 0.05, 0.6, travelling);
    const base = ponto(u, 1.18);
    const h = 70 * (1 - u) + 14;
    return (
      <g key={i} stroke={cor.ambarClaro} strokeWidth={3.5} strokeLinecap="round" opacity={q}>
        <path d={`M${base.x} ${base.y} L${base.x} ${base.y - h}`} {...traco(q)} />
        <circle cx={base.x} cy={base.y - h - 7} r={6 * (1 - u) + 3} fill={cor.ambar} stroke="none" />
      </g>
    );
  });
  const e0 = ponto(0, -1);
  const d0 = ponto(0, 1);
  return (
    <svg viewBox="0 0 600 310" width="100%" style={{ overflow: "visible" }}>
      <path d={`M40 ${fuga.y} L560 ${fuga.y}`} stroke={cor.marfimApagado} strokeWidth={3} {...traco(p(0, 1.0))} />
      <path d={`M${e0.x} ${e0.y} L${fuga.x - 4} ${fuga.y}`} stroke={cor.marfim} strokeWidth={4} {...traco(p(0.2, 0.9))} />
      <path d={`M${d0.x} ${d0.y} L${fuga.x + 4} ${fuga.y}`} stroke={cor.marfim} strokeWidth={4} {...traco(p(0.25, 0.9))} />
      {faixas}
      {marcos}
    </svg>
  );
};

// ——— lâmpada: se desenha apagada; passo 1 = acende (o filamento e os raios em âmbar) ———
const Lampada: React.FC<Props> = ({ t, inicio, passos }) => {
  const p = (d: number, dur = 0.8) => prog(t, inicio + d, dur, travelling);
  const acende = prog(t, passos[0] ?? inicio + 1.3, 0.7);
  const raios = [-150, -115, -80, -45, -10, 25].map((a) => a - 7.5);
  return (
    <svg viewBox="0 0 400 380" width="100%" style={{ overflow: "visible" }}>
      {/* o bulbo e a rosca */}
      <path
        d="M200 40 C130 40 92 92 92 148 C92 196 124 222 140 250 C150 268 152 282 152 296 L248 296 C248 282 250 268 260 250 C276 222 308 196 308 148 C308 92 270 40 200 40 Z"
        stroke={acende > 0.5 ? cor.ambar : cor.marfim}
        strokeWidth={4}
        {...traco(p(0, 1.1))}
      />
      {[312, 328, 344].map((y, i) => (
        <path key={y} d={`M${158 + i * 4} ${y} L${242 - i * 4} ${y}`} stroke={cor.marfim} strokeWidth={4} {...traco(p(0.5 + i * 0.1, 0.4))} />
      ))}
      <path d="M182 360 L218 360" stroke={cor.marfim} strokeWidth={4} {...traco(p(0.8, 0.3))} />
      {/* o filamento */}
      <path d="M170 296 L176 200 C182 178 196 178 200 196 C204 178 218 178 224 200 L230 296" stroke={acende > 0 ? cor.ambarClaro : cor.marfimApagado} strokeWidth={3.5} {...traco(p(0.6, 0.8))} />
      {/* os raios: aparecem quando acende */}
      {raios.map((a, i) => {
        const r = (a * Math.PI) / 180;
        const q = prog(t, (passos[0] ?? inicio + 1.3) + i * 0.05, 0.5);
        return (
          <path
            key={a}
            d={`M${200 + Math.cos(r) * 150} ${150 + Math.sin(r) * 150} L${200 + Math.cos(r) * 186} ${150 + Math.sin(r) * 186}`}
            stroke={cor.ambar}
            strokeWidth={4}
            {...traco(q)}
          />
        );
      })}
    </svg>
  );
};

// ——— calendário de destacar: as folhas viram e caem (cada passo arranca uma; sem passos, uma a cada ~0,8 s) ———
const Calendario: React.FC<Props> = ({ t, inicio, fim, passos }) => {
  const p = (d: number, dur = 0.8) => prog(t, inicio + d, dur, travelling);
  const instantes = passos.length ? passos : Array.from({ length: Math.max(1, Math.floor((fim - inicio - 1.2) / 0.8)) }, (_, i) => inicio + 1.1 + i * 0.8);
  const folha = (k: number, q: number) => {
    // q: 0 = no bloco, 1 = caiu
    const ang = -q * 38;
    const dy = q * q * 140;
    const dx = -q * 60;
    return (
      <g key={k} opacity={1 - Math.max(0, q - 0.55) / 0.45} transform={`translate(${dx} ${dy}) rotate(${ang} 92 96)`}>
        <rect x={92} y={96} width={216} height={214} rx={10} fill={cor.preto} stroke={cor.marfim} strokeWidth={4} />
        {[150, 190, 230, 270].map((y, i) => (
          <path key={y} d={`M${124} ${y} L${i % 2 ? 236 : 276} ${y}`} stroke={cor.marfimApagado} strokeWidth={3.5} strokeLinecap="round" />
        ))}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 400 370" width="100%" style={{ overflow: "visible" }}>
      {/* o bloco e a capa de cima com as argolas */}
      <rect x={92} y={96} width={216} height={214} rx={10} fill="none" stroke={cor.marfim} strokeWidth={4} {...(traco(p(0, 1.0)) as React.SVGProps<SVGRectElement>)} />
      {[150, 190, 230, 270].map((y, i) => (
        <path key={y} d={`M124 ${y} L${i % 2 ? 236 : 276} ${y}`} stroke={cor.marfimApagado} strokeWidth={3.5} strokeLinecap="round" {...traco(p(0.4 + i * 0.08, 0.5))} />
      ))}
      {instantes.map((em, k) => folha(k, prog(t, em, 0.9)))}
      <rect x={92} y={70} width={216} height={40} rx={8} fill={cor.preto} stroke={cor.ambar} strokeWidth={4} {...(traco(p(0.1, 0.8)) as React.SVGProps<SVGRectElement>)} />
      {[150, 250].map((x) => (
        <path key={x} d={`M${x} 56 L${x} 84`} stroke={cor.ambar} strokeWidth={5} strokeLinecap="round" {...traco(p(0.5, 0.4))} />
      ))}
    </svg>
  );
};

// ——— ampulheta: a areia escorre do começo ao fim do momento ———
const Ampulheta: React.FC<Props> = ({ t, inicio, fim }) => {
  const p = (d: number, dur = 0.8) => prog(t, inicio + d, dur, travelling);
  const escorre = interpolate(t, [inicio + 0.8, Math.max(inicio + 2, fim + 0.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // areia de cima (um triângulo que baixa) e de baixo (um monte que sobe)
  const topoAreia = 96 + 74 * escorre;
  const larguraCima = 76 * (1 - escorre);
  const monte = 52 * escorre;
  return (
    <svg viewBox="0 0 300 400" width="100%" style={{ overflow: "visible" }}>
      <path d="M60 40 L240 40" stroke={cor.ambar} strokeWidth={5} strokeLinecap="round" {...traco(p(0, 0.6))} />
      <path d="M60 360 L240 360" stroke={cor.ambar} strokeWidth={5} strokeLinecap="round" {...traco(p(0.1, 0.6))} />
      <path d="M86 40 C86 140 140 170 140 200 C140 230 86 260 86 360" stroke={cor.marfim} strokeWidth={4} fill="none" {...traco(p(0.2, 0.9))} />
      <path d="M214 40 C214 140 160 170 160 200 C160 230 214 260 214 360" stroke={cor.marfim} strokeWidth={4} fill="none" {...traco(p(0.25, 0.9))} />
      <g opacity={p(0.7, 0.5)} fill={cor.ambar} fillOpacity={0.35} stroke={cor.ambar} strokeWidth={3}>
        {larguraCima > 2 ? <path d={`M${150 - larguraCima} ${topoAreia} L${150 + larguraCima} ${topoAreia} L150 192 Z`} /> : null}
        {escorre > 0 && escorre < 1 ? <path d="M150 196 L150 352" strokeDasharray="6 8" strokeDashoffset={-t * 60} fill="none" /> : null}
        {monte > 1 ? <path d={`M${150 - 58} 352 Q150 ${352 - monte * 2} ${150 + 58} 352 Z`} /> : null}
      </g>
    </svg>
  );
};

export const DesenhoDaCartela: React.FC<{ d: Desenho; t: number; inicio: number; fim: number; hora?: string }> = ({ d, t, inicio, fim, hora }) => {
  const props: Props = { t, inicio: d.em ?? inicio, fim, passos: (d.passos ?? []).map((x) => x.em), hora: d.hora ?? hora };
  if (d.tipo === "sol") return <Sol {...props} />;
  if (d.tipo === "xicaras") return <Xicaras {...props} />;
  if (d.tipo === "relogio") return <Relogio {...props} />;
  if (d.tipo === "moedas") return <Moedas {...props} sentido={d.sentido} />;
  if (d.tipo === "balanca") return <Balanca {...props} />;
  if (d.tipo === "estrada") return <Estrada {...props} />;
  if (d.tipo === "lampada") return <Lampada {...props} />;
  if (d.tipo === "calendario") return <Calendario {...props} />;
  if (d.tipo === "ampulheta") return <Ampulheta {...props} />;
  return <Banco {...props} />;
};

// largura de cada desenho na cartela (px) — proporções pensadas para ler no celular
export const LARGURA_DO_DESENHO: Record<Desenho["tipo"], number> = {
  sol: 720,
  xicaras: 860,
  relogio: 440,
  banco: 820,
  moedas: 720,
  balanca: 720,
  estrada: 760,
  lampada: 400,
  calendario: 420,
  ampulheta: 300,
};

// proporção (largura ÷ altura) de cada desenho, para caber numa faixa de altura limitada (letreiro)
export const PROPORCAO_DO_DESENHO: Record<Desenho["tipo"], number> = {
  sol: 600 / 240,
  xicaras: 640 / 360,
  relogio: 1,
  banco: 640 / 340,
  moedas: 600 / 300,
  balanca: 600 / 330,
  estrada: 600 / 310,
  lampada: 400 / 380,
  calendario: 400 / 370,
  ampulheta: 300 / 400,
};
