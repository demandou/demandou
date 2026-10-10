import { cor } from "../tema";

// Névoa branca de consultório: em tela cheia, a base do quadro se dissolve em branco abaixo do queixo
// para o texto entrar limpo, sem cartão. `p` = presença (0 a 1); `topo` = onde o texto começa.
export const Nevoa: React.FC<{ p: number; topo: number }> = ({ p, topo }) => {
  if (p <= 0.001) return null;
  const inicio = topo - 200;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: inicio,
        bottom: 0,
        opacity: p,
        translate: `0 ${(1 - p) * 60}px`,
        // densa atrás do texto; abaixo da interface do app ela afina e a gravação volta a aparecer de leve
        background: `linear-gradient(to bottom, rgba(255,255,255,0) 0px, rgba(255,255,255,0.72) 110px, rgba(255,255,255,0.93) 190px, ${cor.branco} 330px, ${cor.branco} ${1560 - inicio}px, rgba(255,255,255,0.62) 100%)`,
      }}
    />
  );
};
