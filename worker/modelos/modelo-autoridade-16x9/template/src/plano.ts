// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Blocos universais (motor/BLOCOS.md, iguais em todos os modelos): abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta.
// Assinatura do Autoridade: citacao (o cartão-documento de papel com marca-texto).
// Do exemplo original (continuam valendo): gancho, lista, contraste.
//
// Versão deitada (16:9, 1920×1080): os mesmos blocos e campos do vertical. Onde cada bloco entra
// (tela cheia, na altura do peito, ou o quadro da esquerda com a pessoa na moldura da direita) é
// decidido pelo template (src/layout.ts); o plano não precisa de posição.
import type { Rosto } from "./motor/caixa";

export type Icone =
  | "caixa"
  | "retorno"
  | "documento"
  | "relogio"
  | "escudo"
  | "check"
  | "seguir"
  | "comentar"
  | "link"
  | "alerta"
  | "moeda"
  | "grafico"
  | "lupa"
  | "pessoa"
  | "coracao"
  | "calendario"
  | "ideia";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// ——— universais ———

// Título de abertura que se monta palavra por palavra na fala. `destaque` = trecho exato em itálico
// latão (com um traço que se desenha). `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

export type ItemFalado = { texto: string; em: number; detalhe?: string; icone?: Icone };

// 2 a 5 itens sem ordem (motivos, erros, dicas, sinais): travessão de latão em cada item
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemFalado[] };

// 2 a 5 itens EM ORDEM: numerais de latão ligados por um fio
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemFalado[] };

// Número universal: conta até `valor` a partir de `em` (pt-BR). Os campos do exemplo antigo
// (`valor` em texto, `unidade`, `complemento`) continuam funcionando.
export type NumeroUniversal = Base & {
  tipo: "numero";
  valor: number;
  em: number;
  rotulo: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  // barrinhas que preenchem uma a uma (contagens pequenas, 2 a 10)
  marcadores?: number;
};

export type NumeroAntigo = Base & {
  tipo: "numero";
  valor: string;
  unidade: string;
  complemento?: string;
  marcadores?: number;
  em?: number;
  rotulo?: string;
};

export type Numero = NumeroUniversal | NumeroAntigo;

export type Lado = { rotulo: string; texto: string; em: number };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  // números DITOS (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  // sem números: a forma qualitativa, com a etiqueta "ilustrativo"
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
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, palavra por palavra. `destaque` = itálico latão; `risco` = trecho riscado quando é
// dito (ou em `riscoEm`). `rotulo` e `enfase` são os campos do exemplo antigo (enfase = destaque).
export type FraseDeEfeito = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  rotulo?: string;
  enfase?: string;
};

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  // o que a chamada pede: salvar (padrão), seguir, comentar ou tocar num link
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— assinatura ———

// O cartão-documento: papel marfim com filete de latão, a fonte em letreiro, um título serifado e,
// por baixo, OU um trecho de texto com marca-texto (`texto` + `grifo`), OU linhas escritas uma a uma
// na fala (`itens`, 2 a 5). Serve para lei, estudo, regra, receita, contrato, ficha, a aula, o plano…
export type Citacao = Base & {
  tipo: "citacao";
  fonte?: string;
  titulo: string;
  texto?: string;
  itens?: { texto: string; em: number }[];
  // trecho exato de `texto` (ou de um item) que recebe o marca-texto, e quando
  grifo?: string;
  grifoEm?: number;
  em?: number;
};

// ——— do exemplo original ———

export type Gancho = Base & {
  tipo: "gancho";
  rotulo?: string;
  // até 3 linhas curtas (máx. ~14 caracteres cada)
  linhas: string[];
  // índice da linha em destaque (itálico dourado)
  enfase?: number;
};

export type Lista = Base & {
  tipo: "lista";
  rotulo?: string;
  itens: { em: number; texto: string; icone?: Icone; detalhe?: string }[];
};

export type Contraste = Base & {
  tipo: "contraste";
  pergunta: string;
  conector?: string;
  opcoes: { em: number; texto: string }[];
};

export type Momento =
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | FraseDeEfeito
  | Pergunta
  | Cta
  | Citacao
  | Gancho
  | Lista
  | Contraste;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho no quadro deitado (1080 = quadro cheio, o vídeo inteiro)
  videoAltura?: number;
  // centro do rosto no quadro (0–1). O cortar.mjs também grava `quadro` (1920×1080) e o `rastro`
  // (o rosto quadro a quadro): na moldura da direita o rosto fica centralizado e é acompanhado.
  rosto: Rosto;
  // faixa do peito na tela cheia (px, no quadro 1920×1080): abaixo do queixo, até a base
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  // zoom fixo por trecho, com troca seca. Deixe de fora (ou vazio) para o template calcular
  // sozinho a partir dos cortes e dos momentos; preencha só para controlar à mão.
  enquadramentos?: { de: number; zoom: number }[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "Cloud": "Claude" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda (a legenda já some sozinha durante momentos sem `legenda: true`)
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
