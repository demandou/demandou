// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Há dois grupos de momentos:
// - os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
//   definicao, frase, pergunta, cta), com os mesmos campos em todos os modelos do pack;
// - os próprios do Espelho: `mapa` (a assinatura: uma figura desenhada a traço, espelhada, com
//   pontos numerados que acendem) e `manchete` (a capa de revista com linhas escolhidas à mão).
//   A `comparacao` também aceita a forma própria com régua (`esquerda`, `direita`, `escala`).

// Áreas do rosto desenhado que podem acender (só na figura "rosto")
export type Area =
  | "testa"
  | "glabela"
  | "pesDeGalinha"
  | "olheiras"
  | "macas"
  | "nariz"
  | "bigodeChines"
  | "labios"
  | "queixo"
  | "contorno";

// Figuras do mapa: desenhos a traço fino, simétricos, que se desenham do centro para fora
export type Figura = "rosto" | "espelho" | "pessoa" | "moeda" | "microfone" | "coracao" | "lampada" | "ampulheta" | "casa" | "planta" | "livro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (fica sobre a linha do espelho)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ------------------------------------------------------------------ blocos universais

// Abertura: título de capa de revista, palavra por palavra. `destaque` = trecho exato em itálico
// dourado. `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Tópicos: 2 a 5 itens sem ordem, cada um com um losango que acende no seu `em`.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos: 2 a 5 itens EM ORDEM, círculos numerados ligados por um fio dourado.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: conta até `valor` a partir de `em` (pt-BR), com o losango correndo numa régua.
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

// Um lado da comparação universal. Com `escala` (a régua do Espelho), `rotulo` é o nome do lado,
// `texto` é o número sobre o começo da faixa e os campos extras desenham a faixa.
export type Lado = {
  rotulo: string;
  texto: string;
  em: number;
  // só com `escala`: a faixa deste lado na régua, os textos extras e o rostinho (estética)
  faixa?: { de: number; ate: number; em: number; emFim?: number };
  textos?: { fim?: string; sobre?: string; inicioEm?: number; fimEm?: number; sobreEm?: number };
  areas?: Area[];
};

// Comparação. Forma universal: `lados` (o primeiro em cima, à esquerda; o segundo embaixo, à
// direita, como um reflexo, separados por um fio com losango). Com `escala`, a linha do espelho
// vira uma régua e cada lado ganha uma faixa dourada (prazos, durações, quantidades).
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados?: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  // régua na linha do espelho: de 0 (à esquerda) até `ate` (à direita), um tique a cada `passo`
  escala?: { ate: number; passo?: number };
  // forma antiga (ainda aceita): `rotulo` = título; `esquerda` e `direita` = os lados
  rotulo?: string;
  esquerda?: LadoComparado;
  direita?: LadoComparado;
};

// Gráfico: com `dados` (números ditos, 2 a 6) barras, linha ou pizza proporcionais; sem `dados`,
// uma forma que mostra a `tendencia`, com a etiqueta "ilustrativo".
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

// Destaque: uma palavra ou frase curta que bate forte, entre dois fios que se abrem do centro.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Definição: o termo em cima do fio; o significado aparece embaixo, como o reflexo dele.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: citação em itálico, palavra por palavra; `risco` = trecho riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: a pergunta se monta; as `opcoes` (2 a 4) entram com letras em círculos dourados.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a assinatura (nome e área), a chamada e o botão desenhado.
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com as palavras da fala ("Siga para mais dicas")
  texto: string;
  // o botão desenhado: seguir (padrão), salvar, comentar, link
  icone?: "seguir" | "salvar" | "comentar" | "link";
  // trecho exato da chamada em itálico dourado (no link, também vira o nome do botão)
  destaque?: string;
  em?: number;
  iconeEm?: number;
};

// ------------------------------------------------------------------ próprios do Espelho

// Manchete: a linha do espelho sobe; o título fica na faixa de cima, como capa de revista,
// e a pessoa embaixo. Use quando quiser escolher a quebra das linhas e os extras (rótulo, abre,
// sub, símbolo, selo); para um título simples, `abertura` faz o mesmo sozinha.
export type Manchete = Base & {
  tipo: "manchete";
  // linha pequena em caixa alta acima do título (palavras faladas entram quando são ditas)
  rotulo?: string;
  // frase de abertura em itálico, acima do título (palavras faladas; até ~34 caracteres)
  abre?: string;
  // 1 a 3 linhas, com as palavras NA ORDEM EM QUE SÃO FALADAS. "≠", "×", "→", "+" e "=" viram
  // símbolos desenhados em ouro (entram com a palavra seguinte, ou em `simboloEm`)
  linhas: string[];
  // trecho exato em itálico dourado
  enfase?: string;
  // linha pequena em caixa alta embaixo do título (palavras faladas)
  sub?: string;
  simboloEm?: number;
  // selo desenhado no fim da última linha (um visto dentro de um círculo), no tempo pedido
  seloEm?: number;
  em?: number;
};

// Mapa (a assinatura): a linha do espelho no meio da tela. Na faixa de cima, uma figura desenhada
// a traço de um lado (com linhas de mapeamento e pontos que acendem) e os textos do outro.
export type Mapa = Base & {
  tipo: "mapa";
  // de que lado da faixa de cima fica o desenho; os textos ficam do outro
  lado: "esquerda" | "direita";
  // qual desenho (padrão: "rosto" se houver `areas` ou `efeito`, senão "espelho")
  figura?: Figura;
  rotulo?: string;
  // título curto (palavras da fala; até ~24 caracteres, no máximo 2 linhas)
  titulo?: string;
  // frase em itálico ao lado da figura (palavras da fala, até ~40 caracteres)
  nota?: string;
  // pontos numerados (qualquer figura): 2 a 5, cada um acende no seu `em` e entra na legenda
  pontos?: { texto: string; em: number }[];
  // só na figura "rosto": o que o desenho faz ("relaxar": as fibras do músculo se esticam e as
  // rugas alisam; "volume": curvas de nível crescem nas maçãs e nos lábios)
  efeito?: { tipo: "relaxar" | "volume"; em: number; inicioEm?: number };
  // só na figura "rosto": áreas com nome anatômico (ou `texto` próprio)
  areas?: { area: Area; em: number; texto?: string }[];
};

// Um lado da comparação com régua (uma linha da tabela na faixa de cima)
export type LadoComparado = {
  titulo: string;
  // quando o nome deste lado é dito: a linha dele entra em foco
  em: number;
  // sem escala: áreas acesas no rostinho deste lado (com escala: rostinho ao lado do número, se couber)
  areas?: Area[];
  // faixa na régua (com `escala`): de/ate na unidade da escala; cresce entre em e emFim
  faixa?: { de: number; ate: number; em: number; emFim?: number };
  // textos da faixa: `inicio` sobre o começo da faixa, `fim` sobre o fim; `sobre` em caixa alta
  // na linha do nome (a ressalva: "em média")
  textos?: { inicio?: string; fim?: string; sobre?: string; inicioEm?: number; fimEm?: number; sobreEm?: number };
  // sem escala: até 3 itens curtos, cada um no seu tempo
  itens?: { em: number; texto: string }[];
};

export type Momento = Abertura | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Frase | Pergunta | Cta | Manchete | Mapa;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo calculada pelo motor (aqui serve para estimar onde fica o queixo)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste fino do enquadramento (raramente necessário).
  // `pessoa`: a moldura de baixo. `zoom` (padrão: automático, 1 a 1,35 conforme o tamanho da
  // cabeça), `margem` (px entre a linha do espelho e o alto da cabeça, padrão 80), `queixo` (px do
  // queixo no quadro, como o cortar.mjs imprime, quando a estimativa automática erra).
  // `cheio`: a pessoa em tela cheia (entre momentos com respiro): `zoom`, `ancoraY`.
  caixas?: {
    pessoa?: { zoom?: number; margem?: number; queixo?: number };
    cheio?: { zoom?: number; ancoraY?: number };
  };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
