// A legenda dos trechos em tela cheia: uma faixa escura no peito; cada palavra é um "token" e a
// palavra da vez ganha uma pastilha clara, como a IA lendo o texto.
import { prog } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

export const Legenda: React.FC<{ frases: Frase[]; t: number; y: number }> = ({ frases, t, y }) => {
  const f = frases.find((x) => t >= x.de - 0.05 && t < x.ate);
  if (!f) return null;
  const p = prog(t, f.de - 0.05, 0.18) * (1 - prog(t, f.ate - 0.12, 0.12));
  let vez = -1;
  f.palavras.forEach((w, i) => {
    if (t >= w.em - 0.03) vez = i;
  });
  return (
    <div style={{ position: "absolute", left: 120, width: 840, top: y, display: "flex", justifyContent: "center", opacity: p }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 840,
          padding: "12px 16px",
          borderRadius: 26,
          background: "rgba(21,23,28,0.86)",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
          color: "#fff",
        }}
      >
        {f.palavras.map((w, i) => (
          <span
            key={`${w.w}-${i}`}
            style={{
              padding: "0 6px",
              borderRadius: 12,
              background: i === vez ? "rgba(255,255,255,0.18)" : "transparent",
              opacity: i <= vez ? 1 : 0.55,
              color: i <= vez ? "#fff" : cor.lapisClaro,
            }}
          >
            {w.w}
          </span>
        ))}
      </div>
    </div>
  );
};
