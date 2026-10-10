import { cor, LIMITE_APP } from "../tema";

// Névoa branca de consultório: em tela cheia, a base do quadro se dissolve em branco abaixo do queixo
// para o texto entrar limpo, sem cartão. `p` = presença (0 a 1); `topo` = onde o texto começa.
// No quadro deitado a faixa é mais baixa que no vertical: o degradê é mais curto (fica branco logo
// abaixo do topo do texto) e afina de novo só abaixo dos controles do player.
export const Nevoa: React.FC<{ p: number; topo: number }> = ({ p, topo }) => {
  if (p <= 0.001) return null;
  const inicio = topo - 150;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: inicio,
        bottom: 0,
        opacity: p,
        translate: `0 ${(1 - p) * 40}px`,
        // densa atrás do texto; abaixo dos controles do player ela afina e a gravação volta a aparecer de leve
        background: `linear-gradient(to bottom, rgba(255,255,255,0) 0px, rgba(255,255,255,0.72) 70px, rgba(255,255,255,0.93) 120px, ${cor.branco} 190px, ${cor.branco} ${LIMITE_APP + 20 - inicio}px, rgba(255,255,255,0.8) 100%)`,
      }}
    />
  );
};
