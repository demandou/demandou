import { interpolate } from "remotion";
import { saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { LIMITE_APP, MARGEM, QUADRO } from "../layout";
import { cor, serif, sombra } from "../tema";
import { LinhasEmFoco, quebrarEmLinhas } from "./Foco";

// no quadro deitado a narração tem a largura entre as margens seguras, com folga
const LARGURA = QUADRO.w - 2 * MARGEM - 128;

// A narração do Cinema: a legenda vira texto de filme, uma frase por vez, no espaço da barra de
// baixo (ou sobre a base da imagem quando a tela está aberta). A frase entra inteira, fora de
// foco, e cada palavra ganha nitidez quando é falada, como um ajuste de foco da lente.
// No quadro deitado (16:9) a frase cabe numa linha só (o motor monta frases curtas para o 16:9).
export const Narracao: React.FC<{ frases: Frase[]; centro: number; baseNoTempo: (t: number) => number }> = ({ frases, centro, baseNoTempo }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.14 && t <= f.ate);
  if (!atual) return null;
  const sai = saindo(t, atual.ate, 0.22);
  // o tamanho e a quebra valem para a frase inteira (não mudam se as barras se mexem no meio dela):
  // pelo momento em que a barra de baixo está mais fina. 52 px na barra fina, até 58 px na grossa.
  const base = Math.max(baseNoTempo(atual.de), baseNoTempo((atual.de + atual.ate) / 2), baseNoTempo(atual.ate));
  let tamanho = Math.round(interpolate(base, [720, 850], [58, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  let linhas = quebrarEmLinhas(atual.palavras, tamanho, LARGURA);
  // uma linha só sempre que der: a letra diminui um pouco (nunca abaixo de 46)
  for (let menor = tamanho - 2; linhas.length > 1 && menor >= 46; menor -= 2) {
    const tentativa = quebrarEmLinhas(atual.palavras, menor, LARGURA);
    if (tentativa.length === 1) {
      tamanho = menor;
      linhas = tentativa;
    }
  }
  // duas linhas (frase longa demais): o centro sobe para a de baixo não passar dos controles do player
  const altura = linhas.length * tamanho * 1.16;
  const y = Math.min(centro, LIMITE_APP - 8 - altura / 2);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        translate: "0 -50%",
        display: "flex",
        justifyContent: "center",
        opacity: 1 - sai,
      }}
    >
      <LinhasEmFoco
        linhas={linhas}
        entrada={atual.de}
        estilo={{ fontFamily: serif, fontWeight: 600, fontSize: tamanho, lineHeight: 1.16, color: cor.marfim, textShadow: sombra }}
      />
    </div>
  );
};
