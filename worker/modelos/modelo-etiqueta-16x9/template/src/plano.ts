// Formato do plano de edição do modelo Etiqueta, versão deitada (16:9, 1920×1080, o vídeo completo do
// YouTube). O template renderiza qualquer vídeo a partir dele. Os campos são os mesmos do vertical;
// muda só onde cada coisa fica no quadro (layout.ts).
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem da Etiqueta. A assinatura é `etiqueta`: a prateleira em degraus de preço,
// as etiquetas balançam, o preço conta e o selo de custo-benefício carimba o degrau.
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (em `corte` e `pop` ela já aparece;
  // `false` esconde)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// --- quadro cheio: a pessoa inteira, o texto numa fileira larga na altura do peito ---

// Gancho escrito: entra inteiro nos primeiros ~1 s a partir de `em` (padrão: `de`).
// `destaque` = trecho exato que ganha a tarja. `imagem` (opcional) = o gancho por cima de uma foto em tela cheia.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento };

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
  // a foto em tela cheia atrás do número (vira um corte com o número por cima)
  imagem?: ImagemNoMomento;
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

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// --- parede da loja no quadro da esquerda, pessoa na moldura da direita (aula 9 do curso) ---

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

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

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; imagem?: ImagemNoMomento };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// --- a assinatura ---

// Um degrau da prateleira (barato, médio, caro).
// `em` = quando o preço é dito: a etiqueta cai do varal, balança e o preço conta; o degrau sobe e o produto cai nele.
// `textoEm` = quando o que muda é dito: a faixa do degrau mostra a diferença e quanto o preço subiu.
// `vale` (0 a 1) = o quanto vale a pena, para o medidor; `valeEm` = quando a agulha vai até lá.
// Sem `imagem` (ou com a imagem "sem"), um cartão tipográfico com o nome faz o papel da foto.
export type Degrau = {
  // "BARATO", "MÉDIO", "CARO" (ou o que a fala usar)
  rotulo: string;
  // o preço dito (número); `unidade` vai antes ("R$") e `sufixo` depois ("/mês")
  preco: number;
  em: number;
  // o que muda neste degrau (curto: 2 a 6 palavras)
  texto: string;
  textoEm?: number;
  imagem?: ImagemNoMomento;
  // nome curto do produto, só quando não há imagem
  nome?: string;
  vale?: number;
  valeEm?: number;
};

// Etiqueta: a prateleira em degraus de preço no quadro da esquerda, a pessoa na moldura da direita. Os degraus nascem na ordem em que
// o preço é dito. Vários momentos `etiqueta` com o mesmo `titulo` são a mesma prateleira (o segundo já
// começa com os degraus que o primeiro montou); os degraus ficam em `degraus` do momento em que são ditos.
export type Etiqueta = Base & {
  tipo: "etiqueta";
  titulo?: string;
  tituloEm?: number;
  degraus: Degrau[];
  unidade?: string;
  sufixo?: string;
  // o medidor "vale a pena?" (aparece com a primeira agulha; `rotulo` troca a pergunta)
  medidor?: { rotulo?: string };
  // selo de custo-benefício num degrau (índice na prateleira inteira, 0 = o mais barato)
  selo?: { degrau: number; texto?: string; em: number; valeEm?: number; vale?: number };
};

export type Momento = Abertura | Numero | Destaque | Frase | Cta | Topicos | Passos | Comparacao | Grafico | Definicao | Pergunta | Etiqueta;

// tipos que levam a pessoa para a moldura da direita (o bloco vai para o quadro da esquerda)
export const TIPOS_NA_MOLDURA = ["etiqueta", "topicos", "passos", "comparacao", "grafico", "definicao", "pergunta"] as const;
export const pessoaNaMoldura = (m: Momento) => (TIPOS_NA_MOLDURA as readonly string[]).includes(m.tipo);
export const noPlacar = pessoaNaMoldura;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro 1920×1080 (0–1); o `rastro` (e o `quadro`) vêm junto quando o motor
  // seguiu o rosto: é ele que deixa a moldura da direita acompanhar o rosto com suavidade
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (px, quadro 1920×1080; começa ~60 px abaixo do queixo): os textos de
  // quadro cheio ficam nela
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  // false = sem barra de progresso no topo
  progresso?: boolean;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
