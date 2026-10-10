// Legenda: uma linha numa etiqueta de papel, a palavra da vez em verde.
// Só aparece nos trechos sem momento (os momentos já mostram o que é dito).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, grotesca } from "../tema";

export const LEGENDA_Y = 1424;

export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const pEntra = prog(t, atual.de - 0.08, 0.2);
  const s = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: LEGENDA_Y, display: "flex", justifyContent: "center", opacity: pEntra * (1 - s) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
          background: cor.papel,
          borderRadius: 12,
          padding: "12px 28px 14px",
          boxShadow: "0 8px 14px rgba(30,20,10,0.22)",
          fontFamily: grotesca,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.15,
          color: cor.preto,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falando = t >= p.em - 0.04 && t < p.ate + 0.04;
          const dita = t >= p.em - 0.04;
          return (
            <span key={`${p.w}-${i}`} style={{ color: falando ? cor.verde : undefined, opacity: dita ? 1 : 0.4 }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
