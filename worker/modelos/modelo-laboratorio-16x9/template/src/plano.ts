// Formato do plano de edição. O template renderiza qualquer vídeo, de QUALQUER assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack (motor/BLOCOS.md);
// aqui cada um vira uma folha do caderno. A assinatura (as figuras de experimento: espectro,
// particulas, ondas, observador, trajeto) aceita rótulos de qualquer assunto.
//
// No Laboratório, cada momento é uma FIGURA de um caderno de laboratório em papel milimetrado:
// a página rola até a figura nova, que já chega esboçada a lápis, e cada parte é passada a tinta
// (ou pintada a lápis de cor) no instante em que é dita. A pessoa fica numa "janela de observação"
// redonda, presa no caderno com fita, que muda de tamanho para dar espaço à figura.
//
// Esta é a versão deitada (16:9, 1920×1080, o vídeo completo do YouTube), pela regra da aula 9 do
// curso: a pessoa em tela cheia é a base; nos momentos, ela vira a foto redonda do lado DIREITO
// (rosto centralizado e acompanhado) e a figura ocupa a coluna da ESQUERDA.

// Onde a pessoa fica durante o momento (no quadro deitado a foto fica sempre do lado direito):
// "topo"     = foto grande à direita; a linha impressa e o texto na coluna da esquerda
//              (abertura, fechamento e blocos de texto)
// "direita"  = foto menor à direita; na coluna da esquerda, o cabeçalho da figura em cima
//              (rótulo + título) e o desenho embaixo
// "esquerda" = o mesmo que "direita" (a aula 9 fixa a moldura à direita; o valor continua aceito)
// "baixo"    = janela embaixo, no meio, "em pé" no horizonte: a pessoa vira o observador
//              e o céu da figura, na largura toda, fica em cima dela (só o `observador` usa)
// (entre momentos com respiro, a pessoa volta para a tela cheia sozinha)
export type Layout = "topo" | "direita" | "esquerda" | "baixo";

export type Cor = "azul" | "vermelho" | "tinta";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o lugar padrão da pessoa (sem isto, folhas seguidas alternam o lado sozinhas)
  layout?: Layout;
  // linha impressa do caderno ("Fig. 2 · Bitcoin"); sem isto, o bloco escreve "Fig. N · <nome do bloco>"
  rotulo?: string;
};

// Cabeçalho da figura (ao lado da janela): rótulo impresso + título à mão, palavra por palavra
// no instante em que cada palavra é dita (o tempo é achado sozinho nas palavras do momento).
type Cabecalho = {
  // rótulo impresso em caixa-alta: "Fig. 1 · Luz branca" (até ~22 caracteres)
  rotulo?: string;
  // 1 ou 2 linhas curtas (ou um texto só, que quebra sozinho), com as palavras NA ORDEM EM QUE SÃO FALADAS
  titulo?: string[] | string;
  // trecho exato do título em cor (azul ou vermelho)
  destaque?: string;
  corDestaque?: Cor;
};

export type Nota = { texto: string; em: number; cor?: Cor };

// Abertura: a pergunta escrita à mão na página do caderno, palavra por palavra
export type Titulo = Base & {
  tipo: "titulo";
  // linha impressa do caderno, à esquerda e à direita ("Experimento nº 07" / "Óptica")
  rotulo?: string;
  assunto?: string;
  // 1 a 3 linhas, com as palavras NA ORDEM EM QUE SÃO FALADAS
  linhas: string[];
  destaque?: string;
  corDestaque?: Cor;
  // sublinhado a lápis de cor embaixo do destaque, neste instante
  sublinharEm?: number;
};

// Uma fonte (Sol, lâmpada) solta um feixe de luz branca que passa por um prisma e se abre em
// sete cores. Serve para "a luz branca tem todas as cores", "um todo feito de partes".
export type Espectro = Base &
  Cabecalho & {
    tipo: "espectro";
    // rótulo à mão da fonte ("Sol")
    fonte?: string;
    fonteEm: number;
    // rótulo à mão do feixe ("luz branca") e quando o feixe sai da fonte (padrão: fonteEm + 0,25)
    feixe?: string;
    feixeEm?: number;
    // o feixe se abre nas cores
    abreEm: number;
    // rótulos das pontas do leque (de cima para baixo), ex.: ["vermelho", "violeta"]
    pontas?: [string, string];
    // anotação embaixo do leque, com seta ("todas as cores")
    nota?: Nota;
    // modo de qualquer assunto: em vez das 7 cores, o feixe se abre em 2 a 5 PARTES com nome
    // (as causas de um problema, os ingredientes de um resultado), cada uma no seu `em`
    partes?: { texto: string; em: number; cor?: Cor }[];
  };

// Um feixe entra numa camada (atmosfera, água, vidro), bate nas partículas e se espalha em
// pontinhos para todos os lados. Serve para espalhamento, colisão, difusão, poeira na luz.
export type Particulas = Base &
  Cabecalho & {
    tipo: "particulas";
    // o feixe começa a entrar
    entraEm: number;
    // nome da camada, escrito dentro dela ("atmosfera"), e quando ela é passada a tinta
    camada?: string;
    camadaEm: number;
    // o feixe chega na primeira partícula (padrão: entraEm + 0,8)
    bateEm?: number;
    // rótulo das partículas, com seta ("moléculas do ar"), e quando elas aparecem
    particulas?: string;
    particulasEm: number;
    // as partículas atingidas espalham pontinhos em todas as direções
    espalhaEm: number;
    // anotação do espalhamento ("se espalha")
    efeito?: string;
    // cor dos pontinhos espalhados (padrão: azul)
    cor?: Cor;
  };

// Duas (ou três) ondas lado a lado, com a medida de um comprimento de onda de cada; no fim de
// cada onda, uma partícula espalha muito ou pouco. Serve para luz, som, frequência, "curta × longa".
export type Onda = {
  // rótulo à mão, acima da onda ("luz azul")
  rotulo: string;
  cor: Cor;
  // quantas ondas cabem na linha (3 a 7 = curta; 1,5 a 2,5 = longa)
  ciclos: number;
  // quando a onda é desenhada
  em: number;
  // texto da medida ("onda curta") e valor impresso opcional ("~450 nm")
  medida?: string;
  valor?: string;
  // quanto essa onda espalha (0 a 1) e quando
  espalha?: number;
  espalhaEm?: number;
};

export type Ondas = Base &
  Cabecalho & {
    tipo: "ondas";
    ondas: Onda[];
    // as medidas (chaves) aparecem
    medirEm?: number;
    // anotação perto da partícula que mais espalha ("muito mais!")
    nota?: Nota;
  };

// A pessoa vira o observador: a janela desce para o horizonte e o céu da figura fica em cima.
// Linhas de visada saem dela para vários pontos do céu; depois a cor volta de todos os lados e
// o céu se pinta. Serve para "de qualquer lugar que você olhe", "tudo à sua volta".
export type Observador = Base & {
  tipo: "observador";
  rotulo?: string;
  // as linhas de visada saem uma a uma a partir daqui (uma a cada ~0,3 s)
  olharEm: number;
  // quantas direções (3 a 5)
  direcoes?: number;
  // a cor volta de todas as direções e o céu se pinta
  chegaEm: number;
  // o que é escrito no céu nesse instante ("chega azul"), palavra por palavra
  titulo?: string;
  cor?: Cor;
  // nome do que a pessoa olha (os pontos do céu: "os projetos", "as opiniões"), à mão com seta
  alvo?: string;
  alvoEm?: number;
};

// O caminho da luz por uma camada: a Terra embaixo, a camada de ar em volta, um observador em
// cima. O Sol desce do alto até o horizonte (o céu vai do azul ao pôr do sol), a medida do
// caminho dentro do ar cresce, o azul se perde pelo caminho e sobra o vermelho.
export type Trajeto = Base &
  Cabecalho & {
    tipo: "trajeto";
    // o Sol começa a descer (leva ~1,2 s) e o céu muda de cor junto
    desceEm: number;
    // a medida do caminho longo se destaca e os pontinhos azuis se soltam pelo caminho
    atravessaEm: number;
    // rótulo da medida longa, escrito na palavra dele ("mais ar"), e o da curta, ao meio-dia
    // (padrão "pouco ar"); "observador" é o rótulo da pessoa desenhada (padrão "você")
    medida?: string;
    curto?: string;
    observador?: string;
    medidaEm?: number;
    // o feixe chega vermelho no observador
    sobraEm: number;
    // anotação à mão ("sobra o vermelho"), palavra por palavra
    sobra?: string;
    // rótulos impressos das duas posições do Sol (padrão "12h" e "18h")
    horas?: [string, string];
  };

// Anotações: até 4 linhas escritas à mão, cada uma com uma setinha a tinta na frente, palavra por
// palavra no instante em que é dita; a última pode ganhar uma caixa a tinta (a conclusão).
// Serve para qualquer fato, regra, passo ou "resumindo" que não tenha desenho próprio.
export type LinhaDeNota = {
  texto: string;
  em: number;
  // trecho exato em cor
  destaque?: string;
  cor?: Cor;
};

export type Anotacoes = Base &
  Cabecalho & {
    tipo: "anotacoes";
    linhas: LinhaDeNota[];
    // caixa a tinta em volta da última linha, neste instante
    caixaEm?: number;
  };

// Gráfico à mão no papel milimetrado (bloco universal `grafico`).
// Com `dados` (números DITOS, 2 a 6): barras hachuradas que crescem, linha ponto a ponto ou pizza
// fatiada, cada dado no seu `em`. Sem `dados`: a forma qualitativa da `tendencia` (sobe, cai, oscila),
// com o carimbo "ilustrativo".
export type Dado = { rotulo: string; valor: number; em: number };
export type Grafico = Base &
  Cabecalho & {
    tipo: "grafico";
    forma: "barras" | "linha" | "pizza";
    dados?: Dado[];
    tendencia?: "sobe" | "cai" | "oscila";
    tendenciaEm?: number;
    // unidade dos valores ("%", "mil", "kg"); vai depois de cada número
    unidade?: string;
    ilustrativo?: boolean;
    // rótulos à mão dos eixos (opcionais: "tamanho da onda", "espalhamento")
    eixoX?: string;
    eixoY?: string;
    eixosEm?: number;
    // forma exata da curva qualitativa (troca a `tendencia`)
    curva?: "sobe" | "desce" | "cai-rapido" | "sobe-rapido" | "pico" | "satura";
    // nome antigo de `tendenciaEm`
    curvaEm?: number;
    cor?: Cor;
    // pontos marcados na curva qualitativa: x de 0 (início do eixo) a 1 (fim), com rótulo à mão
    pontos?: { x: number; rotulo: string; em: number; cor?: Cor }[];
  };

// Fechamento: rótulo impresso, a chamada escrita à mão palavra por palavra, um ícone desenhado
// e a assinatura (marca).
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com as palavras na ordem em que são faladas
  texto: string;
  destaque?: string;
  // "compartilhar" continua aceito pelo template, mas a conferência só aceita os quatro universais
  icone?: "seguir" | "salvar" | "comentar" | "link" | "compartilhar";
  iconeEm?: number;
  // quando a chamada começa a ser dita (padrão: `de`)
  em?: number;
};

// ——— blocos universais (motor/BLOCOS.md), na linguagem do caderno ———

export type Item = { texto: string; em: number; detalhe?: string };

// Abertura: a página com a linha impressa e o texto escrito à mão palavra por palavra (como o `titulo`)
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // linha impressa à direita (padrão: a área da `marca`)
  assunto?: string;
  corDestaque?: Cor;
  sublinharEm?: number;
};

// Lista sem ordem: observações à mão, cada uma com uma setinha a tinta, no seu `em`
export type Topicos = Base & Cabecalho & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: o procedimento do experimento, números em círculo ligados por um traço
export type Passos = Base & Cabecalho & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número medido: uma proveta graduada que enche enquanto a leitura conta até `valor`
export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  // o que é medido, à mão no cabeçalho ("Bitcoin rompeu")
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  // linha impressa da folha (aqui o `rotulo` é o nome do número): padrão "Fig. N · Medida"
  impresso?: string;
};

// Duas amostras lado a lado; com `vencedor`, a vencedora ganha um círculo a tinta
export type Comparacao = Base &
  Cabecalho & {
    tipo: "comparacao";
    titulo?: string;
    modo?: "contra" | "antes-depois" | "errado-certo";
    lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
    vencedor?: 0 | 1;
    vencedorEm?: number;
  };

// Palavra ou frase curta que bate forte, escrita grande dentro de uma caixa a tinta
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Termo e o que ele quer dizer: o termo à mão, sublinhado, uma seta e o significado
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito entre aspas desenhadas; `risco` é riscado a vermelhão quando é dito
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste: o "?" desenhado, a pergunta à mão e as opções com caixinhas
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Momento =
  | Titulo
  | Espectro
  | Particulas
  | Ondas
  | Observador
  | Trajeto
  | Anotacoes
  | Grafico
  | Cta
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Destaque
  | Definicao
  | Frase
  | Pergunta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio no 16:9)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o cortar grava também o `quadro` (1920×1080) e o `rastro`
  rosto: { x: number; y: number; quadro?: { largura: number; altura: number } };
  // calculada pelo motor; o Laboratório não usa (a pessoa muda de lugar), mas o campo continua no plano
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste fino do enquadramento da pessoa em cada lugar (zoom, ancoraY); raramente necessário
  caixas?: Partial<Record<Layout | "cheio", { zoom?: number; ancoraY?: number }>>;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
