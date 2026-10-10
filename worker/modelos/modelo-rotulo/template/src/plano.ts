// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O modelo Rótulo é um estilo, não um assunto: o rótulo é a "ficha técnica" do que o vídeo
// explica (um ativo, um hábito, uma lembrança, um produto), e a lupa lê os campos dele.

// ---------- o rótulo ----------

// Um campo livre do rótulo: `nome` em caixa alta pequena (opcional) e o `valor` impresso.
export type CampoDoRotulo = { nome?: string; valor: string };

// O rótulo fictício que ocupa a tela (nunca uma marca real).
//   [campo 1]   ( camafeu )   [campo 2]
//   [campo 3]   (         )   [campo 4]
//              NOME (grande)
//          ────────── ◆ ──────────
//              LINHA LARGA
export type Rotulo = {
  // o nome grande logo abaixo do camafeu (o tema, o ativo, o produto, o título da lembrança)
  nome: string;
  // a linha larga em caixa alta embaixo do nome (ex.: "Mercado · Riscos · Ativos"); a lupa anda por ela
  linha?: string;
  // até 4 campos em volta do camafeu, nesta ordem: alto à esquerda, alto à direita, baixo à esquerda
  // (itálico na cor de destaque), baixo à direita (caixa alta). Menos de 4: as vagas viram ornamento.
  campos?: CampoDoRotulo[];
  // letras miúdas do pé (abaixo da interface do app; só enfeitam): a linha acima da marca
  pe?: string;
  volume?: string;
  // ---- formato de bebida (o do exemplo do sommelier): continua valendo quando não há `campos` ----
  categoria?: string;
  destaque?: string;
  origem?: string;
  ano?: string;
  anoRotulo?: string;
  teor?: string;
};

// As seis vagas do rótulo onde a lupa pode parar
export type Vaga = "nome" | "linha" | "c1" | "c2" | "c3" | "c4";

// Onde a lupa lê: o nome do campo ("Preço"), o número do campo (1 a 4), "nome", "linha" ou um trecho
// da linha larga. Os nomes antigos ("origem", "ano", "teor", "destaque", "categoria") também valem.
export type Alvo = string | number;

// Uma palavra (ou trecho) dita num instante
export type Dito = { em: number; texto: string };

// Campos que todo momento aceita
type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // onde fica a pessoa: "cheia" (quadro cheio, ficha no peito) ou "camafeu" (o rótulo ocupa a tela)
  pessoa?: "cheia" | "camafeu";
  // o campo do rótulo que a lupa lê neste momento (padrão: o campo que combina com o texto)
  alvo?: Alvo;
  // pedaço do campo (ou da linha larga) onde a lupa para
  trecho?: string;
};

// Item de lista: entra quando é dito. `alvo`/`trecho` (opcionais) fazem a lupa andar até ele.
export type Item = { texto: string; em: number; detalhe?: string; alvo?: Alvo; trecho?: string };

// ---------- os 11 blocos universais (motor/BLOCOS.md) ----------

// Abertura: pessoa em quadro cheio; a ficha na altura do peito com o título, palavra por palavra.
export type Abertura = Base & {
  tipo: "abertura";
  // o título (palavras da fala); quebra sozinho em até 3 linhas
  texto?: string;
  // ou as linhas já quebradas (até 3 linhas, ~17 caracteres)
  linhas?: string[];
  // trecho exato do título em itálico na cor de destaque
  destaque?: string;
  // o instante em que o título começa a ser dito (padrão: `de`)
  em?: number;
  // caixa alta acima do título (padrão "Ficha técnica")
  rotulo?: string;
  // um número do título ganha um mostrador com marcas que se acendem (ex.: "10" de "10 segundos")
  selo?: { em: number; valor: string; marcas?: number };
};

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

export type Numero = Base & {
  tipo: "numero";
  titulo?: string;
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
};

export type Lado = { rotulo: string; texto: string; em: number; alvo?: Alvo; trecho?: string };
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
  // números DITOS (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma qualitativa, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

export type Destaque = Base & {
  tipo: "destaque";
  titulo?: string;
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Definicao = Base & { tipo: "definicao"; titulo?: string; termo: string; em: number; significado: string; significadoEm: number };

// `em` (opcional, em frase/pergunta): o instante em que o texto começa a ser dito (padrão: `de`)
export type Frase = Base & { tipo: "frase"; titulo?: string; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// opcoes: 2 a 4
export type Pergunta = Base & { tipo: "pergunta"; titulo?: string; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a pessoa volta ao quadro cheio; a ficha no peito com a chamada.
export type Cta = Base & {
  tipo: "cta";
  // a chamada (palavras da fala); quebra sozinha em até 3 linhas
  texto?: string;
  // ou as linhas já quebradas (1 a 3)
  linhas?: string[];
  destaque?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // o instante em que a chamada começa a ser dita; o ícone age nele (padrão: a primeira palavra)
  em?: number;
};

// ---------- a assinatura: a lupa lê um campo do rótulo ----------

// Campo: a lupa para num campo do rótulo e a ficha mostra o valor grande e até 2 frases de apoio.
export type CampoMomento = Base & {
  tipo: "campo";
  // cabeçalho da ficha (padrão: o nome do campo)
  titulo?: string;
  // o valor grande (padrão: o valor do campo no rótulo, na primeira palavra do momento)
  valor?: Dito;
  // até 2 frases da fala, em itálico
  linhas?: Dito[];
};

// Medidor: qualquer escala (risco, intensidade, dificuldade, saudade…). O valor se escreve, o
// medidor enche até `nivel` e o ponteiro do mostrador gira junto.
export type MedidorMomento = Base & {
  tipo: "medidor";
  titulo?: string;
  // a palavra ou o número que a pessoa diz (ex.: "Alto", "7 de 10")
  valor?: Dito;
  // quando o medidor ganha tinta
  em: number;
  // as pontas da escala (ex.: ["baixo", "alto"])
  pontas: [string, string];
  // até onde enche (0 a 1)
  nivel: number;
  // quando enche (a palavra que dá o sentido)
  cheioEm: number;
  nota?: Dito & { destaque?: string };
  // o nível não foi dito em número: mostra a etiqueta "ilustrativo"
  ilustrativo?: boolean;
  // no lugar do mostrador, a taça que se enche (para bebidas)
  taca?: { em: number; liquido?: "tinto" | "rose" | "branco" | "cerveja" | "cafe" };
};

// ---------- tipos do exemplo de bebida (continuam valendo) ----------

// Origem: a lupa passa pela linha larga; mapinha do país com o ponto da região (serve para qualquer lugar).
export type Origem = Base & {
  tipo: "origem";
  titulo?: string;
  pais: Dito & {
    // chave do contorno em src/mapas.ts (ex.: "argentina", "franca"); sem ele, só a rosa dos ventos
    mapa?: string;
    // trecho da linha larga onde a lupa para (padrão: o próprio texto)
    trecho?: string;
  };
  regiao?: Dito & { lat?: number; lon?: number; trecho?: string };
  nota?: Dito & { destaque?: string };
};

// Variedade: a lupa no campo 3; um desenho a traço se desenha; os exemplos ditos entram.
export type Desenho = "cacho" | "lupulo" | "grao" | "espiga";
export type Variedade = Base & {
  tipo: "variedade";
  titulo?: string;
  em: number;
  desenho?: Desenho;
  itens: Dito[];
  conector?: string;
  noRotulo?: number;
};

// Ano: a lupa no campo 1; o número rola; uma régua de anos marca o ano.
export type Ano = Base & {
  tipo: "ano";
  titulo?: string;
  em: number;
  // o ano (padrão: `rotulo.ano`, ou o valor do campo 1)
  valor?: string;
  nota?: Dito & { destaque?: string };
  marcaEm?: number;
};

// Teor: a lupa no campo 2; o número conta; o medidor de corpo enche; a taça se enche de cor.
export type Teor = Base & {
  tipo: "teor";
  titulo?: string;
  em: number;
  valor?: number;
  unidade?: string;
  subida?: Dito;
  medidor: { em: number; de: string; ate: string; nivel: number; cheioEm: number };
  taca?: { em: number; liquido?: "tinto" | "rose" | "branco" | "cerveja" | "cafe" };
};

// Nota: o mesmo que `campo` (nome antigo).
export type Nota = Base & {
  tipo: "nota";
  titulo?: string;
  valor?: Dito;
  linhas?: Dito[];
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
  | CampoMomento
  | MedidorMomento
  | Origem
  | Variedade
  | Ano
  | Teor
  | Nota;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (px, quadro 1080×1920): a ficha começa logo abaixo do topo dela
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  rotulo: Rotulo;
  // ajuste da pessoa dentro do camafeu (zoom maior aproxima o rosto; ancoraY sobe/desce o rosto)
  camafeu?: { zoom?: number; ancoraY?: number };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
