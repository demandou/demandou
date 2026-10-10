// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Wireframe: a pessoa abre em quadro cheio com o título montado como uma camada de
// texto selecionada. Nos momentos de canvas (`revisao`, `conserto`, `resultado`) ela encolhe e vira
// um COMENTÁRIO FIXADO no canvas de design, ao lado de um celular em wireframe cinza: os erros ganham
// etiquetas vermelhas numeradas e contornos tracejados; no conserto a página se reconstrói limpa e
// com a cor da marca; no resultado ela "vende". Volta ao quadro cheio para frases e para o fechamento.

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (nos momentos de canvas ela aparece
  // dentro do balão do comentário; nos de quadro cheio, abaixo do queixo)
  legenda?: boolean;
};

// Abertura: quadro cheio. O título é uma camada de texto selecionada (alças vermelhas e a medida
// L × A embaixo); cada palavra nasce como barra cinza de wireframe e vira texto quando é dita.
export type Abertura = Base & {
  tipo: "abertura";
  // as palavras NA ORDEM EM QUE SÃO FALADAS ("3 erros que fazem o cliente sair do seu site")
  titulo?: string;
  // bloco universal: o mesmo que `titulo` (se os dois existirem, vale `texto`)
  texto?: string;
  // trecho exato do título em vermelho (normalmente o número)
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
};

// Frase: quadro cheio, uma camada de texto com uma frase (regra, virada, dado).
export type Frase = Base & {
  tipo: "frase";
  // fiel ao que foi dito, até ~70 caracteres
  texto: string;
  // trecho exato do texto em vermelho
  destaque?: string;
  // nome da camada, acima da caixa ("Regra", "Dado")
  rotulo?: string;
  // trecho do texto riscado em vermelho quando é dito (`riscoEm`: padrão, a palavra dita)
  risco?: string;
  riscoEm?: number;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
};

// Os erros que o wireframe sabe mostrar (cada um tem a sua área no celular e a sua medida no inspetor)
export type TipoErro =
  // parede de texto na primeira tela; o inspetor conta as palavras
  | "texto"
  // botão de compra lá embaixo; a página rola até ele e o inspetor conta os px de rolagem
  | "botao"
  // letra clara em fundo claro; o inspetor mostra o medidor de contraste (mín. 4,5:1)
  | "contraste"
  // imagem pesada que demora a carregar; o inspetor mostra o peso
  | "imagem"
  // menu com links demais; o inspetor conta os links
  | "menu";

export type Erro = {
  // quando a etiqueta aparece (a palavra que nomeia o erro)
  em: number;
  tipo: TipoErro;
  // texto da etiqueta, curto (até ~16 caracteres): "Texto demais"
  rotulo: string;
  // segundo tempo do erro (opcional), na palavra que completa a ideia:
  // texto → a régua vermelha "1ª tela" se desenha na tela; contraste → o conta-gotas sai da letra e
  // pega a cor do fundo, e o contraste é calculado. Sem ele, acontece 0,6 s depois do `em`.
  medeEm?: number;
  // qualquer assunto: o que o inspetor mostra no lugar da medida da página (palavras, rolagem,
  // contraste…). `false` = só o nome do problema, sem número; `{ valor, texto }` = o número ou
  // trecho dito ("3 de 10") e a linha pequena embaixo ("compram por impulso"). Sem `medida`, o
  // inspetor mede a página fictícia (use só quando o erro é mesmo de uma página).
  medida?: false | { valor?: string; texto?: string };
};

// Revisão: o canvas com o celular em wireframe; uma etiqueta numerada por erro, no ritmo da fala
export type Revisao = Base & {
  tipo: "revisao";
  erros: Erro[];
};

export type TipoPasso =
  // a parede de texto some e a promessa entra em uma frase (fecha o erro "texto")
  | "promessa"
  // o botão sobe para logo abaixo da promessa, com a medida de espaçamento (fecha "botao")
  | "botao"
  // a página ganha a cor da marca e o contraste forte (fecha "contraste")
  | "contraste"
  // a imagem pesada vira uma ilustração leve (fecha "imagem")
  | "imagem"
  // o menu fica só com a marca e um link (fecha "menu")
  | "menu";

// Conserto: a página se reconstrói, um passo por vez (cada passo no `em` da palavra que o pede).
// O que não tiver passo próprio acontece junto com o último passo.
export type Conserto = Base & {
  tipo: "conserto";
  passos: { em: number; tipo: TipoPasso; rotulo?: string; medida?: false | { valor?: string; texto?: string } }[];
};

// Resultado: a página no ar. Um toque no botão e avisos que chegam um a um ("Novo pedido");
// o inspetor conta. Use para "a página vende mais", "o cliente compra", "chegam os contatos".
export type Resultado = Base & {
  tipo: "resultado";
  // rótulo do inspetor ("Pedidos", "Contatos")
  rotulo?: string;
  // 1 a 3 avisos, cada um no `em` de uma palavra; texto ≤ 16 caracteres, detalhe ≤ 18
  itens: { em: number; texto: string; detalhe?: string }[];
};

// Fechamento: quadro cheio; um comentário com a chamada falada. O marcador de "salvar" (ou
// seguir/comentar) acende quando a ação é dita e o comentário é marcado como resolvido no fim.
export type Cta = Base & {
  tipo: "cta";
  // a chamada, fiel à fala ("Salva e revisa a sua página hoje.")
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // trecho exato do texto em vermelho
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // quando o ícone acende (padrão: na primeira palavra) e quando vira "Resolvido" (padrão: na última)
  iconeEm?: number;
  resolvidoEm?: number;
};

// ---------- os blocos universais (motor/BLOCOS.md) ----------
// Lista, passos, comparação e gráfico viram um FRAME no canvas (um quadro de design no lugar do
// celular, com o painel de camadas ao lado): a pessoa encolhe para o comentário fixado. Número,
// destaque, definição e pergunta são camadas selecionadas em quadro cheio, como a abertura.

export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: { texto: string; em: number; detalhe?: string }[] };
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: { texto: string; em: number; detalhe?: string }[] };
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
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [{ rotulo: string; texto: string; em: number }, { rotulo: string; texto: string; em: number }];
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
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Momento = Abertura | Frase | Revisao | Conserto | Resultado | Cta | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Pergunta;

export type Ilustracao = "pao" | "produto" | "curso" | "agenda" | "cafe";

// A página fictícia que aparece no celular
export type Pagina = {
  // nome da tela no canvas ("Página inicial", "Página de vendas")
  nome: string;
  // nome da marca fictícia, no topo da página limpa (curto: até ~12 caracteres)
  marca: string;
  // o título fraco do wireframe, antes do conserto (até ~40 caracteres)
  tituloAntes: string;
  // a promessa em uma frase, depois do conserto (até ~36 caracteres)
  promessa: string;
  // texto do botão (até ~16 caracteres)
  botao: string;
  // linha pequena abaixo da ilustração (opcional)
  apoio?: string;
  ilustracao?: Ilustracao;
  // cor da marca (fundo da página limpa) e cor do texto sobre ela; o contraste é calculado de verdade
  cor?: string;
  tinta?: string;
  // números do inspetor
  palavras?: number;
  rolagem?: number;
  pesoAntes?: string;
  pesoDepois?: string;
  links?: number;
};

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = quadro cheio; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1)
  rosto: { x: number; y: number };
  // faixa abaixo do queixo (px, no quadro 1080×1920): onde ficam os cartões de quadro cheio
  zona?: { topo: number; altura: number };
  // nome e área: cabeçalho do comentário (canvas e fechamento)
  marca: { nome: string; area: string };
  // a página fictícia do celular (sem ela, o template usa uma página genérica)
  pagina?: Pagina;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
