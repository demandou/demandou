import React from "react";
import { comoTitulo, Contador, dito, ditoAte, ENTRADA, Etiqueta, GraficoDeLinha, janela, k, LETRA, MARCA, MEIO, PainelDeDado, useTempo, type CenaProps } from "../kit";

/**
 * O PAINEL DO ROMPIMENTO (aula 6, a inserção 1): acima da cabeça, o número
 * DITO conta até o valor na hora em que é dito ("oitenta e três mil dólares"
 * vira US$ 83 MIL), e a linha se desenha até romper o nível tracejado. A curva
 * é desenho, sem eixo e sem valor inventado: leva a etiqueta ILUSTRAÇÃO. Em
 * "ciclo de alta" a etiqueta da ponta muda para a fala. Sai antes do card.
 */
const CURVA = [0.18, 0.3, 0.24, 0.42, 0.36, 0.55, 0.5, 0.7, 0.64, 0.86, 0.95];

export const Frente: React.FC<CenaProps> = ({ de, ate }) => {
  const { t } = useTempo();
  const v = janela(t, de + 0.05, ate, 0.5, 0.45);
  if (v.visivel <= 0) return null;
  const desenho = k(t, dito("rompeu"), ditoAte("dólares") + 0.3, MEIO);
  const nivel = k(t, dito("rompeu") - 0.2, dito("rompeu") + 0.5, ENTRADA);
  const ciclo = k(t, dito("ciclo de alta"), dito("ciclo de alta") + 0.4);
  return (
    <PainelDeDado x={60} y={96} largura={960} altura={600} visivel={v.visivel}>
      <div style={{ position: "absolute", left: 44, top: 36, display: "flex", gap: 14, alignItems: "center" }}>
        <Etiqueta texto={comoTitulo("bitcoin")} cor="titulo" tamanho={26} />
        <Etiqueta texto={comoTitulo("rompeu")} tamanho={26} style={{ opacity: k(t, dito("rompeu"), dito("rompeu") + 0.3) }} />
      </div>
      <div style={{ position: "absolute", left: 44, top: 96, fontFamily: LETRA.titulo, fontWeight: 900, fontSize: 132, lineHeight: 1, color: MARCA.titulo, letterSpacing: "-0.02em" }}>
        <Contador t={t} ate={83} inicio={dito("oitenta e três mil")} fim={ditoAte("mil")} prefixo="US$ " texto="US$ 83 MIL" />
      </div>
      <div style={{ position: "absolute", left: 20, top: 250, width: 920, height: 320 }}>
        <GraficoDeLinha
          largura={920}
          altura={320}
          pontos={CURVA}
          progresso={desenho}
          suave
          nivel={{ valor: 0.62, progresso: nivel }}
          rotuloDaPonta={ciclo > 0.5 ? comoTitulo("ciclo de alta") : null}
        />
      </div>
      <div style={{ position: "absolute", right: 36, top: 40, opacity: 0.85 }}>
        <Etiqueta texto={comoTitulo("ilustração")} cor="apoio" tamanho={22} />
      </div>
    </PainelDeDado>
  );
};
