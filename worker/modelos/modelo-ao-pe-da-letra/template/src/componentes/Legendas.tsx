import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda bilíngue do Ao Pé da Letra: o português em creme, o que é falado na outra língua
// (inglês, espanhol…) em azul-céu e um pouco mais grosso. A palavra dita acende; as que ainda
// vêm ficam esmaecidas. `idioma2` são os trechos (em segundos) falados na outra língua.
export const Legendas: React.FC<{ frases: Frase[]; y: (t: number) => number; idioma2?: { de: number; ate: number }[] }> = ({ frases, y, idioma2 = [] }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entrada = prog(t, atual.de - 0.05, 0.14);
  const sai = saindo(t, atual.ate, 0.1);
  const falando = atual.palavras.reduce((k, p, i) => (t >= p.em - 0.03 ? i : k), -1);
  const estrangeira = (p: { em: number; ate: number }) => idioma2.some((f) => p.em >= f.de - 0.04 && p.em < f.ate);
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
          fontSize: 52,
          lineHeight: 1.2,
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => {
          const fora = estrangeira(p);
          return (
            <span key={`${p.w}-${i}`} style={{ opacity: i <= falando ? 1 : 0.42, color: fora ? cor.coral : cor.tinta, fontWeight: fora ? 900 : 700 }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
