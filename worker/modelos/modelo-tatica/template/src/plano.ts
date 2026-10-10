// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Tática: a pessoa fala em quadro cheio, com artes de TV esportiva na altura do
// peito (abertura, vinheta "DICA N", resumo, fechamento). Em cada `dica`, a tela vira uma PRANCHETA
// (campo de giz sobre a grama) e a pessoa encolhe para uma caixa de transmissão no canto, como um
// comentarista; entre uma dica e outra ela volta ao quadro cheio. O placar "DICA 1/3" fica no canto.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Lado = "esquerda" | "direita";
// as seis zonas do gol visto de frente (esquerda/direita de quem olha a tela)
export type Zona = "esquerda-alto" | "esquerda-baixo" | "centro-alto" | "centro-baixo" | "direita-alto" | "direita-baixo";

// Ponto no campo, em metros: x de −34 (lateral esquerda) a 34 (lateral direita), 0 = meio do gol;
// y = distância da linha do gol (0) para fora (marca do pênalti 11, bico da grande área 16,5)
export type Ponto = { x: number; y: number };

export type Jogador = Ponto & {
  // nome curto usado nas ações ("9", "ponta", "gk")
  id: string;
  // "nosso" (ficha amarela), "adversario" (ficha escura) ou "goleiro" (o goleiro adversário, ficha branca)
  time: "nosso" | "adversario" | "goleiro";
  // o que vai escrito na ficha (número da camisa, 1 ou 2 caracteres)
  numero?: string;
  // nome livre ao lado da ficha ("Investidor", "Etapa 1"): para diagramas de qualquer assunto
  rotulo?: string;
};

export type AcaoCampo =
  // passe: seta tracejada de um jogador para outro; a bola rola junto. `rotulo` (opcional) = a
  // etiqueta no meio da seta ("vira", "leva a")
  | { tipo: "passe"; de: string; para: string; em: number; rotulo?: string }
  // chute: seta contínua amarela do jogador até um canto do gol; a bola vai junto
  | { tipo: "chute"; de: string; alvo: Lado | "centro"; em: number }
  // corrida: o jogador anda até `para` (com a bola, se estiver com ela), deixando um rastro pontilhado
  | { tipo: "corrida"; quem: string; para: Ponto; em: number; ate?: number }
  // olhar: um cone de visão sai do jogador até o alvo
  | { tipo: "olhar"; quem: string; alvo: string; em: number }
  // destaque: anel no jogador + etiqueta (ex.: "GOLEIRO")
  | { tipo: "destaque"; quem: string; rotulo?: string; em: number }
  // espaço: o lado do gol que ficou livre acende (da trave até o goleiro)
  | { tipo: "espaco"; lado: Lado; em: number };

export type Campo = {
  jogadores: Jogador[];
  // com quem a bola começa (id) ou onde ela está
  bola: string | Ponto;
  acoes: AcaoCampo[];
};

export type AcaoGol =
  // zonas do gol que acendem, com etiqueta opcional (acima do gol, ou abaixo se forem só zonas de baixo)
  | { tipo: "zona"; zonas: Zona[]; rotulo?: string; em: number }
  // de que lado a bola veio: seta tracejada entrando pela lateral da tela
  | { tipo: "origem"; lado: Lado; rotulo?: string; em: number }
  // a bola sai da frente da tela e entra na zona (rasteira se a zona for de baixo)
  | { tipo: "chute"; alvo: Zona; em: number }
  // o goleiro pula para um lado; `alcanca: false` (padrão) = chega atrasado
  | { tipo: "defesa"; lado: Lado; em: number; alcanca?: boolean };

export type Gol = {
  // quando a câmera "entra" no gol (com `campo` na mesma dica); sem `campo`, a dica já abre no gol
  em: number;
  // posição do goleiro: −1 (perto da trave esquerda) a 1 (trave direita); 0 = no meio
  goleiro?: number;
  // a bola já está dentro do gol nesta zona quando a vista abre (continuação de um chute no campo);
  // o caminho do chute fica desenhado
  bola?: Zona;
  // número de quem chuta: aparece como ficha amarela na frente da tela, com a bola no pé
  atacante?: string;
  acoes: AcaoGol[];
};

// Abertura: quadro cheio, tarja de TV na altura do peito; um número no começo do título vira o
// numeral grande no quadrado amarelo ("3 dicas pra…")
export type Abertura = Base & {
  tipo: "abertura";
  // o título (nome universal); `titulo` continua valendo
  texto?: string;
  titulo?: string;
  // trecho exato do título em amarelo
  destaque?: string;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
};

// Dica: vinheta "DICA N" em quadro cheio (de `de` até `pranchetaEm`), depois a prancheta com a
// pessoa na caixa de transmissão
export type Dica = Base & {
  tipo: "dica";
  // quando a pessoa encolhe e a prancheta entra (logo depois de dizer o número da dica)
  pranchetaEm: number;
  // título grande da dica, com palavras faladas ("Olha o goleiro")
  titulo: string;
  // linha de apoio, também falada ("Antes de a bola chegar,")
  apoio?: string;
  // o lance visto de cima (com perspectiva leve)
  campo?: Campo;
  // o gol visto de frente, com zonas e goleiro
  gol?: Gol;
};

// Resumo: quadro cheio, tarja com os itens que se marcam um a um e, opcionalmente, o placar do "resultado"
export type Resumo = Base & {
  tipo: "resumo";
  // título com palavras faladas ("Treina isso no próximo jogo")
  titulo: string;
  itens: { texto: string; em: number }[];
  // "me conta o resultado": a tarja vira um placar com "? × ?" que gira antes de parar
  resultado?: { texto: string; em: number };
};

// Frase: quadro cheio, tarja de TV com uma frase (para uma regra, uma virada, um dado)
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  // trecho exato do texto em amarelo
  destaque?: string;
  // etiqueta pequena acima da frase ("REGRA", "ATENÇÃO")
  rotulo?: string;
  // trecho riscado (traço amarelo) quando é dito
  risco?: string;
  riscoEm?: number;
  em?: number;
};

// Fechamento: tarja com nome e área + faixa amarela com a chamada falada ("Me segue pra mais dicas")
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  // o ícone do botão: seguir (padrão: "+" que vira visto), salvar, comentar ou link
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato da chamada sublinhado
  destaque?: string;
  em?: number;
};

// ——— blocos universais (os mesmos campos em todos os modelos do pack) ———

// Número: placar de TV; o número conta em pt-BR dentro do quadrado amarelo
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

// Destaque: tarja com uma palavra ou frase que bate forte; alerta = amarelo cheio, chave = tarja escura
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Definição: tarja de glossário (o termo no quadrado amarelo e o significado embaixo)
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Pergunta: tarja com o "?" e a pergunta; as opções viram uma enquete (2 a 4)
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// Na prancheta (a pessoa vai para a caixa de transmissão): fichas e setas de giz no gramado
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
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

export type Universal = Topicos | Passos | Comparacao | Grafico;

export type Momento = Abertura | Dica | Resumo | Frase | Cta | Numero | Destaque | Definicao | Pergunta | Universal;

export const ehUniversal = (m: Momento): m is Universal => m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico";

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = recorte 3:4). O modelo.json
  // fixa o recorte 9:16 para gravação vertical
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa das artes de quadro cheio (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: caixa de transmissão e fechamento
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
