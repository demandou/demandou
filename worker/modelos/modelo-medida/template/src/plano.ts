// Formato do plano de edição do modelo Medida. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Blocos universais (motor/BLOCOS.md, iguais em todos os modelos): abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta.
// Assinatura do Medida: medida (uma quantidade vira coisa palpável: o objeto do assunto aparece,
// a quantidade cai em unidades físicas num copo de vidro, a linha de referência é marcada e, se a
// quantidade passa da linha, o alerta fica vermelho).
// Efeitos próprios: virada (a linha de luz que troca a roupa ou o enquadramento) e objeto (o objeto
// do assunto nasce no peito, gira até o rótulo e vai para o papel com até 3 informações).

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type ItemFalado = { texto: string; em: number; detalhe?: string };

// ——— universais ———
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemFalado[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemFalado[] };
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
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};
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
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

// ——— peças do Medida ———

// O objeto do assunto, em 3D, sem marca. `forma`: lata, garrafa, caixa (pacote, maço, caixa de
// remédio), pote (frasco, vidro de comprimidos, pote de creme). `rotulo` = o que está impresso
// (curto, em maiúsculas fica melhor); `cor` = cor do rótulo; `icone` = desenho em traço no rótulo.
export type Objeto = {
  forma: "lata" | "garrafa" | "caixa" | "pote";
  rotulo: string;
  cor?: string;
  icone?: "limao" | "folha" | "gota" | "chama" | "estrela" | "cruz" | "moeda" | "nenhum";
  // cor do líquido que a lata ou a garrafa despeja (padrão: verde-claro translúcido)
  liquido?: string;
  // instante em que o objeto nasce no ponto de entrega (à altura do peito) — a palavra que o nomeia
  em: number;
  // instante em que ele gira e mostra o rótulo (padrão: logo depois de `em`)
  rotuloEm?: number;
};

// Pontos das mãos (opcional): o meio entre as duas palmas em cada amostra, em frações do quadro
// do vídeo de trabalho (como `rosto`). `null` = mãos fora do quadro. O `ferramentas/maos.mjs`
// converte um rastreio de mãos para este formato. Sem `maos`, o objeto nasce no ponto de entrega.
export type Maos = { passo: number; x: (number | null)[]; y: (number | null)[] };

export type Medida = Base & {
  tipo: "medida";
  objeto?: Objeto;
  // a tela se recolhe na moldura e o papel aparece (com objeto: ele voa até o papel). Padrão: `de`
  palcoEm?: number;
  // a quantidade dita: conta até `valor` a partir de `em` ("trinta e cinco gramas de açúcar")
  quantidade?: { valor: number; em: number; prefixo?: string; sufixo?: string; sufixoEm?: number; rotulo?: string; rotuloEm?: number; casas?: number };
  // as unidades físicas que caem no recipiente, uma a uma, a partir de `em`
  unidades: {
    forma: "sache" | "cubo" | "moeda" | "comprimido";
    numero: number;
    em: number;
    rotulo?: string;
    rotuloEm?: number;
    detalhe?: string;
    detalheEm?: number;
    // o que vai impresso em cada unidade (sachê: topo, meio e base; moeda: meio)
    etiqueta?: { topo?: string; meio?: string; base?: string };
    // contador que soma a cada unidade que pousa (quantidade ÷ número de unidades)
    contador?: boolean;
    // mostra o número de unidades grande ao lado (padrão: true quando o número foi dito)
    numeroGrande?: boolean;
  };
  recipiente?: "copo" | "pote";
  // a linha de referência (recomendação, limite, meta): anel tracejado no recipiente + rótulo
  referencia?: {
    valor?: number;
    // altura da linha em unidades (padrão: numero × valor ÷ quantidade.valor; sem números, 70%)
    unidades?: number;
    em: number;
    rotulo: string;
    rotuloEm?: number;
    fonte?: string;
    fonteEm?: number;
    prefixo?: string;
    prefixoEm?: number;
    valorEm?: number;
    sufixo?: string;
  };
  // passou da linha: fica vermelho em `em`. `despejarEm`: lata ou garrafa despeja no copo antes.
  passou?: { em: number; despejarEm?: number; rotulo?: string };
  // selo no canto de cima ("conteúdo ilustrativo", "fonte: OMS"…)
  selo?: string;
  // modo ilustrativo: sem números ditos, as unidades e a linha são só a imagem da ideia
  ilustrativo?: boolean;
};

// O objeto sozinho: nasce no peito, gira até o rótulo, vai para o papel e ganha até 3 informações.
export type ObjetoMomento = Base & {
  tipo: "objeto";
  objeto: Objeto;
  palcoEm?: number;
  fatos: { texto: string; em: number; detalhe?: string }[];
  selo?: string;
};

// A virada: "E se eu fosse" + NOME acima da cabeça e, em `trocaEm`, a linha de luz desce pela tela.
// Com `videoVirada` no plano, ela troca a roupa ao vivo; sem ele, troca o enquadramento.
export type Virada = Base & { tipo: "virada"; texto?: string; nome: string; em?: number; nomeEm: number; trocaEm: number; cor?: string };

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
  | Medida
  | ObjetoMomento
  | Virada;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  // opcional: a mesma gravação com a roupa (ou o cenário) trocada por uma IA de vídeo, em public/
  videoVirada?: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  rosto: { x: number; y: number };
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // punch de corte, troca seca: { de, zoom } com zoom 1 ou 1.12 (na moldura vira 1,07)
  enquadramentos?: { de: number; zoom: number }[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // trilha do usuário (sem batida), em public/; volume 0..1 (padrão 0,12)
  trilha?: string;
  trilhaVolume?: number;
  maos?: Maos;
};
