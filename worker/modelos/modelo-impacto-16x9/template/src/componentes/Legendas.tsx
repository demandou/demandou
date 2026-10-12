import { Easing } from "remotion";
import { prog, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, larguraEm, sombra, sora } from "../tema";

// Legenda do Impacto: uma linha em Sora Bold; cada palavra entra quando é falada
// e a palavra do instante fica no acento.
export const Legendas: React.FC<{
  frases: Frase[];
  x: number;
  largura: number;
  y: number;
  maximo?: number;
  visivel?: number;
  // na coluna estreita (pessoa de lado) a legenda alinha à esquerda e pode quebrar em duas linhas
  coluna?: boolean;
}> = ({ frases, x, largura, y, maximo = 64, visivel = 1, coluna = false }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const texto = atual.palavras.map((p) => p.w).join(" ");
  // uma linha que caiba na largura; nunca menor que 44 px (aí ela quebra em duas)
  const tamanho = Math.max(44, Math.min(maximo, Math.floor(largura / larguraEm(texto, 700))));
  const entrada = prog(t, atual.de - 0.05, 0.14);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        width: largura,
        top: y,
        display: "flex",
        justifyContent: coluna ? "flex-start" : "center",
        flexWrap: "wrap",
        gap: "0 0.24em",
        fontFamily: sora,
        fontWeight: 700,
        fontSize: tamanho,
        lineHeight: 1.15,
        color: cor.papel,
        textShadow: sombra,
        opacity: (1 - saindo(t, atual.ate, 0.1)) * visivel,
        translate: `0 ${(1 - entrada) * 18}px`,
      }}
    >
      {atual.palavras.map((p, i) => {
        const prox = atual.palavras[i + 1];
        const agora = t >= p.em - 0.03 && (!prox || t < prox.em - 0.03);
        const q = prog(t, p.em - 0.05, 0.1, Easing.out(Easing.cubic));
        return (
          <span
            key={`${p.w}-${i}`}
            style={{ opacity: q, translate: `0 ${(1 - q) * 12}px`, color: agora ? cor.volt : cor.papel }}
          >
            {p.w}
          </span>
        );
      })}
    </div>
  );
};
