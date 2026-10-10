import React from "react";
import { Cartao, comoTitulo, dito, useApresentador, useTempo, type CenaProps } from "../kit";

/**
 * Os três "mais caro" À FRENTE (aula 8.2: "pequenos elementos à frente"), cada
 * um na palavra que o nomeia, entrando do lado onde fica; o terceiro passa na
 * frente da borda de baixo da moldura. O congestionamento proposital da aula,
 * só no fim e sem cobrir o rosto.
 */
export const Frente: React.FC<CenaProps> = () => {
  const { t } = useTempo();
  const ap = useApresentador();
  const baseDaMoldura = ap.caixa.y + ap.caixa.a;
  const apoio = comoTitulo("mais caro");
  return (
    <>
      <Cartao t={t} inicio={dito("produto") - 0.15} titulo={comoTitulo("produto")} apoio={apoio} icone="caixa" x={40} y={650} lado={-1} />
      <Cartao t={t} inicio={dito("computador") - 0.15} titulo={comoTitulo("computador")} apoio={apoio} icone="notebook" direita={40} y={790} lado={1} />
      <Cartao t={t} inicio={dito("celular") - 0.16} titulo={comoTitulo("celular")} apoio={apoio} icone="celular" x={300} y={baseDaMoldura - 72} lado={-1} />
    </>
  );
};
