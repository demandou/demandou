// Formato do plano de edição do modelo Ranking. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Ranking. A assinatura é `ranking`: o placar do N ao 1 que se completa;
// a foto de cada posição toma a tela por ~1 s e voa para a casa dela.
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (em `corte` e `pop` ela já aparece;
  // `false` esconde)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— quadro cheio: a pessoa inteira, o texto na altura do peito ———

// Gancho escrito: entra inteiro nos primeiros ~1 s a partir de `em` (padrão: `de`).
// `destaque` = trecho exato que ganha a tarja. `imagem` (opcional) = o gancho por cima de uma foto em tela cheia.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento };

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
  // a foto em tela cheia atrás do número (vira um corte com o número por cima)
  imagem?: ImagemNoMomento;
};

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  imagem?: ImagemNoMomento;
};

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— imagem em cima, pessoa embaixo: a pessoa desce para a metade de baixo ———

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

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

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; imagem?: ImagemNoMomento };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— a assinatura ———

// Uma posição do ranking.
// `em` = quando a posição é dita ("em quinto"): o número bate no placar.
// `textoEm` = quando o nome é dito: a foto toma a tela (~1 s) e voa para a casa (padrão: em + 0,6).
// Sem `imagem` (ou com a imagem "sem"), um cartão tipográfico com o nome faz o mesmo caminho.
export type ItemDoRanking = {
  posicao: number;
  em: number;
  texto: string;
  textoEm?: number;
  detalhe?: string;
  detalheEm?: number;
  imagem?: ImagemNoMomento;
};

// Ranking: o placar do N ao 1 em cima, a pessoa embaixo. As casas vazias esperam desde o começo;
// a posição 1 fica escondida com "?" até ser revelada (`segredo: false` desliga).
// Vários momentos `ranking` com o mesmo `titulo` são o mesmo placar: o segundo já começa com as
// casas que o primeiro preencheu (dá para intercalar outros blocos entre as posições).
export type Ranking = Base & {
  tipo: "ranking";
  titulo?: string;
  tituloEm?: number;
  itens: ItemDoRanking[];
  // quantas casas o placar tem (padrão: a maior posição dita)
  total?: number;
  segredo?: boolean;
  // chamada final na área da pessoa, com o placar completo em cima (o momento vai até o fim do vídeo)
  fecho?: { texto: string; em: number };
  // segundos da foto em tela cheia (0,5 a 1,5; padrão 1; o 1º lugar fica 30% mais)
  tela?: number;
};

export type Momento = Abertura | Numero | Destaque | Frase | Cta | Topicos | Passos | Comparacao | Grafico | Definicao | Pergunta | Ranking;

// tipos que levam a pessoa para baixo do placar
export const TIPOS_EMBAIXO = ["ranking", "topicos", "passos", "comparacao", "grafico", "definicao", "pergunta"] as const;
export const pessoaEmbaixo = (m: Momento) => (TIPOS_EMBAIXO as readonly string[]).includes(m.tipo);
export const noPlacar = pessoaEmbaixo;

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
  // faixa abaixo do queixo (px, quadro 1080×1920): legenda e textos de quadro cheio ficam nela
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
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
