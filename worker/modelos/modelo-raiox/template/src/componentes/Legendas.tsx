import { Palavras, saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda de redes sociais: uma linha abaixo do queixo; cada palavra se revela quando é falada (as
// que ainda vêm ficam em esboço). Só aparece nos trechos sem arte (o motor cuida disso).
export const Legendas: React.FC<{ frases: Frase[]; y: number }> = ({ frases, y }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 130, top: y, opacity: 1 - saindo(t, atual.ate, 0.12) }}>
      <Palavras
        palavras={atual.palavras.map((p) => p.w)}
        tempos={atual.palavras.map((p) => p.em - 0.04)}
        t={t}
        alinhar="center"
        fantasma={0.42}
        style={{
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.2,
          color: cor.texto,
          textShadow: "0 2px 16px rgba(3,8,13,0.85), 0 0 4px rgba(3,8,13,0.6)",
        }}
      />
    </div>
  );
};
