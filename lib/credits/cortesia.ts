import { prisma } from "@/lib/db/prisma";
import { lerEstadoDaReprovacao, refazerSemCobrar, type EstadoDaReprovacao } from "@/lib/credits/reprovacao";

/**
 * A POLÍTICA DE CRÉDITO QUANDO A PEÇA SAI ERRADA.
 *
 * ## A regra de hoje (decisão do Bruno em 08/10/2026)
 *
 * **Refazer não cobra SÓ quando o erro foi verificado.** A peça reprovada
 * passa a carregar um motivo (lib/credits/reprovacao.ts), e o motivo é
 * conferido contra as provas automáticas pelo código e pelo JEV; o que não se
 * confirma vai ao admin decidir. Quando o erro é confirmado (pelas provas ou
 * pelo admin), os créditos da peça voltam na hora e UM refazer é grátis. Em
 * qualquer outro caso o refazer cobra: "não gostei" e "pedi diferente" são
 * gosto, e gosto é trabalho novo.
 *
 * ## Por que mudou (a regra de 22/09, card 525, que valeu até 08/10)
 *
 * Até 08/10 valia: "refazer não cobra quando a peça foi REPROVADA", por quem
 * fosse (a revisora ou o cliente no calendário), com um teto de três por
 * projeto por dia. A observação do Bruno de 19/09 ("gera muita coisa errada e
 * consome os créditos tudo") continua certa, mas a regra antiga tinha um
 * furo que o teste como cliente mostrou: o botão de reprovar não perguntava
 * nada, então reprovar por gosto virava refazer de graça, e a cobrança por
 * geração ficava sem sentido. Pior, a plataforma não aprendia nada: reprovar
 * sem motivo é um clique mudo.
 *
 * O que ficou da regra antiga: o cliente nunca paga duas vezes pelo NOSSO
 * defeito (erro confirmado devolve e refaz de graça). O que saiu: a reprovação
 * por si só não vale mais como prova; a prova é a conferência, ou o admin.
 *
 * ## O teto por dia
 *
 * Continua, pelo mesmo motivo de sempre: um defeito sistemático (prompt ruim,
 * fornecedor fora do ar) vira prejuízo ilimitado se cada tentativa é grátis e
 * o custo do fornecedor não é. Passou de três, o refazer volta a cobrar, com a
 * frase dizendo o porquê, e o problema é para consertar a esteira. O número
 * é o único aqui que é opinião, e mora sozinho para ser trocado sem mexer na
 * regra.
 */
export const CORTESIAS_POR_DIA = 3;

export type Cortesia = { motivo: string } | null;

/** O que torna um refazer "de cortesia" aos olhos desta política. */
export type EstadoDaPeca = {
  /** `status` do post. Fica por compatibilidade: desde 08/10 ele sozinho não dá cortesia. */
  status: string;
  /**
   * A reprovação com motivo gravada em `post.metadata.reprovacao`. Só ela dá
   * cortesia, e só com `situacao: "devolvido"` (erro confirmado pelas provas
   * ou reconhecido pelo admin) e o refazer grátis ainda não usado.
   */
  reprovacao?: EstadoDaReprovacao | null;
  /**
   * A revisora reprovou esta peça nesta campanha. Desde 08/10 é PROVA para a
   * conferência da reprovação (lib/credits/reprovacao-pelo-jev.ts), e não
   * cortesia por si só.
   */
  reprovadaPelaRevisora?: boolean;
};

/**
 * Decide, sem tocar no banco, se este refazer é de cortesia.
 *
 * Puro de propósito: é a regra que a tela precisa mostrar ANTES do clique (o
 * botão diz o custo), e é a mesma que o servidor aplica. Duas contas para a
 * mesma pergunta foi o que fez a janela dizer 688 e o servidor cobrar 1.092.
 */
export function decidirCortesia(peca: EstadoDaPeca, cortesiasHoje: number): Cortesia {
  if (cortesiasHoje >= CORTESIAS_POR_DIA) return null;
  if (refazerSemCobrar(peca.reprovacao)) {
    return { motivo: peca.reprovacao?.decididoPor === "admin" ? "erro reconhecido pelo admin" : "erro confirmado pelas provas" };
  }
  return null;
}

/** O estado da peça para a política, a partir do post gravado. */
export function estadoDaPecaParaCortesia(post: { status: string; metadata: unknown }): EstadoDaPeca {
  return { status: post.status, reprovacao: lerEstadoDaReprovacao(post.metadata) };
}

/** Quantas cortesias este projeto já usou no dia corrente. */
export async function cortesiasDeHoje(projectId: string, agora = new Date()): Promise<number> {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  return prisma.creditTransaction.count({
    where: {
      projectId,
      operation: "refazer_peca",
      amount: 0,
      createdAt: { gte: inicio },
      note: { contains: "Sem cobrança" },
    },
  });
}

/**
 * A revisora reprovou esta peça?
 *
 * O parecer dela vive no card da campanha, e o veredito é a palavra REPROVADO
 * no conteúdo. Procura-se pelo par (execução, dia), que é a chave do dia da
 * campanha, porque o parecer é do DIA e não de cada rede: uma reprovação de
 * texto derruba as peças daquele dia juntas. Desde 08/10 entra como prova na
 * conferência da reprovação, e não como cortesia direta.
 */
export async function reprovadaPelaRevisora(post: {
  runId: string | null;
  dayOfWeek: number | null;
}): Promise<boolean> {
  if (!post.runId || post.dayOfWeek === null) return false;
  const card = await prisma.campaignCard.findFirst({
    where: { runId: post.runId, dayOfWeek: post.dayOfWeek, agentId: { contains: "vera" } },
    select: { content: true },
    orderBy: { createdAt: "desc" },
  });
  return /REPROVADO/i.test(card?.content ?? "");
}
