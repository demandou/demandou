import { cor, sans } from "../tema";

// Peças do mostrador que gira em volta da lupa do centro (cronômetro, número, pizza).

// arco de circunferência a partir do topo (0 = 12 horas), sentido horário, em frações da volta
export const arco = (cx: number, cy: number, r: number, f0: number, f1: number) => {
  const f = Math.min(f1, f0 + 0.9999);
  const ponto = (x: number) => {
    const a = x * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const [x0, y0] = ponto(f0);
  const [x1, y1] = ponto(f);
  const grande = f - f0 > 0.5 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1}`;
};

// ponto na circunferência na fração `f` da volta
export const naVolta = (cx: number, cy: number, r: number, f: number) => {
  const a = f * Math.PI * 2 - Math.PI / 2;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

// Trilho cinza e a graduação (60 marcas, uma a cada "segundo" da volta), que se montam com `monta` (0–1)
export const Graduacao: React.FC<{ cx: number; cy: number; R: number; monta: number }> = ({ cx, cy, R, monta }) => (
  <>
    <path d={arco(cx, cy, R, 0, monta)} fill="none" stroke={cor.cinzaClaro} strokeWidth={18} strokeLinecap="round" />
    {Array.from({ length: 60 }, (_, i) => {
      if (i / 60 > monta) return null;
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const longo = i % 5 === 0;
      const r1 = R + 24;
      const r2 = R + (longo ? 46 : 36);
      return (
        <line
          key={i}
          x1={cx + Math.cos(a) * r1}
          y1={cy + Math.sin(a) * r1}
          x2={cx + Math.cos(a) * r2}
          y2={cy + Math.sin(a) * r2}
          stroke={longo ? cor.cinza : cor.cinzaLinha}
          strokeWidth={longo ? 3.5 : 2.2}
          strokeLinecap="round"
        />
      );
    })}
  </>
);

// Etiqueta "ilustrativo": a forma mostra a ideia, sem número dito
export const Ilustrativo: React.FC<{ x: number; y: number; p: number; alinhar?: "esquerda" | "centro" | "direita" }> = ({ x, y, p, alinhar = "esquerda" }) => {
  const w = 236;
  const left = alinhar === "centro" ? x - w / 2 : alinhar === "direita" ? x - w : x;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y,
        width: w,
        height: 50,
        borderRadius: 25,
        boxShadow: `inset 0 0 0 2.5px ${cor.cinzaLinha}`,
        background: cor.branco,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: sans,
        opacity: p,
      }}
    >
      <svg width={18} height={18}>
        <circle cx={9} cy={9} r={7} fill="none" stroke={cor.cinza} strokeWidth={2.5} strokeDasharray="2 4" />
      </svg>
      <span style={{ fontWeight: 600, fontSize: 30, letterSpacing: "0.08em", color: cor.cinza, textTransform: "uppercase" }}>ilustrativo</span>
    </div>
  );
};
