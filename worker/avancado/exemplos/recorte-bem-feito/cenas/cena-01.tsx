import React from "react";
import { comoTitulo, dito, ENTRADA, k, LETRA, Letreiro, MARCA, MEIO, mix, useTempo, type CenaProps } from "../kit";

/**
 * BEM FEITO atrás da cabeça (aula 8.2, cena 1): o recorte cobre o pé das
 * letras do meio e a palavra continua legível; enquanto a moldura sobe, ela se
 * afasta em profundidade e sai antes de O CERTO entrar.
 */
const TOPO_DA_CABECA = 560; // da geometria do corte (escala 1,15)

export const Atras: React.FC<CenaProps> = ({ ate }) => {
  const { t } = useTempo();
  const afasta = k(t, dito("você") - 0.1, ate - 0.6, MEIO);
  const sai = k(t, ate - 0.6, ate, ENTRADA);
  if (sai >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        // duas linhas de 206 px: a base de FEITO fica uns 70 px abaixo do topo da cabeça
        top: TOPO_DA_CABECA - 230,
        textAlign: "center",
        fontFamily: LETRA.titulo,
        fontWeight: 900,
        fontSize: 206,
        lineHeight: 0.82,
        letterSpacing: "-0.02em",
        scale: mix(1, 0.8, afasta),
        translate: `0px ${mix(0, -60, afasta)}px`,
        opacity: mix(1, 0.2, afasta) * (1 - sai),
        filter: `blur(${afasta * 2}px)`,
      }}
    >
      <Letreiro texto={comoTitulo("bem")} cor={MARCA.titulo} t={t} inicio={dito("bem feito")} atraso={0.05} />
      <br />
      <Letreiro texto={comoTitulo("feito")} cor={MARCA.destaque} t={t} inicio={dito("feito")} atraso={0.05} />
    </div>
  );
};
