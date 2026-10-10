import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, serif, sombraPapel } from "../tema";

// Legenda como exemplo de dicionário: itálico serifado numa tira de papel, sempre na mesma altura;
// a palavra dita acende em ameixa e fica em tinta depois.
export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const s = saindo(t, atual.ate - 0.1, 0.1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LEGENDA_Y, display: "flex", justifyContent: "center", opacity: 1 - s }}>
      <div
        style={{
          maxWidth: 960,
          padding: "10px 26px 12px",
          borderRadius: 10,
          background: cor.cartao,
          boxShadow: sombraPapel,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.18,
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => {
          const dita = prog(t, p.em - 0.04, 0.12);
          const falando = t >= p.em - 0.04 && t < p.ate;
          return (
            <span key={`${p.w}-${i}`} style={{ marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, opacity: 0.35 + 0.65 * dita, color: falando ? cor.ameixa : cor.tinta }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
