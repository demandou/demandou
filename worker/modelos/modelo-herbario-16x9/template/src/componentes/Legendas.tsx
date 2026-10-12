import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, sans } from "../tema";

// Legenda numa tira de papel de etiqueta com fio de pena. As palavras já estão lá em grafite
// e ganham tinta quando são faladas. Só aparece com a pessoa em tela cheia, fora dos momentos, na
// área segura de baixo do quadro deitado (acima dos controles do player).
export const Legendas: React.FC<{ frases: Frase[] }> = ({ frases }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.2);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: LEGENDA_Y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1320,
          padding: "10px 28px 14px",
          background: cor.etiqueta,
          border: `2.5px solid ${cor.tinta}`,
          borderRadius: 6,
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.12,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const q = prog(t, p.em - 0.04, 0.14);
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                color: q > 0.5 ? cor.tinta : cor.grafite,
                marginRight: i < atual.palavras.length - 1 ? "0.26em" : 0,
              }}
            >
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
