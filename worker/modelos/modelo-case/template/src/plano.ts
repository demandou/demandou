// Formato do plano de edição do modelo Case. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: um RELATÓRIO que se monta enquanto a pessoa fala. A folha fica em cima; a pessoa,
// embaixo, numa moldura larga. Cada momento vira uma PÁGINA do relatório (a altura da janela) e a
// "câmera" desce de página em página. Dentro da página, cada peça entra na palavra que a nomeia:
// etiquetas e rótulos datilografados, caixas que se marcam, barras que caem, estrelas que acendem.
// Os 11 blocos universais têm os mesmos campos em todos os modelos do pack (references/plano.md).
// A assinatura é o `case` (ANTES → O QUE FIZEMOS → PRAZO → DEPOIS); junto vem o `depoimento`
// (o print da mensagem de quem recebeu o resultado).
import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, o relatório mostra a fala)
  legenda?: boolean;
  // etiqueta da página (padrão de cada bloco: "ANTES", "O QUE FIZEMOS", "DEPOIS", "PRÓXIMO PASSO"…)
  etiqueta?: string;
};

export type Item = { texto: string; em: number; detalhe?: string; icone?: NomeIlustracao };

// Mini-ilustrações em traço (desenhadas no template). Lista documentada em references/plano.md.
export type NomeIlustracao =
  | "anuncio"
  | "criativo"
  | "pagina"
  | "oferta"
  | "carrinho"
  | "dinheiro"
  | "grafico"
  | "alvo"
  | "funil"
  | "mensagem"
  | "email"
  | "video"
  | "telefone"
  | "calendario"
  | "pessoa"
  | "equipe"
  | "ferramenta"
  | "ideia"
  | "relogio"
  | "documento"
  | "escudo"
  | "coracao"
  | "casa"
  | "moeda";

// ——— a assinatura ———

// Uma métrica da ficha: `rotulo` (curto, vira etiqueta em caixa alta: "GASTO EM ANÚNCIO") entra em
// `em`; o `valor` (o que foi DITO: "R$ 5 mil", "quase não vendia", "3 clientes") é datilografado em
// `valorEm`; `detalhe` ("por mês") entra em `detalheEm`. `icone` = mini-ilustração no quadrinho da
// esquerda (desenha em `iconeEm`, padrão `em`). `sinal` = um traço pequeno ao lado do rótulo:
// "plano" (parado), "cai" ou "sobe" (desenha junto com o valor).
export type Metrica = {
  rotulo: string;
  em: number;
  valor: string;
  valorEm?: number;
  detalhe?: string;
  detalheEm?: number;
  icone?: NomeIlustracao;
  iconeEm?: number;
  sinal?: "plano" | "cai" | "sobe";
};

// Uma mudança feita (ou um passo do método): a caixa se marca, a mini-ilustração se desenha e o
// texto entra, tudo em `em` (a palavra da mudança: "criativo").
export type Mudanca = { texto: string; em: number; detalhe?: string; icone?: NomeIlustracao };

// A ficha ANTES. `titulo` (opcional, o "quem": "Cliente", "A loja", "Eu") abre a ficha com a
// mini-ilustração `icone` (padrão "pessoa"); `tituloEm` = quando ele entra (0 = já no quadro 0, o
// gancho). O carimbo coral com a `etiqueta` ("ANTES") bate em `carimboEm` (padrão `em`).
export type CaseAntes = {
  etiqueta?: string;
  em: number;
  titulo?: string;
  icone?: NomeIlustracao;
  tituloEm?: number;
  carimboEm?: number;
  metricas: Metrica[];
};
// `titulo` ("Mudamos 3 coisas") monta palavra por palavra a partir de `em`; `destaque` ("3") em coral.
export type CaseMudancas = { etiqueta?: string; titulo?: string; destaque?: string; em: number; itens: Mudanca[] };
// A linha do tempo: `texto` ("60 dias", "3 meses", "uma semana") entra em `em`; a barra enche até
// `fimEm` (padrão: em + 1,2 s). `inicio` = rótulo da ponta esquerda (padrão "início").
export type CasePrazo = { texto: string; destaque?: string; em: number; fimEm?: number; inicio?: string };
// O resultado: duas barras, ANTES e DEPOIS. `rotulo` ("Custo por venda") entra em `em` com a barra
// ANTES; a barra DEPOIS aparece em `depoisEm` na mesma altura e, em `movimentoEm` (a palavra "caiu",
// "subiu", "dobrou"), cai ou sobe até `fator` × ANTES (0,5 = metade, 2 = dobro: SÓ se foi dito).
// Em `relacaoEm` a `relacao` ("pela metade", "o dobro", "3x mais") bate em coral com o colchete.
// `valorAntes`/`valorDepois`: só números ditos ("R$ 80", "R$ 40"). Sem fator dito: `ilustrativo: true`.
export type CaseResultado = {
  rotulo: string;
  em: number;
  direcao: "cai" | "sobe";
  fator?: number;
  depoisEm?: number;
  movimentoEm?: number;
  relacao?: string;
  relacaoEm?: number;
  antes?: string;
  depois?: string;
  valorAntes?: string;
  valorDepois?: string;
  ilustrativo?: boolean;
};

// O case: as partes que a fala tiver, na ordem. Cada parte vira uma página (prazo e resultado
// dividem a página DEPOIS). Vários `case` no mesmo vídeo continuam o mesmo relatório.
export type Case = Base & {
  tipo: "case";
  antes?: CaseAntes;
  mudancas?: CaseMudancas;
  prazo?: CasePrazo;
  resultado?: CaseResultado;
};

// A ficha: a mesma ficha do ANTES, sozinha, para qualquer dado dito (o raio-x de hoje, o perfil de
// um produto, os números de um mercado). `etiqueta` padrão "Ficha"; 1 a 3 métricas.
export type Ficha = Base & { tipo: "ficha"; em?: number; titulo?: string; icone?: NomeIlustracao; tituloEm?: number; carimboEm?: number; metricas: Metrica[] };

// O depoimento: o print da mensagem, numa conversa genérica (sem logo de app). `em` = a palavra que o
// anuncia ("mensagem", "olha", "depoimento"; `palavra` diz qual, para o timing gate): entra o cartão
// com "digitando…"; em `textoEm` o balão com o `texto` (a mensagem REAL do cliente, ou um exemplo
// marcado como tal); `estrelas` (1–5, só se a avaliação existir) acendem uma a uma em `estrelasEm`.
// `nome` = quem mandou (padrão "Cliente"). `arquivo` (opcional) = o print de verdade, copiado para
// public/ (ex.: "imagens/print.png"): entra no lugar do balão, recortado para caber no cartão.
export type Depoimento = Base & {
  tipo: "depoimento";
  texto: string;
  arquivo?: string;
  em: number;
  palavra?: string;
  textoEm?: number;
  nome?: string;
  estrelas?: number;
  estrelasEm?: number;
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
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; destaque?: string; opcoes?: { texto: string; em: number }[]; em?: number };
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; destaqueEm?: number; em?: number };

export type Momento =
  | Case
  | Ficha
  | Depoimento
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
  // faixa abaixo do queixo (o Case não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: a tarja no começo (vazio = sem tarja)
  marca: { nome: string; area: string };
  // título no cabeçalho da folha (padrão "RELATÓRIO")
  relatorio?: string;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
