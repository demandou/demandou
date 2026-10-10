// Formato do plano de edição do modelo Canal (16:9, YouTube). O template renderiza qualquer vídeo
// a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Canal: a pessoa em quadro cheio com punch-ins alternados nos cortes (1,0 / 1,15 /
// 1,3), sempre seguindo o rosto; o REFRAME, a assinatura: a câmera aproxima e empurra a pessoa para
// um lado, e a informação ocupa a metade livre num painel de vidro; B-roll em tela cheia com
// movimento lento (`cena`); tarja de nome, títulos de capítulo, palavras-chave no lado livre e o
// lembrete de inscrição (sem sino). Sem legenda por padrão (`legendas: true` liga).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Os blocos de informação (topicos, passos, numero, comparacao, grafico,
// definicao, frase, pergunta) entram no reframe, como a assinatura.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";
import type { Lado } from "./tema";

type Base = {
  de: number;
  ate: number;
  // true = a legenda (quando ligada) continua durante o momento. Padrão: continua em cena,
  // capitulo, destaque e inscricao; some nos que mostram o texto da fala.
  legenda?: boolean;
  // de que lado fica a informação ("dir" ou "esq"). Padrão: o lado oposto ao rosto.
  lado?: Lado;
};

// ——— a assinatura ———

// Reframe: a câmera aproxima e empurra a pessoa para um lado; na metade livre, um painel com 1 a 4
// cartões que entram na fala (foto + número + nome). O da vez fica grande; os outros viram a trilha
// embaixo. Sem imagem, o cartão é tipográfico (número grande + nome). `titulo` aparece grande até o
// primeiro cartão e depois fica no cabeçalho.
export type ItemDoReframe = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };
export type Reframe = Base & { tipo: "reframe"; titulo?: string; itens: ItemDoReframe[]; numerar?: boolean };

// ——— os outros efeitos próprios ———

// B-roll em tela cheia com movimento lento; `rotulo` numa etiqueta de vidro no alto, com as barras
// de som andando.
export type Cena = Base & { tipo: "cena"; imagem: ImagemNoMomento; em?: number; rotulo?: string; rotuloEm?: number };

// Título de capítulo: cartão no lado livre, embaixo, com a barra de capítulos (um trecho por
// capítulo do plano; o da vez enche). `numero` só aparece se for pedido.
export type Capitulo = Base & { tipo: "capitulo"; texto: string; numero?: number | string; em?: number };

// Chamada: um chip discreto embaixo no lado livre (▶ + texto curto) que anuncia o que vem adiante
// ("No final: teste com barulho") e dá lugar ao capítulo ou ao bloco anunciado no mesmo lugar.
export type Chamada = Base & { tipo: "chamada"; texto: string; em: number };

// Lembrete de inscrição: o botão "Inscrever-se" no lado livre, o cursor entra e clica (`cliqueEm`)
// e ele vira "Inscrito". Sem sino. `canal`: o nome ao lado do avatar (padrão: marca.nome).
export type Inscricao = Base & { tipo: "inscricao"; texto?: string; em?: number; cliqueEm?: number; canal?: string };

// ——— os blocos universais, na linguagem do Canal ———

// O gancho: título grande no lado livre, palavra por palavra; `destaque` ganha o marcador cobalto.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };
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
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Palavra-chave: no lado livre, na altura do rosto, num chip de vidro com o traço cobalto
// (coral no alerta); o `detalhe` entra embaixo.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento. Com `icone: "seguir"` vira o lembrete de inscrição; os outros, um cartão no lado livre.
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Reframe
  | Cena
  | Capitulo
  | Chamada
  | Inscricao
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

// os que entram no reframe (a pessoa vai para o lado e o painel ocupa a metade livre)
export const NO_REFRAME = new Set(["reframe", "topicos", "passos", "numero", "comparacao", "grafico", "definicao", "frase", "pergunta"]);
export const noReframe = (m: Momento) => NO_REFRAME.has(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

// Câmera (opcional). Sem isto, a mesa de corte alterna sozinha: aberto ↔ fechado em cada corte,
// aberto em cada capítulo, médio no lembrete de inscrição e o reframe nos blocos de informação.
// Um item em `em` com `plano`/`zoom` começa um plano ali (num corte, escolhe a câmera daquele
// trecho; fora de um corte, é uma troca de câmera seca no meio da frase). `aproximar: true`:
// aproximação lenta até o próximo corte; `aproximar: 0.06`: punch-in de ênfase de 6% em até 0,8 s.
export type Camera = { em: number; plano?: "aberto" | "fechado" | "medio"; zoom?: number; aproximar?: boolean | number };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro e o quadro quando houver
  rosto: Rosto;
  zona?: { topo: number; altura: number };
  // tarja de nome e área (vazio = sem tarja); `de`/`ate` mudam quando ela aparece (padrão: no começo)
  marca: { nome: string; area: string; de?: number; ate?: number };
  // sons tonais baixos no reframe, no B-roll e no clique da inscrição (padrão: true)
  sfx?: boolean;
  // legenda embaixo, estilo legenda de player (padrão: false — no YouTube quem quer liga o CC)
  legendas?: boolean;
  cortesEm?: number[];
  camera?: Camera[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
