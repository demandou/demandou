// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Mapa: a tela é um papel pontilhado onde cresce um mapa de estudo. Cada momento é
// uma ESTAÇÃO desse mapa; na fronteira entre um momento e outro a câmera desliza pelo papel até a
// próxima estação (direita, baixo, esquerda, baixo…), e o cartão com o vídeo da pessoa muda de lugar
// e de tamanho no mesmo movimento. A pessoa é um nó do mapa: um cartão ligado ao conteúdo por um ramo.

import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (faixa de baixo, y ~1430)
  legenda?: boolean;
};

// Mapa mental: um nó central que ramifica no ritmo da fala; os ramos podem se apagar (esquecimento)
// ou ganhar marca-texto (fixar). Cartão grande da pessoa em cima, o mapa e o título embaixo.
export type Mapa = Base & {
  tipo: "mapa";
  // o nó central ("conteúdo")
  centro: string;
  // 2 a 6 ramos, alternando esquerda/direita; cada um nasce no seu `em`
  ramos: { texto: string; em: number }[];
  // frase falada que se monta embaixo do mapa, palavra por palavra (o gancho)
  titulo?: string;
  // trecho exato do título que fica "a lápis" (ex.: "esquece tudo?")
  apagado?: string;
  // os ramos se apagam, um por um: viram lápis tracejado e o texto some (esquecimento)
  esqueceEm?: number;
  // os ramos ganham marca-texto, um por um (lembrar, fixar)
  fixaEm?: number;
  // "pessoa": cartão grande em cima e o mapa embaixo (padrão quando o mapa abre o vídeo ou não tem título);
  // "mapa": o mapa é o herói — cartão pequeno em cima à esquerda, título ao lado, mapa grande
  // (padrão no meio do vídeo, com título)
  foco?: "pessoa" | "mapa";
};

// Título: uma ideia-chave como nó do mapa, com um trecho em marca-texto.
export type Titulo = Base & {
  tipo: "titulo";
  // letreiro pequeno em caixa-alta acima do nó de origem ("o método")
  rotulo?: string;
  // o nó de onde o título sai (ex.: "conteúdo"); vazio = sem nó
  origem?: string;
  // linha menor falada antes do título ("Usa a")
  apoio?: string;
  // o título ("revisão espaçada")
  texto: string;
  // trecho exato do título com marca-texto
  destaque?: string;
  // pontos com espaço crescente que se desenham embaixo do título (dias, ex.: [0, 1, 7, 30])
  intervalos?: number[];
  // rótulo do ponto zero dos intervalos (ex.: "hoje"); sem ele, aparece o número
  zero?: string;
};

// Curva do esquecimento: a memória cai e cada revisão a levanta; o eixo é um calendário de pontos
// (um ponto por dia). Sempre ilustrativa: sem porcentagens.
export type Curva = Base & {
  tipo: "curva";
  // letreiro ("curva do esquecimento")
  rotulo?: string;
  // frase falada ao lado do cartão ("Estudou hoje?")
  titulo?: string;
  // o dia 0 ("hoje"): a caneta começa a desenhar a queda
  estudoEm: number;
  // cada revisão: o dia (1, 7, 30…) e quando ela é dita; a curva sobe nesse instante
  revisoes: { dia: number; em: number }[];
  // linha a lápis do que acontece sem revisar (padrão: true)
  semRevisao?: boolean;
  // rótulos livres (assunto qualquer): o eixo ("memória"), a unidade dos marcos ("dia"/"dias"),
  // o marco zero ("hoje"), a linha a lápis ("sem revisão") e a cauda ("com revisão")
  eixo?: string;
  unidade?: string;
  unidades?: string;
  inicio?: string;
  sem?: string;
  com?: string;
};

// Contador: um mostrador de relógio que conta até o valor, com a frase falada ao lado.
export type Contador = Base & {
  tipo: "contador";
  // letreiro ("minutos por revisão")
  rotulo?: string;
  // frase falada que se monta palavra por palavra ("Cada revisão leva poucos minutos")
  texto?: string;
  // trecho exato da frase com marca-texto
  destaque?: string;
  // o número final e a unidade ("5", "min")
  valor: number;
  unidade?: string;
  // quando a contagem começa (leva 0,8 s)
  em: number;
  // o mostrador vale uma volta inteira com este valor (padrão: 60 para valores até 40; acima disso,
  // o dobro do valor arredondado em múltiplos de 60)
  volta?: number;
};

// Barras: comparação de duração ("sem revisão" curta, "com revisão" longa) e um nó que recebe um alfinete.
export type Barras = Base & {
  tipo: "barras";
  // frase falada, monta palavra por palavra ("fixa o conteúdo por muito mais tempo")
  texto: string;
  destaque?: string;
  // nó que recebe o alfinete ("conteúdo") e quando ele crava
  no?: string;
  fixaEm?: number;
  // 2 barras (de cima para baixo). `valor` relativo: 1 = largura toda; > 1 passa da borda (seta).
  // `forte` = tinta com marca-texto; sem `forte` = lápis
  barras: { texto: string; valor: number; em: number; forte?: boolean }[];
  // rótulo do eixo embaixo das barras (ex.: "tempo na memória"); sem ele, só os pontos
  eixo?: string;
};

// Cartões de pergunta: flashcards que viram (pergunta → resposta) e uma frase com trecho riscado.
export type Cartoes = Base & {
  tipo: "cartoes";
  rotulo?: string;
  // frase falada ao lado do cartão da pessoa ("Junta isso com questões")
  texto?: string;
  // 1 a 3 cartões; cada um vira no seu `em`
  cartoes: { pergunta: string; resposta: string; em: number }[];
  // frase falada embaixo dos cartões e o trecho que é riscado no `riscaEm`
  rodape?: string;
  riscado?: string;
  riscaEm?: number;
};

// Fechamento: cartão grande da pessoa com a etiqueta de nome, um selo no canto (fita de "salvar",
// "+" de seguir, balão de comentar, elo de link) e a chamada falada.
export type Cta = Base & {
  tipo: "cta";
  // chamada falada ("Salva e começa hoje")
  texto: string;
  destaque?: string;
  // o selo no canto do cartão (padrão: salvar = fita de marcador)
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // quando o selo se enche de marca-texto (padrão: a primeira palavra)
  salvaEm?: number;
  // dias do calendário de pontos embaixo (o dia 0 leva o rótulo `inicio` da curva).
  // Padrão: os dias de revisão da curva, se o plano tiver uma; sem curva e sem `dias`, sem calendário
  dias?: number[];
};

// ---------- os 11 blocos universais (motor/BLOCOS.md), desenhados como estações do mapa ----------

export type Item = { texto: string; em: number; detalhe?: string };

// Abertura: cartão grande da pessoa em cima, o título se escreve embaixo, com marca-texto no destaque.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Tópicos (sem ordem): um tronco de tinta desce e cada item é um nó que nasce dele na sua palavra.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos (em ordem): discos numerados num caminho de pontos; a caneta anda de um passo ao outro.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: conta até `valor` em pt-BR, a caneta circula o número e o marca-texto passa por baixo.
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

// Comparação: dois cartões de anotação, um embaixo do outro, ligados por × ou por uma seta.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: no cartão do gráfico (o mesmo da curva), a caneta desenha linha, barras ou pizza.
// Sem números ditos, `tendencia` desenha só a forma, com o selo "ilustrativo".
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

// Destaque: a palavra enorme no alto, com marca-texto (chave) ou num bloco de tinta (alerta);
// o cartão da pessoa embaixo, ligado à palavra por um ramo.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: o termo vira um nó de tinta; o significado se escreve num cartão de anotação que o
// alfinete crava quando é dito.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: aspas de tinta ao lado do cartão da pessoa e a frase enorme embaixo, palavra por palavra.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: um "?" circulado pela caneta; a pergunta se escreve embaixo; as opções são caixinhas.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Momento =
  | Mapa
  | Titulo
  | Curva
  | Contador
  | Barras
  | Cartoes
  | Cta
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | Frase
  | Pergunta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa (1920 = quadro cheio; 1440 = recorte 3:4). O modelo.json fixa 9:16.
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro do rosto quando o cortar.mjs o seguiu
  rosto: Rosto;
  // calculada pelo cortar.mjs; este modelo não usa (a pessoa está sempre num cartão)
  zona?: { topo: number; altura: number };
  // nome e área: etiqueta do cartão no fechamento
  marca: { nome: string; area: string };
  // true (padrão) = o vídeo abre em quadro cheio e recua para o cartão no primeiro instante
  abreCheio?: boolean;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // ajuste do enquadramento da pessoa em todos os cartões: `zoom` multiplica o zoom de cada cartão
  // (nunca abaixo de 1); `ancoraY` fixa a altura do rosto dentro do cartão (0 = topo, 1 = base)
  retrato?: { zoom?: number; ancoraY?: number };
};
