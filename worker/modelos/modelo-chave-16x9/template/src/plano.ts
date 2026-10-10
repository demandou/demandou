// Formato do plano de edição do modelo Chave, versão deitada (16:9, 1920×1080, o vídeo completo do
// YouTube). O template renderiza qualquer vídeo a partir dele. Os campos são os mesmos do vertical:
// muda só onde as coisas ficam no quadro (layout.ts).
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Chave: etiquetas de papel, placas,
// pregos, a prancheta e o recibo, a porta como moldura da pessoa. Os tipos próprios (item com o
// quadro de chaves, vezes, porta, placa) e os campos extras são opcionais.

// Desenhos de cômodo da prancheta (opcional: sem desenho, a prancheta vira uma lista com vistos)
export type Comodo = "sala" | "cozinha" | "quarto" | "banheiro" | "varanda" | "lavanderia" | "garagem" | "escritorio";

// Ícones a traço (chaveiros, etiquetas de ação). Sem ícone, o chaveiro mostra o número dele.
export type Icone =
  | "pessoa"
  | "dinheiro"
  | "escudo"
  | "documento"
  | "casa"
  | "predio"
  | "calendario"
  | "chave"
  | "lupa"
  | "salvar"
  | "enviar"
  | "seguir"
  | "comentar"
  | "link"
  | "alerta"
  | "coracao"
  | "relogio"
  | "grafico"
  | "alvo"
  | "lampada"
  | "check"
  | "estrela"
  | "carrinho"
  | "livro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type ItemDeLista = { texto: string; em: number; detalhe?: string };

// ——— os 11 blocos universais ———

// Abertura: a porta se abre (se for o primeiro momento) e o título se monta numa etiqueta no peito.
// `em` = quando o texto começa a ser dito (padrão: `de`). Extras do Chave: `rotulo` (caixa alta acima
// do título), `numero` (número na porta, ex.: "302").
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string; numero?: string };

// Lista sem ordem: um quadro de chaves vertical; cada item é uma etiqueta que chega no gancho e balança.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemDeLista[] };

// Sequência em ordem: a prancheta; cada passo ganha tinta e o visto, ligados por um traço.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemDeLista[] };

// Número dito: uma etiqueta de preço grande pendurada num prego; o número conta até `valor`.
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
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
// Dois lados: duas etiquetas grandes num trilho de madeira; o vencedor ganha o verde e o visto.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico no recibo de papel: barras, linha ou pizza com números ditos; sem números, a tendência
// desenhada a lápis e a tinta, com a etiqueta "ilustrativo".
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

// Destaque: uma placa aparafusada no peito (verde = chave; terracota = alerta).
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Definição: a etiqueta do termo e, pendurada nela por um cordão, a etiqueta do significado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: a etiqueta deitada no peito; `destaque` em verde; `risco` riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: a etiqueta com o selo "?" e as opções em etiquetas menores, penduradas embaixo.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: uma régua com gancho logo abaixo do queixo, a etiqueta de ação balançando, a chamada
// numa etiqueta deitada e a placa com o nome, onde a chave gira na fechadura.
// `acoes` (próprio do Chave, opcional): 1 ou 2 etiquetas de ação com texto ("Salva", "Manda").
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  acoes?: { texto: string; icone: Icone; em: number }[];
};

// ——— a assinatura: a porta, o quadro de chaves, os painéis do item e o "N×" ———

// Abertura do demo: a porta se abre; o título em até 3 linhas já quebradas (`linhas`).
// `etiquetas` = "confere 3 coisas": etiquetas-esboço que acendem uma a uma a partir de `em`.
export type Porta = Base & {
  tipo: "porta";
  numero?: string;
  rotulo?: string;
  linhas: string[];
  enfase?: string;
  etiquetas?: { n: number; em: number };
};

// Prancheta: lista com visto; cada item pode ter o desenho de um cômodo (`desenho`).
// `itens` (qualquer assunto) ou `comodos` (o formato antigo, com desenho obrigatório).
export type PainelPrancheta = {
  tipo: "prancheta";
  subtitulo?: string;
  itens?: { texto: string; em: number; desenho?: Comodo }[];
  comodos?: { nome: string; desenho: Comodo; em: number }[];
};

// Conta: linhas que se somam num total. Sem `valor` nas linhas, a conta é qualitativa: cada linha
// ganha o seu pedaço da barra (`peso`, padrão 1) e o total mostra o texto de `total`.
export type PainelConta = {
  tipo: "conta";
  linhas: { rotulo: string; valor?: number; peso?: number; em: number }[];
  // texto do total (padrão "Total"); na conta qualitativa, é o resultado ("Prejuízo")
  total?: string;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  // nota no pé ("valores de exemplo", a fonte do dado); "" = sem nota. Sem valores: "ilustrativo".
  nota?: string;
};

// Chaveiro: 1 a 4 chaveiros pendurados em pregos, cada um no tempo da fala. No couro: o ícone, ou
// a `marca` (um número ou sigla curta, até 3 caracteres: "4", "7", "A"), ou o número do chaveiro.
export type PainelChaveiro = {
  tipo: "chaveiro";
  chaves: { texto: string; icone?: Icone; marca?: string; em: number }[];
};

export type Painel = PainelPrancheta | PainelConta | PainelChaveiro;

// Item do quadro de chaves: vira uma etiqueta pendurada no quadro (no alto) e abre o painel embaixo.
// Itens seguidos dividem o mesmo quadro ("Item 1 de 3").
export type Item = Base & {
  tipo: "item";
  // texto curto da etiqueta no quadro (até ~10 caracteres)
  etiqueta: string;
  etiquetaEm?: number;
  // título do painel, palavras da fala (até ~26 caracteres)
  titulo: string;
  // No vertical, porta estreita ao lado do painel. No quadro deitado não muda nada: a pessoa vai
  // sempre para a porta da direita (a moldura da aula 9) e o painel ocupa a parede da esquerda.
  lado?: "esquerda" | "direita";
  painel: Painel;
};

// "Até 3×": um número grande com N etiquetas que acendem uma a uma (meses, parcelas, vezes, dias…)
export type Vezes = Base & {
  tipo: "vezes";
  rotulo: string;
  prefixo?: string;
  // o número (2 a 6) e quando é dito
  n: number;
  numeroEm: number;
  // o que é contado, abaixo do número, palavras da fala
  unidade: string;
  // texto de cada etiqueta e quando acende; sem elas, as etiquetas mostram "1", "2", "3"…
  etiquetas?: { texto: string; em: number }[];
  // fonte da regra ou do dado, no pé
  fonte?: string;
};

// Placa: frase curta numa etiqueta no peito (formato antigo da `frase`).
export type Placa = Base & {
  tipo: "placa";
  rotulo?: string;
  texto: string;
  enfase?: string;
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
  | Porta
  | Item
  | Vezes
  | Placa;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = tela cheia no 16:9)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` e o `quadro` (o motor grava) vêm junto
  rosto: { x: number; y: number };
  // faixa das artes no peito (px, no quadro 1920×1080): abaixo do queixo
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // ajuste do enquadramento da pessoa na porta da direita: zoom (1 = padrão) e altura do rosto
  pessoa?: { zoom?: number; ancoraY?: number };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "calção": "caução" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
