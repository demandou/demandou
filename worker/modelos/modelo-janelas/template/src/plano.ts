// Formato do plano de edição do modelo Janelas. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O vídeo inteiro é uma área de trabalho (desktop) fictícia. A pessoa é a janela de uma chamada
// de vídeo que o mouse arrasta, redimensiona, minimiza e maximiza; cada momento abre outra janela
// ou um elemento do sistema, e as teclas afundam no instante em que são ditas.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md); aqui eles viram janelas do desktop. Os tipos próprios (teclas, recorte,
// navegador, lista) aceitam qualquer assunto: uma tecla pode ter qualquer palavra.
import type { NomeIcone } from "./componentes/Icones";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // onde fica a janela da pessoa neste momento (cada tipo tem um padrão; veja references/plano.md)
  pessoa?: Lugar;
};

// Lugares da janela da pessoa
export type Lugar = "cheia" | "topo" | "mini" | "centro" | "alto";

// Uma tecla e o instante em que ela é dita (ela afunda nesse instante). `tecla` pode ser uma tecla
// de verdade ("Ctrl", "Shift", "T") ou qualquer palavra curta ("Mercado", "Data", "4").
export type Tecla = { tecla: string; em: number };

// Atalho: o rótulo de cima ("Atalho 1", ou qualquer texto) e as teclas. Vale em navegador, lista, recorte e teclas.
type ComAtalho = {
  // número do atalho; vira "Atalho 1" em cima das teclas (ou use `rotulo`, texto livre)
  numero?: number;
  rotulo?: string;
  // quando o número ou o rótulo é dito — o rótulo acende nesse instante
  numeroEm?: number;
  teclas?: Tecla[];
};

// `detalheEm` (opcional, deste modelo): o detalhe entra na palavra dele, e não logo depois do item
export type Item = { texto: string; em: number; detalhe?: string; detalheEm?: number; icone?: NomeIcone };

// ——— Blocos universais ———

// Abertura: a pessoa em tela cheia e a barra de busca do sistema, onde o texto é digitado palavra
// por palavra. No Enter, uma linha de resultado aparece. (`titulo` = nome antigo de `texto`.)
export type Abertura = Base & {
  tipo: "abertura";
  texto?: string;
  titulo?: string;
  // trecho exato do texto em violeta
  destaque?: string;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  // a linha de resultado que aparece no Enter e um número curto à direita
  resultado?: string;
  contagem?: string;
  icone?: NomeIcone;
  // quando o Enter é apertado (padrão: logo depois da última palavra)
  enterEm?: number;
};

// Tópicos (lista sem ordem): uma janela de notas embaixo da pessoa; cada item ocupa a vaga
// tracejada quando é dito e o mouse o seleciona.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos (lista em ordem): um assistente com etapas numeradas ligadas por uma linha que avança; a
// pessoa minimizada e uma barra de progresso "Etapa 2 de 3" ao lado.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: um mostrador que conta até `valor` (formato pt-BR).
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
  // de onde a contagem parte (padrão 0)
  inicio?: number;
};

export type LadoComparacao = { rotulo: string; texto: string; em: number };
// Comparação: duas janelas lado a lado (tela dividida do sistema), cada uma no seu `em`.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoComparacao, LadoComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: uma janela de gráfico. Com `dados` (números ditos), barras/linha/pizza proporcionais;
// sem `dados`, uma curva de tendência com a etiqueta "ilustrativo".
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // o que a curva de tendência mostra, escrito ao lado dela (opcional, palavras da fala)
  leitura?: string;
};

// Destaque: uma notificação do sistema no peito da pessoa em tela cheia. "alerta" = aviso escuro
// com o triângulo; "chave" = notificação clara com o marcador violeta.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Definição: o termo numa janela; na fala do significado, o mouse passa por cima e um balão de
// ajuda abre com o significado.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: uma nota onde a frase é digitada na fala; `destaque` em violeta; `risco` é selecionado
// pelo mouse e riscado quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: uma caixa de diálogo do sistema; as opções viram botões, cada um na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: cartão de compartilhar embaixo da pessoa. Universal: `texto` + `icone` (salvar,
// seguir, comentar, link) + `destaque` (o trecho do botão). Antigo: `titulo` + salvar e enviar.
export type Cta = Base & {
  tipo: "cta";
  texto?: string;
  titulo?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  // quando o mouse clica no botão (padrão: na palavra do `destaque`)
  cliqueEm?: number;
  // ——— forma antiga (salvar e enviar) ———
  salvarEm?: number;
  enviarEm?: number;
  para?: string;
  // avatar do destinatário (forma antiga)
  avatar?: NomeIcone;
  enviadoEm?: number;
  acao?: "enviar" | "seguir";
};

// ——— Tipos próprios (a assinatura) ———

export type Aba = { titulo: string; icone?: NomeIcone; em?: number; texto?: string };

// Navegador genérico com abas. Cada aba pode abrir na sua palavra (`em`) com uma frase na página
// (`texto`); ou uma aba fecha (o mouse clica no ×) e volta no atalho.
export type Navegador = Base &
  ComAtalho & {
    tipo: "navegador";
    // 2 a 4 abas
    abas: Aba[];
    // a aba que fecha sem querer e depois volta
    ativa?: number;
    fechaEm?: number;
    reabreEm?: number;
    // aviso do sistema com a frase dita
    aviso?: { texto: string; destaque?: string; em?: number };
  };

export type TipoItem = "texto" | "imagem" | "link" | "endereco" | "dinheiro" | "arquivo" | "contato" | "data";

// Painel com uma lista que se preenche (área de transferência, apps, arquivos…), com a pessoa
// minimizada e o atalho ao lado.
export type Lista = Base &
  ComAtalho & {
    tipo: "lista";
    titulo: string;
    icone?: NomeIcone;
    subtitulo?: string;
    // 2 a 5 itens: o primeiro já está no painel quando ele abre; os outros entram no `em`
    itens: { texto: string; tipo?: TipoItem; icone?: NomeIcone; em: number }[];
    primeiro?: string;
    selo?: { texto: string; em: number };
    escolhe?: number;
    escolheEm?: number;
    escolheTexto?: string;
  };

// Recorte de tela: a tela escurece, o mouse arrasta um retângulo em volta do rosto com a frase
// dita presa nele e a imagem congelada voa para um aviso embaixo.
export type Recorte = Base &
  ComAtalho & {
    tipo: "recorte";
    escureceEm?: number;
    selecionaEm: number;
    soltaEm: number;
    capturaEm?: number;
    rotuloSelecao?: string;
    // título do aviso (padrão: a frase da seleção) e uma linha de apoio opcional
    aviso?: string;
    avisoDetalhe?: string;
    avisoAte?: number;
    ajuste?: { x?: number; y?: number; w?: number; h?: number };
  };

// A combinação, grande: teclas grandes embaixo da pessoa, cada uma afunda na sua palavra.
// Se o momento anterior tinha teclas, elas continuam e só as diferentes são trocadas.
export type Teclas = Base &
  ComAtalho & {
    tipo: "teclas";
    chip?: { texto: string; em: number };
    trocaEm?: number;
    // frase curta embaixo das teclas, com palavras faladas (opcional)
    descricao?: string;
    descricaoEm?: number;
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
  | Navegador
  | Lista
  | Recorte
  | Teclas;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = 9:16; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (o motor preenche): os cartões no peito começam logo acima dela
  zona?: { topo: number; altura: number };
  // nome (etiqueta da chamada) e área (título da janela da chamada)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
