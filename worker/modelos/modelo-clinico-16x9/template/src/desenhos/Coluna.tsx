// Coluna vertebral vista de lado (frente para a esquerda): vértebras e discos ao longo das curvas naturais.
// "curva" = postura ruim (cabeça para a frente, costas arredondadas, em vermelho); "alinha" = volta ao normal.
// Coordenadas em unidades do desenho (caixa 600 × 900).
import { limitar, misturarCor, prog, Traco } from "../anim";
import type { Acao } from "../plano";
import { cor } from "../tema";

const N = 15;
const TOPO = 70;
const BASE = 760;

// deslocamento horizontal da coluna ao longo da altura (s = 0 no topo, 1 embaixo)
const neutra = (s: number) => -30 * Math.cos(2.5 * Math.PI * s);
const ruim = (s: number) => neutra(s) + 78 * Math.sin(Math.PI * Math.min(1, s / 0.72)) - 120 * Math.pow(Math.max(0, 1 - s / 0.32), 2);

const ponto = (s: number, torto: number) => {
  const x = 300 + neutra(s) + (ruim(s) - neutra(s)) * torto;
  const y = TOPO + (BASE - TOPO) * s;
  return { x, y };
};

export const CAIXA_COLUNA = { x: 120, y: 24, w: 380, h: 880 };

export const ALVOS_COLUNA: Record<string, { x: number; y: number; dx: number; dy: number; s?: number }> = {
  cervical: { x: 300, y: 150, dx: 130, dy: -30, s: 0.12 },
  toracica: { x: 300, y: 360, dx: 130, dy: 0, s: 0.42 },
  lombar: { x: 300, y: 630, dx: 120, dy: 20, s: 0.8 },
  disco: { x: 300, y: 690, dx: -150, dy: 30, s: 0.89 },
};

const quando = (acoes: { em: number; acao: Acao }[], nome: Acao) => acoes.filter((a) => a.acao === nome).map((a) => a.em)[0];

// quanto a coluna está "torta" neste instante (0 = alinhada, 1 = postura ruim)
export const tortoNoTempo = (t: number, acoes: { em: number; acao: Acao }[]) => {
  const emCurva = quando(acoes, "curva");
  const emAlinha = quando(acoes, "alinha");
  const curva = emCurva !== undefined ? prog(t, emCurva, 0.9) : 0;
  const alinha = emAlinha !== undefined ? prog(t, emAlinha, 0.9) : 0;
  return limitar(curva - alinha);
};

// os alvos acompanham a coluna quando ela entorta
export const moverAlvoColuna = (nome: string, t: number, acoes: { em: number; acao: Acao }[]) => {
  const a = ALVOS_COLUNA[nome];
  if (!a || a.s === undefined) return a;
  const p = ponto(a.s, tortoNoTempo(t, acoes));
  return { ...a, x: p.x + (nome === "disco" ? -40 : 70), y: p.y };
};

export const Coluna: React.FC<{ t: number; de: number; acoes: { em: number; acao: Acao }[]; id: string }> = ({ t, de, acoes }) => {
  const torto = tortoNoTempo(t, acoes);
  const emAlinha = quando(acoes, "alinha");
  const alinhou = emAlinha !== undefined ? prog(t, emAlinha + 0.5, 0.6) : 0;
  // eixo de referência (prumo): linha tracejada vertical que mostra o alinhamento
  const prumo = prog(t, de, 0.8);
  const vertebras = Array.from({ length: N }, (_, i) => {
    const s = (i + 0.5) / N;
    const a = ponto(s - 0.01, torto);
    const b = ponto(s + 0.01, torto);
    const ang = (Math.atan2(b.x - a.x, b.y - a.y) * -180) / Math.PI;
    const c = ponto(s, torto);
    // tamanho cresce de cima para baixo (cervicais pequenas, lombares grandes)
    const w = 84 + 64 * s;
    const h = (BASE - TOPO) / N - 11;
    // o desvio pinta de vermelho as vértebras que saíram do lugar
    const desvio = Math.min(1, (Math.abs(ruim(s) - neutra(s)) / 70) * torto);
    return { s, c, ang, w, h, desvio, i };
  });
  return (
    <g>
      <Traco d={`M 300 ${TOPO - 40} L 300 ${BASE + 70}`} p={prumo} cor={misturarCor(cor.cinzaLinha, cor.azul, alinhou)} largura={3} tracejado="10 12" />
      {vertebras.map(({ c, ang, w, h, desvio, i }) => {
        const entra = prog(t, de + 0.1 + i * 0.045, 0.45);
        if (entra <= 0) return null;
        const contorno = misturarCor(cor.azul, cor.vermelho, desvio);
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${ang})`} opacity={entra}>
            {/* disco entre esta vértebra e a de baixo */}
            {i < N - 1 ? <rect x={-w * 0.42} y={h / 2 + 1} width={w * 0.84} height={9} rx={4.5} fill={misturarCor(cor.azulClaro, cor.vermelhoVeu, desvio)} /> : null}
            {/* processo espinhoso, para trás (direita) */}
            <path d={`M ${w / 2 - 4} ${-h * 0.25} L ${w / 2 + 44 + 14 * (i / N)} ${h * 0.12} L ${w / 2 - 4} ${h * 0.32} Z`} fill={cor.branco} stroke={contorno} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={misturarCor(cor.branco, "#FBEDEB", desvio)} stroke={contorno} strokeWidth={5.5} />
          </g>
        );
      })}
      {/* sacro */}
      <path
        d={`M ${ponto(1, torto).x - 58} ${BASE + 14} L ${ponto(1, torto).x + 58} ${BASE + 14} L ${ponto(1, torto).x + 10} ${BASE + 110} L ${ponto(1, torto).x - 20} ${BASE + 104} Z`}
        fill={cor.branco}
        stroke={cor.azul}
        strokeWidth={5.5}
        strokeLinejoin="round"
        opacity={prog(t, de + 0.8, 0.4)}
      />
    </g>
  );
};
