// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática do Raio-X: uma sala de laudos, com três lugares para a pessoa.
// - Quadro cheio: a pessoa ocupa a tela e uma chapa-cartão (filme escuro com borda de luz fria)
//   entra na altura do peito (abertura, numero, destaque, definicao, frase, pergunta, laudo, cta).
// - Negatoscópio: a pessoa vira uma chapa iluminada no alto (à esquerda ou à direita, alternando),
//   o bloco do título fica do outro lado e embaixo acende um negatoscópio com o filme do momento
//   (ajuste, topicos, passos, comparacao, grafico). Cada momento traz o seu filme, que desliza por
//   cima do anterior.
// - Pausa: a pessoa no centro, entre um relógio e um cronômetro; o esqueleto se levanta e caminha.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é o `ajuste`: o raio-x que mostra onde está a tensão (vermelho) e o que
// corrige (ciano, ✓). Ele tem dois modos: `itens` (qualquer assunto: uma coluna vista de frente,
// cada item preso a uma vértebra, que se alinha no conserto) e `vista` + `passos` (postura: o
// esqueleto sentado à mesa que se corrige).

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ———————————————— quadro cheio (chapa-cartão no peito) ————————————————

// Abertura: à esquerda uma miniatura da chapa (com a coluna desalinhada; nos vídeos de postura, o
// esqueleto à mesa) e o texto que se revela palavra por palavra. `destaque` = trecho exato em vermelho
// (a dor, o problema); quando ele é dito, os pontos de tensão da miniatura acendem.
// `em` (opcional, nos quatro blocos de texto falado): quando o TEXTO começa a ser dito (padrão: `de`).
// Campos antigos (continuam valendo): `titulo` (= texto), `tensaoEm`, `chamada`.
export type Abertura = Base & {
  tipo: "abertura";
  texto?: string;
  titulo?: string;
  destaque?: string;
  em?: number;
  tensaoEm?: number;
  // a chamada troca o texto por uma frase curta ("Ajusta 3 coisas") e numera os ajustes no desenho
  chamada?: { texto: string; em: number; itens?: { em: number }[] };
};

// Número que conta até `valor` a partir de `em`, ao lado de um mostrador cujo anel se completa.
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

// Palavra ou frase curta que bate forte. "alerta" = vermelho com o ponto de tensão pulsando;
// "chave" (padrão) = branco com a régua ciano que se desenha embaixo.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Termo técnico: o termo grande, a cota ciano (├──┤) que o mede e o significado embaixo.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, palavra por palavra; `destaque` em ciano; `risco` = trecho riscado em vermelho
// quando é dito (em `riscoEm`).
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste: "?" num anel ciano e a pergunta; `opcoes` (2 a 4) entram como
// etiquetas de filme, cada uma na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Laudo (próprio): uma regra, um dado ou um alerta que merece ficar, com etiqueta ("LAUDO", "REGRA").
export type Laudo = Base & {
  tipo: "laudo";
  rotulo?: string;
  texto: string;
  // trecho exato do texto em ciano
  destaque?: string;
  em?: number;
};

// Fechamento: ícone, chamada falada, as chapas do vídeo em miniatura (cada uma ganha ✓) e a assinatura.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link" | "compartilhar";
  // trecho exato da chamada em ciano
  destaque?: string;
  em?: number;
  // false = sem as miniaturas das chapas
  recapitular?: boolean;
};

// ———————————————— negatoscópio (a pessoa no alto, o filme embaixo) ————————————————

// Lista sem ordem: "achados" no filme; cada item acende o seu anel quando é dito e a janela de
// leitura (faixa ciano) desce até ele.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: uma régua vertical com marcas; cada passo acende o seu número e a régua se
// enche até ele.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Dois filmes lado a lado no negatoscópio, como quem compara duas chapas.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico desenhado no filme em traço de osso: barras, linha ou anel (pizza). Sem números ditos:
// `tendencia` (uma curva que sobe, cai ou oscila) com a etiqueta ILUSTRATIVO.
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

// ———————————————— a assinatura: o ajuste (o raio-x) ————————————————

// Pontos do corpo (e da cena) que podem receber destaque, tensão ou rótulo
export type Alvo = "tela" | "olhos" | "pescoco" | "ombro" | "cotovelo" | "punho" | "lombar" | "quadril" | "joelho" | "tornozelo" | "pes";

// Partes da postura que se corrigem (cada uma sai do jeito errado para o certo):
// - tela: o monitor está baixo e sobe até a altura dos olhos;
// - pescoco: a cabeça projetada para a frente e olhando para baixo volta ao prumo;
// - tronco: as costas curvadas (pelve para trás, coluna em C) se endireitam;
// - pernas: os pés encolhidos embaixo da cadeira, na ponta, descem e apoiam no chão, joelho em 90°;
// - antebraco: o antebraço solto no ar desce e apoia na mesa;
// - cotovelo: o cotovelo afastado, lá na frente, volta para perto do corpo.
export type Parte = "tela" | "pescoco" | "tronco" | "pernas" | "antebraco" | "cotovelo";

// Recorte da chapa de postura (o que aparece no negatoscópio):
// - tela: cabeça, pescoço, tronco, mesa e monitor;
// - pernas: quadril, pernas, pés e chão;
// - bracos: tronco, braço, antebraço, mesa e teclado;
// - coluna: a coluna inteira com o crânio, sentado;
// - inteiro: o corpo todo à mesa.
export type Vista = "tela" | "pernas" | "bracos" | "coluna" | "inteiro";

export type Passo =
  // anel ciano que se desenha em volta do alvo, com etiqueta
  | { tipo: "destaque"; alvo: Alvo; rotulo?: string; em: number }
  // ponto vermelho que acende (pulsa) em `em` e apaga em `apagaEm` (fica ciano com ✓)
  | { tipo: "tensao"; alvo: Alvo; rotulo?: string; em: number; apagaEm?: number }
  // a parte sai do jeito errado e vai para o certo, começando em `em` (dura `dur`, padrão 0,9 s)
  | { tipo: "corrige"; parte: Parte; em: number; dur?: number }
  // linha de referência: "olhos" = linha horizontal na altura dos olhos até a tela;
  // "prumo" = linha vertical pelo ombro, onde a orelha tem que estar
  | { tipo: "linha"; linha: "olhos" | "prumo"; rotulo?: string; em: number }
  // arco de ângulo que se desenha na articulação, com o valor contando (mostra o ângulo real do desenho)
  | { tipo: "angulo"; alvo: "joelho" | "cotovelo" | "quadril"; rotulo?: string; em: number }
  // a superfície de apoio acende: chão sob os pés, mesa sob o antebraço, encosto atrás das costas
  | { tipo: "apoio"; alvo: "pes" | "antebraco" | "costas"; rotulo?: string; em: number }
  // seta de distância entre o cotovelo e o tronco (encolhe quando o cotovelo volta)
  | { tipo: "distancia"; alvo: "cotovelo"; em: number };

// Um item do raio-x de qualquer assunto: preso a uma vértebra da coluna vista de frente.
// "tensao" (padrão) = o problema: o ponto acende em vermelho e pulsa; apaga para o ciano com ✓ em
// `apagaEm` ou no `alinha`. "ok" = o que está certo/o conserto: entra já em ciano com ✓.
export type ItemDoRaioX = { texto: string; em: number; tipo?: "tensao" | "ok"; apagaEm?: number };

// O ajuste: a pessoa vira chapa iluminada no alto; o negatoscópio mostra o raio-x.
export type Ajuste = Base & {
  tipo: "ajuste";
  // título grande, com palavras faladas ("Por que perdem na alta", "Tela na altura dos olhos")
  titulo: string;
  // linha de apoio, também falada ("pra não curvar o pescoço")
  apoio?: string;
  // etiqueta acima do título; padrão "AJUSTE 1/3" (postura) ou "RAIO-X" (itens)
  rotulo?: string;
  // de que lado a pessoa fica; padrão: alterna, começando pela esquerda
  lado?: "esquerda" | "direita";
  // — modo qualquer assunto: a coluna de frente, 2 a 5 itens presos às vértebras
  itens?: ItemDoRaioX[];
  // o conserto: a coluna se endireita, a linha de prumo ciano se desenha (com `texto` numa etiqueta)
  // e todas as tensões apagam para o ciano com ✓
  alinha?: { em: number; texto?: string };
  // — modo postura: o esqueleto sentado à mesa, de perfil
  vista?: Vista;
  passos?: Passo[];
};

// Pausa (própria): a pessoa no centro, relógio à esquerda e cronômetro à direita; na chapa, o
// esqueleto sentado se levanta e caminha (intervalo, rotina, "a cada X, faça Y")
export type Pausa = Base & {
  tipo: "pausa";
  // título com palavras faladas, escrito na chapa ("A cada hora, levanta e caminha 2 minutos")
  titulo: string;
  // o ponteiro dá uma volta de `em` até `ate` (padrão em + 1 s); `texto` vai embaixo ("1 h")
  relogio?: { texto: string; em: number; ate?: number };
  levantaEm?: number;
  caminhaEm?: number;
  // o anel do cronômetro se completa; `texto` no centro ("2 min")
  tempo?: { texto: string; em: number };
};

export type Momento =
  | Abertura
  | Numero
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Laudo
  | Cta
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Ajuste
  | Pausa;

export type TipoDeMomento = Momento["tipo"];

// Momentos que acendem o negatoscópio (a pessoa vira a chapa no alto)
export type MomentoDeChapa = Ajuste | Topicos | Passos | Comparacao | Grafico;
export const NO_NEGATOSCOPIO: TipoDeMomento[] = ["ajuste", "topicos", "passos", "comparacao", "grafico"];
export const ehDeChapa = (m: Momento): m is MomentoDeChapa => NO_NEGATOSCOPIO.includes(m.tipo);

// Ajuste de postura (esqueleto à mesa) × ajuste de qualquer assunto (coluna de frente)
export const ehPostura = (m: Momento): m is Ajuste & { vista: Vista; passos: Passo[] } => m.tipo === "ajuste" && !!m.vista && !m.itens?.length;

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
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa das artes de quadro cheio (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: rodapé da chapa da pessoa e assinatura do fechamento
  marca: { nome: string; area: string };
  // enquadramento da pessoa nas chapas do alto: zoom (1 a 1,7; menor mostra mais) e altura do rosto
  // (0 a 1). Sem isto, o template calcula pelo tamanho do rosto na gravação.
  retrato?: { zoom?: number; ancoraY?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
