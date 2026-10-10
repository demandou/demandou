// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O Plantão é um estilo de telejornal que serve para QUALQUER assunto. Cada momento escolhe sozinho
// o quadro da pessoa:
//   "cheio"    quadro cheio, arte de TV na altura do peito (tarjas: abertura, manchete, destaque,
//              definicao, pergunta sem opções, cta, vinheta);
//   "dividida" tela dividida em faixas: a pessoa em cima, o painel do estúdio embaixo (topicos,
//              passos, numero, comparacao, grafico, frase, pergunta com opções, nota, dado, etiqueta);
//   "lateral"  o painel em pé à esquerda e a pessoa na coluna da direita: só a `etiqueta` com
//              `quadro: "lateral"` (o formato do vídeo de exemplo).
// A barra "EXPLICANDO" com relógio e o letreiro correndo na base ficam por cima de tudo.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack. Os tipos
// próprios do Plantão (vinheta, manchete, etiqueta, nota, dado) e os campos extras são opcionais.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (neste modelo quase nunca: as artes
  // já mostram o que é dito)
  legenda?: boolean;
};

// ——— blocos universais ———

// Abertura: o título do vídeo numa tarja de telejornal, palavra por palavra, com o risco da vinheta.
// `em` = quando o texto começa a ser dito (padrão: `de`). `chapeu` (próprio) vai na aba azul.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; chapeu?: string };

export type Item = { texto: string; em: number; detalhe?: string; detalheEm?: number };

// Lista sem ordem (2 a 5 itens): tarjas brancas empilhadas no painel, cada uma no seu `em`.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência (2 a 5 itens): etapas numeradas ligadas por um trilho que acende de uma para a outra.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta até `valor` a partir de `em` (formato brasileiro). `apoio`, `apoioEm` e `fonte`
// são próprios do Plantão (a linha de apoio e a fonte do dado, como nas telas de economia).
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
  apoio?: string;
  apoioEm?: number;
  fonte?: string;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
// Dois lados no painel, como o placar de um debate: cada coluna acende no seu `em`.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de linhas com rótulo (o do vídeo de exemplo): cada série é uma linha que sobe ou desce
// quando é dita.
export type Serie = {
  // o rótulo da linha (até ~26 caracteres; quebra em até 3 linhas)
  rotulo: string;
  // quando a linha se desenha (a primeira palavra do rótulo)
  em: number;
  sentido: "sobe" | "desce";
  // uma segunda linha de texto, menor, dita depois (ex.: "de forma geral"); com `feixe` a linha
  // ganha um feixe de linhas finas ao lado (várias coisas subindo juntas)
  detalhe?: { texto: string; em: number; feixe?: boolean };
};

// Gráfico no painel do estúdio.
// - com `dados` (2 a 6 números DITOS): barras, linha ou pizza proporcionais;
// - sem `dados`: a forma da `tendencia` (sobe, cai, oscila), com a etiqueta "ilustrativo";
// - com `series` (próprio): 1 ou 2 linhas com rótulo que se cruzam (o gráfico do vídeo de exemplo).
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  // palavra do título que vai numa tarja branca (próprio)
  destaque?: string;
  forma?: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  series?: Serie[];
  // rótulo do eixo de baixo nas linhas (padrão "Tempo"; "" esconde)
  eixo?: string;
};

// Uma palavra ou frase curta que bate forte: faixa de ponta a ponta na altura do peito.
// "alerta" ganha o bloco vermelho do plantão; "chave", o azul elétrico.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Termo e significado: o termo na tarja branca, o significado na tarja escura embaixo.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Citação no painel: aspas, o texto palavra por palavra, `destaque` com tarja branca e `risco` riscado.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste. Sem opções: tarja com o "?" (quadro cheio). Com 2 a 4 opções: enquete
// no painel, cada opção no seu `em`.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a tarja com a chamada falada, a tarja de nome e o botão da chamada.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  destaque?: string;
  // o que a chamada pede: seguir (padrão), salvar, comentar ou link
  icone?: "seguir" | "salvar" | "comentar" | "link" | "compartilhar";
  em?: number;
  // texto do botão na aba azul (próprio; padrão pelo ícone: "Seguir", "Salvar", "Comente", "Acesse")
  botao?: string;
};

// ——— tipos próprios do Plantão (a assinatura) ———

// Vinheta de abertura: a placa com o título gigante na altura do peito e o cronômetro que dá uma
// volta quando o número do subtítulo é dito ("em 30 segundos").
export type Vinheta = Base & {
  tipo: "vinheta";
  // 1 palavra curta, em caixa-alta (até ~10 letras)
  titulo: string;
  // a linha de baixo, dita logo depois do título (até ~24 caracteres)
  subtitulo?: string;
};

// Manchete (GC): o chapéu na aba azul, a manchete na tarja branca e a tarja de nome embaixo.
export type Manchete = Base & {
  tipo: "manchete";
  chapeu?: string;
  titulo: string;
  destaque?: string;
  // false esconde a tarja de nome embaixo (padrão: aparece)
  tarja?: boolean;
};

// Etiqueta: um valor que muda ("era X, passou a ser Y"). A etiqueta nasce a lápis, ganha cor no
// valor de antes e SOBE (ou desce) pelo trilho até a vaga do valor novo, que rola como placar.
// Os valores podem ser números ("R$ 100" → "R$ 105") ou palavras curtas ("Inofensivo" → "Tóxico").
export type Etiqueta = Base & {
  tipo: "etiqueta";
  // o número ou estado de cima (ex.: rótulo "Inflação do ano", valor "5%"); `em` = quando é dito
  taxa?: { rotulo: string; valor: string; em: number };
  antes: { rotulo: string; valor: string; em: number };
  depois: { rotulo: string; valor: string; em: number };
  // quando a etiqueta começa a andar (padrão: a primeira palavra de `depois.rotulo`)
  sobeEm?: number;
  // o selo no trilho (ex.: "+R$ 5", "3×"); confira a conta
  diferenca?: string;
  // "desce" para o que cai (preço que baixa, risco que diminui)
  sentido?: "sobe" | "desce";
  // "dividida" (padrão): o painel embaixo, a etiqueta sobe na diagonal. "lateral": o formato alto
  // do vídeo de exemplo (painel em pé à esquerda, a pessoa na coluna da direita).
  quadro?: "dividida" | "lateral";
};

// Nota: algo que tem um valor e PERDE força. Chega, fica "parada" e encolhe — o valor impresso
// continua o mesmo, mas o tamanho diminui.
export type Nota = Base & {
  tipo: "nota";
  // o que vai impresso (ex.: "R$ 100", "8 horas", "100%", "Energia")
  valor: string;
  // o símbolo do selo redondo (padrão: o símbolo de moeda do valor; sem moeda, sem selo)
  simbolo?: string;
  // a linha de cima do painel
  rotulo: string;
  // quando a nota chega
  notaEm: number;
  // quando aparece o selo de pausa (o "parado"); opcional
  paradoEm?: number;
  // a frase de baixo e quando a nota começa a encolher
  perda: { texto: string; em: number };
  // tamanho final da nota (0,5–0,92; padrão 0,72)
  escala?: number;
};

// Dado (formato antigo do número): o valor já escrito como texto ("10,5%", "R$ 1.412").
export type Dado = Base & {
  tipo: "dado";
  rotulo: string;
  valor: string;
  em: number;
  apoio?: string;
  fonte?: string;
  ilustrativo?: boolean;
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
  | Vinheta
  | Manchete
  | Etiqueta
  | Nota
  | Dado;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` (o cortar.mjs grava) vem junto
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (px): as artes de quadro cheio e a linha da tela dividida saem daqui
  zona?: { topo: number; altura: number };
  // nome e função na tarja de nome (ex.: "Tiago Moura" / "Entenda")
  marca: { nome: string; area: string };
  // a barra "EXPLICANDO": quando entra, o assunto ao lado do relógio e o tempo prometido
  barra?: {
    // padrão: logo depois da vinheta (ou no início, sem vinheta)
    de?: number;
    // o rótulo vermelho (padrão "Explicando")
    texto?: string;
    // o assunto, numa tarja branca ao lado do relógio (ex.: "Inflação"); `temaEm` = quando é dito
    tema?: string;
    temaEm?: number;
    // segundos prometidos ("entenda em 30 segundos"): o anel do relógio enche nesse tempo
    meta?: number;
  };
  // o letreiro correndo na base
  letreiro?: {
    de?: number;
    // o bloco fixo à esquerda (padrão "Resumo")
    rotulo?: string;
    // as frases que correm (caixa-alta automática); vazio = sem letreiro
    itens: string[];
  };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "Cloud": "Claude" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
