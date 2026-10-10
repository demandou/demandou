// Formato do plano de edição do modelo Pronúncia. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem do Pronúncia: o ponto que pula na palavra
// dita, o risco coral no errado, o traço desenhado no certo. A assinatura é `pronuncia` (a ficha
// de som com a repetição em câmera lenta) e o fechamento próprio é `repita` ("repete comigo").
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— cartão no peito (a pessoa em quadro cheio) ———

// `em` (opcional) nos blocos que se montam na fala: quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  imagem?: ImagemNoMomento;
};

export type Definicao = Base & {
  tipo: "definicao";
  termo: string;
  em: number;
  significado: string;
  significadoEm: number;
  // opcional: a transcrição fonética do termo, em Charis SIL
  fonetica?: string;
  imagem?: ImagemNoMomento;
};

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// Repete comigo (próprio do Pronúncia): as palavras treinadas acendem uma a uma, em karaokê,
// cada uma com o ponto pulando na sílaba forte. Serve para qualquer lista dita em sequência
// (as frases do treino, os passos de um exercício de dicção, um trava-língua…).
export type Repita = Base & {
  tipo: "repita";
  // título que se monta na fala (padrão: "Repete comigo")
  texto?: string;
  em?: number;
  // 2 a 5 itens, cada um no instante em que é dito. `leitura` = o jeito de ler embaixo (opcional);
  // `forte` = o trecho que leva o ponto (sem ele, vem da ficha `pronuncia` da mesma palavra)
  itens: { texto: string; em: number; leitura?: string; forte?: string }[];
};

// ——— painel em cima + a pessoa numa moldura larga embaixo ———

type BasePainel = Base & {
  // o assunto do painel, em caixa alta lilás
  rotulo?: string;
  titulo?: string;
};

// Lista sem ordem: cada linha entra no seu `em` e o ponto pula para ela.
export type Topicos = BasePainel & { tipo: "topicos"; itens: Item[] };

// Sequência: linhas numeradas ligadas por um traço; o ponto desce pelo traço até a etapa dita.
export type Passos = BasePainel & { tipo: "passos"; itens: Item[] };

export type Comparacao = BasePainel & {
  tipo: "comparacao";
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  // quem ganha: traço desenhado embaixo. Em "errado-certo" o outro lado leva o risco coral.
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = BasePainel & {
  tipo: "grafico";
  forma: "barras" | "linha" | "pizza";
  // números DITOS, cada um no seu `em` (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: uma onda que mostra a tendência, com a etiqueta "ilustrativo"
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Uma parte da palavra escrita. Juntas, na ordem, formam a palavra.
export type Silaba = {
  texto: string;
  // a sílaba forte (o ponto pousa nela)
  forte?: boolean;
  // letras que não se falam: ficam apagadas e riscadas a partir de `mudaEm`
  muda?: boolean;
};

// A repetição em câmera lenta com a voz da própria pessoa (preenchida por ferramentas/camera-lenta.mjs).
export type Lenta = {
  // a palavra dita no vídeo cortado (o `em` e o `ate` dela em work/palavras.json). Use a
  // REPETIÇÃO da palavra (a 2ª vez que ela é dita): a câmera lenta toma o lugar dela.
  de: number;
  ate: number;
  // para forçar (raro): quando a repetição começa, quando a voz normal volta e a velocidade
  emPedido?: number;
  fimPedido?: number;
  ritmoPedido?: number;
  // calculados pela ferramenta: quando a repetição começa, quando a voz normal volta e a
  // velocidade (0,45 a 0,85: a que faz a palavra preencher a pausa em volta dela)
  em?: number;
  fim?: number;
  ritmo?: number;
  // gravados pela ferramenta
  origem?: [number, number];
  silabas?: number[];
  arquivo?: string;
  onda?: number[];
};

// A assinatura: a ficha de som de uma palavra.
export type Pronuncia = Base & {
  tipo: "pronuncia";
  // a palavra escrita (ou expressão curta)
  palavra: string;
  // quando a palavra é dita pela primeira vez (a ficha monta a palavra ali)
  em: number;
  // a palavra dividida (a soma dos textos = a palavra). Sem isto, a palavra inteira é uma sílaba.
  silabas?: Silaba[];
  mudaEm?: number;
  // transcrição fonética (IPA), ex.: "/ˈkʌmf.tɚ.bəl/"
  fonetica?: string;
  // o jeito de ler para quem fala português, com a sílaba forte em MAIÚSCULAS: "KÂMF-ter-bou"
  leitura?: string;
  leituraEm?: number;
  // rótulo da leitura (padrão: "jeito brasileiro de ler")
  rotuloLeitura?: string;
  // a pronúncia errada (riscada quando é dita)
  errado?: string;
  erradoEm?: number;
  // uma observação curta que entra na fala ("só 3 sílabas", "o e some")
  nota?: string;
  notaEm?: number;
  // "inglês" (padrão), "espanhol"…  e o sotaque: "americano" (padrão), "britânico", "da Espanha"…
  idioma?: string;
  sotaque?: string;
  // a foto do significado, no canto da ficha
  imagem?: ImagemNoMomento;
  lenta?: Lenta;
};

export type Momento =
  | Abertura
  | Numero
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Cta
  | Repita
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Pronuncia;

export type MomentoDePainel = Topicos | Passos | Comparacao | Grafico | Pronuncia;
export const TIPOS_DE_PAINEL = ["topicos", "passos", "comparacao", "grafico", "pronuncia"] as const;
export const ehPainel = (m: Momento): m is MomentoDePainel => (TIPOS_DE_PAINEL as readonly string[]).includes(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto no JSON (tipo Rosto de ./motor/caixa)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo onde entram os cartões de quadro cheio (px, quadro 1080×1920)
  zona?: { topo: number; altura: number };
  // nome na moldura da pessoa e rótulo da abertura
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
  // troca os textos fixos da tela (ex.: vídeo em espanhol): veja references/plano.md
  rotulos?: Partial<Record<
    | "pronuncia" | "idioma" | "sotaque" | "de" | "naoE" | "leitura" | "lenta" | "repita" | "quer" | "guarde"
    | "atencao" | "numero" | "numeros" | "voce" | "ilustrativo" | "certo" | "compare" | "naoEE",
    string
  >>;
};
