// Legenda de transmissão: uma linha numa tarja escura, a palavra da vez em amarelo.
// Só aparece nos trechos sem momento (as artes já mostram o que é dito).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, normal } from "../tema";

export const LEGENDA_Y = 1436;

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
          background: "rgba(11,16,22,0.88)",
          borderRadius: 10,
          padding: "12px 26px 14px",
          ...normal,
          fontWeight: 700,
          fontSize: 46,
          color: cor.giz,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falando = t >= p.em - 0.04 && t < p.ate + 0.04;
          const dita = t >= p.em - 0.04;
          return (
            <span key={`${p.w}-${i}`} style={{ color: falando ? cor.placar : undefined, opacity: dita ? 1 : 0.45 }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
