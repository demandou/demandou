// Formato do plano de edição do modelo Guia. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Guia: o apresentador é um RECORTE SEM FUNDO (a metade de baixo da tela, cabeça entre
// 50% e 70% da altura, ombros cortados pela borda) sobre uma "tela" clara de conteúdo que troca a cada
// 3 a 6 s com corte seco. A tela é um infográfico-mapa (com zoom na etapa citada), um print com seta
// vermelha no botão, uma lista de arquivos em pílulas pretas, um número, um diagrama, uma pergunta.
// O recorte muda de lugar (direita, esquerda, centro, encolhido no topo, colado na borda) para nunca
// cobrir o texto-chave. Sem legenda.
//
// A assinatura são DOIS tipos: `mapa` (o infográfico-estrada com placas numeradas; o zoom é um
// momento `mapa` com `foco`) e `print` (a captura real com seta vermelha). Os 11 blocos universais
// têm os mesmos campos em todos os modelos do pack (references/plano.md).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Onde o recorte da pessoa fica na tela.
//  dir / esq / centro: meio corpo grande na metade de baixo, rosto a ~58% da altura
//  canto: menor, canto de baixo à direita (o mapa inteiro do primeiro quadro)
//  topo: encolhida no alto, a tela de conteúdo (que a cobre pela cintura) ocupa a parte de baixo
//  borda: grande, inclinada, colada na borda direita (cabeça parcialmente fora do quadro)
export type PoseNome = "dir" | "esq" | "centro" | "canto" | "topo" | "borda";
// Uma troca de pose dentro do mesmo momento (a pessoa "pula" de lugar, a tela não corta).
export type TrocaDePose = { em: number; pose: PoseNome };

type Base = {
  de: number;
  ate: number;
  // O Guia não tem legenda; o campo existe só para o motor.
  legenda?: boolean;
  // Pose no começo do momento (ou uma lista de trocas). Sem isto, o template alterna sozinho.
  pessoa?: PoseNome | TrocaDePose[];
};

// ——— a assinatura ———

export type Placa = {
  // "Primeiros passos"
  titulo: string;
  // linha de apoio ("Como configurar o app")
  detalhe?: string;
};
// O infográfico inteiro (um por vídeo): título, subtítulo em letra de mão e 2 a 6 placas numeradas
// numa estrada que serpenteia.
export type MapaDoPlano = { titulo: string; subtitulo?: string; placas: Placa[] };

// Mostra o infográfico inteiro (sem `foco`) ou dá o zoom (crop de ~2x) na placa `foco` (0 = primeira).
// O corte cai na palavra do número ("dia | um"): `de` = o instante dessa palavra.
export type Mapa = Base & { tipo: "mapa"; foco?: number };

// A captura real (página pública, print do usuário) num cartão no topo, com seta vermelha grossa no
// botão. `x`,`y` = o ponto na imagem inteira (frações). `vem`: de onde a seta chega.
// `texto` = pílula vermelha na cauda; ela entra em `textoEm` (padrão: junto com a seta), na palavra dela.
export type Seta = { em: number; x: number; y: number; vem?: "cima" | "baixo" | "esq" | "dir"; texto?: string; textoEm?: number };
export type Print = Base & {
  tipo: "print";
  imagem: ImagemNoMomento;
  setas?: Seta[];
  // rótulo em pílula preta acima do cartão ("Sobre-mim.md")
  rotulo?: string;
  // o que o cartão mostra primeiro (frações da imagem); padrão: a primeira seta
  foco?: { x: number; y: number };
  // aproximação de base no ponto (padrão 1: o print já vem recortado no trecho citado)
  zoom?: number;
  // barra de navegador no alto do cartão com o endereço ("chatgpt.com"), quando a fala diz o site
  endereco?: string;
};

// ——— os blocos universais, na linguagem do Guia ———

// Título grande de tela de aula, palavra por palavra, com a estrela laranja; `destaque` ganha grifo laranja.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };
export type Item = { texto: string; em: number; detalhe?: string };
// Itens como pílulas pretas empilhadas (rótulo de arquivo), cada uma na sua fala; a da vez fica laranja.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
// Itens em ordem numa mini estrada vertical, com placas numeradas.
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
export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
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
// Ícone da estrela + palavra grande ("???????") logo acima da cabeça; "alerta" = pílula vermelha.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };
// Pílula rosa-vermelha no meio da tela: "Comenta PALAVRA / para receber". `texto` = a pílula; `destaque` = a palavra-chave.
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number; fundo?: ImagemNoMomento };

export type Momento =
  | Mapa
  | Print
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
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro quando houver
  rosto: Rosto;
  zona?: { topo: number; altura: number };
  // o Guia não usa tarja; o campo existe para o motor
  marca: { nome: string; area: string };
  // som tonal baixo a cada troca de tela com zoom (padrão: true)
  sfx?: boolean;
  // false = sem o recorte (pessoa em retângulo): para quem não tem macOS
  recorte?: boolean;
  cortesEm?: number[];
  // o infográfico do vídeo (obrigatório se algum momento for `mapa`)
  mapa?: MapaDoPlano;
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
