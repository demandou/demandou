// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Ignição: o painel de instrumentos de um carro fictício, à noite: dois mostradores
// (velocímetro e conta-giros), uma fileira de luzes-espia e uma tela central. Versão deitada (16:9,
// 1920×1080, o vídeo completo do YouTube): a base é a pessoa em tela cheia; cada momento liga o
// painel num "modo", com o painel no quadro da esquerda e a pessoa numa moldura à direita: a tela da
// câmera (abertura, frase, pergunta, fechamento), o retrovisor de dentro (luzes, listas, números,
// gráficos, rota) ou o retrovisor da direita (parada, definição). O assunto pode ser qualquer um: o
// painel é o estilo.
//
// Blocos universais (iguais em todos os modelos do pack): abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta.
// Assinatura deste modelo: luzes, parada e rota (e a partida, ignicao).

type Base = {
  de: number;
  ate: number;
  // sem efeito neste modelo: a legenda só aparece fora dos momentos (o texto do painel já é a fala)
  legenda?: boolean;
};

// Luzes-espia a traço (padrão genérico de painel, sem marca). As oito primeiras são as de um carro;
// as outras oito são símbolos gerais, para qualquer assunto.
export type Icone =
  | "oleo" // pressão do óleo (almotolia)
  | "temperatura" // temperatura do motor (termômetro na água)
  | "bateria" // carga da bateria
  | "freio" // freio de mão / fluido de freio
  | "motor" // injeção / motor
  | "pneu" // pressão dos pneus
  | "combustivel" // reserva de combustível
  | "cinto" // cinto de segurança
  | "alerta" // triângulo com "!" (alerta geral)
  | "info" // "i" num círculo (informação, ponto-chave)
  | "servico" // chave de boca (manutenção, ajuste, ferramenta)
  | "tempo" // relógio (prazo, hora, rotina)
  | "dinheiro" // moeda com cifrão (preço, dinheiro, investimento)
  | "pessoa" // busto (cliente, paciente, público)
  | "coracao" // coração (saúde, relação, cuidado)
  | "raio"; // raio (energia, rapidez)

// Luz numerada (o padrão neutro: um número dentro do contorno de uma luz de painel)
export type LuzNumerada = "n1" | "n2" | "n3" | "n4" | "n5";
export type Lampada = Icone | LuzNumerada;

// vermelho = pare agora / problema; ambar = atenção; marfim = indicador neutro (informação).
// Sem `cor`, vale a cor padrão de cada luz (ver references/plano.md).
export type CorDaLuz = "vermelho" | "ambar" | "marfim";

// ---------- a partida e a assinatura ----------

// Ignição: começa em tela cheia; na chave (ignicaoEm) a pessoa vai para a tela da câmera (à direita), os
// ponteiros varrem até o fim da escala e voltam, todas as luzes acendem um instante (o teste de
// lâmpadas) e o título se acende palavra por palavra na barra de mensagens.
export type Ignicao = Base & {
  tipo: "ignicao";
  // quando a chave gira (padrão: logo na primeira palavra)
  ignicaoEm?: number;
  // título falado, grande (até ~18 caracteres): "3 luzes do painel"
  titulo: string;
  // complemento falado, menor (até ~32 caracteres): "que você nunca pode ignorar"
  apoio?: string;
};

export type ItemLuz = {
  // quando a luz é nomeada: ela acende na fileira e ganha a tela central
  em: number;
  // o desenho da luz; sem ele, uma luz numerada (1, 2, 3… na ordem dos itens)
  icone?: Lampada;
  // nome curto (até ~14 caracteres): "Óleo", "Impulso", "Corretivo"
  nome: string;
  // frase falada sobre ela (até ~32 caracteres): "Parece uma lamparina"
  detalhe?: string;
  // quando o detalhe começa a ser dito (o desenho da luz reage aqui: a almotolia vira lamparina,
  // o termômetro sobe, a bateria descarrega)
  detalheEm?: number;
  cor?: CorDaLuz;
};

// Luzes (assinatura): a pessoa vai para o retrovisor (à direita), a tela central cresce e as luzes acendem uma
// a uma. Serve para qualquer lista de sinais, motivos, erros, dicas.
export type Luzes = Base & {
  tipo: "luzes";
  // nome do contador embaixo (até ~22 caracteres; padrão "Luzes de alerta")
  titulo?: string;
  // de 1 a 4 luzes
  itens: ItemLuz[];
};

export type Passo = {
  em: number;
  // o passo, falado (até ~24 caracteres): "Encosta com segurança"
  texto: string;
  // o que o painel faz: encostar = o carro vai para o acostamento e o velocímetro cai a zero
  // (pausar, frear, parar para pensar); desligar = o conta-giros cai a zero e o painel escurece
  // (parar de vez, cortar); nenhuma = só o texto
  acao?: "encostar" | "desligar" | "nenhuma";
};

// Parada (assinatura): "se acontecer X, faça Y". A pessoa vai para o retrovisor da direita, as luzes
// da condição piscam e a tela central mostra o que fazer, passo a passo, com o carro na pista.
export type Parada = Base & {
  tipo: "parada";
  // as luzes que piscam (0 a 3; padrão: nenhuma)
  icones?: Lampada[];
  // a condição, falada (até ~44 caracteres): "Óleo ou temperatura acesos em vermelho"
  condicao: string;
  // de 1 a 3 passos
  passos: Passo[];
};

// Rota (assinatura): "vai / leva / procura / na direção de…". A tela central vira o mapa do
// navegador, com a rota até o destino desenhada no ritmo da fala.
export type Rota = Base & {
  tipo: "rota";
  // a luz que motiva a rota (fica acesa) e a condição falada: "Bateria acesa"
  icone?: Lampada;
  condicao?: string;
  // a instrução falada (até ~30 caracteres): "Vai direto pro mecânico"
  instrucao: string;
  // o destino, em uma ou duas palavras: "Mecânico", "Têmpora", "Aula"
  destino: string;
  // o símbolo do pino do destino (padrão: bandeira)
  pino?: "bandeira" | "chave" | "casa";
  // quando a rota se desenha (ex.: em "direto")
  rotaEm: number;
  // quando o carro chega ao destino (ex.: em "mecânico")
  chegadaEm: number;
};

// Aviso: mensagem do painel na tela central, com um número que conta (opcional) — para uma regra,
// um dado ou uma medida ("Calibra com 32 libras", "Troca a cada 10 mil km").
export type Aviso = Base & {
  tipo: "aviso";
  // rótulo curto (até ~14 caracteres): "Pneus"
  rotulo?: string;
  // o texto, falado (até ~40 caracteres)
  texto: string;
  // número que conta até o valor quando é dito
  valor?: { numero: number; unidade: string; em: number; casas?: number };
  icone?: Lampada;
};

// ---------- blocos universais ----------

// Abertura: a primeira frase (a promessa). Na barra de mensagens, abaixo da pessoa; o `destaque`
// fica grande e o resto da frase, menor, em cima e/ou embaixo dele. No começo do vídeo, a chave gira.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// um item de lista ou de passos
export type Item = { texto: string; em: number; detalhe?: string };

// Tópicos: 2 a 5 itens sem ordem — o menu do computador de bordo, com o cursor no item da vez
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos: 2 a 5 itens em ordem — a estrada vista de cima, com o carro parando em cada etapa
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: o mostrador digital da tela central varre até o valor enquanto o visor conta (pt-BR)
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

// Comparação: dois lados na tela, um em cima de cada mostrador; os ponteiros mostram quem sobe
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: o histórico do computador de bordo (barras, linha ou anel); sem números ditos, a curva
// da tendência com a etiqueta "ilustrativo"
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  // números DITOS (2 a 6)
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Destaque: uma luz grande acende na tela com a frase curta; "alerta" = o triângulo vermelho
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  // a luz que acende (padrão: "alerta" no nível alerta, "info" no nível chave)
  icone?: Lampada;
};

// Definição: o termo na faixa em cima da tela central; o significado se acende na tela central
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: na barra de mensagens; `destaque` sublinhado, `risco` apagado e riscado quando é dito
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: sem opções, na barra de mensagens; com opções (2 a 4), a caixa de diálogo do painel
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a pessoa volta à tela da câmera (à direita); a chamada se acende na barra de mensagens, com o
// ícone da ação e a seta de direção verde piscando na palavra da ação ("manda", "toca", "segue"…).
export type Cta = Base & {
  tipo: "cta";
  // a chamada, falada (até ~34 caracteres): "Salva e manda pra quem dirige"
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // quando a seta começa a piscar (padrão: na palavra "manda", "toca", "segue", "comenta"…)
  setaEm?: number;
};

export type Momento =
  | Ignicao
  | Luzes
  | Parada
  | Rota
  | Aviso
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
  // altura que o vídeo ocupa no quadro (1080 no 16:9: o vídeo deitado inteiro)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` e o `quadro` (cortar.mjs) vêm junto no JSON
  rosto: { x: number; y: number };
  // não usado por este modelo (a pessoa muda de lugar), mas o motor escreve
  zona?: { topo: number; altura: number };
  // nome e área: o "perfil do motorista" na tela central (abertura e fechamento)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
