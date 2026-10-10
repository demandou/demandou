// Formato do plano de edição do modelo Narrador. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Narrador: a voz conta a história e as IMAGENS carregam o vídeo. De 50% a 70% do
// tempo, uma foto em tela cheia anda devagar (aproxima, afasta ou corre) enquanto a fala segue;
// datas e lugares entram como letreiros; a pessoa volta em quadro cheio nas frases-chave.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é a `cena` (a imagem em tela cheia) com o `letreiro`.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão do Narrador: continua nas cenas e nos letreiros (a voz segue por cima da imagem);
  // some nas pranchas e nos textos sobre a pessoa (eles já mostram a fala).
  legenda?: boolean;
};

// ——— a assinatura ———

// A imagem em tela cheia que carrega a história enquanto a voz segue.
export type Cena = Base & {
  tipo: "cena";
  imagem: ImagemNoMomento;
  // quando a coisa mostrada é dita (padrão: `de`)
  em?: number;
  // legenda de museu, pequena, no alto: o que a imagem mostra ("A torre em construção")
  rotulo?: string;
  rotuloEm?: number;
  // como a cena entra: "dissolver" (padrão, 0,3 s), "corte" (seco) ou "cortina" (varre da esquerda)
  transicao?: "dissolver" | "corte" | "cortina";
  // panorâmica: para que lado a câmera corre (quando `imagem.efeito` = "panoramica")
  direcao?: "esquerda" | "direita" | "cima" | "baixo";
};

// Data, lugar ou nome de capítulo em letreiro: `texto` grande em serifa ("Paris, 1889") e `sub`
// pequeno em versalete acima dele ("Exposição Universal"). Cada um entra quando é dito.
export type Letreiro = Base & {
  tipo: "letreiro";
  texto: string;
  em: number;
  sub?: string;
  subEm?: number;
  // "alto" (sobre a imagem) ou "baixo" (sobre a pessoa, abaixo do queixo). Padrão: "alto" quando
  // há uma cena por baixo, "baixo" quando é a pessoa.
  posicao?: "alto" | "baixo";
};

// ——— os blocos universais, na linguagem do Narrador ———

// Pranchas (numero, topicos, passos, comparacao, grafico, definicao): ocupam a tela inteira.
// Fundo: a `imagem` do bloco (escurecida, andando devagar); sem ela, a cena que estiver por baixo
// (escurecida); sem cena, a prancha escura lisa.
type Prancha = { imagem?: ImagemNoMomento };

// Título da abertura sobre a pessoa (ou sobre a `imagem`), palavra por palavra, em serifa.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento };

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: índice de museu, um item por linha, cada um entra no seu `em`.
export type Topicos = Base & Prancha & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência: as etapas numeradas, ligadas por um fio vertical que desce até a atual.
export type Passos = Base & Prancha & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta até `valor` a partir de `em`. `titulo` (do Narrador): a linha pequena acima.
export type Numero = Base &
  Prancha & {
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
  };

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
export type Comparacao = Base &
  Prancha & {
    tipo: "comparacao";
    titulo?: string;
    modo?: "contra" | "antes-depois" | "errado-certo";
    lados: [LadoDaComparacao, LadoDaComparacao];
    vencedor?: 0 | 1;
    vencedorEm?: number;
  };

export type Grafico = Base &
  Prancha & {
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
  };

export type Definicao = Base & Prancha & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Sobre a pessoa (ela volta em quadro cheio): a frase-chave em serifa, abaixo do queixo.
// "alerta" = o texto na cor de ênfase.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Citação em itálico, palavra por palavra; `destaque` na cor de ênfase; `risco` riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Cena
  | Letreiro
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

// Reenquadramento (opcional). Sem isto, a câmera alterna sozinha 1,0 / 1,12 / 1,25 em cada corte e
// em cada volta de uma imagem. Um item em `em` começa um enquadramento novo ali; `aproximar` faz
// uma aproximação lenta (até ~5%) no trecho (use nas ênfases).
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
  // faixa abaixo do queixo (o motor calcula; o Narrador usa só como referência do queixo)
  zona?: { topo: number; altura: number };
  // tarja de nome e área no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  // som tonal baixo quando a pessoa sai e a primeira imagem entra (padrão: true)
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
