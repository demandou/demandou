// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Dois grupos de momentos:
// - os 11 blocos universais (iguais em todos os modelos do pack, com os mesmos campos):
//   abertura, topicos, passos, numero, comparacao, grafico, destaque, definicao, frase, pergunta, cta;
// - os próprios da Receita (a assinatura): ingredientes e passo (com a panela), e dica.
// Campos marcados "deste modelo" são extras opcionais da Receita.
import type { Tinta } from "./tema";

export type { Tinta };

// Ícones a traço dos ingredientes (src/componentes/Icones.tsx)
export type Icone =
  | "lata"
  | "colher"
  | "pote"
  | "manteiga"
  | "ovo"
  | "xicara"
  | "leite"
  | "caixinha"
  | "garrafa"
  | "acucar"
  | "farinha"
  | "sal"
  | "morango"
  | "limao"
  | "gelo"
  | "tigela";

// Onde a janela da pessoa fica nos momentos da ficha em cima: canto de cima à esquerda ou à direita
export type Canto = "sup-esq" | "sup-dir";

// Como um ingrediente entra na panela: despejado (líquido), em pedaço ou em pó
export type Queda = "despeja" | "pedaco" | "po" | "nenhum";

// O que acontece na panela quando um item do passo é dito
export type Acao =
  | "fogo-baixo"
  | "fogo-medio"
  | "fogo-alto"
  | "mexer"
  | "fundo"
  | "desligar"
  | "pote"
  | "quente"
  | "esfriar";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// ================= blocos universais (motor/BLOCOS.md) =================

// Abertura: a ficha na altura do peito, com a pessoa em quadro cheio; o título se escreve na fala.
// Quando o momento seguinte é `ingredientes`, a ficha sobe levando o título para o cabeçalho.
export type Abertura = Base & {
  tipo: "abertura";
  // o título, com as palavras da fala (quebra sozinho em até 3 linhas)
  texto?: string;
  // trecho exato do título em itálico com o traço pistache por baixo
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // deste modelo: rótulo em caixa alta acima do título (padrão "Receita")
  rotulo?: string;
  // deste modelo (antigo): o título já quebrado em linhas; use `texto`
  titulo?: string[];
  // deste modelo: "em 3 passos": os números dos passos aparecem quando o número é dito
  passos?: { em: number; total: number };
};

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: a ficha sobe; cada item é uma linha da ficha que nasce a lápis e ganha tinta e um
// visto pistache quando é dito. O cabeçalho mostra o `titulo` ou conta os itens.
export type Topicos = Base & {
  tipo: "topicos";
  titulo?: string;
  itens: Item[];
  // deste modelo
  rotulo?: string;
  pessoa?: Canto;
};

// Lista em ordem: o modo de preparo. Números em círculos ligados por um fio; o cabeçalho mostra
// "Passo N de T" e o número rola a cada item dito.
export type Passos = Base & {
  tipo: "passos";
  titulo?: string;
  itens: Item[];
  rotulo?: string;
  pessoa?: Canto;
};

// Número que conta: na ficha do peito, grande, com o copo medidor enchendo até a marca.
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

// Dois lados: dois cartões na ficha, um embaixo do outro, com × (contra) ou uma seta (antes-depois,
// errado-certo) entre eles. O vencedor ganha o visto pistache; o errado é riscado.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  rotulo?: string;
  pessoa?: Canto;
};

export type Dado = { rotulo: string; valor: number; em: number };

// Gráfico na ficha: barras = potes que enchem; linha = traço a lápis no papel pautado; pizza = uma
// torta vista de cima. Sem `dados`: a forma da tendência, com a etiqueta "ilustrativo".
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: Dado[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  rotulo?: string;
  pessoa?: Canto;
};

// Uma palavra ou frase curta que bate forte, na ficha do peito. "alerta" acende a chama caramelo.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  // deste modelo: rótulo em caixa alta (padrão "Atenção" no alerta, "Anote" na chave)
  rotulo?: string;
};

// Termo e significado, na ficha do peito: o termo grande e uma seta a lápis até o significado.
export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
  rotulo?: string;
};

// Frase de efeito na ficha do peito, palavra por palavra; `risco` = trecho riscado quando é dito.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  rotulo?: string;
};

// Pergunta na ficha do peito, com um "?" num círculo; as opções entram como etiquetas.
export type Pergunta = Base & {
  tipo: "pergunta";
  texto: string;
  opcoes?: { texto: string; em: number }[];
  em?: number;
  rotulo?: string;
};

// Fechamento: a ficha desce para a altura do peito e a pessoa volta ao quadro cheio.
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com as palavras da fala (até 3 linhas)
  texto?: string;
  // o que a chamada pede: salvar (uma fita marca a ficha), seguir, comentar ou link
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  // quando a chamada começa a ser dita (a fita/ícone age aí)
  em?: number;
  // deste modelo: uma linha de apoio em itálico, menor, abaixo da chamada
  apoio?: string;
  // deste modelo (antigo): as linhas já quebradas; a última vira o apoio. Use `texto` + `apoio`.
  linhas?: string[];
};

// ================= próprios da Receita =================

// Uma frase com a pessoa em quadro cheio e a ficha na altura do peito (uma dica, um lembrete).
export type Dica = Base & {
  tipo: "dica";
  // rótulo em caixa alta (padrão "Dica")
  rotulo?: string;
  texto?: string;
  // (antigo) palavras da fala, na ordem; cada string é uma linha (até 3 linhas)
  linhas?: string[];
  destaque?: string;
  em?: number;
};

export type Ingrediente = {
  // a primeira palavra do ingrediente
  em: number;
  // a quantidade em algarismos ("1", "3", "1/2", "200") — só se foi dita
  quantidade?: string;
  // a medida ("lata", "colheres", "g", "anos") — só se foi dita
  unidade?: string;
  // o nome, como foi dito ("leite condensado", "impulso", "paciência")
  nome: string;
  icone?: Icone;
  // como cai na panela (padrão pelo ícone) e em que cor vira lá dentro
  cai?: { em?: number; jeito?: Queda; tinta?: Tinta };
};

// ASSINATURA: a ficha ocupa a tela; os ingredientes entram um a um e caem na panela vista de cima.
// Serve para qualquer "o que compõe um resultado": a receita do prejuízo, de uma boa entrevista…
export type Ingredientes = Base & {
  tipo: "ingredientes";
  // canto da janela da pessoa (padrão: alterna)
  pessoa?: Canto;
  // rótulo acima dos ingredientes (padrão "Ingredientes")
  rotulo?: string;
  // nome da receita no cabeçalho quando NÃO há abertura logo antes (palavras da fala).
  // Com abertura logo antes, o título dela sobe para cá sozinho.
  titulo?: string | string[];
  // 1 a 6 ingredientes
  itens: Ingrediente[];
};

export type ItemDoPasso = {
  em: number;
  // anotação curta, com as palavras da fala (até ~18 caracteres); vazio = só a ação na panela
  texto?: string;
  acao?: Acao;
};

// ASSINATURA: um passo do modo de preparo: número grande, o título escrito na fala e a panela
// reagindo ao que é dito (fogo, mexer, fundo, desligar, pote, quente, esfriar).
export type Passo = Base & {
  tipo: "passo";
  // canto da janela da pessoa (padrão: o canto oposto ao do momento anterior)
  pessoa?: Canto;
  numero: number;
  // quando o número é dito ("Primeiro", "Dois") — o número rola nessa hora
  numeroEm?: number;
  // total de passos (padrão: quantos passos o plano tem)
  total?: number;
  // o título, com as palavras da fala (até 2 linhas); uma lista = linhas já quebradas
  titulo: string | string[];
  // trecho exato do título com o traço pistache por baixo
  destaque?: string;
  // até 3 itens; cada um acende quando é dito
  itens: ItemDoPasso[];
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
  | Dica
  | Ingredientes
  | Passo;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // o motor calcula; aqui o topo da zona decide a altura da ficha no peito
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // a panela: "panela" (com cabo) ou "tigela"; e a cor da massa quando tudo se mistura
  cozinha?: { recipiente?: "panela" | "tigela"; massa?: Tinta };
  // ajuste fino do enquadramento da pessoa na janela (gravação muito aberta ou muito fechada)
  pessoa?: { zoom?: number; ancoraY?: number };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
