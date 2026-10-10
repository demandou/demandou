// Formato do plano de edição do modelo Pulso. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
// Todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// A gramática do Pulso: o vídeo inteiro é um app de treino com um relógio esportivo (fictícios, sem
// marca). A pessoa troca de lugar a cada momento (o template decide, pelo tipo):
// - tela cheia, com um cartão branco no peito: abertura/gancho, numero, cta;
// - o visor redondo do relógio, com o anel acendendo em volta: zonas, destaque (relógio grande),
//   zona, definicao, pergunta, grafico em pizza (relógio no alto), topicos (relógio menor);
// - o card de cima, com o painel embaixo: frase, comparacao, grafico (barras e linha), divisao;
// - o avatar no canto de um mapa: rota, passos.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack. A assinatura
// deste modelo (o relógio e o app) são os tipos próprios: zonas, zona, divisao e rota.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (só onde há lugar)
  legenda?: boolean;
};

export type Item = { texto: string; em: number; detalhe?: string; detalheEm?: number };

// ——— tela cheia: cartão branco no peito ———

// Abertura: título que se monta palavra por palavra no cartão, com o traçado do pulso batendo a
// cada palavra; `destaque` = trecho exato na cor de ênfase (azul). `em`: quando o texto começa a ser
// dito (padrão: `de`). `rotulo`: letreiro pequeno em cima (opcional). `alertaEm`: um batimento de
// alerta vermelho e alto nesta palavra (opcional).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string; alertaEm?: number };

// O nome antigo da abertura neste modelo (continua valendo, mesmo componente).
export type Gancho = Base & { tipo: "gancho"; texto: string; destaque?: string; em?: number; rotulo?: string; alertaEm?: number };

// Número: a leitura grande do app. Conta até `valor` a partir de `em`, com uma régua das cinco zonas
// que enche junto. Formato pt-BR (83.000; 1,5). `ilustrativo: true` põe a etiqueta.
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
  // cor da leitura (zona 1–5; padrão 2)
  zona?: number;
};

// Fechamento: o cartão de ação sobe no peito; o botão afunda e muda ("Salvar" → "Salvo") e o texto
// se monta na fala. `titulo`/`acao`/`acaoEm`/`rotulo` são os nomes antigos (continuam valendo).
export type Cta = Base & {
  tipo: "cta";
  texto?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // letreiro em cima (padrão "Próximo passo")
  rotulo?: string;
  // quando o botão é apertado (padrão: logo no começo)
  acaoEm?: number;
  // nomes antigos
  titulo?: string;
  acao?: "salvar" | "seguir" | "comentar" | "link";
};

// ——— no relógio ———

// Lista sem ordem (motivos, erros, dicas): o anel se divide em tantas partes quantos itens e cada
// parte acende quando o item é dito; embaixo do relógio, as linhas da lista entram uma a uma.
// `zona`: cor da lista (2 = neutro, 3 = acertos, 4 = problemas, 5 = riscos).
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[]; zona?: number };

// Destaque: o anel inteiro acende numa cor só, o ponteiro corre até o fim e o coração acelera; a
// frase bate embaixo. "alerta" = vermelho; "chave" = azul (padrão).
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: o termo acende como uma zona em foco e o balão de fala (que espera "digitando")
// ganha o significado. `zona` (opcional) = qual zona do anel acende (padrão 2).
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number; zona?: number };

// Pergunta para quem assiste: chega como uma mensagem no relógio (balão "digitando" → a pergunta) e
// as opções viram botões de resposta rápida que acendem quando ditos (2 a 4).
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// ——— card de cima, painel embaixo ———

// Frase de efeito: monta-se palavra por palavra sobre o traçado do pulso. `destaque` = trecho na cor
// da zona; `risco` = trecho riscado em vermelho quando é dito (em `riscoEm`). `enfase` = nome antigo
// do destaque.
export type Frase = Base & {
  tipo: "frase";
  texto: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  enfase?: string;
  zona?: number;
};

// Comparação: dois monitores lado a lado, cada um com o rótulo, o texto e o seu traçado de pulso.
// O vencedor ganha o ✓ e um batimento firme; o outro, o ✗ e o traçado que se apaga.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico no painel do app. barras = colunas de casas que enchem; linha = o gráfico de frequência
// com as faixas das zonas ao fundo; pizza = o anel do relógio dividido nas proporções.
// Com `dados` (números DITOS, 2 a 6), tudo é proporcional; sem `dados`, `tendencia` desenha a forma
// e a etiqueta "ilustrativo" aparece.
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // cor (zona 1–5); padrão: sobe/barras/linha = 2, cai = 4
  zona?: number;
};

// ——— no mapa ———

// Passos em ordem: uma rota se desenha no mapa, de parada em parada; cada parada (numerada) acende
// quando o passo é dito, e a lista embaixo acompanha. `zona` = cor da rota (padrão 2).
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[]; zona?: number };

// ——— a assinatura (tipos próprios do Pulso) ———

// O relógio: a pessoa vira o visor redondo; o anel das cinco zonas acende zona por zona e o ponteiro
// sobe junto; embaixo, o título se monta palavra por palavra. Uma escala de 1 a 5 de qualquer coisa
// (intensidade, risco, dificuldade, energia, maturidade).
export type Zonas = Base & {
  tipo: "zonas";
  // título embaixo do relógio, palavras faladas (até ~40 caracteres)
  titulo: string;
  // quando a zona 1 acende (padrão: 0,45 s depois do `de`); as outras seguem a cada `passo` s
  acendeEm?: number;
  passo?: number;
  // régua das zonas embaixo do título: rótulos das pontas (padrão ["baixo", "alto"]); null = sem régua
  escala?: [string, string] | null;
};

// Uma zona em foco: o relógio sobe, a zona escolhida acende (as outras apagam) e o ponteiro desce até
// ela; embaixo, o nome da zona, o balão de fala com o que ela significa e até 2 leituras que contam.
export type Zona = Base & {
  tipo: "zona";
  // 1 a 5
  zona: number;
  // quando a zona acende (a palavra que a nomeia)
  em: number;
  // nome grande (padrão "Zona N"); pode ser qualquer termo ("Bull market", "Fase 3")
  titulo?: string;
  // o balão de fala com o significado, até ~30 caracteres
  balao?: { texto: string; em: number };
  // leituras que contam quando a zona acende (até 2)
  leituras?: Leitura[];
  // etiqueta "valores de exemplo" ao lado das leituras (padrão: true)
  exemplo?: boolean;
};

export type Leitura = {
  // "bpm" conta um número inteiro; "pace" conta minutos:segundos ("6:20"); "numero" conta qualquer
  // número em pt-BR com a `unidade` que você quiser (padrão)
  tipo?: "bpm" | "pace" | "numero";
  valor: string | number;
  // unidade ao lado ("bpm", "/km", "%", "dias"); padrão: bpm → "bpm", pace → "/km"
  unidade?: string;
  // texto pequeno embaixo ("frequência", "ritmo", "por mês"), até ~14 caracteres
  rotulo?: string;
  casas?: number;
};

// A divisão: a pessoa vira o card de cima; embaixo, uma barra de casas que se enche com a parte maior,
// depois com a menor, e se divide; as porcentagens contam. Qualquer "a maioria × uma parte".
// `ilustrativo: true` = proporção de exemplo (sem porcentagem na tela, com a etiqueta).
export type Divisao = Base & {
  tipo: "divisao";
  // letreiro em cima da barra (até ~24 caracteres); sem ele, nada
  rotulo?: string;
  // etiqueta que acende no canto (ex.: "Zona 2", "Longo prazo"), na palavra que a nomeia
  etiqueta?: { texto: string; em: number; zona?: number };
  // nome antigo da etiqueta: "Zona N"
  zona?: { numero: number; em: number };
  // número de casas da barra (padrão 10)
  casas?: number;
  // o que cada casa representa ("cada casa é um treino"); sem ele, nada
  unidade?: string;
  ilustrativo?: boolean;
  // exatamente duas partes: a maior e a menor. `pct` soma 100 (sem `pct`: 70/30 ilustrativo).
  partes: Parte[];
};

export type Parte = {
  pct?: number;
  // rótulo embaixo da porcentagem, palavras faladas, até ~22 caracteres
  texto: string;
  // cor da parte (zona 1–5)
  zona: number;
  // quando a parte fecha (a palavra do número ou do rótulo)
  em: number;
  // quando as casas começam a encher (padrão: 0,6 s antes do `em`)
  encheEm?: number;
  // quando o rótulo acende (padrão: procura as palavras na fala)
  textoEm?: number;
};

// A rota: a pessoa vira o avatar no canto de um mapa; um ou dois trechos se desenham na cor da zona,
// na velocidade do ritmo (zona 1–2 = traço lento e longo; 3–5 = rápido e curto), e as leituras
// contam. Qualquer "devagar × rápido", "o caminho longo × o atalho", "rotina × pico".
export type Rota = Base & {
  tipo: "rota";
  trechos: TrechoDeRota[];
  // etiqueta "exemplo" (padrão: true quando há leituras)
  exemplo?: boolean;
};

export type TrechoDeRota = {
  // rótulo do trecho, palavras faladas, até ~26 caracteres
  texto: string;
  zona: number;
  // quando o traço começa (a primeira palavra do trecho)
  em: number;
  // quando o traço termina (padrão: 1,3 s depois do `em` na zona 1–2; 0,6 s na zona 3–5)
  ate?: number;
  // leituras do trecho: pace e bpm (de corrida) ou uma leitura livre
  pace?: string;
  bpm?: number;
  leitura?: { valor: string; unidade?: string };
};

export type Momento =
  | Abertura
  | Gancho
  | Numero
  | Cta
  | Topicos
  | Destaque
  | Definicao
  | Pergunta
  | Frase
  | Comparacao
  | Grafico
  | Passos
  | Zonas
  | Zona
  | Divisao
  | Rota;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = 9:16; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` (do cortar.mjs) vem junto no JSON
  rosto: { x: number; y: number };
  // o motor preenche (topo = logo abaixo do queixo): os cartões do peito começam ali
  zona?: { topo: number; altura: number };
  // assinatura no alto: nome e área ("Tiago" · "Corrida")
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
