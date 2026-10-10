// Formato do plano de edição do modelo Cinema. O template renderiza qualquer vídeo, de qualquer
// assunto, a partir dele. Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
// Todo campo `em`/`…Em` é o instante de uma palavra dita (tirado de work/palavras.json).
//
// Esta é a versão DEITADA (16:9, 1920×1080, o vídeo completo do YouTube): os campos são os mesmos
// do vertical; o template recompõe a tela pela aula 9 do curso (veja src/layout.ts).
//
// Gramática do Cinema: a imagem da pessoa vive numa janela cercada de preto, com barras que abrem e
// fecham com a intensidade da fala. O texto mora no preto (nunca sobre o rosto):
// - blocos de barra (abertura, letreiro, numero, destaque, definicao, comparacao, pergunta, cta):
//   a pessoa vai para a moldura da direita e o texto ocupa o quadro preto da esquerda (o que no
//   vertical ia na barra de cima fica em cima; o que ia na de baixo, embaixo);
// - blocos de cartela alta (topicos, passos, grafico): a moldura desce para a base, do lado
//   direito, e o quadro da esquerda vira uma cartela preta com a lista ou o gráfico;
// - cartela: a tela fecha no preto por 2–3,5 s, com um desenho a traço;
// - frase e fala: a frase-chave cresce sobre a imagem escurecida; a fala vira diálogo de romance.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é `letreiro` + `cartela` (e a curva `intensidade` das barras).

type Base = {
  de: number;
  ate: number;
  // true = a narração (legenda) continua aparecendo durante este momento (raro aqui)
  legenda?: boolean;
};

// Nível das barras de cinema (a intensidade da fala):
// 0 = aberto (tela cheia, sem barras) · 1 = respiro (barras finas) · 2 = tensão (janela larga)
// 3 = clímax (janela de cinemascope, rosto em close) · 4 = fechado (tela preta)
// No 16:9 a janela desses níveis tem sempre a largura toda; só os blocos levam a pessoa à moldura.
export type Nivel = 0 | 1 | 2 | 3 | 4;

// Desenhos a traço (letreiros, cartelas, abertura e número). Cada um tem uma ação com significado.
export type TipoDeDesenho =
  | "sol"
  | "xicaras"
  | "relogio"
  | "banco"
  | "moedas"
  | "balanca"
  | "estrada"
  | "lampada"
  | "calendario"
  | "ampulheta";

export type Desenho = {
  tipo: TipoDeDesenho;
  // quando começa a se desenhar (padrão: logo que a cartela/letreiro abre)
  em?: number;
  // cartela: acima ou abaixo do título (padrão: abaixo quando há título, acima quando não há)
  lugar?: "acima" | "abaixo";
  // sub-passos do desenho, cada um no seu instante (o que cada passo faz depende do desenho;
  // veja references/plano.md, "Os desenhos")
  passos?: { em: number }[];
  // relógio: a hora que os ponteiros marcam no fim ("18:00"); padrão: o título, se for hora
  hora?: string;
  // moedas: "sobe" (padrão) = a pilha cresce; "cai" = a pilha desmorona
  sentido?: "sobe" | "cai";
};

export type Linha = { em: number; texto: string };

// ——— a assinatura ———

// Cartela em tela preta: as barras se fecham e a fala ganha um título, uma hora, um desenho.
export type Cartela = Base & {
  tipo: "cartela";
  // crédito pequeno em caixa alta, acima do título ("Todo dia", "Capítulo dois", "O erro")
  rotulo?: string;
  rotuloEm?: number;
  // o título grande. Se for uma hora, um ano ou um número ("18:00", "1998", "83.000"), os dígitos rolam até ele.
  titulo?: string;
  tituloEm?: number;
  // de onde os dígitos começam a rolar ("17:52"); padrão: alguns minutos/anos antes
  contarDe?: string;
  // quando os dígitos param no valor final (padrão: ~1 s depois de `tituloEm`)
  pousaEm?: number;
  // frases da fala que a cartela mostra, cada uma quando é falada
  linhas?: Linha[];
  desenho?: Desenho;
  // o texto que fica no alto da tela (na barra de cima) nos próximos apertos da curva, como um
  // cabeçalho de capítulo. Sem o campo: continua o anterior; "" = nenhum.
  cabeca?: string;
};

// Letreiro sobre a imagem: a pessoa vai para a moldura da direita, a imagem escurece e a hora, o
// lugar, o tema ou o capítulo aparecem no quadro preto da esquerda; a pessoa continua na tela.
export type Letreiro = Base & {
  tipo: "letreiro";
  rotulo?: string;
  rotuloEm?: number;
  // o letreiro grande, embaixo no quadro (hora, ano ou número rolam como contador mecânico)
  titulo?: string;
  tituloEm?: number;
  contarDe?: string;
  pousaEm?: number;
  // até 2 frases da fala, embaixo no quadro (sob o título, se houver)
  linhas?: Linha[];
  // o desenho vai em cima no quadro, acima do rótulo
  desenho?: Desenho;
  cabeca?: string;
  // 3 (padrão) = a moldura em close; 2 = a moldura larga
  nivel?: 2 | 3;
};

// Fala de personagem (ou de alguém citado): travessão, itálico, como diálogo de romance.
export type Fala = Base & {
  tipo: "fala";
  texto: string;
  // quem disse, como na fala ("ele disse", "meu cliente perguntou") e quando é falado
  quem?: string;
  quemEm?: number;
};

// ——— os 11 blocos universais ———

// Abertura: o título do vídeo se monta palavra por palavra no quadro da esquerda, com a pessoa na
// moldura da direita, escurecida em close (como o letreiro). `destaque` = trecho em itálico âmbar.
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // opcionais do Cinema: crédito e desenho em cima no quadro
  rotulo?: string;
  rotuloEm?: number;
  desenho?: Desenho;
  // 3 (padrão) = a moldura em close; 2 = a moldura larga
  nivel?: 2 | 3;
};

export type Item = { texto: string; em: number; detalhe?: string };

// Lista sem ordem: a moldura desce e o quadro da esquerda vira uma cartela com os itens, cada um com
// um travessão âmbar, entrando em foco na sua palavra.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: como os tópicos, com algarismos âmbar ligados por um fio que desce até o
// passo da vez.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que rola como um contador mecânico até `valor` a partir de `em` (formato pt-BR).
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
  // opcional do Cinema: um desenho em cima no quadro, acima do rótulo
  desenho?: Desenho;
};

// Dois lados: um em cima, outro embaixo, no quadro da esquerda; o rosto na moldura da direita.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico a traço numa cartela alta: linha, barras ou pizza (um mostrador). Sem números ditos:
// `tendencia` com a etiqueta "ilustrativo".
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

// Uma palavra ou frase curta que bate forte, grande no quadro. "alerta" = as barras
// apertam e a imagem esfria (perde a cor quente); "chave" = itálico âmbar.
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Termo em cima, significado embaixo (no quadro), como a legenda de uma língua estrangeira.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase-chave: a imagem escurece e a frase cresce em tipografia grande, no ritmo da fala.
// Universal: `texto` (o template quebra em linhas), `destaque` (itálico âmbar), `risco` (trecho
// riscado quando é dito, em `riscoEm`). Também aceita a forma antiga: `linhas` + `enfase`.
export type Frase = Base & {
  tipo: "frase";
  texto?: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  // forma antiga (continua valendo): 2 ou 3 linhas já quebradas e o trecho em ênfase
  linhas?: string[];
  enfase?: string;
};

// Pergunta para quem assiste: em cima no quadro; as opções entram embaixo, cada uma na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento como créditos de filme: a assinatura em cima no quadro, a chamada embaixo.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  nivel?: 0 | 1 | 2 | 3;
};

// O nome antigo do fechamento neste modelo (continua valendo).
export type Creditos = Base & {
  tipo: "creditos";
  texto: string;
  icone?: "seguir" | "salvar" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // 2 (padrão) ou menos = a moldura larga; 3 = a moldura em close
  nivel?: 0 | 1 | 2 | 3;
};

export type Momento =
  | Letreiro
  | Cartela
  | Frase
  | Fala
  | Creditos
  | Abertura
  | Topicos
  | Passos
  | Numero
  | Comparacao
  | Grafico
  | Destaque
  | Definicao
  | Pergunta
  | Cta;

export type TipoDeMomento = Momento["tipo"];

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura do vídeo de trabalho (no 16:9, 1080: o quadro inteiro)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` e `quadro` (opcionais) vêm do cortar.mjs
  rosto: { x: number; y: number };
  // calculada pelo cortar.mjs; aqui serve para saber onde fica o queixo (no 16:9, topo menos 60)
  zona?: { topo: number; altura: number };
  // assinatura dos créditos finais (e crédito da abertura)
  marca: { nome: string; area: string };
  // a curva de intensidade: cada item vale a partir de `de` (as barras levam ~1,2 s para chegar).
  // Os blocos de barra, as cartelas e os créditos mandam nas barras enquanto duram.
  intensidade?: { de: number; nivel: Nivel }[];
  cortesEm?: number[];
  momentos: Momento[];
  // todas as palavras faladas, na linha do tempo do vídeo já cortado (o motor preenche)
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // grão de filme por cima da imagem (padrão: true)
  grao?: boolean;
};
