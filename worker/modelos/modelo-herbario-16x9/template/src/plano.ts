// Formato do plano de edição do modelo Herbário. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado;
// todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática é a de uma PRANCHA BOTÂNICA antiga: a pessoa fica numa moldura oval de herbário e a tela
// é uma folha de papel com figuras desenhadas a traço fino e aquarela leve. Cada momento ocupa uma
// "prancha"; de uma prancha para a próxima a câmera corre pelo papel (as pranchas ficam lado a lado).
// Esta é a versão DEITADA (16:9, 1920×1080, o vídeo completo do YouTube): o oval fica na coluna da
// direita e o desenho no quadro da esquerda (layout.ts). O formato do plano é o mesmo do vertical.

// Onde está o desenho de cada figura:
// "vaso"   = a planta inteira num vaso em corte: folhas, terra, raízes, fundo do vaso
// "janela" = uma janela com luz à esquerda e o vaso sobre uma régua de distância
// "terra"  = detalhe ampliado da terra do vaso (teste do dedo, umidade). Logo depois de uma figura
//            "vaso", a câmera mergulha no mesmo vaso em vez de correr para a próxima prancha.
import type { Rosto } from "./motor/caixa";

export type Vista = "vaso" | "janela" | "terra";

// O que o desenho faz, cada coisa no seu `em` (a palavra que a pessoa diz)
export type Acao =
  | "regar" // o regador entra, inclina e despeja água na terra
  | "encharcar" // a água sobe dentro do vaso (terra encharcada)
  | "apodrecer" // as raízes escurecem da ponta para cima
  | "murchar" // as folhas caem e perdem a cor
  | "brotar" // uma folha nova se abre no alto
  | "afastar" // (janela) o vaso desliza para longe da janela e a luz não alcança
  | "aproximar" // (janela) o vaso desliza para perto da janela
  | "amarelar" // as folhas ficam pálidas, amareladas
  | "semFuro" // o fundo do vaso ganha um furo tracejado com ✗
  | "acumular" // a água junta no fundo do vaso
  | "furo" // o furo se desenha e a água escorre por ele
  | "dedo" // (terra) o dedo entra na terra
  | "umida" // (terra) a terra em volta do dedo escurece
  | "seca" // (terra) a terra em volta do dedo clareia
  | "esperar"; // (terra) o sol cruza um arco: mais um dia passa (e a terra seca um pouco)

// Pontos do desenho que uma etiqueta pode apontar
export type Alvo =
  | "folha"
  | "caule"
  | "terra"
  | "raiz"
  | "agua"
  | "vaso"
  | "fundo"
  | "furo"
  | "regador"
  | "janela"
  | "luz"
  | "regua"
  | "dedo"
  | "umida"
  | "sol";

// Etiqueta de espécime: número num círculo + texto, presa ao desenho por uma linha-guia
export type Etiqueta = {
  em: number;
  alvo: Alvo;
  // palavras da fala, curtas (até ~22 caracteres; mais longo quebra em 2 linhas)
  texto: string;
  // garança (o problema) em vez de verde-musgo
  erro?: boolean;
  // lado da etiqueta em relação ao ponto (padrão: o lado com mais espaço)
  lado?: "esquerda" | "direita";
};

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// ——— a assinatura: a prancha botânica que age na fala ———

// Abertura própria do modelo (o nome antigo, continua valendo): frontispício de livro de botânica.
// A pessoa num oval grande no alto, o título embaixo e, no pé, o espécime no vaso.
export type Capa = Base & {
  tipo: "capa";
  // rótulo em versalete acima do título (padrão "Herbário")
  rotulo?: string;
  // palavras da fala, na ordem (cada palavra ganha tinta quando é dita). Até 3 linhas de ~12 caracteres
  linhas: string[];
  // trecho exato das linhas em itálico verde-musgo, com aguada por trás
  destaque?: string;
  // quantos medalhões (I, II, III…) se desenham embaixo do título quando a primeira palavra é dita.
  // Use quando a pessoa anuncia quantos itens vêm ("três erros").
  indice?: number;
  // quando o espécime a lápis no pé da página ganha tinta e aquarela (padrão: a última palavra do título)
  ramoEm?: number;
};

// Uma figura da prancha: o desenho que age na fala, com cabeçalho e etiquetas.
// É a assinatura do modelo e serve para qualquer assunto como metáfora de "algo que se cuida e cresce"
// (dinheiro, saúde, negócio, relação): regar demais = excesso, raiz que apodrece = o problema que não
// se vê, longe da luz = longe do que importa, furo = saída/escoamento, dedo na terra = conferir antes.
export type Figura = Base & {
  tipo: "figura";
  vista?: Vista;
  // número da figura (1, 2, 3…); aparece no cabeçalho e acende o índice de bolinhas
  numero?: number;
  // rótulo em versalete acima do título (padrão "Fig. N"); ex.: "Erro nº 1"
  rotulo?: string;
  // palavras da fala, 1 ou 2 linhas (o corpo diminui até caber; uma frase única também vale)
  titulo: string[] | string;
  // trecho exato do título em itálico verde-musgo
  destaque?: string;
  // frase de apoio em itálico embaixo do título (palavras da fala, até ~40 caracteres)
  apoio?: string;
  acoes?: { em: number; acao: Acao; texto?: string }[];
  etiquetas?: Etiqueta[];
};

// Uma frase no cartão de herbário, com a pessoa em tela cheia (aviso, dica, conclusão)
export type Nota = Base & {
  tipo: "nota";
  rotulo?: string;
  // palavras da fala; até 3 linhas de ~16 caracteres (ou `texto`, quebrado sozinho)
  linhas?: string[];
  texto?: string;
  destaque?: string;
};

// ——— os 11 blocos universais (motor/BLOCOS.md), na linguagem da prancha ———
// Campos extras opcionais deste modelo: `rotulo` (o versalete do cabeçalho) nos blocos de prancha.

export type Item = { texto: string; em: number; detalhe?: string };

// Frontispício (o mesmo da `capa`), com o título escrito a partir de uma frase e, no pé, um raminho
// prensado preso por fitas de linho. `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string; indice?: number };

// Lista sem ordem: um ramo prensado que se desenha de cima para baixo; cada item é uma folha numerada
// com a etiqueta de espécime. 2 a 5 itens.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; rotulo?: string; itens: Item[] };

// Sequência em ordem: estágios de crescimento (semente → broto → muda → planta → flor), cada um com
// o medalhão romano, ligados por uma seta tracejada. 2 a 5 itens.
export type Passos = Base & { tipo: "passos"; titulo?: string; rotulo?: string; itens: Item[] };

// Um número medido como um espécime: o ramo cresce ao lado de uma cota enquanto o número conta.
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

// Dois espécimes lado a lado (Fig. A e Fig. B): `contra` = duas folhas diferentes; `antes-depois` =
// broto → planta crescida; `errado-certo` = ramo murcho (garança, ✗) × ramo viçoso (musgo, ✓).
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  rotulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de prancha científica antiga, a pena e aquarela: barras hachuradas, linha que é um caule
// com uma folha em cada ponto, pizza em fatias de aquarela com etiquetas. Sem números ditos: um caule
// que sobe, cai ou oscila (`tendencia`), com a etiqueta "ILUSTRATIVO".
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  rotulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Uma palavra ou frase curta que bate forte: uma etiqueta de campo pendurada por um barbante, com a
// pessoa em tela cheia. "alerta" = garança com ✗; "chave" = verde-musgo com aguada.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Determinação de espécime: o termo vira o nome no cabeçalho (itálico) e o significado se escreve na
// etiqueta de herbário ao lado do raminho prensado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; rotulo?: string };

// Frase no cartão de herbário; `risco` = trecho riscado à pena em garança quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number; rotulo?: string };

// Pergunta no cartão de herbário, com o "?" num medalhão; as opções são etiquetas que entram na fala.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number; rotulo?: string };

// Fechamento: o oval se abre em tela cheia e o cartão de herbário sobe com a chamada.
// Universal: `texto` + `icone`. Formato antigo (continua valendo): `linhas` (a última vira o apoio em
// itálico) e `icones` (cada um no seu tempo).
export type Cta = Base & {
  tipo: "cta";
  texto?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  linhas?: string[];
  icones?: { em: number; icone: "salvar" | "seguir" | "comentar" | "enviar" | "link" }[];
};

export type Momento =
  | Capa
  | Figura
  | Nota
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
  // altura que o vídeo ocupa no quadro, a partir do topo (no 16:9, 1080 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (o cortar.mjs grava) traz o caminho e a largura do rosto;
  // `quadro` diz que as frações são do quadro 1920×1080
  rosto: Rosto;
  // faixa do texto em tela cheia (px, no quadro 1920×1080): a faixa de baixo, do queixo até a margem
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste do enquadramento dentro do oval (raro): zoom (multiplica o automático, que sai da largura do
  // rosto medida pelo rastro) e altura do rosto (0–1)
  oval?: { zoom?: number; ancoraY?: number };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
