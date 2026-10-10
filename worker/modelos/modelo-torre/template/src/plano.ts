// Formato do plano de edição do modelo Torre. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: um lançamento imobiliário à noite em 3D. No começo, a pessoa numa moldura grande com o
// título por cima da cabeça (a "ponte"); na virada, uma linha de luz desce pela moldura (troca a roupa
// quando existe o vídeo trocado). Depois a moldura desce para a metade de baixo e o mundo 3D ocupa a de
// cima: a cidade à noite, a torre que sobe andar por andar, o mapa com a rota dourada, o mergulho na
// planta humanizada e a etiqueta de preço que bate na palavra.
//
// A assinatura: `torre` (o número que vira andares), `rota` (o mapa traça o caminho), `planta` (os
// cômodos ditos acendem) e `preco` (a etiqueta dourada). Os 11 blocos universais (abertura, topicos,
// passos, numero, comparacao, grafico, destaque, definicao, frase, pergunta, cta) têm os mesmos campos
// em todos os modelos do pack (references/plano.md) e aqui ganham a linguagem noturna do lançamento.
import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (no exemplo, todos os momentos têm legenda)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— a assinatura ———

// A torre: o número dito vira andares. Os andares pousam um a um entre `em` e `ateEm`, e o contador da
// coluna da esquerda conta junto (01 → 18). `nome`/`categoria` = o letreiro do empreendimento, que nasce
// grande por cima e vira o cabeçalho do canto. `local` = o bairro com o pino. `andarDestaque` acende um
// andar em dourado (a sala no 12º, a cobertura). Modo ilustrativo (qualquer assunto): `valor` é o número
// do assunto (83 mil dólares → valor 83, sufixo "mil", rotulo "dólares") e `andares` diz quantos
// andares desenhar (padrão: o próprio valor, entre 4 e 30).
export type Torre = Base & {
  tipo: "torre";
  valor: number;
  em: number;
  ateEm?: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  andares?: number;
  nome?: string;
  nomeEm?: number;
  categoria?: string;
  categoriaEm?: number;
  emblema?: "sol" | "folha" | "onda" | "estrela" | "nenhum";
  local?: string;
  localEm?: number;
  selo?: string;
  fachada?: "residencial" | "comercial";
  andarDestaque?: { andar: number; em: number; texto?: string };
  ilustrativo?: boolean;
};

// O mapa: a cidade baixa e vira um mapa em relevo; o pino cai no prédio em `pinoEm`; a rota dourada sai
// da portaria e chega no destino em `destino.em`. `tempo` (4 min) + `modo` ("a pé") na coluna da
// esquerda. `paradas` = pontos no caminho, cada um acende quando é dito (é o `passos` do mapa).
// `ruas` = até 2 nomes de rua deitados no mapa (só se foram ditos ou se o usuário pediu).
export type IconeDestino = "metro" | "onibus" | "escola" | "parque" | "mercado" | "praia" | "hospital" | "shopping" | "pino";
export type Rota = Base & {
  tipo: "rota";
  em: number;
  pinoEm?: number;
  titulo?: string;
  tempo?: { valor: number; unidade?: string; em: number; unidadeEm?: number };
  modo?: "a pé" | "de carro" | "de bicicleta" | "de ônibus";
  modoEm?: number;
  destino: { texto: string; em: number; rotulo?: string; icone?: IconeDestino };
  paradas?: Item[];
  ruas?: string[];
  ilustrativo?: boolean;
};

// A planta humanizada: mergulho do alto (em `em`) para a planta 3D mobiliada. O traço de arquiteto se
// desenha, as paredes sobem enquanto a área conta (`area`), os móveis pousam e os cômodos ditos acendem
// com a etiqueta (nome + m², se o m² foi dito). `forma`: apartamento (o exemplo), casa (com quintal e
// piscina), sala (sala comercial: mesas e sala de reunião) ou terreno (o lote com as medidas).
export type NomeComodo =
  | "suite"
  | "quarto"
  | "sala"
  | "cozinha"
  | "varanda"
  | "banheiro"
  | "escritorio"
  | "reuniao"
  | "recepcao"
  | "copa"
  | "quintal"
  | "piscina"
  | "garagem"
  | "frente"
  | "fundos";
export type Comodo = { texto: string; em: number; comodo?: NomeComodo; m2?: number; quantidade?: number };
export type Planta = Base & {
  tipo: "planta";
  em: number;
  rotulo?: string;
  forma?: "apartamento" | "casa" | "sala" | "terreno";
  area?: { valor: number; em: number; ateEm?: number; unidade?: string; unidadeEm?: number };
  comodos?: Comodo[];
  ilustrativo?: boolean;
};

// A etiqueta de preço: desce presa por um fio e bate em `em`; o valor conta até cada pedaço dito
// (`partes`: "um milhão" → 1.000.000 em "milhão"; "e cem" → 1.100.000 em "cem"). `rotulo` = "a partir de";
// `nota` = linha pequena ("imóvel ilustrativo", "condições de lançamento").
export type Preco = Base & {
  tipo: "preco";
  valor: number;
  em: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  rotulo?: string;
  rotuloEm?: number;
  partes?: { valor: number; em: number }[];
  nota?: string;
  notaEm?: number;
  ilustrativo?: boolean;
};

// ——— os 11 blocos universais ———
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };
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
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
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

export type Momento =
  | Torre
  | Rota
  | Planta
  | Preco
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

// A virada (opcional, uma vez): a linha de luz desce pela moldura em `em`.
// - `video`: a MESMA gravação com a roupa (ou o cenário) trocada por uma IA de vídeo, posta em public/
//   (mesmo corte, mesma duração). Depois da linha, a pessoa aparece com a roupa nova; a voz continua
//   vindo do vídeo principal.
// - `antes`: o contrário (quando o vídeo principal já tem a troca dentro): a camada "antes" fica por cima
//   até a linha passar.
// - Sem nenhum dos dois: a virada acende a cidade (antes dela o mundo fica apagado) e a moldura ganha o
//   filete dourado. A pessoa não muda.
export type Virada = { em: number; video?: string; antes?: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  rosto: Rosto;
  // a Torre não usa a zona (a pessoa fica sempre numa moldura)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: tarja na moldura nos primeiros segundos (vazio = sem tarja)
  marca: { nome: string; area: string };
  virada?: Virada;
  // "queixo" (padrão: abaixo do queixo, dentro da moldura) ou "costura" (logo acima da moldura de
  // baixo, como no exemplo; bom para anúncio, em que o botão da plataforma cobre a parte de baixo)
  posicaoLegenda?: "queixo" | "costura";
  // música do usuário (arquivo em public/), sem batida, bem baixa; opcional
  trilha?: { arquivo: string; volume?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
