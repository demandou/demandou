// Formato do plano de edição do modelo Palco. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Palco: dois modos que se alternam.
// (a) a pessoa em quadro cheio (reenquadrando nos cortes, seguindo o rosto), com a legenda logo
//     abaixo do queixo;
// (b) o palco: o assunto (a imagem, o print, a lista, o número) ocupa a tela num painel grande,
//     com anotações limpas no ponto citado (círculo, seta, marca-texto, foco, xis), e a pessoa
//     encolhe para uma janela arredondada num canto de baixo, com a cabeça inteira, seguindo o rosto.
// Os blocos de palco (palco, topicos, passos, numero, comparacao, grafico, definicao) abrem o modo
// (b); os de fala (abertura, frase, pergunta, cta, destaque) ficam no modo (a).
//
// Os 11 blocos universais têm os mesmos campos em todos os modelos do pack (references/plano.md).
// A assinatura é o `palco`.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Canto de baixo em que a janela da pessoa fica no palco. Sem ele, o template escolhe o canto
// oposto às anotações (a janela nunca cobre o ponto citado).
export type Canto = "esq" | "dir";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão do Palco: continua nos blocos de palco (ao lado da janela) e no destaque; some na
  // abertura, frase, pergunta e cta (eles mostram a própria fala).
  legenda?: boolean;
};

// ——— a assinatura ———

// Anotação no ponto citado. `x`,`y` = o ponto na imagem inteira (frações, como o foco: 0,0 é o
// canto de cima à esquerda). Ela é desenhada quando a palavra é dita (`em`) e fica até `ate`
// (padrão: o fim do momento).
export type Anotacao = {
  tipo: "circulo" | "seta" | "marca" | "foco" | "xis";
  em: number;
  x: number;
  y: number;
  ate?: number;
  // circulo, foco, xis: diâmetro em fração da largura do painel (padrão 0,3; 0,12 a 0,6)
  // marca sem texto: largura da faixa em fração da largura do painel (padrão 0,5)
  tamanho?: number;
  // marca sem texto: altura da faixa em fração da altura do painel (padrão 0,05)
  altura?: number;
  // etiqueta curta (até ~22 caracteres): na cauda da seta, ao lado do círculo, ou a própria nota
  // grifada da marca
  texto?: string;
  // seta: de onde ela vem (sem isto, do lado com mais espaço)
  vem?: "cima" | "baixo" | "esq" | "dir";
};

// Uma segunda imagem no mesmo palco: o painel se divide (a primeira sobe para a metade de cima,
// a segunda entra embaixo) quando ela é dita.
export type SegundaImagem = { imagem: ImagemNoMomento; em: number; rotulo?: string; anotacoes?: Anotacao[] };

// O palco: a imagem ou o print do que é citado, ocupando a tela, com as anotações no ponto.
export type Palco = Base & {
  tipo: "palco";
  imagem: ImagemNoMomento;
  // quando a coisa é dita (padrão: `de`)
  em?: number;
  // "cobrir" (padrão para foto): a imagem preenche o painel, enquadrada pelo foco.
  // "inteira" (para print, tela, gráfico pronto): a imagem inteira, sem corte, no painel.
  ajuste?: "cobrir" | "inteira";
  // título do palco, numa etiqueta no alto do painel ("Luz de janela, de lado"); entra em `tituloEm`
  titulo?: string;
  tituloEm?: number;
  // marcador do título: "1", "2", "3" (itens de uma sequência falada)
  etiqueta?: string;
  // nome curto da imagem, numa etiqueta embaixo dela ("Pizza"); entra em `rotuloEm`
  rotulo?: string;
  rotuloEm?: number;
  anotacoes?: Anotacao[];
  segunda?: SegundaImagem;
  canto?: Canto;
};

// ——— os blocos universais, na linguagem do Palco ———

// Gancho no lugar da legenda, maior, palavra por palavra; `destaque` ganha o sublinhado azul.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// Lista no palco: cada linha entra na fala; a da vez ganha o marca-texto azul.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; canto?: Canto };

// Sequência no palco: etapas numeradas ligadas por um fio que desce até a da vez.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; canto?: Canto };

// Número no palco, contando até `valor` a partir de `em`. `titulo` (do Palco): a linha acima.
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
  canto?: Canto;
};

// `imagem` (do Palco, opcional): a metade daquele lado vira foto (antes e depois, errado e certo).
export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  canto?: Canto;
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
  canto?: Canto;
};

// Etiqueta de palavra-chave na altura do peito, com a pessoa em quadro cheio. "alerta" = clara.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; canto?: Canto };

// Frase de efeito: cartão escuro no lugar da legenda, palavra por palavra; `risco` riscado quando dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: ImagemNoMomento }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Palco
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

// Os tipos que abrem o palco (modo b). Os outros ficam com a pessoa em quadro cheio (modo a).
export type MomentoDePalco = Palco | Topicos | Passos | Numero | Comparacao | Grafico | Definicao;
const DE_PALCO = new Set<string>(["palco", "topicos", "passos", "numero", "comparacao", "grafico", "definicao"]);
export const ehDePalco = (m: Momento): m is MomentoDePalco => DE_PALCO.has(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

// Reenquadramento do modo (a) (opcional). Sem isto, a câmera alterna sozinha 1,0 / 1,12 / 1,24 em
// cada corte e na volta do palco. Um item em `em` começa um enquadramento novo ali; fora de um
// corte, é um "soco" de câmera na palavra (use pouco). `aproximar`: aproximação lenta no trecho.
export type Camera = { em: number; zoom?: number; aproximar?: boolean };

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
  // faixa abaixo do queixo (o motor calcula; o Palco usa só como referência)
  zona?: { topo: number; altura: number };
  // tarja de nome e área no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  // som tonal baixo quando o palco abre (padrão: true)
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
