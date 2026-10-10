// Formato do plano de edição do modelo Brilho. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
import type { Rosto } from "./motor/caixa";

// Onde a pessoa fica durante o momento:
// "cheio" = quadro cheio, rosto no centro
// "perto" = quadro cheio com aproximação no rosto (para anotar o rosto maior)
// "lado"  = a pessoa desliza para um lado e abre um painel creme do outro
export type Layout = "cheio" | "perto" | "lado";
// lado da tela em que a PESSOA fica no layout "lado" (o painel fica do outro)
export type Lado = "esquerda" | "direita";

// Áreas do rosto que o modelo conhece (posições em frações da largura do rosto, a partir do
// centro do rosto — veja src/rosto.ts). As laterais valem para os dois lados do rosto.
export type Zona =
  | "olhos"
  | "olheira"
  | "maca"
  | "macaAlta"
  | "tempora"
  | "cupido"
  | "labios"
  | "testa"
  | "sobrancelha"
  | "nariz"
  | "queixo"
  | "mandibula"
  | "raizCabelo";

// Uma zona pelo nome ou um ponto livre: u = para o lado (1 = uma largura de rosto), v = para baixo
export type Ponto = Zona | { u: number; v: number };

// De que lado do rosto (na imagem) a marca aparece
export type Lados = "ambos" | "esquerda" | "direita";

type MarcaBase = {
  // quando a marca começa a se desenhar
  em: number;
  lados?: Lados;
  // cor do produto: nome (corretivo, blush, iluminador, batom…) ou "#RRGGBB"; padrão = a do truque
  cor?: string;
  // etiqueta curta presa à marca por uma linha-guia (até ~18 caracteres)
  rotulo?: { texto: string; em?: number };
};

// Triângulo embaixo dos olhos (corretivo). `setaEm`: setas para cima ("puxando pra cima").
// `altura`: do meio da base até a ponta, em larguras de rosto (padrão 0,23; com óculos, ~0,18).
export type Triangulo = MarcaBase & { forma: "triangulo"; setaEm?: number; altura?: number };

// Mancha alongada e esfumada entre dois pontos (blush, contorno, bronzer).
// `sobeEm`: começa baixa e redonda e sobe para a posição final ("mais alto").
// `setaEm`: seta pontilhada até o ponto final ("na direção da têmpora").
// `levantaEm`: setas de elevação ao longo da diagonal ("levanta o rosto").
export type Esfumado = MarcaBase & {
  forma: "esfumado";
  de?: Ponto;
  ate?: Ponto;
  sobeEm?: number;
  setaEm?: number;
  levantaEm?: number;
};

// Ponto de brilho (iluminador): um ponto perolado com uma estrelinha que cintila.
export type Brilho = MarcaBase & { forma: "brilho"; onde: Ponto };

// Círculo fino marcando uma área (olheira, espinha, sobrancelha…). `raio` em larguras de rosto.
export type Circulo = MarcaBase & { forma: "circulo"; onde: Ponto; raio?: number };

// Seta pontilhada de um ponto a outro (direção de aplicação).
export type Seta = MarcaBase & { forma: "seta"; de: Ponto; ate: Ponto };

export type Marca = Triangulo | Esfumado | Brilho | Circulo | Seta;

export type Icone =
  | "cima"
  | "baixo"
  | "diagonal"
  | "brilho"
  | "check"
  | "x"
  | "alerta"
  | "gota"
  | "pincel"
  | "relogio"
  | "lua"
  | "coracao"
  | "estrela"
  | "olho"
  | "ideia"
  | "dinheiro"
  | "seta";

// Uma dica do passo: entra quando é dita. `liga`: índice (0, 1, 2…) da marca em `marcas`
// que ganha uma linha-guia até esta dica (no layout "lado").
export type Dica = { em: number; texto: string; icone?: Icone; liga?: number };

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // troca o layout padrão do componente (só entre os layouts que o componente tem: veja references/plano.md)
  layout?: Layout;
  // no layout "lado": de que lado a pessoa fica (padrão: alterna a cada momento em "lado")
  lado?: Lado;
};

// ---------- os 11 blocos universais (motor/BLOCOS.md), desenhados na linguagem do Brilho ----------

// Abertura: título que se monta palavra por palavra sobre o peito da pessoa; o `destaque` ganha a
// faixa de cor passada por trás. Campos do Brilho: `linhas` (quebra manual), `pontos` (mapa do rosto),
// `tempo` (relógio), `rotulo` (o tema em caixa alta). `enfase` = nome antigo de `destaque`.
export type Abertura = Base & {
  tipo: "abertura";
  texto?: string;
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  rotulo?: string;
  // quebra manual em linhas (palavras da fala, na ordem); sem ela, o texto quebra sozinho
  linhas?: string[];
  enfase?: string;
  // pontos numerados no rosto, um por item anunciado
  pontos?: { onde: Ponto; em: number; lado?: "esquerda" | "direita" }[];
  // relógio que fecha a volta: "5 min"
  tempo?: { valor: string; unidade: string; em: number };
};

export type Item = { texto: string; em: number; detalhe?: string; icone?: Icone; cor?: string };

// Lista sem ordem: painel creme ao lado da pessoa, cada item com a sua amostra "passada"
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência: painel creme com o número grande que vira a cada passo e a lista numerada
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número que conta (pt-BR) sobre o peito: `rotulo` por cima; prefixo/sufixo ("US$", "mil", "%").
// Campos antigos do Brilho (continuam valendo): `texto` (frase por cima, no lugar do rótulo),
// `unidade` (= sufixo grande ao lado), `emFim` (quando a contagem termina) e `icone`.
export type Numero = Base & {
  tipo: "numero";
  valor: number;
  em?: number;
  rotulo?: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
  ilustrativo?: boolean;
  texto?: string | string[];
  unidade?: string;
  emFim?: number;
  icone?: Icone;
};

// Dois lados: cartão que sobe de baixo com dois godês (o que ganha fica com a cor; o outro, "a lápis")
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico: barras = faixas de produto passadas no comprimento do valor; linha = um traço de pincel;
// pizza = um godê dividido; sem `dados`, uma pincelada que sobe/cai/oscila ("ilustrativo")
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

// Palavra ou frase curta que bate forte sobre o peito, com a faixa passada por trás
// ("alerta" = faixa vinho; "chave" = faixa blush)
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };

// Termo e significado: painel creme com o termo "a lápis" que ganha tinta, a amostra e o significado
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase de efeito sobre o peito, palavra por palavra; `risco` = trecho riscado quando é dito
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta para quem assiste: cartão com o "?" grande e as opções em pílulas
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: cartão com o ícone da ação, a frase e a assinatura
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  detalhe?: string;
};

// ---------- a assinatura do Brilho ----------

// Truque: um ponto/passo com nome, amostra de cor, dicas e (opcional) anotações no rosto.
// Serve para qualquer assunto: o `produto` é o nome do ponto ("Corretivo", "Impulso", "Bateria"),
// a `cor` é a amostra (ilustrativa) e as `marcas` anotam o rosto quando a fala combina.
export type Truque = Base & {
  tipo: "truque";
  numero?: number;
  // o rótulo em caixa alta: "Truque" → "Truque 2 de 3" (padrão "Passo"); "" esconde
  rotulo?: string;
  produto: string;
  // cor da amostra (nome de produto, de tom ou "#RRGGBB")
  cor?: string;
  // quando o nome e a amostra ganham cor (padrão: logo depois do início)
  produtoEm?: number;
  dicas: Dica[];
  marcas?: Marca[];
};

// Amostras: paleta de 2 a 4 cores com nome (tons, opções, perfis, categorias…)
export type Amostras = Base & {
  tipo: "amostras";
  rotulo?: string;
  titulo?: string;
  itens: { em: number; nome: string; cor?: string }[];
};

// Resultado: as marcas dos truques voltam juntas no rosto + frase + número opcional
export type Resultado = Base & {
  tipo: "resultado";
  // quando as marcas voltam (padrão: início do momento)
  marcasEm?: number;
  // frase: um texto ou uma lista de linhas (com mais de uma, a primeira fica em blush)
  texto?: string | string[];
  numero?: { valor: number; unidade?: string; em: number; emFim?: number; icone?: Icone; prefixo?: string; casas?: number };
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
  | Truque
  | Amostras
  | Resultado;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = 9:16)
  videoAltura?: number;
  // centro do rosto (entre os olhos e a ponta do nariz) na posição mais comum, em frações do quadro,
  // e o caminho dele quadro a quadro (`rosto.rastro`, gravado pelo cortar.mjs / rastreador do motor)
  rosto: Rosto;
  // largura do rosto (de bochecha a bochecha, na altura dos olhos) em fração da largura do quadro
  rostoLargura?: number;
  // ajuste fino das zonas do rosto, se alguma cair fora do lugar: { "tempora": { "u": 0.47, "v": -0.2 } }
  zonas?: Partial<Record<Zona, { u: number; v: number }>>;
  // aproximação do layout "perto" (padrão 1,22)
  zoomPerto?: number;
  // aproximação da pessoa no layout "lado" (padrão 1; ~1,25 quando ela está sentada, peito para cima)
  zoomLado?: number;
  zona?: { topo: number; altura: number };
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
