// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Clínico. Os tipos próprios
// (titulo, contagem, cronometro, anatomia, checklist) e os campos extras são opcionais.

// Onde a pessoa fica durante o momento. A pessoa é a LUPA: um círculo com aro azul
// que viaja pela tela e muda de tamanho, com o conteúdo em volta.
// "cheio"  = vídeo em tela cheia; a base do quadro vira névoa branca e o texto entra ali
// "topo"   = lupa grande no alto; título e conteúdo embaixo
// "centro" = lupa no meio da tela, cercada por um mostrador (o anel corre em volta da pessoa)
// "canto"  = lupa pequena no canto de cima à direita; título ao lado, conteúdo grande embaixo
// "lado"   = lupa média à esquerda; título à direita dela, conteúdo embaixo
export type Layout = "cheio" | "topo" | "centro" | "canto" | "lado";

export type Veredito = {
  em: number;
  // "errado" = ✗ vermelho; "certo" = ✓ azul
  tipo: "certo" | "errado";
  // frase curta com palavras da fala (até ~24 caracteres)
  texto: string;
};

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o lugar padrão da lupa neste momento
  layout?: Layout;
};

// Item de lista. `marca` (do Clínico, opcional): ✗ vermelho (um erro, um problema) ou ✓ azul.
export type Item = { texto: string; em: number; detalhe?: string; marca?: "certo" | "errado" };

// ——— os 11 blocos universais ———

// Abertura: título em tela cheia, na névoa branca abaixo do queixo, palavra por palavra.
// `destaque` = trecho exato em azul. `em` = quando o texto começa a ser dito (padrão: `de`).
// `rotulo` (do Clínico): tema em 1–3 palavras com um anel azul na frente.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

// Lista sem ordem: linhas de atlas, cada uma sai de uma haste azul quando é dita
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; numero?: string };

// Lista em ordem: a conduta, anéis numerados ligados por um traço que avança de passo em passo
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; numero?: string };

// Número dito: conta até `valor` enquanto o anel em volta da lupa se enche (lupa no centro)
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

// Dois lados: duas colunas com selo; quem ganha leva ✓ azul, o outro ✗ vermelho
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico em papel milimetrado de exame: linha, barras ou pizza com os números ditos;
// sem números, a curva da tendência (`tendencia`) com a etiqueta "ilustrativo"
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  numero?: string;
};

// Palavra ou frase curta que bate forte, na névoa: "alerta" = selo ✗ vermelho; "chave" = selo azul
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Verbete de atlas: o termo e, quando o significado é dito, uma linha-guia desce até ele
// `numero` (do Clínico, opcional): "01", "02"… num anel ao lado do termo, quando a fala numera
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; numero?: string };

// Frase de efeito na névoa, palavra por palavra; `risco` = trecho riscado em vermelho quando é dito
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste, como uma ficha de consulta: as opções ganham o anel quando são ditas
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type IconeBotao = "salvar" | "enviar" | "seguir" | "comentar" | "link";

// Fechamento em tela cheia: a chamada, o botão e a assinatura (nome e área).
// `icone` (universal) = um botão em `em`; `botoes` (do Clínico) = um ou dois botões, cada um no seu tempo.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // campos antigos do Clínico (continuam valendo)
  enfase?: string;
  botoes?: { em: number; icone: IconeBotao }[];
  assinaturaEm?: number;
};

// ——— tipos próprios do Clínico ———

// Abertura em linhas escolhidas à mão (a do demo). Com `duvidaEm`, o par ✓ / ✗ aparece embaixo.
export type Titulo = Base & {
  tipo: "titulo";
  rotulo?: string;
  linhas: string[];
  enfase?: string;
  duvidaEm?: number;
};

// Contagem: círculos 1, 2, 3… que se desenham quando a contagem é dita ("erra em 3 coisas")
export type Contagem = Base & {
  tipo: "contagem";
  titulo: string;
  enfase?: string;
  // cada círculo entra no seu `em`; `texto` curto opcional embaixo (até ~12 caracteres)
  itens: { em: number; texto?: string }[];
  // marca pequena (✗ ou ✓) que aparece nos círculos neste instante
  marca?: { em: number; tipo: "certo" | "errado" };
};

// Mostrador (assinatura): o anel em volta da lupa vira um instrumento que mede qualquer coisa com meta:
// tempo ("2:00"), nível ("100%"), um objetivo em palavras ("No bolso", "Lucro", "Gol").
export type Cronometro = Base & {
  tipo: "cronometro";
  numero?: string;
  titulo: string;
  enfase?: string;
  // o que o mostrador mede (texto no topo do anel), até ~10 caracteres
  meta: string;
  // quando a meta acende (o instante em que ela é dita)
  metaEm?: number;
  // quando o ponteiro começa a correr
  inicio: number;
  // o ponteiro para antes da meta (vermelho) em `fracao` do anel; sem `para`, completa a volta (azul)
  para?: { em: number; fracao: number };
  // duração da volta completa quando não há `para` (s)
  volta?: number;
  // meta sem número dito (uma ideia, não uma medida): mostra a etiqueta "ilustrativo"
  ilustrativo?: boolean;
  veredito?: Veredito;
};

// Desenhos da biblioteca (src/desenhos). Cada um tem ações e pontos que os rótulos podem apontar.
// dente = molar em corte · dentes = incisivos de frente · coluna = coluna vertebral de lado
// corpo = corpo inteiro de frente (manequim) · cerebro = cérebro de lado (decisão, emoção, memória…)
export type Desenho = "dente" | "dentes" | "coluna" | "corpo" | "cerebro";

export type Acao =
  // dente
  | "escova"
  | "pressao"
  | "leve"
  | "inflama"
  // dentes
  | "fio"
  | "esquecido"
  | "varre"
  | "lacunas"
  // coluna
  | "curva"
  | "alinha"
  // corpo e cerebro (precisam de `alvo`)
  | "destaca" // a região acende em vermelho e pulsa (problema, dor, alerta)
  | "alivia" // a região fica azul e para de pulsar
  | "acende"; // a região ganha azul (ativa, funcionando, o certo)

export type Rotulo = {
  em: number;
  // ponto do desenho (lista em references/plano.md)
  alvo: string;
  // palavras da fala, curtas (até ~18 caracteres; o template reduz e quebra se precisar)
  texto: string;
  // vermelho (o problema) em vez de azul
  erro?: boolean;
};

// Prancha de atlas (assinatura): um desenho a traço em volta da lupa, com ações, rótulos e veredito
export type Anatomia = Base & {
  tipo: "anatomia";
  numero?: string;
  titulo: string;
  enfase?: string;
  desenho: Desenho;
  desenhoEm?: number;
  acoes?: { em: number; acao: Acao; alvo?: string }[];
  rotulos?: Rotulo[];
  aproximar?: { em: number; alvo: string; zoom?: number };
  veredito?: Veredito;
};

export type IconeItem = "cronometro" | "escova" | "fio" | "agua" | "sono" | "check";

// Conduta: o que fazer, cada linha com ✓ (ou ✗)
export type Checklist = Base & {
  tipo: "checklist";
  titulo: string;
  enfase?: string;
  marcaEm?: number;
  itens: {
    em: number;
    texto: string;
    icone?: IconeItem;
    tipo?: "certo" | "errado";
    semanaEm?: number;
  }[];
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
  | Titulo
  | Contagem
  | Cronometro
  | Anatomia
  | Checklist;

export type TipoDeMomento = Momento["tipo"];

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (do cortar.mjs) vem junto
  rosto: { x: number; y: number };
  // faixa do texto em tela cheia (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste do enquadramento dentro da lupa (raro): zoom e altura do rosto (0–1, padrão 0,5).
  // Sem `zoom`, o template calcula pelo tamanho do rosto na gravação.
  lupa?: { zoom?: number; ancoraY?: number };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
