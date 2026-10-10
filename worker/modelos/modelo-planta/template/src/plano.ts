import type { Rosto } from "./motor/caixa";

// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
// Todas as medidas de desenho (ambiente, objetos, cotas) são em CENTÍMETROS reais.

// Onde a pessoa fica durante o momento:
// "cheio"    = vídeo em tela cheia, cartão de papel na altura do peito
// "dividida" = pessoa numa faixa larga em cima, prancha subindo por baixo
// "cheia"    = prancha ocupa a tela, pessoa numa janelinha no canto (o momento mais rico)
// "lateral"  = só para planos antigos (pessoa numa coluna estreita à esquerda): não use em vídeos novos
export type Layout = "cheio" | "dividida" | "cheia" | "lateral";

export type Lado = "cima" | "baixo" | "esquerda" | "direita";

// Biblioteca de desenhos. Em planta (vista de cima) e em elevação (vista de frente).
export type TipoObjeto =
  | "sofa"
  | "poltrona"
  | "mesaCentro"
  | "mesa"
  | "mesaRedonda"
  | "cadeira"
  | "cama"
  | "criado"
  | "armario"
  | "estante"
  | "rack"
  | "tv"
  | "aparador"
  | "tapete"
  | "luminaria"
  | "pendente"
  | "vaso"
  | "cortina"
  | "bancada"
  | "janela"
  | "porta"
  | "quadro";

// Uma mudança animada: o objeto vai para outra posição e/ou tamanho (afastar o sofá, crescer o tapete)
export type Mudanca = { em: number; x?: number; y?: number; w?: number; h?: number; dur?: number };

export type Objeto = {
  tipo: TipoObjeto;
  // quando o desenho do objeto começa (fica visível até o fim do momento)
  em: number;
  // PLANTA: canto superior esquerdo, em cm, a partir do canto interno superior esquerdo do ambiente.
  // ELEVAÇÃO: x a partir da esquerda da parede; y = altura da BASE do objeto a partir do chão.
  x: number;
  y: number;
  // tamanho em cm (na planta: largura × profundidade já na posição em que está); padrão por tipo
  w?: number;
  h?: number;
  // PLANTA: para onde fica a frente do móvel (sofá encostado na parede de cima → "baixo")
  frente?: Lado;
  rotulo?: string;
  // fica na cor de acento a partir deste tempo (ou sempre, com true)
  destaque?: number | boolean;
  muda?: Mudanca | Mudanca[];
  // cota automática do objeto até a parede daquele lado (acompanha o objeto quando ele se move)
  cota?: { lado: Lado; em?: number; texto?: string; numero?: boolean };
  // PLANTA: desenha os pés; os da frente acendem neste tempo (regra do tapete)
  pes?: number;
  // marcador numerado (①) no objeto: no centro (padrão) ou fora dele, de um lado
  marca?: { n: number | string; em: number; lado?: Lado | "centro" };
  // ELEVAÇÃO, só cortina: quando ela sobe até o teto / desce até o chão
  tetoEm?: number;
  chaoEm?: number;
};

export type Vao = { parede: Lado; pos: number; largura: number; dobradica?: "inicio" | "fim" };

export type Ambiente = {
  // PLANTA: largura × profundidade internas. ELEVAÇÃO: largura da parede × pé-direito (altura)
  largura: number;
  profundidade?: number;
  altura?: number;
  portas?: Vao[];
  janelas?: Vao[];
  // espessura da parede em cm (padrão 15)
  parede?: number;
};

export type Circulacao = { em: number; pontos: [number, number][]; bloqueada?: boolean; dur?: number };
export type Area = { em: number; x: number; y: number; w: number; h: number; texto?: string };
export type CotaSolta = {
  em: number;
  de: [number, number];
  ate: [number, number];
  texto?: string;
  valor?: number;
  unidade?: string;
};
export type Nivel = { em: number; y: number; texto: string };

export type Cena = {
  vista?: "planta" | "elevacao";
  ambiente: Ambiente;
  objetos: Objeto[];
  // percurso tracejado (fluxo de circulação), pontos em cm dentro do ambiente
  circulacao?: Circulacao;
  // área hachurada com rótulo ("espaço livre", "área gourmet")
  areas?: Area[];
  // cotas soltas entre dois pontos (horizontais ou verticais)
  cotas?: CotaSolta[];
  // ELEVAÇÃO: marcas de nível (TETO, CHÃO, BANCADA…) na altura y (cm a partir do chão)
  niveis?: Nivel[];
  // quando as paredes começam a se desenhar (padrão: início do momento)
  paredesEm?: number;
  // escala escrita embaixo do desenho, à direita ("1:50")
  escala?: string;
};

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o layout padrão do componente
  layout?: Layout;
};

// ================= OS 11 BLOCOS UNIVERSAIS (motor/BLOCOS.md), no traço da prancheta =================
// `em` / `…Em` = instante (s) em que a palavra é dita. abertura, frase, pergunta e cta aceitam `em`:
// o instante em que o TEXTO começa a ser dito (padrão: `de`).

// Abertura: carimbo de prancha no peito; o texto se monta palavra por palavra e uma cota se desenha embaixo
export type AberturaBloco = Base & {
  tipo: "abertura";
  texto: string;
  // trecho exato em terracota
  destaque?: string;
  em?: number;
  // (deste modelo) o tema em 2–3 palavras, em caixa alta técnica, acima do texto
  rotulo?: string;
  // (deste modelo) a cota embaixo encolhe ou cresce na palavra certa
  cota?: { texto?: string; em?: number; efeito?: "encolhe" | "cresce" };
};

export type Item = { texto: string; em: number; detalhe?: string; icone?: Icone };

// Tópicos: notas da prancha (marcador quadrado que acende, um nível ▷ que anda até o item da vez)
export type Topicos = Base & { tipo: "topicos"; titulo?: string; numero?: string; subtitulo?: string; itens: Item[] };

// Passos: a circulação tracejada liga os círculos numerados e chega em cada passo quando ele é dito
export type Passos = Base & {
  tipo: "passos";
  numero?: string;
  titulo?: string;
  // (deste modelo) complemento do título, com palavras da fala
  subtitulo?: string;
  itens: Item[];
};

// Número: o número conta e a cota cresce embaixo dele
export type NumeroBloco = Base & {
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

export type LadoComparacao = { rotulo: string; texto: string; em: number };

// Comparação: duas vistas lado a lado, cada uma acende no seu `em`; o lado que perde é riscado
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoComparacao, LadoComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico em elevação: barras = prédios que sobem do chão com nível ▽; linha = corte de terreno;
// pizza = planta circular dividida; sem números = escada/rampa ilustrativa
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

// Destaque: no peito; "alerta" = terracota com área hachurada e ×; "chave" = cota medindo a palavra
export type DestaqueBloco = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: o termo com a cota em cima; a linha de chamada leva ao significado
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: no peito, palavra por palavra; `risco` é riscado em terracota quando é dito
export type FraseBloco = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: "?" no círculo de chamada; as opções entram como etiquetas
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento em carimbo de prancha (autor e área vêm de `marca`)
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "seguir" | "salvar" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // (deste modelo) complemento curto em cinza
  detalhe?: string;
};

// ================= TIPOS PRÓPRIOS (a assinatura) =================

// Título do demo (linhas fixas). Para vídeos novos, use `abertura`.
export type Titulo = Base & {
  tipo: "titulo";
  rotulo?: string;
  // o título, com as palavras NA ORDEM EM QUE SÃO FALADAS (cada uma entra quando é dita). Até 3 linhas.
  linhas: string[];
  // trecho exato que fica na cor de acento
  enfase?: string;
  // cota desenhada sob o título; `efeito` acontece em `em` (a sala "encolhe" ou "cresce")
  cota?: { texto?: string; em?: number; efeito?: "encolhe" | "cresce" };
};

// Um cômodo da planta livre: uma ideia por cômodo
export type Comodo = { texto: string; em: number; detalhe?: string; alerta?: boolean };

// A ASSINATURA. Dois modos:
// - planta livre (qualquer assunto): `comodos` (2 a 5). A planta se desenha, cada cômodo recebe a sua
//   ideia quando é dita e a circulação tracejada anda de cômodo em cômodo; `percurso.bloqueado` termina num ×.
// - desenho técnico (espaços de verdade): `ambiente` + `objetos` em centímetros.
export type Planta = Base &
  Partial<Cena> & {
    tipo: "planta";
    numero?: string;
    // título da prancha, com palavras faladas (entram quando são ditas)
    titulo?: string;
    subtitulo?: string;
    comodos?: Comodo[];
    percurso?: { bloqueado?: boolean; bloqueioEm?: number };
  };

export type Medida = Base & {
  tipo: "medida";
  numero?: string;
  rotulo?: string;
  valor: number;
  unidade: string;
  // casas decimais do número (2,7 m → 1)
  casas?: number;
  // contagem de 0 até o valor, entre `em` e `emFim`
  em?: number;
  emFim?: number;
  // de onde a medida parte (desenhado no detalhe ao lado do número): parede (vista de cima),
  // chão ou teto (vista de frente). Sem `desde` e sem `objeto`, vira só o número com uma cota embaixo.
  desde?: "parede" | "chao" | "teto";
  objeto?: TipoObjeto;
  // o objeto se afasta enquanto o número conta (afastar o sofá, subir o quadro); false = fica parado
  mover?: boolean;
};

export type Icone = TipoObjeto | "trena" | "nivel" | "lapis" | "rolo" | "lampada" | "tomada" | "esquadro" | "check";

export type LadoComparado = {
  rotulo?: string;
  // com `objetos`, desenha uma planta; sem, mostra `texto`
  objetos?: Objeto[];
  texto?: string;
  circulacao?: Circulacao;
  areas?: Area[];
};

export type AntesDepois = Base & {
  tipo: "antesDepois";
  ambiente?: Ambiente;
  vista?: "planta" | "elevacao";
  antes: LadoComparado;
  // quando o lado DEPOIS acende
  depois: LadoComparado & { em: number };
  // até 3 etiquetas curtas embaixo ("3 ajustes", "0 reforma"), cada uma no seu tempo
  resumo?: { em: number; texto: string }[];
};

export type Momento =
  | AberturaBloco
  | Topicos
  | Passos
  | NumeroBloco
  | Comparacao
  | Grafico
  | DestaqueBloco
  | Definicao
  | FraseBloco
  | Pergunta
  | Cta
  | Titulo
  | Planta
  | Medida
  | AntesDepois;

export type TipoMomento = Momento["tipo"];

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
  rosto: Rosto;
  // faixa dos cartões em tela cheia (px, no quadro 1080×1920): abaixo do queixo
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
