// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// O vídeo inteiro é o visor de uma câmera fictícia: cantos de enquadramento, leituras de ISO e
// velocidade no alto, seletor de modos e obturador embaixo. A pessoa aparece em tela cheia (é ela
// que está no visor) ou divide a tela com uma cena ilustrada simples (uma xícara na mesa) que
// melhora a cada ajuste: a lente é limpa, a grade dos terços liga, o assunto sai do centro.

// Onde a pessoa fica durante um momento
//   cheia  — tela cheia (a pessoa é o visor)
//   topo   — cartão em cima à direita, painel do rótulo à esquerda, cena ilustrada larga embaixo
//   janela — a cena ocupa o visor e a pessoa vira a janelinha da câmera frontal, no canto
//   lado   — a pessoa numa coluna à esquerda, a cena à direita
//   mini   — só na comparação: as duas fotos ocupam o visor e a pessoa vira uma janelinha pequena
export type Lugar = "cheia" | "topo" | "janela" | "lado" | "mini";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
  // nome no seletor de modos, embaixo (cada tipo tem um padrão: FOTO, LENTE, GRADE, FOCO…)
  modo?: string;
  // no bloco `comparacao`, `modo` é o estilo da comparação: o nome do seletor vem deste campo
  seletor?: string;
  // onde a pessoa fica (cada tipo tem um padrão; veja references/plano.md)
  pessoa?: Lugar;
};

// Número do ajuste: vira "AJUSTE 01" em cima do título e acende quando o número é dito.
type ComNumero = {
  numero?: number;
  numeroEm?: number;
  // texto no lugar de "AJUSTE 01" (ex.: "DICA 1")
  rotulo?: string;
};

export type NomeIcone = "digital" | "xis" | "camiseta" | "sol" | "grade" | "check" | "nivel" | "lupa" | "seguir" | "salvar" | "comentar" | "link";

// Abertura: o visor liga (cantos fecham, leituras assentam) e o título se monta palavra por palavra
// em cima do peito, enquanto a detecção de rosto acha a pessoa.
export type Abertura = Base & {
  tipo: "abertura";
  // bloco universal: o título inteiro; o modelo quebra em até 3 linhas e reduz o corpo até caber
  texto?: string;
  // 2 ou 3 linhas, com as palavras NA ORDEM EM QUE SÃO FALADAS (se faltar, sai de `texto`)
  linhas?: string[];
  // palavra ou trecho exato que ganha o acento (ex.: "3")
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // letreiro pequeno em cima do título (ex.: "Fotografia no celular")
  rotulo?: string;
};

// O que acontece com a cena ilustrada num ajuste
//   limpar    — lente engordurada: a cena está embaçada, com uma digital; um tecido passa e limpa
//   tercos    — a grade dos terços se desenha e o assunto sai do centro para uma das linhas
//   foco      — a cena está desfocada; um toque no assunto e ela fica nítida
//   luz       — a cena está escura; a régua de exposição sobe e a luz entra
//   horizonte — a cena está torta; o nível gira até a linha do horizonte ficar reta
export type Acao = "limpar" | "tercos" | "foco" | "luz" | "horizonte";

export type Cena = Base &
  ComNumero & {
    tipo: "cena";
    // título curto com palavras faladas ("Limpa a lente"), até ~18 caracteres
    titulo: string;
    // segunda linha com palavras faladas ("com a camiseta"), até ~24 caracteres
    detalhe?: string;
    acao: Acao;
    // quando a ação começa e termina (padrão: termina 1,4 s depois)
    acaoEm: number;
    acaoAte?: number;
    // quando a grade dos terços se desenha (no `tercos`, padrão: 0,4 s antes da ação)
    gradeEm?: number;
    // `tercos`: quando o centro é riscado com um ✕ ("não no centro")
    marcaEm?: number;
    // `tercos`: para qual linha o assunto vai: "esquerda" (padrão) ou "direita"
    lado?: "esquerda" | "direita";
    // selo extra com ícone, no instante em que a frase é dita ("vive engordurada")
    nota?: { texto: string; em: number; icone?: NomeIcone };
  };

// Qualquer assunto: a cena é uma METÁFORA da dica. limpar = tirar o ruído; tercos = tirar do óbvio e
// reposicionar; foco = ganhar clareza; luz = dar visibilidade; horizonte = endireitar.

// Foco no rosto: um toque na tela, o quadrado de foco procura e trava no rosto; depois a régua de
// exposição aparece ao lado e o sol sobe enquanto a imagem clareia.
export type Foco = Base &
  ComNumero & {
    tipo: "foco";
    titulo?: string;
    detalhe?: string;
    // o toque na tela ("Toca") e a trava do foco ("focar")
    toqueEm: number;
    travaEm: number;
    // a régua de exposição: quando o arrasto começa ("arrasta") e termina ("luz")
    luzEm?: number;
    luzAte?: number;
    // valor que a régua mostra no fim (padrão "+0,7")
    ev?: string;
    // qualquer assunto: texto livre no lugar de "FOCO TRAVADO" (ex.: "NA MIRA") e valor livre no lugar do EV (ex.: "+40%")
    selo?: string;
    valor?: string;
    // ajuste do quadrado de foco, em frações do quadro: deslocamento x/y e tamanho (largura do quadrado)
    quadro?: { x?: number; y?: number; tamanho?: number };
  };

// Comparação: as duas fotos ocupam o visor, uma em cima da outra, e a pessoa vira uma janelinha.
// O obturador dispara (piscar suave) e a foto nova vira o cartão DEPOIS; a foto antiga (com todos os
// defeitos dos ajustes do vídeo) entra como ANTES; a grade cobre as duas.
export type Comparar = Base & {
  tipo: "comparar";
  // o disparo ("Fotografa")
  disparoEm: number;
  // quando a foto antiga entra ("mesma cena")
  antesEm: number;
  // quando a grade cobre as duas e o resultado acende ("compara")
  compararEm: number;
  // nomes dos cartões (padrão "ANTES" e "DEPOIS")
  antes?: string;
  depois?: string;
  // qualquer assunto: uma frase curta embaixo de cada cartão ("compra por impulso" / "com critério")
  antesTexto?: string;
  depoisTexto?: string;
};

// Fechamento: cartão de perfil (nome e área da `marca`) com o botão que é apertado quando a ação é dita;
// no fim, a câmera tira uma foto da pessoa e ela voa para a galeria.
export type Cta = Base & {
  tipo: "cta";
  // chamada com palavras faladas ("Me segue")
  texto: string;
  // palavra ou trecho exato do texto que ganha o acento
  destaque?: string;
  // instante em que o texto começa a ser dito (padrão: `de`)
  em?: number;
  // bloco universal: o que o botão pede (salvar, seguir, comentar, link); `acao` continua valendo
  icone?: "salvar" | "seguir" | "comentar" | "link";
  // segunda linha ("pra mais dicas")
  detalhe?: string;
  // quando o botão é apertado (padrão: 0,4 s depois do começo)
  botaoEm?: number;
  // o que o botão pede: seguir (padrão) ou salvar
  acao?: "seguir" | "salvar";
  // última batida: o obturador tira uma foto da pessoa, que voa para a galeria (o contador vira).
  // Padrão: 0,6 s depois do botão. Use `false` para não tirar a foto.
  fotoEm?: number | false;
};

// ---------- os 11 blocos universais (motor/BLOCOS.md) ----------
// Tempos `em` = o instante da palavra dita. Os blocos de lista, passos, comparação e gráfico usam o
// lugar `topo` ou `janela` (a pessoa num cartão, o conteúdo numa tela de vidro); os outros ficam em
// tela cheia, num rótulo de vidro no peito.

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
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

export type Momento = Abertura | Cena | Foco | Comparar | Cta | Topicos | Passos | Numero | Comparacao | Grafico | Destaque | Definicao | Frase | Pergunta;

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (1920 = 9:16; 1440 = recorte 3:4)
  videoAltura?: number;
  // centro do rosto no quadro (0–1): ancora a pessoa nos cartões e o quadrado de foco
  rosto: { x: number; y: number };
  // não usada por este modelo (a pessoa é reposicionada); o motor preenche
  zona?: { topo: number; altura: number };
  // nome e área: aparecem no cartão de perfil do fechamento
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
