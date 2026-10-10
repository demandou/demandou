/**
 * O EDITOR AVANÇADO NOS CORTES (10/10/2026): as aulas 7, 8.1 e 8.2 do curso
 * (maquete 3D e a pessoa recortada com as palavras atrás) feitas pela
 * plataforma, oferecidas na biblioteca como UM cartão especial, "Edição sob
 * medida", escolhido por projeto como os modelos do curso (a mesma memória
 * "modelo-do-curso", com o id `sob-medida`). Puro (testado), sem banco.
 *
 * A trava é EDITOR_AVANCADO=1 (desligada por padrão). Desligada, o cartão some
 * da biblioteca e o projeto que tinha escolhido a edição sob medida segue o
 * modelo do curso de reserva (ou o editor de antes).
 */
export const ID_SOB_MEDIDA = "sob-medida";

export function editorAvancadoLigado(): boolean {
  return process.env.EDITOR_AVANCADO === "1";
}

/** O modelo de texto que escreve as cenas (decisão do Bruno, 10/10: Sonnet 5). */
export function modeloDasCenas(): string {
  return process.env.EDITOR_AVANCADO_IA || "claude-sonnet-5";
}

/** O cartão especial da biblioteca. */
export const CARTAO_SOB_MEDIDA = {
  id: ID_SOB_MEDIDA,
  nome: "Edição sob medida",
  resumo: "Cada corte ganha uma edição própria, escrita para a sua fala: a maquete em 3D que explica a ideia, ou você recortado do fundo com as palavras-chave passando atrás.",
  detalhe: "As aulas 7, 8.1 e 8.2 do curso Máquina de Edição IA feitas pela plataforma, sempre nas cores e na letra da sua marca. Leva mais tempo que um modelo pronto; se um corte não sair, ele é montado pelo modelo que você usava antes.",
} as const;

/** O que fica gravado na memória do projeto quando a edição sob medida é escolhida. */
export type EscolhaSobMedida = { modelo: typeof ID_SOB_MEDIDA; reserva: string | null; em: string };

/**
 * A RESERVA DA EDIÇÃO SOB MEDIDA, quando um corte falha nela (render, portão,
 * teto de IA): vai para o modelo do curso que o projeto usava antes (gravado
 * em `reserva` na escolha) se ele ainda serve no corte; sem ele, para o editor
 * de antes. Com a trava desligada, a mesma regra vale desde o começo.
 */
export type Reserva = { tipo: "modelo"; modelo: string } | { tipo: "editor" };

export function reservaDoSobMedida(p: { reserva: string | null | undefined; modeloServe: (id: string) => boolean; cursoLigado: boolean }): Reserva {
  if (p.cursoLigado && p.reserva && p.reserva !== ID_SOB_MEDIDA && p.modeloServe(p.reserva)) return { tipo: "modelo", modelo: p.reserva };
  return { tipo: "editor" };
}

/**
 * Por onde vai um corte, dada a escolha do projeto: a edição sob medida (trava
 * ligada e o caminho não desistiu neste corte), a reserva, ou nada (o editor
 * de antes). Puro (testado).
 */
export function caminhoDoCorte(p: {
  escolhido: string | null | undefined;
  reserva: string | null | undefined;
  avancadoLigado: boolean;
  cursoLigado: boolean;
  avancadoDesistiu: boolean;
  modeloServe: (id: string) => boolean;
}): { tipo: "sob-medida" } | Reserva {
  if (p.escolhido === ID_SOB_MEDIDA) {
    if (p.avancadoLigado && !p.avancadoDesistiu) return { tipo: "sob-medida" };
    return reservaDoSobMedida({ reserva: p.reserva, modeloServe: p.modeloServe, cursoLigado: p.cursoLigado });
  }
  if (p.cursoLigado && p.escolhido && p.modeloServe(p.escolhido)) return { tipo: "modelo", modelo: p.escolhido };
  return { tipo: "editor" };
}
