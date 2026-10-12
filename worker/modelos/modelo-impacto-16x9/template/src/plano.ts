// Formato do plano de edição do modelo Impacto. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
// Todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Impacto: a pessoa vai para a moldura do lado
// direito e as palavras batem no quadro de texto à esquerda; passos e gráficos tomam a tela e a
// pessoa vira janela no canto. A assinatura deste modelo é `circuito` (a ficha em tela cheia) e
// `virada` (não é X, é Y). Esta é a versão deitada (16:9, 1920×1080), para o vídeo completo.

// Lado para onde a PESSOA vai quando um momento abre espaço para o texto. No quadro deitado ela vai
// sempre para a moldura da direita (aula 9 do curso): o campo é aceito e ignorado.
export type Lado = "esquerda" | "direita";

// Uma linha de palavras grandes escrita à mão (quebra de linha escolhida no plano).
// Cada palavra da linha bate na tela quando é falada, a partir de `em`.
export type LinhaDeImpacto = { em: number; texto: string; destaque?: boolean };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  lado?: Lado;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— Blocos universais ———

// Título que se monta palavra por palavra na fala; `destaque` = trecho exato no acento.
// `em` (opcional, em abertura, frase, pergunta e cta): quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

// Lista sem ordem (motivos, erros, sinais): itens empilhados na coluna, o da vez aceso.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: a ficha numerada em tela cheia (a pessoa vira janela); feito = ✓.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; fimEm?: number };

// Número que conta até `valor` e trava no acento em `em`. Formato pt-BR.
// Campos antigos do Impacto (continuam valendo): `valor` em texto ("20", "4x"), `unidade`, `grifoEm`.
export type Numero = Base & {
  tipo: "numero";
  valor: number | string;
  em?: number;
  rotulo?: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  // ——— do Impacto ———
  // linha curta no acento, embaixo dos marcadores, quando é dita
  complemento?: { em: number; texto: string };
  // marcadores que enchem junto com a contagem (padrão: o próprio valor, se for inteiro até 30; senão 24; 0 = sem)
  marcadores?: number;
  // formato antigo
  unidade?: string;
  grifoEm?: number;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  // números DITOS (2 a 6), cada um no seu `em`
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Chamada final. Sem `icone`, o avião de papel ("manda para alguém").
// `itens` (opcional, do Impacto): as linhas escritas à mão, cada uma no seu `em` — para escolher a
// quebra das linhas ou pular palavras da fala entre uma linha e outra. Com `itens`, eles mandam no desenho.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  itens?: LinhaDeImpacto[];
};

// ——— Tipos próprios do Impacto ———

// Palavras que batem, com a quebra de linha escrita à mão (a abertura do demo).
export type Gancho = Base & {
  tipo: "gancho";
  rotulo?: string;
  // 2 a 5 linhas curtas, empilhadas; cada uma ocupa a largura toda da coluna
  itens: LinhaDeImpacto[];
};

// ASSINATURA. A ficha em tela cheia: qualquer lista que se cumpre (rotina, checklist, critérios,
// etapas, sinais). Itens numerados que acendem quando são ditos e ganham ✓ quando passam.
export type Circuito = Base & {
  tipo: "circuito";
  rotulo?: string;
  titulo?: { em: number; texto: string } | string;
  // o anel (opcional, só quando a pessoa diz dois tempos: trabalho e pausa, foco e descanso…).
  // `nomes`: o nome de cada parte no anel (padrão "treino" e "descanso"); `unidade`: "s" (padrão) ou "min"
  intervalo?: { trabalho: number; descanso: number; em: number; descansoEm?: number; nomes?: [string, string]; unidade?: "s" | "min" };
  // 2 a 5 itens, cada um entra quando é falado
  itens: { em: number; texto: string; detalhe?: string }[];
  // selo no acento ("4 voltas", "3x por dia", "30 dias"), quando é falado
  voltas?: { em: number; valor: string; texto?: string };
  // quando a pessoa fecha a ideia ("e acabou", "pronto"): tudo fica marcado como feito
  fimEm?: number;
};

// ASSINATURA. "Não é X, é Y": X aparece, é riscado no instante da virada, encolhe para cima e Y
// entra no lugar, palavra por palavra. Serve para qualquer crença desmontada ou troca de foco.
export type Virada = Base & {
  tipo: "virada";
  rotulo?: string;
  // o que NÃO é: aparece palavra por palavra a partir de `em` e é riscado em `grifoEm`
  nao: { em: number; linhas: string[]; prefixo?: string };
  grifoEm: number;
  // o que É: entra no lugar, palavra por palavra
  sim: LinhaDeImpacto[];
  selo?: { em: number; texto: string };
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
  | Gancho
  | Circuito
  | Virada;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio, no 16:9)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` (do cortar.mjs) vem junto no JSON
  rosto: { x: number; y: number };
  // calculada pelo motor (no 16:9 a legenda fica sempre na área segura de baixo)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "Cloud": "Claude" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda (a legenda já some sozinha durante momentos sem `legenda: true`)
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};

// Momentos em tela cheia (a pessoa vira janela no canto de cima, à direita); os outros são "de lado"
// (a pessoa na moldura da direita, o bloco no quadro de texto à esquerda).
export const TELA_CHEIA = ["circuito", "passos", "grafico"] as const;
export const emTelaCheia = (m: Momento) => (TELA_CHEIA as readonly string[]).includes(m.tipo);
