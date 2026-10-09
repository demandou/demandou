import { prisma } from "@/lib/db/prisma";
import { DOLAR } from "@/lib/admin/uso-de-ia";
import { operacaoEhRecarga } from "@/lib/admin/tipos-do-uso-de-ia";
import { lerReceitaReal, type ReceitaReal } from "@/lib/admin/receita-real";
import { lerVinculos } from "@/lib/admin/contas/vinculos";
import { nomeDoPlano } from "@/lib/contratos/contratos";
import { NOME_DO_STATUS_DO_CONTRATO, grupoDaSituacao, situacaoDoContrato } from "@/lib/contratos/situacao";
import {
  montarCasos,
  type ContaCrua,
  type ContratoCru,
  type EntradaDosCasos,
  type LinhaDeCusto,
  type LinhaDeGravacao,
  type LinhaDePosts,
  type LinhaDoExtrato,
  type MembroCru,
  type ProjetoCru,
  type ResultadoDosCasos,
} from "@/lib/admin/contas/caso-a-caso";

/**
 * A LEITURA DOS CASOS (08/10/2026): o banco e o Stripe, em poucas consultas
 * agregadas, para lib/admin/contas/caso-a-caso.ts montar os casos.
 *
 * SÓ LEITURA, e nunca um SET (a DATABASE_URL é o pooler em modo transação).
 * A receita vem inteira de lib/admin/receita-real.ts, lida UMA vez desde o
 * começo (o Stripe guarda 400 dias, o produto tem menos), e a janela do
 * período é aplicada depois: assim "pagou desde sempre" e "pagou no período"
 * saem da mesma leitura.
 */

const FUSO = "America/Sao_Paulo";
const DIA_MS = 24 * 60 * 60 * 1000;

/** O começo de "desde o início": antes do primeiro cliente. */
export const INICIO_DA_PLATAFORMA = new Date("2026-01-01T03:00:00Z");

export const PERIODOS_DAS_CONTAS = ["30", "90", "365", "tudo"] as const;
export type PeriodoDasContas = (typeof PERIODOS_DAS_CONTAS)[number];

export const NOME_DO_PERIODO_DAS_CONTAS: Record<PeriodoDasContas, string> = {
  "30": "30 dias",
  "90": "90 dias",
  "365": "12 meses",
  tudo: "Desde o início",
};

export function periodoDasContasDaUrl(v: string | string[] | undefined): PeriodoDasContas {
  const s = Array.isArray(v) ? v[0] : v;
  return (PERIODOS_DAS_CONTAS as readonly string[]).includes(s ?? "") ? (s as PeriodoDasContas) : "tudo";
}

/** A janela: meia-noite de São Paulo do primeiro dia até agora. */
export function janelaDasContas(p: PeriodoDasContas, agora = new Date()): { desde: Date; ate: Date; rotulo: string } {
  if (p === "tudo") return { desde: INICIO_DA_PLATAFORMA, ate: agora, rotulo: "desde o início (01/01/2026)" };
  const n = Number(p);
  const dia = new Date(agora.getTime() - (n - 1) * DIA_MS).toLocaleDateString("en-CA", { timeZone: FUSO });
  return { desde: new Date(`${dia}T00:00:00-03:00`), ate: agora, rotulo: `últimos ${NOME_DO_PERIODO_DAS_CONTAS[p]}` };
}

const MES_SQL = `to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE '${FUSO}', 'YYYY-MM')`;

export type BaseDasContas = {
  entrada: EntradaDosCasos;
  receita: ReceitaReal;
  vinculosProntos: boolean;
  rotuloDoPeriodo: string;
  /** Extrato por projeto, para os perfis (créditos consumidos por projeto no período). */
  creditosPorProjeto: Map<string, number>;
  /** Custo de IA por projeto, em dólar, no período. */
  custoPorProjeto: Map<string, number>;
  projetosCompletos: Array<{ id: string; nome: string; donoId: string; criadoEm: string }>;
};

/** Lê tudo o que os casos e os perfis precisam, na janela do período. */
export async function lerBaseDasContas(periodo: PeriodoDasContas, agora = new Date()): Promise<BaseDasContas> {
  const { desde, ate, rotulo } = janelaDasContas(periodo, agora);

  const [receita, usuarios, contratos, membros, { vinculos, tabelaExiste }, projetos, acessos, extrato, custos, gravacoes, posts, extratoPorProjeto] = await Promise.all([
    lerReceitaReal(INICIO_DA_PLATAFORMA, agora, agora),
    prisma.user.findMany({
      where: { roboEm: null },
      select: { id: true, email: true, name: true, plan: true, role: true, contaInterna: true, trialEndsAt: true, createdAt: true },
    }),
    prisma.contrato.findMany({
      orderBy: { numero: "asc" },
      select: {
        id: true,
        numero: true,
        userId: true,
        plano: true,
        valorCentavos: true,
        status: true,
        inicioVigencia: true,
        fimVigencia: true,
        pagoEm: true,
        assinadoEm: true,
        empresa: true,
        signatarioNome: true,
        signatarioEmail: true,
        precoTabelaCentavos: true,
        descontoCentavos: true,
        createdAt: true,
        pagamentos: { where: { aditivoId: null }, select: { valorCentavos: true } },
      },
    }),
    prisma.membroDaEquipe.findMany({ select: { donoId: true, userId: true, status: true, email: true, nome: true } }),
    lerVinculos(),
    prisma.project.findMany({ select: { id: true, name: true, userId: true, createdAt: true } }),
    prisma.$queryRawUnsafe<Array<{ userId: string; ultimo: Date }>>(`SELECT "userId", MAX("updatedAt") AS ultimo FROM sessions GROUP BY 1`),
    // O extrato por quem FEZ (autorId; sem ele, a conta), mês e operação.
    prisma.$queryRawUnsafe<Array<{ pessoaId: string; contaId: string; mes: string; operacao: string; creditos: number; custariam: number; n: number }>>(
      `SELECT COALESCE("autorId", "userId") AS "pessoaId", "userId" AS "contaId", ${MES_SQL} AS mes, operation AS operacao,
              (-SUM(amount))::int AS creditos,
              COALESCE(SUM(CASE WHEN amount = 0
                                THEN NULLIF(replace(substring(note from 'custaria ([0-9.]+) cr'), '.', ''), '')::int
                                ELSE 0 END), 0)::int AS custariam,
              COUNT(*)::int AS n
         FROM credit_transactions
        WHERE "createdAt" >= $1 AND "createdAt" < $2
        GROUP BY 1, 2, 3, 4`,
      desde,
      ate
    ),
    prisma.$queryRawUnsafe<Array<{ projectId: string; mes: string; operacao: string; usd: number; n: number }>>(
      `SELECT "projectId", ${MES_SQL} AS mes, operation AS operacao, SUM("costUsd")::float8 AS usd, COUNT(*)::int AS n
         FROM ai_usage
        WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "projectId" IS NOT NULL
        GROUP BY 1, 2, 3`,
      desde,
      ate
    ),
    prisma.$queryRawUnsafe<Array<{ pessoaId: string; mes: string; n: number; segundos: number }>>(
      `SELECT "userId" AS "pessoaId", ${MES_SQL} AS mes, COUNT(*)::int AS n, COALESCE(SUM("durationSec"), 0)::int AS segundos
         FROM video_jobs
        WHERE "createdAt" >= $1 AND "createdAt" < $2
        GROUP BY 1, 2`,
      desde,
      ate
    ),
    prisma.$queryRawUnsafe<Array<{ projectId: string; mes: string; geradas: number; publicadas: number }>>(
      `SELECT "projectId", ${MES_SQL} AS mes, COUNT(*)::int AS geradas,
              COUNT(*) FILTER (WHERE status = 'published')::int AS publicadas
         FROM posts
        WHERE "createdAt" >= $1 AND "createdAt" < $2
        GROUP BY 1, 2`,
      desde,
      ate
    ),
    // Os créditos por projeto (para os perfis), sem recarga: o filtro de
    // recarga é feito em JavaScript, pela mesma lista do painel.
    prisma.$queryRawUnsafe<Array<{ projectId: string; operacao: string; creditos: number; custariam: number }>>(
      `SELECT "projectId", operation AS operacao, (-SUM(amount))::int AS creditos,
              COALESCE(SUM(CASE WHEN amount = 0
                                THEN NULLIF(replace(substring(note from 'custaria ([0-9.]+) cr'), '.', ''), '')::int
                                ELSE 0 END), 0)::int AS custariam
         FROM credit_transactions
        WHERE "createdAt" >= $1 AND "createdAt" < $2 AND "projectId" IS NOT NULL
        GROUP BY 1, 2`,
      desde,
      ate
    ),
  ]);

  const ultimoAcesso = new Map(acessos.map((a) => [a.userId, new Date(a.ultimo).toISOString()]));
  const contas: ContaCrua[] = usuarios.map((u) => ({
    id: u.id,
    email: u.email,
    nome: u.name,
    plano: u.plan,
    papel: u.role,
    contaInterna: u.contaInterna,
    trialEndsAt: u.trialEndsAt?.toISOString() ?? null,
    cadastroEm: u.createdAt.toISOString(),
    ultimoAcesso: ultimoAcesso.get(u.id) ?? null,
  }));

  const contratosCrus: ContratoCru[] = contratos.map((c) => {
    const situacao = situacaoDoContrato(c, agora);
    return {
      id: c.id,
      numero: c.numero,
      userId: c.userId,
      planoNome: nomeDoPlano(c.plano),
      valorCentavos: c.valorCentavos,
      situacao,
      situacaoNome: NOME_DO_STATUS_DO_CONTRATO[situacao],
      grupo: grupoDaSituacao(situacao),
      empresa: c.empresa,
      signatarioNome: c.signatarioNome,
      signatarioEmail: c.signatarioEmail,
      registradoCentavos: c.pagamentos.reduce((s, p) => s + p.valorCentavos, 0),
      pagoEm: c.pagoEm?.toISOString() ?? null,
      assinadoEm: c.assinadoEm?.toISOString() ?? null,
      inicio: c.inicioVigencia?.toISOString() ?? null,
      fim: c.fimVigencia?.toISOString() ?? null,
      criadoEm: c.createdAt.toISOString(),
      descontoPercentual: c.precoTabelaCentavos ? (c.descontoCentavos / c.precoTabelaCentavos) * 100 : 0,
    };
  });

  const creditosPorProjeto = new Map<string, number>();
  for (const l of extratoPorProjeto) {
    if (operacaoEhRecarga(l.operacao)) continue;
    creditosPorProjeto.set(l.projectId, (creditosPorProjeto.get(l.projectId) ?? 0) + Number(l.creditos) + Number(l.custariam));
  }
  const custoPorProjeto = new Map<string, number>();
  for (const l of custos) custoPorProjeto.set(l.projectId, (custoPorProjeto.get(l.projectId) ?? 0) + Number(l.usd));

  const entrada: EntradaDosCasos = {
    agora,
    desde,
    ate,
    dolar: DOLAR,
    contas,
    contratos: contratosCrus,
    pagamentos: receita.pagamentos.map((p) => ({
      id: p.id,
      contaId: p.contaId,
      quando: p.quando,
      reais: p.reais,
      forma: p.forma,
      origem: p.origem,
      descricao: p.descricao,
    })),
    fora: receita.fora,
    membros: membros as MembroCru[],
    vinculos,
    projetos: projetos.map((p): ProjetoCru => ({ id: p.id, nome: p.name, donoId: p.userId })),
    extrato: extrato.map((l): LinhaDoExtrato => ({ ...l, creditos: Number(l.creditos), custariam: Number(l.custariam), n: Number(l.n) })),
    custos: custos.map((l): LinhaDeCusto => ({ ...l, usd: Number(l.usd), n: Number(l.n) })),
    gravacoes: gravacoes.map((l): LinhaDeGravacao => ({ ...l, n: Number(l.n), segundos: Number(l.segundos) })),
    posts: posts.map((l): LinhaDePosts => ({ ...l, geradas: Number(l.geradas), publicadas: Number(l.publicadas) })),
  };

  return {
    entrada,
    receita,
    vinculosProntos: tabelaExiste,
    rotuloDoPeriodo: rotulo,
    creditosPorProjeto,
    custoPorProjeto,
    projetosCompletos: projetos.map((p) => ({ id: p.id, nome: p.name, donoId: p.userId, criadoEm: p.createdAt.toISOString() })),
  };
}

export async function lerCasos(periodo: PeriodoDasContas, agora = new Date()): Promise<{ base: BaseDasContas; resultado: ResultadoDosCasos }> {
  const base = await lerBaseDasContas(periodo, agora);
  return { base, resultado: montarCasos(base.entrada) };
}
