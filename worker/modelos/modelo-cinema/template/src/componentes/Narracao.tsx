import { interpolate } from "remotion";
import { saindo, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import { LIMITE_APP } from "../layout";
import { cor, serif, sombra } from "../tema";
import { LinhasEmFoco, quebrarEmLinhas } from "./Foco";

const LARGURA = 930;

// A narração do Cinema: a legenda vira texto de filme, uma frase por vez, no espaço da barra de
// baixo (ou sobre a base da imagem quando a tela está aberta). A frase entra inteira, fora de
// foco, e cada palavra ganha nitidez quando é falada — como um ajuste de foco da lente.
export const Narracao: React.FC<{ frases: Frase[]; centro: number; baseNoTempo: (t: number) => number }> = ({ frases, centro, baseNoTempo }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.14 && t <= f.ate);
  if (!atual) return null;
  const sai = saindo(t, atual.ate, 0.22);
  // o tamanho e a quebra valem para a frase inteira (não mudam se as barras se mexem no meio dela):
  // pelo momento em que a barra de baixo está mais fina. 66 px na barra fina, até 76 px na grossa.
  const base = Math.max(baseNoTempo(atual.de), baseNoTempo((atual.de + atual.ate) / 2), baseNoTempo(atual.ate));
  let tamanho = Math.round(interpolate(base, [1120, 1360], [76, 66], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  let linhas = quebrarEmLinhas(atual.palavras, tamanho, LARGURA);
  // só no meio de uma troca de barras (a de baixo mais fina que a do nível 1) duas linhas não cabem
  // acima da interface do app → uma linha só, com a letra um pouco menor (nunca abaixo de 60)
  const cabemDuas = base >= 1800 || LIMITE_APP - base - 12 >= 2 * 1.16 * tamanho;
  if (linhas.length > 1 && !cabemDuas) {
    const caracteres = atual.palavras.map((p) => p.w).join(" ").length;
    tamanho = Math.max(60, Math.min(tamanho, Math.floor(LARGURA / (caracteres * 0.43))));
    linhas = [atual.palavras];
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: centro,
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
