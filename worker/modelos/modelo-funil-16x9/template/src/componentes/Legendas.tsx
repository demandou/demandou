import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, fonte, MARGEM } from "../tema";

// Legenda: uma linha numa tarja grafite; cada palavra acende quando é falada.
// (No Funil quase tudo já está na tela; a legenda só aparece fora dos momentos.) No quadro
// deitado ela fica na área segura de baixo, acima dos controles do player.
export const Legendas: React.FC<{ frases: Frase[]; y: (t: number) => number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entra = prog(t, atual.de - 0.05, 0.18);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        right: MARGEM,
        top: y(t),
        display: "flex",
        justifyContent: "center",
        opacity: entra * (1 - saindo(t, atual.ate, 0.1)),
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          padding: "8px 22px 10px",
          borderRadius: 18,
          background: cor.grafite,
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.18,
          color: cor.branco,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.4 + 0.6 * prog(t, p.em - 0.04, 0.14) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
