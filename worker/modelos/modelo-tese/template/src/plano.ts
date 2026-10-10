// Formato do plano de edição do modelo Multicâmera. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática da Tese: o vídeo é uma tela dividida do primeiro ao último quadro (o rosto sempre
// aparece, o gancho também). Em cima, 45% da altura: a imagem (`cena`) preenchendo a
// moldura ou o texto de um bloco; embaixo, a pessoa bem centralizada. Só na virada e na pergunta
// direta entra o rosto fechado em tela cheia (`fechado`, ~2 s). Não há B-roll em tela cheia.
// Legenda minúscula branca com contorno, sempre no mesmo lugar.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles viram texto branco sobre o palco escuro da faixa de cima.
// A assinatura é `cena` + `fechado`.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão: continua em cena, capitulo, numero e destaque; some nos que mostram texto próprio.
  legenda?: boolean;
};

// ——— a assinatura ———

// A imagem do que é citado na faixa de cima (1080×864), preenchendo a moldura (cover, com o foco
// da imagem). Entra na palavra que a nomeia (`de` ≈ `em`, ±0,15 s). Push-in lento (5 a 8%).
export type Cena = Base & {
  tipo: "cena";
  imagem: ImagemNoMomento;
  // quando a coisa é dita (a cena costuma começar nela)
  em?: number;
};

// Rosto fechado em tela cheia: a virada ("mas o mais louco é...") e a pergunta direta. ~2 s.
export type Fechado = Base & { tipo: "fechado"; em?: number };

// ——— os blocos universais, na linguagem do Multicâmera ———

// O gancho: título grande no terço de baixo, palavra por palavra; `destaque` ganha o traço vermelho.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: painel grafite, cada linha entra no seu `em`; a da vez em branco, as outras em cinza.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência: as etapas numeradas, ligadas por um fio que desce até a da vez.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta até `valor` a partir de `em`. `titulo` (deste modelo): a linha pequena acima.
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
};

// Palavra-chave numa tarja. "alerta" = tarja vermelha.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito: painel com a fala palavra por palavra; `risco` é riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Cena
  | Fechado
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
  // faixa abaixo do queixo (o motor calcula; este modelo usa só como referência)
  zona?: { topo: number; altura: number };
  // a Tese não mostra nome nem área (o Reel não tem rótulo); fica por contrato do motor
  marca: { nome: string; area: string };
  // sem uso na Tese (o Reel não tem efeitos sonoros); fica por contrato do motor
  sfx?: boolean;
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
