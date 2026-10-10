// Formato do plano de edição do Anatomia. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Blocos universais (motor/BLOCOS.md, iguais em todos os modelos): abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta.
// Assinatura do Anatomia: anatomia (o rosto em ilustração médica 2.5D, ou o esquema em traço fino,
// com as estruturas que acendem na palavra).
// Efeitos próprios: virada (a pergunta + a linha de luz que troca a roupa ou o cenário), mito (o
// cabeçalho "X não faz A, faz B"), corte (o bloco de tecido em camadas), linhaDoTempo (a curva do efeito).

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão do Anatomia: true na
  // virada, no mito, na anatomia, no corte e na linha do tempo; false nos blocos que escrevem a fala)
  legenda?: boolean;
};

// ——— universais ———

// Título que se monta palavra por palavra na fala. `destaque` = trecho exato em azul clínico (com um
// traço que se desenha embaixo). `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type ItemFalado = { texto: string; em: number; detalhe?: string };
// 2 a 5 itens sem ordem: rótulos de prancha (ponto, linha-guia e nome)
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemFalado[] };
// 2 a 5 itens EM ORDEM: nós numerados ligados por um nervo; o pulso de luz corre até o item dito
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemFalado[] };

// O número conta até `valor` a partir de `em` (pt-BR), num mostrador clínico.
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

export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, palavra por palavra. `destaque` = azul; `risco` = trecho riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

// ——— assinatura: anatomia ———

// Textura/cor de uma camada (corte) ou de uma região do esquema.
export type Material =
  | "pele"
  | "derme"
  | "gordura"
  | "musculo"
  | "tendao"
  | "osso"
  | "disco"
  | "esmalte"
  | "dentina"
  | "polpa"
  | "gengiva"
  | "nervo"
  | "neutro";

// Uma estrutura citada na fala: acende na palavra, ganha o rótulo e a função.
export type Estrutura = {
  // no rosto: um id do catálogo (references/plano.md): frontal, corrugador, procero, orbicularOlho,
  // orbicularBoca, zigomaticoMaior, zigomaticoMenor, levantadorLabio, levantadorAsa, nasal, risorio,
  // depressorAngulo, depressorLabio, mentual, masseter, temporal (músculos) ou testa, glabela,
  // pesDeGalinha, olheira, palpebra, nariz, macas, bochecha, sulco, labios, queixo, mandibula, pele
  // (áreas). No esquema: qualquer id curto.
  id: string;
  // o nome na tela (o que a pessoa disse: "Frontal", "Corrugador", "Liquidez")
  rotulo: string;
  // a palavra que nomeia a estrutura: ela acende (com fibras correndo) e o rótulo entra
  em: number;
  // a palavra que nomeia a REGIÃO antes ("na testa", "entre as sobrancelhas"): a câmera vai até lá,
  // a retícula marca a área e a estrutura pré-acende
  regiaoEm?: number;
  // o que ela faz, com as palavras da fala ("linhas horizontais", "o famoso")
  funcao?: string;
  funcaoEm?: number;
  // número ou sigla curta em destaque (≤ 4 caracteres), SÓ se for dito ("11" quando ele diz "onze")
  grande?: string;
  grandeEm?: number;
  // rugas/marcas da região aparecem quando a função (ou o grande) é dita. Padrão: true quando a
  // estrutura tem rugas no catálogo
  rugas?: boolean;
  // lado do rótulo (padrão: automático)
  lado?: "esquerda" | "direita";
  // só no esquema: a textura da região (padrão: "neutro")
  material?: Material;
};

export type Anatomia = Base & {
  tipo: "anatomia";
  // "rosto" (padrão): o rosto em ilustração médica 2.5D, com pele, músculos e rugas.
  // "esquema": um corpo em traço fino dividido em regiões (as estruturas), para qualquer assunto
  // (modo ilustrativo: cripto, finanças, rotina…) ou para partes do corpo fora do rosto
  // (coluna, dente, joelho: use `material` em cada região).
  parte?: "rosto" | "esquema";
  // nome do que está sendo dissecado (só no esquema, só se for dito): aparece no alto da prancha
  titulo?: string;
  tituloEm?: number;
  // quando a camada de músculos aparece por baixo da pele (a varredura), ex.: na palavra "músculo".
  // Padrão: um instante antes da primeira estrutura que é músculo (áreas da pele não revelam)
  musculosEm?: number;
  // "o músculo que faz a ruga": as estruturas contraem juntas e as rugas aparecem de leve
  contraiEm?: number;
  // ponto do vídeo de onde a ilustração "sai" (um quadro de anatomia na parede, um modelo na mesa…),
  // em frações do quadro do vídeo de trabalho; sem ele, a ilustração se desenha no lugar
  origem?: { x: number; y: number; tamanho?: number };
  // selo "conteúdo ilustrativo" (padrão: true)
  ilustrativo?: boolean;
  // 1 a 5 no rosto, 2 a 6 no esquema
  estruturas: Estrutura[];
};

// ——— efeitos próprios ———

// A pergunta do personagem ("E se eu fosse" + MÉDICO) e a virada com a linha de luz.
// Com `video` (a mesma gravação com a roupa/cenário trocados, gerada numa IA de vídeo e posta em
// public/), a linha de luz troca a roupa ao vivo. Sem ele, a linha de luz troca o layout: a pessoa vai
// para a moldura do consultório, sobre o papel clínico.
export type Virada = Base & {
  tipo: "virada";
  // a parte pequena, em cima ("E se eu fosse")
  texto: string;
  // a parte grande ("MÉDICO"), letra a letra na palavra
  nome: string;
  em?: number;
  nomeEm: number;
  // quando a linha de luz desce (padrão: `ate` − 0,6)
  trocaEm?: number;
  // vídeo da virada em public/ (mudo; a voz continua vindo do vídeo principal)
  video?: string;
  // em que segundo do vídeo de trabalho o `video` da virada começa (padrão 0)
  videoDe?: number;
};

// Cabeçalho "X não faz A, faz B": o errado entra numa etiqueta (ou na seringa) e é riscado; o certo
// entra em azul. Ex.: "Botox ≠ PREENCHE → relaxa o músculo".
export type Mito = Base & {
  tipo: "mito";
  sujeito: string;
  sujeitoEm?: number;
  errado: string;
  erradoEm: number;
  // o "não" (o sinal ≠ aparece)
  naoEm?: number;
  riscoEm?: number;
  certo: string;
  certoEm: number;
  complemento?: string;
  complementoEm?: number;
  // onde o errado aparece: "seringa" (procedimentos injetáveis) ou "etiqueta" (padrão)
  objeto?: "seringa" | "etiqueta";
};

// Camada do corte (de cima para baixo)
export type Camada = {
  material: Material;
  rotulo?: string;
  // estado antes e depois ("com ruga" → "lisa"; "contraído" → "descansa")
  estado?: string;
  novoEstado?: string;
  novoEstadoEm?: number;
  em?: number;
};
// O bloco de tecido em camadas, ampliado. Opcionalmente: o sinal correndo pelo nervo, o agente
// injetado que bloqueia o sinal, o músculo que relaxa e a pele que alisa.
export type Corte = Base & {
  tipo: "corte";
  // 2 a 5 camadas, de cima para baixo
  camadas: Camada[];
  // a superfície tem um vinco (ruga) que alisa em `alisaEm`
  vinco?: { alisaEm?: number };
  // o nervo no fundo, com pulsos de luz (instantes) e o bloqueio
  sinal?: { rotulo?: string; em: number; pulsos?: number[]; bloqueioEm?: number };
  // a agulha + as moléculas que se prendem na junção
  agente?: { rotulo: string; em: number; efeito?: string; efeitoEm?: number };
  // a camada de músculo relaxa (fibras finas)
  relaxaEm?: number;
  // texto da etiqueta do canto (padrão "corte ampliado")
  etiqueta?: string;
  // id da estrutura da anatomia anterior de onde o corte "mergulha" (zoom na região)
  regiao?: string;
};

// A curva do efeito no tempo: marcos no eixo, números-herói em cima (só os ditos).
export type Marco = {
  // rótulo do eixo ("3 dias", "3 meses")
  quando: string;
  em: number;
  // o que acontece ali ("começa a agir")
  texto?: string;
  textoEm?: number;
  // número-herói (dito): "3", "3–4"; com prefixo ("dia") e sufixo ("meses") pequenos
  valor?: string;
  valorEm?: number;
  prefixo?: string;
  sufixo?: string;
  // posição no eixo, de 0 a 1 (padrão: espaçados por igual)
  posicao?: number;
};
export type LinhaDoTempo = Base & {
  tipo: "linhaDoTempo";
  titulo?: string;
  tituloEm?: number;
  curva?: "sobe-e-cai" | "sobe" | "cai" | "estavel";
  // 2 a 5
  marcos: Marco[];
  // true: ocupa a tela inteira (a pessoa sai da moldura, a voz continua)
  telaCheia?: boolean;
  ilustrativo?: boolean;
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
  | Anatomia
  | Virada
  | Mito
  | Corte
  | LinhaDoTempo;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (o cortar.mjs grava) faz a moldura seguir o rosto
  rosto: { x: number; y: number };
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // trilha do aluno (arquivo em public/, sem batida): entra baixinha, com fade
  trilha?: { arquivo: string; volume?: number };
  // onde fica a legenda quando a tela divide: "topo" (na costura, acima da cabeça, como no
  // exemplo) ou "queixo" (abaixo do queixo)
  legendaNoDividido?: "topo" | "queixo";
};
