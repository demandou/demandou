// Corpo inteiro de frente, como um manequim articulado de consultório (cápsulas e articulações).
// "destaca" (com alvo) = a região acende em vermelho e pulsa (dor, lesão, ponto de atenção);
// "alivia" (com alvo) = a mesma região fica azul e para de pulsar.
// Coordenadas em unidades do desenho (caixa 600 × 1000).
import { limitar, misturarCor, prog, Traco } from "../anim";
import type { Acao } from "../plano";
import { cor } from "../tema";

export const CAIXA_CORPO = { x: 100, y: 20, w: 400, h: 990 };

export const ALVOS_CORPO: Record<string, { x: number; y: number; dx: number; dy: number }> = {
  cabeca: { x: 300, y: 100, dx: 150, dy: -20 },
  pescoco: { x: 300, y: 196, dx: -150, dy: -10 },
  ombro: { x: 402, y: 250, dx: 110, dy: -40 },
  peito: { x: 300, y: 320, dx: -170, dy: 0 },
  cotovelo: { x: 432, y: 420, dx: 100, dy: 0 },
  estomago: { x: 300, y: 450, dx: -170, dy: 0 },
  punho: { x: 444, y: 580, dx: 90, dy: 20 },
  lombar: { x: 300, y: 520, dx: -170, dy: 20 },
  quadril: { x: 342, y: 592, dx: 150, dy: 0 },
  joelho: { x: 350, y: 790, dx: 130, dy: 0 },
  tornozelo: { x: 354, y: 958, dx: 110, dy: -10 },
};

// nomes do dia a dia para os mesmos lugares
const APELIDOS: Record<string, string> = {
  pe: "tornozelo",
  pes: "tornozelo",
  perna: "joelho",
  pernas: "joelho",
  mao: "punho",
  maos: "punho",
  braco: "cotovelo",
  coracao: "peito",
  barriga: "estomago",
  costas: "lombar",
  coluna: "lombar",
  quadris: "quadril",
  ombros: "ombro",
};
for (const [apelido, real] of Object.entries(APELIDOS)) ALVOS_CORPO[apelido] = ALVOS_CORPO[real];

type Ponto = [number, number];
const OSSOS: [Ponto, Ponto, number][] = [
  // braços
  [[200, 250], [170, 420], 56],
  [[400, 250], [430, 420], 56],
  [[170, 420], [158, 580], 48],
  [[430, 420], [442, 580], 48],
  // pernas
  [[258, 600], [250, 790], 76],
  [[342, 600], [350, 790], 76],
  [[250, 790], [246, 958], 62],
  [[350, 790], [354, 958], 62],
  // pescoço
  [[300, 170], [300, 222], 50],
];
const JUNTAS: Ponto[] = [
  [200, 250],
  [400, 250],
  [170, 420],
  [430, 420],
  [158, 580],
  [442, 580],
  [258, 600],
  [342, 600],
  [250, 790],
  [350, 790],
  [246, 958],
  [354, 958],
];
const TRONCO = "M 204 218 L 396 218 Q 430 220 426 256 L 398 522 Q 394 570 358 574 L 242 574 Q 206 570 202 522 L 174 256 Q 170 220 204 218 Z";

export const Corpo: React.FC<{ t: number; de: number; acoes: { em: number; acao: Acao; alvo?: string }[]; id: string }> = ({ t, de, acoes }) => {
  const entra = prog(t, de, 0.8);
  const destaques = acoes.filter((a) => (a.acao === "destaca" || a.acao === "alivia" || a.acao === "acende") && a.alvo && ALVOS_CORPO[a.alvo]);
  // alvos: cada um guarda quando acendeu (vermelho), quando aliviou e quando ganhou azul direto ("acende")
  const regioes = [...new Set(destaques.map((d) => d.alvo as string))].map((alvo) => {
    const destaca = destaques.find((d) => d.alvo === alvo && d.acao === "destaca")?.em;
    const azul = destaques.find((d) => d.alvo === alvo && d.acao === "acende")?.em;
    const alivia = destaques.find((d) => d.alvo === alvo && d.acao === "alivia")?.em ?? (destaca === undefined ? azul : undefined);
    return { alvo, acende: destaca ?? azul, alivia, soAzul: destaca === undefined && azul !== undefined };
  });
  return (
    <g>
      {/* cápsulas: contorno azul por baixo, miolo branco por cima */}
      {OSSOS.map(([a, b, w], i) => {
        const p = prog(t, de + 0.1 + i * 0.05, 0.5);
        const d = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`;
        return (
          <g key={i} opacity={limitar(p * 2)}>
            <Traco d={d} p={p} cor={cor.azul} largura={w + 11} />
            <Traco d={d} p={p} cor={cor.branco} largura={w} />
          </g>
        );
      })}
      <path d={TRONCO} fill={cor.branco} stroke={cor.azul} strokeWidth={5.5} strokeLinejoin="round" opacity={entra} />
      <Traco d="M 300 240 L 300 548" p={prog(t, de + 0.4, 0.6)} cor={cor.cinzaClaro} largura={3} />
      <ellipse cx={300} cy={104} rx={58} ry={70} fill={cor.branco} stroke={cor.azul} strokeWidth={5.5} opacity={entra} />
      {JUNTAS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={14} fill={cor.azulClaro} stroke={cor.azul} strokeWidth={4} opacity={prog(t, de + 0.5 + i * 0.03, 0.3)} />
      ))}
      {/* regiões em destaque */}
      {regioes.map(({ alvo, acende, alivia, soAzul }) => {
        if (acende === undefined && alivia === undefined) return null;
        const a = ALVOS_CORPO[alvo];
        const liga = prog(t, acende ?? alivia ?? 0, 0.5);
        const calma = soAzul ? 1 : alivia !== undefined ? prog(t, alivia, 0.6) : 0;
        const c = misturarCor(cor.vermelho, cor.azul, calma);
        const fase = ((t - (acende ?? 0)) * 1.2) % 1;
        return (
          <g key={alvo} opacity={liga}>
            <circle cx={a.x} cy={a.y} r={62} fill={misturarCor(cor.vermelhoVeu, cor.azulClaro, calma)} opacity={0.85} />
            <circle cx={a.x} cy={a.y} r={62} fill="none" stroke={c} strokeWidth={5} />
            {calma < 1 ? (
              <circle cx={a.x} cy={a.y} r={62 + 50 * fase} fill="none" stroke={c} strokeWidth={3} opacity={(1 - fase) * (1 - calma)} />
            ) : null}
            <circle cx={a.x} cy={a.y} r={12} fill={c} />
          </g>
        );
      })}
    </g>
  );
};
