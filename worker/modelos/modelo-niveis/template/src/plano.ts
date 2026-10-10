// Formato do plano de edição do modelo Níveis. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Níveis (refrão de comparação): a pessoa em quadro cheio, plano contínuo, só
// cortes secos, empurrada para baixo para abrir uma FAIXA PRETA no topo. Na faixa, 3 cartões
// lado a lado (~29% da largura cada), cada um entrando em corte seco na palavra do nível, com o
// rótulo branco logo abaixo. A cada ciclo de ~3 s os cartões trocam por um tema novo. Sem legenda.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). A assinatura é o `niveis` (um ciclo: 3 cartões + 3 rótulos).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Lado do ombro em que um cartão entra. "centro" = no meio do peito.
export type Lado = "esq" | "dir" | "centro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão do Yap: continua nas inserções e nos cartões (numero, destaque, comparacao, topicos,
  // passos, grafico, definicao); some na abertura, frase, pergunta e cta (eles mostram a fala).
  legenda?: boolean;
};

// ——— a assinatura ———

// Um nível do ciclo (ruim / bom / excelente; barato / médio / caro; antes / durante / depois…).
// O cartão e o rótulo entram JUNTOS, em corte seco, em `em` (a palavra do nível, ~0,1 s antes).
export type Nivel = {
  // rótulo abaixo do cartão, branco, caixa alta (curto: "RUIM", "R$ 200", "1º MÊS")
  rotulo: string;
  em: number;
  // some antes do fim do ciclo (padrão: fica até o corte seguinte)
  ate?: number;
  // coluna do cartão (0 esquerda, 1 centro, 2 direita). Padrão: a ordem do item na lista.
  posicao?: 0 | 1 | 2;
  // o conteúdo do cartão: uma imagem (id de work/imagens.json) ou, sem imagem, um cartão de texto
  imagem?: ImagemNoMomento;
  texto?: string;
  // cor de fundo do cartão (padrão: papel claro); use para dar contraste entre os três
  fundo?: string;
  // troca o rótulo no meio do ciclo (ex.: o do meio vira "MELHOR CUSTO-BENEFÍCIO")
  depois?: { rotulo: string; em: number };
};

// Um ciclo: de 1 a 3 cartões na faixa de cima. `de` = corte para o tema novo, `ate` = próximo corte.
export type Niveis = Base & { tipo: "niveis"; itens: Nivel[] };

// ——— os blocos universais, na linguagem do Yap ———

// Título do gancho: entra no lugar da legenda, maior, palavra por palavra; `destaque` ganha a tarja.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: cartão claro no peito, cada linha acende no seu `em`.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; lado?: Lado };

// Sequência: as etapas numeradas, ligadas por um fio que avança.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; lado?: Lado };

// Número que conta até `valor` a partir de `em`. `titulo` (do Yap): a linha pequena acima do número.
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
  lado?: Lado;
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
  // números DITOS (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  lado?: Lado;
};

// Chip de palavra-chave: uma pílula na altura do peito. "alerta" = pílula escura.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  lado?: Lado;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; lado?: Lado };

// Frase de efeito: cartão claro com a fala palavra por palavra; `risco` é riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// `opcoes[].imagem` (do Yap, opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

// Fechamento do Níveis: o cartão do perfil com o botão "Seguir" no topo (entra em `de`) e, ~0,5 s
// depois, a pílula branca no peito: `texto` = 'Comenta "GPT"' (ou só a palavra-chave em `destaque`).
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Niveis
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

// Reenquadramento (opcional). Sem isto, a câmera alterna sozinha 1,0 / 1,12 / 1,22 em cada corte.
// Um item em `em` começa um enquadramento novo ali: num corte, escolhe o zoom daquele trecho;
// fora de um corte, é um "soco" de câmera na palavra (use pouco, nas ênfases).
// `aproximar`: aproximação lenta (até ~5%) durante o trecho.
export type Camera = { em: number; zoom?: number; aproximar?: boolean };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro quando houver
  rosto: Rosto;
  // faixa abaixo do queixo (o motor calcula; o Yap usa só como referência do queixo)
  zona?: { topo: number; altura: number };
  // o cartão do perfil do fechamento: `usuario` ("tiagolemosx") e, opcional, `foto` (arquivo em public/)
  perfil?: { usuario: string; foto?: string };
  // não usado neste modelo (o contrato do motor pede o campo)
  marca: { nome: string; area: string };
  // sem sons: o Reel de origem não tem som de efeito (campo mantido pelo contrato)
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
