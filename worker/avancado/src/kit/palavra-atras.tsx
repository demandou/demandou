import React from "react";
import { useApresentador } from "./apresentador";
import { ALTURA, LARGURA } from "./dados";
import { LETRA } from "./letra";
import { Letreiro, useTamanhoQueCabe } from "./texto";

/**
 * A PALAVRA GIGANTE ATRÁS DA CABEÇA, POSICIONADA PELO KIT (12/10/2026, a prova
 * do Bruno: a cena punha a palavra na altura do rosto e a cabeça cobria o meio
 * das letras, "CONC...ENTE" ilegível). A regra da aula 8.2 em código: a base
 * das letras fica 60 px abaixo do topo da cabeça, centrada na largura do
 * quadro, para a cabeça cobrir só o pé das letras do meio. O tamanho encolhe
 * até caber. Vai no `Atras` da cena (o recorte cobre de verdade).
 */
export const PalavraAtrasDaCabeca: React.FC<{
  texto: string;
  t: number;
  inicio: number;
  cor: string;
  /** O tamanho pedido da letra (encolhe até caber na largura). */
  tamanho?: number;
  mascaraHorizontal?: boolean;
}> = ({ texto, t, inicio, cor, tamanho = 230, mascaraHorizontal = false }) => {
  const ap = useApresentador();
  const margem = 48;
  const largura = LARGURA - 2 * margem;
  const cabe = useTamanhoQueCabe(texto, largura, tamanho, { familia: LETRA.titulo, peso: 900, minimo: 60 });
  const topoDaCabeca = ap.cabeca?.topo ?? ALTURA * 0.29;
  // a altura da maiúscula é ~0,72 da letra: a base dela 60 px abaixo do topo da cabeça
  const base = topoDaCabeca + 60;
  const topo = Math.max(24, Math.round(base - cabe * 0.86));
  return (
    <div style={{ position: "absolute", left: margem, width: largura, top: topo, textAlign: "center", fontFamily: LETRA.titulo, fontWeight: 900, lineHeight: 1 }}>
      <Letreiro texto={texto} t={t} inicio={inicio} cor={cor} tamanho={cabe} largura={largura} mascaraHorizontal={mascaraHorizontal} />
    </div>
  );
};
