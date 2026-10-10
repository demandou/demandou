// Formato do plano de edição do modelo Manchete. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática da Manchete (o jeito de um Reel de notícia comentada): tela dividida na horizontal. A
// faixa de cima (x 0–1080, y 0–600, toda preenchida pela imagem) é o B-roll, SEMPRE ocupada, trocando em corte
// seco a cada 6 a 14 s na virada de ideia. Embaixo, a pessoa em plano fixo (sem zoom, sem corte
// visível) com a legenda palavra a palavra, branca, sem caixa, logo abaixo do queixo. No começo, a
// tarja de pergunta provocativa. Nada de animação: só corte seco.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md); aqui ocupam a faixa de cima. A assinatura é o `manchete` (B-roll + tarja) e a `insercao` (o B-roll seguinte).
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

// Ícones de traço que se desenham na faixa (destaque)
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
  // Padrão do Manchete: continua em tudo (o palco fica em cima, a legenda embaixo), menos na abertura,
  // frase, pergunta e cta (o palco já mostra a fala).
  legenda?: boolean;
  // chapéu: linha pequena em caixa-alta no alto do palco ("DICA 2", "O ERRO"). Opcional em tudo.
  chapeu?: string;
};

// ——— a assinatura ———

// Troca de ângulo dentro do mesmo B-roll (corte seco): outro foco, outro enquadramento (`zoom`, 1 a 1,5)
// ou outro movimento da foto.
export type Angulo = { em: number; zoom?: number; foco?: { x: number; y: number }; efeito?: "aproximar" | "afastar" | "panoramica"; direcao?: "esquerda" | "direita" };

// O B-roll da faixa de cima: a foto do que a fala nomeia, em corte seco, até o próximo B-roll.
// `em` = quando a coisa é dita (o momento costuma começar nesse instante).
export type Insercao = Base & {
  tipo: "insercao";
  imagem: ImagemNoMomento;
  em: number;
  angulos?: Angulo[];
  // fonte/crédito miúdo no canto da foto ("Foto: Agência X")
  credito?: string;
};

// A abertura do Reel: B-roll + a TARJA (pergunta provocativa, 2 a 4 palavras, colada na borda de
// baixo da faixa, centrada).
// A tarja entra no primeiro quadro e sai em `tarjaAte` (~6 s, num corte de B-roll; padrão: o fim do momento).
export type Manchete = Base & {
  tipo: "manchete";
  imagem: ImagemNoMomento;
  em: number;
  tarja: string;
  tarjaAte?: number;
  angulos?: Angulo[];
  credito?: string;
};

// ——— os blocos universais, na linguagem do Manchete ———

export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number };

// `imagem` (do Manchete, opcional): o id de uma imagem do plano, que vira miniatura no lugar do marcador.
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

// `opcoes[].imagem` (do Manchete, opcional): o id de uma imagem do plano, que vira miniatura na opção.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number; imagem?: string }[]; em?: number };

export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number };

export type Momento =
  | Manchete
  | Insercao
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

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro, a partir do topo (1920 = quadro cheio)
  videoAltura?: number;
  // centro do rosto no quadro (0–1), com o rastro quando houver
  rosto: Rosto;
  // faixa abaixo do queixo (o motor calcula; o Manchete não usa: ele reposiciona a pessoa)
  zona?: { topo: number; altura: number };
  // nome e área: chapéu discreto no palco durante a abertura (vazio = sem)
  marca: { nome: string; area: string };
  // som tonal baixo quando uma imagem entra no palco (padrão: true)
  sfx?: boolean;
  // onde há corte no vídeo de trabalho (o motor preenche)
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  imagens?: ImagensDoPlano;
};
