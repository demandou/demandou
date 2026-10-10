import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, MARGEM, sans } from "../tema";

// Legenda numa placa de céu, uma linha por vez; cada palavra se acende quando é falada.
export const Legendas: React.FC<{ frases: Frase[]; y: number; visivel?: number }> = ({ frases, y, visivel = 1 }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || visivel <= 0.01) return null;
  const entrada = prog(t, atual.de - 0.08, 0.2);
  return (
    <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: y, display: "flex", justifyContent: "center", opacity: entrada * (1 - saindo(t, atual.ate, 0.12)) * visivel }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "10px 26px 14px",
          borderRadius: 14,
          background: "rgba(10,11,31,0.84)",
          border: `1.5px solid ${cor.ceuBorda}`,
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, color: cor.texto, opacity: 0.38 + 0.62 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
