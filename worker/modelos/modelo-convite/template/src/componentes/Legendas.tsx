import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, TAM, texto } from "../tema";

// Legenda dentro do convite, nos trechos sem momento: texto escuro no papel, cada palavra ganha
// tinta quando é dita. Fica embaixo da foto em arco (nunca em cima do rosto).
export const Legendas: React.FC<{ frases: Frase[]; x: number; w: number; y: number; opacidade: number }> = ({ frases, x, w, y, opacidade }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || opacidade <= 0.001) return null;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        width: w,
        top: y,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        columnGap: "0.26em",
        padding: "0 30px",
        fontFamily: texto,
        fontWeight: 600,
        fontSize: TAM.legenda,
        lineHeight: 1.18,
        color: cor.tinta,
        textAlign: "center",
        opacity: Math.min(entra, 1 - sai) * opacidade,
      }}
    >
      {atual.palavras.map((p, i) => (
        <span key={`${p.w}-${i}`} style={{ opacity: 0.3 + 0.7 * prog(t, p.em - 0.04, 0.16) }}>
          {p.w}
        </span>
      ))}
    </div>
  );
};
