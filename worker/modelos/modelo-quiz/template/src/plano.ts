// Formato do plano de edição do modelo Quiz. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: um programa de perguntas de TV, claro e limpo. A pessoa fica sempre embaixo, numa
// moldura larga (a "câmera do apresentador"); em cima fica o PAINEL, onde tudo acontece.
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md) e aqui ganham a linguagem do painel: cartões brancos, selos de letra,
// o anel de contagem e o verde só para o que está certo.
// A assinatura é o `quiz` (pergunta + alternativas + contagem + revelação). Junto vêm o `fato`
// (o cartão que explica a resposta) e a `revelacao` (o cartão-mistério que vira na palavra).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, o painel mostra a fala)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— a assinatura ———

// Uma alternativa. O cartão entra em `em` (a LETRA falada: "A,"), com o selo; o nome e a imagem
// entram em `textoEm` (a palavra da alternativa: "fígado"). Sem `textoEm`, tudo entra em `em`.
// `imagem`: id de plano.imagens (PNG transparente fica inteiro; foto preenche o espaço dela).
export type Opcao = { texto: string; em: number; textoEm?: number; imagem?: ImagemNoMomento; letra?: string };

// Um número da contagem falada ("três… dois… um…"): entra no anel no `em` da palavra.
export type Tique = { numero: number; em: number };

// O quiz: a pergunta (`texto`) monta palavra por palavra a partir de `em`; as alternativas (2 a 4)
// entram uma a uma na grade acima da cabeça; o anel conta (`contagem`, sincronizado com a fala, ou
// `relogioEm`, um relógio mudo sem números) e, em `revelaEm`, a certa (`certa` = índice) acende em
// verde e as outras apagam. `modo: "vf"` = verdadeiro ou falso (2 alternativas, selos ✓ e ✗).
// `rotulo` (opcional, só se for dito): a etiqueta acima da pergunta ("PERGUNTA 2").
export type Quiz = Base & {
  tipo: "quiz";
  texto: string;
  em?: number;
  rotulo?: string;
  modo?: "letras" | "vf";
  opcoes: Opcao[];
  contagem?: Tique[];
  relogioEm?: number;
  certa: number;
  revelaEm: number;
};

// O fato: o cartão que explica a resposta. Logo depois de um `quiz` (de = ate do quiz), a resposta
// certa sobe para o alto do painel como uma faixa verde e o cartão do fato entra embaixo.
// `texto` monta palavra por palavra; `destaque` (o dado curto: "2 m²", "80%", "1969") bate grande,
// dentro de uma moldura de medida, em `destaqueEm`; `detalhe` é uma linha pequena opcional.
// Sozinho (sem quiz antes), o fato é um "você sabia?": `titulo` vira a etiqueta do alto.
export type Fato = Base & {
  tipo: "fato";
  texto: string;
  em?: number;
  destaque?: string;
  destaqueEm?: number;
  detalhe?: string;
  detalheEm?: number;
  titulo?: string;
  imagem?: ImagemNoMomento;
};

// A revelação: um cartão-mistério ("?") que vira na palavra e mostra a `resposta` (+ imagem).
// `texto` (opcional) é a provocação acima ("Adivinha quanto custa?"). Aceita `contagem`/`relogioEm`.
export type Revelacao = Base & {
  tipo: "revelacao";
  texto?: string;
  em?: number;
  resposta: string;
  revelaEm: number;
  detalhe?: string;
  detalheEm?: number;
  contagem?: Tique[];
  relogioEm?: number;
  imagem?: ImagemNoMomento;
};

// ——— os 11 blocos universais ———

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
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
// Pergunta sem resposta certa (enquete, provocação): o mesmo painel do quiz, sem anel nem revelação.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: ImagemNoMomento }[]; em?: number };
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Quiz
  | Fato
  | Revelacao
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
  // faixa abaixo do queixo (o Quiz não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: a tarja de apresentador no canto da moldura (vazio = sem tarja)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
