import { DesenhoCena } from "../desenho/Cena";
import type { Regiao } from "../layout";
import type { Cena, Layout, Palavra, Planta } from "../plano";
import { Comodos } from "./Comodos";
import { Folha } from "./Folha";

// Momento "planta", a assinatura do modelo: cabeçalho da prancha (① + título falado) e o desenho que
// acontece no ritmo da fala. Dois modos: planta livre (`comodos`, qualquer assunto) ou desenho técnico
// (`ambiente` + `objetos`, em centímetros).
export const PlantaMomento: React.FC<{
  m: Planta;
  t: number;
  regiao: Regiao;
  layout: Layout;
  palavras: Palavra[];
}> = ({ m, t, regiao, layout, palavras }) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao} numero={m.numero} titulo={m.titulo} subtitulo={m.subtitulo}>
    {(corpo) =>
      m.comodos?.length ? (
        <Comodos comodos={m.comodos} t={t} de={m.de} corpo={corpo} bloqueado={m.percurso?.bloqueado} bloqueioEm={m.percurso?.bloqueioEm} />
      ) : m.ambiente ? (
        <DesenhoCena cena={{ ...(m as Cena), objetos: m.objetos ?? [] }} regiao={corpo} t={t} inicio={m.de} />
      ) : null
    }
  </Folha>
);
