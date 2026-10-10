import React from "react";
import { Cartao, comoTitulo, dito, ditoAte, k, useTempo, type CenaProps } from "../kit";

/**
 * OS TRÊS MOTIVOS DE QUEM PERDE (aula 6, os ícones com função): cada um entra
 * na palavra que o nomeia, com opacidade e deslocamento curto; o falado fica
 * em destaque e os outros perdem ênfase; o grupo sai junto no fim da frase.
 * Acima da cabeça, empilhados, sem disputar espaço com nada.
 */
export const Frente: React.FC<CenaProps> = ({ ate }) => {
  const { t } = useTempo();
  const impulso = dito("impulso");
  const criterio = dito("sem critério");
  const riscos = dito("riscos");
  // o ativo é o último dito, até o próximo entrar
  const ativo = (inicio: number, proximo: number) => (t >= inicio && t < proximo ? 1 : 0.15 + 0.25 * k(t, proximo, proximo + 0.3));
  return (
    <>
      <Cartao t={t} inicio={impulso - 0.12} titulo={comoTitulo("impulso")} icone="relogio" x={90} y={130} largura={900} ativo={ativo(impulso, criterio)} saida={ate} tamanho={56} />
      <Cartao t={t} inicio={criterio - 0.12} titulo={comoTitulo("sem critério")} icone="lupa" x={90} y={330} largura={900} ativo={ativo(criterio, riscos)} saida={ate} tamanho={56} lado={1} />
      <Cartao t={t} inicio={riscos - 0.12} titulo={comoTitulo("riscos")} apoio={comoTitulo("que não entende")} icone="escudo" x={90} y={530} largura={900} ativo={ativo(riscos, ditoAte("entende") + 5)} saida={ate} tamanho={56} />
    </>
  );
};
