import { prisma } from "@/lib/db/prisma";
import { RecusaDoAdmin, type Admin } from "@/lib/admin/acoes";
import type { VinculoCru } from "@/lib/admin/contas/caso-a-caso";

/**
 * A CONTA LIGADA AO CONTRATO (08/10/2026): a ligação mais simples que resolve
 * o caso da SEED sem mexer em nada que já cobra.
 *
 * O PROBLEMA: o contrato nº 2 é da conta do Matheus; o Ygor e o Vitor usam com
 * contas PRÓPRIAS (plano Pro de cortesia), que não são membros da equipe
 * dele. Para o banco são três clientes soltos, e "quanto o time do Matheus
 * usou" não tinha resposta.
 *
 * O CONTRATO GUARDA-CHUVA (regra do Bruno, 08/10, 18h50): "os créditos vêm
 * todos do mesmo lugar; os vendedores dele disputam os créditos e nunca pode
 * exceder a nossa margem". Ligada, a conta passa a ler plano, saldo, carteira
 * de vídeo e cota da TITULAR (lib/equipe/conta.ts, `membroAtivo` de origem
 * "contrato"): todo débito e estorno vai para a carteira do contrato, sem
 * isenção de admin, com um projeto por pessoa. O saldo próprio da conta (o
 * plano de cortesia, por exemplo) fica parado enquanto ela estiver ligada, sem
 * ninguém precisar zerar nada à mão; desligada, ela volta a usar o dela.
 *
 * POR QUE NÃO VIRAR MEMBRO DA EQUIPE: o convite de equipe recusa quem tem plano
 * ou projeto próprio, e o membro não cria projeto; o time do contrato tem
 * contas próprias, cada uma com o seu projeto. A ligação reaproveita a regra
 * de quem paga da equipe sem mexer no convite.
 *
 * A REGRA: uma linha por conta ligada (a chave é a conta), apontando para a
 * conta TITULAR (a do contrato). Quem liga é o admin, na tela, com o motivo;
 * nada é inferido por e-mail, domínio ou modelo. Fica registrado em
 * admin_acoes, como toda ação do admin.
 *
 * A tabela fica fora do schema do Prisma (migração 20261008200000): SQL cru,
 * e a leitura devolve lista vazia enquanto a migração não rodou.
 */

export async function tabelaDeVinculosExiste(): Promise<boolean> {
  try {
    const r = await prisma.$queryRawUnsafe<Array<{ ok: number }>>(
      `SELECT 1 AS ok FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'contas_do_contrato'`
    );
    return r.length > 0;
  } catch {
    return false;
  }
}

export async function lerVinculos(): Promise<{ vinculos: VinculoCru[]; tabelaExiste: boolean }> {
  if (!(await tabelaDeVinculosExiste())) return { vinculos: [], tabelaExiste: false };
  const linhas = await prisma.$queryRawUnsafe<Array<{ userId: string; titularId: string; definidoPor: string | null; criadoEm: Date; observacao: string | null }>>(
    `SELECT "userId", "titularId", "definidoPor", "criadoEm", "observacao" FROM contas_do_contrato`
  );
  return {
    vinculos: linhas.map((l) => ({ ...l, criadoEm: new Date(l.criadoEm).toISOString() })),
    tabelaExiste: true,
  };
}

/**
 * As travas da ligação, sem banco (a prova usa): não liga a conta nela mesma,
 * não liga a uma conta que já está ligada a outra (sem corrente), não liga a
 * conta que é titular de outras, de um contrato ou membro ativo de equipe.
 */
export function recusaDaLigacao(a: {
  userId: string;
  titularId: string;
  titularEstaLigada: boolean;
  contaTemLigadas: boolean;
  contaTemContrato: boolean;
  contaEhMembroAtivo: boolean;
  /** A conta tem equipe própria com membros ativos (eles pagariam pela carteira dela, não pela do contrato). */
  contaTemEquipe?: boolean;
  /** A titular é membro ativo de uma equipe (ela mesma paga por outra conta). */
  titularEhMembro?: boolean;
}): string | null {
  if (a.userId === a.titularId) return "Uma conta não pode ser ligada a ela mesma.";
  if (a.titularEstaLigada) return "A titular escolhida já está ligada a outro contrato. Ligue direto à conta do contrato.";
  if (a.titularEhMembro) return "A titular escolhida é membro da equipe de outra conta. Ligue à conta que paga.";
  if (a.contaTemLigadas) return "Esta conta é titular de outras contas ligadas. Desfaça essas ligações antes.";
  if (a.contaTemContrato) return "Esta conta tem contrato próprio: ela é um caso, não parte do time de outro.";
  if (a.contaEhMembroAtivo) return "Esta conta já é membro ativo de uma equipe: o uso dela já soma na conta do dono.";
  if (a.contaTemEquipe) return "Esta conta tem equipe própria com membros ativos: eles continuariam pagando pela carteira dela. Remova os membros antes.";
  return null;
}

async function registrar(admin: Admin, alvo: { id: string; email: string }, acao: string, detalhe: unknown) {
  await prisma.acaoDeAdmin.create({
    data: { adminId: admin.id, adminEmail: admin.email, alvoId: alvo.id, alvoEmail: alvo.email, acao, detalhe: detalhe as object },
  });
}

export async function ligarConta(admin: Admin, userId: string, titularId: string, observacao: string | null): Promise<void> {
  if (!(await tabelaDeVinculosExiste())) throw new RecusaDoAdmin("A tabela das contas ligadas ainda não existe: ela nasce no próximo deploy de produção.");
  const [conta, titular] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } }),
    prisma.user.findUnique({ where: { id: titularId }, select: { id: true, email: true } }),
  ]);
  if (!conta) throw new RecusaDoAdmin("Conta não encontrada.");
  if (!titular) throw new RecusaDoAdmin("Conta titular não encontrada.");
  const [titularLigada, ligadasDaConta, contratosDaConta, membro, equipeDaConta, titularMembro] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ ok: number }>>(`SELECT 1 AS ok FROM contas_do_contrato WHERE "userId" = $1`, titularId),
    prisma.$queryRawUnsafe<Array<{ ok: number }>>(`SELECT 1 AS ok FROM contas_do_contrato WHERE "titularId" = $1 LIMIT 1`, userId),
    prisma.contrato.count({ where: { userId } }),
    prisma.membroDaEquipe.count({ where: { userId, status: "ativo" } }),
    prisma.membroDaEquipe.count({ where: { donoId: userId, status: "ativo" } }),
    prisma.membroDaEquipe.count({ where: { userId: titularId, status: "ativo" } }),
  ]);
  const recusa = recusaDaLigacao({
    userId,
    titularId,
    titularEstaLigada: titularLigada.length > 0,
    contaTemLigadas: ligadasDaConta.length > 0,
    contaTemContrato: contratosDaConta > 0,
    contaEhMembroAtivo: membro > 0,
    contaTemEquipe: equipeDaConta > 0,
    titularEhMembro: titularMembro > 0,
  });
  if (recusa) throw new RecusaDoAdmin(recusa);
  const obs = observacao?.replace(/\s+/g, " ").trim().slice(0, 300) || null;
  await prisma.$executeRawUnsafe(
    `INSERT INTO contas_do_contrato ("userId", "titularId", "definidoPor", "observacao", "criadoEm")
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT ("userId") DO UPDATE SET "titularId" = EXCLUDED."titularId", "definidoPor" = EXCLUDED."definidoPor", "observacao" = EXCLUDED."observacao", "criadoEm" = now()`,
    userId,
    titularId,
    admin.email,
    obs
  );
  await registrar(admin, conta, "ligar_conta_ao_contrato", { titularId, titularEmail: titular.email, observacao: obs });
}

export async function desligarConta(admin: Admin, userId: string): Promise<void> {
  if (!(await tabelaDeVinculosExiste())) throw new RecusaDoAdmin("A tabela das contas ligadas ainda não existe.");
  const conta = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!conta) throw new RecusaDoAdmin("Conta não encontrada.");
  const antes = await prisma.$queryRawUnsafe<Array<{ titularId: string }>>(`SELECT "titularId" FROM contas_do_contrato WHERE "userId" = $1`, userId);
  if (!antes.length) throw new RecusaDoAdmin("Esta conta não está ligada a nenhum contrato.");
  await prisma.$executeRawUnsafe(`DELETE FROM contas_do_contrato WHERE "userId" = $1`, userId);
  await registrar(admin, conta, "desligar_conta_do_contrato", { titularId: antes[0].titularId });
}
