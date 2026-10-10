// Bloco universal `passos` (2 a 5 itens EM ORDEM): a linha de compassos com um passo em cada compasso,
// numerados. O pêndulo do metrônomo bate a cada passo dito, a seta de troca se desenha até o próximo e o
// passo da vez fica azul; embaixo do metrônomo, o título e o passo da vez ("2/3").
import type { Palavra, Passos as TPassos } from "../plano";
import type { Area } from "./Cena";
import { LinhaDeTextos } from "./LinhaDeTextos";

export const Passos: React.FC<{ m: TPassos; t: number; area: Area; lado: Area | null; fim: number; palavras: Palavra[] }> = ({
  m,
  t,
  area,
  lado,
  fim,
  palavras,
}) => {
  const itens = [...m.itens].sort((a, b) => a.em - b.em).slice(0, 5);
  const n = itens.length;
  const emCurso = (x: number) => {
    const k = itens.reduce((q, it, i) => (x >= it.em - 0.02 ? i : q), -1);
    if (k < 0) return { indice: -1, desde: 0, encher: 0 };
    const desde = itens[k].em;
    const ate = itens[k + 1]?.em ?? Math.max(desde + 0.8, fim - 0.1);
    return { indice: k, desde, encher: Math.min(1, (x - desde) / Math.max(0.3, ate - desde)) };
  };
  return (
    <LinhaDeTextos
      t={t}
      area={area}
      lado={lado}
      fim={fim}
      palavras={palavras}
      itens={itens}
      emCurso={emCurso}
      trocas={itens.slice(1).map((it) => it.em - 0.05)}
      batidas={itens.map((it) => ({ em: it.em, andamento: 0 }))}
      andamentos={1}
      rolante={itens.map((it, i) => ({ em: it.em, texto: `${i + 1}/${n}` }))}
      titulo={m.titulo}
      de={m.de}
    />
  );
};
