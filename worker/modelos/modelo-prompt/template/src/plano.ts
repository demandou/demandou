// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O estilo Prompt: uma bancada cinza-clara onde as ideias se montam com peças coloridas que
// encaixam como blocos com dente (o texto de cada peça é digitado na fala), num chat fictício em
// que o que é vago chega cinza e borrado e o que é certo entra em foco. A pessoa muda de lugar a
// cada momento: tela cheia (cartão branco no peito), janela larga no alto, janela no canto,
// janelinha ao lado de um cartão.
//
// Há dois grupos de tipos:
// - os 11 blocos universais (iguais em todos os modelos do pack, motor/BLOCOS.md): abertura, topicos,
//   passos, numero, comparacao, grafico, destaque, definicao, frase, pergunta e cta;
// - os tipos próprios do Prompt (a assinatura): montagem (as peças que se somam), vago (o pedido vago
//   e a resposta borrada) e resposta (a caixa do prompt e a resposta que entra em foco).

// desenhos a traço das peças (o padrão sai do nome: Papel, Tarefa, Contexto, Formato…)
export type Icone =
  | "cracha"
  | "lista"
  | "alfinete"
  | "tabela"
  | "balao"
  | "pessoas"
  | "alvo"
  | "documento"
  | "regua"
  | "relogio"
  | "lampada"
  | "sol"
  | "alerta"
  | "chave"
  | "grafico"
  | "moeda"
  | "coracao"
  | "casa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (só nos momentos em tela cheia)
  legenda?: boolean;
};

// ---------------------------------------------------------------------------------------------
// Os 11 blocos universais (mesmos campos em todos os modelos)
// ---------------------------------------------------------------------------------------------

// um item dito: entra no instante `em` da palavra que o nomeia
export type ItemDito = { texto: string; em: number; detalhe?: string };

// Tela cheia. No peito, a caixa de mensagem do chat: o texto é digitado na fala, o `destaque` na
// cor da primeira peça, e o botão de enviar é tocado quando a frase termina.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Bancada. A resposta do assistente em lista: cada item entra em foco na sua palavra, com uma peça
// pequena numerada que encaixa ao lado; o cabeçalho ao lado da janela conta "2 de 3".
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemDito[] };

// Bancada. Peças numeradas que encaixam uma na outra pelo dente (a ordem), cada uma com o seu passo
// digitado na fala num balão ao lado.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemDito[] };

// Tela cheia. O cartão do assistente: o rótulo e o número dentro de uma peça que encaixa e conta.
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

export type Lado = { rotulo: string; texto: string; em: number };

// Bancada (pessoa na janela larga do alto). Dois cartões lado a lado que entram em foco; o que
// perde fica "vago" (cinza, tracejado) e o que ganha ganha a cor e o visto.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Bancada. A resposta do assistente com um gráfico que entra em foco: barras em forma de peça,
// linha que se desenha ou uma fila de peças proporcional (pizza). Sem números ditos: a forma da
// tendência, com a etiqueta "ilustrativo".
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

// Tela cheia. Uma peça grande que encaixa no peito com o texto digitado na fala; "alerta" usa a
// framboesa, "chave" o anil. O detalhe entra numa etiqueta escura.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Tela cheia. Uma conversa curta: o termo vai num balão escuro (digitado) e o significado chega no
// balão do assistente, entrando em foco palavra por palavra.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Tela cheia. Uma nota fixada: as palavras entram em foco na fala; `risco` é riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Tela cheia. A caixa de mensagem com a pergunta digitada e, acima dela, as sugestões (opções)
// que acendem quando são ditas.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Tela cheia. O fechamento: o prompt salvo (as peças da última montagem, em fila), a chamada montada
// na fala e o botão tocado na palavra. `titulo`, `salvarEm`, `testarEm` e `acao` são do formato
// antigo (dois botões: Salvar + Testar/Seguir/Enviar) e continuam valendo.
export type Cta = Base & {
  tipo: "cta";
  texto?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // formato antigo
  titulo?: string;
  salvarEm?: number;
  testarEm?: number;
  acao?: "testar" | "seguir" | "enviar";
};

// ---------------------------------------------------------------------------------------------
// A assinatura do Prompt
// ---------------------------------------------------------------------------------------------

// A abertura clássica: a pessoa em tela cheia e, no peito, um chat. O pedido vago é digitado e
// enviado, a resposta chega cinza e borrada, e duas etiquetas com palavras da fala marcam o problema.
export type Vago = Base & {
  tipo: "vago";
  // o pedido vago digitado na caixa (ilustrativo, curto: até ~22 caracteres)
  pedido: string;
  // quando o pedido é enviado (padrão: de + 0,95)
  enviaEm?: number;
  // texto genérico da resposta, mostrado borrado (padrão: uma resposta genérica pronta)
  resposta?: string;
  // etiqueta presa na resposta, na palavra dita ("resultado ruim"), até ~18 caracteres
  rotuloResposta?: { texto: string; em: number };
  // etiqueta presa no pedido, na palavra dita ("pedido vago"); o balão do pedido fica cinza
  rotuloPedido?: { texto: string; em: number };
};

// Uma peça
export type Peca = {
  // quando a peça começa a ser dita (o nome, se a pessoa diz o nome; senão a primeira palavra)
  em: number;
  // nome curto (até ~10 caracteres): vira o letreiro da peça e o título grande. Opcional.
  nome?: string;
  // o que a pessoa diz, fiel à fala (até ~40 caracteres); digitado palavra por palavra
  texto: string;
  icone?: Icone;
};

// A bancada (a assinatura): a pessoa sobe para uma janela grande, o título é montado e as vagas
// das peças aparecem a lápis; na primeira peça a pessoa vai para o canto e cada peça encaixa na
// pilha com o texto digitado na fala. Serve para tudo que "se soma numa coisa só".
export type Montagem = Base & {
  tipo: "montagem";
  // título da bancada, fiel à fala, até ~34 caracteres. Opcional (sem título, a pessoa vai direto para o canto)
  titulo?: string;
  // trecho exato do título que ganha a cor da primeira peça
  destaque?: string;
  // 2 a 5 peças, na ordem da fala
  itens: Peca[];
};

// A resposta: as peças vão para a caixa, que é enviada; a resposta chega borrada e entra em foco
// linha por linha (tabela, ou só título e etiquetas). A cor de cada peça reaparece no que ela mudou.
export type Resposta = Base & {
  tipo: "resposta";
  // quando a caixa é enviada (padrão: de + 0,8)
  enviaEm?: number;
  // quando a resposta começa a entrar em foco (padrão: enviaEm + 0,5)
  viraEm?: number;
  // título da resposta, até ~22 caracteres
  titulo: string;
  // o papel que a IA assumiu, no cabeçalho do assistente, na cor da peça 1
  papel?: string;
  // até 3 etiquetas sob o título, cada uma na cor da peça de onde veio (índice a partir de 0)
  etiquetas?: { texto: string; peca: number }[];
  // 2 ou 3 colunas; a última costuma ser o número (sem colunas/linhas: só título e etiquetas)
  colunas?: string[];
  destaqueColuna?: number;
  corDestaque?: number;
  // linha de destaque antes das outras, pintada com a cor de uma peça
  nota?: { texto: string; valor?: string; peca?: number };
  // até 5 linhas, cada uma com uma célula por coluna
  linhas?: string[][];
  // etiqueta "exemplo" ao lado do título (padrão: true quando há tabela)
  exemplo?: boolean;
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
  | Vago
  | Montagem
  | Resposta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho (1920 = 9:16; 1440 = 3:4). O modelo.json fixa 9:16 em gravação vertical.
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // calculada pelo motor: os cartões do peito ficam abaixo de `zona.topo` (abaixo do queixo)
  zona?: { topo: number; altura: number };
  // assinatura: nome na etiqueta da janela e no fechamento; área ao lado
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  // ajuste fino do rosto nas janelas (px): + desce o rosto dentro da janela, − sobe
  ajusteJanela?: number;
  sfx?: boolean;
};

// tipos que põem a pessoa em tela cheia com um cartão no peito
export const TIPOS_PEITO = ["abertura", "numero", "destaque", "definicao", "frase", "pergunta", "cta", "vago"] as const;
// tipos da bancada (a pessoa numa janela)
export const TIPOS_BANCADA = ["topicos", "passos", "comparacao", "grafico", "montagem", "resposta"] as const;
export const ehPeito = (m: Momento) => (TIPOS_PEITO as readonly string[]).includes(m.tipo);
export const ehBancada = (m: Momento) => (TIPOS_BANCADA as readonly string[]).includes(m.tipo);
