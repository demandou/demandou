// Formato do plano de edição do modelo Etapas. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do modelo (Reel viral "fluxo de agentes"), na versão deitada (16:9, 1920×1080) para o
// vídeo completo do YouTube, pela regra da aula 9 do curso: três modos de tela, sempre em corte seco.
//   A (abertura)  a pessoa em tela cheia (o vídeo deitado inteiro) com o CABEÇALHO numa coluna ao
//                 lado do rosto (logo, ícones do processo ligados por setas, pílula com o título).
//                 Termina no primeiro corte para o modo B.
//   B (tela)      a pessoa vai para a MOLDURA da direita (rosto centralizado e acompanhado) e a TELA
//                 ocupa o quadro da esquerda (gravação de tela real, 1056 × 760), com a PÍLULA da
//                 etapa na borda de baixo dela; a legenda fica embaixo, centrada na moldura.
//   C (rosto)     a pessoa em tela cheia, sem inserção, só com a legenda na área segura de baixo. É o
//                 que sobra quando nenhum momento está ativo e o que o `cta` usa.
// O modo vem do momento ativo: `abertura` = A, `cta` ou nada = C, todo o resto = B.
// Os 11 blocos universais têm os mesmos campos de todos os modelos (references/plano.md); no modo B
// eles aparecem na tela do quadro da esquerda, no escuro. A assinatura é `etapa` (a pílula troca em seco e a tela
// muda a cada 0,3–1 s), `grade` (a recapitulação 2x2 numerada) e `prova` (um print real, parado).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Ícones de traço (pílula, cabeçalho, destaque)
export type Icone =
  | "robo"
  | "carrinho"
  | "etiqueta"
  | "relogio"
  | "alerta"
  | "certo"
  | "errado"
  | "dinheiro"
  | "casa"
  | "coracao"
  | "ideia"
  | "calendario"
  | "seta"
  | "estrela"
  | "lupa"
  | "sobe"
  | "cai"
  | "pessoa"
  | "raio";

type Base = {
  de: number;
  ate: number;
  // a legenda fica em todo o vídeo (padrão true); false = some neste momento
  legenda?: boolean;
  // pílula na borda de baixo da tela (só modo B): nome da etapa/seção em caixa-alta. Na `etapa` é o `rotulo`.
  pilula?: string;
  // chapéu: linha pequena no alto da tela escura ("DICA 2"). Opcional nos blocos de texto.
  chapeu?: string;
};

// ——— a assinatura ———

// Uma tela da gravação: uma imagem do `plano.imagens` (print de página inteira) que rola devagar.
// `em` = quando entra (corte seco; `dissolve` = dissolve de ~0,9 s sobre a tela anterior, só para
// antes/depois). `rolar` = de/até que ponto da página (0 = topo, 1 = fim) ela rola; `zoom` aproxima
// (1 = página inteira na largura); `cursor` = [x0, y0, x1, y1] em frações da tela.
export type Tela = {
  imagem: ImagemNoMomento;
  em: number;
  rolar?: [number, number];
  zoom?: number;
  cursor?: [number, number, number, number];
  dissolve?: boolean;
};

// Uma etapa de um processo: a pílula (`rotulo`, com ícone) troca em seco no começo da etapa e a
// tela muda a cada 0,3–1 s com prints diferentes do mesmo assunto ("muita coisa acontecendo").
export type Etapa = Base & {
  tipo: "etapa";
  rotulo: string;
  icone?: Icone;
  telas: Tela[];
};

// A recapitulação: 2 a 5 telas numeradas (círculo laranja 1, 2, 3…) numa grade, logo antes do resultado.
export type Grade = Base & {
  tipo: "grade";
  telas: { imagem: ImagemNoMomento; em?: number; rolar?: [number, number] }[];
  rotulo?: string;
};

// A prova: um print real, parado, na tela do quadro da esquerda (agenda, painel, e-mail, resultado).
// `foco` = ponto (0–1) da imagem que fica no centro quando há zoom.
export type Prova = Base & {
  tipo: "prova";
  imagem: ImagemNoMomento;
  em?: number;
  rotulo?: string;
  icone?: Icone;
  zoom?: number;
  foco?: { x: number; y: number };
  rolar?: [number, number];
};

// ——— os blocos universais, na linguagem do modelo ———

// O cabeçalho do modo A (uma coluna ao lado do rosto): `texto` = 1ª linha da pílula ("FLUXO DE AGENTES"), `sub` = 2ª linha
// ("CLAUDE CODE"), `etapas` = quantos ícones de processo (2 a 5, padrão 4), `icone` = o ícone deles.
// `destaque` e `em` existem por compatibilidade com os outros modelos e não aparecem.
export type Abertura = Base & { tipo: "abertura"; texto: string; sub?: string; etapas?: number; icone?: Icone; destaque?: string; em?: number };

// `imagem` (do modelo, opcional): o id de uma imagem do plano, que vira miniatura no lugar do marcador.
export type Item = { texto: string; em: number; detalhe?: string; imagem?: string };
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
  titulo?: string;
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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  icone?: Icone;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// `opcoes[].imagem` (do modelo, opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Etapa
  | Grade
  | Prova
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

// Reenquadramento (opcional). Sem isto, a câmera dá um salto de escala (8–15%) em cada corte, em cada
// troca de etapa e a cada ~3 s de rosto parado. Um item em `em` começa um enquadramento novo ali: num corte, escolhe o zoom daquele
// trecho; fora de um corte, é um "soco" de câmera na palavra (use pouco, nas ênfases).
// `aproximar`: aproximação lenta (até ~5%) durante o trecho.
export type Camera = { em: number; zoom?: number; aproximar?: boolean };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio no 16:9)
  videoAltura?: number;
  // centro do rosto no quadro (0–1, frações do 1920×1080), com o rastro e o `quadro` quando houver
  rosto: Rosto;
  // faixa abaixo do queixo (o motor calcula; o Etapas não usa: ele reposiciona a pessoa)
  zona?: { topo: number; altura: number };
  // nome e área: chapéu discreto no palco durante a abertura (vazio = sem)
  marca: { nome: string; area: string };
  // som tonal baixo quando uma imagem entra no palco (padrão: true)
  sfx?: boolean;
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  camera?: Camera[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
