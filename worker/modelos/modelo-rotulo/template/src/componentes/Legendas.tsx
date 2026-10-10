// Legenda de redes sociais nos trechos sem momento: uma etiqueta de papel abaixo do queixo,
// com a palavra da vez em vinho.
import { prog, saindo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, TAM, texto } from "../tema";

export const Legendas: React.FC<{ frases: Frase[]; y: number; t: number }> = ({ frases, y, t }) => {
  const f = frases.find((x) => t >= x.de - 0.05 && t < x.ate);
  if (!f) return null;
  const entrada = prog(t, f.de - 0.05, 0.22);
  const saida = saindo(t, f.ate, 0.12);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: y,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(entrada, 1 - saida),
        translate: `0 ${(1 - entrada) * 14}px`,
      }}
    >
      <div
        style={{
          background: cor.papel,
          padding: "10px 28px 12px",
          borderTop: `3px solid ${cor.tinta}`,
          borderBottom: `3px solid ${cor.tinta}`,
          boxShadow: "0 10px 24px rgba(11,8,6,0.32)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 900,
        }}
      >
        {f.palavras.map((p, i) => {
          const falando = t >= p.em - 0.04 && t < (f.palavras[i + 1]?.em ?? f.ate);
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                fontFamily: texto,
                fontSize: TAM.legenda,
                lineHeight: 1.2,
                color: falando ? cor.vinho : cor.tinta,
                fontStyle: falando ? "italic" : "normal",
                marginRight: i < f.palavras.length - 1 ? TAM.legenda * 0.26 : 0,
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
