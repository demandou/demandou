// Legenda no estilo "closed caption" de TV: uma linha numa tarja azul-noite, logo acima do
// letreiro, com a palavra que está sendo dita em branco cheio e as que vêm depois apagadas.
// Só aparece nos trechos sem momento (as artes já mostram o que é dito).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LETREIRO, texto } from "../tema";

export const LEGENDA_Y = LETREIRO.y - 34 - 74;

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
          gap: "0 0.26em",
          background: "rgba(6,18,71,0.9)",
          padding: "10px 24px 12px",
          ...texto,
          fontWeight: 700,
          fontSize: 46,
          color: cor.branco,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: t >= p.em - 0.04 ? 1 : 0.42 }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
