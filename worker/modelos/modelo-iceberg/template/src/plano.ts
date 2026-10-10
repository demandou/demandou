// Formato do plano de edição do modelo Iceberg. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O vídeo inteiro acontece num mundo só: um iceberg ilustrado no mar, com a câmera mergulhando.
// A pessoa fica numa janela flutuante embaixo, que desce junto. Os 11 blocos universais
// (abertura, topicos, passos, numero, comparacao, grafico, destaque, definicao, frase, pergunta, cta)
// têm os mesmos campos em todos os modelos do pack (references/plano.md); aqui eles viram lajes de
// gelo na água, linha de sonar, medidor e a linha d'água. A assinatura é `iceberg`.
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— a assinatura ———

// Um nível do iceberg: a câmera desce até ele em `desceEm` (padrão: ~1 s antes de `em`) e o
// cartão com a foto e o nome aparece em `em`. `rotulo` = a etiqueta do nível, com palavras da fala
// ("Na superfície", "Lá no fundo"). `detalhes` entram um a um embaixo do nome.
// `inset` = uma segunda foto pequena, redonda, no canto da foto (ex.: os grãos).
// `profundidade` = o número do medidor neste nível (decorativo; padrão 0, 50, 200, 800, 2.000, 5.000).
export type Nivel = {
  nome: string;
  em: number;
  imagem?: ImagemNoMomento;
  rotulo?: string;
  detalhes?: { texto: string; em: number; destaque?: boolean }[];
  inset?: { imagem: ImagemNoMomento; em: number; rotulo?: string };
  desceEm?: number;
  profundidade?: number;
};

// Iceberg: 2 a 6 níveis, do mais conhecido (superfície) ao mais obscuro (fundo).
// Antes do primeiro nível a câmera mostra o iceberg inteiro com "?" em cada nível.
// `resumoEm` (opcional): a câmera se afasta e mostra o iceberg inteiro com as fotos (antes do `ate`).
// `unidade` do medidor (padrão "m").
export type Iceberg = Base & { tipo: "iceberg"; titulo?: string; niveis: Nivel[]; resumoEm?: number; unidade?: string };

// ——— os blocos universais ———

// Abertura: título que se monta palavra a palavra sobre o iceberg inteiro (céu claro, tinta escura).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

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

export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
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

export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento = Iceberg | Abertura | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Frase | Pergunta | Cta;

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
  // faixa abaixo do queixo (o Iceberg não usa: a pessoa fica na janela)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
