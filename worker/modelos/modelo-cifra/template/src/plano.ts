// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Cifra (um estilo, não um assunto): a pessoa fala numa JANELA que muda de lugar a cada
// momento e pulsa de leve no tempo; o resto da tela é um palco escuro de ébano onde a fala vira desenho
// de aula de música — cordas, trastes, bolinhas de dedo, a linha de compassos com o metrônomo, as setas
// da batida, a folha de cifra na estante. Tudo nasce a lápis e ganha tinta (marfim; azul para o que
// soa agora) no instante em que é dito. Abertura, destaque, frase, pergunta e fechamento ficam em quadro
// cheio, num cartão de palco na altura do peito.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // onde a pessoa fica durante o momento (cada tipo tem o seu padrão; troque só para variar
  // quando dois momentos do mesmo tipo vêm seguidos)
  janela?: Janela;
};

// cheio = quadro cheio · topo = janela larga em cima · canto = janela no canto de cima, à direita ·
// centro = janela no meio, em cima · estante = janela embaixo (a cifra fica em cima, como na estante)
export type Janela = "cheio" | "topo" | "canto" | "centro" | "estante";

// Um acorde. Para os acordes do dicionário do template (veja `acordes.ts`) bastam `cifra` e `em`;
// para os outros, escreva `forma` e `dedos`.
export type Acorde = {
  // a cifra ("G", "Em", "F#m", "A7")
  cifra: string;
  // o nome falado, em português ("Sol", "Mi menor"); sem ele, sai da cifra
  nome?: string;
  // casas de cada corda, da 6ª (Mi grave) para a 1ª (mi agudo): "320003". x = não toca, 0 = solta.
  // Com casa acima de 9, separe por vírgula: "x,10,12,12,12,10"
  forma?: string;
  // dedo de cada corda, no mesmo formato (1 indicador, 2 médio, 3 anelar, 4 mínimo; 0 ou x = sem dedo).
  // O mesmo dedo em várias cordas na mesma casa vira pestana
  dedos?: string;
  // quando o acorde é dito: o diagrama se desenha nesse instante
  em: number;
};

// ————————————————————————————————————————————————————————————————————————————————————————————
// OS 11 BLOCOS UNIVERSAIS (os mesmos tipos e campos em todos os modelos do pack), desenhados na
// linguagem do Cifra. `em`/`…Em` = o instante de uma palavra dita (work/palavras.json).

// Abertura: quadro cheio, cartão de palco no peito. O título se monta palavra por palavra; um número no
// começo vira o numeral grande azul ("4 acordes"). Opcional, do Cifra: uma linha de apoio escrita como
// linha de cifra (`apoio` + `cifras` em cima das palavras).
export type Abertura = Base & {
  tipo: "abertura";
  // o título, com palavras faladas (até ~40 caracteres); o número pode vir em algarismo ("4 acordes")
  texto?: string;
  // nome antigo de `texto` (continua valendo)
  titulo?: string;
  // trecho exato (do texto ou do apoio) em azul
  destaque?: string;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // linha de apoio, também falada ("você toca centenas de músicas")
  apoio?: string;
  // cifras escritas em cima das palavras do apoio (até 6); cada uma acende junto com a palavra embaixo dela
  cifras?: string[];
};

type Item = { texto: string; em: number; detalhe?: string };

// Tópicos (lista sem ordem: motivos, erros, dicas, sinais): a folha de cifra na estante; cada item é
// uma linha da letra, com a bolinha de dedo e a faixa que enche como karaokê enquanto o item é dito.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos (em ordem: sequência, processo, caminho): a linha de compassos com o metrônomo; cada passo
// num compasso numerado, a seta de troca se desenha até o próximo, o pêndulo bate a cada passo.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: conta até `valor` a partir de `em` (pt-BR), com uma bolinha de dedo que sobe o braço do violão
// enquanto conta e as cordas que soam quando ele chega.
export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  // o que o número mede ("Bitcoin", "dias para devolver")
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
};

// Comparação: dois lados, cada um numa corda; o que soa (vencedor, certo, depois) fica azul com ○,
// o que não soa ganha × e a corda abafada.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: barras = setas para cima sobre as cordas (altura proporcional ao valor); linha = uma corda
// que passa pelos pontos (bolinhas de dedo); pizza = a boca do violão dividida; sem números ditos,
// uma curva (sobe/cai/oscila) com a etiqueta "ilustrativo".
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

// Destaque: quadro cheio, a palavra grande e as seis cordas tocadas quando ela é dita.
// "chave" = azul, com ○ (a corda que soa); "alerta" = × e as cordas abafadas.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: na folha de cifra, o termo vai em cima, como a cifra, e o significado embaixo, como a letra
// (que enche como karaokê enquanto é dito).
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: quadro cheio, cartão no peito com uma frase (uma regra, uma dica, uma virada).
export type Frase = Base & {
  tipo: "frase";
  // etiqueta pequena acima ("DICA", "ATENÇÃO")
  rotulo?: string;
  // a frase, fiel ao que foi dito (até ~70 caracteres); cada palavra entra quando é falada
  texto: string;
  // trecho exato do texto em azul
  destaque?: string;
  // trecho exato do texto riscado quando é dito (a partir de `riscoEm`, ou da primeira palavra dele)
  risco?: string;
  riscoEm?: number;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
};

// Pergunta: quadro cheio, a fermata (o sinal de "segura") em cima e a pergunta palavra por palavra;
// as opções (2 a 4) entram como etiquetas, cada uma com a palheta, na palavra dela.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: quadro cheio, cartão com a palheta, nome, área, a chamada e o botão que é "apertado".
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com palavras faladas (até ~40 caracteres)
  texto: string;
  // o ícone do botão: salvar, seguir, comentar ou link (padrão: seguir)
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato da chamada em azul, com traço embaixo (o botão é apertado quando ele é dito)
  destaque?: string;
  // quando a chamada começa a ser dita (padrão: `de`)
  em?: number;
  // o que o botão diz (padrão: o nome do ícone: "Seguir", "Salvar", "Comentar", "Saiba mais")
  botao?: string;
  // quando o botão é apertado (padrão: o destaque, ou a primeira palavra)
  botaoEm?: number;
};

// ————————————————————————————————————————————————————————————————————————————————————————————
// A ASSINATURA DO CIFRA (tipos próprios). Servem para música e, como metáfora, para qualquer assunto.

// Acordes: a pessoa sobe para a janela e os diagramas (1 a 4) se desenham, cada um no seu `em`.
// Só acordes de verdade (instrumento de 6 cordas): o diagrama nunca é inventado.
export type Acordes = Base & {
  tipo: "acordes";
  acordes: Acorde[];
};

// Compasso: a linha de compassos com o metrônomo de pêndulo. Cada compasso é uma cifra (com diagrama)
// ou um texto curto qualquer (um tempo de uma rotina, de um ciclo, de um hábito que se repete).
export type Compasso = Base & {
  tipo: "compasso";
  // 2 a 5 compassos, na ordem: uma cifra ("G") ou um texto ("Treino"); com `em`, nasce a lápis e ganha
  // tinta quando é dito
  compassos: (string | { texto: string; em?: number })[];
  // false = só os textos, sem diagrama
  diagramas?: boolean;
  // título curto, no lugar do andamento enquanto ele não muda (opcional)
  titulo?: string;
  // quando as setas de troca entre os compassos se desenham ("treina a TROCA")
  trocaEm?: number;
  // quando o compasso em curso começa a andar; sem ele, no primeiro andamento (ou no `de`)
  tocarEm?: number;
  // velocidades do metrônomo, cada uma a partir do seu `em`; `periodo` = segundos por compasso
  // (sem ele: 1 s no primeiro, metade a cada novo andamento). Sem andamentos: 1 s, a partir do `de`
  andamentos?: { em: number; texto: string; periodo?: number }[];
};

// Batida: um padrão de setas para baixo e para cima sobre as seis cordas, cada uma quando é falada.
// Na música, a batida da mão; em qualquer assunto, os altos e baixos (o que sobe, o que cai).
export type Batida = Base & {
  tipo: "batida";
  // título curto com palavras faladas ("Batida simples", "Tem gente que perde")
  titulo: string;
  // 2 a 6 setas; `rotulo` troca o texto embaixo da seta (padrão "baixo"/"cima"; até ~14 caracteres)
  setas: { dir: "baixo" | "cima"; em: number; rotulo?: string }[];
};

// Cifra: a folha na estante, com marcas em cima das linhas da letra (desenhadas como faixas) acendendo
// uma a uma; e, se quiser, a semana que se completa. Na música, os acordes da música; em qualquer
// assunto, as marcas de um roteiro (o que entra em cada parte).
export type Cifra = Base & {
  tipo: "cifra";
  // título da folha, com palavras faladas; entra a lápis e ganha tinta em `tituloEm`
  titulo: string;
  tituloEm?: number;
  // tom da música, no canto da folha ("G"); só se a pessoa disse ou se a progressão deixa claro
  tom?: string;
  // a semana: os 7 dias se marcam a partir de `em`, um a um; `rotulo` em cima ("1 semana de treino")
  semana?: { em: number; rotulo?: string };
  // linhas (1 a 3), cada uma com 1 a 4 marcas: uma cifra ("G") ou um texto curto ("Mercado")
  linhas: { cifra: string; em: number }[][];
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
  | Acordes
  | Compasso
  | Batida
  | Cifra;

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
  // nome e área: aparecem no fechamento
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
