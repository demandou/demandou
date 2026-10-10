import React from "react";
import { comoTitulo, dito, k, LETRA, Letreiro, MARCA, MEIO, mix, useTempo, type CenaProps } from "../kit";

/**
 * EXCELÊNCIA atrás da cabeça (aula 8.2, cena 2: "começa legível e se afasta em
 * profundidade"): entra letra a letra na palavra dita, com a base uns 60 px
 * abaixo do topo da cabeça (a cabeça cobre de verdade o pé das letras do meio),
 * e recua enquanto os três "mais caro" entram à frente, abrindo o espaçamento.
 */
const TOPO_DA_CABECA = 560;

export const Atras: React.FC<CenaProps> = ({ de }) => {
  const { t } = useTempo();
  const entra = k(t, de, de + 0.6);
  const afasta = k(t, dito("produto") + 0.25, dito("celular") + 0.2, MEIO);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: TOPO_DA_CABECA - 66,
        textAlign: "center",
        fontFamily: LETRA.titulo,
        fontWeight: 900,
        fontSize: 146,
        lineHeight: 1,
        letterSpacing: `${mix(-0.03, 0.08, afasta)}em`,
        color: MARCA.titulo,
        opacity: mix(1, 0.3, afasta),
        scale: mix(1.1, 1, entra) * mix(1, 0.58, afasta),
        translate: `0px ${mix(0, -190, afasta)}px`,
        filter: `blur(${afasta * 2.4}px)`,
      }}
    >
      <Letreiro texto={comoTitulo("excelência")} cor={MARCA.titulo} t={t} inicio={de} atraso={0.035} />
    </div>
  );
};
