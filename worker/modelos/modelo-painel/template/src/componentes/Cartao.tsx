import { prog, saindo, useTempo } from "../anim";
import { cor } from "../tema";

// Zona dos componentes de quadro cheio: abaixo do queixo, com as margens do painel.
export type Zona = { esquerda: number; direita: number; topo: number; altura: number };

// Cartão escuro sobre o vídeo, como um widget do painel: abre da esquerda e sai subindo de leve.
export const Cartao: React.FC<{
  de: number;
  ate: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
  tracejado?: boolean;
}> = ({ de, ate, style, children, tracejado }) => {
  const t = useTempo();
  const p = prog(t, de, 0.5);
  const s = saindo(t, ate, 0.28);
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 28,
        background: tracejado ? "rgba(10,18,15,0.22)" : cor.cartao,
        border: `2px ${tracejado ? "dashed" : "solid"} ${tracejado ? cor.linhaForte : cor.linha}`,
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0 round 28px)`,
        opacity: (1 - s) * Math.min(1, p * 4),
        translate: `0 ${-12 * s}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
