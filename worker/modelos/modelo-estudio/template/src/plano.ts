// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática do Estúdio: um corte de podcast. A pessoa fica num quadro de estúdio (a "câmera")
// que muda de lugar e de tamanho a cada momento e troca de enquadramento (aberto, médio, close)
// como num corte de câmera. Embaixo do quadro corre a onda do áudio de verdade. No alto, a régua do
// episódio: chip "EP. 12", o capítulo atual e a barra de capítulos. Fora dos momentos, a pessoa fica
// no quadro grande com a legenda.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `resposta` (o cartão P/R de entrevista) e `trilha` (a história no
// tempo); `citacao` e `player` são os nomes antigos de `frase` e `cta` (continuam valendo).

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // abre um capítulo novo na régua do alto ("A PERGUNTA"); até ~16 caracteres
  capitulo?: string;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— blocos universais ———

// Abertura: a pessoa no quadro grande e o título que se monta palavra por palavra embaixo dela.
// `titulo` é o nome antigo de `texto` (continua valendo). `em`: quando o texto começa a ser dito.
export type Abertura = Base & { tipo: "abertura"; texto?: string; titulo?: string; destaque?: string; em?: number };

// Lista sem ordem: a "pauta" do episódio, num cartão de estúdio; cada item com a marca de tempo do
// episódio em que é dito e um cursor rosa que desce até o item da vez.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: a pessoa desce para o pé da tela e, em cima, os capítulos numerados com a barra
// de capítulos em pé, que se preenche passo a passo (como a régua do alto).
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta (pt-BR) na coluna ao lado da pessoa; embaixo, o medidor de nível sobe junto.
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

// Dois lados, como duas faixas lado a lado embaixo do quadro.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: a pessoa desce para o pé da tela e o gráfico ocupa o alto. Barras = barras da onda;
// linha = pontos ligados; pizza = anel. Sem números ditos: `tendencia` desenha uma onda que sobe,
// cai ou oscila, com a etiqueta ILUSTRATIVO.
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

// Uma palavra ou frase curta que bate forte. "alerta" = a placa rosa de "no ar"; "chave" = branco
// com o sublinhado rosa. A câmera corta para o close no `em`.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Termo e significado, como uma nota de glossário embaixo do quadro.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito (o mesmo componente da `citacao`): a frase inteira a lápis, cada palavra acende na
// fala; `risco` é riscado quando é dito; `destaque` acende no rosa com sublinhado.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // etiqueta acima da frase (padrão: "FRASE DO EPISÓDIO")
  rotulo?: string;
};

// Pergunta: o cartão "P" de entrevista. Serve para a pergunta feita para quem assiste, lida de um
// comentário ou contada. `opcoes` (2 a 4) entram como etiquetas dentro do cartão.
export type Pergunta = Base & {
  tipo: "pergunta";
  texto: string;
  destaque?: string;
  opcoes?: { texto: string; em: number }[];
  em?: number;
  // o nome do cartão (padrão: "PERGUNTA"); a letra grande é a primeira letra dele
  rotulo?: string;
  // a marca grande pendurada à esquerda (padrão: a primeira letra do rótulo); ex.: "¼", "1", "?"
  letra?: string;
};

// Fechamento: o quadro da pessoa vira a capa de um player; a chamada falada fica embaixo, com o
// verbo num botão que é apertado quando é dito (o mesmo componente do `player`).
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // título do player (padrão: o texto da abertura, ou o programa da `marca`)
  titulo?: string;
  // linha falada em mono acima do título
  rotulo?: string;
  // a palavra do texto que vai no botão (padrão: o primeiro verbo de chamada)
  botao?: string;
  // quando o botão é apertado (padrão: quando a palavra do botão é dita)
  seguirEm?: number;
  // quando o resto do episódio acende na barra (só com `episodio.inicio` e `total`)
  restoEm?: number;
};

// ——— a assinatura ———

// Resposta: no mesmo cartão da pergunta, ela encolhe para uma linha e entra o "R" com a resposta.
// `fileira`: marcas curtas que acendem uma a uma (os 7 dias, "1 2 3", ou palavras ditas, cada uma
// no seu `em`).
export type Marca = string | { texto: string; em: number };
export type Resposta = Base & {
  tipo: "resposta";
  // a resposta, fiel à fala (até ~60 caracteres)
  texto: string;
  destaque?: string;
  // a pergunta que ela responde, em uma linha no alto do cartão (sem isto, usa a do momento
  // `pergunta` anterior)
  pergunta?: string;
  // quando o rótulo "RESPOSTA" acende (ex.: no "Eu respondi"); sem isto, na entrada
  rotuloEm?: number;
  // o nome do cartão (padrão: "RESPOSTA"); a letra grande é a primeira letra dele
  rotulo?: string;
  // a marca grande pendurada à esquerda (padrão: a primeira letra do rótulo); ex.: "¼", "1", "!"
  letra?: string;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // marcas que acendem uma a uma: strings (a partir de `em`, uma a cada 0,1 s) ou objetos com o
  // próprio `em` (cada uma na sua palavra)
  fileira?: { itens: Marca[]; em?: number };
};

// Um ponto da trilha: número que conta (`valor`) ou, sem número, um texto curto (`texto`).
export type PontoDaTrilha = {
  em: number;
  valor?: number;
  texto?: string;
  unidade?: string;
  rotulo?: string;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  // só no início: o valor é em minutos e vira um cronômetro 00:00 → 10:00
  relogio?: boolean;
};

// Trilha: a história no tempo. A pessoa vai para uma coluna à esquerda; à direita, o começo pequeno e
// o grande (número que conta ou texto que acende); embaixo, a trilha do tempo (barras como uma onda)
// que se preenche junto, e o marco no fim. Sem números ditos: `texto` nos pontos e `ilustrativo`.
export type Trilha = Base & {
  tipo: "trilha";
  // o começo, pequeno (opcional)
  inicio?: PontoDaTrilha;
  // o ponto grande; a trilha se preenche de `em` até `ate` (a palavra do número ou da virada)
  contagem: PontoDaTrilha & { ate?: number };
  // o marco que chega no fim da trilha ("1º cliente")
  marco?: { em: number; texto: string };
  // rótulos das pontas da trilha (padrão: o `rotulo` do início e o da contagem)
  pontas?: [string, string];
  // a forma das barras: "constante" (começa irregular e assenta), "sobe", "cai", "oscila"
  curva?: "constante" | "sobe" | "cai" | "oscila";
  // mostra a etiqueta ILUSTRATIVO (as barras não são dados)
  ilustrativo?: boolean;
};

// ——— nomes antigos (continuam valendo) ———

// Citação = `frase` (com `risca` no lugar de `risco`).
export type Citacao = Base & {
  tipo: "citacao";
  texto: string;
  risca?: string;
  risco?: string;
  riscoEm?: number;
  destaque?: string;
  rotulo?: string;
  em?: number;
};

// Player = `cta` (com `chamada` no lugar de `texto`).
export type Player = Base & {
  tipo: "player";
  rotulo?: string;
  titulo?: string;
  chamada?: string;
  texto?: string;
  botao?: string;
  seguirEm?: number;
  restoEm?: number;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
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
  | Resposta
  | Trilha
  | Citacao
  | Player;

export type TipoDeMomento = Momento["tipo"];

// enquadramento da "câmera" (o quadro da pessoa)
export type Enquadramento = "aberto" | "medio" | "close";

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho (1920 = gravação vertical; 1440 = horizontal recortada em 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // opcional: quanto a cabeça ocupa acima e abaixo do centro do rosto, em fração da altura do quadro
  // (padrão { acima: 0.155, abaixo: 0.125 }). Aumente se o close cortar o cabelo ou o queixo.
  cabeca?: { acima: number; abaixo: number };
  // faixa abaixo do queixo (o motor calcula; este modelo reposiciona a pessoa e não depende dela)
  zona?: { topo: number; altura: number };
  // nome e área: rótulo do programa e o player do fechamento
  marca: { nome: string; area: string };
  // o episódio de onde o corte saiu: número, onde o corte começa e a duração total ("MM:SS" ou "H:MM:SS")
  episodio?: { numero?: string; inicio?: string; total?: string };
  // cortes de câmera: a partir de `em`, o quadro usa este enquadramento (troca seca). Vazio = automático
  cameras?: { em: number; plano: Enquadramento }[];
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
