import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda numa cápsula champanhe, uma linha por vez. Em tela cheia fica logo acima da interface do
// app; com a tela dividida, fica sobre a linha do espelho (entre os textos de cima e a cabeça da
// pessoa, nunca sobre o rosto). Cada palavra escurece quando é falada.
export const ALTURA_LEGENDA = 78;
export const Legendas: React.FC<{ frases: Frase[]; topo: number }> = ({ frases, topo }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  const sai = saindo(t, atual.ate, 0.14);
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: topo, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 840,
          padding: "12px 34px 15px",
          borderRadius: 999,
          background: "rgba(239,230,218,0.94)",
          boxShadow: `inset 0 0 0 1.5px rgba(166,138,91,0.55)`,
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 44,
          lineHeight: 1.15,
          color: cor.cafe,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, opacity: 0.34 + 0.66 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
