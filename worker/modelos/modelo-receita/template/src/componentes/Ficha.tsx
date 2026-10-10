import { cor, FICHA, H } from "../tema";

// A ficha de receita: papel creme de leite com pauta fina e a margem pistache, sobre a mesa cacau.
export const Ficha: React.FC<{ y: number }> = ({ y }) => {
  if (y >= H + 20) return null;
  const altura = H - y + 120;
  return (
    <div
      style={{
        position: "absolute",
        left: FICHA.x,
        top: y,
        width: FICHA.w,
        height: altura,
        borderRadius: FICHA.raio,
        background: cor.creme,
        boxShadow: "0 -6px 40px rgba(20,12,10,0.28), 0 -1px 0 rgba(255,255,255,0.4) inset",
        overflow: "hidden",
      }}
    >
      {/* pauta: uma linha a cada 66 px, presa ao papel (sobe junto com a ficha) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 132,
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 64px, ${cor.pauta} 64px, ${cor.pauta} 66px)`,
        }}
      />
      {/* margem da ficha */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 34, width: 3, background: cor.pistache, opacity: 0.75 }} />
      {/* furo de fichário e borda de cima */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 10, background: "rgba(58,38,33,0.05)" }} />
    </div>
  );
};

// Caminho de retângulo arredondado (horário ou anti-horário), para recortes com regra "nonzero"
export const retArredondado = (x: number, y: number, w: number, h: number, r: number, horario = true) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (horario) {
    return `M${x + rr} ${y} L${x + w - rr} ${y} A${rr} ${rr} 0 0 1 ${x + w} ${y + rr} L${x + w} ${y + h - rr} A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h} L${x + rr} ${y + h} A${rr} ${rr} 0 0 1 ${x} ${y + h - rr} L${x} ${y + rr} A${rr} ${rr} 0 0 1 ${x + rr} ${y} Z`;
  }
  return `M${x + rr} ${y} A${rr} ${rr} 0 0 0 ${x} ${y + rr} L${x} ${y + h - rr} A${rr} ${rr} 0 0 0 ${x + rr} ${y + h} L${x + w - rr} ${y + h} A${rr} ${rr} 0 0 0 ${x + w} ${y + h - rr} L${x + w} ${y + rr} A${rr} ${rr} 0 0 0 ${x + w - rr} ${y} Z`;
};
