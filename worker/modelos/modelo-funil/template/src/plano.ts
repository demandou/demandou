// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// Gramática do Funil: dois "lugares".
// - Quadro cheio: a pessoa ocupa a tela e um cartão grafite entra na altura do peito
//   (abertura/gancho, numero, destaque, frase, pergunta, cta).
// - Página de papel: um gráfico de jornal ocupa a tela (o funil, listas, passos, comparações,
//   gráficos, definições) e a pessoa vira um bloco à direita que acompanha o item da vez.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `funil` + `conserto`.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (normalmente não precisa)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——— quadro cheio ———

// Abertura: título montado palavra por palavra num cartão grafite; `destaque` = trecho em laranja
// (o problema). Com destaque, uma fileira de pontos (pessoas) cai em laranja quando ele é dito.
// `em` (opcional, nos quatro blocos de texto falado): quando o TEXTO começa a ser dito (padrão: `de`).
// Use quando o momento começa antes da primeira palavra do texto ("Segundo, quando…" com texto "Quando…").
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; pontos?: boolean; em?: number };

// O nome antigo da abertura neste modelo (continua valendo).
export type Gancho = Base & { tipo: "gancho"; texto: string; destaque?: string; pontos?: boolean; em?: number };

// Número que conta até `valor` a partir de `em`, num cartão grafite com uma régua (ou, para %,
// uma grade de 100 pontos que se enche).
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

// Uma palavra ou frase curta que bate forte. "alerta" = laranja (o problema), com pontos que caem.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Frase de efeito; `risco` = trecho riscado em laranja quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste; `opcoes` entram como etiquetas, cada uma na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: chamada montada palavra por palavra, ícone e assinatura (nome e área).
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— página de papel (a pessoa no bloco) ———

// Lista sem ordem (motivos, erros, dicas, sinais): linhas da página, cada uma com um ponto que cai.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: um tubo (o gargalo do funil) dividido em seções; um ponto desce seção a seção.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Dois lados, um embaixo do outro; o bloco da pessoa acompanha o lado da vez.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de jornal feito de pontos: barras = fileiras de pontos (cada ponto vale um número
// redondo), linha = pontos ligados por um traço, pizza = grade de 100 pontos.
// Sem números ditos: `tendencia` (sobe, cai, oscila) com a etiqueta "ilustrativo".
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

// Termo que passa por um funil pequeno e sai como significado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// ——— a assinatura: o funil e o conserto ———

// Uma etapa do funil. A primeira enche a boca do funil de pontos; cada uma das outras recebe os
// pontos que "passaram" da etapa anterior.
export type Etapa = {
  // quando a etapa é dita (o número, ou a palavra que a nomeia): os pontos descem
  em: number;
  // o que quem chega aqui faz, com palavras da fala: "veem o anúncio", "compram por impulso"
  texto: string;
  // quantos chegam a esta etapa (dito na fala). Opcional: sem `valor` a etapa é ilustrativa.
  valor?: number;
  // taxa dita do passo que leva a esta etapa, em % da etapa de cima ("só 10% clicam")
  taxa?: number;
  // forma no plural, usada quando o número na tela não é 1 (ex.: "compra" → "compras")
  plural?: string;
  // nome curto do passo que leva a esta etapa (onde pode vazar): "página", "impulso"
  passo?: string;
};

// Passo que vaza: o selo fica laranja e os pontos que ficaram pulsam. `etapa` = a etapa que o passo alimenta.
export type Alerta = { etapa: number; em: number };

// A tela do funil sendo montada: a pessoa no bloco ao lado, que desce a cada etapa.
export type Funil = Base & {
  tipo: "funil";
  // etiqueta no topo: "Exemplo", "Ilustrativo"… (sem números ditos, vira "Ilustrativo" sozinha)
  rotulo?: string;
  rotuloEm?: number;
  // números ilustrativos (mostra a etiqueta "Ilustrativo" se não houver `rotulo`)
  ilustrativo?: boolean;
  // o que cada ponto representa, no plural: "pessoas" (padrão), "leads", "alunos", "agitação"
  unidade?: string;
  // 2 a 5 etapas, de cima para baixo
  etapas: Etapa[];
  // passos que já vazam enquanto o funil se monta (opcional)
  alertas?: Alerta[];
};

// A tela do funil de volta, já montada, para apontar o problema e mostrar o conserto.
export type Conserto = Base & {
  tipo: "conserto";
  // um traço laranja pela parede direita do funil, da etapa `de` até a etapa `ate` (índices, a
  // primeira é 0), que se desenha de `em` até `ateEm`
  caminho?: { de: number; ate: number; em: number; ateEm?: number; texto?: string };
  alertas?: Alerta[];
  // passos consertados: mais pontos descem (em verde) e as etapas de baixo crescem junto.
  // `taxa` (%) é a taxa nova do passo; sem ela, o ganho é ilustrativo (a taxa dobra, sem número na tela).
  // `texto` = o nome do conserto, que aparece no selo verde ("analisar o mercado").
  consertos?: { etapa: number; em: number; taxa?: number; texto?: string }[];
  // um botão no alto ("+ R$ em tráfego") que fica para depois
  depois?: { texto: string; em: number; carimbo?: string; carimboEm?: number };
};

export type Momento =
  | Abertura
  | Gancho
  | Numero
  | Destaque
  | Frase
  | Pergunta
  | Cta
  | Topicos
  | Passos
  | Comparacao
  | Grafico
  | Definicao
  | Funil
  | Conserto;

export type TipoDeMomento = Momento["tipo"];

export const ehTelaDoFunil = (m: Momento): m is Funil | Conserto => m.tipo === "funil" || m.tipo === "conserto";

// Momentos que acontecem na página de papel (a pessoa vira o bloco ao lado)
export const NA_PAGINA: TipoDeMomento[] = ["funil", "conserto", "topicos", "passos", "comparacao", "grafico", "definicao"];
export const naPagina = (m: Momento) => NA_PAGINA.includes(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa dos cartões de quadro cheio (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: vão na etiqueta do bloco e na assinatura do fechamento
  marca: { nome: string; area: string };
  // enquadramento da pessoa dentro do bloco: zoom (2 a 2,6 mostra cabeça e ombros) e altura do rosto
  retrato?: { zoom?: number; ancoraY?: number };
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas (o motor preenche)
  palavras: Palavra[];
  // correções de palavras que a transcrição errou: { "Cloud": "Claude" }
  correcoes?: Record<string, string>;
  // trechos extras sem legenda (a legenda já some sozinha durante momentos sem `legenda: true`)
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
