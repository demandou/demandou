// Formato do plano de edição do modelo Aula (16:9, curso gravado). O template renderiza qualquer
// vídeo a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática da Aula tem dois modos, e o template escolhe sozinho a cada instante:
// - MODO PROFESSOR: a pessoa em quadro cheio (abertura, viradas, ênfases), com um cartão de papel
//   no lado livre. Blocos: capitulo, abertura, destaque, frase, cta.
// - MODO SLIDE (a assinatura): o slide ocupa ~62% da tela e o professor vai para uma janela
//   arredondada ao lado, seguindo o rosto. O slide se monta na fala. Blocos: slide, topicos,
//   passos, numero, comparacao, grafico, definicao, pergunta.
// Sem momento nenhum, a pessoa fica em quadro cheio. Um bloco de professor que cai dentro de um
// slide interrompe o slide (é a "virada": o professor volta para o quadro cheio) e depois o slide
// continua de onde estava. Por cima de tudo, a barra de progresso da aula (`plano.aula`).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md).
import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // (só com `plano.legendas: true`) false = a legenda some durante o momento. Padrão: continua nos
  // slides, no capitulo e no destaque; some na abertura, na frase e no cta (que já escrevem a fala).
  legenda?: boolean;
};

// ——— a assinatura ———

// Um termo da fórmula: escrito quando é dito (`em`). `sup`: expoente (sobrescrito).
export type TermoDaFormula = { texto: string; em: number; sup?: boolean };
// Um item do slide: uma linha que entra na fala.
export type ItemDoSlide = { texto: string; em: number; detalhe?: string };

// Slide: o título se monta palavra por palavra na fala; `destaque` (trecho do título) ganha o
// marca-texto violeta. Depois, conforme a fala: `itens` (linhas que entram uma a uma; a da vez
// acende), `formula` (escrita termo a termo; o termo da vez acende; completa, ganha a moldura) e
// `termos` (palavras do slide que acendem de novo quando são ditas). `rotulo`: o sobretítulo.
// `resumo`: o cartão de resumo da aula, no pé do slide (frases curtas do que JÁ foi dito, que
// entram em sequência a partir de `resumo.em`).
export type Slide = Base & {
  tipo: "slide";
  titulo: string;
  em?: number;
  destaque?: string;
  rotulo?: string;
  itens?: ItemDoSlide[];
  numerar?: boolean;
  formula?: TermoDaFormula[];
  termos?: { texto: string; em: number }[];
  resumo?: { em: number; titulo?: string; itens: string[] };
};

// ——— os outros efeitos próprios ———

// Cartão de capítulo (modo professor): a capa da aula. Abre já completo (`numero` — "Aula 3",
// "Módulo 2" —, a `chamada` opcional, o título grande e o nome do professor no pé); a fala acende
// o número (`numeroEm`) e cada palavra do título (a partir de `em`) com o marca-texto.
export type Capitulo = Base & { tipo: "capitulo"; texto: string; em?: number; numero?: string; numeroEm?: number; chamada?: string };

// ——— os blocos universais, na linguagem da Aula ———

// modo professor
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

// modo slide
export type Item = { texto: string; em: number; detalhe?: string };
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// `desde`/`desdeEm`: o valor de partida, mostrado antes de contar (ex.: 1.000 → 1.127);
// `via`/`viaEm`: a etiqueta no caminho entre os dois (ex.: "1% ao mês").
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
  desde?: number;
  desdeEm?: number;
  via?: string;
  viaEm?: number;
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

// Uma série do gráfico qualitativo (sem números): como ela cresce e a nota que entra na fala.
export type Serie = { rotulo: string; em: number; forma: "reta" | "curva" | "queda" | "plana"; nota?: string; notaEm?: number; destaque?: boolean };
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // só na Aula: 1 a 3 séries qualitativas desenhadas na fala (ex.: simples × composto), a linha de
  // base (`base`, ex.: "valor inicial") e o sombreado entre as duas primeiras (`diferencaEm`)
  series?: Serie[];
  base?: { rotulo: string; em: number };
  diferencaEm?: number;
  eixos?: { x: string; y: string };
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number; certa?: number; certaEm?: number };

export type Momento = Slide | Capitulo | Abertura | Destaque | Frase | Cta | Topicos | Passos | Numero | Comparacao | Grafico | Definicao | Pergunta;

// os blocos do modo professor (a pessoa em quadro cheio); todos os outros são do modo slide
export const DO_PROFESSOR = new Set(["capitulo", "abertura", "destaque", "frase", "cta"]);
export const doProfessor = (m: Momento) => DO_PROFESSOR.has(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

// A aula: o número e o título (no cabeçalho e no cartão de capítulo) e as seções da barra de
// progresso (cada uma começa em `de`; o nome é curto, na voz da fala).
export type Aula = { numero?: string; titulo: string; secoes?: { texto: string; de: number }[]; de?: number };

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
  // nome do professor e a área (no cartão de capítulo e na janela); vazio = sem nome
  marca: { nome: string; area: string };
  aula?: Aula;
  // sons tonais baixos nas trocas de modo e de slide e na moldura da fórmula (padrão: true)
  sfx?: boolean;
  // legenda discreta embaixo (padrão: false — o slide já escreve o essencial da fala)
  legendas?: boolean;
  // fim: a partir de `de` (logo depois da última palavra), o professor sai da janela e o último
  // slide vai para o centro, legível até o fim (`duracao`). `de` + 0,35 s cabe no vídeo de trabalho.
  cauda?: { de: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
};
