/**
 * O EDITOR AVANÇADO NOS CORTES (10/10/2026): as aulas do curso feitas pela
 * plataforma para cada corte, escritas para a fala de cada um, SEMPRE nas
 * cores e na letra da marca do projeto. Decisão do Bruno (10/10, tarde): as
 * três provas das aulas viram TRÊS OPÇÕES escolhíveis na biblioteca, no topo,
 * ao lado dos modelos 3D, guardadas por projeto como os modelos do curso (a
 * mesma memória "modelo-do-curso", com os ids abaixo):
 *
 *   sob-medida-3d        aula 8.1  a maquete 3D que explica a ideia
 *   sob-medida-recorte   aula 8.2  a pessoa recortada com as palavras atrás da cabeça
 *   sob-medida-graficos  aula 6    os gráficos que se desenham na palavra dita (o kit cripto)
 *
 * `sob-medida` (sem técnica) também vale: aí o JEV escolhe a aula pela fala.
 * Puro (testado), sem banco.
 *
 * A trava é EDITOR_AVANCADO=1 (desligada por padrão). Desligada, as opções
 * somem da biblioteca e o projeto que tinha escolhido uma delas segue o modelo
 * do curso de reserva (ou o editor de antes).
 */
export const ID_SOB_MEDIDA = "sob-medida";

export type TecnicaDaOpcao = "maquete-3d" | "recorte-letreiro" | "graficos";

export type OpcaoSobMedida = {
  id: string;
  tecnica: TecnicaDaOpcao;
  aula: string;
  nome: string;
  resumo: string;
  /** O ícone do cartão (lucide). */
  icone: "box" | "scissors" | "chart";
};

export const OPCOES_SOB_MEDIDA: readonly OpcaoSobMedida[] = [
  {
    id: "sob-medida-3d",
    tecnica: "maquete-3d",
    aula: "Aula 8.1",
    nome: "Maquete 3D",
    resumo: "Uma maquete em 3D de verdade que se monta, se abre em camadas e se reconstrói enquanto você explica, com você numa moldura ao lado.",
    icone: "box",
  },
  {
    id: "sob-medida-recorte",
    tecnica: "recorte-letreiro",
    aula: "Aula 8.2",
    nome: "Recorte com letreiro",
    resumo: "Você recortado do fundo, com as palavras-chave grandes passando atrás da sua cabeça e uma moldura que se desenha conforme a fala.",
    icone: "scissors",
  },
  {
    id: "sob-medida-graficos",
    tecnica: "graficos",
    aula: "Aula 6",
    nome: "Gráficos que se desenham",
    resumo: "Gráficos, números e cards que entram na palavra dita, um por vez, acima da sua cabeça: o número que você falou, nunca um inventado.",
    icone: "chart",
  },
];

/** O que vale para as três: dito no cartão e no resumo do envio. */
export const DETALHE_DO_SOB_MEDIDA =
  "Cada corte ganha uma edição própria, escrita para a sua fala, sempre nas cores e na letra da sua marca. Leva mais tempo que um modelo pronto; se um corte não sair, ele é montado pelo modelo que você usava antes.";

export function editorAvancadoLigado(): boolean {
  return process.env.EDITOR_AVANCADO === "1";
}

/** O modelo de texto que escreve as cenas (decisão do Bruno, 10/10: Sonnet 5). */
export function modeloDasCenas(): string {
  return process.env.EDITOR_AVANCADO_IA || "claude-sonnet-5";
}

/** O id é uma das edições sob medida (as três opções ou a genérica)? */
export function ehSobMedida(id: string | null | undefined): boolean {
  return id === ID_SOB_MEDIDA || OPCOES_SOB_MEDIDA.some((o) => o.id === id);
}

export function opcaoSobMedida(id: string | null | undefined): OpcaoSobMedida | null {
  return OPCOES_SOB_MEDIDA.find((o) => o.id === id) ?? null;
}

/** A técnica fixa da opção (null na genérica: o JEV escolhe pela fala). */
export function tecnicaDaOpcao(id: string | null | undefined): TecnicaDaOpcao | null {
  return opcaoSobMedida(id)?.tecnica ?? null;
}

/** O que fica gravado na memória do projeto quando uma edição sob medida é escolhida. */
export type EscolhaSobMedida = { modelo: string; reserva: string | null; em: string };

/**
 * A RESERVA DA EDIÇÃO SOB MEDIDA, quando um corte falha nela (render, portão,
 * teto de IA): vai para o modelo do curso que o projeto usava antes (gravado
 * em `reserva` na escolha) se ele ainda serve no corte; sem ele, para o editor
 * de antes. Com a trava desligada, a mesma regra vale desde o começo.
 */
export type Reserva = { tipo: "modelo"; modelo: string } | { tipo: "editor" };

export function reservaDoSobMedida(p: { reserva: string | null | undefined; modeloServe: (id: string) => boolean; cursoLigado: boolean }): Reserva {
  if (p.cursoLigado && p.reserva && !ehSobMedida(p.reserva) && p.modeloServe(p.reserva)) return { tipo: "modelo", modelo: p.reserva };
  return { tipo: "editor" };
}

/**
 * Por onde vai um corte, dada a escolha do projeto: a edição sob medida
 * escolhida (trava ligada e o caminho não desistiu neste corte), a reserva,
 * ou nada (o editor de antes). Puro (testado).
 */
export function caminhoDoCorte(p: {
  escolhido: string | null | undefined;
  reserva: string | null | undefined;
  avancadoLigado: boolean;
  cursoLigado: boolean;
  avancadoDesistiu: boolean;
  modeloServe: (id: string) => boolean;
}): { tipo: "sob-medida"; modelo: string } | Reserva {
  if (ehSobMedida(p.escolhido)) {
    if (p.avancadoLigado && !p.avancadoDesistiu) return { tipo: "sob-medida", modelo: p.escolhido as string };
    return reservaDoSobMedida({ reserva: p.reserva, modeloServe: p.modeloServe, cursoLigado: p.cursoLigado });
  }
  if (p.cursoLigado && p.escolhido && p.modeloServe(p.escolhido)) return { tipo: "modelo", modelo: p.escolhido };
  return { tipo: "editor" };
}
