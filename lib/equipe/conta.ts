import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { fraseDosCreditosDaEquipe, fraseDosCreditosDoContrato, nomeDaCarteiraDoContrato, type CarteiraDoContrato } from "@/lib/equipe/regras";
import { debitoIsento } from "@/lib/credits/isencao";

/**
 * A CONTA QUE PAGA, a partir de quem fez a ação (01/10/2026, acesso de equipe).
 *
 * Até aqui cada login era uma conta: o `userId` da sessão era ao mesmo tempo
 * quem fazia e quem pagava. Com a equipe, o vendedor (membro) faz e o dono
 * paga: créditos, carteira de vídeo, gravações do mês, plano, limites. Este
 * módulo é o único lugar que responde "quem paga por este userId", e quem cobra
 * (lib/credits, lib/limites-do-plano, lib/plano-do-usuario) pergunta aqui em vez
 * de usar o `userId` direto. Assim as rotas continuam passando "quem fez", e o
 * dinheiro sai sempre da conta certa, inclusive em caminhos que ninguém lembrou
 * de mudar.
 *
 * DUAS INVARIANTES que o convite garante (lib/equipe/convites.ts) e que deixam
 * este módulo simples:
 * 1. um membro ATIVO não tem plano nem projetos próprios (o aceite recusa quem
 *    tem), então "o projeto é dele" sempre quer dizer "ele é o dono";
 * 2. uma pessoa é membro ativo de uma equipe só (índice único parcial no banco).
 *
 * A CONTA LIGADA AO CONTRATO (08/10/2026, o contrato guarda-chuva): a conta
 * própria que o admin liga ao contrato de outra (contas_do_contrato) passa a
 * pagar pela TITULAR, exatamente como o membro paga pelo dono. Ela entra aqui
 * por `membroAtivo`, como um membro de origem "contrato" (sem teto próprio, sem
 * acesso aos projetos da titular, com o contrato junto para as frases), e por
 * isso todo débito, estorno, conferência de saldo e cota que já pergunta "quem
 * paga" passa a ir para a carteira do contrato sem caminho novo. A invariante 1
 * não vale para ela: a conta ligada continua dona do próprio projeto (um por
 * pessoa, ver PROJETOS_POR_PESSOA_DO_CONTRATO).
 */

type Leitor = typeof prisma | Prisma.TransactionClient;

export type MembroDaConta = {
  id: string;
  donoId: string;
  status: string;
  tetoGravacoes: number | null;
  tetoCreditos: number | null;
  todosOsProjetos: boolean;
  /**
   * De onde vem a participação (08/10): "equipe" é o convite aceito
   * (membros_da_equipe); "contrato" é a conta própria ligada pelo admin ao
   * contrato da titular (contas_do_contrato). Ausente vale "equipe".
   */
  origem?: "equipe" | "contrato";
  /** Só na origem "contrato": o contrato que paga, para as frases e para a cota. */
  contrato?: ContratoDaLigacao | null;
};

/** O contrato da titular, como a conta ligada o enxerga. */
export type ContratoDaLigacao = CarteiraDoContrato & {
  titularId: string;
  /** O plano do contrato principal da titular (o mais recente não cancelado), para a cota. */
  plano: string | null;
  acessosExtras: number;
};

/** A participação veio da ligação ao contrato (e não de convite de equipe)? */
export const ehLigadaAoContrato = (m: MembroDaConta | null | undefined): boolean => m?.origem === "contrato";

const CAMPOS = {
  id: true,
  donoId: true,
  status: true,
  tetoGravacoes: true,
  tetoCreditos: true,
  todosOsProjetos: true,
} as const;

/**
 * A tabela das contas ligadas existe? Ela nasce numa migração aditiva
 * (20261008200000) e fica fora do schema do Prisma. Perguntar com `to_regclass`
 * nunca dá erro, e isso importa: dentro de uma transação, uma consulta a uma
 * tabela que não existe derruba a transação inteira (o débito junto). Depois
 * de existir uma vez, a resposta fica guardada; enquanto não existe, pergunta
 * de novo a cada minuto (a migração entra pelo deploy, sem reiniciar nada).
 */
let tabelaDasLigacoes: { existe: boolean; em: number } | null = null;

async function tabelaDasLigacoesExiste(db: Leitor): Promise<boolean> {
  if (tabelaDasLigacoes?.existe) return true;
  if (tabelaDasLigacoes && Date.now() - tabelaDasLigacoes.em < 60_000) return false;
  try {
    const r = await db.$queryRaw<Array<{ existe: boolean }>>`SELECT to_regclass('contas_do_contrato') IS NOT NULL AS existe`;
    const existe = r[0]?.existe === true;
    tabelaDasLigacoes = { existe, em: Date.now() };
    return existe;
  } catch {
    return false;
  }
}

/**
 * A LIGAÇÃO DESTA CONTA AO CONTRATO DE OUTRA, com o contrato principal da
 * titular (o mais recente não cancelado), ou null. Uma consulta só.
 */
export async function ligacaoDoContrato(userId: string, db: Leitor = prisma): Promise<ContratoDaLigacao | null> {
  if (!(await tabelaDasLigacoesExiste(db))) return null;
  const r = await db.$queryRaw<
    Array<{ titularId: string; titularNome: string | null; titularEmail: string; numero: number | null; empresa: string | null; plano: string | null; acessosExtras: number | null }>
  >`SELECT l."titularId", t.name AS "titularNome", t.email AS "titularEmail", c.numero, c.empresa, c.plano, c."acessosExtras"
      FROM contas_do_contrato l
      JOIN users t ON t.id = l."titularId"
      LEFT JOIN LATERAL (
        SELECT k.numero, k.empresa, k.plano, k."acessosExtras" FROM contratos k
         WHERE k."userId" = l."titularId"
         ORDER BY (k.status = 'cancelado') ASC, k."createdAt" DESC
         LIMIT 1
      ) c ON true
     WHERE l."userId" = ${userId} AND l."titularId" <> ${userId}
     LIMIT 1`;
  const l = r[0];
  if (!l) return null;
  return {
    titularId: l.titularId,
    titular: l.titularNome?.trim() || l.titularEmail,
    empresa: l.empresa,
    numero: l.numero === null || l.numero === undefined ? null : Number(l.numero),
    plano: l.plano,
    acessosExtras: Number(l.acessosExtras ?? 0),
  };
}

/**
 * A participação ATIVA desta pessoa: a da equipe (convite aceito) ou, sem ela,
 * a ligação ao contrato de outra conta (08/10). Null para quem paga o próprio.
 */
export async function membroAtivo(userId: string, db: Leitor = prisma): Promise<MembroDaConta | null> {
  const m = await db.membroDaEquipe.findFirst({ where: { userId, status: "ativo" }, select: CAMPOS });
  if (m) return { ...m, origem: "equipe" };
  const contrato = await ligacaoDoContrato(userId, db);
  if (!contrato) return null;
  return {
    id: `contrato:${userId}`,
    donoId: contrato.titularId,
    status: "ativo",
    // Sem teto próprio: o time disputa o saldo do contrato, e o teto é o saldo.
    tetoGravacoes: null,
    tetoCreditos: null,
    // Não vê os projetos da titular: cada pessoa usa o próprio projeto.
    todosOsProjetos: false,
    origem: "contrato",
    contrato,
  };
}

/** As contas ligadas a esta titular (para somar a cota do dia e o armazenamento do contrato). */
export async function contasLigadasA(titularId: string, db: Leitor = prisma): Promise<string[]> {
  if (!(await tabelaDasLigacoesExiste(db))) return [];
  const r = await db.$queryRaw<Array<{ userId: string }>>`SELECT "userId" FROM contas_do_contrato WHERE "titularId" = ${titularId}`;
  return r.map((x) => x.userId);
}

/** O nome de quem repõe o saldo, para as frases: o contrato (com a titular) ou o dono da equipe. */
export async function nomeDaCarteira(membro: MembroDaConta, db: Leitor = prisma): Promise<string> {
  if (membro.contrato) return nomeDaCarteiraDoContrato(membro.contrato);
  return (await nomeDoDono(membro.donoId, db)) ?? "quem administra a conta";
}

/** A frase de "sem saldo" para quem usa a carteira de outra conta (equipe ou contrato). */
export async function fraseSemSaldoDaCarteira(
  membro: MembroDaConta,
  conta: { necessario: number; disponivel: number },
  db: Leitor = prisma
): Promise<{ frase: string; dono: string }> {
  if (membro.contrato) {
    const carteira = nomeDaCarteiraDoContrato(membro.contrato);
    return { frase: fraseDosCreditosDoContrato(carteira, conta), dono: carteira };
  }
  const dono = (await nomeDoDono(membro.donoId, db)) ?? "quem administra a conta";
  return { frase: fraseDosCreditosDaEquipe(dono, conta), dono };
}

/**
 * O SALDO DA CARTEIRA QUE PAGA por esta pessoa, e se o débito dela é isento.
 * Para as telas e conferências que mostram o saldo antes de cobrar: a conta
 * ligada ao contrato nunca herda a isenção de admin da titular (08/10), a
 * mesma regra de lib/credits.
 */
export async function carteiraDeQuemFaz(
  userId: string,
  db: Leitor = prisma
): Promise<{ contaId: string; saldo: number | null; role: string | null; interno: boolean; ligada: boolean }> {
  const membro = await membroAtivo(userId, db);
  const contaId = membro?.donoId ?? userId;
  const ligada = ehLigadaAoContrato(membro);
  const u = await db.user.findUnique({ where: { id: contaId }, select: { creditsBalance: true, role: true } });
  return { contaId, saldo: u?.creditsBalance ?? null, role: u?.role ?? null, interno: debitoIsento(u?.role) && !ligada, ligada };
}

/**
 * QUAL CONTA GOVERNA esta pessoa nos limites, e a participação que levou a
 * ela. Use no lugar de `contaDoPlano` onde o PAPEL da conta conta (acesso
 * interno sem cota): a conta ligada ao contrato nunca herda o acesso interno
 * da titular (ver planoQueValeNaConta em lib/equipe/regras.ts).
 */
export async function regraDaConta(userId: string, db: Leitor = prisma): Promise<{ contaId: string; membro: MembroDaConta | null }> {
  const membro = await membroAtivo(userId, db);
  return { contaId: membro?.donoId ?? userId, membro };
}

/**
 * O NOME DO DONO como a equipe o conhece (01/10, acabamento): é ele que vai nas
 * frases do membro ("Peça a Matheus para adicionar mais"). Sem nome, o e-mail.
 */
export async function nomeDoDono(donoId: string, db: Leitor = prisma): Promise<string | null> {
  const u = await db.user.findUnique({ where: { id: donoId }, select: { name: true, email: true } });
  return u ? u.name?.trim() || u.email : null;
}

/**
 * Se esta pessoa usa a carteira de outra conta: de quem é a conta e o nome que
 * as frases usam (o dono da equipe, ou o contrato com a titular, 08/10).
 */
export async function equipeDe(userId: string, db: Leitor = prisma): Promise<{ donoId: string; dono: string; contrato: ContratoDaLigacao | null } | null> {
  const m = await membroAtivo(userId, db);
  if (!m) return null;
  return { donoId: m.donoId, dono: await nomeDaCarteira(m, db), contrato: m.contrato ?? null };
}

/**
 * A frase de saldo para quem é membro, ou null para quem é dono (que segue com
 * a frase de compra de sempre). Para as rotas que recusam por saldo ANTES de
 * chamar o débito, onde o erro de lib/credits não chega.
 */
export async function fraseDeSaldoDoMembro(userId: string, conta?: { necessario: number; disponivel: number }): Promise<string | null> {
  const e = await equipeDe(userId);
  if (!e) return null;
  // A conta ligada ao contrato lê a frase do contrato (08/10): de onde saem os créditos e a quem pedir.
  return e.contrato ? fraseDosCreditosDoContrato(e.dono, conta) : fraseDosCreditosDaEquipe(e.dono, conta);
}

/**
 * De quem é o PLANO que vale para esta pessoa: o do dono, se ela é membro
 * ativo; senão o dela. Para plano, limites, faixa do topo e portão de entrada.
 */
export async function contaDoPlano(userId: string, db: Leitor = prisma): Promise<string> {
  return (await membroAtivo(userId, db))?.donoId ?? userId;
}

export type ContaPagante = {
  /** Quem paga: o `userId` das linhas do extrato e o dono do saldo. */
  contaId: string;
  /** Quem fez, quando não foi o dono. Vai para `credit_transactions.autorId`. */
  autorId: string | null;
  /** A participação que liga as duas, com os tetos do membro. */
  membro: MembroDaConta | null;
};

/**
 * Quem PAGA o que esta pessoa faz. Para débito, estorno e marca de gravação.
 *
 * Membro REMOVIDO continua pagando pelo dono, mas só enquanto a pessoa não tem
 * plano próprio: o que ela começou antes da remoção (uma edição na fila, um
 * gêmeo sendo gerado) termina e é cobrado de quem pediu o trabalho, e não falha
 * no meio por falta de saldo numa conta vazia. Novas ações ela não consegue
 * mais, porque perdeu o acesso aos projetos. Se um dia ela assinar o próprio
 * plano, passa a pagar o próprio gasto.
 */
export async function contaPagante(userId: string, db: Leitor = prisma): Promise<ContaPagante> {
  const ativo = await membroAtivo(userId, db);
  if (ativo) return { contaId: ativo.donoId, autorId: userId, membro: ativo };

  const removido = await db.membroDaEquipe.findFirst({
    where: { userId, status: "removido" },
    orderBy: { removidoEm: "desc" },
    select: CAMPOS,
  });
  if (removido) {
    const eu = await db.user.findUnique({ where: { id: userId }, select: { plan: true, role: true } });
    if (eu && eu.role !== "admin" && (!eu.plan || eu.plan === "free")) {
      return { contaId: removido.donoId, autorId: userId, membro: removido };
    }
  }
  return { contaId: userId, autorId: null, membro: null };
}

/**
 * OS PROJETOS QUE ESTA PESSOA VÊ, como filtro do Prisma (síncrono, sem
 * consulta). Os dela (dono) e os que um dono liberou para ela (membro ativo),
 * um a um ou "todos".
 *
 * Use no lugar de `{ userId }` em toda consulta de projeto, e no lugar de
 * `project: { userId }` em toda consulta de algo que pertence a um projeto.
 */
export function projetoVisivel(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [
      { userId },
      { acessosDeEquipe: { some: { membro: { userId, status: "ativo" } } } },
      { user: { equipe: { some: { userId, status: "ativo", todosOsProjetos: true } } } },
    ],
  };
}

/**
 * Esta pessoa pode ver e usar este projeto? O dono responde sem consulta, que
 * é o caminho de quase toda requisição; o membro custa uma consulta.
 */
export async function podeUsarProjeto(
  userId: string,
  projeto: { id: string; userId: string } | null | undefined
): Promise<boolean> {
  if (!projeto) return false;
  if (projeto.userId === userId) return true;
  const m = await prisma.membroDaEquipe.findFirst({
    where: {
      userId,
      status: "ativo",
      donoId: projeto.userId,
      OR: [{ todosOsProjetos: true }, { projetos: { some: { projectId: projeto.id } } }],
    },
    select: { id: true },
  });
  return Boolean(m);
}

/** Atalho para quando só se tem os dois ids. */
export async function podeUsarProjetoPorId(userId: string, projectId: string): Promise<boolean> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, userId: true } });
  return podeUsarProjeto(userId, p);
}

/**
 * QUANTO ESTE MEMBRO JÁ GASTOU no ciclo da conta, lido do extrato do dono.
 * Créditos: o que saiu menos o que voltou em estorno, só da carteira do plano.
 * Gravações: as marcas de gravação que ele registrou.
 */
export async function consumoDoMembro(
  contaId: string,
  autorId: string,
  desde: Date,
  db: Leitor = prisma
): Promise<{ creditos: number; gravacoes: number }> {
  const [soma, gravacoes] = await Promise.all([
    db.creditTransaction.aggregate({
      where: { userId: contaId, autorId, carteira: "plano", createdAt: { gte: desde } },
      _sum: { amount: true },
    }),
    db.creditTransaction.count({
      where: { userId: contaId, autorId, operation: "gravacao_enviada", createdAt: { gte: desde } },
    }),
  ]);
  return { creditos: Math.max(0, -(soma._sum.amount ?? 0)), gravacoes };
}
