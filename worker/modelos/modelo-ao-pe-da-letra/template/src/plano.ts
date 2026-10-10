// Formato do plano de edição do modelo Ao Pé da Letra. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Ao Pé da Letra: papel creme sobre o
// vermelho-carimbo e o azul-céu no que está em outra língua. A assinatura é `literal`: duas
// imagens lado a lado, "AO PÉ DA LETRA" (carimbada com NÃO) e "O QUE QUER DIZER".
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— cartão no peito (a pessoa em quadro cheio) ———

// `em` (opcional) nos blocos que se montam na fala: quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

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
  imagem?: ImagemNoMomento;
};

export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
  // opcional: a transcrição fonética do termo, em Charis SIL
  fonetica?: string;
  imagem?: ImagemNoMomento;
};

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— painel em cima + a pessoa numa moldura larga embaixo ———

type BasePainel = Base & {
  // o assunto do painel, em caixa alta lilás
  rotulo?: string;
  titulo?: string;
};

// Lista sem ordem: cada linha entra no seu `em` e o ponto pula para ela.
export type Topicos = BasePainel & { tipo: "topicos"; itens: Item[] };

// Sequência: linhas numeradas ligadas por um traço; o ponto desce pelo traço até a etapa dita.
export type Passos = BasePainel & { tipo: "passos"; itens: Item[] };

export type Comparacao = BasePainel & {
  tipo: "comparacao";
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  // quem ganha: traço desenhado embaixo. Em "errado-certo" o outro lado leva o risco coral.
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = BasePainel & {
  tipo: "grafico";
  forma: "barras" | "linha" | "pizza";
  // números DITOS, cada um no seu `em` (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: uma onda que mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Um dos lados da assinatura: o que a imagem mostra e o texto embaixo dela.
export type Lado = {
  texto: string;
  // quando o texto começa a ser dito: a imagem e o texto entram aí
  em: number;
  // uma linha menor embaixo (a tradução, o sentido), com o seu instante
  detalhe?: string;
  detalheEm?: number;
  // sobrescreve o rótulo do cartão ("o certo em inglês" no lugar de "o que quer dizer")
  rotulo?: string;
  imagem?: ImagemNoMomento;
  // é o jeito certo: ganha o traço desenhado embaixo e a moldura azul
  certo?: boolean;
};

// A assinatura: o literal contra o real. `expressao` é a expressão original, digitada no alto.
// O cartão da esquerda é o "ao pé da letra", carimbado com NÃO quando `carimboEm` chega.
// O da direita é "o que quer dizer"; se tiver mais de um passo em `quer`, cada passo toma o
// lugar do anterior (ex.: o sentido do inglês e depois "o certo em inglês").
export type Literal = Base & {
  tipo: "literal";
  expressao: string;
  expressaoEm?: number;
  ao: Lado;
  // quando o NÃO bate no cartão da esquerda (padrão: um instante depois do texto)
  carimboEm?: number;
  quer: Lado[];
};

export type Momento =
  | Abertura
  | Numero
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Cta
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Literal;

export type MomentoDePainel = Topicos | Passos | Comparacao | Grafico | Literal;
export const TIPOS_DE_PAINEL = ["topicos", "passos", "comparacao", "grafico", "literal"] as const;
export const ehPainel = (m: Momento): m is MomentoDePainel => (TIPOS_DE_PAINEL as readonly string[]).includes(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto no JSON (tipo Rosto de ./motor/caixa)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo onde entram os cartões de quadro cheio (px, quadro 1080×1920)
  zona?: { topo: number; altura: number };
  // nome na moldura da pessoa e rótulo da abertura
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  // trechos falados na outra língua (inglês, espanhol…): a legenda os pinta na cor
  idioma2?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
  // troca os textos fixos da tela (ex.: vídeo em espanhol): veja references/plano.md
  rotulos?: Partial<Record<
    | "expressoes" | "ao" | "querDizer" | "certoEm" | "nao" | "quer" | "guarde"
    | "atencao" | "numero" | "numeros" | "voce" | "ilustrativo" | "certo" | "compare" | "naoEE",
    string
  >>;
};
