// Formato do plano de edição do modelo Demo, versão deitada (16:9, 1920×1080, o vídeo completo do
// YouTube). O template renderiza qualquer vídeo a partir dele. Os campos são os mesmos do vertical;
// muda só onde cada coisa fica no quadro (tema.ts) e a base do vídeo longo (camera.ts).
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática do Demo (copiada de um Reel de 894 comentários, sem motion graphic): a pessoa fala
// corrida e a edição é só o que ela mostra, em 3 layouts trocados em corte seco. No quadro deitado,
// com a composição da aula 9 do curso (editar uma aula horizontal):
//   split = o insert no quadro da esquerda (x 0 a 1180, na altura toda, sem borda) e a pessoa na
//           moldura da direita, com o rosto centralizado e acompanhado;
//   cheio = o insert no quadro inteiro (a pessoa some, só a voz fica);
//   eu    = a pessoa em tela cheia, um pouco mais fechada (zoom 1,12), quando fala direto ao
//           espectador. É a base do vídeo longo: fora dos momentos, ela volta para cá.
// Na emenda do split (a linha vertical x 1180), uma faixa-rótulo verde (a `abertura`) só durante o
// gancho. Legenda laranja-ouro em caixa-alta, 2 a 3 palavras, no terço de baixo, em 100% do tempo.
// Sem transição, sem logo, sem texto de CTA na tela, termina na última palavra.
//
// A assinatura é a `tela` (gravação de tela real: captura de página que a câmera percorre, com
// cursor que clica na ordem da fala), a `imagem` (foto/arte no quadro, com movimento lento) e a
// `abertura` (a faixa verde). Os outros 10 blocos universais (topicos, passos, numero, comparacao,
// grafico, destaque, definicao, frase, pergunta, cta) têm os mesmos campos de todos os modelos e,
// quando entram, ocupam o quadro da esquerda (split), em corte seco. O `cta` vem em layout "eu".
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Ícones de traço (destaque)
export type Icone =
  | "carrinho"
  | "etiqueta"
  | "relogio"
  | "alerta"
  | "certo"
  | "errado"
  | "dinheiro"
  | "casa"
  | "coracao"
  | "ideia"
  | "calendario"
  | "seta"
  | "estrela"
  | "lupa"
  | "sobe"
  | "cai"
  | "pessoa"
  | "raio";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua durante o momento; false = some.
  // Padrão: continua em tudo, menos em frase, pergunta e cta (a moldura já mostra a fala).
  legenda?: boolean;
  // chapéu: linha pequena em caixa-alta no alto da moldura ("DICA 2", "O ERRO"). Opcional nos blocos.
  chapeu?: string;
  // layout do trecho: "split" (padrão), "cheio" (só tela/imagem) ou "eu" (padrão do cta). Fora de
  // qualquer momento, a pessoa fica em tela cheia (a base do vídeo longo)
  layout?: "split" | "cheio" | "eu";
};

// ——— a assinatura ———

// Um ponto da câmera sobre a captura: `x` e `y` são o centro do que se vê, em frações da captura
// inteira (0 = esquerda/topo, 1 = direita/base); `zoom` 1 = a captura inteira na largura do insert
// (1180 px no split, 1920 px no cheio).
export type Vista = { x: number; y: number; zoom: number };

// Onde o cursor está num instante. Ele desliza de um ponto ao seguinte; `clique` desenha o toque.
export type PontoCursor = { x: number; y: number; em: number; clique?: boolean };

// Um trecho da gravação de tela: uma captura real de página (public/tela/<captura>.jpg, feita com
// `node ferramentas/capturar.mjs`) que a câmera percorre de `ini` a `fim` sem parar, com o cursor.
export type Tela = Base & {
  tipo: "tela";
  captura: string;
  // altura ÷ largura da captura (o capturar.mjs imprime)
  proporcao: number;
  ini: Vista;
  fim: Vista;
  cursor?: PontoCursor[];
};

// Uma imagem (foto, arte, print) no insert (quadro da esquerda ou quadro inteiro), com aproximação
// lenta. `imagem.id` vem de plano.imagens.
export type ImagemMomento = Base & { tipo: "imagem"; imagem: ImagemNoMomento; efeito?: "aproximar" | "afastar" | "panoramica" };

// ——— os blocos universais ———

// A abertura é o RÓTULO verde na emenda do split: o benefício ("Venda mais com o seu site").
// Aparece pronto desde o primeiro quadro e some em corte seco no `ate`.
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// `imagem` (opcional): o id de uma imagem do plano, que vira miniatura no lugar do marcador.
export type Item = { texto: string; em: number; detalhe?: string; imagem?: string };
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
  titulo?: string;
};

export type LadoDaComparacao = { rotulo: string; texto: string; em: number };
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

export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
  icone?: Icone;
};

export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// `opcoes[].imagem` (opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Tela
  | ImagemMomento
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

// Reenquadramento (opcional). Sem isto, a câmera alterna sozinha entre os zooms do modelo em cada
// corte. Um item em `em` começa um enquadramento novo ali: num corte, escolhe o zoom daquele
// trecho; fora de um corte, é um "soco" de câmera na palavra (use pouco, nas ênfases).
// `aproximar`: aproximação lenta (até ~5%) durante o trecho.
export type Camera = { em: number; zoom?: number; aproximar?: boolean };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1080 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro 1920×1080 (0–1); o `rastro` (e o `quadro`) vêm junto quando o motor
  // seguiu o rosto: é ele que deixa a moldura da direita acompanhar o rosto com suavidade
  rosto: Rosto;
  // faixa abaixo do queixo (o motor calcula; o Demo não usa: ele reposiciona a pessoa)
  zona?: { topo: number; altura: number };
  // nome e área: chapéu discreto no palco durante a abertura (vazio = sem)
  marca: { nome: string; area: string };
  // som tonal baixo quando uma imagem entra no palco (padrão: true)
  sfx?: boolean; // o Demo não usa som de efeito (deixe false)
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  camera?: Camera[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
