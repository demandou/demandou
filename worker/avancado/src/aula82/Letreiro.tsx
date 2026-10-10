import React from "react";
import { k, SAIDA } from "../anim";

/**
 * Construção por letras (aula 8.2, "máscaras de revelação, construção por
 * letras"): cada letra entra com um atraso curto. Com `mascaraHorizontal`, a
 * letra é revelada por uma máscara que corre da esquerda para a direita (a
 * cena da ATENÇÃO); sem ela, sobe e aparece. Acentos e caracteres preservados:
 * a palavra é escrita como foi dita, só em caixa alta.
 */
export const Letreiro: React.FC<{
  texto: string;
  cor: string;
  t: number;
  inicio: number;
  atraso: number;
  duracao?: number;
  mascaraHorizontal?: boolean;
}> = ({ texto, cor, t, inicio, atraso, duracao = 0.38, mascaraHorizontal = false }) => (
  <span style={{ color: cor, whiteSpace: "nowrap" }}>
    {[...texto].map((letra, i) => {
      const p = k(t, inicio + i * atraso, inicio + i * atraso + duracao, SAIDA);
      if (letra === " ") return <span key={i}> </span>;
      return mascaraHorizontal ? (
        <span
          key={i}
          style={{
            display: "inline-block",
            clipPath: `inset(-30% ${Math.round((1 - p) * 1000) / 10}% -30% -5%)`,
            translate: `${(1 - p) * -0.12}em 0px`,
          }}
        >
          {letra}
        </span>
      ) : (
        <span key={i} style={{ display: "inline-block", opacity: p, translate: `0px ${(1 - p) * 0.42}em` }}>
          {letra}
        </span>
      );
    })}
  </span>
);
