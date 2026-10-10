// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Extrato: tudo o que a pessoa diz vira linha impressa num CUPOM de papel térmico,
// no ritmo da fala. Dois lugares para o papel:
// - o ROLO (tela dividida): um cupom só, comprido, que imprime e rola. A pessoa fica numa moldura
//   larga embaixo e o papel sai de trás dela e sobe (layout "cima", o padrão). Cada etapa começa
//   com a linha pontilhada de corte (✂).
// - a TIRA (quadro cheio): a pessoa em quadro cheio e um pedaço curto de cupom saindo do pé do
//   quadro, na altura do peito, alternando de lado. Para frases, números, destaques, perguntas.
// O exemplo do modelo usa o layout "lado" (o rolo de um lado e a pessoa num cartão do outro,
// trocando de lado a cada etapa), feito para uma gravação com a pessoa parada no centro.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // onde o momento aparece: "cheio" = tira de cupom com a pessoa em quadro cheio;
  // "dividido" = no rolo, com a pessoa na moldura. Cada tipo tem um padrão (references/plano.md).
  quadro?: "cheio" | "dividido";
};

export type Icone =
  | "xicara"
  | "tesoura"
  | "lapis"
  | "balao"
  | "calendario"
  | "carrinho"
  | "casa"
  | "celular"
  | "cartao"
  | "moeda"
  | "salvar"
  | "seguir"
  | "link"
  | "comentar"
  | "relogio"
  | "coracao"
  | "alerta"
  | "grafico";

// ---------- linhas do cupom (a assinatura: a conta; cada linha imprime no seu `em`) ----------

// "CAFÉ ............ R$ 8,00": um item com valor. O valor nasce a lápis ("R$ __,__") e é
// impresso em `valorEm`. `valor` em número sai formatado (moeda do plano ou `prefixo`/`sufixo`);
// negativo sai como desconto em magenta. `valor` em texto ("ALTO", "−", "3×") sai como está.
// Sem `valor`, a linha fica só com o nome e o pontilhado.
export type LinhaItem = {
  tipo: "item";
  em: number;
  texto: string;
  valor?: number | string;
  valorEm?: number;
  icone?: Icone;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
};

// Linha cinza pequena, de detalhe ("1× POR DIA", "TODO DIA")
export type LinhaNota = { tipo: "nota"; em: number; texto: string };

// Multiplicação/soma: "DIAS ÚTEIS ........ × 22" (o sinal em magenta). `fator` é texto livre,
// como foi dito ("22", "12", "1,15", "TODO DIA"). Com `fatorEm`, o fator espera a lápis.
export type LinhaVezes = { tipo: "vezes"; em: number; fator: string; fatorEm?: number; texto: string; sinal?: "×" | "+" | "−" | "÷" };

// Casas que se preenchem (o desenho da conta): "xicaras"/"moedas"/"pontos"/"casas" (uma casa por
// unidade) ou "degraus" (o acumulado). `ilustrativo`: a quantidade não foi dita (etiqueta visível).
export type LinhaGrade = {
  tipo: "grade";
  em: number;
  forma: "xicaras" | "pontos" | "moedas" | "casas" | "degraus";
  quantidade: number;
  colunas?: number;
  rotulos?: string[];
  encheDe: number;
  encheAte: number;
  ilustrativo?: boolean;
};

// O resultado da conta: rótulo pequeno ("= POR MÊS") e o valor grande, que conta de `contaDe` a
// `contaAte` (em `passos` degraus, ou suave). Sem número dito, `resultado` é o resultado em
// palavras ("PREJUÍZO", "ANSIEDADE"), impresso grande. `carimbo` bate por cima em `carimbo.em`.
export type LinhaTotal = {
  tipo: "total";
  em: number;
  texto: string;
  valor?: number;
  resultado?: string;
  passos?: number;
  contaDe?: number;
  contaAte?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  carimbo?: { texto: string; em: number };
};

// Frase impressa em letra grande, palavra por palavra no instante em que é dita. `grifo`: trecho
// que leva marca-texto magenta em `grifoEm`; `risco`: trecho riscado em magenta em `riscoEm`.
// `icone` desenha um ícone no fim da última linha, em `iconeEm`.
export type LinhaTexto = {
  tipo: "texto";
  em: number;
  texto: string;
  grifo?: string;
  grifoEm?: number;
  risco?: string;
  riscoEm?: number;
  icone?: Icone;
  iconeEm?: number;
};

// Campos em branco para quem assiste preencher ("SEG ...... R$ ____"), em rajada de `em` a `ate`.
// `moeda: false` tira o "R$" dos campos.
export type LinhaCampos = { tipo: "campos"; em: number; ate?: number; itens: string[]; titulo?: string; moeda?: boolean };

// Linha de corte extra (cada etapa do rolo já começa com uma). `riscaEm`: a tesoura leva um "não".
export type LinhaCorte = { tipo: "corte"; em: number; riscaEm?: number };

export type Linha = LinhaItem | LinhaNota | LinhaVezes | LinhaGrade | LinhaTotal | LinhaTexto | LinhaCampos | LinhaCorte;

// ---------- a assinatura ----------

// Conta: uma etapa da conta, no rolo (ou numa tira, com `quadro: "cheio"`). Cada conta do rolo
// começa com a linha de corte. `lado` (só no layout "lado") = de que lado fica o cupom.
export type Conta = Base & { tipo: "conta"; linhas: Linha[]; lado?: "esquerda" | "direita"; corte?: false | { riscaEm?: number } };

// Fechamento: como a conta, mas o cupom termina com o rodapé (nome, área e código de barras) em
// `rodapeEm` (padrão: logo depois da última palavra). Fica até o último quadro.
export type Fechamento = Base & {
  tipo: "fechamento";
  linhas: Linha[];
  lado?: "esquerda" | "direita";
  corte?: false | { riscaEm?: number };
  rodapeEm?: number;
};

// ---------- os 11 blocos universais (motor/BLOCOS.md) ----------

// abertura, frase, pergunta e cta aceitam `em`: o instante em que o TEXTO começa a ser dito.
// (`linhas` é o formato antigo da abertura: linhas de cupom em quadro cheio. Prefira `conta` com
// `quadro: "cheio"`.)
export type Abertura = Base & { tipo: "abertura"; texto?: string; destaque?: string; em?: number; linhas?: Linha[] };

export type Item = { texto: string; em: number; detalhe?: string };
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

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

export type Dado = { rotulo: string; valor: number; em: number };
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: Dado[];
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

export type Momento =
  | Abertura
  | Conta
  | Fechamento
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Cta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = gravação horizontal em 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // abaixo do queixo (px): a tira e a legenda do quadro cheio respeitam `zona.topo`
  zona?: { topo: number; altura: number };
  // nome e área: impressos no cabeçalho e no rodapé do cupom
  marca: { nome: string; area: string };
  // o título do cupom ("CONTA DO CAFÉ"), impresso no cabeçalho
  cabecalho?: string;
  // moeda dos valores em número (padrão "R$"; "US$", "€"…; "" = sem moeda)
  moeda?: string;
  // "cima" (padrão): pessoa na moldura larga embaixo e o rolo em cima, saindo de trás dela.
  // "lado": o rolo de um lado e a pessoa num cartão do outro (o layout do exemplo do modelo).
  layout?: "cima" | "lado";
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
