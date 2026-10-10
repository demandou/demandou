// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// O estilo Respiro: a página de um diário em papel pêssego; a pessoa numa janela em arco que respira
// junto e muda de lugar devagar; uma forma macia de damasco que enche, segura e esvazia no ritmo da
// fala; notas escritas à mão; o que ainda vai acontecer já aparece a lápis.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é o respiro: `fase` (a forma enche / segura / esvazia, com o anel que
// marca o ritmo da fala) e `ciclos` (a forma se divide em várias que respiram uma de cada vez).

// Onde a pessoa (a janela em arco) fica durante o momento:
// "janela"   = arco grande no alto; o papel embaixo recebe o texto
// "pagina"   = arco menor no alto, no centro; o papel embaixo é mais alto (listas, passos, gráficos)
// "esquerda" = arco no alto à esquerda; notas à direita; a forma grande embaixo
// "direita"  = arco no alto à direita; notas à esquerda; a forma grande embaixo
// "embaixo"  = a forma no alto; arco embaixo à esquerda; notas embaixo à direita
// "centro"   = arco menor no alto, no centro; a forma grande embaixo, com o texto dentro dela
// "dupla"    = duas formas lado a lado no alto; o arco embaixo, no centro (comparação)
// "fecho"    = arco centralizado, mais estreito; o papel embaixo recebe a chamada e a assinatura
export type Layout = "janela" | "pagina" | "esquerda" | "direita" | "embaixo" | "centro" | "dupla" | "fecho";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (só nos layouts com papel embaixo)
  legenda?: boolean;
  // troca o lugar padrão do bloco (raro: o template já alterna sozinho)
  layout?: Layout;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ———————————————————— blocos universais ————————————————————

// Abertura: uma nota à mão (opcional) + o título em serifada, palavra por palavra.
// `destaque` = trecho do título com grifo de marca-texto. `em` = quando o texto começa a ser dito.
// Se o vídeo ensina uma respiração (ou qualquer ciclo com números ditos), `mapaEm` desenha o mapa
// do respiro embaixo, uma etapa por `fase` do plano.
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // linha curta à mão, como num diário (até ~28 caracteres)
  mao?: string;
  // nome antigo de `destaque` (continua valendo)
  enfase?: string;
  // quando cada etapa do mapa ganha tinta (o `em` do número dito), uma por `fase`, na ordem
  mapaEm?: number[];
};

// Lista sem ordem (motivos, erros, dicas, sinais): página do diário, cada item escrito à mão com
// uma bolinha de damasco que respira quando ele é dito.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: o caminho do respiro. Estações numeradas numa linha a lápis; o ponto de
// damasco anda de uma para a outra quando cada passo é dito e a linha ganha tinta atrás dele.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: a forma enche enquanto o número conta no centro dela, com o anel correndo.
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

// Dois lados: duas formas lado a lado. A do lado que vence enche; a outra esvazia e fica a lápis.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico à mão: linha (traço de tinta com o ponto na ponta), barras macias que enchem de damasco,
// pizza (o anel dividido). Sem números ditos: `tendencia` desenha a forma, com "ilustrativo" à mão.
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

// Destaque: a frase curta dentro da forma grande. "chave" = a forma enche quando a frase é dita;
// "alerta" = a forma perde o ar (esvazia). `detalhe` = uma linha à mão em cima da frase.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: o termo em serifada, sublinhado à mão; um traço desce e o significado se escreve à mão.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, como uma nota do diário: serifada palavra por palavra; `destaque` = grifo;
// `risco` = trecho riscado à mão quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste; as opções são escritas à mão, cada uma com uma bolinha que enche.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a janela estreita; o ícone a lápis ganha tinta, a chamada se escreve à mão e a
// assinatura entra embaixo.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link" | "enviar";
  // trecho da chamada que ganha sublinhado de damasco quando é dito
  destaque?: string;
  em?: number;
  // quando o ícone ganha cor (padrão: a primeira palavra)
  iconeEm?: number;
  // quando a assinatura (marca) entra; padrão: logo depois da última palavra
  assinaturaEm?: number;
};

// ———————————————————— a assinatura: o respiro ————————————————————

// Como a forma se comporta: enche (inspira), fica cheia (segura) ou esvazia (solta).
// "enche", "fica" e "esvazia" são sinônimos, para assuntos que não são respiração.
export type NomeDaFase = "inspira" | "segura" | "solta" | "enche" | "fica" | "esvazia";

// Uma fase do respiro: a forma enche, fica cheia ou esvazia ao longo de um trecho falado, dentro
// de um anel que marca o ritmo. O anel tem uma marca por número contado (`contagem`), uma por
// palavra marcada (`marcas`, que aparecem no centro da forma) ou nenhuma (traço contínuo).
export type Fase = Base & {
  tipo: "fase";
  fase: NomeDaFase;
  // nota à mão grande (1 a 3 palavras): "inspira", "ciclo de alta", "aquece"
  nota: string;
  // complemento à mão: "pelo nariz", "das criptomoedas"
  detalhe?: string;
  // até quanto se conta, quando a fala conta (2 a 10)
  contagem?: number;
  // palavras ditas que entram no centro da forma, uma por marca do anel (2 a 5)
  marcas?: { texto: string; em: number }[];
  // começo e fim do trecho que enche/esvazia (padrão: a primeira e a última marca, ou o momento)
  contaEm?: number;
  chegaEm?: number;
};

// Repetição ou partes: a forma se divide em N formas menores, que respiram uma de cada vez.
// Com `itens`, cada forma respira quando o seu item é dito e os itens se escrevem na coluna.
export type Ciclos = Base & {
  tipo: "ciclos";
  // quantas vezes (2 a 6); com `itens`, é o número de itens
  vezes?: number;
  itens?: Item[];
  // quando a forma se divide (padrão: logo antes do primeiro item)
  divideEm?: number;
  nota?: string;
  detalhe?: string;
};

// ———————————————————— blocos próprios ————————————————————

// Nota do diário: uma linha à mão (com sublinhado opcional) e uma frase em serifada (com grifo
// opcional). Com `ondaEm`, uma onda se desenha embaixo e vai ficando mais lenta: desacelerar.
export type Nota = Base & {
  tipo: "nota";
  mao?: string;
  sublinhar?: string;
  sublinharEm?: number;
  texto: string;
  grifo?: string;
  grifoEm?: number;
  ondaEm?: number;
};

// Lista curta (nome antigo de `topicos`, continua valendo).
export type Lista = Base & {
  tipo: "lista";
  titulo: string;
  enfase?: string;
  itens: { em: number; texto: string; detalhe?: string }[];
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
  | Fase
  | Ciclos
  | Nota
  | Lista;

export type TipoDeMomento = Momento["tipo"];

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // calculada pelo motor; este modelo não usa (a pessoa fica sempre numa janela)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste do enquadramento nas janelas menores: zoom (padrão 1,25) e altura do rosto na janela
  // (0–1, padrão 0,42). Gravação de perto (selfie): zoom ~1.
  janela?: { zoom?: number; ancoraY?: number };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
