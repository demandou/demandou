// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O vídeo inteiro é uma planilha fictícia (sem marca de programa). A pessoa é uma célula grande,
// mesclada e presa à grade, que muda de lugar a cada momento; a fala vai preenchendo as células,
// o cursor de célula pula de uma para outra, a barra de fórmula mostra o que está sendo digitado
// e a linha de total soma sozinha.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles ganham a linguagem da planilha. Os tipos próprios
// (linha, tabela, preencher, celula) e os campos extras são opcionais.
import type { NomeIcone } from "./componentes/Icones";

// Onde fica a célula da pessoa (veja references/plano.md, seção 4)
export type Lugar = "cheia" | "grande" | "alto" | "esquerda" | "direita" | "estreita";

type Base = {
  de: number;
  ate: number;
  // true = a legenda (na barra de fórmula) continua durante este momento
  legenda?: boolean;
  // onde fica a célula da pessoa neste momento (cada tipo tem um padrão)
  pessoa?: Lugar;
  // seleciona uma aba da planilha embaixo (ou cria uma nova com esse nome), no instante `em`
  aba?: { nome: string; em: number };
};

// ——— blocos universais ———

// Abertura: o texto é digitado palavra por palavra numa célula mesclada em cima da pessoa.
// `em` (opcional): quando o texto começa a ser dito (padrão: `de`). `titulo` = nome antigo de `texto`.
export type Abertura = Base & {
  tipo: "abertura";
  texto?: string;
  titulo?: string;
  // trecho exato do texto em framboesa
  destaque?: string;
  em?: number;
  // etiqueta depois do texto ("na declaração completa"): contorno enquanto é dita, cheia no `confirmaEm`
  selo?: { texto: string; confirmaEm?: number };
};

// Um item de lista ou de passos. `detalheEm`: quando o detalhe é dito (padrão: logo depois do item).
// `marca` (opcional, da planilha): ✓ ou ✗ no fim da linha, no `marcaEm` (padrão: junto com o item).
export type Item = { texto: string; em: number; detalhe?: string; detalheEm?: number; marca?: "sim" | "nao"; marcaEm?: number };

// Lista sem ordem: uma tabela que se preenche linha a linha; a célula ao lado da pessoa mostra o item da vez.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Passos em ordem: a coluna A ganha 1, 2, 3… pela alça de preencher; a célula ao lado mostra o progresso.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta até `valor` a partir de `em` (formato pt-BR). `formula` (opcional, da planilha):
// o que é digitado na barra de fórmula (padrão: o próprio valor, como se fosse digitado na célula).
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
  formula?: string;
};

export type LadoComparacao = { rotulo: string; texto: string; em: number };
// Dois lados em duas linhas da planilha; o vencedor ganha a formatação condicional e o ✓.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoComparacao, LadoComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de planilha: os dados entram nas células ao lado da pessoa e o gráfico se desenha embaixo.
// Sem `dados`, a forma mostra só a tendência, com a etiqueta "ilustrativo".
export type Grafico = Base & {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
  // da planilha: formato dos números; sem eles, `unidade` "R$"/"US$" vira prefixo e o resto sufixo
  prefixo?: string;
  sufixo?: string;
  casas?: number;
};

// Uma palavra ou frase curta que bate forte: a célula recebe a formatação condicional.
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// O termo numa célula e o significado numa nota presa a ela.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, palavra por palavra; `risco` = trecho riscado (tachado) quando é dito.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta digitada; as `opcoes` abrem numa lista suspensa (validação de dados), cada uma na sua palavra.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: célula larga com a chamada digitada e um ícone que se preenche no `iconeEm`.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  destaque?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link" | "enviar";
  em?: number;
  iconeEm?: number;
};

// ——— assinatura: a tabela que se preenche no ritmo da fala ———

// A célula ao lado da pessoa que ilustra a linha da vez (dentro de `linha.destaque`).
type IlustracaoBase = {
  // rótulo em caixa alta no alto da célula ("Saúde", "Previdência privada"), palavras faladas
  rotulo: string;
  // ícone a traço que se desenha quando o item é dito (veja a lista em references/plano.md)
  icone?: NomeIcone;
};
export type Ilustracao =
  // ∞ que se desenha + uma frase ("sem limite de valor")
  | (IlustracaoBase & { tipo: "infinito"; texto: string; em: number })
  // até 3 regras curtas, cada uma com ícone ("anual", "por pessoa")
  | (IlustracaoBase & { tipo: "regras"; linhas: { texto: string; icone?: NomeIcone; em: number }[] })
  // pizza: a fatia `pct` cresce no `em`; o `texto` (ex.: "da renda tributável") entra no `textoEm`
  | (IlustracaoBase & { tipo: "pizza"; pct: number; em: number; texto: string; textoEm?: number })
  // número que conta até o valor (ex.: "R$ 2.112"), com uma frase embaixo
  | (IlustracaoBase & { tipo: "numero"; valor: number; prefixo?: string; sufixo?: string; casas?: number; em: number; texto?: string })
  // só o ícone grande e uma frase
  | (IlustracaoBase & { tipo: "icone"; texto?: string; em?: number });

// Uma linha da tabela. Linhas seguidas formam a mesma tabela, que vai se acumulando.
export type Linha = Base & {
  tipo: "linha";
  // coluna 1: o nome do item, digitado no `em`; `etiqueta` = selo curto embaixo ("PGBL")
  item: { texto: string; em: number; etiqueta?: string; etiquetaEm?: number };
  // exemplos ditos: abrem numa sub-linha embaixo do item (até 3)
  exemplos?: { texto: string; em: number }[];
  // coluna 2: ✓ (padrão), ✗ ou um número (quando a coluna 2 é numérica)
  marca?: { em: number; valor?: "sim" | "nao" | number };
  // coluna 3: o detalhe, palavras faladas a partir do `em`
  detalhe?: { texto: string; em: number };
  // fórmula digitada na barra de fórmula a partir do `em`; no `enterEm` o detalhe entra na coluna 3
  formula?: { texto: string; em: number; enterEm?: number };
  // a célula ao lado da pessoa; sem ela, a célula mostra o item da vez ampliado
  destaque?: Ilustracao;
};

// Tabela inteira num momento só (a assinatura para listas rápidas): cada linha é digitada na sua
// palavra, com ✓/✗ (ou um número) na coluna 2 e o detalhe na coluna 3; o total conta ou soma.
export type LinhaDaTabela = {
  texto: string;
  em: number;
  marca?: "sim" | "nao" | number;
  marcaEm?: number;
  detalhe?: string;
  detalheEm?: number;
};
export type Tabela = Base & {
  tipo: "tabela";
  // o assunto da tabela: rótulo da célula ao lado da pessoa (palavras faladas)
  titulo?: string;
  // títulos das 3 colunas (padrão: os de `plano.tabela`)
  colunas?: [string, string, string];
  linhas: LinhaDaTabela[];
  // rótulo da linha de total ("Total", "Erros"); false = sem total
  total?: string | false;
  // o que o total conta quando a coluna 2 é ✓/✗: os ✓ ("sim", padrão) ou os ✗ ("nao")
  conta?: "sim" | "nao";
  prefixo?: string;
  casas?: number;
};

// Preencher: o cursor seleciona a coluna 1 inteira e arrasta para baixo, marcando todas as linhas
// com um ícone (ex.: clipe = comprovante guardado). A frase dita entra na célula ao lado da pessoa.
export type Preencher = Base & {
  tipo: "preencher";
  rotulo?: string;
  texto: string;
  icone?: NomeIcone;
  // ícone que marca cada linha
  marca: NomeIcone;
  // quando o arrasto começa (cada linha leva ~0,2 s)
  em: number;
};

// Célula: uma frase ou um número em destaque numa célula larga embaixo da pessoa (fora da tabela).
export type Celula = Base & {
  tipo: "celula";
  rotulo?: string;
  texto: string;
  destaque?: string;
  numero?: { valor: number; prefixo?: string; sufixo?: string; casas?: number; em: number; formula?: string };
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
  | Linha
  | Tabela
  | Preencher
  | Celula;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = 9:16; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o motor acrescenta `rastro` (o caminho do rosto no vídeo)
  rosto: { x: number; y: number };
  // não usada por este modelo (a pessoa é reposicionada); o motor preenche
  zona?: { topo: number; altura: number };
  // nome e área: etiqueta na célula da pessoa
  marca: { nome: string; area: string };
  // a planilha: nome do arquivo (barra de título) e abas de baixo (a primeira começa ativa, ou `aba`)
  planilha?: { arquivo?: string; abas?: string[]; aba?: number };
  // a tabela das `linha`: títulos das 3 colunas; a coluna 2 é "marca" (✓/✗, o total conta) ou "numero" (o total soma)
  tabela?: { colunas?: [string, string, string]; tipo?: "marca" | "numero"; prefixo?: string; casas?: number; total?: string | false };
  // ajuste fino do enquadramento da pessoa: multiplica o zoom de todos os lugares (padrão 1) e
  // desloca a altura do rosto dentro da célula (+ desce, − sobe; em frações da célula)
  enquadramento?: { zoom?: number; ancoraY?: number };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};

// Famílias de tipos: onde a pessoa fica e onde o conteúdo entra.
// Faixa: a pessoa sobe para a faixa de cima (esquerda/direita), uma célula ao lado e a tabela/gráfico embaixo.
export const TIPOS_DE_FAIXA = ["linha", "preencher", "topicos", "passos", "grafico", "tabela"] as const;
export const ehDeFaixa = (m: Momento) => (TIPOS_DE_FAIXA as readonly string[]).includes(m.tipo);

// O texto da abertura (campo novo `texto` ou o antigo `titulo`)
export const textoDaAbertura = (m: Abertura) => m.texto ?? m.titulo ?? "";
