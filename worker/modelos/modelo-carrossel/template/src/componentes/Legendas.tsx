import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, fonte, LEGENDA_Y } from "../tema";

// Legenda numa etiqueta creme, sempre na mesma altura (acima dos pontinhos e da interface do app).
// Cada palavra escurece quando é falada; a palavra da vez fica em coral.
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
          maxWidth: 940,
          padding: "10px 26px 13px",
          borderRadius: 22,
          background: "rgba(244,236,225,0.96)",
          boxShadow: "0 8px 24px rgba(10,52,64,0.18)",
          fontFamily: fonte,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.15,
          color: cor.petroleo,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falada = prog(t, p.em - 0.04, 0.14);
          const proxima = atual.palavras[i + 1];
          const daVez = t >= p.em - 0.04 && (!proxima || t < proxima.em - 0.04);
          return (
            <span key={`${p.w}-${i}`} style={{ opacity: 0.32 + 0.68 * falada, color: daVez ? cor.coral : undefined }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
