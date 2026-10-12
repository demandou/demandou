// Formato do plano de edição do modelo Balcão. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: a fachada de uma loja de bairro. No alto, o TOLDO listrado com o letreiro (sempre lá);
// embaixo dele, a VITRINE de vidro, onde tudo acontece; depois o BALCÃO de madeira. Na versão
// deitada (16:9, 1920×1080), pela aula 9 do curso, a pessoa fala em tela cheia e, durante os blocos,
// vai para uma moldura à direita da vitrine, atrás do balcão; a fachada aparece em volta dela. Os
// campos do plano são os mesmos do vertical.
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md) e aqui ganham a linguagem da vitrine: letras pintadas no vidro, adesivos de
// preço, plaquinhas penduradas, carimbo, potes que enchem, cardápio e o balão de pedido.
// A assinatura é a `vitrine` (os produtos entram na vitrine com etiqueta adesiva), mais o `combo`
// (o carimbo da condição) e o `mapa` (o cartão de mapa com pino e a placa de horário).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, a vitrine mostra a fala)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// Ilustrações prontas (vetor) para produtos e serviços sem foto: modo ilustrativo da vitrine.
export type NomeIlustracao =
  | "pote"
  | "bolo"
  | "pao"
  | "cafe"
  | "hamburguer"
  | "pizza"
  | "sacola"
  | "camiseta"
  | "tesoura"
  | "haltere"
  | "pata"
  | "flor"
  | "presente"
  | "moeda"
  | "grafico"
  | "escudo"
  | "relogio"
  | "estrela";

// Uma plaquinha pendurada no toldo por dois fios (dia, horário, aviso curto): balança e assenta.
// `rotulo` = a linha pequena de cima (ex.: "ABERTO"); `texto` = a linha grande (ex.: "até 20h").
export type Placa = { texto: string; em: number; rotulo?: string; rotuloEm?: number };

// ——— a assinatura ———

// Um produto (ou serviço) da vitrine. Entra (é posto na prateleira) em `em`, a palavra que o nomeia.
// `imagem`: id de plano.imagens (PNG recortado fica em pé na prateleira; foto vira um quadrinho).
// Sem imagem: `ilustracao` (vetor) ou, sem nada, um cartão com o nome grande.
// `preco` + `precoEm`: o adesivo de preço deste item (só se o preço foi DITO).
export type Produto = {
  texto: string;
  em: number;
  imagem?: ImagemNoMomento;
  ilustracao?: NomeIlustracao;
  preco?: string;
  precoEm?: number;
};

// O preço de todos de uma vez ("doze reais cada"): o adesivo é colado em cada item, um logo depois
// do outro, a partir de `em`; `detalhe` ("cada", "o kg", "a partir de") entra em `detalheEm`.
export type PrecoUnico = { texto: string; em: number; detalhe?: string; detalheEm?: number };

// A vitrine: 1 a 4 produtos/serviços postos na prateleira, cada um com a etiqueta do nome na beira
// da prateleira e (opcional) o adesivo de preço. `titulo` = letras pintadas no alto do vidro.
// Logo depois de uma `abertura`, o título dela encolhe e vira o letreiro da vitrine (sem `titulo`).
export type Vitrine = Base & {
  tipo: "vitrine";
  titulo?: string;
  itens: Produto[];
  preco?: PrecoUnico;
};

// O combo: a condição carimbada. `texto` ("Leva 3") entra na fita kraft que amarra os itens da
// vitrine em `em`; `valor` ("paga 30") é o carimbo que bate em `valorEm`. Logo depois de uma
// `vitrine`, os itens dela se juntam e a fita os amarra; sozinho, a fita e o carimbo ficam no meio.
export type Combo = Base & {
  tipo: "combo";
  texto: string;
  em: number;
  valor?: string;
  valorEm?: number;
};

// O mapa: um cartão de mapa ilustrado (não é print) com ruas, quadras e uma praça. O endereço se
// escreve na etiqueta de baixo: `rua` em `em`, `numero` em `numeroEm` (o pino cai nessa palavra).
// `referencia` = linha pequena opcional ("perto da praça"), se foi dita. `horario` = a placa
// pendurada no toldo, por cima do canto do mapa.
export type Mapa = Base & {
  tipo: "mapa";
  rua: string;
  em: number;
  numero?: string;
  numeroEm?: number;
  referencia?: string;
  referenciaEm?: number;
  horario?: Placa;
};

// ——— os 11 blocos universais ———

// `placa` (opcional) = a plaquinha pendurada no toldo junto da abertura ("Toda quinta", "Hoje").
// `cena` (opcional, para o gancho do quadro 0) = o interior ilustrado da loja atrás das letras:
// `expositor` (a peça principal num prato com pé e cúpula), `itens` (até 4 ilustrações na
// prateleira) e `placa` (a plaquinha da parede, ex.: "Aberto"). As letras ficam no alto do vidro.
export type CenaDaLoja = { expositor?: NomeIlustracao; itens?: NomeIlustracao[]; placa?: string };
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; placa?: Placa; cena?: CenaDaLoja };
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
export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
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
// O fechamento é o balão de pedido: o texto se escreve palavra por palavra dentro do balão de
// conversa (genérico, sem marca de aplicativo); `destaque` = o trecho em tomate ("Encomenda").
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // true = os produtos da última vitrine aparecem pequenos dentro do balão (o "pedido")
  pedido?: boolean;
};

export type Momento =
  | Vitrine
  | Combo
  | Mapa
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
  | Cta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio no 16:9)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: Rosto;
  // faixa abaixo do queixo (o Balcão não usa: a legenda fica na área segura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: o cartão de apresentação nos primeiros segundos (vazio = sem): apoiado
  // no balcão com a pessoa na moldura, ou no canto de cima oposto ao rosto com ela em tela cheia
  marca: { nome: string; area: string };
  // o letreiro do toldo: o nome do negócio (ou do tema), que acende em `em` (a palavra dita). No
  // 16:9, se a palavra cai com a pessoa em tela cheia, ele desce quando a fachada aparece.
  // Sem `nome`, o toldo fica só com as listras.
  fachada?: { nome?: string; em?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
