// Formato do plano de edição do modelo Terço. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Terço: tela dividida na horizontal. O terço de cima (0 a 640 px) é o PALCO, sempre
// ocupado: cada momento entra no palco por cima do anterior (máscara ou deslize) e fica lá até o
// próximo entrar. Os dois terços de baixo são a pessoa numa moldura larga que segue o rosto, com a
// cabeça inteira; a legenda fica logo abaixo do queixo. A câmera reenquadra em cada corte.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é a `insercao` (a imagem do que a pessoa cita, no palco) e o
// `capitulo` (o número e o título de cada parte da fala).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Como o momento entra no palco, por cima do que estava lá. Sem isto: imagem entra por cortina
// (da esquerda, com um fio azul na borda); texto entra deslizando de baixo e empurra o anterior.
export type Entrada = "cortina" | "deslize" | "lateral";

// Ícones de traço que se desenham no palco (capitulo, destaque)
export type Icone =
  | "carrinho"
  | "etiqueta"
  | "relogio"
  | "alerta"
  | "certo"
  | "errado"
  | "dinheiro"
  | "casa"
  | "coracao"
  | "ideia"
  | "calendario"
  | "seta"
  | "estrela"
  | "lupa"
  | "sobe"
  | "cai"
  | "pessoa"
  | "raio";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão do Terço: continua em tudo (o palco fica em cima, a legenda embaixo), menos na abertura,
  // frase, pergunta e cta (o palco já mostra a fala).
  legenda?: boolean;
  entrada?: Entrada;
  // chapéu: linha pequena em caixa-alta no alto do palco ("DICA 2", "O ERRO"). Opcional em tudo.
  chapeu?: string;
};

// ——— a assinatura ———

// A imagem do que a pessoa está citando, ocupando o palco inteiro e aproximando devagar.
// `em` = quando a coisa é dita (o momento costuma começar nesse instante).
export type Insercao = Base & {
  tipo: "insercao";
  imagem: ImagemNoMomento;
  em: number;
  // nome curto da coisa, numa etiqueta no canto de baixo ("Prateleira de baixo")
  rotulo?: string;
  rotuloEm?: number;
  // marcador no começo da etiqueta: "1", "2" (itens de uma lista falada)
  etiqueta?: string;
};

// O número e o título de cada parte da fala ("Primeiro, nunca vá com fome" → 01 + "Nunca vá com
// fome"). O título se monta palavra por palavra; `total` desenha os pontos de progresso.
export type Capitulo = Base & {
  tipo: "capitulo";
  texto: string;
  // "1", "2"… (vira "01"); vazio = sem número
  numero?: string;
  total?: number;
  destaque?: string;
  em?: number;
  icone?: Icone;
  iconeEm?: number;
};

// ——— os blocos universais, na linguagem do Terço ———

export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// `imagem` (do Terço, opcional): o id de uma imagem do plano, que vira miniatura no lugar do marcador.
export type Item = { texto: string; em: number; detalhe?: string; imagem?: string };
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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  icone?: Icone;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// `opcoes[].imagem` (do Terço, opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Insercao
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

// Reenquadramento (opcional). Sem isto, a câmera alterna sozinha entre os zooms do modelo em cada
// corte. Um item em `em` começa um enquadramento novo ali: num corte, escolhe o zoom daquele
// trecho; fora de um corte, é um "soco" de câmera na palavra (use pouco, nas ênfases).
// `aproximar`: aproximação lenta (até ~5%) durante o trecho.
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
  // faixa abaixo do queixo (o motor calcula; o Terço não usa: ele reposiciona a pessoa)
  zona?: { topo: number; altura: number };
  // nome e área: chapéu discreto no palco durante a abertura (vazio = sem)
  marca: { nome: string; area: string };
  // som tonal baixo quando uma imagem entra no palco (padrão: true)
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
