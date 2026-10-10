// Formato do plano de edição do modelo Dossiê. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: em cima (54% da tela), um quadro de investigação de cortiça escura; embaixo, a pessoa
// numa moldura larga, o vídeo inteiro. Cada momento vira uma peça presa no quadro (pasta, ficha,
// polaroide, recorte, post-it, memorando com carimbo). A câmera do quadro viaja de pino em pino quando
// a peça nova é dita e um fio vermelho liga a peça nova à anterior. O quadro é um só: as peças ficam
// presas e o fio vai formando a teia do caso.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque, definicao,
// frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack (references/plano.md).
// A assinatura é `quadro`: as provas presas uma a uma, com a câmera viajando e o fio esticando.
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento; false = some.
  // Padrão: aparece em `quadro`, `numero`, `grafico` e `comparacao`; some nos outros.
  legenda?: boolean;
};

// ——— a assinatura ———

// Uma prova presa no quadro. A câmera chega e o pino crava no `em` (a palavra que a nomeia).
// `forma` (padrão: "foto" se tiver imagem, senão "ficha"):
//   "foto"     polaroide com a imagem; `titulo` = legenda escrita na borda branca
//   "ficha"    ficha datilografada; `titulo` = título; `campos` = linhas (valor datilografado ou tarjado)
//   "ligacao"  celular tocando; `titulo` = quem liga; `texto` = linha de baixo (ex.: "Seu banco")
//   "mensagem" print de conversa; `titulo` = quem mandou; `texto` = a mensagem
//   "alerta"   print de notificação; `titulo` = de onde vem; `texto` = o aviso
// `rotulo` = etiqueta da prova (padrão "PROVA A", "PROVA B"… na ordem do vídeo).
// `destaque` (mensagem, alerta, ficha) = trecho exato de `texto` que ganha a tarja de tinta em `destaqueEm`.
export type Campo = { rotulo: string; valor?: string; tarja?: boolean; em: number };
export type Evidencia = {
  em: number;
  forma?: "foto" | "ficha" | "ligacao" | "mensagem" | "alerta";
  imagem?: ImagemNoMomento;
  titulo?: string;
  texto?: string;
  textoEm?: number;
  destaque?: string;
  destaqueEm?: number;
  campos?: Campo[];
  rotulo?: string;
  // ícone genérico de quem liga / manda ("pessoa", padrão; "predio" para empresa, banco, órgão)
  icone?: "pessoa" | "predio";
};
export type Quadro = Base & { tipo: "quadro"; evidencias: Evidencia[] };

// ——— os blocos universais ———

// abertura = a pasta que abre. `abreEm` = quando a capa abre (padrão: `de` + 0,15 s);
// `carimbo` = o carimbo do relatório (padrão "CONFIDENCIAL"), batido em `carimboEm`;
// `imagem` = polaroide presa com clipe, em `imagemEm`; `rotulo` = a etiqueta da capa (padrão "DOSSIÊ").
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  abreEm?: number;
  carimbo?: string;
  carimboEm?: number;
  imagem?: ImagemNoMomento;
  imagemEm?: number;
  rotulo?: string;
};

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

// destaque = memorando com o carimbo vermelho (o `texto` é o carimbo). No nível "alerta", os fios das
// provas anteriores convergem para ele.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// cta = a pasta que fecha com o carimbo (padrão pelo ícone: "SALVE ESTE CASO", "SIGA O CASO",
// "COMENTE", "LINK NA BIO"; `carimbo` troca). Se o vídeo abriu com a pasta, a câmera volta para ela.
// `imagem` = polaroide presa na capa, em `imagemEm`.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  carimbo?: string;
  carimboEm?: number;
  imagem?: ImagemNoMomento;
  imagemEm?: number;
};

export type Momento =
  | Quadro
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
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o Dossiê não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: vão na aba da moldura da pessoa no começo do vídeo
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
