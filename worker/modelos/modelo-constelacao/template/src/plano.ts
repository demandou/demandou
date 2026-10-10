// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Gramática da Constelação (um estilo para qualquer assunto): o vídeo abre e fecha com a pessoa em
// tela cheia, com o texto no peito. No meio, a tela vira uma CARTA CELESTE desenhada: a pessoa entra
// numa ocular redonda e escura, e o que ela diz vira estrela que acende e ganha nome, linhas que se
// ligam, retas tracejadas que levam a um alvo; um círculo vermelho de "localizador" vai sempre ao que
// está sendo dito. Os 11 blocos universais (motor/BLOCOS.md) são desenhados nessa linguagem; a
// assinatura é a `constelacao` (ideias que formam uma figura) e, em vídeos sobre o céu, a `carta`.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// ————————————————————————————————————————————————————————————————————————————————
// Os 11 blocos universais (os mesmos campos em todos os modelos do pack), no estilo Constelação.
// Tela cheia (a pessoa grande, o texto no peito): abertura, destaque, frase, pergunta, cta e
// numero com `tela: "cheia"`. Carta (a pessoa na ocular, o céu desenhado): topicos, passos,
// numero, comparacao, grafico, definicao e a assinatura (constelacao, carta).
// ————————————————————————————————————————————————————————————————————————————————

// Momentos de carta aceitam `ocular`: onde a pessoa fica (sem ele, alterna sozinha).
type NaCarta = { ocular?: PosicaoOcular };

// Abertura: título no peito, pessoa em tela cheia; uma miniatura da constelação se liga junto.
// `texto` se monta palavra por palavra na fala; `destaque` (trecho exato) ganha linha própria, em
// itálico maior. `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto?: string;
  destaque?: string;
  em?: number;
  // letreiro pequeno acima do título (tema em 2–3 palavras)
  rotulo?: string;
  // forma antiga (ainda aceita): 2 ou 3 linhas e o índice da linha em itálico
  linhas?: string[];
  enfase?: number;
};

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem (motivos, erros, dicas): cada item é uma estrela que acende e ganha nome.
export type Topicos = Base & NaCarta & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: as estrelas numeradas se ligam por uma linha, uma a uma.
export type Passos = Base & NaCarta & { tipo: "passos"; titulo?: string; itens: Item[] };

// Um número que conta. Na carta (padrão) ou no peito (`tela: "cheia"`, bom para abrir o vídeo).
export type Numero = Base &
  NaCarta & {
    tipo: "numero";
    valor: number;
    em: number;
    rotulo: string;
    rotuloEm?: number;
    prefixo?: string;
    sufixo?: string;
    casas?: number;
    ilustrativo?: boolean;
    tela?: "carta" | "cheia";
  };

export type Lado = { rotulo: string; texto: string; em: number };

// Dois lados: duas estrelas uma sobre a outra, ligadas (× / seta tracejada / risco e brilho).
export type Comparacao = Base &
  NaCarta & {
    tipo: "comparacao";
    titulo?: string;
    modo?: "contra" | "antes-depois" | "errado-certo";
    lados: [Lado, Lado];
    vencedor?: 0 | 1;
    vencedorEm?: number;
  };

export type Dado = { rotulo: string; valor: number; em: number };

// Gráfico de carta: barras = hastes com uma estrela no topo; linha = estrelas ligadas; pizza = anel
// graduado. Sem números ditos: `tendencia` + `ilustrativo: true` (uma trajetória que se desenha).
export type Grafico = Base &
  NaCarta & {
    tipo: "grafico";
    titulo?: string;
    forma: "barras" | "linha" | "pizza";
    dados?: Dado[];
    tendencia?: "sobe" | "cai" | "oscila";
    tendenciaEm?: number;
    unidade?: string;
    ilustrativo?: boolean;
  };

// Palavra ou frase curta que bate forte (tela cheia). "alerta" = vermelho de lanterna.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Termo explicado: o termo é o nome de uma estrela brilhante; a reta tracejada leva ao significado.
export type Definicao = Base & NaCarta & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito (tela cheia), palavra por palavra; `destaque` em itálico; `risco` riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste (tela cheia); `opcoes` (2 a 4) entram como selos, cada uma na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: pessoa em tela cheia de novo, chamada no peito.
export type Cta = Base & {
  tipo: "cta";
  // a chamada falada ("Toca em Saiba Mais e assiste a aula")
  texto?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho da chamada que ganha itálico e sublinhado quando é dito
  destaque?: string;
  // quando a chamada começa a ser dita (padrão: `de`)
  em?: number;
  // quando o ícone é preenchido (padrão: a primeira palavra)
  acaoEm?: number;
  // a segunda linha, falada, menor e em itálico ("na próxima noite sem nuvem")
  detalhe?: string;
  // quando a nuvem desenhada se desfaz e vira estrela (só para fala sobre céu limpo)
  nuvemEm?: number;
  // forma antiga (ainda aceita): `titulo` = `texto`; `acao` = `icone`
  titulo?: string;
  acao?: "salvar" | "seguir";
};

// ————————————————————————————————————————————————————————————————————————————————
// A assinatura
// ————————————————————————————————————————————————————————————————————————————————

// Constelação de ideias (qualquer assunto): cada ideia é uma estrela que acende e ganha nome no
// instante em que é dita; as estrelas se ligam numa figura; a figura ganha nome; e uma reta
// vermelha tracejada sai da figura até o `alvo` (aonde aquilo leva), com cruz e rosa dos ventos.
export type Constelacao = Base &
  NaCarta & {
    tipo: "constelacao";
    // o nome da figura (itálico, sublinhado), com palavras da fala
    titulo?: string;
    tituloEm?: number;
    // 2 a 6 estrelas, na ordem em que são ditas
    estrelas: { texto: string; em: number }[];
    // "figura" (padrão): as linhas formam o desenho da constelação (triângulo, cruz, W, concha);
    // "caminho": cada estrela se liga só à seguinte (para uma sequência: primeiro, depois, por fim)
    ligar?: "figura" | "caminho";
    // aonde a figura leva: a cruz e o nome entram no `em`; a reta chega em `chegaEm`
    // (padrão: logo depois da última estrela, ou no `em` se o alvo for dito depois)
    alvo?: { texto: string; em: number; chegaEm?: number };
  };

// Carta celeste de verdade (céu real ou carta inventada com x/y): a assinatura completa, com passos.
// Onde a ocular (a pessoa) fica durante um momento de carta.
// "baixo-centro": a pessoa embaixo, no meio (o céu inteiro em cima) — a preferida dos blocos universais
export type PosicaoOcular = "topo-direita" | "topo-esquerda" | "meio-direita" | "meio-esquerda" | "baixo-direita" | "baixo-esquerda" | "baixo-centro";

export type Direcao = "N" | "S" | "L" | "O";

// Os passos de uma carta: cada um acontece no `em` (a palavra falada).
export type Passo =
  // acende estrelas (uma a cada `ritmo` s); `contador` mostra um número que conta as estrelas
  | { acao: "acender"; em: number; estrelas: string[]; ritmo?: number; contador?: string }
  // liga estrelas por linhas; `nome` escreve o nome da figura embaixo dela no `nomeEm`
  | { acao: "ligar"; em: number; linhas: [string, string][]; nome?: string; nomeEm?: number }
  // a câmera se afasta (a figura fica pequena no céu); fator < 1
  | { acao: "afastar"; em: number; fator?: number }
  // a rosa dos ventos aparece num canto livre, com a direção dita em vermelho
  | { acao: "rumo"; em: number; direcao: Direcao }
  // destaca um segmento (o braço maior, uma distância) com uma cota e um texto curto
  | { acao: "destacar"; em: number; de: string; ate: string; texto?: string }
  // prolonga a reta de→ate, tracejada, até o ponto `alvo`; chega no `chegaEm`; `marca` = nome do alvo
  | {
      acao: "prolongar";
      em: number;
      de: string;
      ate: string;
      alvo: string;
      chegaEm?: number;
      marca?: { texto: string; em?: number; rosa?: boolean };
    }
  // estrela "muito brilhante": ganha raios e cresce
  | { acao: "brilhar"; em: number; estrelas: string[] }
  // dá nome a uma estrela (etiqueta com linha-guia)
  | { acao: "nomear"; em: number; estrela: string; texto: string; lado?: "cima" | "baixo" | "esquerda" | "direita" }
  // seta pontilhada que sai de `de`, passa por `por` e segue até perto de `alvo`; `texto` = selo de
  // confirmação que entra no `textoEm`
  | { acao: "apontar"; em: number; de: string; por: string; alvo: string; texto?: string; textoEm?: number };

// Um trecho de carta celeste: a pessoa na ocular e os passos acontecendo na fala.
export type Carta = Base & {
  tipo: "carta";
  // posição da ocular; sem ela, alterna sozinha
  ocular?: PosicaoOcular;
  // o que precisa estar no quadro desde o começo do momento (ids); sem ele, o do primeiro passo
  enquadrar?: string[];
  passos: Passo[];
};

export type Momento =
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
  | Cta
  | Constelacao
  | Carta;

export type Palavra = { em: number; ate: number; w: string };

// Um astro da carta. Com `id` do catálogo (src/catalogo.ts) basta o id; sem catálogo, dê `ar`/`dec`
// (ascensão reta em horas, declinação em graus) ou `x`/`y` (carta inventada, 0–1, y para baixo).
export type Astro = {
  id: string;
  ar?: number;
  dec?: number;
  x?: number;
  y?: number;
  // magnitude: quanto menor, maior a estrela (−1 a 5)
  mag?: number;
  nome?: string;
};

export type Ceu = {
  estrelas: Astro[];
  // pontos sem estrela (polo celeste, um planeta, um alvo): mesmo formato
  pontos?: Astro[];
  // centro da projeção (horas, graus); sem ele, o meio das estrelas. Define o "para cima" da carta.
  centro?: { ar: number; dec: number };
  // desenha a faixa da Via Láctea (só com ar/dec)
  viaLactea?: boolean;
  // muda o desenho das estrelinhas de fundo
  semente?: number;
};

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa dos cartões em tela cheia (px no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: assinatura no anel da ocular e no fechamento
  marca: { nome: string; area: string };
  ceu?: Ceu;
  // ajuste da pessoa dentro da ocular (zoom 0,4–0,7; alturaRosto 0,35–0,5 = onde o rosto fica no círculo)
  ocular?: { zoom?: number; alturaRosto?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
