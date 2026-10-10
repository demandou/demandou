// Formato do plano de edição do modelo Manifesto. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
// Todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática: PÔSTER × QUADRO CHEIO. As ideias viram PÔSTERES tipográficos em tela cheia (campo de
// cor sólido) e o vídeo da pessoa aparece DENTRO das letras de uma palavra gigante (a "janela").
// Entre os pôsteres, a pessoa volta em quadro cheio, com legenda; números e destaques entram numa
// PLACA na altura do peito, por cima do quadro cheio.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é o `cartaz` (pôster com palavra-janela e negações riscadas) e a
// `escalada` (a frase que se repete crescendo); o `selo` é a batida no quadro cheio.

export type Campo = "cobalto" | "papel" | "preto";

// Uma linha de texto do pôster. Cada palavra entra quando é falada (o template acha o tempo de cada
// uma nas `palavras` do plano, a partir de `em`). Escreva só o que é dito, na ordem.
export type Linha = {
  em: number;
  texto: string;
  // tamanho da letra em px (padrão 96); encolhe sozinho se não couber na largura
  tamanho?: number;
  // true = a linha sai na cor de acento do campo
  acento?: boolean;
};

// A janela: a palavra gigante com o vídeo da pessoa dentro das letras.
// Palavra curta, quebrada em 1 a 3 linhas de 2 a 4 letras: ["EU"], ["NÃO"], ["VO", "CÊ"], ["CO", "ME", "ÇA"].
// O rosto da pessoa fica dentro da PRIMEIRA linha.
export type Janela = {
  // quando a palavra é falada: as letras se abrem aqui
  em: number;
  linhas: string[];
  // instantes em que a palavra "bate" de novo (ex.: cada "não" de uma lista de negações)
  batidas?: number[];
  // aproximação do vídeo dentro das letras (1 = como foi gravado; até 1,4)
  zoom?: number;
};

// Uma negação: o que vem antes (pequeno) e a palavra negada (grande), riscada em `riscoEm`.
export type Negacao = {
  em: number;
  // começo da frase, em letra menor: "O MOMENTO"
  antes?: string;
  // a palavra que é negada: "PERFEITO"
  palavra: string;
  // quando o risco passa (logo depois de a palavra ser dita)
  riscoEm: number;
};

type Base = {
  de: number;
  ate: number;
  // não use neste modelo: o pôster já mostra o que é dito e a legenda nunca aparece por cima dele
  legenda?: boolean;
  // fundo do pôster; sem isso, alterna sozinho (cobalto, papel, cobalto…)
  campo?: Campo;
};


export type Cartaz = Base & {
  tipo: "cartaz";
  // linhas acima da janela, de cima para baixo
  topo?: Linha[];
  janela?: Janela;
  // negações abaixo da janela (riscadas uma a uma)
  negacoes?: Negacao[];
  // linhas abaixo da janela (e das negações)
  base?: Linha[];
  // último pôster (chamada): mostra a assinatura e um ícone ao lado da primeira linha do topo,
  // e fica até o fim do vídeo
  fecho?: { icone?: "comentar" | "salvar" | "seguir" | "enviar" | "link" };
};

// Um degrau da escalada: a mesma palavra, cada vez maior.
export type Degrau = {
  em: number;
  texto: string;
  // complemento menor, embaixo ("PEQUENO.", "TORTO.")
  nota?: string;
  notaEm?: number;
  // true = o degrau entra inclinado (para "torto", "errado", "fora do lugar")
  torto?: boolean;
};

// Escalada: frases que se repetem crescendo ("Começa pequeno. Começa torto. Mas começa.").
// Cada degrau entra maior que o anterior, que encolhe e sobe; o último vira a janela gigante.
export type Escalada = Base & {
  tipo: "escalada";
  degraus: Degrau[];
  final: {
    em: number;
    // palavra curta antes da janela ("MAS"), em letra pequena
    antes?: string;
    antesEm?: number;
    linhas: string[];
    zoom?: number;
  };
};

// Selo: um pequeno pôster na altura do peito, no QUADRO CHEIO (a pessoa continua inteira, com
// legenda). Para dar uma batida a mais num trecho longo sem pôster: "Daqui a 1 ANO", um prazo, um
// número. Os textos entram em sequência, vazados (o vídeo aparece dentro das letras); o item com
// `acento` vira o selo para o branco e bate forte (a palavra que fecha a ideia: "AGORA.").
export type Selo = {
  tipo: "selo";
  de: number;
  ate: number;
  legenda?: boolean;
  campo?: Campo;
  itens: {
    em: number;
    // texto grande, curto (até ~7 caracteres): "1 ANO", "AGORA.", "30 DIAS"
    texto: string;
    // letreiro pequeno em cima (até ~16 caracteres): "DAQUI A"
    rotulo?: string;
    acento?: boolean;
  }[];
  // marcas que acendem uma a uma de `de` a `ate` (ex.: os 12 meses do ano passando)
  marcas?: { de: number; ate: number; quantas: number };
};

// ——— Os 11 blocos universais ———
// Nos blocos de pôster, `janela` (opcional) escolhe a palavra-janela: uma palavra CURTA que está no
// texto do bloco e é dita (2 a 6 letras). "VO/CÊ" quebra as linhas onde você quiser; "" = sem
// palavra (a pessoa aparece num círculo). Sem `janela`, o template escolhe sozinho uma palavra
// curta do texto (de preferência a do `destaque`); sem nenhuma palavra curta, usa o círculo.
// Nas listas, a janela é o número do item da vez (01, 02, 03…); na comparação, "VS".
type BaseBloco = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento (normalmente não precisa: o bloco já mostra a fala)
  legenda?: boolean;
  campo?: Campo;
  janela?: string;
};

export type Item = { texto: string; em: number; detalhe?: string };

// Pôster: título montado palavra por palavra; `destaque` = trecho exato em letra maior, na cor de acento.
// `em` (opcional, nos quatro blocos de texto falado): quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = BaseBloco & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Pôster: lista sem ordem (motivos, erros, dicas). A janela é o número do item da vez.
export type Topicos = BaseBloco & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Pôster: sequência em ordem; uma seta de acento liga um passo ao outro quando ele é dito.
export type Passos = BaseBloco & { tipo: "passos"; titulo?: string; itens: Item[] };

// Placa no peito (quadro cheio): o número conta até `valor` a partir de `em`, vazado (a pessoa
// aparece dentro dos algarismos); prefixo e sufixo menores; marcas que acendem enquanto conta.
export type Numero = {
  tipo: "numero";
  de: number;
  ate: number;
  legenda?: boolean;
  campo?: Campo;
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
};

// Pôster dividido: lado 1 no campo de cima, lado 2 no campo de baixo (as duas cores do modelo),
// a janela "VS" na emenda. `vencedor`: o outro lado é riscado em `vencedorEm`.
export type Comparacao = BaseBloco & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Pôster com gráfico chapado (colunas, linha grossa ou anel). Sem números ditos: `tendencia`
// desenha a forma com a etiqueta ILUSTRATIVO.
export type Grafico = BaseBloco & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Placa no peito (quadro cheio): a palavra ou frase curta vazada, grande. "alerta" = placa preta.
export type Destaque = {
  tipo: "destaque";
  de: number;
  ate: number;
  legenda?: boolean;
  campo?: Campo;
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Pôster: o termo grande, um "=" e o significado escrito embaixo.
export type Definicao = BaseBloco & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Pôster: frase de efeito; `destaque` em letra maior na cor de acento; `risco` riscado quando é dito.
export type Frase = BaseBloco & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pôster: a pergunta e as opções (2 a 4), uma embaixo da outra, separadas por "OU".
export type Pergunta = BaseBloco & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Pôster final: ícone ao lado da primeira linha, a chamada, a palavra-janela e a assinatura (nome e
// área). O último fica até o fim do vídeo.
export type Cta = BaseBloco & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

export type Universal = Abertura | Topicos | Passos | Comparacao | Grafico | Definicao | Frase | Pergunta | Cta;

// Pôsteres (tela cheia) e placas/selos (no quadro cheio).
export type Poster = Cartaz | Escalada | Universal;
export type Placa = Selo | Numero | Destaque;
export type Momento = Poster | Placa;
export type TipoDeMomento = Momento["tipo"];

export const TIPOS_DE_PLACA: TipoDeMomento[] = ["selo", "numero", "destaque"];
export const ehPlaca = (m: Momento): m is Placa => TIPOS_DE_PLACA.includes(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1): a janela é montada em volta dele; `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o motor calcula); a legenda fica no topo dela
  zona?: { topo: number; altura: number };
  // assinatura do último pôster; `area` também aparece no canto de cada pôster
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "Cloud": "Claude" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda (a legenda já some sozinha durante os pôsteres)
  semLegenda?: { de: number; ate: number }[];
  // quanto da pessoa aparece apagada atrás do campo inteiro do pôster (padrão 0 = campo sólido; até 0,08)
  fantasma?: number;
  sfx?: boolean;
};
