import { prog, saindo, useTempo } from "../anim";
import type { Ret } from "../grade";
import type { Frase } from "../motor/frases";
import { cor, LIMITE_APP, sans } from "../tema";

// Legenda numa peça creme, dentro do bloco da pessoa (a legenda "mora" com quem fala).
// Em bloco estreito demais para uma linha legível, ela não aparece.
export const Legendas: React.FC<{ frases: Frase[]; pessoa: Ret }> = ({ frases, pessoa }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || pessoa.w < 560) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  const sai = saindo(t, atual.ate, 0.12);
  const y = Math.min(pessoa.y + pessoa.h - 170, LIMITE_APP - 100);
  return (
    <div style={{ position: "absolute", left: pessoa.x + 30, width: pessoa.w - 60, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          padding: "12px 26px 15px",
          borderRadius: 20,
          background: cor.creme,
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.15,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 12}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.32 + 0.68 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
