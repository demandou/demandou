// Formato do plano de edição do modelo Convite. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado;
// todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// Gramática do Convite (papelaria fina sobre linho), em quatro estados:
// - convite: o convite grande com a pessoa na foto em arco e o texto embaixo do lacre
//   (abertura, convite, numero, definicao, destaque, frase, pergunta);
// - cronograma: o convite encolhe para um lado do alto, o mostrador gira do outro lado, a fita de
//   cetim se desenrola no meio e um cartão cai na pilha (marco, passos: a assinatura);
// - mesa: o mesmo convite pequeno e o mostrador, sem fita nova; o cartão da pilha traz o conteúdo
//   (topicos, comparacao, grafico);
// - final: o convite volta grande por cima da pilha aberta em leque (cta).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.

// Ícones a traço fino (lista e uso em references/plano.md). Item sem ícone ganha um losango azul.
export type Icone =
  | "calendario"
  | "local"
  | "orcamento"
  | "camera"
  | "buffet"
  | "convite"
  | "traje"
  | "envio"
  | "prova"
  | "confirmacao"
  | "aliancas"
  | "bolo"
  | "flores"
  | "musica"
  | "lista"
  | "taca"
  | "relogio"
  | "alerta"
  | "certo"
  | "errado"
  | "grafico"
  | "lupa"
  | "ideia"
  | "coracao"
  | "estrela"
  | "pessoa"
  | "casa"
  | "livro"
  | "telefone"
  | "computador"
  | "teclado"
  | "janela"
  | "copiar"
  | "recorte"
  | "cadeado"
  | "mensagem"
  | "presente"
  | "seta";

export type Lado = "esq" | "dir";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (neste modelo não tem efeito)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; icone?: Icone };

// ——— no convite grande ———

// Abertura do demo: título curto em caligrafia + letreiro; o lacre estampa no `seloEm`.
export type Convite = Base & {
  tipo: "convite";
  // caligrafia, curtinho: "Vai casar?"
  titulo: string;
  // letreiro em caixa-alta abaixo: "Anota esse cronograma"
  subtitulo?: string;
  seloEm?: number;
};

// Abertura universal: o título se monta palavra por palavra na fala. Curto, vira caligrafia inteiro;
// longo, vira texto em itálico com o `destaque` em caligrafia. `em` = quando o texto começa a ser dito.
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // letreiro opcional em caixa-alta embaixo do ornamento
  subtitulo?: string;
  seloEm?: number;
};

// Número que conta até `valor` a partir de `em`, grande em letra gravada, como num "save the date".
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

// Termo em caligrafia; o significado se escreve embaixo do filete quando é dito.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Uma palavra ou frase curta que bate forte; o lacre estampa de novo. "alerta" = tinta vermelha.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Frase de efeito palavra por palavra; `destaque` vira caligrafia; `risco` é riscado em tinta vermelha.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  seloEm?: number;
};

// Pergunta para quem assiste; `opcoes` viram as linhas de um cartão de resposta, com o quadradinho.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— a assinatura: o cronograma (fita, mostrador e pilha) ———

// Um marco: a fita se desenrola até ele, o mostrador gira para o número e um cartão cai na pilha.
// Sem `numero`, o marco ganha a posição dele na sequência (1, 2, 3…).
export type Marco = Base & {
  tipo: "marco";
  // até 3 caracteres: "12", "9", "1º", "A"
  numero?: string;
  // embaixo do número no mostrador: "meses antes", "dias", "semanas"
  unidade?: string;
  // o cabeçalho do cartão (palavras da fala): "Doze meses antes", "Ctrl + Shift + T"
  extenso?: string;
  // quando o número é dito (padrão: `de`)
  numeroEm?: number;
  // de 1 a 4; cada um ganha tinta no instante em que é dito
  itens: Item[];
  // lado da foto no alto; sem isso, alterna
  pessoa?: Lado;
};

// Sequência em ordem: a fita marca I, II, III…, o mostrador acompanha e o cartão traz os passos.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; pessoa?: Lado };

// ——— na mesa (convite pequeno, mostrador e um cartão na pilha) ———

// Lista sem ordem: o cartão com os itens, cada um no seu `em`; o mostrador conta os itens.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; pessoa?: Lado };

// Dois lados no mesmo cartão, separados por um filete; o vencedor ganha um lacre pequeno.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  pessoa?: Lado;
};

// Gráfico a tinta no cartão: barras de cetim, linha a pena ou anel. Sem números ditos: `tendencia`.
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  pessoa?: Lado;
};

// ——— fechamento ———

// O convite volta grande sobre a pilha aberta; a chamada se escreve e o lacre estampa de novo.
export type Cta = Base & {
  tipo: "cta";
  // a chamada; curta (até ~12 letras) vira caligrafia grande
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato do texto (ou do complemento) em caligrafia azul
  destaque?: string;
  em?: number;
  // o resto da frase, em itálico: "e manda pro seu amor"
  complemento?: string;
  seloEm?: number;
};

export type Momento =
  | Convite
  | Abertura
  | Numero
  | Definicao
  | Destaque
  | Frase
  | Pergunta
  | Marco
  | Passos
  | Topicos
  | Comparacao
  | Grafico
  | Cta;

export type TipoDeMomento = Momento["tipo"];

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = vertical cheio; 1440 = gravação horizontal recortada)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // calculada pelo motor; este modelo não usa (a pessoa fica sempre numa foto em arco)
  zona?: { topo: number; altura: number };
  // assinatura do convite: nome e área ("Tiago" / "Cerimonial")
  marca: { nome: string; area: string };
  // letra do lacre de cera; sem isso, a inicial de marca.nome (sem nome: um ornamento)
  monograma?: string;
  // ajuste do rosto nas fotos em arco: zoom (1 = padrão) e altura do rosto na foto (0–1)
  pessoa?: { zoom?: number; ancoraY?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
