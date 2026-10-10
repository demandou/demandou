// Formato do plano de edição do modelo Multicâmera. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Multicâmera: duas câmeras virtuais na pessoa (plano aberto ~1,0 e fechado ~1,3)
// que se alternam em cada corte e em cada mudança de assunto, sempre seguindo o rosto; a "câmera C"
// corta para a imagem do que é citado, em tela cheia e com movimento lento (`cena`); títulos de
// capítulo discretos numa tarja (`capitulo`); legenda mínima embaixo; o resto em tarjas e painéis
// grafite no terço de baixo, como o pacote gráfico de um canal bem editado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é `cena` + `capitulo` (e a câmera, que é automática).
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

// Corte para a "câmera C": a imagem do que é citado ocupa a tela, com movimento lento.
// "cheia": a foto cobre a tela (foto em pé ou grande). "faixa": a foto inteira na largura da tela,
// sobre um fundo feito dela mesma, desfocado e escurecido (foto deitada ou pequena). Sem `forma`,
// o template escolhe pela proporção e pelo tamanho da foto.
export type Cena = Base & {
  tipo: "cena";
  imagem: ImagemNoMomento;
  // quando a coisa é dita (a cena costuma começar nela ou num corte logo antes)
  em?: number;
  forma?: "cheia" | "faixa";
  // nome curto numa tarja no alto ("Site da empresa")
  rotulo?: string;
  rotuloEm?: number;
};

// Título de capítulo numa tarja discreta: o número no quadrado vermelho e o título ao lado.
// Marca a mudança de assunto (e a câmera abre nela). `numero` padrão: a ordem dos capítulos.
export type Capitulo = Base & { tipo: "capitulo"; texto: string; numero?: number | string; em?: number };

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
  | Capitulo
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

// Câmera (opcional). Sem isto, a mesa de corte alterna sozinha: fechado no gancho, aberto em cada
// capítulo, e aberto ↔ fechado em cada corte (nunca a mesma câmera duas vezes seguidas).
// Um item em `em` começa um plano ali: num corte, escolhe a câmera daquele trecho; fora de um
// corte, é uma troca de câmera no meio da frase (use pouco, numa ênfase).
// `aproximar`: aproximação lenta a partir de `em` até o próximo corte (até ~5%).
export type Camera = { em: number; plano?: "aberto" | "fechado" | "medio"; zoom?: number; aproximar?: boolean };

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
  // tarja de nome e área no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  // som tonal baixo no corte para a cena (padrão: true)
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
