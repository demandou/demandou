// Formato do plano de edição do modelo Criativo, VERSÃO DEITADA (16:9, 1920×1080, o vídeo completo
// do YouTube). Os campos são os mesmos do vertical; muda só onde as coisas ficam na tela.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática (aula 9 do curso, editar uma aula horizontal): a pessoa em QUADRO CHEIO é a base,
// com a LEGENDA sempre ligada na área segura de baixo (centro em y 912). As placas curtas (gancho e
// abertura sem foto, frase, destaque, número sem foto, o botão sem cartão) entram no PEITO, entre o
// queixo e a legenda, quando cabem (o template mede). Os cartões que pedem apoio visual (herói,
// prova, listas, comparação, gráfico, definição, pergunta, cartão final, ou uma placa que não coube
// no peito) levam a pessoa para uma MOLDURA de vidro à direita (x 1184 a 1824), com o rosto
// centralizado e seguido, e ocupam o QUADRO da esquerda, o PALCO (x 96 a 1136, y 72 a 832). Quando
// a ideia termina, a pessoa volta ao quadro cheio. Nada importante acima de y 72 nem abaixo de y 984
// (controles do player); margem lateral de 96 px.
//
// A assinatura é `heroi` (o produto num cartão de vidro com profundidade) + `prova` (cada benefício
// na palavra, com a prova visual literal). Junto vêm o `gancho` e o `selo`.
// Os 11 blocos universais (references/plano.md) têm os mesmos campos em todos os modelos do pack.
//
// VARIANTES DE GANCHO: o aluno grava 2 ou 3 ganchos seguidos e depois o corpo. `variantes` diz onde
// cada gancho e o corpo estão; `node scripts-modelo/variantes.mjs` monta um plano por gancho
// (gancho X + o mesmo corpo) e renderiza um MP4 por gancho. Esses planos derivados trazem `trechos`.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // a legenda fica SEMPRE ligada neste modelo (padrão true); false só se um cartão já mostra a mesma fala
  legenda?: boolean;
};

// Ícones em traço (desenhados no template). Use o que nomeia a coisa dita; sem ícone, vale o padrão do bloco.
export type NomeIcone =
  | "gelo"
  | "sol"
  | "relogio"
  | "carro"
  | "mochila"
  | "treino"
  | "frete"
  | "garantia"
  | "desconto"
  | "estrela"
  | "presente"
  | "certo"
  | "errado"
  | "alerta"
  | "raio"
  | "coracao"
  | "cifrao"
  | "grafico"
  | "play"
  | "salvar"
  | "seguir"
  | "comentar"
  | "link";

export type Item = { texto: string; em: number; detalhe?: string; icone?: NomeIcone };
// Etiqueta curta que salta no canto do cartão (ex.: "no sol", "500 ml"), no `em` da palavra.
export type Etiqueta = { texto: string; em: number; icone?: NomeIcone };

// ——— a assinatura e os efeitos próprios ———

// GANCHO: a manchete numa placa de vidro fumê (no peito; com foto, no quadro). Quando o momento começa no
// início do vídeo (de ≤ 0,05), ela já está INTEIRA no 1º quadro ("layout montado"); as palavras
// acendem quando são ditas a partir de `em`, e o `destaque` acende na cor da marca com um traço.
// `imagem`: uma foto num cartão de vidro acima da manchete (a situação do gancho). Com
// `telaCheia` (um instante), a foto começa cobrindo a tela inteira (1920×1080: use foto deitada) e
// encolhe para o cartão do quadro nesse instante, revelando a pessoa na moldura. `icone` + `iconeEm`:
// um adesivo (ex.: gelo, sol) que salta na palavra.
export type Gancho = Base & {
  tipo: "gancho";
  texto: string;
  destaque?: string;
  em?: number;
  imagem?: ImagemNoMomento;
  telaCheia?: number;
  icone?: NomeIcone;
  iconeEm?: number;
  etiquetas?: Etiqueta[];
};

// HERÓI (assinatura, no quadro da esquerda): o produto num cartão de vidro claro com espessura, inclinado em perspectiva,
// aproximando devagar; o recorte do produto (PNG transparente) passa da borda de cima do cartão
// (profundidade). Entra em `em` (a palavra que nomeia o produto: "essa garrafa", "o curso").
// `titulo` (2 a 3 linhas, monta palavra por palavra em `tituloEm`), `destaque` na cor da marca,
// `etiquetas` que saltam no canto. Sem recorte, uma foto preenche o cartão. MODO ILUSTRATIVO (sem
// imagem do produto: serviço, aula, consultoria, app): `icone` vira um bloco de vidro 3D na cor da marca.
export type Heroi = Base & {
  tipo: "heroi";
  imagem?: ImagemNoMomento;
  icone?: NomeIcone;
  em: number;
  // a palavra que nomeia o produto (para o timing gate): "essa", "garrafa", "curso"…
  palavra?: string;
  titulo?: string;
  tituloEm?: number;
  destaque?: string;
  etiquetas?: Etiqueta[];
};

// PROVA (assinatura, no quadro da esquerda): um benefício com a prova visual literal. A foto (o
// produto na situação dita) entra num cartão de vidro deitado (~1040 × 750) em `em`, na palavra que a nomeia (`palavra`, para o timing gate);
// a faixa do benefício (✓ + `texto`, palavra por palavra) assenta em `textoEm`; `numero`
// (opcional, só se dito) conta num selo redondo no canto da foto. Provas seguidas mantêm o mesmo
// cartão: a foto nova passa por cima da anterior. `telaCheia`: a foto cobre a tela inteira até
// esse instante e então encolhe para o cartão. `nivel: "contra"` = um problema (✗ em vez de ✓).
// MODO ILUSTRATIVO (sem foto da prova): `icone` grande num cartão de vidro fumê, no lugar da foto.
export type Prova = Base & {
  tipo: "prova";
  imagem?: ImagemNoMomento;
  icone?: NomeIcone;
  em: number;
  palavra?: string;
  texto: string;
  textoEm?: number;
  numero?: { valor: number; em: number; prefixo?: string; sufixo?: string; casas?: number };
  telaCheia?: number;
  nivel?: "pro" | "contra";
  etiquetas?: Etiqueta[];
};

// SELO: o adesivo redondo de oferta (frete grátis, garantia, desconto, brinde) que carimba na
// palavra e fica girando devagar no canto de cima do cartão da vez (com a pessoa em quadro cheio, no
// canto de cima do lado oposto ao rosto). É uma camada: não tira o cartão do palco. Só o que foi
// dito ("frete grátis", "7 dias de garantia").
export type Selo = Base & { tipo: "selo"; texto: string; em: number; icone?: NomeIcone };

// ——— os 11 blocos universais ———

export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento; icone?: NomeIcone; iconeEm?: number };
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };
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
  imagem?: ImagemNoMomento;
};
export type LadoDaComparacao = { rotulo: string; texto: string; em: number; imagem?: ImagemNoMomento };
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoDaComparacao, LadoDaComparacao];
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
export type Destaque = Base & { tipo: "destaque"; texto: string; em: number; nivel?: "alerta" | "chave"; detalhe?: string; detalheEm?: number };
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };
// CTA: o BOTÃO (pílula na cor da marca com a seta), com o toque do dedo em `toqueEm`; com `imagem`
// ou `titulo`, o cartão final fica no quadro da esquerda e o botão embaixo dele; sem os dois, o
// botão fica no peito, logo acima da legenda.
// Fica até o último quadro. `texto` = o que o botão diz (só o que foi dito: "Saiba mais", "Compre agora").
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
  toqueEm?: number;
  imagem?: ImagemNoMomento;
  titulo?: string;
  tituloEm?: number;
};

export type Momento =
  | Gancho
  | Heroi
  | Prova
  | Selo
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

// Onde cada gancho e o corpo estão no vídeo cortado (o plano principal tem todos os ganchos seguidos).
export type Variantes = {
  ganchos: { nome: string; de: number; ate: number }[];
  corpo: { de: number; ate: number };
};

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: Rosto;
  // faixa abaixo do queixo (o cortar.mjs do 16:9 grava ~60 px abaixo dele; o Criativo deitado põe
  // as placas do peito a partir do queixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: uma tarja discreta num canto de cima, ao lado da cabeça, nos primeiros
  // segundos com a pessoa em quadro cheio (vazio = sem tarja)
  marca: { nome: string; area: string };
  // a cor da marca do produto (ex.: "#1E88FF"); vazio = laranja-sinal
  cor?: string;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
  variantes?: Variantes;
  // só nos planos de variante (o variantes.mjs escreve): os trechos do vídeo cortado, em ordem
  trechos?: { de: number; ate: number }[];
  // só nos planos de variante: o nome do gancho ("A", "B"…)
  variante?: string;
};
