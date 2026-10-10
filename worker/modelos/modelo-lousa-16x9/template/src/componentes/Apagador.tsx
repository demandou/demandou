// O apagador de feltro que passa na troca de página, com um pouco de pó de giz caindo atrás dele.
import { prog, vaiVem } from "../anim";
import { pontoNoCaminho } from "../giz/glifos";
import { caminhoDoApagador, DUR_APAGAR, type Pagina } from "../paginas";
import { cor, H, W } from "../tema";

const aleatorio = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Objeto: React.FC<{ x: number; y: number; giro: number; entra: number }> = ({ x, y, giro, entra }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${giro.toFixed(2)}) scale(${0.92 + 0.08 * entra})`} opacity={entra}>
    {/* sombra curta na lousa */}
    <rect x={-112} y={-30} width={236} height={92} rx={14} fill="rgba(0,0,0,0.32)" transform="translate(8 12)" />
    {/* feltro */}
    <rect x={-118} y={10} width={236} height={34} rx={6} fill="#4B514D" />
    <rect x={-118} y={30} width={236} height={14} rx={6} fill="rgba(238,237,230,0.30)" />
    {[-90, -60, -30, 0, 30, 60, 90].map((dx) => (
      <line key={dx} x1={dx} y1={14} x2={dx} y2={40} stroke="rgba(0,0,0,0.18)" strokeWidth={2} />
    ))}
    {/* cabo */}
    <rect x={-114} y={-38} width={228} height={52} rx={13} fill="#D9D3C5" />
    <rect x={-114} y={2} width={228} height={12} rx={6} fill="#B9B2A3" />
    <rect x={-96} y={-30} width={192} height={6} rx={3} fill="rgba(255,255,255,0.35)" />
  </g>
);

export const Apagadores: React.FC<{ paginas: Pagina[]; t: number }> = ({ paginas, t }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {paginas.map((pg, i) => {
      if (pg.apagaEm === undefined) return null;
      const de = pg.apagaEm;
      if (t < de - 0.2 || t > de + DUR_APAGAR + 1) return null;
      const { d } = caminhoDoApagador(pg.area, pg.caixas);
      const pa = prog(t, de, DUR_APAGAR, vaiVem);
      // o apagador chega um instante antes e sai logo depois
      const entra = Math.min(prog(t, de - 0.12, 0.14), 1 - prog(t, de + DUR_APAGAR - 0.04, 0.14));
      const [x0, y] = pontoNoCaminho(d, pa);
      // chega deslizando pela esquerda e sai pela direita, em vez de surgir parado
      const x = x0 - 160 * (1 - prog(t, de - 0.14, 0.14)) + 160 * prog(t, de + DUR_APAGAR - 0.02, 0.16);
      const [x2, y2] = pontoNoCaminho(d, Math.min(1, pa + 0.02));
      const giro = Math.sign(y2 - y) * 4 + Math.sign(x2 - x) * 1.5;
      // pó de giz: grãos soltos que caem e somem
      const graos = Array.from({ length: 18 }, (_, k) => {
        const f = (k + 0.5) / 18;
        const nasce = de + DUR_APAGAR * f;
        const idade = t - nasce;
        if (idade < 0 || idade > 0.95) return null;
        const [px, py] = pontoNoCaminho(d, vaiVem(f));
        const gx = px + (aleatorio(k + i * 31) - 0.5) * 210 + (aleatorio(k * 7 + 3) - 0.5) * 50 * idade;
        const gy = py + 46 + 60 * idade + 300 * idade * idade;
        const r = 1.8 + aleatorio(k * 13 + i) * 2.8;
        return <circle key={k} cx={gx} cy={gy} r={r} fill={cor.giz} opacity={0.55 * (1 - idade / 0.95)} />;
      });
      return (
        <g key={i}>
          {graos}
          {entra > 0.01 ? <Objeto x={x} y={y} giro={giro} entra={entra} /> : null}
        </g>
      );
    })}
  </svg>
);
