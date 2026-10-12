// Formato do plano de edição do modelo Campo. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: o caderno de campo. A pessoa fica sempre embaixo, numa moldura larga; em cima fica o
// PAINEL DE CAMPO, sobre o chão de palha com curvas de nível. A assinatura é o `talhao`: a vista de
// cima (foto aérea ou mapa desenhado) com os talhões contornados em amarelo de sinalização, que se
// desenham na fala. Junto vêm os instrumentos do painel: `cotacao` (indicador com mini-gráfico),
// `medidor` (reservatório que enche ou esvazia até a fração dita) e `previsao` (faixa do tempo com o
// que está chegando). Os 11 blocos universais (abertura, topicos, passos, numero, comparacao,
// grafico, destaque, definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do
// pack (references/plano.md) e aqui ganham a linguagem do caderno de campo.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, o painel mostra a fala)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— a assinatura ———

// Um talhão: retângulo em frações da IMAGEM (0–1; x,y = canto de cima à esquerda).
export type Area = { x: number; y: number; w: number; h: number };

// O talhão: a vista de cima com os talhões contornados.
// `imagem`: foto aérea (drone/satélite). Sem imagem, o modelo desenha um mapa de lavoura ilustrado
//   (modo ilustrativo: serve para qualquer assunto), com 6 talhões próprios.
// `areas`: os talhões da foto (marque olhando a imagem com grade). Sem `areas` numa foto, só a mira.
// `contornoEm`: quando os contornos começam a se desenhar (padrão: `em` ou `de`).
// `marcar`: talhões que acendem um a um (preenchimento amarelo + mira), cada um na palavra dele;
//   `texto` (opcional, só palavras ditas) vira a estaca com o rótulo. A câmera voa até o talhão da vez.
// `texto` (opcional): título que se monta palavra por palavra no alto; `destaque` ganha o grifo amarelo.
export type Talhao = Base & {
  tipo: "talhao";
  texto?: string;
  em?: number;
  destaque?: string;
  imagem?: ImagemNoMomento;
  areas?: Area[];
  contornoEm?: number;
  marcar?: { area: number; em: number; texto?: string }[];
};

// A cotação: o indicador do painel. `rotulo` (o que subiu/caiu: "Caixa do tomate") entra em `em`;
// o mini-gráfico começa a andar em `sobeEm` (palavra "subiu"/"caiu"); a variação conta até `valor`
// em `valorEm` (só número DITO; sem número, omita `valor` e o gráfico mostra só a direção, com
// "ilustrativo"); `periodo` ("no mês") acende em `periodoEm`. `imagem` = a foto da coisa (opcional).
export type Cotacao = Base & {
  tipo: "cotacao";
  rotulo: string;
  em: number;
  direcao: "sobe" | "cai";
  sobeEm?: number;
  valor?: number;
  valorEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  periodo?: string;
  periodoEm?: number;
  imagem?: ImagemNoMomento;
};

// O medidor: um reservatório (água, ração, combustível, orçamento, energia…) que vai do cheio até a
// `fracao` dita ("metade" = 0.5, "um terço" = 0.333, "o dobro" = 2 → transborda até o topo da escala
// dobrada). `titulo` (o contexto: "Gotejamento") entra em `em`; o nível começa a mudar em `mudaEm` e
// assenta em `fracaoEm`, com a marca amarela. O `texto` ("gastou metade da água") se monta na fala
// a partir de `textoEm` (padrão: `fracaoEm`); `destaque` ("metade") ganha o grifo amarelo.
// `imagem` = a foto do contexto (opcional). `cor`: "agua" (padrão), "terra" ou "verde".
export type Medidor = Base & {
  tipo: "medidor";
  titulo?: string;
  em: number;
  fracao: number;
  mudaEm?: number;
  fracaoEm: number;
  texto: string;
  textoEm?: number;
  destaque?: string;
  cor?: "agua" | "terra" | "verde";
  imagem?: ImagemNoMomento;
};

// A previsão: a faixa do tempo com o que está chegando. `texto` (a frase: "A chuva volta na semana
// que vem") se monta palavra por palavra; `chegada` (o ícone que chega) entra em `chegaEm` com a
// frente varrendo os quadros da direita; `quando` (só palavras ditas: "semana que vem") vira a chave
// sob os quadros em `quandoEm`. `agora` = o tempo de hoje (padrão "sol"). Nenhum dia, data ou mm
// inventado: os quadros não têm rótulo.
export type Clima = "sol" | "nuvem" | "chuva" | "tempestade" | "vento" | "geada";
export type Previsao = Base & {
  tipo: "previsao";
  texto?: string;
  em?: number;
  destaque?: string;
  agora?: Clima;
  chegada: Clima;
  chegaEm: number;
  quando?: string;
  quandoEm?: number;
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
export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};
// `rotulos` (do Campo, opcional): sem `dados`, as colunas da tendência ganham nomes (2 a 5, ex.:
// "Sem gotejamento", "Com gotejamento"); a última é a que a fala destaca e cresce em `tendenciaEm`.
export type Grafico = Base & {
  tipo: "grafico";
  rotulos?: string[];
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
// `material` (opcional): o que a pessoa oferece ("a planilha de custo da estufa", "o guia", "a lista"),
// entrando em `material.em`; a chamada entra em `em`. Com `linhas` (2 a 6 itens escritos, sem números:
// "Mudas", "Irrigação", "Total"), é a planilha com a coluna de ✓ marcando linha a linha; sem `linhas`,
// é o arquivo com o ícone e a seta de baixar.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  material?: { texto: string; em: number; forma?: "planilha" | "lista"; linhas?: string[] };
};

export type Momento =
  | Talhao
  | Cotacao
  | Medidor
  | Previsao
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
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: Rosto;
  // faixa abaixo do queixo (o Campo não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: a tarja no terço de baixo da moldura, no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
