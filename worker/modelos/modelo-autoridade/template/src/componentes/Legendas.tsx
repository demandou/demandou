import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda sóbria: uma linha, abaixo dos componentes; cada palavra acende quando é falada.
export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: y,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "0 0.28em",
        fontFamily: sans,
        fontWeight: 600,
        fontSize: 45,
        lineHeight: 1.2,
        color: cor.papel,
        textShadow: "0 2px 14px rgba(8,12,20,0.75)",
        opacity: 1 - saindo(t, atual.ate, 0.1),
      }}
    >
      {atual.palavras.map((p, i) => (
        <span key={`${p.w}-${i}`} style={{ opacity: 0.32 + 0.68 * prog(t, p.em - 0.04, 0.16) }}>
          {p.w}
        </span>
      ))}
    </div>
  );
};
