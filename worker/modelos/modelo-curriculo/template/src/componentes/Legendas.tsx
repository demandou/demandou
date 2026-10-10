import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda: uma tira de papel com a fala, sempre abaixo do queixo e acima da interface do app.
// Cada palavra ganha tinta quando é falada.
export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.16);
  const sai = saindo(t, atual.ate - 0.1, 0.1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.27em",
          maxWidth: 940,
          padding: "10px 24px 14px",
          background: cor.papel,
          borderRadius: 10,
          boxShadow: "0 2px 4px rgba(28,33,41,0.12), 0 10px 24px rgba(28,33,41,0.16)",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.18,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 8}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ color: prog(t, p.em - 0.04, 0.12) > 0.5 ? cor.tinta : cor.lapis }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
