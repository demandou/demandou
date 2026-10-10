import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda do Pronúncia: uma faixa violeta; a palavra dita acende em creme e ganha um ponto coral
// embaixo (o mesmo ponto da sílaba forte, em miniatura).
export const Legendas: React.FC<{ frases: Frase[]; y: (t: number) => number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entrada = prog(t, atual.de - 0.05, 0.14);
  const sai = saindo(t, atual.ate, 0.1);
  const falando = atual.palavras.reduce((k, p, i) => (t >= p.em - 0.03 ? i : k), -1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y(atual.de), display: "flex", justifyContent: "center", opacity: entrada * (1 - sai) }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
          maxWidth: 940,
          padding: "12px 30px 16px",
          borderRadius: 22,
          background: cor.cartao,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.2,
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ position: "relative", opacity: i <= falando ? 1 : 0.42 }}>
            {p.w}
            {i === falando ? (
              <span style={{ position: "absolute", left: "50%", bottom: -8, width: 10, height: 10, marginLeft: -5, borderRadius: 5, background: cor.coral }} />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
};
