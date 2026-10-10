// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// O vídeo inteiro é a agenda de um app fictício. A pessoa é o compromisso de vídeo dessa agenda: em
// tela cheia (com um cartão no peito) ou como um bloco dentro da folha, que muda de lugar a cada
// momento (larga em cima, numa raia ao lado, no canto, grande no alto). O resto se organiza em volta.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `blocos` (blocos de tempo que caem na agenda) + `ciclos`.
import type { NomeIcone } from "./componentes/Icones";
import type { Categoria } from "./tema";

export type { Categoria };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// Lugar da pessoa nos momentos que acontecem na folha (o template escolhe sozinho; use só para trocar)
export type LugarNaFolha = "topo" | "lado";

export type Item = { texto: string; em: number; detalhe?: string };

// ——— blocos universais: tela cheia, cartão no peito ———

// Abertura: o título se monta palavra por palavra num cartão branco no peito; `destaque` em tomate.
// Se houver blocos de tempo no plano, o dia inteiro aparece em miniatura embaixo e acende.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Uma palavra ou frase curta que bate forte. "alerta" = um bloco tomate cheio que cai no peito;
// "chave" (padrão) = cartão branco com o trecho sublinhado em tomate.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Pergunta para quem assiste: um convite de agenda no peito; as `opcoes` (2 a 4) são os botões de
// resposta, cada um acende na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— blocos universais: na folha da agenda ———

// Lista sem ordem (motivos, erros, dicas, sinais): cada item é um bloco que cai no seu lugar a lápis;
// o item da vez fica tomate, os anteriores ficam ardósia.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; pessoa?: LugarNaFolha };

// Sequência em ordem: a linha do tempo da agenda, de cima para baixo; cada passo acende o seu
// marcador numerado e a linha se enche até ele (os já feitos ganham ✓).
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; pessoa?: LugarNaFolha };

// Número que conta até `valor` a partir de `em`, no anel do cronômetro (que se enche junto; em % ele
// para na porcentagem). Primeiro momento do vídeo: vira um widget no peito com a pessoa em tela cheia.
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
  pessoa?: LugarNaFolha | "cheia";
};

// Dois lados em duas colunas, como dois dias da semana: cada lado cai como um bloco embaixo do seu
// rótulo. errado-certo: o errado é riscado e o certo fica verde com ✓; antes-depois: uma seta.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  pessoa?: LugarNaFolha;
};

// Gráfico sobre as linhas da régua: barras = blocos que sobem; linha = pontos ligados em tomate;
// pizza = o anel dividido em arcos. Sem números ditos: `tendencia` + `ilustrativo: true`.
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  pessoa?: LugarNaFolha;
};

// Termo que cai como um bloco; no significado, o bloco se abre para baixo (como um evento aberto)
// e o significado se escreve dentro dele.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; pessoa?: LugarNaFolha };

// ——— a assinatura: blocos de tempo ———

// Um bloco de tempo que cai na agenda
export type NovoBloco = {
  categoria: Categoria;
  // duração em minutos (decide a altura do bloco e os horários). Sem `minutos`, o bloco é
  // qualitativo: altura padrão, sem horário calculado nem duração na tela.
  minutos?: number;
  // quando o bloco cai e se encaixa (a palavra que o nomeia)
  em: number;
  // título dentro do bloco, com palavras faladas ("Foco total", "O mercado"); padrão: o nome da categoria
  titulo?: string;
  // horário de início ("09:00", "18:00"); padrão: logo depois do bloco anterior
  inicio?: string;
  // o que a régua mostra na altura do bloco quando não há horário ("Antes", "Todo dia", "1º"); padrão:
  // o número do bloco na sequência
  quando?: string;
};

// Blocos caem na agenda (1 a 4 por momento), com cronômetro e item riscado opcionais.
export type Blocos = Base & {
  tipo: "blocos";
  // onde fica a pessoa: "topo" (larga, em cima; padrão do primeiro) ou "lado" (raia da direita)
  pessoa?: LugarNaFolha;
  // o nome da agenda no cabeçalho da folha a partir deste momento ("Aula gratuita", "Rotina")
  agenda?: string;
  blocos: NovoBloco[];
  // anel de cronômetro que conta os minutos do último bloco, acelerado, a partir de `em`
  // (só para blocos com `minutos`)
  cronometro?: { em: number; ate?: number };
  // algo que fica de fora, riscado ("Celular"): aparece em `em`, é riscado em `riscaEm`
  sem?: { texto: string; icone?: NomeIcone; em: number; riscaEm: number };
};

// Repete o padrão que já está na agenda (os blocos dos momentos "blocos" anteriores) até completar
// um ciclo por item; o anel vira um contador de ciclos. Opcionalmente fecha com um bloco final de
// duração variável (a pausa longa "15 a 30 min").
export type Ciclos = Base & {
  tipo: "ciclos";
  // um item por ciclo, na ordem; o primeiro é o ciclo que já está na agenda (acende o "1")
  itens: { em: number }[];
  // rótulo do contador ("ciclos", "dias", "anos"); acende em `rotuloEm`
  rotulo?: string;
  rotuloEm?: number;
  // false = o contador não mostra número (a fala não disse quantas vezes): os arcos acendem e o
  // rótulo fica no centro ("anos", "todo dia")
  contagem?: boolean;
  // bloco final (a pausa longa): cai em `em`; `minutos` aparece em `minutosEm` e, se houver
  // `maxMinutos`, o bloco estica até ele em `maxEm` (faixa "15–30 min")
  final?: {
    categoria: Categoria;
    titulo?: string;
    em: number;
    minutos: number;
    minutosEm?: number;
    maxMinutos?: number;
    maxEm?: number;
    // o anel deixa de contar ciclos e passa a contar o bloco final (acelerado) a partir daqui;
    // padrão: 0,45 s depois que a faixa fecha, se sobrar tempo no momento; null = não conta
    cronometroEm?: number | null;
  };
};

// ——— tipos próprios que também servem de bloco universal ———

// Abertura com pergunta e resposta: avisos se amontoam e são varridos quando a resposta é dita.
export type Gancho = Base & {
  tipo: "gancho";
  pergunta: string;
  distracoes?: { texto: string; icone?: NomeIcone; em: number }[];
  resposta?: string;
  respostaRotulo?: string;
  varreEm?: number;
};

// Frase de efeito: a pessoa no alto; a agenda inteira se encolhe numa linha do dia; a frase se
// monta palavra por palavra e uma marcação percorre a linha, concluindo cada bloco.
export type Frase = Base & {
  tipo: "frase";
  // a frase, fiel à fala (até ~90 caracteres); a primeira frase (até o ponto) sai maior
  texto: string;
  // trecho exato em tomate (`enfase` é o nome antigo)
  destaque?: string;
  enfase?: string;
  // trecho exato riscado em tomate quando é dito (ou em `riscoEm`)
  risco?: string;
  riscoEm?: number;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // a marcação percorre a linha do dia de `marcaDe` até `concluiEm` (padrão: do meio da frase até a última palavra)
  marcaDe?: number;
  concluiEm?: number;
};

// Lista de tarefas: a pessoa em cima e uma lista de afazeres; cada item entra no seu `em` e é
// marcado como feito em `feitoEm`.
export type Tarefas = Base & {
  tipo: "tarefas";
  titulo: string;
  itens: { texto: string; em: number; feitoEm?: number }[];
};

// Fechamento: a pessoa volta para a tela cheia e um cartão de lembrete sobe no peito: botão que
// afunda na palavra, título com palavras faladas, o dia em miniatura e etiquetas (quando, onde).
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com palavras faladas (`titulo` é o nome antigo)
  texto?: string;
  titulo?: string;
  // trecho exato do texto em tomate
  destaque?: string;
  // o botão: salvar (padrão), seguir, comentar ou link (`acao` é o nome antigo)
  icone?: "salvar" | "seguir" | "comentar" | "link";
  acao?: "salvar" | "seguir" | "comentar" | "link";
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // letreiro em cima ("Lembrete")
  rotulo?: string;
  // quando o botão é apertado (a palavra "salva", "segue", "toca")
  acaoEm?: number;
  // etiquetas que acendem na palavra (até 2): "Hoje", "Trabalho"
  etiquetas?: { texto: string; icone?: NomeIcone; em: number }[];
};

export type Momento =
  | Abertura
  | Gancho
  | Destaque
  | Pergunta
  | Numero
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Definicao
  | Blocos
  | Ciclos
  | Frase
  | Tarefas
  | Cta;

export type TipoDeMomento = Momento["tipo"];

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = 9:16; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (px): os cartões do peito começam aqui (o motor preenche)
  zona?: { topo: number; altura: number };
  // nome e área (etiqueta do compromisso de vídeo)
  marca: { nome: string; area: string };
  // a agenda: título do cabeçalho (padrão: a resposta do gancho, ou a área), o dia ("Hoje"; "" esconde)
  // e o horário do primeiro bloco
  agenda?: { titulo?: string; dia?: string; inicio?: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
