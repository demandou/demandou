import { decidirChoice, jevLigado, perguntarAoJev, type RespostaDoJev, type UsoDoJev } from "@/lib/jev/cliente";

/**
 * A TÉCNICA DO CORTE (editor avançado, 10/10/2026): qual das três aulas
 * explica melhor ESTA fala. Decisão, então é do JEV ("Claude só escreve, JEV
 * decide"): uma pergunta de escolha com a fala inteira no estado. Confiança
 * baixa ou JEV fora do ar: o recorte com letreiro, a assinatura do cartão
 * "Edição sob medida".
 */
export const TECNICAS = ["maquete-3d", "recorte-letreiro", "graficos", "moldura-explicativa"] as const;
export type TecnicaDoCorte = (typeof TECNICAS)[number];
export const TECNICA_PADRAO: TecnicaDoCorte = "recorte-letreiro";

export const CRITERIOS_DA_TECNICA: Record<TecnicaDoCorte, string> = {
  "maquete-3d":
    "Aula 8.1, maquete 3D: a fala descreve algo com forma, lugar ou partes físicas que se montam, se organizam ou se preparam (um ambiente, uma estrutura, uma construção, um objeto em camadas, um espaço). Uma maquete que se abre em camadas e se reconstrói mostra a ideia melhor que palavras.",
  "recorte-letreiro":
    "Aula 8.2, recorte com letreiro: a fala é um argumento ou conceito com palavras-chave fortes (definição, contraste, sim e não, o que é e o que não é). Palavras grandes atrás da pessoa recortada e tipografia cinética dão hierarquia à mensagem.",
  graficos:
    "Aula 6, gráficos com função: a fala traz números, valores, comparação ou um movimento de subir, cair, romper ou crescer. Um gráfico que se desenha na palavra dita, um card e ícones que entram um por vez explicam melhor que a pessoa sozinha.",
  "moldura-explicativa":
    "Aula 7, moldura e motion explicativo: a fala enumera passos, pontos ou itens de um processo (primeiro, segundo, três pontos, planejar, acompanhar). A pessoa vai para uma moldura e cartões com ícones animados explicam cada ponto.",
};

export type JuizDaTecnica = typeof perguntarAoJev;

export async function decidirTecnica(p: {
  fala: Array<{ w: string }>;
  duracao: number;
  nicho?: string | null;
  projectId?: string | null;
  juiz?: JuizDaTecnica;
  uso?: UsoDoJev;
}): Promise<{ tecnica: TecnicaDoCorte; confianca: number | null; probabilidades: Record<string, number> | null; motivo: string }> {
  const juiz = p.juiz ?? perguntarAoJev;
  if (juiz === perguntarAoJev && !jevLigado()) return { tecnica: TECNICA_PADRAO, confianca: null, probabilidades: null, motivo: "JEV desligado: o padrão" };
  const texto = p.fala.map((x) => x.w).join(" ").slice(0, 4000);
  let r: Record<string, RespostaDoJev>;
  try {
    r = await juiz(
      { projectId: p.projectId ?? null, etapa: "editor-avancado-tecnica", uso: p.uso, state: { fala: texto, duracaoSegundos: Math.round(p.duracao), assuntoDoPerfil: p.nicho ?? null } },
      {
        tecnica: {
          type: "choice",
          instructions: "Qual técnica de edição avançada explica melhor ESTA fala num vídeo? Escolha pelo conteúdo da fala, não pelo assunto do perfil.",
          criteria: { ...CRITERIOS_DA_TECNICA },
        },
      }
    );
  } catch (e) {
    return { tecnica: TECNICA_PADRAO, confianca: null, probabilidades: null, motivo: `JEV falhou (${e instanceof Error ? e.message.slice(0, 80) : e}): o padrão` };
  }
  const resposta = r.tecnica;
  const tecnica = decidirChoice(resposta, TECNICAS, TECNICA_PADRAO, 0.5);
  const confianca = resposta && resposta.type === "choice" ? resposta.confidence : null;
  const probabilidades = resposta && resposta.type === "choice" ? resposta.probabilities : null;
  return { tecnica, confianca, probabilidades, motivo: resposta ? (tecnica === TECNICA_PADRAO && resposta.type === "choice" && resposta.choice !== tecnica ? "confiança baixa: o padrão" : "o JEV escolheu") : "sem resposta: o padrão" };
}
