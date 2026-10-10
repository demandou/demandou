import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, sans } from "../tema";

// Legenda numa etiqueta de papel, sempre na mesma altura (abaixo do queixo, acima da interface do app).
// Cada palavra escurece quando é falada.
export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LEGENDA_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          maxWidth: 960,
          padding: "10px 24px 13px",
          background: cor.papel,
          boxShadow: `0 0 0 1.5px ${cor.grafite}`,
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 44,
          lineHeight: 1.15,
          color: cor.grafite,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.3 + 0.7 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
