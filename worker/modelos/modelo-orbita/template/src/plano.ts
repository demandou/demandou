// Formato do plano de edição da Órbita. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Blocos universais (motor/BLOCOS.md, iguais em todos os modelos): abertura, topicos, passos, numero,
// comparacao, grafico, destaque, definicao, frase, pergunta, cta.
// Assinatura da Órbita: orbita (a cena de escala: dois corpos, a viagem da luz, o relógio e o evento)
// e ceu (a câmera sobe e cada corpo aparece com o seu valor). Peças próprias: virada (a pergunta
// "E se eu fosse…" e a linha de luz que troca a roupa) e raio (o feixe que bate na pessoa).

// Os corpos que o espaço sabe desenhar em 3D. O nome que aparece na tela é livre (campo `nome`).
export type Corpo =
  | "sol" // estrela quente, laranja (apaga, acende, explode)
  | "estrela" // estrela branco-azulada (pequena = ponto de luz; grande = esfera)
  | "terra" // a Terra (dia e noite)
  | "lua" // a Lua (crateras)
  | "planeta" // gigante gasoso com faixas (cor livre; `anel: true` = anéis)
  | "rochoso" // planeta rochoso (cor livre: Marte, Mercúrio…)
  | "galaxia" // espiral de estrelas
  | "buraco-negro" // esfera preta com o disco de luz
  | "atomo" // núcleo com elétrons em órbita (versão micro)
  | "celula" // célula translúcida com núcleo (versão micro)
  | "moeda"; // moeda (modo ilustrativo: finanças, cripto); `simbolo` = 1 a 3 letras

export type CorpoDef = {
  corpo: Corpo;
  // nome na tela (aparece em `nomeEm`; sem `nomeEm`, o corpo fica sem nome)
  nome?: string;
  nomeEm?: number;
  // cor principal (planeta, rochoso, moeda, célula); as estrelas usam a cor do tipo
  cor?: string;
  simbolo?: string;
  anel?: boolean;
};

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// ——— universais ———

export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

export type ItemFalado = { texto: string; em: number; detalhe?: string; corpo?: Corpo; cor?: string };

// 2 a 5 itens sem ordem: corpos em órbita, um por item
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: ItemFalado[] };

// 2 a 5 itens EM ORDEM: a trajetória de luz com paradas numeradas
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: ItemFalado[] };

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
  // mostra como relógio mm:ss (valor em segundos)
  relogio?: boolean;
  corpo?: Corpo;
};

export type Lado = { rotulo: string; texto: string; em: number; corpo?: Corpo; cor?: string };
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
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— assinatura ———

// A cena de escala: a câmera recua (ou mergulha) até mostrar a origem (no alto, à esquerda) e o
// destino (à direita, acima da moldura); a luz (ou o que viaja) vai de um ao outro com o relógio
// contando; no evento a origem apaga, acende ou explode e a última frente viaja até o destino.
export type Viagem = {
  em: number; // sai da origem
  chegaEm: number; // chega no destino
  rotulo?: string; // em cima do relógio ("TEMPO DA LUZ")
  // o tempo DITO (sem ele, só a barra anda: modo ilustrativo)
  valor?: number;
  // "s" (vira relógio mm:ss até 99 min), "min", "h", "dias", "anos", "anos-luz" ou outro texto curto
  unidade?: string;
  casas?: number;
};
export type Evento = {
  efeito: "apaga" | "acende" | "explode";
  em: number; // a palavra que dispara o evento
  // com o rastreio das mãos (`plano.maos`): o gesto que dispara (ferramentas/gesto.mjs grava `gestoEm`)
  gesto?: "maos-descem" | "maos-sobem";
  gestoEm?: number;
  rotulo?: string; // em cima do relógio depois do evento ("SOL APAGADO HÁ")
  chegaEm?: number; // quando a última frente de luz chega no destino
};
export type Orbita = Base & {
  tipo: "orbita";
  // recuo: começa colada no destino e se afasta; mergulho: vem de longe e mergulha até os dois
  camera?: "recuo" | "mergulho";
  origem: CorpoDef;
  destino: CorpoDef;
  // a cota entre os dois ("150 milhões de km"), só se a distância for dita
  distancia?: { texto: string; em: number };
  viagem?: Viagem;
  evento?: Evento;
  // etiqueta no destino ("Terra" / "ainda iluminada")
  aviso?: { texto: string; detalhe?: string; em: number };
};

// O céu: a câmera sobe e cada corpo aparece na palavra, com o nome e o valor ("Lua · 1,3 s").
export type ItemDoCeu = { corpo: Corpo; nome: string; valor?: string; em: number; cor?: string };
export type Ceu = Base & { tipo: "ceu"; titulo?: string; itens: ItemDoCeu[]; grifoEm?: number };

// ——— peças próprias ———

// A pergunta "E se eu fosse… PROFESSOR" em cima da cabeça e a virada com a linha de luz.
export type Virada = Base & {
  tipo: "virada";
  texto: string;
  em?: number;
  nome: string;
  nomeEm: number;
  complemento?: string;
  complementoEm?: number;
  icone?: Corpo | "orbita";
  // a linha de luz desce: com `video`, a roupa troca; sem ele, muda o enquadramento
  trocaEm: number;
  // o mesmo vídeo com a roupa (ou o cenário) trocada por uma IA de vídeo, em public/
  video?: string;
  // onde o quadro 0 desse vídeo cai na linha do tempo (padrão 0) e até quando ele vale (padrão: o fim)
  videoDe?: number;
  videoAte?: number;
};

// O feixe de luz quente que entra do canto e bate no rosto da pessoa.
export type Raio = Base & { tipo: "raio"; em: number; fonteEm?: number; bateEm: number; lado?: "esquerda" | "direita" };

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
  | Orbita
  | Ceu
  | Virada
  | Raio;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  rosto: { x: number; y: number };
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  // trilha do usuário (arquivo em public/, sem batida) e o volume (padrão 0,12)
  trilha?: string;
  trilhaVolume?: number;
  // a pessoa recortada (vídeo com transparência, .webm, em public/): no espaço, ela aparece sem moldura
  recorte?: { video: string; de?: number };
  // rastreio das mãos (opcional): centro da palma de cada mão por amostra (a cada `passo` s), em
  // frações do quadro; -1 quando a mão não aparece. `a` = a mão à esquerda da tela, `b` = à direita.
  // O ferramentas/gesto.mjs lê e grava o `gestoEm` dos eventos que pedem `gesto`.
  maos?: { passo: number; a: { x: number[]; y: number[] }; b: { x: number[]; y: number[] } };
};
