import type { BlocoCompleto } from "../plano";
import type { PropsBloco } from "./comum";
import { Comparacao } from "./Comparacao";
import { Cta } from "./Cta";
import { Definicao } from "./Definicao";
import { Destaque } from "./Destaque";
import { Frase } from "./Frase";
import { Grafico } from "./Grafico";
import { Grupo } from "./Grupo";
import { Lista } from "./Lista";
import { Marca } from "./Marca";
import { Numero } from "./Numero";
import { Pergunta } from "./Pergunta";
import { Prato } from "./Prato";
import { Selo } from "./Selo";
import { Titulo } from "./Titulo";

// Desenha o conteúdo de um bloco conforme o tipo.
export const ConteudoDoBloco: React.FC<PropsBloco<BlocoCompleto>> = (props) => {
  const { b } = props;
  switch (b.tipo) {
    case "abertura":
    case "titulo":
      return <Titulo {...props} b={b} />;
    case "topicos":
    case "passos":
    case "lista":
      return <Lista {...props} b={b} />;
    case "numero":
      return <Numero {...props} b={b} />;
    case "comparacao":
      return <Comparacao {...props} b={b} />;
    case "grafico":
      return <Grafico {...props} b={b} />;
    case "destaque":
      return <Destaque {...props} b={b} />;
    case "definicao":
      return <Definicao {...props} b={b} />;
    case "frase":
      return <Frase {...props} b={b} />;
    case "pergunta":
      return <Pergunta {...props} b={b} />;
    case "cta":
      return <Cta {...props} b={b} />;
    case "partes":
    case "prato":
      return <Prato {...props} b={b} />;
    case "grupo":
      return <Grupo {...props} b={b} />;
    case "selo":
      return <Selo {...props} b={b} />;
    case "marca":
      return <Marca {...props} b={b} />;
  }
};
