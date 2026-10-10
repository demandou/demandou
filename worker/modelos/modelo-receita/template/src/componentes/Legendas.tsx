import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, TAM, texto } from "../tema";

// Legenda numa etiqueta creme, abaixo do queixo; a palavra da vez ganha o grifo pistache.
export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          maxWidth: 920,
          padding: "10px 28px 14px",
          borderRadius: 20,
          background: "rgba(246,239,228,0.96)",
          boxShadow: "0 10px 26px rgba(46,30,26,0.22)",
          fontFamily: texto,
          fontSize: TAM.legenda,
          lineHeight: 1.15,
          color: cor.cacau,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falada = prog(t, p.em - 0.04, 0.14);
          const proxima = atual.palavras[i + 1];
          const daVez = t >= p.em - 0.04 && (!proxima || t < proxima.em - 0.04);
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                opacity: 0.34 + 0.66 * falada,
                backgroundImage: daVez ? `linear-gradient(${cor.pistache}, ${cor.pistache})` : "none",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "0 92%",
                backgroundSize: "100% 0.17em",
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
