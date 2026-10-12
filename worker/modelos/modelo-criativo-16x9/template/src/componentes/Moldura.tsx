// A moldura da pessoa e o fundo do quadro, no quadro deitado (16:9, aula 9 do curso).
// MOLDURA: quando a pessoa vai para a direita, o vídeo fica dentro de um cartão de vidro claro com
// espessura (a mesma borda de 14 px da foto no cartão); a borda aparece junto com a ida e some na
// volta ao quadro cheio. O vídeo em si nunca muda de cor.
// FUNDO: o que aparece atrás do quadro da esquerda quando a pessoa sai do quadro cheio: a tinta do
// modelo com duas luzes suaves (uma clara e uma bem fraca na cor do destaque) para o vidro dos
// cartões ter o que desfocar. As luzes ficam do lado do quadro, nunca atrás da pessoa.
import { AbsoluteFill } from "remotion";
import { BORDA_DA_MOLDURA } from "../layout";
import type { Caixa } from "../motor/caixa";
import { cor, corDaEspessura, ESPESSURA, vidroClaro, type Tons } from "../tema";

export const Fundo: React.FC<{ tons: Tons }> = ({ tons }) => (
  <AbsoluteFill
    style={{
      background: [
        "radial-gradient(ellipse 46% 58% at 30% 40%, rgba(75,81,104,0.55) 0%, rgba(75,81,104,0) 100%)",
        `radial-gradient(ellipse 34% 42% at 14% 88%, ${tons.destaque}2E 0%, ${tons.destaque}00 100%)`,
        `linear-gradient(160deg, rgba(27,34,56,1) 0%, ${cor.tinta} 58%)`,
      ].join(", "),
    }}
  />
);

// A borda de vidro em volta da caixa do vídeo (desenhada ANTES do vídeo: ele fica por cima).
// `p`: 0 = quadro cheio (sem borda), 1 = a pessoa na moldura.
export const MolduraDeVidro: React.FC<{ caixa: Caixa; p: number }> = ({ caixa, p }) => {
  if (p <= 0.01) return null;
  const b = BORDA_DA_MOLDURA * p;
  const raio = (caixa.raio ?? 0) + b;
  return (
    <div style={{ position: "absolute", left: caixa.x - b, top: caixa.y - b, width: caixa.w + 2 * b, height: caixa.h + 2 * b, opacity: Math.min(1, p * 1.6) }}>
      {/* a espessura do vidro */}
      <div style={{ position: "absolute", left: 2, right: 2, top: ESPESSURA, bottom: -ESPESSURA * p, borderRadius: raio, background: corDaEspessura.claro }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: raio, ...vidroClaro }} />
    </div>
  );
};
