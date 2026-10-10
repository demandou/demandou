// Formato do plano de edição do modelo Lookbook. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Tempos em segundos, na linha do tempo do vídeo já cortado; todo campo
// `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// Gramática: o vídeo é uma revista folheada. A pessoa é a foto da página e muda de lugar a cada
// momento: emoldurada na capa, deslocada para um lado (coluna de papel do outro), retrato largo em
// cima ou embaixo (página aberta no resto), impressão girada na colagem, quadro cheio no fechamento.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack. A assinatura
// deste modelo é `peca` (a página de catálogo) e `colagem` (o conjunto montado).

// Onde a foto da pessoa fica durante o momento:
// "cheio"    = quadro inteiro, abaixo da faixa do cabeçalho
// "direita"  = a foto vai para a direita e a página abre à esquerda (coluna de papel + cartão)
// "esquerda" = o espelho: a foto vai para a esquerda e a página abre à direita
// "topo"     = retrato largo em cima; a página abre embaixo
// "baixo"    = retrato largo embaixo; a página abre em cima
export type Layout = "cheio" | "direita" | "esquerda" | "topo" | "baixo";
export type Lateral = "direita" | "esquerda";
export type Faixa = "topo" | "baixo";

// Um ponto no corpo da pessoa: o nome de um ponto de `pontos` ("gola", "peito", "ombroEsq"…)
// ou { x, y } em frações do vídeo da pessoa (0 = esquerda/topo, 1 = direita/base).
// "Esq"/"Dir" são os lados da IMAGEM (não do corpo).
export type Ponto = string | { x: number; y: number };

// Textura da amostra de tecido
export type Tecido = "liso" | "algodao" | "linho" | "sarja" | "jeans" | "malha" | "la" | "seda" | "couro" | "metal";

// Uma linha do cartão de catálogo: rótulo pequeno em caixa alta + valor (o que foi dito).
// Nasce "a lápis" e ganha tinta no `em`.
export type Atributo = { rotulo: string; valor: string; em: number };

// Amostras lado a lado ("couro ou metal", "preto ou marrom"), cada uma preenche no seu `em`.
export type Variantes = {
  rotulo: string;
  // quando o rótulo ganha tinta (a palavra que apresenta as opções); padrão: a primeira amostra
  em?: number;
  // palavra que liga as amostras ("ou", "e"); padrão "ou"
  conector?: string;
  itens: { nome: string; cor: string; tecido?: Tecido; em: number }[];
};

// Fileira de cores que combinam com a peça (cada bolinha = a cor da peça + a outra cor)
export type Combina = { rotulo?: string; em: number; ate?: number; cores: string[] };

// Linha de medida de alfaiate entre dois pontos, com a etiqueta do que foi dito
export type Medida = { de: Ponto; ate: Ponto; em: number; texto: string };

// Recorte aproximado do próprio vídeo num ponto (o relógio no pulso, um botão, o tecido)
export type Detalhe = { ponto: Ponto; em: number; zoom?: number; rotulo?: string };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ——————————————————————— os 11 blocos universais ———————————————————————

// Abertura: capa de revista. A foto entra emoldurada e o título (palavras da fala) se monta
// palavra por palavra na faixa de cima; `destaque` = trecho em itálico índigo, sublinhado.
// `em` (opcional, nos quatro blocos de texto falado): quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string };

// Lista sem ordem (motivos, erros, dicas, sinais): o cartão de catálogo com uma linha por item,
// numeral índigo à esquerda; cada linha ganha tinta na palavra dela. 2 a 5 itens.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; layout?: Faixa };

// Sequência em ordem: a fita métrica de alfaiate se desenrola e um pino marca cada passo,
// com a linha fina até o nome. 2 a 5 itens.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; layout?: Faixa };

// Número que conta até `valor` a partir de `em` (numeral índigo grande), com o rótulo em caixa
// alta e a fita métrica embaixo, onde um pino corre até a medida.
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
  // "capa": o número vira a manchete da capa (para o primeiro momento do vídeo)
  layout?: Faixa | "capa";
};

// Dois lados: dois cartões com amostra de tecido, ligados por "×" ou por uma seta.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  layout?: Faixa;
};

// Gráfico de catálogo: barras = tiras de tecido que se estendem; linha = traço fino com pinos;
// pizza = amostra redonda em fatias. Sem números ditos: `tendencia` + `ilustrativo: true`.
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  layout?: Faixa;
};

// Uma palavra ou frase curta que bate forte, em itálico grande num cartão; "alerta" usa o vinho.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  layout?: Lateral;
};

// Termo e significado: o termo em itálico, um pino com linha fina leva ao significado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; layout?: Faixa };

// Frase de efeito: chega a lápis num cartão e cada palavra ganha tinta quando é dita;
// `destaque` = trecho em índigo; `risco` = trecho riscado quando é dito.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // nome antigo de `destaque` (continua valendo)
  enfase?: string;
  // caixa alta pequena em cima da frase (opcional)
  rotulo?: string;
  layout?: Lateral;
};

// Pergunta para quem assiste: a pergunta se monta e as opções chegam como etiquetas penduradas.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number; layout?: Lateral };

// Fechamento: etiqueta de roupa pendurada, com a chamada, o ícone e a assinatura.
export type Cta = Base & {
  tipo: "cta";
  // a chamada (até ~40 caracteres; quebra em até 3 linhas)
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato do texto em itálico índigo, sublinhado
  destaque?: string;
  // quando o texto começa a ser dito (padrão: `de`); `textoEm` é o nome antigo
  em?: number;
  textoEm?: number;
  // segunda linha menor (até ~30 caracteres) e quando entra
  detalhe?: string;
  detalheEm?: number;
  // quando a assinatura (marca) entra
  assinaturaEm?: number;
  // onde o cordão da etiqueta prende na roupa (padrão: "gola"); fora da foto, sem cordão
  ponto?: Ponto;
};

// ——————————————————————— a assinatura ———————————————————————

// Capa (o nome antigo da abertura, com as linhas escolhidas à mão)
export type Capa = Base & {
  tipo: "capa";
  // palavras da fala, na ordem em que são ditas; 2 ou 3 linhas (a primeira fica grande)
  linhas: string[];
  // trecho exato que fica em itálico índigo, sublinhado
  enfase?: string;
  // rótulo pequeno do cabeçalho durante a capa
  rotulo?: string;
  em?: number;
};

// Peça: a página de catálogo. A foto desloca para um lado, o numeral e o nome entram na coluna
// de papel e o cartão (ficha) desliza ao lado com o que foi dito do item. Serve para qualquer
// item de uma lista numerada: uma peça de roupa, um motivo, um erro, um produto, um hábito.
export type Peca = Base & {
  tipo: "peca";
  numero?: number;
  // total de itens do vídeo (para "de 03"); padrão: quantas `peca` o plano tem
  total?: number;
  layout?: Layout;
  // caixa alta pequena acima do numeral ("peça", "motivo", "erro", "passo"); padrão: nenhuma
  rotulo?: string;
  // nome do item e complemento em itálico, com as palavras da fala
  nome: string;
  nomeEm: number;
  complemento?: string;
  complementoEm?: number;
  // pino com linha fina até o cartão, encostado num ponto do corpo (roupa ou acessório que a
  // pessoa usa). Sem `ponto`, sem pino.
  ponto?: Ponto;
  pontoEm?: number;
  // amostra de tecido: cor e textura; preenche no `em`
  amostra?: { cor: string; tecido?: Tecido; em: number };
  // linhas do cartão (até 3; 1 ou 2 se houver `variantes` ou `combina`)
  atributos?: Atributo[];
  variantes?: Variantes;
  combina?: Combina;
  // preço (ou outro valor curto dito); entra no `em`
  preco?: { valor: string; em: number };
  medida?: Medida;
  detalhe?: Detalhe;
};

// Colagem: o conjunto montado como página de revista. A foto vira uma impressão girada e os
// itens chegam em volta como recortes (amostra, recorte do vídeo ou o nome escrito).
export type Colagem = Base & {
  tipo: "colagem";
  // `peca`: o número de uma peça anterior (reaproveita amostra/detalhe e nome);
  // ou um item novo: `nome` (com `cor`/`tecido`, vira amostra; sem eles, o nome escrito no recorte)
  itens: { em: number; peca?: number; nome?: string; cor?: string; tecido?: Tecido }[];
  // linha menor acima do título, com as palavras da fala
  subtitulo?: string;
  // título que se monta palavra por palavra (palavras da fala)
  titulo: string;
  // trecho exato do título em itálico índigo, sublinhado
  enfase?: string;
  // quando o subtítulo/título começa a ser dito (padrão: `de`)
  em?: number;
  // texto do cabeçalho à direita durante a colagem (padrão: a área da marca)
  folio?: string;
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
  | Frase
  | Pergunta
  | Cta
  | Capa
  | Peca
  | Colagem;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho (1920 = 9:16, fixado pelo modelo.json)
  videoAltura?: number;
  // centro do rosto (entre os olhos e a ponta do nariz) em frações do quadro; `rastro` vem do cortar.mjs
  rosto: { x: number; y: number };
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  // texto da esquerda do cabeçalho (o nome da "revista"; padrão "Lookbook")
  cabecalho?: string;
  // pontos do corpo, em frações do vídeo da pessoa; substitui os padrões de mesmo nome
  // (veja PONTOS_PADRAO em src/pessoa.ts). Confira com `stills.mjs --guias`.
  pontos?: Record<string, { x: number; y: number }>;
  // aproximação da foto nas páginas "direita"/"esquerda" (padrão 1)
  zoomLado?: number;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
