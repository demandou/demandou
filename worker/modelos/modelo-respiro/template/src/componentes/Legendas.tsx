import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, serif } from "../tema";

// Legenda escrita no papel, embaixo da janela: serifada, sem caixa. Cada palavra passa de
// apagada para tinta quando é falada. Some sozinha durante os momentos (o componente já mostra).
export const Legendas: React.FC<{ frases: Frase[]; visivel: number }> = ({ frases, visivel }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || visivel <= 0.01) return null;
  const entra = prog(t, atual.de - 0.08, 0.3);
  const sai = saindo(t, atual.ate, 0.18);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          fontFamily: serif,
          fontWeight: 500,
          fontSize: 68,
          lineHeight: 1.1,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai) * visivel,
          translate: `0 ${((1 - entra) * 12).toFixed(1)}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span
            key={`${p.w}-${i}`}
            style={{ opacity: 0.28 + 0.72 * prog(t, p.em - 0.05, 0.2), marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0 }}
          >
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
