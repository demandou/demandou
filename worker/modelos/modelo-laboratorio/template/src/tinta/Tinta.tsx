// Peças de desenho do caderno: traço de caneta que se desenha, tracejado, seta, cota (medida),
// molécula, e as definições comuns (tremor da mão, hachura de lápis de cor).
import { limitar } from "../anim";
import { cor } from "../tema";

export type Ponto = { x: number; y: number };

// Traço de caneta revelado do começo ao fim (p: 0 → 1)
export const Traco: React.FC<{
  d: string;
  p: number;
  cor?: string;
  largura?: number;
  opacidade?: number;
  preenchimento?: string;
  filtro?: string;
}> = ({ d, p, cor: c = cor.tinta, largura = 5, opacidade = 1, preenchimento, filtro }) => {
  if (p <= 0.001) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill={preenchimento ?? "none"}
      stroke={c}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={p >= 0.999 ? undefined : "1 1"}
      strokeDashoffset={p >= 0.999 ? undefined : 1 - p}
      opacity={opacidade}
      filter={filtro}
    />
  );
};

// Tracejado revelado do começo ao fim (a máscara é o traço cheio)
export const Tracejado: React.FC<{
  id: string;
  d: string;
  p: number;
  cor?: string;
  largura?: number;
  tracos?: string;
  opacidade?: number;
}> = ({ id, d, p, cor: c = cor.tinta, largura = 4, tracos = "14 12", opacidade = 1 }) => {
  if (p <= 0.001) return null;
  return (
    <g opacity={opacidade}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={largura + 8} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={c} strokeWidth={largura} strokeLinecap="round" strokeDasharray={tracos} mask={`url(#${id})`} />
    </g>
  );
};

// Esboço a lápis: o que ainda vai ser desenhado (cinza, tracejado curto, inteiro)
export const Esboco: React.FC<{ d: string; opacidade?: number; largura?: number; preenchimento?: string }> = ({
  d,
  opacidade = 1,
  largura = 3,
  preenchimento,
}) =>
  opacidade <= 0.01 ? null : (
    <path
      d={d}
      fill={preenchimento ?? "none"}
      stroke={cor.lapis}
      strokeWidth={largura}
      strokeDasharray="9 8"
      strokeLinecap="round"
      opacity={opacidade}
    />
  );

// Ponta de seta (duas perninhas) no ponto `fim`, apontando na direção `de` → `fim`
export const pontaDeSeta = (de: Ponto, fim: Ponto, tamanho = 22) => {
  const a = Math.atan2(fim.y - de.y, fim.x - de.x);
  const abre = 0.5;
  const p1 = { x: fim.x - tamanho * Math.cos(a - abre), y: fim.y - tamanho * Math.sin(a - abre) };
  const p2 = { x: fim.x - tamanho * Math.cos(a + abre), y: fim.y - tamanho * Math.sin(a + abre) };
  return `M ${p1.x} ${p1.y} L ${fim.x} ${fim.y} L ${p2.x} ${p2.y}`;
};

// Seta à mão: curva de `de` até `ate` (curvatura em fração da distância; + para um lado, − para o outro)
export const Seta: React.FC<{
  de: Ponto;
  ate: Ponto;
  p: number;
  curva?: number;
  cor?: string;
  largura?: number;
  ponta?: number;
  opacidade?: number;
}> = ({ de, ate, p, curva = 0.2, cor: c = cor.tinta, largura = 4.5, ponta = 22, opacidade = 1 }) => {
  if (p <= 0.001) return null;
  const mx = (de.x + ate.x) / 2;
  const my = (de.y + ate.y) / 2;
  const dx = ate.x - de.x;
  const dy = ate.y - de.y;
  const ctrl = { x: mx - dy * curva, y: my + dx * curva };
  const d = `M ${de.x} ${de.y} Q ${ctrl.x} ${ctrl.y} ${ate.x} ${ate.y}`;
  const pc = limitar((p - 0.78) / 0.22);
  return (
    <g opacity={opacidade}>
      <Traco d={d} p={limitar(p / 0.82)} cor={c} largura={largura} />
      {pc > 0 ? <Traco d={pontaDeSeta(ctrl, ate, ponta)} p={pc} cor={c} largura={largura} /> : null}
    </g>
  );
};

// Cota: linha de medida com as duas pontas marcadas (como nas figuras de física)
export const Cota: React.FC<{ de: Ponto; ate: Ponto; p: number; cor?: string; largura?: number; perna?: number }> = ({
  de,
  ate,
  p,
  cor: c = cor.tinta,
  largura = 4,
  perna = 18,
}) => {
  if (p <= 0.001) return null;
  const a = Math.atan2(ate.y - de.y, ate.x - de.x);
  const nx = -Math.sin(a) * perna;
  const ny = Math.cos(a) * perna;
  const fim = { x: de.x + (ate.x - de.x) * p, y: de.y + (ate.y - de.y) * p };
  return (
    <g>
      <path d={`M ${de.x - nx} ${de.y - ny} L ${de.x + nx} ${de.y + ny}`} stroke={c} strokeWidth={largura} strokeLinecap="round" />
      <path d={`M ${de.x} ${de.y} L ${fim.x} ${fim.y}`} stroke={c} strokeWidth={largura} strokeLinecap="round" />
      {p > 0.97 ? <path d={`M ${ate.x - nx} ${ate.y - ny} L ${ate.x + nx} ${ate.y + ny}`} stroke={c} strokeWidth={largura} strokeLinecap="round" /> : null}
    </g>
  );
};

// Molécula de ar (N₂, O₂): duas bolinhas coladas. p: 0 → 1 aparece (cresce do centro)
export const Molecula: React.FC<{ x: number; y: number; p: number; r?: number; angulo?: number; esboco?: boolean; acesa?: string }> = ({
  x,
  y,
  p,
  r = 14,
  angulo = 20,
  esboco = false,
  acesa,
}) => {
  if (p <= 0.001) return null;
  const a = (angulo * Math.PI) / 180;
  const dx = Math.cos(a) * r * 0.78;
  const dy = Math.sin(a) * r * 0.78;
  const s = esboco ? 1 : 0.4 + 0.6 * p;
  const estilo = esboco
    ? { fill: "none", stroke: cor.lapis, strokeWidth: 2.5, strokeDasharray: "5 5" }
    : { fill: acesa ?? cor.papelClaro, stroke: cor.tinta, strokeWidth: 4 };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={esboco ? p : 1}>
      <circle cx={-dx} cy={-dy} r={r} {...estilo} />
      <circle cx={dx} cy={dy} r={r} {...estilo} />
    </g>
  );
};

// Definições comuns de um <svg> de figura: tremor de mão (o traço não sai perfeito) e hachuras.
export const Definicoes: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={`${id}-mao`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="ruido" />
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <pattern id={`${id}-hachura`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="12" stroke={cor.tinta} strokeWidth="2.2" opacity="0.32" />
    </pattern>
    <pattern id={`${id}-lapis`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-52)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="#FFFFFF" strokeWidth="2" opacity="0.22" />
    </pattern>
  </defs>
);

// Caminho de um círculo (para desenhar com Traco), começando no ângulo `inicio` (graus)
export const circulo = (cx: number, cy: number, r: number, inicio = -100, voltas = 1.04) => {
  const passos = 48;
  const pts: string[] = [];
  for (let i = 0; i <= passos; i++) {
    const a = ((inicio + (360 * voltas * i) / passos) * Math.PI) / 180;
    // a mão não fecha o círculo perfeito: o raio varia um tiquinho
    const rr = r * (1 + 0.012 * Math.sin(i * 0.9));
    pts.push(`${i === 0 ? "M" : "L"} ${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};
