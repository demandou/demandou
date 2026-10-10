// Formato do plano de edição do modelo Devocional. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: uma página de livro de devoção em cima e a pessoa embaixo, numa moldura larga.
// Cada bloco é escrito na página, palavra por palavra, em serifada grande e bem espaçada; a palavra-
// chave acende; entre um bloco e outro a página vira. Poeira de luz e uma luz lenta passeiam só no
// fundo gráfico (a página), nunca na pessoa.
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md) e aqui ganham a linguagem da página. A assinatura é o `versiculo`
// (citação + referência + página cheia); junto vem a `luz` (uma palavra que acende grande).
import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, a página mostra a fala)
  legenda?: boolean;
};

// Desenhos de traço fino (vetor) que se desenham na palavra que os nomeia. Opcionais.
export type Desenho = "amanhecer" | "vela" | "livro" | "ramo" | "coracao" | "caminho" | "lua" | "semente";

// Um desenho preso a um bloco: entra em `desenhoEm` (a palavra que ele mostra) ou junto com o bloco.
type ComDesenho = { desenho?: Desenho; desenhoEm?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// ——— a assinatura ———

// Um pedaço da referência que entra quando é dito ("Mateus" → "11" → ":28").
export type ParteDaReferencia = { texto: string; em: number };

// O versículo (ou citação): a página cresce (a moldura da pessoa desce) e o texto é escrito
// palavra por palavra na fala, sobre o texto inteiro "a lápis". `texto` = EXATAMENTE o que foi dito.
// `destaque` = o trecho que acende (na palavra dita, ou em `destaqueEm`).
// `chamada` (só se for dita): "Está escrito", "Como dizia minha avó" (versalete no alto).
// `referencia` (só se for dita): "Mateus 11:28", "C. S. Lewis"; `referenciaPartes` monta a
// referência na fala. `obra` (modo livro): o título do livro, em itálico.
// `modo`: "escritura" (capitular + referência em versalete; padrão quando há referência),
// "livro" e "autor" (aspas grandes + travessão com a fonte), "reflexao" (sem fonte: um ornamento).
export type Versiculo = Base & {
  tipo: "versiculo";
  texto: string;
  em?: number;
  destaque?: string;
  destaqueEm?: number;
  chamada?: string;
  chamadaEm?: number;
  referencia?: string;
  referenciaEm?: number;
  referenciaPartes?: ParteDaReferencia[];
  obra?: string;
  obraEm?: number;
  modo?: "escritura" | "livro" | "autor" | "reflexao";
};

// A luz: uma frase curta escrita pequena e, no meio dela, UMA palavra (`palavra`) que acende enorme
// em `palavraEm`, com a luz subindo atrás dela. `detalhe` = uma linha pequena opcional embaixo.
export type Luz = Base &
  ComDesenho & {
    tipo: "luz";
    texto: string;
    palavra: string;
    em?: number;
    palavraEm: number;
    detalhe?: string;
    detalheEm?: number;
  };

// ——— os 11 blocos universais ———

export type Abertura = Base & ComDesenho & { tipo: "abertura"; texto: string; destaque?: string; em?: number };
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
export type Destaque = Base & ComDesenho & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & ComDesenho & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };
// Sem `icone`, o ícone vem do verbo do texto: manda/envia/compartilha/marca → carta;
// comenta/escreve → balão; salva/guarda → marcador; segue → +; link/clica/toca → elo.
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Versiculo
  | Luz
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
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: Rosto;
  // faixa abaixo do queixo (o Devocional não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: a tarja no alto da moldura, nos primeiros segundos (vazio = sem tarja)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
