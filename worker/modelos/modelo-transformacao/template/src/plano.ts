// Formato do plano de edição do modelo Transformação. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Transformação. A assinatura é
// `antesdepois`: a foto grande com a cortina ANTES | DEPOIS, a alça que anda com a fala,
// os marcadores numerados que aproximam cada área e a revelação final.
import type { Foco, ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— quadro cheio: a pessoa inteira, o texto num cartão na altura do peito ———

// Título que se monta palavra por palavra na fala, a partir de `em` (padrão: `de`).
// `destaque` = trecho exato que ganha o verde.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— painel de linho em cima, pessoa numa moldura larga embaixo ———

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

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

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— a assinatura ———

// Uma dica na foto: no `em` a câmera aproxima a área `foco` (frações da foto: 0,0 = canto de cima
// à esquerda), a área aparece no ANTES e a alça varre para o DEPOIS enquanto o `texto` é dito.
// `ponto` = onde fica o marcador numerado (padrão: o foco). `zoom` 1,3 a 3 (padrão 2).
export type Marcador = {
  texto: string;
  em: number;
  foco: Foco;
  zoom?: number;
  ponto?: Foco;
  detalhe?: string;
  detalheEm?: number;
};

// Antes e depois: a foto grande com a cortina. A pessoa fica numa moldura larga embaixo;
// a partir de `janelaEm` a foto toma a tela inteira e a pessoa vai para uma janela (a revelação).
// `alca`: onde a alça está em cada instante dito (pos 0 = só o antes, 1 = só o depois, 0,5 = meio a meio).
// `rotulos`: os nomes dos dois lados (padrão "ANTES" e "DEPOIS"; ex.: "JANEIRO" e "JUNHO").
export type AntesDepois = Base & {
  tipo: "antesdepois";
  antes: ImagemNoMomento;
  depois: ImagemNoMomento;
  rotulos?: [string, string];
  alca?: { em: number; pos: number }[];
  marcadores?: Marcador[];
  janelaEm?: number;
};

export type Momento =
  | Abertura
  | Numero
  | Destaque
  | Frase
  | Cta
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Definicao
  | Pergunta
  | AntesDepois;

// tipos que põem o painel de linho em cima e a pessoa embaixo
export const TIPOS_PAINEL = ["topicos", "passos", "comparacao", "grafico", "definicao", "pergunta", "antesdepois"] as const;
export const noPainel = (m: Momento) => (TIPOS_PAINEL as readonly string[]).includes(m.tipo);

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
  // faixa abaixo do queixo (px, quadro 1080×1920): os cartões do quadro cheio ficam nela
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche): cada corte troca o enquadramento de leve
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
