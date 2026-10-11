import React from "react";
import { comoTitulo, dito, LETRA, Letreiro, MARCA, useTempo, type CenaProps } from "../kit";

/**
 * "faça o essencial bem feito": o letreiro se constrói em cima da tenda
 * reunida, letra a letra, cada linha na palavra que a nomeia. Um título só,
 * curto, sem competir com a legenda (aula 8.1).
 */
export const Frente: React.FC<CenaProps> = ({ de }) => {
  const { t } = useTempo();
  return (
    <div style={{ position: "absolute", top: 96, left: 0, width: 1080, textAlign: "center", fontFamily: LETRA.titulo, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
      <div style={{ fontSize: 92 }}>
        <Letreiro texto={comoTitulo("o essencial")} tamanho={92} largura={980} cor={MARCA.titulo} t={t} inicio={de} atraso={0.04} />
      </div>
      <div style={{ fontSize: 122 }}>
        <Letreiro texto={comoTitulo("bem feito")} tamanho={122} largura={980} cor={MARCA.destaque} t={t} inicio={dito("bem feito") - 0.03} atraso={0.05} />
      </div>
    </div>
  );
};
