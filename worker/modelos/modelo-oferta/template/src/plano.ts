// Formato do plano de edição do modelo Oferta. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// A gramática: a página de uma oferta premium que se monta na fala. A pessoa fica sempre embaixo,
// numa moldura larga; em cima fica a PÁGINA, onde tudo acontece: a pilha de entregas (cada uma
// cai como um cartão com o objeto), o valor âncora, o risco vermelho, o preço que despenca e bate,
// o selo de garantia que carimba, a contagem do prazo e o botão que leva um toque.
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md) e aqui ganham a linguagem da página: cartões de papel marfim, tinta verde
// profunda, o vermelho só no risco.
// A assinatura é a `oferta` (pilha + âncora riscada + preço). Junto vêm a `garantia` (o selo) e o
// `prazo` (a contagem do prazo); o `cta` vira o botão com um toque.
import type { Rosto } from "./motor/caixa";
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento (padrão: some, a página mostra a fala)
  legenda?: boolean;
};

// Ícones de traço desenhados pelo modelo (para itens sem imagem). Sem ícone, o cartão mostra o
// número do item num selo.
export type NomeIcone =
  | "aula"
  | "documento"
  | "pasta"
  | "chamada"
  | "presente"
  | "comunidade"
  | "certificado"
  | "suporte"
  | "grafico"
  | "escudo"
  | "calendario"
  | "estrela"
  | "carrinho"
  | "moeda"
  | "check";

export type Item = { texto: string; em: number; detalhe?: string; imagem?: ImagemNoMomento; icone?: NomeIcone };

// ——— a assinatura ———

// Uma entrega da pilha. O cartão cai na palavra que a nomeia (`em`) e pousa sobre a pilha.
// `preco`: o valor dela, SÓ se for dito ("um bônus de 197") — texto livre, aparece numa etiqueta.
// `imagem` (id de plano.imagens) ou `icone`; sem nenhum dos dois, o selo com o número do item.
export type Entrega = { texto: string; em: number; detalhe?: string; preco?: string; imagem?: ImagemNoMomento; icone?: NomeIcone };

// Um valor da oferta: número (`valor`, conta e se formata em pt-BR com `prefixo`/`sufixo`/`casas`)
// ou texto (`texto`: "grátis", "o preço de um café", "zero"). `rotulo` = as palavras ditas antes
// ("Tudo isso valeria", "Hoje sai por"), montadas palavra por palavra a partir de `rotuloEm`.
export type ValorDaOferta = {
  valor?: number;
  texto?: string;
  em: number;
  rotulo?: string;
  rotuloEm?: number;
  prefixo?: string;
  sufixo?: string;
  casas?: number;
};

// A oferta: `titulo` (opcional, só se for dito: "Você leva") no alto da pilha; `itens` (1 a 5)
// caem um a um; `ancora` = o valor de referência ("valeria 997", "custava", "de 997"), que conta
// até o número na palavra; `preco` = o preço real: em `riscoEm` (padrão: o início do rótulo do
// preço) o risco vermelho atravessa a âncora, a âncora DESPENCA contando até o preço e o preço
// BATE grande no `em` dele. Sem `ancora`, o preço só bate. Sem números (`texto` nos dois),
// a âncora riscada cai e o texto do preço bate (modo ilustrativo).
// Garantia, prazo e cta que começam logo depois (≤ 0,3 s) continuam a mesma página: o preço sobe
// para o alto como um resumo e eles se montam embaixo dele.
export type Oferta = Base & {
  tipo: "oferta";
  titulo?: string;
  em?: number;
  itens: Entrega[];
  ancora?: ValorDaOferta;
  preco?: ValorDaOferta & { riscoEm?: number };
  ilustrativo?: boolean;
};

// O selo de garantia: carimba no `em` (a palavra "garantia"/"garantido"/a promessa).
// `texto` corre em volta do selo ("garantia", "sem risco", "satisfação garantida");
// `valor` + `unidade` no centro ("7" + "dias"), entrando em `valorEm` (a palavra do número).
// Sem `valor`, o centro mostra o escudo com o ✓.
export type Garantia = Base & { tipo: "garantia"; texto: string; em: number; valor?: string; unidade?: string; valorEm?: number };

// A contagem do prazo: `texto` (a frase dita: "só até domingo", "só hoje", "últimas vagas") monta
// palavra por palavra a partir de `em`. Com `dia` (o dia da semana dito), a semana aparece numa
// régua e o tempo corre até o dia, que acende em `diaEm`. Sem `dia`, uma barra de tempo esvazia
// até `fimEm` (padrão: o fim do momento).
export type Dia = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
export type Prazo = Base & { tipo: "prazo"; texto: string; em?: number; dia?: Dia; diaEm?: number; fimEm?: number };

// ——— os 11 blocos universais ———

// abertura: aceita também `imagem` (o produto/objeto do título, entra em `imagemEm`).
export type Abertura = Base & { tipo: "abertura"; texto: string; destaque?: string; em?: number; imagem?: ImagemNoMomento; imagemEm?: number };
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
// cta: vira o BOTÃO da página; `toqueEm` = quando o dedo toca (padrão: a última palavra do texto).
export type Cta = Base & { tipo: "cta"; texto: string; icone?: "salvar" | "seguir" | "comentar" | "link"; destaque?: string; em?: number; toqueEm?: number };

export type Momento =
  | Oferta
  | Garantia
  | Prazo
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
  // centro do rosto no quadro (0–1); o `rastro` vem junto quando o motor seguiu o rosto
  rosto: Rosto;
  // faixa abaixo do queixo (a Oferta não usa: a pessoa fica sempre na moldura de baixo)
  zona?: { topo: number; altura: number };
  // nome e área de quem fala: a tarja no alto da moldura (vazio = sem tarja)
  marca: { nome: string; area: string };
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
  imagens?: ImagensDoPlano;
};
