// Os números que ficam no rótulo depois que a lupa passa: no fim, o rótulo está todo anotado,
// como uma prancha de anatomia.
import { prog } from "../anim";
import { type Leitura, marcaDaVaga } from "../layout";
import type { Medidor } from "../medida";
import type { Plano } from "../plano";
import { cor, display, numerosAlinhados } from "../tema";

export const Marcas: React.FC<{ leitura: Leitura; plano: Plano; t: number; medir: Medidor; presenca: number }> = ({ leitura, plano, t, medir, presenca }) => {
  if (presenca <= 0.01) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: presenca }}>
      {leitura.ordem.map((vaga) => {
        const em = leitura.marcaEm[vaga];
        if (em === undefined) return null;
        const p = prog(t, em, 0.4);
        if (p <= 0) return null;
        const lugar = marcaDaVaga(vaga, plano.rotulo, medir);
        if (!lugar) return null;
        const r = 22 * (0.6 + 0.4 * p);
        return (
          <g key={vaga} opacity={Math.min(1, p * 2)}>
            <circle cx={lugar.x} cy={lugar.y} r={r} fill={cor.vinho} />
            <text x={lugar.x} y={lugar.y + 10.5} textAnchor="middle" fontFamily={display} fontSize={30} fill={cor.papel} style={numerosAlinhados}>
              {leitura.numero[vaga]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
