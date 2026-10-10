import React from "react";
import { comoTitulo, dito, janela, k, LETRA, MARCA, mix, PainelDeDado, TituloQueCabe, useTempo, type CenaProps } from "../kit";

/**
 * O CARD DA FRASE-CHAVE (aula 6, a inserção 3: "mercado subindo não
 * significa dinheiro no seu bolso"): as duas metades da frase, ditas, com o
 * sinal de diferente entre elas. A primeira entra em "subindo", o sinal se
 * desenha em "não significa", a segunda entra em "dinheiro". Uma inserção só.
 */
export const Frente: React.FC<CenaProps> = ({ de, ate }) => {
  const { t } = useTempo();
  const v = janela(t, de, ate, 0.45, 0.4);
  if (v.visivel <= 0) return null;
  const sobe = k(t, dito("subindo"), dito("subindo") + 0.4);
  const diferente = k(t, dito("não significa"), dito("não significa") + 0.5);
  const bolso = k(t, dito("dinheiro"), dito("dinheiro") + 0.45);
  return (
    <PainelDeDado x={80} y={150} largura={920} altura={500} visivel={v.visivel}>
      <div style={{ position: "absolute", left: 50, top: 60, opacity: sobe, translate: `${mix(-30, 0, sobe)}px 0px` }}>
        <TituloQueCabe texto={comoTitulo("mercado subindo")} largura={820} maximo={96} cor={MARCA.titulo} peso={900} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 920,
          top: 170,
          textAlign: "center",
          fontFamily: LETRA.titulo,
          fontWeight: 900,
          fontSize: 120,
          color: MARCA.destaque,
          opacity: diferente,
          scale: mix(0.6, 1, diferente),
        }}
      >
        ≠
      </div>
      <div style={{ position: "absolute", left: 50, top: 330, opacity: bolso, translate: `${mix(30, 0, bolso)}px 0px` }}>
        <TituloQueCabe texto={comoTitulo("dinheiro no seu bolso")} largura={820} maximo={88} cor={MARCA.destaque} peso={900} />
      </div>
    </PainelDeDado>
  );
};
