// Formato do plano de edição. O template renderiza qualquer vídeo a partir dele.
// Todos os tempos são em segundos, na linha do tempo do vídeo já cortado.
//
// Gramática do modelo Currículo: uma folha (o documento do assunto) é revisada "a caneta vermelha".
// VERSÃO DEITADA (16:9, 1920×1080), para o vídeo completo do YouTube, pela regra da aula 9 do curso:
// a pessoa em tela cheia é a base (abertura, destaque, fechamento, e os trechos sem momento); quando
// a fala pede a folha, a pessoa vira um bilhete adesivo de papel na MOLDURA do lado direito (rosto
// centralizado e acompanhado) e a folha ocupa o QUADRO do lado esquerdo. O bilhete muda de tamanho:
// pequeno na margem (seções da folha), médio com a folha ampliada (número, comparação, gráfico,
// reescrita) e grande com a pergunta e o cronômetro.
//
// Os 11 blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque,
// definicao, frase, pergunta, cta) têm os mesmos campos em todos os modelos do pack
// (references/plano.md). Aqui eles viram seções da folha e marcas de caneta. Os tipos próprios
// (riscar, marcar, reescrever, paginas, cronometro) são a assinatura da revisão.

import type { Rosto } from "./motor/caixa";

type Base = {
  de: number;
  ate: number;
  // true = a legenda continua aparecendo durante este momento
  legenda?: boolean;
};

// Um texto escrito à mão (caneta vermelha) num instante
export type Nota = { texto: string; em: number };

// Item de lista: entra (ganha tinta) no seu `em`; `detalhe` = nota à mão embaixo dele
export type Item = { texto: string; em: number; detalhe?: string };

// ——— Blocos universais ———

// Abertura: a pessoa em tela cheia e um recorte de papel no peito com o título (uma fileira larga,
// de preferência em 2 linhas), que se monta palavra por palavra; a caneta circula (uma palavra) ou
// sublinha (um trecho) o `destaque`.
// `em` = quando o texto começa a ser dito (padrão: `de`).
export type Abertura = Base & {
  tipo: "abertura";
  texto: string;
  destaque?: string;
  em?: number;
  // rótulo pequeno em caixa alta em cima do título (opcional)
  rotulo?: string;
  // quebra manual em linhas (opcional e raro no 16:9; sem ela o título se quebra sozinho, de
  // preferência em 2 linhas largas)
  linhas?: string[];
  // formato antigo: palavra que a caneta circula e palavra que ela sublinha
  circulo?: string;
  sublinhado?: string;
};

// Lista sem ordem: uma seção da folha com marcadores; cada item ganha tinta e um visto de caneta.
export type Topicos = Base & { tipo: "topicos"; titulo?: string; itens: Item[] };

// Sequência: linhas numeradas à mão; a caneta liga um número ao outro.
export type Passos = Base & { tipo: "passos"; titulo?: string; itens: Item[] };

// Número: escrito grande na folha, conta até `valor` a partir de `em`; a caneta circula no fim.
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

export type LadoComparacao = { rotulo: string; texto: string; em: number };

// Comparação: duas colunas na folha; o lado que perde é riscado, o que ganha leva caixa e visto.
export type Comparacao = Base & {
  tipo: "comparacao";
  titulo?: string;
  modo?: "contra" | "antes-depois" | "errado-certo";
  lados: [LadoComparacao, LadoComparacao];
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

// Gráfico desenhado a caneta na folha: barras, linha ou pizza com os números ditos; sem números,
// uma curva de tendência com a nota "ilustrativo".
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

// Destaque: a pessoa em tela cheia e um bilhete no peito com a frase curta, que a caneta escreve
// (alerta) ou que se monta em tinta e ganha círculo (chave).
export type Destaque = Base & {
  tipo: "destaque";
  texto: string;
  em: number;
  nivel?: "alerta" | "chave";
  detalhe?: string;
  detalheEm?: number;
};

// Definição: o termo em tinta, uma seta de caneta e o significado escrito à mão.
export type Definicao = Base & { tipo: "definicao"; termo: string; em: number; significado: string; significadoEm: number };

// Frase: uma citação que ganha tinta palavra por palavra; `destaque` sublinhado, `risco` riscado.
export type Frase = Base & { tipo: "frase"; texto: string; destaque?: string; risco?: string; riscoEm?: number; em?: number };

// Pergunta: a pessoa vai para o bilhete grande (na moldura da direita); a pergunta se escreve na
// folha com as opções em caixinhas, e um bilhete com "?" entra na margem da folha.
export type Pergunta = Base & { tipo: "pergunta"; texto: string; opcoes?: { texto: string; em: number }[]; em?: number };

// Fechamento: a pessoa volta para a tela cheia; um cartão no peito recebe a chamada
// escrita à mão, palavra por palavra, com o ícone da ação e a assinatura.
export type Cta = Base & {
  tipo: "cta";
  texto: string;
  icone?: "salvar" | "seguir" | "comentar" | "link";
  destaque?: string;
  em?: number;
};

// ——— A assinatura (a revisão a caneta) ———

// Páginas: as folhas do documento lado a lado; as que passam do ideal levam um X e saem.
// O contador grande é riscado e a caneta escreve o número certo.
export type Paginas = Base & {
  tipo: "paginas";
  // número do erro (1, 2, 3…) — acende no comentário e vira um comentário resolvido depois
  erro?: number;
  // resumo do erro no comentário resolvido (até 12 caracteres: "2 páginas")
  resumo?: string;
  // quantas folhas o documento tem e quantas deveria ter
  total: number;
  ideal: number;
  // palavra ao lado do contador (padrão "páginas")
  unidade?: string;
  // quando a caneta marca o X (a palavra do número certo, "duas")
  xEm: number;
  // nota à mão embaixo das folhas ("máx. 2 páginas")
  nota?: Nota;
};

// Riscar: uma seção da folha recebe a frase dita (palavra por palavra), a caneta escreve
// a nota e risca a frase. Serve para qualquer crença, hábito ou frase errada.
export type Riscar = Base & {
  tipo: "riscar";
  erro?: number;
  resumo?: string;
  // título da seção ("Objetivo", "Mito", "Hábito")
  secao: string;
  // a frase, com as palavras NA ORDEM EM QUE SÃO FALADAS ("Busco crescer na empresa.")
  frase: string;
  // quando o risco passa (padrão: logo depois da última palavra da frase)
  riscoEm?: number;
  // nota à mão embaixo da frase ("genérico")
  nota?: Nota;
};

// Marcar: uma seção com 2 a 4 linhas; a caneta abre uma chave em volta delas e escreve
// o diagnóstico embaixo ("tarefas → resultados?").
export type Marcar = Base & {
  tipo: "marcar";
  erro?: number;
  resumo?: string;
  secao: string;
  // linha embaixo do título ("Vendedor · 2021 a 2024"); ganha tinta quando é dita
  subtitulo?: string;
  // linhas do documento; cada uma entra no seu `em`
  linhas: { texto: string; em: number }[];
  // quando a chave se desenha e a nota é escrita ("tarefas")
  nota?: Nota;
  // segunda nota, depois de uma seta ("resultados?"); sem `nota`, a chave fecha na última linha
  pergunta?: Nota;
};

// Reescrever: a câmera chega perto de uma linha; ela é riscada palavra por palavra enquanto
// é dita e a versão nova é escrita à mão embaixo; no fim a troca é aceita e a linha nova
// entra no documento.
export type Reescrever = Base & {
  tipo: "reescrever";
  // a linha como está (de preferência igual a uma linha de um `marcar` anterior), palavras faladas
  antes: string;
  // a linha nova, palavras faladas na ordem ("Aumentei as vendas em 20%")
  depois: string;
  // trecho exato de `depois` que a caneta circula ("20%")
  destaque?: string;
  // seção, se a linha não existir num `marcar` anterior
  secao?: string;
  // quando a troca é aceita (padrão: 0,35 s depois da última palavra de `depois`)
  aceitaEm?: number;
};

// Cronômetro: a pessoa vai para o bilhete grande (na moldura da direita); à esquerda, a folha
// revisada e, entre as duas, um cronômetro cujo ponteiro dá uma volta enquanto ela fala. O olhar do leitor passeia pela folha (pontos e
// traço); a frase dita assenta embaixo do mostrador palavra por palavra.
export type Cronometro = Base & {
  tipo: "cronometro";
  // a frase dita, com as palavras NA ORDEM DA FALA ("Recrutador lê em segundos")
  frase?: string;
  // SÓ se a pessoa disser o número: o mostrador ganha N divisões numeradas e o número assenta
  segundos?: number;
  unidade?: string;
  // quando o ponteiro fecha a volta (padrão: 1,2 s depois do início)
  voltaEm?: number;
  // a palavra de conclusão ("Facilita."): o essencial da folha ganha a caneta
  fim?: Nota;
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
  | Paginas
  | Riscar
  | Marcar
  | Reescrever
  | Cronometro;

// Lugares da pessoa
export type Lugar = "cheio" | "margem" | "embaixo" | "topo";

export type Palavra = { em: number; ate: number; w: string };

export type Plano = {
  video: string;
  fps: number;
  largura: number;
  altura: number;
  duracao: number;
  // altura que o vídeo ocupa no quadro (no 16:9, 1080: o vídeo deitado inteiro)
  videoAltura?: number;
  // centro do rosto no quadro (0–1); o cortar.mjs grava também o `rastro` (o rosto quadro a quadro,
  // que o bilhete acompanha) e o `quadro` em que mediu (1920×1080)
  rosto: Rosto;
  // a faixa abaixo do queixo (px): o cortar.mjs calcula; os cartões em tela cheia ficam do queixo até
  // a base útil (y 948), centrados no rosto
  zona?: { topo: number; altura: number };
  // nome e área: no cabeçalho do comentário e na assinatura do fechamento
  marca: { nome: string; area: string };
  // o documento revisado: o título da folha (o assunto do vídeo, um nome fictício, o título de uma
  // redação…) e a linha de baixo
  documento?: {
    titulo: string;
    subtitulo?: string;
    // seções que só compõem a folha (texto apagado, fora de foco)
    extras?: { titulo: string; linhas: string[] }[];
  };
  // ajuste do enquadramento da pessoa em cada lugar (zoom, ancoraY); raramente necessário
  caixas?: Partial<Record<Lugar, { zoom?: number; ancoraY?: number }>>;
  cortesEm?: number[];
  momentos: Momento[];
  palavras: Palavra[];
  correcoes?: Record<string, string>;
  semLegenda?: { de: number; ate: number }[];
  sfx?: boolean;
};
