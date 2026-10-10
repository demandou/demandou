// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Na Lousa, cada momento é uma "página" da lousa: o apagador limpa a anterior, a pessoa
// muda de lugar (vira uma janela presa no quadro) e o que é dito é escrito a giz no ritmo da fala.
// Serve para qualquer assunto: os 11 blocos universais (abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta) existem em todos os modelos do
// pack com os mesmos campos; aqui eles são escritos a giz. A assinatura da Lousa é a conta armada
// (`coluna`, `resultado`, `virgula`, `fracao`), que também aceita palavras no lugar de números.

// Onde a pessoa fica durante o momento:
// "alto"     = janela grande no alto, centralizada; a lousa embaixo
// "direita"  = janela no canto de cima à direita; título ao lado dela, o resto embaixo
// "esquerda" = janela no canto de cima à esquerda; título ao lado dela, o resto embaixo
// Sem `layout`, cada bloco escolhe sozinho e os cantos se alternam (direita, esquerda, direita…).
// (entre momentos com respiro, a pessoa volta para a tela cheia sozinha)
export type Layout = "alto" | "direita" | "esquerda";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o lugar padrão da pessoa
  layout?: Layout;
};

// Cabeçalho ao lado da janela (lugares de canto): rótulo pequeno ("Passo 1") e um título a giz
// amarelo ("10%", "Os 3 erros") escrito quando é dito.
type Cabecalho = {
  passo?: string;
  titulo?: string;
  tituloEm?: number;
};

// ===================== os 11 blocos universais (motor/BLOCOS.md) =====================

// Abertura: o tema escrito a giz, palavra por palavra quando é dita; `destaque` em giz amarelo
// e sublinhado. `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // (opcional, só na Lousa) o tema em 2–3 palavras, em caixa-alta, acima do texto
  rotulo?: string;
};

export type ItemDeLista = { texto: string; em: number; detalhe?: string };

// Lista sem ordem (motivos, erros, dicas): cada item é escrito na palavra dele, com um traço amarelo
export type Topicos = Base & Cabecalho & { tipo: "topicos"; itens: ItemDeLista[] };

// Sequência em ordem: algarismos a giz circulados, ligados por setas
export type Passos = Base & Cabecalho & { tipo: "passos"; itens: ItemDeLista[] };

// Um número dito: escrito algarismo por algarismo em pt-BR (83.000; 1,5) e sublinhado duas vezes
export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  // "R$", "US$", "+"… antes; "%", "mil", "mi", "kg"… depois
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  // número aproximado/ilustrativo: ganha "≈" e a etiqueta ILUSTRATIVO
  ilustrativo?: boolean;
};

export type Lado = { rotulo: string; texto: string; em: number };

// Dois lados: a lousa dividida em T (o quadro de "prós e contras")
export type Comparacao = Base &
  Cabecalho & {
    tipo: "comparacao";
    modo?: "contra" | "antes-depois" | "errado-certo";
    lados: [Lado, Lado];
    vencedor?: 0 | 1;
    vencedorEm?: number;
  };

// Gráfico a giz: eixos riscados; barras, linha ou pizza com os números ditos; sem números,
// a curva da tendência com a etiqueta ILUSTRATIVO
export type Grafico = Base &
  Cabecalho & {
    tipo: "grafico";
    forma: "barras" | "linha" | "pizza";
    dados?: { rotulo: string; valor: number; em: number }[];
    tendencia?: "sobe" | "cai" | "oscila";
    tendenciaEm?: number;
    unidade?: string;
    ilustrativo?: boolean;
  };

// Uma palavra ou frase curta que bate forte. "alerta" = giz rosa (a cor do erro) com o sinal de
// atenção; "chave" (padrão) = giz amarelo com sublinhado duplo
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Verbete de lousa: o termo (amarelo, ao lado da janela) = o significado (embaixo)
export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
};

// Citação a giz entre aspas, palavra por palavra; `risco` = trecho riscado quando é dito
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
};

// Pergunta para quem assiste; com `opcoes` (2 a 4), vira questão de prova: a) b) c)
export type Pergunta = Base & {
  tipo: "pergunta";
  texto: string;
  opcoes?: { texto: string; em: number }[];
  em?: number;
};

// Fechamento: (opcional) a regra para levar + a chamada com ícone desenhado + assinatura
export type Cta = Base &
  Cabecalho & {
    tipo: "cta";
    // a chamada, com as palavras na ordem em que são faladas (cada uma entra quando é dita)
    texto: string;
    icone?: "salvar" | "seguir" | "comentar" | "link" | "compartilhar";
    // trecho exato da chamada em giz amarelo (padrão: a primeira palavra)
    destaque?: string;
    // quando a chamada começa a ser dita (padrão: `de`)
    em?: number;
    // instante em que o ícone "acontece" (o marcador enche, o balão ganha linhas…)
    iconeEm?: number;
    // rótulo pequeno em cima da regra ("Funciona com qualquer valor")
    regra?: { rotulo?: string; linhas: LinhaDeRegra[]; molduraEm?: number };
  };

// ===================== a assinatura: a conta na lousa =====================

// Abertura em forma de pergunta/tema em linhas (o demo usa este; `abertura` faz o mesmo com um texto só)
export type Titulo = Base & {
  tipo: "titulo";
  rotulo?: string;
  // 1 a 3 linhas, com as palavras NA ORDEM EM QUE SÃO FALADAS
  linhas: string[];
  // trecho exato em giz amarelo
  destaque?: string;
  // sublinhado amarelo embaixo da última linha, neste instante
  sublinharEm?: number;
};

// "Anda a vírgula": o número é escrito, a vírgula pula casas por cima de uma seta e o resultado
// aparece embaixo, circulado. Serve para 10%, 1%, ×10, ÷100, conversões (m → km)…
export type Virgula = Base &
  Cabecalho & {
    tipo: "virgula";
    // "R$", "km"… escrito antes do número, menor
    prefixo?: string;
    // número sem pontos de milhar; pode ter vírgula ("3,5")
    numero: string;
    numeroEm: number;
    // quantas casas a vírgula anda: positivo = para a esquerda (divide), negativo = para a direita (multiplica)
    casas: number;
    moverEm: number;
    resultado: string;
    resultadoEm: number;
  };

// "Divide com um traço": numerador, traço, denominador e o resultado circulado.
// Aceita palavras curtas ("poucos" / "todos" = "a minoria").
export type Fracao = Base &
  Cabecalho & {
    tipo: "fracao";
    numerador: string;
    // sem `numeradorEm`, o numerador vem da página anterior (se estiver lá) ou já começa escrito
    numeradorEm?: number;
    tracoEm: number;
    denominador: string;
    denominadorEm: number;
    // palavra a giz ao lado do traço ("metade", "um terço")
    nota?: string;
    notaEm?: number;
    resultado: string;
    resultadoEm: number;
  };

// Conta armada: parcelas, o sinal, o traço e o total circulado. Com números (soma, subtração,
// multiplicação) ou com PALAVRAS ("impulso + sem critério + risco = prejuízo"): a conta de qualquer assunto.
export type Coluna = Base &
  Cabecalho & {
    tipo: "coluna";
    operador: "+" | "−" | "×";
    operadorEm: number;
    // 2 a 4 parcelas; sem `em`, a parcela vem da página anterior (se estiver lá) ou já começa escrita
    itens: { valor: string; rotulo?: string; em?: number }[];
    tracoEm: number;
    total: { valor: string; rotulo?: string; em: number };
  };

// A resposta: a pergunta como conta e o resultado com sublinhado duplo (e moldura).
// O valor pode ser um número ("R$ 12") ou uma palavra ("critério").
export type Resultado = Base & {
  tipo: "resultado";
  rotulo?: string;
  // a pergunta como conta, com as palavras na ordem em que são faladas ("15% de 80")
  conta: string;
  contaEm: number;
  // trecho exato da conta em giz amarelo
  destaque?: string;
  valor: string;
  valorEm: number;
  molduraEm?: number;
};

export type LinhaDeRegra = { texto: string; em: number; destaque?: string };

// Regra/macete para levar: até 3 linhas a giz, com moldura
export type Regra = Base &
  Cabecalho & {
    tipo: "regra";
    linhas: LinhaDeRegra[];
    molduraEm?: number;
  };

export type Universal = Abertura | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Frase | Pergunta | Cta;
export type Assinatura = Titulo | Virgula | Fracao | Coluna | Resultado | Regra;
export type Momento = Universal | Assinatura;

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
  // calculada pelo motor; a Lousa não usa (a pessoa muda de lugar), mas o campo continua no plano
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste fino do enquadramento da pessoa em cada layout (zoom, ancoraY); raramente necessário
  caixas?: Partial<Record<Layout | "cheio", { zoom?: number; ancoraY?: number }>>;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
