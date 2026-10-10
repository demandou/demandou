// Barra do dia: uma faixa de céu no alto da tela, com o sol andando num arco da manhã ao fim do dia.
// O caminho do sol é pontilhado a lápis e ganha tinta por onde ele passa (a mesma ideia da rota).
// Os rótulos embaixo acendem conforme a hora muda; no último, o sol se põe atrás do horizonte.
import { limitar, misturarCor } from "../anim";
import { cor, RELOGIO, sans } from "../tema";

const CEU = [
  { topo: "#D7E8F1", base: "#F4EEDF" },
  { topo: "#B9D8EC", base: "#E7F0F3" },
  { topo: "#EBC79E", base: "#F7E3C5" },
];

// silhueta baixa de telhados e uma torre, ao longo do horizonte (fixa, sem acaso por quadro)
const casario = (x0: number, base: number, w: number) => {
  const alturas = [10, 16, 12, 20, 14, 9, 18, 26, 13, 11, 17, 22, 12, 15, 10, 19, 14, 24, 11, 16, 13, 9, 18, 12];
  let d = `M${x0} ${base}`;
  let x = x0;
  let i = 0;
  while (x < x0 + w) {
    const largura = 26 + ((i * 7) % 3) * 8;
    const alto = alturas[i % alturas.length];
    d += ` V${base - alto} l${largura / 2} ${-7} l${largura / 2} 7`;
    x += largura;
    i++;
  }
  return `${d} V${base} Z`;
};

const FONTE_ROTULO = 38;

export const Relogio: React.FC<{
  rotulos: string[];
  posicao: number;
  // posição da etiqueta do rótulo ativo (anda mais rápido que o sol)
  etiqueta: number;
  poente: number;
  aceso: number;
  // 0→1 entrada da barra; 1→0 saída
  presenca: number;
}> = ({ rotulos, posicao, etiqueta, poente, aceso, presenca }) => {
  const { x, y, w, h, rotulosY } = RELOGIO;
  const n = Math.max(1, rotulos.length);
  const xs = rotulos.map((_, i) => x + (w * (i + 0.5)) / n);
  const frac = n > 1 ? posicao / (n - 1) : 0;
  // céu: mistura entre os tons conforme a posição do sol
  const ceuDe = (k: number) => {
    const i = Math.min(CEU.length - 2, Math.floor(k * (CEU.length - 1)));
    const f = k * (CEU.length - 1) - i;
    return { topo: misturarCor(CEU[i].topo, CEU[i + 1].topo, f), base: misturarCor(CEU[i].base, CEU[i + 1].base, f) };
  };
  const ceu = ceuDe(limitar(frac));
  // arco do sol: baixo nas pontas, alto no meio
  const sx = (k: number) => xs[0] + (xs[n - 1] - xs[0]) * k;
  const sy = (k: number) => y + h - 22 - Math.sin(Math.PI * (0.12 + 0.76 * k)) * (h - 48);
  const amostras = Array.from({ length: 41 }, (_, i) => i / 40);
  const arco = amostras.map((k, i) => `${i ? "L" : "M"}${sx(k).toFixed(1)} ${sy(k).toFixed(1)}`).join(" ");
  const feito = amostras.filter((k) => k <= frac).map((k, i) => `${i ? "L" : "M"}${sx(k).toFixed(1)} ${sy(k).toFixed(1)}`).join(" ");
  const solX = sx(limitar(frac));
  const horizonte = y + h - 14;
  // no poente o sol desce até o horizonte e fica pela metade
  const solY = sy(limitar(frac)) + (horizonte - 8 - sy(limitar(frac))) * poente;
  const corSol = misturarCor(cor.sol, cor.solFundo, Math.max(limitar(frac * 1.4 - 0.4), poente));
  const desce = (1 - presenca) * -60;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 380, opacity: presenca, translate: `0 ${desce}px` }}>
      <svg width={1080} height={380} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="ceu-dia" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ceu.topo} />
            <stop offset="1" stopColor={ceu.base} />
          </linearGradient>
          <clipPath id="janela-dia">
            <rect x={x} y={y} width={w} height={h} rx={22} />
          </clipPath>
        </defs>
        <rect x={x} y={y} width={w} height={h} rx={22} fill="url(#ceu-dia)" />
        <g clipPath="url(#janela-dia)">
          <path d={arco} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" />
          <path d={feito} fill="none" stroke={cor.solFundo} strokeWidth={4} strokeDasharray="0.1 12" strokeLinecap="round" opacity={0.85 * aceso} />
          <g opacity={aceso}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={solX + Math.cos(a) * 30}
                  y1={solY + Math.sin(a) * 30}
                  x2={solX + Math.cos(a) * 40}
                  y2={solY + Math.sin(a) * 40}
                  stroke={corSol}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={1 - poente}
                />
              );
            })}
            <circle cx={solX} cy={solY} r={22} fill={corSol} />
          </g>
          {/* horizonte: o casario da cidade em silhueta */}
          <path d={casario(x, horizonte, w)} fill={misturarCor("#C9D6DC", "#D9B58C", limitar(frac * 1.2 - 0.2))} />
          <rect x={x} y={horizonte} width={w} height={14} fill={misturarCor("#CFE0EA", "#E9C9A0", limitar(frac * 1.2 - 0.2))} />
          <line x1={x} y1={horizonte} x2={x + w} y2={horizonte} stroke={cor.azulejo} strokeOpacity={0.5} strokeWidth={2.5} />
        </g>
        <rect x={x} y={y} width={w} height={h} rx={22} fill="none" stroke={cor.azulejo} strokeOpacity={0.35} strokeWidth={2} />
        {/* marcas sob cada rótulo */}
        {xs.map((cx, i) => {
          const ativo = limitar(1 - Math.abs(posicao - i) * 1.6) * aceso;
          return <circle key={i} cx={cx} cy={y + h + 2} r={6 + 3 * ativo} fill={misturarCor(cor.papel, cor.azulejo, ativo)} stroke={cor.azulejo} strokeWidth={2.5} />;
        })}
      </svg>
      {/* um só elemento anda: a etiqueta azulejo desliza com o sol de um rótulo para o outro */}
      {(() => {
        const larguraDe = (r: string) => r.length * FONTE_ROTULO * 0.74 + 44;
        const i0 = Math.max(0, Math.min(n - 1, Math.floor(etiqueta)));
        const i1 = Math.min(n - 1, i0 + 1);
        const f = limitar(etiqueta - i0);
        const cx = xs[i0] + (xs[i1] - xs[i0]) * f;
        const w = larguraDe(rotulos[i0]) + (larguraDe(rotulos[i1]) - larguraDe(rotulos[i0])) * f;
        return (
          <div
            style={{
              position: "absolute",
              left: cx - w / 2,
              width: w,
              top: rotulosY - 2,
              height: 54,
              borderRadius: 27,
              background: cor.azulejo,
              opacity: aceso,
            }}
          />
        );
      })()}
      {rotulos.map((r, i) => {
        const ativo = limitar(1 - Math.abs(etiqueta - i) * 2.2) * aceso;
        const passado = i < etiqueta - 0.5;
        return (
          <div
            key={r}
            style={{
              position: "absolute",
              left: xs[i] - 180,
              width: 360,
              top: rotulosY - 2,
              height: 54,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: sans,
              fontWeight: 600,
              fontSize: FONTE_ROTULO,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: misturarCor(passado ? "#7A7262" : cor.lapis, cor.papel, ativo),
            }}
          >
            {r}
          </div>
        );
      })}
    </div>
  );
};
