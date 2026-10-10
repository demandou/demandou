import { preciso, prog, saindo, Traco } from "../anim";
import { lin, ret } from "../desenho/geometria";
import { cor, traco } from "../tema";

// Folha de papel na altura do peito (layout "cheio"): desenrola de cima para baixo (o texto do topo
// aparece primeiro), a borda se desenha e marcas de corte aparecem nos cantos. Na saída, desce e apaga.
export const Cartao: React.FC<{
  t: number;
  de: number;
  fim: number;
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}> = ({ t, de, fim, x, y, w, h, children }) => {
  const abre = prog(t, de, 0.5, preciso);
  const fecha = saindo(t, fim, 0.25);
  if (abre <= 0.001 || fecha >= 0.999) return null;
  const pBorda = prog(t, de + 0.1, 0.6, preciso);
  const pMarcas = prog(t, de + 0.45, 0.35);
  const m = 14;
  const o = 10;
  const cantos = [
    lin(x - o - m, y - o, x - o, y - o) + lin(x - o, y - o - m, x - o, y - o),
    lin(x + w + o, y - o, x + w + o + m, y - o) + lin(x + w + o, y - o - m, x + w + o, y - o),
    lin(x - o - m, y + h + o, x - o, y + h + o) + lin(x - o, y + h + o, x - o, y + h + o + m),
    lin(x + w + o, y + h + o, x + w + o + m, y + h + o) + lin(x + w + o, y + h + o, x + w + o, y + h + o + m),
  ];
  // entrada: a borda de baixo do recorte desce até revelar a folha · saída: desce 40 px apagando
  const corte = (1 - abre) * (h + 60);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        clipPath: abre < 1 ? `inset(0 0 ${1920 - (y + h + 30) + corte}px 0)` : undefined,
        translate: `0 ${(1 - abre) * -16 + fecha * 40}px`,
        opacity: 1 - fecha,
      }}
    >
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: cor.papel }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={ret(x, y, w, h)} p={pBorda} cor={cor.grafite} largura={traco.medio} />
        {cantos.map((d, i) => (
          <path key={i} d={d} stroke={cor.grafite} strokeWidth={traco.fino} fill="none" opacity={pMarcas * 0.8} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>{children}</div>
    </div>
  );
};
