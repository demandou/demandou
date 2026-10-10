// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo: ficha (de registro, com carimbo), linha (do tempo) e pessoas (fichas
// ligadas por fio vermelho). Também são dele: credito, local, escala e camadas.

// Onde a pessoa fica durante o momento:
// "cheio"    = vídeo em tela cheia (o presente); supers de documentário na altura do peito
// "base"     = a pessoa vira uma foto impressa larga embaixo; o documento ocupa a parte de cima
// "topo"     = foto impressa em cima; o documento ocupa a metade de baixo
// "canto"    = foto pequena presa no canto de cima; o documento ocupa a folha inteira
// "esquerda" / "direita" = foto numa coluna ao lado (só do demo antigo; evite: a pessoa sai do quadro)
export type Layout = "cheio" | "base" | "esquerda" | "direita" | "topo" | "canto";

// Um texto que entra (é datilografado) num instante
export type Texto = { em: number; texto: string };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o layout padrão do componente
  layout?: Layout;
};

// Crédito de documentário que se datilografa: um lugar, um nome ou um tema grande e, embaixo,
// uma linha em partes (data, valor, ano), cada parte no instante em que é dita.
export type Credito = Base & {
  tipo: "credito";
  // rótulo pré-impresso, pequeno ("Local e data", "Mercado", "Caso")
  rotulo?: string;
  lugar: Texto;
  // partes da linha de baixo, cada uma no instante em que é dita ("12", "10", "1931")
  data?: Texto[];
  // o que une as partes (padrão "."; use " · " para partes que não são data)
  separador?: string;
  // linha extra datilografada embaixo (coordenadas, um complemento curto)
  detalhe?: Texto;
};

export type Carimbo = { em: number; texto: string; detalhe?: string };

export type Coordenadas = { em: number; local: string; lat: string; lon: string };

// Ficha de registro: um formulário pré-impresso cujos campos são datilografados quando ditos.
// Serve para registrar qualquer coisa: um objeto, um caso, um produto, um sintoma, um ativo.
export type Ficha = Base & {
  tipo: "ficha";
  // cabeçalho pré-impresso (padrão "Ficha de registro")
  cabecalho?: string;
  // o que está sendo registrado; `rotulo` é o nome do campo (padrão "Registro")
  titulo: Texto & { rotulo?: string };
  // 0 a 3 campos (rótulo pré-impresso + valor dito)
  campos?: { em: number; rotulo: string; valor: string }[];
  carimbo?: Carimbo;
  coordenadas?: Coordenadas;
};

// Cartão de coordenadas sozinho: lugar, latitude/longitude e a mira que se desenha
export type Local = Base & {
  tipo: "local";
  rotulo?: string;
  coordenadas: Coordenadas;
  // linha datilografada embaixo (o que tem ali, por que importa)
  detalhe?: Texto;
};

// Escala: régua de perícia que mede algo por partes (de baixo para cima)
export type Escala = Base & {
  tipo: "escala";
  rotulo?: string;
  unidade: string;
  // "estatua": figura de braços abertos sobre pedestal (2 partes: pedestal e figura)
  // "torre": torre que afina para o alto; "blocos": blocos empilhados (qualquer coisa)
  desenho?: "estatua" | "torre" | "blocos";
  // partes DE BAIXO PARA CIMA; cada uma é medida quando é dita
  partes: { em: number; valor: number; rotulo: string }[];
};

export type Material = "concreto" | "tijolo" | "mosaico" | "pedra";

// Camadas: o que tem por dentro e o que tem por fora (corte de material)
// Serve como metáfora para qualquer "o que se vê × o que tem por baixo" (aparência × base).
export type Camadas = Base & {
  tipo: "camadas";
  dentro: { em: number; titulo: string; material: Material; nome: string; nomeEm: number };
  // a camada de fora se espalha por cima da de dentro entre `em` e `cobreAte`
  fora: { em: number; titulo: string; material: Material; nome: string; nomeEm: number; cobreAte?: number };
  // uma peça que entra por último, marcada em vermelho ("colocados à mão")
  destaque?: Texto;
};

// Fichas de pessoas (ou de "personagens": o investidor, o mercado, o paciente) ligadas por um fio
// vermelho: quem fez o quê, quem depende de quem.
export type Pessoas = Base & {
  tipo: "pessoas";
  // rótulo vermelho acima do título (padrão "Dossiê")
  rotulo?: string;
  // título com palavras faladas, na ordem em que são ditas (cada uma bate quando é dita)
  titulo?: string;
  pessoas: { em: number; papel: string; nome: string; nomeEm?: number; detalhe?: string; detalheEm?: number }[];
  // rótulo pré-impresso acima do nome (padrão "Nome"; para um papel ou personagem: "Haja como", "Quem")
  rotuloNome?: string;
  // quando o fio vermelho liga a primeira ficha à segunda
  ligacao?: { em: number };
};

// Linha do tempo: a régua corre de um ano ao outro; a imagem volta a ter cor se sair do passado.
// Sem anos ditos, cada marco é só texto ("Compra", "Queda", "Prejuízo"): a régua anda por igual
// de um marco ao outro e o nome do marco aparece grande no lugar do ano.
export type Linha = Base & {
  tipo: "linha";
  // de 2 a 4 marcos, em ordem; a régua corre até cada um no seu `em`
  marcos: { em: number; ano?: number; texto?: string }[];
  // frase com palavras faladas (cada uma bate quando é dita)
  manchete?: string;
  enfase?: string;
  carimbo?: Carimbo;
};

// ——— os 11 blocos universais (motor/BLOCOS.md), na linguagem do Arquivo ———

export type Item = { texto: string; em: number; detalhe?: string };

// Título de documentário na altura do peito, datilografado palavra por palavra; `destaque` = tarja vermelha
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

// Relatório: formulário com linhas numeradas; cada item é datilografado na sua linha quando é dito
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Fichas presas com tachinhas, ligadas em ordem por um fio vermelho que se estica a cada passo dito
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número de registro que conta sobre uma régua de documentário (o ponteiro vermelho fica parado)
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

// Dois documentos lado a lado; o vencedor ganha um círculo vermelho e o outro é riscado
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico impresso em papel quadriculado: barras hachuradas, linha a tinta, pizza em fatias.
// Sem números ditos: `tendencia` (uma curva a tinta) com o carimbo ILUSTRATIVO.
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

// Palavra ou frase curta que bate forte: carimbada numa tira de papel (alerta = carimbo vermelho)
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Ficha catalográfica: o termo datilografado em cima, o significado nas linhas pautadas
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Citação datilografada palavra por palavra sobre a imagem; `risco` = trecho rasurado em vermelho
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta datilografada sobre a imagem; `opcoes` = tiras de papel com uma caixinha de marcar
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: assinatura de documentário (nome e área) + a chamada datilografada numa tira de papel
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  // quando a chamada começa a ser datilografada (padrão: logo depois da assinatura); `textoEm` é o nome antigo
  em?: number;
  textoEm?: number;
  icone?: "seguir" | "salvar" | "comentar" | "link";
  // trecho da chamada que ganha o sublinhado vermelho
  destaque?: string;
};

export type Momento =
  | Credito
  | Ficha
  | Local
  | Escala
  | Camadas
  | Pessoas
  | Linha
  | Cta
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | Frase
  | Pergunta;

export type TipoDeMomento = Momento["tipo"];

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
  // faixa dos supers em tela cheia (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // assunto do vídeo, no cabeçalho das folhas ("Arquivo · Cristo Redentor")
  assunto?: string;
  // trechos em que a imagem da pessoa vira arquivo (preto e branco, grão, foto antiga).
  // Sem este campo: vira arquivo durante os momentos em folha (fora da tela cheia).
  passado?: { de: number; ate: number }[];
  cortesEm?: number[];
  // ajuste fino do enquadramento da pessoa em cada layout (zoom, ancoraY); raramente necessário
  caixas?: Partial<Record<Layout, { zoom?: number; ancoraY?: number }>>;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
