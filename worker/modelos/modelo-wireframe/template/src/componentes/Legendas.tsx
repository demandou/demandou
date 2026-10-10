import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda de quadro cheio (só nos trechos sem momento): uma linha num rótulo grafite, abaixo do
// queixo; cada palavra acende quando é falada. No canvas, a fala aparece no balão do comentário.
export const Legendas: React.FC<{ frases: Frase[]; y: number; presenca: number }> = ({ frases, y, presenca }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  // some quando a pessoa encolhe para o canvas (lá a fala vai para o balão)
  const visivel = Math.max(0, 1 - presenca * 3);
  if (!atual || visivel <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center", opacity: visivel * (1 - saindo(t, atual.ate, 0.1)) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 900,
          padding: "10px 26px 14px",
          borderRadius: 18,
          background: "rgba(28,29,32,0.84)",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.18,
          color: cor.papel,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0, opacity: 0.32 + 0.68 * prog(t, p.em - 0.04, 0.16) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
