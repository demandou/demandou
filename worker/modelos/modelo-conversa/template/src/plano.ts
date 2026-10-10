// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// O vídeo inteiro é uma conversa num app de mensagens (sem marca). Dois estados:
// - Quadro cheio: a pessoa inteira, uma pílula no topo e UMA mensagem na altura do peito
//   (abertura, numero, destaque, frase, pergunta, cta e o balao da assinatura).
// - Tela do app: a pessoa vira uma mensagem de vídeo redonda embaixo da conversa; as mensagens chegam
//   com "digitando…" no ritmo da fala e a conversa rola (topicos, passos, definicao, grafico,
//   comparacao e a assinatura: conversa e contraste).
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `conversa` + `contraste` (+ `balao`, a mensagem no peito).

// quem manda a mensagem: "eu" = a pessoa do vídeo (balão no acento, à direita);
// "outro" = o outro lado da conversa (balão ardósia, à esquerda). "cliente" é o nome antigo de "outro".
export type Quem = "eu" | "outro" | "cliente";

// desenhos a traço para o cartão e para as condições
export type Desenho =
  | "presente"
  | "caixa"
  | "sacola"
  | "agenda"
  | "curso"
  | "frete"
  | "relogio"
  | "desconto"
  | "garantia"
  | "documento"
  | "grafico"
  | "moeda"
  | "lampada"
  | "alvo"
  | "folha"
  | "coracao"
  | "casa";

export type Reacao = "coracao" | "joinha" | "check";

// Uma mensagem da conversa.
export type Mensagem = {
  de: Quem;
  // quando a mensagem aparece (o "digitando…" vem antes)
  em: number;
  // texto (padrão), preço/valor, cartão, confirmação (aviso do sistema com ✓), ou só um
  // "digitando…" que some (vácuo). "pagamento" é o nome antigo de "confirmacao".
  tipo?: "texto" | "preco" | "cartao" | "confirmacao" | "pagamento" | "digitando";
  texto?: string;
  // segundos de "digitando…" antes de a mensagem aparecer (padrão 0,6; 0 = chega direto)
  digitando?: number;
  // tipo "digitando": quando o "digitando…" some sem virar mensagem
  ate?: number;
  // "Visto" embaixo de uma mensagem sua
  vistoEm?: number;
  // a mensagem sua perde a cor (foi ignorada / deu errado)
  esfriaEm?: number;
  // reação que pousa no canto do balão
  reacao?: { em: number; icone?: Reacao };
  // tipo "preco" e "confirmacao": o valor ("R$ 197", "3 kg", "Nota 10")
  valor?: string;
  // tipo "preco": a condição que chega presa ao valor ("Pagando hoje, frete grátis")
  condicao?: { em: number; texto: string; desenho?: Desenho };
  // tipo "cartao": desenho, título e uma linha com ✓
  desenho?: Desenho;
  titulo?: string;
  linha?: string;
  linhaEm?: number;
  // hora mostrada no balão (padrão: a do contato)
  hora?: string;
};

// A mensagem fixada no topo da conversa (no quadro cheio, vira a pílula do topo)
export type Fixada = {
  texto: string;
  // etiqueta antes do texto: "1/3", "Errado", "Dica"
  rotulo?: string;
  // "errado" = cinza com ✕; "certo" = acento
  tom?: "errado" | "certo";
};

type Base = {
  de: number;
  ate: number;
  // true = a legenda (o campo de texto que se digita) continua aparecendo durante este momento
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string };

// ———————————————— os 11 blocos universais ————————————————

// Abertura (quadro cheio): o título se escreve palavra por palavra num balão seu no peito;
// `destaque` = trecho exato que "trava" (fundo escuro, letra no acento) quando é dito.
// `em` (opcional, também em frase, pergunta e cta): quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// Lista sem ordem (tela do app): cada item chega como uma mensagem sua, no seu `em`, com um
// "digitando…" curto; `titulo` vira a mensagem fixada no topo. 2 a 5 itens.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem (tela do app): cada passo chega como mensagem com o número numa bolinha;
// o passo anterior ganha ✓ quando o próximo é dito; a fixada conta "1/3 → 2/3 → 3/3". 2 a 5 itens.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número (quadro cheio): um balão seu com o rótulo pequeno e o valor grande contando até `valor`
// a partir de `em` (pt-BR). `ilustrativo` mostra a etiqueta.
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

// Dois lados (tela do app): duas faixas, uma embaixo da outra, cada uma com o rótulo e um balão;
// × no meio (`contra`) ou ↓ (`antes-depois`, `errado-certo`). O lado que perde esfria para cinza
// com ✕; o que ganha acende com ✓ (em `vencedorEm`; no `errado-certo`, quando o certo é dito).
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico (tela do app): um cartão compartilhado na conversa com o gráfico desenhado a traço.
// Com `dados` (números DITOS, 2 a 6): barras deitadas, linha ou rosca proporcionais, cada dado no seu
// `em`. Sem `dados`: uma curva que sobe, cai ou oscila, com a etiqueta "ilustrativo".
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

// Destaque (quadro cheio): uma palavra ou frase curta, grande, num balão no peito.
// "chave" = balão no acento; "alerta" = balão frio (cinza) com ✕, a cor do que dá errado neste estilo.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Definição (tela do app): o termo chega como mensagem em negrito; o significado chega como
// RESPOSTA a ela (com o termo citado em cima, como no app).
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase (quadro cheio): se escreve palavra por palavra num balão seu; `destaque` trava no escuro;
// `risco` = trecho riscado quando é dito (em `riscoEm`).
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste (quadro cheio): o balão se escreve na fala e as `opcoes` entram como
// respostas rápidas (botões do app), cada uma na sua palavra. 2 a 4 opções.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento (quadro cheio): um balão seu com a chamada, escrito palavra por palavra, e um botão do app
// que é tocado e muda de estado. `icone`: salvar, seguir, comentar ou link ("Saiba mais").
// `destaque` = trecho que trava no escuro. `acao` é o nome antigo de `icone` (aceita "compartilhar").
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  acao?: "salvar" | "seguir" | "comentar" | "compartilhar" | "link";
  destaque?: string;
  em?: number;
  toqueEm?: number;
  // o contato reage ao balão do fechamento (fecha o vídeo com um último movimento)
  reacao?: { em: number; icone?: Reacao };
};

// ———————————————— a assinatura ————————————————

// Balão (quadro cheio): UMA mensagem de qualquer lado na altura do peito — a pergunta do outro lado
// que abre o vídeo, o cartão mandado, a resposta que chega. Entra na conversa seguinte.
export type Balao = Base & {
  tipo: "balao";
  mensagem: Mensagem;
  // pílula do topo: um passo (como a fixada); sem ela, a pílula mostra o contato (nome + status)
  fixada?: Fixada;
  // o contato fica offline ("some")
  offlineEm?: number;
  // a mensagem entra na conversa e aparece nela quando a pessoa volta a ser bolha (padrão: true)
  naConversa?: boolean;
};

// A tela de conversa: a pessoa vira a bolha de vídeo e as mensagens chegam uma a uma
export type Conversa = Base & {
  tipo: "conversa";
  // true = começa uma conversa nova (a anterior rola para fora); false = continua a anterior
  nova?: boolean;
  fixada?: Fixada;
  mensagens: Mensagem[];
  offlineEm?: number;
};

// Duas faixas, uma embaixo da outra: o caminho que esfria × o que acende
export type Lado = {
  // título com palavras faladas ("Resposta seca", "Correr o risco")
  titulo: string;
  // UMA mensagem curta que "vira" o desfecho; entra logo depois do título
  mensagens: Mensagem[];
  // quando a seta se desenha (a palavra "vira", "dá", "vai"…); padrão: 0,35 s antes do desfecho
  viraEm?: number;
  // o desfecho, na palavra dita. "ruim" = balão vazio tracejado (ninguém responde); "bom" = cartão
  // confirmado com ✓ (com `valor` e `rotulo` opcionais). "vacuo"/"venda" são os nomes antigos.
  resultado: { em: number; texto: string; tipo: "ruim" | "bom" | "vacuo" | "venda"; valor?: string; rotulo?: string };
};

export type Contraste = Base & {
  tipo: "contraste";
  // `esquerda` = a faixa de cima; `direita` = a de baixo (qualquer uma pode ser a "bom")
  esquerda: Lado;
  direita: Lado;
  // quando cada faixa entra (padrão: a de cima no começo; a de baixo 0,6 s depois do primeiro desfecho)
  esquerdaEm?: number;
  direitaEm?: number;
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
  | Balao
  | Conversa
  | Contraste;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho (1920 = 9:16; 1440 = 3:4). O modelo.json fixa 9:16 em gravação vertical.
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa dos balões no quadro cheio (px): abaixo do queixo
  zona?: { topo: number; altura: number };
  // assinatura do fechamento (nome + área)
  marca: { nome: string; area: string };
  // o outro lado da conversa: nome no cabeçalho e hora dos balões ("Você", "Seguidor", "Cliente")
  contato?: { nome: string; hora?: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
