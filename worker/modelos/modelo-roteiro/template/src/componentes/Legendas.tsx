import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda numa etiqueta de papel, uma linha por vez; cada palavra ganha tinta quando é falada.
// Fica sempre na mesma altura (acima da interface do app); nas telas de mapa, logo acima dos cartões.
export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entrada = prog(t, atual.de - 0.08, 0.2);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center", opacity: entrada * (1 - saindo(t, atual.ate, 0.12)) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "10px 26px 14px",
          borderRadius: 16,
          background: "rgba(251,246,236,0.94)",
          boxShadow: "0 6px 16px rgba(60,44,20,0.18)",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, color: cor.tinta, opacity: 0.35 + 0.65 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
