// Uma chave de latão (vista de frente): cabeça com furo, haste e segredo.
import { cor } from "../tema";

export const Chave: React.FC<{ largura?: number; esboco?: number; style?: React.CSSProperties }> = ({ largura = 58, esboco = 0, style }) => {
  const s = largura / 58;
  const lapis = esboco > 0.5;
  return (
    <svg width={58 * s} height={172 * s} viewBox="0 0 58 172" style={{ position: "absolute", overflow: "visible", ...style }}>
      <g opacity={lapis ? 0.9 : 1}>
        {/* cabeça */}
        <path
          d="M29 2 C45 2 56 13 56 28 C56 43 45 54 29 54 C13 54 2 43 2 28 C2 13 13 2 29 2 Z"
          fill={lapis ? "none" : cor.latao}
          stroke={lapis ? cor.lapis : cor.lataoEscuro}
          strokeWidth={lapis ? 2.5 : 3}
          strokeDasharray={lapis ? "7 6" : undefined}
        />
        <circle cx={29} cy={18} r={7} fill={lapis ? "none" : cor.parede} stroke={lapis ? cor.lapis : cor.lataoEscuro} strokeWidth={lapis ? 2.5 : 3} />
        {/* haste e segredo */}
        <path
          d="M22 52 V160 L29 168 L36 160 V150 H44 V140 H36 V130 H46 V120 H36 V112 H42 V102 H36 V52"
          fill={lapis ? "none" : cor.latao}
          stroke={lapis ? cor.lapis : cor.lataoEscuro}
          strokeWidth={lapis ? 2.5 : 3}
          strokeLinejoin="round"
          strokeDasharray={lapis ? "7 6" : undefined}
        />
        {!lapis ? <path d="M29 60 V156" stroke={cor.lataoClaro} strokeWidth={3} strokeLinecap="round" opacity={0.7} /> : null}
      </g>
    </svg>
  );
};
