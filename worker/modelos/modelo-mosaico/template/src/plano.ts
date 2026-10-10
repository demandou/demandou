// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Cada momento é UMA página do mosaico: o bloco principal (o `tipo` do momento, com os campos dele)
// num ladrilho, a pessoa em outro e, se houver, ladrilhos companheiros (`blocos`, ou a peça que `fica`
// de um momento anterior). Sem `grade`, o modelo escolhe o arranjo da página sozinho.
import type { NomeCor } from "./tema";

export type { NomeCor };

// Ícones a traço (src/componentes/Icones.tsx)
export type Icone =
  // gerais (qualquer assunto)
  | "alerta"
  | "chave"
  | "raio"
  | "alvo"
  | "lupa"
  | "escudo"
  | "moeda"
  | "carteira"
  | "sobe"
  | "cai"
  | "lampada"
  | "livro"
  | "play"
  | "pessoa"
  | "pessoas"
  | "casa"
  | "calendario"
  | "mensagem"
  | "estrela"
  | "cadeado"
  | "seta"
  | "relogio"
  | "lua"
  | "coracao"
  | "documento"
  | "check"
  | "x"
  | "interrogacao"
  // comida e rotina (o exemplo da nutricionista)
  | "brocolis"
  | "folha"
  | "cenoura"
  | "tomate"
  | "frango"
  | "peixe"
  | "ovo"
  | "feijao"
  | "leite"
  | "arroz"
  | "batata"
  | "mandioca"
  | "pao"
  | "azeite"
  | "gota"
  | "maca"
  | "copo"
  | "xicara"
  | "prato"
  | "halter"
  | "tenis"
  // ações (fechamento)
  | "salvar"
  | "seguir"
  | "comentar"
  | "compartilhar"
  | "link";

// Um item dito (lista, passos)
export type Item = { texto: string; em: number; detalhe?: string; icone?: Icone };

// ======================= os 11 blocos universais (motor/BLOCOS.md) =======================

// Título que se monta palavra por palavra na fala; `destaque` = trecho que ganha a cor de ênfase.
// `em`: quando o texto começa a ser dito (padrão: `de`). `quebra` (opcional): as linhas escritas à mão.
export type Abertura = { tipo: "abertura"; texto: string; destaque?: string; em?: number; rotulo?: string; quebra?: string[] };

// 2 a 5 itens sem ordem (motivos, erros, sinais): faixas que se assentam, cada uma com uma pastilha
export type Topicos = { tipo: "topicos"; titulo?: string; itens: Item[] };

// 2 a 5 itens EM ORDEM: faixas numeradas, ligadas por um trilho que avança até o passo dito
export type Passos = { tipo: "passos"; titulo?: string; itens: Item[] };

// Um número que conta até `valor` a partir de `em` (formato pt-BR). `rotulo` diz o que ele é.
// (`unidade`, `texto` e `emFim` são os nomes antigos de `sufixo`, `rotulo` e o fim da contagem.)
export type Numero = {
  tipo: "numero";
  valor: number;
  em?: number;
  rotulo?: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  unidade?: string;
  texto?: string;
  emFim?: number;
};

// Dois lados em dois ladrilhos: contra (padrão), antes-depois ou errado-certo
export type Lado = { rotulo: string; texto: string; em: number };
export type Comparacao = {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [Lado, Lado];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico de pastilhas: barras de ladrilhos, linha sobre a grade de pastilhas ou o disco dividido (pizza).
// Com `dados` (números DITOS, 2 a 6); sem eles, `tendencia` + `ilustrativo: true` (forma qualitativa).
export type Grafico = {
  tipo: "grafico";
  titulo?: string;
  forma: "barras" | "linha" | "pizza";
  dados?: { rotulo: string; valor: number; em: number }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
};

// Uma palavra ou frase curta que bate forte; "alerta" usa tomate, "chave" usa gema
export type Destaque = { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// O termo num ladrilho escuro; o significado num ladrilho que se encaixa embaixo quando é dito
export type Definicao = { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito, palavra por palavra; `risco` = trecho riscado quando é dito, `destaque` = trecho em ênfase.
// `quebra` (opcional): as linhas escritas à mão. (`risca` e `enfase` são os nomes antigos de risco e destaque.)
export type Frase = {
  tipo: "frase";
  texto?: string;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  em?: number;
  quebra?: string[];
  risca?: string;
  enfase?: string;
};

// Pergunta para quem assiste; `opcoes` (2 a 4) entram cada uma na sua palavra
export type Pergunta = { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Chamada final: o ícone se desenha e se preenche; o texto se monta na fala. `quebra` = linhas à mão.
export type Cta = {
  tipo: "cta";
  texto?: string;
  icone?: "salvar" | "seguir" | "comentar" | "link" | "compartilhar";
  destaque?: string;
  em?: number;
  quebra?: string[];
};

// ======================= a assinatura e os blocos próprios do Mosaico =======================

// Partes de um todo: o disco (no exemplo, o prato visto de cima) que se preenche parte a parte, cada uma
// na palavra que a nomeia. `fracao` opcional: sem frações ditas, as partes ficam iguais e o bloco mostra
// "ilustrativo". `prato` é o mesmo bloco com o nome do exemplo (aceita talheres e azeite).
export type Parte = { fracao?: number; cor?: NomeCor; em: number; rotulo?: string };
export type Partes = {
  tipo: "partes";
  titulo?: string;
  partes: Parte[];
  ilustrativo?: boolean;
  talheresEm?: number;
  azeite?: { em: number };
  rotulosEm?: number;
};
export type Prato = Omit<Partes, "tipo"> & { tipo: "prato" };

// Um grupo: fração ou número curto + nome em cima; embaixo, uma casa para cada item (ícone ou texto),
// que nasce a lápis e se completa quando o item é dito.
export type Grupo = {
  tipo: "grupo";
  fracao?: string;
  titulo: string;
  itens: { em: number; icone?: Icone; texto?: string }[];
};

// Título de revista (chapéu opcional), montado na fala; `quebra` = as palavras na ordem, uma string por linha
export type Titulo = { tipo: "titulo"; rotulo?: string; quebra?: string[]; texto?: string; enfase?: string; em?: number };

// Selo de referência: um ícone, um título e uma linha de apoio
export type Selo = { tipo: "selo"; icone?: Icone; titulo: string; texto?: string };

// Lista numerada (nome antigo de `passos`)
export type Lista = { tipo: "lista"; titulo?: string; itens: { em: number; texto: string; icone?: Icone; detalhe?: string }[] };

// Assinatura: nome e área (vêm de `marca`)
export type Marca = { tipo: "marca"; em?: number };

export type Conteudo =
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
  | Partes
  | Prato
  | Grupo
  | Titulo
  | Selo
  | Lista
  | Marca;

export type TipoBloco = Conteudo["tipo"];

// Um ladrilho da página: o conteúdo, a letra da grade (`area`) e, opcionais, `id` (para continuar no
// momento seguinte) e `cor`.
export type Ladrilho = { area: string; id?: string; cor?: NomeCor };
export type BlocoCompleto = Conteudo & Ladrilho;
// Continua o bloco de mesmo `id` de um momento anterior, só mudando de lugar e tamanho.
export type Continua = { area: string; id: string; tipo?: undefined; cor?: NomeCor };
export type Bloco = BlocoCompleto | Continua;
// Companheiro escrito no plano: `area` é opcional quando o modelo escolhe a grade
export type Companheiro = (Conteudo & { area?: string; id?: string; cor?: NomeCor }) | { id: string; area?: string; tipo?: undefined; cor?: NomeCor };

// O arranjo da página (todos opcionais): sem `grade`, o modelo escolhe.
export type Arranjo = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (dentro do bloco da pessoa)
  legenda?: boolean;
  // nome de um arranjo pronto (ARRANJOS em src/grade.ts) ou as linhas da grade; "p" é a pessoa
  grade?: string | string[];
  linhas?: number[];
  colunas?: number[];
  espelhar?: boolean;
  // letra do bloco principal na grade (padrão "a")
  area?: string;
  id?: string;
  cor?: NomeCor;
  // o ladrilho deste momento continua nas páginas seguintes, menor, como o prato do exemplo:
  // true = até outra peça que fica tomar o lugar (ou o fim); número = até esse segundo
  fica?: boolean | number;
  // true = esta página não leva a peça que fica
  sozinho?: boolean;
  // ladrilhos companheiros desta página
  blocos?: Companheiro[];
};

export type Momento = Conteudo & Arranjo;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o rastro vem junto no JSON
  rosto: { x: number; y: number };
  // o motor calcula; este modelo não usa (a pessoa sempre está num bloco ou em tela cheia)
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  // ajuste fino do enquadramento da pessoa nos blocos (gravação muito aberta ou muito fechada)
  pessoa?: { zoom?: number; ancoraY?: number };
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
