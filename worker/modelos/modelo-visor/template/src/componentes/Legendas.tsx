import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";
import { vidro } from "./Etiqueta";

// Legenda da câmera: uma linha num rótulo de vidro, acima do seletor de modos;
// cada palavra acende quando é falada.
export const Legendas: React.FC<{ frases: Frase[]; y: number; desde?: number }> = ({ frases, y, desde = -1 }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  // `desde`: a legenda espera a troca de lugar terminar (para não passar pelo rosto no caminho)
  if (!atual || t < desde) return null;
  const entra = prog(t, Math.max(atual.de - 0.05, desde), 0.18);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
          padding: "10px 26px 12px",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
          color: cor.branco,
          opacity: entra * (1 - saindo(t, atual.ate, 0.1)),
          ...vidro,
          borderRadius: 20,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ opacity: 0.38 + 0.62 * prog(t, p.em - 0.04, 0.16) }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
