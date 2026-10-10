// Formato do plano de edição do modelo Yap. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Yap: a pessoa em quadro cheio o vídeo inteiro, a legenda logo abaixo do queixo
// (a palavra falada ganha uma tarja suave) e as inserções entrando na altura do peito, ao lado
// do ombro, sem nunca cobrir o rosto. A câmera reenquadra em cada corte.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é a `insercao` (a imagem do que a pessoa cita).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Lado do ombro em que um cartão entra. "centro" = no meio do peito.
export type Lado = "esq" | "dir" | "centro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão do Yap: continua nas inserções e nos cartões (numero, destaque, comparacao, topicos,
  // passos, grafico, definicao); some na abertura, frase, pergunta e cta (eles mostram a fala).
  legenda?: boolean;
};

// ——— a assinatura ———

// A imagem do que a pessoa está citando. `em` = quando a coisa é dita.
export type Insercao = Base & {
  tipo: "insercao";
  imagem: ImagemNoMomento;
  em: number;
  // "cartao" (padrão): cartão na altura do peito, ao lado do ombro.
  // "tela": corte de 0,8 a 1,2 s para a imagem em tela cheia (a legenda continua por cima).
  forma?: "cartao" | "tela";
  // lado do cartão; sem ele, os cartões seguidos alternam dir → esq → dir
  lado?: Lado;
  // nome curto da coisa, numa etiqueta presa ao cartão ("Prensa francesa")
  rotulo?: string;
  rotuloEm?: number;
  // marcador curto no canto do cartão: "1", "2", "3" (itens de uma lista falada)
  etiqueta?: string;
};

// ——— os blocos universais, na linguagem do Yap ———

// Título do gancho: entra no lugar da legenda, maior, palavra por palavra; `destaque` ganha a tarja.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: cartão claro no peito, cada linha acende no seu `em`.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; lado?: Lado };

// Sequência: as etapas numeradas, ligadas por um fio que avança.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; lado?: Lado };

// Número que conta até `valor` a partir de `em`. `titulo` (do Yap): a linha pequena acima do número.
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
  titulo?: string;
  lado?: Lado;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
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
  // números DITOS (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  lado?: Lado;
};

// Chip de palavra-chave: uma pílula na altura do peito. "alerta" = pílula escura.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  lado?: Lado;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; lado?: Lado };

// Frase de efeito: cartão claro com a fala palavra por palavra; `risco` é riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// `opcoes[].imagem` (do Yap, opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Insercao
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Cta;

export type Palavra = { em: number; ate: number; w: string };

// Reenquadramento (opcional). Sem isto, a câmera alterna sozinha 1,0 / 1,12 / 1,22 em cada corte.
// Um item em `em` começa um enquadramento novo ali: num corte, escolhe o zoom daquele trecho;
// fora de um corte, é um "soco" de câmera na palavra (use pouco, nas ênfases).
// `aproximar`: aproximação lenta (até ~5%) durante o trecho.
export type Camera = { em: number; zoom?: number; aproximar?: boolean };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro quando houver
  rosto: Rosto;
  // faixa abaixo do queixo (o motor calcula; o Yap usa só como referência do queixo)
  zona?: { topo: number; altura: number };
  // tarja de nome e área no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  // whoosh tonal baixo quando uma imagem entra (padrão: true)
  sfx?: boolean;
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  camera?: Camera[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
