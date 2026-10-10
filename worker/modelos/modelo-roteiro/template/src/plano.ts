// Formato do plano de edição. O template renderiza qualquer vídeo, de qualquer assunto, a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado. Todo campo `em`/`…Em` é o
// instante de uma palavra dita (tirado de work/palavras.json).
//
// Gramática do Roteiro: o vídeo é uma viagem com dois "lugares".
// - Tela cheia: a pessoa ocupa a tela e um papel de viagem entra na altura do peito
//   (abertura/embarque = cartão de embarque, numero = etiqueta de bagagem, definicao = placa de rua
//   de azulejo, destaque = carimbo, frase = verso de cartão-postal, pergunta = formulário de
//   desembarque, cta = página de passaporte).
// - Mapa: a tela vira um mapa ilustrado, a pessoa viaja num cartão-postal e uma rota pontilhada anda de
//   pino em pino na fala (parada, dica, topicos, passos, comparacao, grafico). Cada bloco de mapa é um
//   ponto da viagem: a rota sai do bloco anterior e chega no novo.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack.
// A assinatura deste modelo é a `parada` (rota + pino + cartão-postal + carimbo).
import type { NomeDesenho } from "./componentes/Desenhos";

export type Desenho = NomeDesenho;

// Como se chega a uma parada (o veículo que anda na ponta da rota e o bilhete que entra)
export type Transporte = "bonde" | "trem" | "metro" | "onibus" | "barco" | "aviao" | "a-pe" | "bike" | "carro";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (normalmente não precisa)
  legenda?: boolean;
};

// Um item de lista ou de passos. `icone` (opcional) = um desenho da biblioteca no lugar do marcador.
export type Item = { texto: string; em: number; detalhe?: string; icone?: Desenho };

// ——— tela cheia ———

// Abertura: cartão de embarque na altura do peito. `em` (opcional, nos quatro blocos de texto falado:
// abertura, frase, pergunta e cta) = quando o TEXTO começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // extras do cartão de embarque (opcionais): letreiro, linha em itálico falada, código e duração
  rotulo?: string;
  subtitulo?: string;
  codigo?: string;
  duracao?: string;
};

// O nome antigo da abertura neste modelo (continua valendo).
export type Embarque = Base & {
  tipo: "embarque";
  // letreiro do topo do bilhete (padrão "Cartão de embarque")
  rotulo?: string;
  // o título, com as palavras NA ORDEM EM QUE SÃO FALADAS ("Um dia em Lisboa")
  titulo: string;
  // trecho exato do título em azulejo (o destino)
  destaque?: string;
  // linha em itálico, também falada ("sem pressa")
  subtitulo?: string;
  // código do destino no canhoto (3 letras, ex.: "LIS"); sem ele, o canhoto mostra o destaque
  codigo?: string;
  // o que vai embaixo do código no canhoto, só se foi dito ("1 dia", "fim de semana")
  duracao?: string;
  em?: number;
};

// Número: etiqueta de bagagem com o número contando em pt-BR e uma escala de mapa com o marcador.
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

// Destaque: o texto grande num papel e um carimbo redondo que bate no `em`
// ("alerta" = carimbo de telha "atenção"; "chave" = carimbo de azulejo "anote").
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: placa de rua de azulejo com o termo; uma rota pontilhada desce até o significado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: verso de cartão-postal com o texto escrito à mão; `destaque` em azulejo; `risco` riscado em telha.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: formulário de desembarque com a pergunta e as opções em caixinhas (2 a 4).
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: página de passaporte com os carimbos da viagem e o ícone da ação.
export type Cta = Base & {
  tipo: "cta";
  // a chamada, com as palavras faladas ("Salva pra sua viagem")
  texto?: string;
  // salvar (padrão), seguir, comentar ou link
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato do texto em azulejo, sublinhado quando é dito ("Saiba Mais")
  destaque?: string;
  em?: number;
  // quando o ícone é preenchido (a palavra "salva"/"segue"/"comenta"/"toca")
  acaoEm?: number;
  // a segunda linha ("Me segue pra mais roteiros") e quando começa
  detalhe?: string;
  detalheEm?: number;
  // quando o selo do "próximo roteiro" ganha tinta (a última palavra da chamada)
  proximoEm?: number;
  // nomes antigos (continuam valendo): `titulo` = `texto`, `acao` = `icone`
  titulo?: string;
  acao?: "salvar" | "seguir";
};

// ——— mapa ———

// Um lugar da parada: vira um pino no mapa e um cartão-postal ilustrado.
export type Lugar = {
  // quando o nome do lugar começa a ser dito: o pino cai e o cartão chega
  em: number;
  // o nome no cartão: um lugar de verdade ("Torre de Belém") ou a etapa de uma jornada ("Impulso")
  nome: string;
  // ilustração do cartão (biblioteca em references/plano.md); sem ela, um pedaço de mapa com o pino
  desenho?: Desenho;
  // posição no mapa, em frações (0–1) do mapa desenhado. Sem `x`/`y`, o template escolhe (a rota
  // segue em frente pelo mapa); use sem posição quando a parada é uma metáfora, não um lugar real.
  x?: number;
  y?: number;
  // como se liga ao lugar anterior da MESMA parada ("pertinho dali"): o trecho curto se desenha no `em`
  ligacao?: { em: number; texto: string };
};

// Uma parada do roteiro (a ASSINATURA): a rota anda até ela no mapa e os lugares viram cartões.
export type Parada = Base & {
  tipo: "parada";
  // quando a hora do dia muda (a palavra "manhã", "tarde"…) e para qual rótulo da barra do dia
  periodo?: { em: number; indice: number };
  // o caminho desde a parada anterior: quando começa a andar e de quê
  trajeto?: {
    em: number;
    transporte?: Transporte;
    // nome no bilhete ("Elétrico", "Metrô", "Balsa"); sem ele, o nome do transporte
    rotulo?: string;
    // linha/número dito na fala ("28"), e quando é dito
    numero?: string;
    numeroEm?: number;
    // pontos de passagem no mapa (0–1), para a rota contornar o rio, seguir a orla…
    via?: { x: number; y: number }[];
    // onde se pega o transporte, quando ele não sai da parada anterior (ex.: o elétrico 28 sai da
    // Baixa, não de Belém). O trecho até ali anda sem veículo, desde o começo da parada, e para ali
    // no instante `em`; o veículo segue até o destino.
    embarque?: { x: number; y: number };
  };
  // 1 ou 2 lugares
  lugares: Lugar[];
  // quando o carimbo bate (o fim da frase da parada)
  carimboEm?: number;
  // o texto do carimbo (padrão "visitado") e a cor: `alerta: true` = tinta de telha (um erro, uma
  // armadilha, "evite"); sem ele, azulejo
  carimbo?: { texto?: string; alerta?: boolean };
};

// Dica com o mapa inteiro: a câmera se afasta e mostra a rota completa; um cartão traz a dica.
export type Dica = Base & {
  tipo: "dica";
  // letreiro (padrão "Dica")
  rotulo?: string;
  // a dica, com palavras faladas
  titulo: string;
  // trecho exato do título em itálico azulejo
  destaque?: string;
  // até 4 ícones que entram na fala
  icones?: { em: number; desenho: Desenho; rotulo?: string }[];
};

// Lista sem ordem (motivos, erros, dicas, sinais): pinos que caem no mapa e um guia de papel embaixo.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência em ordem: a rota anda de pino numerado em pino numerado e o itinerário se preenche.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Dois lados: a rota se divide em dois caminhos, um para cada lado, e dois cartões-postais embaixo.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico num cartão de papel: `barras` = colunas de quarteirões, `linha` = rota com pinos nos dados,
// `pizza` = carimbo redondo dividido; sem números ditos, `tendencia` = perfil do caminho (ilustrativo).
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

export type Momento =
  | Abertura
  | Embarque
  | Numero
  | Destaque
  | Definicao
  | Frase
  | Pergunta
  | Cta
  | Parada
  | Dica
  | Topicos
  | Passos
  | Comparacao
  | Grafico;

export type TipoDeMomento = Momento["tipo"];

// Momentos que acontecem no mapa (a pessoa vira o postal)
export type MomentoDeMapa = Parada | Dica | Topicos | Passos | Comparacao | Grafico;
export type MomentoCheio = Exclude<Momento, MomentoDeMapa>;
export type Universal = Topicos | Passos | Comparacao | Grafico;

export type Palavra = { em: number; ate: number; w: string };

export type Ponto = { x: number; y: number };

// O mapa ilustrado (tudo em frações 0–1 do mapa inteiro; x para a direita, y para baixo).
// Opcional: sem ele, o template desenha um mapa genérico (bairros, morros, parques e uma orla).
export type Mapa = {
  // água: a margem (linha da costa ou do rio, em ordem) e de que lado dela fica a água. Num rio,
  // `outraMargem` fecha a água do outro lado (sem ela, a água vai até a borda do mapa, como um mar).
  agua?: { lado: "sul" | "norte" | "leste" | "oeste"; margem: Ponto[]; outraMargem?: Ponto[]; nome?: string; nomeEm?: Ponto };
  // bairros: manchas de quarteirões; com nome, ganham rótulo
  bairros?: { x: number; y: number; nome?: string; tamanho?: number }[];
  // morros: curvas de nível
  morros?: { x: number; y: number; r: number }[];
  // parques: manchas com árvores
  parques?: { x: number; y: number; r: number }[];
  // pontes: de um ponto a outro
  pontes?: { de: Ponto; ate: Ponto }[];
};

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); `rastro` (opcional) vem do cortar.mjs
  rosto: { x: number; y: number };
  // faixa dos cartões em tela cheia (px no quadro 1080×1920): abaixo do queixo
  zona?: { topo: number; altura: number };
  // nome e área: assinatura do postal, do cartão de embarque e do passaporte
  marca: { nome: string; area: string };
  // os rótulos da barra do dia (padrão: Manhã, Tarde, Fim do dia). A barra só aparece quando alguma
  // parada tem `periodo`; sem isso, o alto das telas de mapa mostra o título do bloco.
  dia?: string[];
  mapa?: Mapa;
  // ajuste do enquadramento da pessoa no postal (zoom 1,6–2,6; ancoraY 0,3–0,5)
  postal?: { zoom?: number; ancoraY?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};

export const ehMapa = (m: Momento): m is MomentoDeMapa =>
  m.tipo === "parada" || m.tipo === "dica" || m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico";
export const ehUniversalDeMapa = (m: Momento): m is Universal =>
  m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico";
