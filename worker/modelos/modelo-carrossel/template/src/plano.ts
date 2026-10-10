// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O vídeo inteiro é um carrossel: cada momento é uma PÁGINA que entra deslizando da direita.
// - Páginas da pessoa (abertura/capa, numero, destaque, frase, pergunta, cta e os trechos sem
//   momento): a pessoa ocupa a página inteira e um cartão creme entra na altura do peito.
// - Páginas de conteúdo (topicos, passos, lista, comparacao, troca, grafico, definicao, calendario):
//   a página é um slide desenhado; a pessoa sai pelo lado e fica no cabeçalho (avatar) ou num cartão.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Carrossel. Os tipos próprios (capa, troca,
// lista, calendario) e os campos extras são opcionais.
import type { NomeDesenho } from "./componentes/Desenhos";

export type Desenho = NomeDesenho;

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// Um item com desenho opcional. `icone` é sinônimo de `desenho` (nome da biblioteca de desenhos).
export type Item = {
  texto: string;
  desenho?: Desenho;
  icone?: Desenho;
  // quando o item começa a ser falado
  em: number;
};

// ——————————————————— blocos universais ———————————————————

// Abertura: título que se monta palavra por palavra na fala; `destaque` = trecho exato em coral.
// `em` (opcional nos blocos que se montam na fala): quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // (próprio do Carrossel) linha de apoio, também com palavras faladas
  subtitulo?: string;
  // mostra o "arrasta →" no fim da página (padrão: true quando é a primeira página)
  arrasta?: boolean;
};

// Item de lista/passos: `detalhe` = segunda linha menor, opcional.
export type ItemDeLista = Item & { detalhe?: string };

// Lista sem ordem (motivos, erros, dicas, sinais): 2 a 5 itens com marcador coral.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; rotulo?: string; itens: ItemDeLista[] };

// Sequência em ordem: 2 a 5 passos numerados, ligados por uma linha que avança.
export type Passos = Base & { tipo: "passos"; titulo?: string; rotulo?: string; itens: ItemDeLista[] };

// Número que conta até `valor` a partir de `em` (cartão na altura do peito, numeral coral).
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
  // (próprio do Carrossel) linha de apoio sob o número, com palavras faladas
  detalhe?: string;
  // mostra o "arrasta →" no fim da página (padrão: true quando é a primeira página)
  arrasta?: boolean;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number; desenho?: Desenho; icone?: Desenho };

// Dois lados, na página "sai → entra": o primeiro num cartão areia, o segundo chega deslizando
// num cartão petróleo. `errado-certo` risca o primeiro quando o segundo é dito.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de slide: barras, linha ou pizza com números DITOS (2 a 6), ou, sem números, uma curva
// de tendência com a etiqueta "ilustrativo".
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // (próprio do Carrossel) rótulo em caixa alta acima do título
  rotulo?: string;
};

// Uma palavra ou frase curta que bate forte (cartão na altura do peito).
// `alerta` = cartão petróleo com o sinal coral; `chave` = cartão creme com sublinhado coral.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Termo e significado (página de conteúdo): o termo grande, o significado chega num cartão.
export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
  // (próprio do Carrossel) título curto no topo da página, com palavras faladas; padrão "O que é"
  titulo?: string;
};

// Frase de efeito no cartão; `destaque` = trecho em coral; `risco` = trecho riscado quando é dito.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // nomes antigos (continuam valendo): `risca` = `risco`, `enfase` = `destaque`
  risca?: string;
  enfase?: string;
};

// Pergunta para quem assiste; `opcoes` (2 a 4) entram como as barras de uma enquete.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: chamada, assinatura e o botão do app que é "tocado" e muda de estado.
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com palavras faladas ("Me segue")
  texto: string;
  // o botão: seguir (padrão), salvar, comentar ou link
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato do texto em coral, sublinhado
  destaque?: string;
  em?: number;
  // (próprio do Carrossel) complemento menor ("pra mais trocas assim")
  detalhe?: string;
  // nome antigo do botão (continua valendo); `compartilhar` = "Enviar" → "Enviado"
  acao?: "seguir" | "salvar" | "compartilhar" | "comentar" | "link";
  // quando o botão é "tocado" (padrão: 60% do momento)
  toqueEm?: number;
};

// ——————————————————— tipos próprios do Carrossel ———————————————————

// Página da pessoa com a capa do carrossel: título que se monta na fala e "arrasta →".
export type Capa = Base & {
  tipo: "capa";
  // título principal, com as palavras NA ORDEM EM QUE SÃO FALADAS ("3 trocas simples").
  // Um número no começo vira o numeral grande em coral.
  titulo: string;
  // linha de apoio, também com palavras faladas ("pra comer melhor sem passar fome")
  subtitulo?: string;
  // trecho exato do título em coral
  destaque?: string;
  em?: number;
  // mostra o "arrasta →" no fim da capa (padrão: true)
  arrasta?: boolean;
};

// A ASSINATURA. Página "sai → entra": o item velho é riscado e o novo entra deslizando, com seta.
// Sem `riscaEm`, vira "de → para": nada é riscado e a seta liga um ao outro.
export type Troca = Base & {
  tipo: "troca";
  // título do topo; padrão "Troca N" (N = posição entre as trocas do vídeo)
  rotulo?: string;
  // os rótulos dos dois cartões; padrão ["Sai", "Entra"]
  rotulos?: [string, string];
  sai: Item;
  // quando o risco passa no item que sai (a palavra de ligação: "pela", "por", "no lugar de")
  riscaEm?: number;
  entra: Item & {
    // complemento que chega depois ("com banana", "e limão"), com desenho próprio
    extra?: Item;
  };
  // até 2 etiquetas curtas que acendem quando são ditas ("tem fibra", "mata a fome")
  vantagens?: { em: number; texto: string }[];
};

// Página de conteúdo com itens numerados que chegam um a um (dicas, passos, "o que fazer").
export type Lista = Base & {
  tipo: "lista";
  rotulo?: string;
  titulo?: string;
  itens: ItemDeLista[];
};

// Página de conteúdo com a pessoa num cartão em cima e um calendário que se preenche embaixo
// (ritmo, constância, frequência, períodos).
export type Calendario = Base & {
  tipo: "calendario";
  // título com palavras faladas ("1 troca por semana"); `destaque` = trecho em coral
  titulo: string;
  destaque?: string;
  // cada linha é um período (semana, mês, dia, fase…) que se completa no seu tempo
  linhas: { em: number; rotulo: string; desenho?: Desenho; icone?: Desenho }[];
  // quantas células por linha (7 = dias da semana)
  celulas?: number;
  // frase de fechamento embaixo do título ("o mês inteiro"), com o tempo em que é dita
  fechamento?: { em: number; texto: string };
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
  | Capa
  | Troca
  | Lista
  | Calendario;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = recorte 3:4). Aqui a pessoa
  // sempre ocupa a página inteira: o modelo.json fixa o recorte 9:16 para gravação vertical (mais nítido)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa dos cartões nas páginas da pessoa (px, quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: cabeçalho das páginas de conteúdo e assinatura do fechamento
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
