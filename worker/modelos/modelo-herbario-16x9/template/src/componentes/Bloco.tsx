// Os blocos universais que ganham uma prancha: lista, passos, número, comparação, gráfico e definição.
// Todos seguem a gramática do modelo: a pessoa no oval (canto direito ou esquerdo), o cabeçalho do
// outro lado (rótulo em versalete, fio de pena, título que ganha tinta na fala) e o desenho no corpo
// da prancha, de 700 px até a interface do app. A prancha chega com a câmera, já a lápis.
import { prog } from "../anim";
import { CABECALHO, VIAGEM } from "../layout";
import type { Momento, Palavra } from "../plano";
import { Cabecalho } from "./Cabecalho";
import { Comparacao } from "./blocos/Comparacao";
import { Definicao } from "./blocos/Definicao";
import { Grafico } from "./blocos/Grafico";
import { Lista } from "./blocos/Lista";
import { Medida } from "./blocos/Medida";
import { Passos } from "./blocos/Passos";

export type PropsDoBloco = {
  t: number;
  palavras: Palavra[];
  // quando a câmera chega nesta prancha
  chegada: number;
  // onde está o oval ("canto" = direita, "lado" = esquerda); o cabeçalho fica do outro lado
  layout: "canto" | "lado";
  // número da figura (para o rótulo padrão "Fig. N")
  numeroFig: number;
};

// O cabeçalho de um bloco: entra depois que o oval assentou (nunca passa por baixo dele)
export const CabecalhoDoBloco: React.FC<
  PropsDoBloco & {
    de: number;
    ate: number;
    rotulo: string;
    titulo?: string;
    tituloEm?: number;
    destaque?: string;
    italico?: boolean;
    indice?: { total: number; atual: number };
  }
> = ({ t, palavras, chegada, layout, de, ate, rotulo, titulo, tituloEm, destaque, italico, indice }) => {
  const entra = chegada > 0.05 ? prog(t, chegada + VIAGEM * 0.8, 0.32) : 1;
  if (entra <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra, translate: `${(1 - entra) * 50}px 0` }}>
      <Cabecalho
        area={CABECALHO[layout]}
        rotulo={rotulo}
        titulo={titulo ?? []}
        tituloEm={tituloEm}
        italico={italico}
        destaque={destaque}
        indice={indice}
        palavras={palavras}
        de={de}
        ate={ate}
        chegada={chegada}
        t={t}
        saida={0}
      />
    </div>
  );
};

export const BlocoNaPrancha: React.FC<PropsDoBloco & { m: Momento }> = ({ m, ...p }) => {
  switch (m.tipo) {
    case "topicos":
      return <Lista m={m} {...p} />;
    case "passos":
      return <Passos m={m} {...p} />;
    case "numero":
      return <Medida m={m} {...p} />;
    case "comparacao":
      return <Comparacao m={m} {...p} />;
    case "grafico":
      return <Grafico m={m} {...p} />;
    case "definicao":
      return <Definicao m={m} {...p} />;
    default:
      return null;
  }
};
