/**
 * O CENÁRIO DO VÍDEO (08/10/2026). Pedido do Bruno: "deixe uma opção para o
 * usuário selecionar: trocar fundo do vídeo ou manter cenário original".
 *
 * A escolha mora em `Project.videoEstiloEscolha.cenario` (o mesmo Json do
 * estilo, sem migração): "original" ou "trocar". Ausente é "original", que é
 * a regra de 05/10 ("o cenário do cliente nunca é trocado sem pedido").
 *
 * O EDITOR DE HOJE NUNCA TROCA O FUNDO. A troca chega com o editor novo, e
 * até lá a escolha é guardada, levada ao plano da edição (para o editor novo
 * ler sem migração) e dita na tela com honestidade: quem escolhe "Trocar o
 * fundo" lê que o vídeo, por enquanto, sai com o cenário original. O
 * interruptor é NEXT_PUBLIC_TROCA_DE_FUNDO=1 (público porque a tela também
 * precisa saber o que dizer); desligado, nenhum caminho troca o fundo, nem o
 * editor por comando com o pedido escrito no comando.
 *
 * Módulo puro: a tela (cliente), as rotas e a jornada importam daqui.
 */

export type CenarioDoVideo = "original" | "trocar";

export const CENARIO_PADRAO: CenarioDoVideo = "original";

/** As duas opções, na ordem da tela, cada uma explicada em uma frase. */
export const OPCOES_DE_CENARIO: ReadonlyArray<{ id: CenarioDoVideo; rotulo: string; explicacao: string }> = [
  {
    id: "original",
    rotulo: "Manter o cenário original",
    explicacao: "Você aparece no lugar onde gravou, como está na gravação; as artes entram por cima e saem.",
  },
  {
    id: "trocar",
    rotulo: "Trocar o fundo do vídeo",
    explicacao: "A IA tira o lugar atrás de você e põe um fundo novo, no estilo do vídeo.",
  },
];

/** Uma escolha de cenário válida (qualquer outra coisa é o padrão). Puro. */
export function cenarioValido(v: unknown): v is CenarioDoVideo {
  return v === "original" || v === "trocar";
}

/** O cenário guardado na escolha do estilo (o Json cru do projeto). Ausente ou inválido: "original". Puro. */
export function cenarioDaEscolha(escolhaBruta: unknown): CenarioDoVideo {
  const v = escolhaBruta && typeof escolhaBruta === "object" ? (escolhaBruta as { cenario?: unknown }).cenario : undefined;
  return v === "trocar" ? "trocar" : CENARIO_PADRAO;
}

/**
 * O editor já sabe trocar o fundo? Só com NEXT_PUBLIC_TROCA_DE_FUNDO=1 (o
 * editor novo). Lido como `process.env.NEXT_PUBLIC_...` direto, para o Next
 * levar o valor à tela no build.
 */
export function trocaDeFundoLigada(): boolean {
  return trocaDeFundoNoValor(process.env.NEXT_PUBLIC_TROCA_DE_FUNDO);
}

/** A mesma regra, com o valor na mão (para a prova). Puro. */
export function trocaDeFundoNoValor(valor: string | null | undefined): boolean {
  return valor === "1";
}

/**
 * O FUNDO SERÁ TROCADO NESTE VÍDEO? Só quando o cliente escolheu trocar E o
 * editor já sabe trocar. Qualquer outro caso: o cenário original, sempre. É a
 * única porta para um editor trocar o fundo. Puro.
 */
export function fundoSeraTrocado(cenario: CenarioDoVideo | null | undefined, ligada: boolean): boolean {
  return cenario === "trocar" && ligada;
}

/**
 * A frase honesta da escolha, para a tela e para o resumo "como este vídeo
 * vai ser editado". Com "trocar" e o editor de hoje, diz que a troca chega
 * com o editor novo e que, até lá, o vídeo sai com o cenário original. Puro.
 */
export function resumoDoCenario(cenario: CenarioDoVideo | null | undefined, ligada: boolean): string {
  if (cenario !== "trocar") return "Cenário original: você aparece onde gravou";
  if (ligada) return "Fundo trocado: a IA põe um fundo novo atrás de você, no estilo do vídeo";
  return "Você pediu para trocar o fundo: a troca chega com o editor novo; até lá, o vídeo sai com o cenário original";
}

/** O aviso embaixo da opção "Trocar o fundo" enquanto o editor de hoje não troca. Null quando já troca. Puro. */
export function avisoDaTrocaDeFundo(ligada: boolean): string | null {
  return ligada ? null : "A troca de fundo chega com o editor novo, que está em construção. Até lá, o vídeo sai com o cenário original, e a sua escolha fica guardada para valer assim que ele chegar.";
}
