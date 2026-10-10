// A parede do hall: onde ficam os blocos de parede (lista, passos, número, comparação, gráfico),
// acima da porta de baixo. Entram e saem deslizando de fora da tela junto com a troca da pessoa
// (mesma curva e duração): o que sai e o que entra andam para o mesmo lado, como a câmera passando
// pelo hall. Os dois nunca se sobrepõem e nada esmaece.
import { prog, troca } from "../anim";
import { foraDaTela, type Movimento, TROCA } from "../layout";

export type Area = { x: number; y: number; w: number; h: number };

export const NaParede: React.FC<{
  area: Area;
  t: number;
  entra: number;
  sai: number;
  movimento: { entra: Movimento; sai: Movimento };
  children: React.ReactNode;
}> = ({ area, t, entra, sai, movimento, children }) => {
  const pEntra = prog(t, entra, TROCA, troca);
  const s = prog(t, sai, TROCA, troca);
  if (t < entra - 0.01 || s >= 1) return null;
  const fora = foraDaTela(area);
  const dxEntra = movimento.entra === "direita" ? fora.esquerda : fora.direita;
  const dxSai = movimento.sai === "direita" ? fora.direita : fora.esquerda;
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.w,
        height: area.h,
        translate: `${(1 - pEntra) * dxEntra + s * dxSai}px 0px`,
      }}
    >
      {children}
    </div>
  );
};

// Balanço lento e contínuo de uma peça pendurada parada (graus): a parede nunca fica morta
export const respiro = (t: number, fase = 0, amplitude = 0.45) => amplitude * Math.sin((2 * Math.PI * t) / 3.4 + fase);
