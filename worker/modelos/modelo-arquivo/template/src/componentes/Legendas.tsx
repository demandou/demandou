import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, sans } from "../tema";

// Legenda de documentário: tarja preta, texto claro, sempre na mesma altura.
// Cada palavra acende quando é falada.
export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.16);
  const sai = saindo(t, atual.ate - 0.1, 0.1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LEGENDA_Y, display: "flex", justifyContent: "center", zIndex: 20 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.27em",
          maxWidth: 940,
          padding: "10px 22px 13px",
          background: "rgba(21,21,21,0.9)",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.18,
          color: cor.claro,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 8}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.42 + 0.58 * prog(t, p.em - 0.04, 0.12) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
