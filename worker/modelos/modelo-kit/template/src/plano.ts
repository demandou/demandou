// Formato do plano de edição do modelo Kit. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A tela é um tampo de mesa visto de cima; a pessoa fica numa moldura larga embaixo. Cada momento
// é um pedaço da mesa: a câmera desliza de um para o outro e o que é dito cai no tampo, com sombra.
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é `kit`.
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// Título escrito numa folha presa com fita, palavra por palavra na fala (a partir de `em`, padrão `de`).
// `destaque` = trecho exato que ganha o marca-texto azul.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Etiquetas de papel que caem uma a uma no tampo (2 a 5 itens).
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
// Etiquetas numeradas ligadas por um barbante, em ordem (2 a 5 itens).
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Etiqueta de preço com furo e barbante: o número conta a partir de `em`.
export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— a assinatura ———

// Kit: a mesa com um lugar marcado para cada coisa (2 a 6). No `em` de cada item a câmera chega no
// lugar dele, o objeto cai com sombra, uma linha leva até a etiqueta (nome + `detalhe` em `detalheEm`,
// `preco` opcional) e o contador anda ("1 de 4"). Em `afastarEm` a câmera se afasta e mostra tudo;
// `total` (opcional) é a linha que fecha o kit, em `totalEm`.
// Sem `imagem` (ou sem imagem boa), o item vira um cartão tipográfico com o nome.
export type ItemDoKit = {
  nome: string;
  em: number;
  detalhe?: string;
  detalheEm?: number;
  preco?: string;
  imagem?: ImagemNoMomento;
};
export type Kit = Base & {
  tipo: "kit";
  titulo?: string;
  itens: ItemDoKit[];
  // instante em que os lugares vazios (contorno pontilhado) aparecem; padrão: `de` + 0,2
  lugaresEm?: number;
  afastarEm?: number;
  total?: string;
  totalEm?: number;
};

export type Momento = Abertura | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Frase | Pergunta | Cta | Kit;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o motor calcula; este modelo reposiciona a pessoa e não usa)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // false = sem barra de progresso no topo
  progresso?: boolean;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
