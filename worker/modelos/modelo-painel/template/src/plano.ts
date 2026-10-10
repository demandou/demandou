// Formato do plano de edição do modelo Painel. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Painel. Os tipos próprios
// (gancho, divisao, painel) e os campos extras são opcionais.

// Canto da janela da pessoa nos momentos de painel.
export type Lado = "esq" | "dir";
// Cor de um item: positivo (menta), negativo (vermelho suave, só para perda/risco), neutro.
export type Tom = "positivo" | "negativo" | "neutro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// Número que conta de um valor a outro.
export type Contagem = {
  em: number;
  de?: number;
  para: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
};

// `detalheEm` (opcional, do Painel): o detalhe entra na palavra dele, e não logo depois do item
export type Item = { texto: string; em: number; detalhe?: string; detalheEm?: number };

// ——— Quadro cheio (a pessoa em tela inteira, um cartão grafite na altura do peito) ———

// Abertura: título que se monta na fala; `destaque` = trecho em menta.
// `em` (opcional) nos blocos que se montam na fala: quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

// Abertura com número que se transforma (próprio do Painel).
export type Gancho = Base & {
  tipo: "gancho";
  rotulo?: string;
  // 1 ou 2 linhas curtas; cada palavra aparece quando é falada, a partir de `em`
  linhas: { em: number; texto: string }[];
  // o número-chave, que conta de `de` até `para` (ex.: 500 → 100000)
  numero?: Contagem;
  // desenha uma curva ao lado enquanto o número conta (padrão: true)
  curva?: boolean;
};

// Indicador: um número dito que conta até `valor`.
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
  // de onde a contagem parte (padrão 0)
  inicio?: number;
  // linha âmbar acima do número (o assunto)
  titulo?: string;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number; vereditoEm?: number };

export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados?: [LadoDaComparacao, LadoDaComparacao];
  // quem ganha (✓ e curva completa); o outro leva ✗ e a curva interrompida
  vencedor?: 0 | 1;
  vencedorEm?: number;
  // formato antigo (continua valendo)
  rotulo?: string;
  opcoes?: { em: number; vereditoEm?: number; titulo: string; texto: string; positivo: boolean }[];
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "seguir" | "salvar" | "comentar" | "link";
  destaque?: string;
  em?: number;
  apoio?: string;
  // campo que "digita" valores, para chamadas do tipo "faça a conta com o seu valor"
  campo?: { em: number; rotulo: string; valores: string[] };
};

// ——— Painel (a pessoa vai para uma janela no canto e o painel ocupa a tela) ———

type BasePainel = Base & {
  // canto da janela; sem este campo, os painéis seguidos alternam dir → esq → dir
  janela?: Lado;
  // o assunto do painel, em caixa alta âmbar (sem ele, vale o `titulo`)
  rotulo?: string;
  // com `rotulo`: uma frase curta no cabeçalho (até ~34 caracteres); sem `rotulo`: vira o rótulo
  titulo?: string;
  // até 3 linhas "chave → valor", cada uma entrando quando é falada (os dados da conta)
  ficha?: { em: number; rotulo: string; valor: string }[];
  // nota de rodapé do painel (fonte do dado, "Simulação ilustrativa"…). "" = sem nota.
  nota?: string;
};

// Lista sem ordem: linhas de status, cada uma acende no seu `em`.
export type Topicos = BasePainel & { tipo: "topicos"; itens: Item[]; tom?: Tom };

// Sequência: etapas ligadas por uma linha que avança de uma para a outra.
export type Passos = BasePainel & { tipo: "passos"; itens: Item[] };

export type Grafico = BasePainel & {
  tipo: "grafico";
  forma?: "barras" | "linha" | "pizza";
  // números DITOS, cada um no seu `em` (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // a leitura da tendência no cabeçalho, com palavras da fala ("em alta", "caindo")
  leitura?: string;
  // cor da tendência (padrão: sobe = menta, cai = vermelho suave, oscila = âmbar)
  tom?: Tom;
  // ——— simulação calculada (próprio do Painel) ———
  // rótulo de cada ponto do eixo horizontal (ex.: anos "0" a "10")
  eixo?: string[];
  eixoNome?: string;
  prefixo?: string;
  sufixo?: string;
  // 1 ou 2 séries; com 2, a segunda empilha sobre a primeira (ex.: seu dinheiro + juros)
  series?: { nome: string; valores: number[] }[];
  // quando a linha se desenha do primeiro ao último ponto
  desenho?: { de: number; ate: number };
  // texto sob o contador do topo; {x} vira o rótulo do ponto que está sendo desenhado
  total?: string;
  // anotações que entram na fala: `serie` acende a faixa; `ponto` marca o ponto do eixo; sem os dois, etiqueta
  itens?: { em: number; texto: string; serie?: number; ponto?: number }[];
};

// Um todo que se divide (próprio do Painel): uma barra só, preenchida parte a parte.
export type Divisao = BasePainel & {
  tipo: "divisao";
  prefixo?: string;
  sufixo?: string;
  // "R$", "US$", "%", "kg"… (vira prefixo ou sufixo)
  unidade?: string;
  // texto sob o total do topo (ex.: "total em 10 anos")
  total?: string;
  // 2 a 5 partes, da esquerda para a direita, cada uma no seu `em`.
  // `valor` = número dito; sem números, `peso` dá só o tamanho (e nenhum número aparece)
  itens: { em: number; texto: string; valor?: number; peso?: number }[];
  // índice da parte em destaque (a cor positiva); padrão: a última
  destaque?: number;
  // a parte em destaque é algo ruim (cor de perda)
  tom?: Tom;
  // opcional: a parte em destaque se revela feita de fatias (ex.: os juros de cada ano) no grifoEm
  fatias?: number[];
  grifoEm?: number;
  ilustrativo?: boolean;
};

// Destaque: uma palavra ou frase curta que bate forte (quadro cheio). Com `eixo`/`valores`,
// vira as barras com uma faixa acesa (painel): `texto` vai sob a faixa e `em` é quando ela acende.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  // ——— barras com faixa (painel) ———
  janela?: Lado;
  rotulo?: string;
  titulo?: string;
  ficha?: { em: number; rotulo: string; valor: string }[];
  nota?: string;
  eixo?: string[];
  prefixo?: string;
  sufixo?: string;
  valores?: number[];
  // barras (índices, inclusive) que acendem no `em`
  faixa?: { de: number; ate: number; texto?: string };
  grifoEm?: number;
  // contador do topo (ex.: 56 "%")
  numero?: Contagem & { texto?: string };
  ilustrativo?: boolean;
};

// Painel de indicadores (próprio do Painel): 2 a 4 cartões de dashboard, cada um no seu `em`.
export type CartaoIndicador = {
  rotulo: string;
  em: number;
  // um número dito (conta) ou um estado em palavras ("alto", "sem critério")
  valor?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  texto?: string;
  tom?: Tom;
  tendencia?: "sobe" | "cai" | "estavel";
};
export type Indicadores = BasePainel & { tipo: "painel"; cartoes: CartaoIndicador[]; ilustrativo?: boolean };

export type Momento =
  | Abertura
  | Gancho
  | Numero
  | Comparacao
  | Definicao
  | Frase
  | Pergunta
  | Cta
  | Topicos
  | Passos
  | Grafico
  | Divisao
  | Destaque
  | Indicadores;

export type DestaqueEmBarras = Destaque & { eixo: string[] };
export type MomentoDePainel = Topicos | Passos | Grafico | Divisao | Indicadores | DestaqueEmBarras;

export const TIPOS_DE_PAINEL = ["grafico", "divisao", "painel", "topicos", "passos"] as const;
export const destaqueEmBarras = (m: Momento): m is DestaqueEmBarras =>
  m.tipo === "destaque" && ((m.eixo?.length ?? 0) > 0 || (m.valores?.length ?? 0) > 0);
export const ehPainel = (m: Momento): m is MomentoDePainel =>
  (TIPOS_DE_PAINEL as readonly string[]).includes(m.tipo) || destaqueEmBarras(m);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio; 3:4 = 1440)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo onde entram os componentes de quadro cheio (px, quadro 1080×1920)
  zona?: { topo: number; altura: number };
  // assinatura do fechamento e etiqueta da janela
  marca: { nome: string; area: string };
  // enquadramento da pessoa dentro da janela dos painéis (opcional). Padrão: zoom 2.15, ancoraY 0.4.
  // Rosto grande no quadro (pessoa perto da câmera) pede zoom menor (~1.6–1.7) e ancoraY ~0.45.
  retrato?: { zoom?: number; ancoraY?: number };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
