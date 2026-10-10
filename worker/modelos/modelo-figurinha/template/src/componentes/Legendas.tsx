// Legenda de redes sociais: uma linha numa tira de papel creme, abaixo do queixo, acima da interface
// do app. As palavras já estão a lápis e ganham tinta quando são ditas. Só aparece nos trechos sem
// momento (as etiquetas e figurinhas já mostram o que é dito).
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, corpo } from "../tema";

export const LEGENDA_Y = 1410;

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
          gap: "0 0.27em",
          background: cor.cartela,
          border: `8px solid ${cor.branco}`,
          borderRadius: 22,
          padding: "10px 26px 12px",
          rotate: "-1deg",
          boxShadow: "0 3px 6px rgba(58,40,24,0.18)",
          ...corpo(48, 800),
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => (
          <span key={`${p.w}-${i}`} style={{ color: t >= p.em - 0.04 ? cor.tinta : cor.lapis }}>
            {p.w}
          </span>
        ))}
      </div>
    </div>
  );
};
