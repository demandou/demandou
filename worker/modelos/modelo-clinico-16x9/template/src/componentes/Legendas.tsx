import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA_Y, MARGEM, QUADRO, sans } from "../tema";

// Legenda numa pílula branca, sempre na mesma altura: no quadro deitado, no terço de baixo,
// terminando antes dos controles do player. Cada palavra acende em azul-tinta quando é falada.
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
          maxWidth: Math.min(1440, QUADRO.w - 2 * MARGEM),
          padding: "12px 30px 15px",
          borderRadius: 999,
          background: cor.branco,
          boxShadow: `0 0 0 2px ${cor.cinzaClaro}`,
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 44,
          lineHeight: 1.15,
          color: cor.tinta,
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span
            key={`${p.w}-${i}`}
            style={{ opacity: 0.3 + 0.7 * prog(t, p.em - 0.04, 0.14), marginRight: i < atual.palavras.length - 1 ? "0.24em" : 0 }}
          >
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
