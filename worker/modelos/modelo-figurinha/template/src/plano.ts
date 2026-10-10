// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática do Figurinha: um álbum de figurinhas montado na fala. Quatro "cenas", e quem muda de
// lugar é a pessoa:
// - quadro cheio: a pessoa inteira, com etiquetas de papel coladas na altura do peito
//   (abertura, numero, destaque, frase, pergunta, cta);
// - página do álbum: a pessoa vira a figurinha especial no alto (moldura com borda e brilho só no
//   desenho), o título fica ao lado dela e o conteúdo é colado embaixo, como figurinhas
//   (topicos, passos, comparacao, grafico, definicao);
// - álbum (a assinatura): cada item é uma figurinha ilustrada que chega na cartela, descola, leva o
//   carimbo e vai para a sua casa na fileira do álbum; um vira-lata caramelo reage;
// - figurinha especial grande: a figurinha da pessoa cresce no meio da página (o conselho principal).
// Entre duas páginas, a página vira: a nova desliza por cima da velha, com sombra de papel.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `album` (e `especial`).

import type { Fundo } from "./tema";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (normalmente não precisa)
  legenda?: boolean;
};

// Ilustrações prontas (a traço, cor chapada). "texto" = figurinha só com uma palavra/número grande.
export type Desenho =
  // comida e cuidado (o demo)
  | "chocolate"
  | "uva"
  | "cebola-alho"
  | "cebola"
  | "alho"
  | "abacate"
  | "cafe"
  | "osso"
  | "tigela"
  | "remedio"
  | "vacina"
  | "pata"
  | "coracao"
  | "telefone"
  // de qualquer assunto
  | "moeda"
  | "dinheiro"
  | "cofre"
  | "grafico-sobe"
  | "grafico-cai"
  | "alerta"
  | "lupa"
  | "relogio"
  | "calendario"
  | "lampada"
  | "livro"
  | "documento"
  | "calculadora"
  | "casa"
  | "alvo"
  | "cadeado"
  | "raio"
  | "dado"
  | "celular"
  | "balao"
  | "estrela"
  | "trofeu"
  | "pessoa"
  | "maleta"
  | "carrinho"
  | "check"
  | "xis"
  | "texto";

// Reações do cachorro
export type Reacao = "atento" | "curioso" | "querendo" | "susto" | "feliz" | "preocupado";

export type Carimbo = "nao" | "pode" | "nenhum";

// Item de lista (topicos, passos). `desenho` (opcional) = ilustração pequena na figurinha; sem ele,
// a figurinha leva o número do item.
export type ItemDeLista = { texto: string; em: number; detalhe?: string; desenho?: Desenho; icone?: Desenho };

// ——— quadro cheio: etiquetas de papel na altura do peito ———

// Abertura: o título se escreve palavra por palavra numa etiqueta no peito. Um número no começo
// ("3 alimentos…") vira um selo redondo no canto. `destaque` = trecho em framboesa.
// `em` (opcional, também em frase, pergunta e cta): quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  // nome antigo do texto (planos antigos)
  titulo?: string;
  destaque?: string;
  em?: number;
  // quando o cachorro espia por cima da etiqueta (padrão: na última palavra)
  caoEm?: number;
};

// Número que conta até `valor` a partir de `em`, grande, numa etiqueta (formato pt-BR).
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

// Uma palavra ou frase curta que bate forte. "alerta" = um carimbo framboesa batido no peito;
// "chave" (padrão) = a figurinha brilhante (índigo, com o brilho que passa).
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Frase de efeito numa etiqueta; `risco` = trecho riscado em framboesa quando é dito.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // figurinha ilustrada que cola no canto da etiqueta (opcional)
  desenho?: Desenho;
};

// Pergunta para quem assiste: selo "?" e a pergunta; `opcoes` (2 a 4) colam como figurinhas.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type IconeDeChamada = "salvar" | "seguir" | "comentar" | "link" | "enviar";

// Fechamento: figurinha de chamada com o ícone, a chamada e a assinatura (nome e área).
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // uma segunda figurinha de chamada, menor ("Manda pra quem tem cachorro")
  segunda?: { texto: string; em: number; icone?: IconeDeChamada };
  // formato antigo (planos antigos): 1 ou 2 chamadas
  chamadas?: { em: number; texto: string; icone?: IconeDeChamada }[];
};

// ——— página do álbum: a pessoa vira a figurinha especial no alto ———

// Lista sem ordem (2 a 5): cada item é uma figurinha colorida que cola na sua casa da página.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemDeLista[] };

// Sequência em ordem (2 a 5): selos numerados ligados por uma trilha que se desenha passo a passo.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemDeLista[] };

// Dois lados, duas figurinhas uma sobre a outra; selo VS (contra) ou seta (antes-depois);
// errado-certo leva os carimbos ✗ e ✓; o vencedor leva o ✓ no `vencedorEm`.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico desenhado a tinta numa figurinha de papel quadriculado: barras (colunas coloridas que
// crescem), linha (o traço passa de selo em selo), pizza (fatias que colam). Sem números ditos:
// `tendencia` (sobe, cai, oscila) com a etiqueta "ilustrativo".
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

// Termo na frente de uma figurinha grande; no significado, ela vira e o verso mostra o que é.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// ——— a assinatura ———

export type Item = {
  // quando o nome do item começa a ser dito: a cartela chega e a figurinha descola
  em: number;
  // nome na figurinha, como foi dito ("Uva e uva-passa", "Impulso"); `texto` também vale
  nome: string;
  // ilustração da figurinha (padrão: o número do item, grande)
  desenho?: Desenho;
  // só para desenho "texto": a palavra, sigla ou número grande (até 6 caracteres: "12%", "PGBL")
  simbolo?: string;
  // nome antigo do símbolo (planos antigos), ou o nome do item quando `nome` falta
  texto?: string;
  // fundo chapado da figurinha (padrão: o do desenho)
  fundo?: Fundo;
  // o porquê, fiel à fala (até ~40 caracteres; entra palavra por palavra)
  motivo?: string;
  // trecho exato do motivo em framboesa
  destaque?: string;
  // quando o carimbo bate (a palavra que fecha o motivo)
  carimboEm?: number;
  // carimbo só deste item (padrão: o do álbum) e o texto dele ("RISCO", "SEM LIMITE")
  carimbo?: Carimbo;
  textoCarimbo?: string;
  // reação do cachorro quando a figurinha chega (padrão: "curioso")
  reacao?: Reacao;
};

// Álbum: a lista ilustrada. A pessoa vira a figurinha especial no alto; cada item é uma figurinha
// que chega, descola, leva o carimbo e vai para a fileira do álbum (2 a 5 itens).
export type Album = Base & {
  tipo: "album";
  itens: Item[];
  // carimbo de cada figurinha: "nao" (✗ NÃO PODE, padrão), "pode" (✓ PODE) ou "nenhum"
  carimbo?: Carimbo;
  // texto do carimbo, se quiser outro (até ~14 caracteres: "EVITE", "RISCO", "DEDUZ")
  textoCarimbo?: string;
  // lado da pessoa em cada item ("esquerda"/"direita"); padrão: alterna a cada item
  lados?: ("esquerda" | "direita")[];
};

// Especial: a figurinha da pessoa cresce no meio da página, com uma etiqueta na altura do peito
// (o conselho principal). Logo depois de um álbum, a fileira dele continua embaixo.
export type Especial = Base & {
  tipo: "especial";
  // linha pequena de cima, falada ("Se ele comer,")
  apoio?: string;
  // a frase principal, falada ("procure um veterinário")
  texto: string;
  destaque?: string;
  em?: number;
  // quando o cachorro se alivia (padrão: na última palavra do texto)
  alivioEm?: number;
};

export type Momento =
  | Abertura
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
  | Album
  | Especial;

export type TipoDeMomento = Momento["tipo"];

// Momentos da página do álbum (a pessoa vira a figurinha especial no alto, ao lado do título)
export const NA_PAGINA: TipoDeMomento[] = ["topicos", "passos", "comparacao", "grafico", "definicao"];
export const naPagina = (m: Momento) => NA_PAGINA.includes(m.tipo);

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio). O modelo.json fixa o recorte 9:16.
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa das etiquetas de quadro cheio (px, no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: faixa da figurinha especial e assinatura do fechamento
  marca: { nome: string; area: string };
  // "cachorro" (padrão: o vira-lata caramelo, mascote do álbum em qualquer assunto) ou "nenhum"
  mascote?: "cachorro" | "nenhum";
  // ajuste do enquadramento da pessoa dentro da figurinha especial: zoom (padrão 1,6) e altura do
  // rosto na caixa (0 = topo, 1 = base; padrão 0,36). Use se a pessoa aparecer cortada ou pequena.
  figurinhaDaPessoa?: { zoom?: number; rostoNaCaixa?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
