// Formato do plano de edição do modelo Versus. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: a pessoa fica sempre numa moldura larga embaixo; em cima fica a ARENA, onde tudo
// acontece. Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico,
// destaque, definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md) e aqui ganham a linguagem de cartaz de luta. A assinatura é a luta:
// `versus` (os dois lados se encaram), `rodada` (um critério, as barras, o ponto) e `veredito`
// (o placar final e "pra quem é cada um").
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (na `rodada` ela já aparece; `false` esconde)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— os 11 blocos universais ———

export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento };
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
  imagem?: ImagemNoMomento;
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
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number; imagem?: ImagemNoMomento };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; imagem?: ImagemNoMomento };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

// ——— a assinatura: a luta ———

// Ícones das rodadas (lista fechada). Sem ícone, a rodada mostra o número dela.
export const ICONES = ["tempo", "espaco", "energia", "dinheiro", "qualidade", "saude", "sabor", "facilidade", "seguranca", "pessoas"] as const;
export type Icone = (typeof ICONES)[number];

// Um lado da luta: o nome (curto: "Airfryer", "À vista", "Academia") e, de preferência, a imagem.
export type Lutador = { nome: string; em: number; imagem?: ImagemNoMomento };

// Versus: a tela de luta. O lado A entra pela esquerda (vermelho), o B pela direita (azul), cada um
// no `em` da palavra que o nomeia; o VS bate quando os dois estão na tela. Abre a luta: as
// `rodada` e o `veredito` seguintes usam estes dois lados. `titulo` (opcional): a pergunta da luta.
export type Versus = Base & { tipo: "versus"; lados: [Lutador, Lutador]; titulo?: string; tituloEm?: number };

// O que um lado faz na rodada: `texto` curto da fala ("2 a 3 min", "lasanha inteira"),
// `forca` de 0 a 1 = quanto a barra dele enche (quem vence a rodada enche mais).
export type LadoDaRodada = { texto?: string; em: number; forca?: number };

// Rodada: o critério (`titulo` + `icone`) entra no `em`; a barra de cada lado enche no `em` dele;
// `imagem` (opcional) bate em `imagemEm`, por cima do lado `imagemLado` (ou no meio, sem lado);
// o `vencedor` leva o ponto no placar em `vencedorEm` ("empate" não pontua).
export type Rodada = Base & {
  tipo: "rodada";
  titulo: string;
  em: number;
  icone?: Icone;
  numero?: number;
  a?: LadoDaRodada;
  b?: LadoDaRodada;
  imagem?: ImagemNoMomento;
  imagemEm?: number;
  imagemLado?: 0 | 1;
  vencedor?: 0 | 1 | "empate";
  vencedorEm?: number;
};

// Veredito: o placar final bate em `placarEm`; cada perfil entra no meio no `em` dele e vai para o
// lado que serve a ele em `ladoEm` ("Mora sozinho" → A). 1 a 4 perfis. `titulo` opcional.
export type Perfil = { texto: string; em: number; lado: 0 | 1; ladoEm?: number };
export type Veredito = Base & { tipo: "veredito"; titulo?: string; placarEm?: number; perfis: Perfil[] };

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
  | Versus
  | Rodada
  | Veredito;

export const daLuta = (m: Momento): m is Versus | Rodada | Veredito => m.tipo === "versus" || m.tipo === "rodada" || m.tipo === "veredito";

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
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o Versus não usa: a pessoa fica sempre embaixo)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // false = sem a barra de progresso no topo
  progresso?: boolean;
  imagens?: ImagensDoPlano;
};
