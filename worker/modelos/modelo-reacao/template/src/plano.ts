// Formato do plano de edição do modelo Reação. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: o conteúdo fica em cima, numa "mesa" por onde os cartões passam como num feed
// (cada cartão novo sobe por trás da moldura da pessoa e empurra o anterior para fora);
// a pessoa fica numa moldura larga embaixo, o vídeo inteiro. O marca-texto passa na linha lida.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui cada um vira um cartão do feed. A assinatura é `print`
// (post, manchete ou print com o marca-texto na linha lida e a câmera aproximando o trecho)
// e `comentario` (o cartão do comentário que abre o vídeo).
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (em `foto` ela já aparece; `false` esconde)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento };

// ——— a assinatura ———

// Comentário: o cartão do comentário que a pessoa responde (abre o vídeo).
// O marca-texto acompanha a leitura palavra por palavra a partir de `em` (padrão: a primeira palavra
// do texto dita depois de `de`). `autor` sem @; `respondendo: false` tira a aba "Respondendo".
export type Comentario = Base & { tipo: "comentario"; autor: string; texto: string; em?: number; respondendo?: boolean };

// Um trecho marcado num print: `trecho` (palavras exatas de `texto`) ou `area` (no print de verdade,
// em frações da imagem: x, y = canto de cima à esquerda; w, h = tamanho). A câmera aproxima o trecho.
export type Grifo = { trecho?: string; area?: { x: number; y: number; w: number; h: number }; em: number };

// Print: um post, manchete ou mensagem desenhado (com `texto`) ou o print de verdade do usuário
// (`imagem` com tipo "print" e sem `texto`). `forma`: "post" (padrão) ou "manchete".
// `autor` e `fonte` (ex.: "jornal", "post") são opcionais: sem eles o cabeçalho fica genérico.
// `imagem` com `texto` = a foto dentro do post. `risco` = trecho riscado quando é desmentido.
// `zoom: false` não aproxima.
export type Print = Base & {
  tipo: "print";
  forma?: "post" | "manchete";
  autor?: string;
  fonte?: string;
  texto?: string;
  imagem?: ImagemNoMomento;
  grifos?: Grifo[];
  risco?: { trecho: string; em: number };
  zoom?: boolean;
};

// ——— tipo próprio: imagem de apoio ———

// Foto: um cartão de foto desliza no feed (a legenda continua). `rotulo` (opcional) = etiqueta curta
// com palavras da fala, marcada no `rotuloEm`.
export type Foto = Base & { tipo: "foto"; imagem: ImagemNoMomento; rotulo?: string; rotuloEm?: number };

// ——— os blocos universais ———

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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  imagem?: ImagemNoMomento;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; imagem?: ImagemNoMomento };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

export type Momento =
  | Comentario
  | Print
  | Foto
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
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o Reação não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: vão no cartão de perfil quando o vídeo não abre com um cartão
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
