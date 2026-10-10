// Formato do plano de edição do modelo Tela Viva. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática da Tela Viva (copiada de um Reel de 6 mil curtidas): layout dividido fixo do primeiro
// ao último quadro. Em cima, a MOLDURA DA TELA (89% da largura × 30% da altura): uma gravação de
// tela que nunca fica parada. Na junção, o RÓTULO branco com o nome do assunto (some em corte seco
// uns segundos depois). Embaixo, a pessoa (60% do quadro) em take único, reenquadrando só nos
// cortes, com legenda minúscula no peito. Sem transição, sem logo, sem texto de CTA.
//
// A assinatura é a `tela` (um trecho da gravação: uma captura da página real, com câmera que anda
// e cursor) e a `abertura` (o rótulo branco). Os outros 10 blocos universais (topicos, passos,
// numero, comparacao, grafico, destaque, definicao, frase, pergunta, cta) têm os mesmos campos de
// todos os modelos e, quando entram, ocupam a moldura da tela no lugar da gravação, em corte seco.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Ícones de traço (destaque)
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
  // Padrão: continua em tudo, menos em frase, pergunta e cta (a moldura já mostra a fala).
  legenda?: boolean;
  // chapéu: linha pequena em caixa-alta no alto da moldura ("DICA 2", "O ERRO"). Opcional nos blocos.
  chapeu?: string;
};

// ——— a assinatura ———

// Um ponto da câmera sobre a captura: `x` e `y` são o centro do que se vê, em frações da captura
// inteira (0 = esquerda/topo, 1 = direita/base); `zoom` 1 = a captura inteira na largura da moldura.
export type Vista = { x: number; y: number; zoom: number };

// Onde o cursor está num instante. Ele desliza de um ponto ao seguinte; `clique` desenha o toque.
export type PontoCursor = { x: number; y: number; em: number; clique?: boolean };

// Um trecho da gravação de tela: uma captura real de página (public/tela/<captura>.jpg, feita com
// `node ferramentas/capturar.mjs`) que a câmera percorre de `ini` a `fim` sem parar, com o cursor.
export type Tela = Base & {
  tipo: "tela";
  captura: string;
  // altura ÷ largura da captura (o capturar.mjs imprime)
  proporcao: number;
  ini: Vista;
  fim: Vista;
  cursor?: PontoCursor[];
};

// ——— os blocos universais ———

// A abertura é o RÓTULO branco na junção: o nome do assunto ("Atalhos do Windows", "Claude Opus 5.5").
// Aparece pronto desde o primeiro quadro e some em corte seco no `ate`.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// `imagem` (opcional): o id de uma imagem do plano, que vira miniatura no lugar do marcador.
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

// `opcoes[].imagem` (opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Tela
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
  // faixa abaixo do queixo (o motor calcula; a Tela Viva não usa: ela reposiciona a pessoa)
  zona?: { topo: number; altura: number };
  // nome e área: chapéu discreto no palco durante a abertura (vazio = sem)
  marca: { nome: string; area: string };
  // som tonal baixo quando uma imagem entra no palco (padrão: true)
  sfx?: boolean; // a Tela Viva não usa som de efeito (deixe false)
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  camera?: Camera[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
