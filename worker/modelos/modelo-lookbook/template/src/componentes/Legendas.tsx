// Legenda de foto: uma linha por vez, numa tira de papel abaixo do peito; cada palavra
// passa de lápis para tinta quando é falada. Só aparece fora dos momentos (ou com `legenda: true`).
import { prog, saida, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          padding: "10px 22px 12px",
          background: "rgba(248,245,239,0.94)",
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 46,
          lineHeight: 1.2,
          opacity: entra * (1 - saida(t, atual.ate - 0.1, 0.1)),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ color: t >= p.em - 0.04 ? cor.tinta : cor.lapis }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
