import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, mono, sans } from "../tema";

// Número dito vira dado: dígitos, %, "mil", "R$" saem em fonte mono na cor positiva.
const ehNumero = (w: string) => /\d/.test(w) || /^(R\$|mil|milhões?|bilhões?|%)[,.]?$/i.test(w);

// Legenda do Painel: uma linha numa cápsula escura (como a dica de um gráfico); cada palavra
// acende quando é falada. A altura muda com o layout: abaixo do queixo ou no rodapé do painel.
export const Legendas: React.FC<{ frases: Frase[]; y: (t: number) => number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entrada = prog(t, atual.de - 0.05, 0.14);
  const sai = saindo(t, atual.ate, 0.1);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y(atual.de),
        display: "flex",
        justifyContent: "center",
        opacity: entrada * (1 - sai),
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.27em",
          maxWidth: 960,
          padding: "12px 28px 14px",
          borderRadius: 18,
          background: "rgba(10,18,15,0.84)",
          border: `2px solid ${cor.linha}`,
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.22,
          color: cor.texto,
          translate: `0 ${(1 - entrada) * 8}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const numero = ehNumero(p.w);
          return (
            <span
              key={`${p.w}-${i}`}
              style={{
                opacity: 0.38 + 0.62 * prog(t, p.em - 0.04, 0.14),
                ...(numero ? { fontFamily: mono, fontWeight: 500, color: cor.positivo, letterSpacing: "-0.02em" } : {}),
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
