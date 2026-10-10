// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O modelo Dicionário é um estilo: todo assunto vira um dicionário bem impresso. Cada momento é
// uma PÁGINA (a pessoa num quadro emoldurado no alto, como a ilustração do verbete) ou um
// FRONTISPÍCIO (a pessoa grande em cima e uma folha cobrindo a parte de baixo).
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack;
// a assinatura deste modelo é o `verbete` (e a `remissao`).

// Onde a pessoa fica numa página de dicionário:
// "quadro-direita"  = num quadro no alto da coluna da direita; o conteúdo ocupa a largura toda embaixo
// "quadro-esquerda" = a mesma coisa, espelhada
// "coluna-esquerda" = ocupa a coluna da esquerda inteira; o verbete fica na coluna da direita (só verbete e remissão)
// "coluna-direita"  = a mesma coisa, espelhada
// "frontispicio"    = a pessoa grande em cima e a folha cobrindo a parte de baixo
export type Layout = "quadro-direita" | "quadro-esquerda" | "coluna-esquerda" | "coluna-direita";
export type Lugar = Layout | "frontispicio";

// Desenhos prontos (traço de ilustração de dicionário). Novos desenhos: src/componentes/Figuras.tsx
export type Figura = "polvo" | "poeira";

// Um verbete vizinho, no fundo da página (palavra real, em ordem alfabética, com definição curta)
export type Vizinho = { palavra: string; classe?: string; def: string };
export type Vizinhos = { antes?: Vizinho[]; depois?: Vizinho[] };

// Um texto que entra num instante
export type Texto = { em: number; texto: string };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // onde a pessoa fica (padrão: automático, alternando o lado a cada página)
  layout?: Lugar;
};

// Um item de lista ou de passos
export type Item = { texto: string; em: number; detalhe?: string };

// Palavra-título do verbete: `silabas` com "·" entre as sílabas ("ex·qui·si·to")
export type PalavraTitulo = Texto & { silabas?: string };

// ===================== os 11 blocos universais =====================

// Frontispício de abertura: o título se monta palavra por palavra na fala.
export type Abertura = Base & {
  tipo: "abertura";
  // o título (palavras da fala, na ordem); " / " força a quebra de linha
  texto?: string;
  // trecho exato do texto (ou do subtítulo) em itálico ameixa
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // letreiro pequeno no alto da folha (padrão: nome · área da marca)
  rotulo?: string;
  // número grande ao lado do título ("3"), no instante em que é dito
  numero?: Texto;
  // linha menor embaixo do título, também palavra por palavra
  subtitulo?: string;
  // nomes antigos de `texto` e `destaque` (continuam valendo)
  titulo?: string;
  enfase?: string;
};

// Lista sem ordem: acepções numeradas de um verbete (1., 2., 3.)
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: remissões encadeadas (chips numerados ligados por um fio)
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta como palavra-título, com o valor por extenso embaixo e o rótulo como acepção
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
  // false = sem a linha "por extenso"
  extenso?: boolean;
};

export type Lado = { rotulo: string; texto: string; em: number };
// Dois cartões de nota lado a lado (o certo ganha a moldura ameixa; o errado é riscado)
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gravura de dicionário: barras hachuradas, linha a nanquim, pizza; sem números, a curva ilustrativa
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

// Uma palavra ou frase curta que bate forte: "alerta" vira carimbo; "chave", grifo ameixa
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Verbete simples: termo (palavra-título) e a acepção
export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
  // opcionais do dicionário
  silabas?: string;
  classe?: string;
  pronuncia?: string;
  aba?: string;
  vizinhos?: Vizinhos;
};

// Frase de efeito: epígrafe palavra por palavra. Com `traducao`, vira exemplo de uso bilíngue
// (a frase no idioma em itálico e a tradução embaixo).
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // exemplo bilíngue (opcional)
  traducao?: Texto;
  idioma?: string;
  rotulo?: string;
  destaqueTraducao?: string;
  vizinhos?: Vizinhos;
};

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: frontispício com a chamada (e a fita marcadora quando é "salvar")
export type Cta = Base & {
  tipo: "cta";
  // a chamada inteira, palavras da fala na ordem (" / " força a quebra)
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // opcional: a palavra de ordem, bem grande, antes do texto ("Salva")
  chamada?: string;
  // nome antigo de `destaque`
  enfase?: string;
};

// ===================== a assinatura =====================

// Verbete com cartão que vira: o que a palavra PARECE (riscado) e o que ela SIGNIFICA de verdade,
// com o carimbo. Serve para qualquer "parece × é": mito × verdade, leitura comum × sentido real.
export type Verbete = Base & {
  tipo: "verbete";
  // letra(s) da aba do índice (padrão: as duas primeiras letras da palavra)
  aba?: string;
  palavra: PalavraTitulo;
  // classe gramatical abreviada ("adj.", "s.m.", "loc.")
  classe?: string;
  // pronúncia aproximada, sílabas com "-" e a tônica em MAIÚSCULAS ("eks-ki-SÍ-to")
  pronuncia?: string;
  // chip do verso do cartão ("ES"); sem ele, só o rótulo
  idioma?: string;
  // frente do cartão: a leitura comum, que é riscada em `riscaEm`. `idioma` = chip da frente ("PT")
  parece: Texto & { glosa?: string; riscaEm?: number; rotulo?: string; figura?: Figura; idioma?: string };
  // verso do cartão: o sentido de verdade. O cartão vira em `viraEm` (padrão: 0,45 s antes de `em`)
  significa: Texto & { extra?: string; rotulo?: string; viraEm?: number; figura?: Figura };
  // carimbo sobre o cartão (padrão "Engano comum"); sem este campo, sem carimbo
  carimbo?: { em: number; texto?: string };
  vizinhos?: Vizinhos;
};

// Remissão ("ver também"): a palavra certa para uma ideia, com desenho opcional
export type Remissao = Base & {
  tipo: "remissao";
  // letreiro do que se procura ("O polvo, em espanhol")
  rotulo?: Texto;
  palavra: PalavraTitulo;
  classe?: string;
  pronuncia?: string;
  definicao?: Texto;
  figura?: { nome: Figura; em: number };
  vizinhos?: Vizinhos;
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
  | Verbete
  | Remissao;

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
  // topo da folha do frontispício (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste fino do enquadramento da pessoa em cada layout (zoom, ancoraY); raramente necessário
  caixas?: Partial<Record<Layout, { zoom?: number; ancoraY?: number }>>;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
