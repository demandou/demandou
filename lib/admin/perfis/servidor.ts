import { prisma } from "@/lib/db/prisma";
import { jevLigado, perguntarAoJev } from "@/lib/jev/cliente";
import {
  CATEGORIAS_BASE,
  OUTROS,
  situacaoDoPerfil,
  textosDoPerfil,
  type Categoria,
  type PerfilGuardado,
  type SituacaoDoPerfil,
  type TextosDoPerfil,
  type TipoDeNegocio,
  type TipoDePessoa,
} from "@/lib/admin/perfis/categorias";
import { decidirPerfisPeloJev, type Perguntador, type ResultadoDaClassificacao } from "@/lib/admin/perfis/decisao-pelo-jev";

/**
 * OS PERFIS DOS CLIENTES, a leitura e a gravação (08/10/2026).
 *
 * De onde vem o texto de cada projeto: o nome, o nicho, o público e a
 * descrição do projeto (o que o onboarding e a configuração gravam), o "quem
 * é" da análise das redes do próprio cliente (project_memories, perfil_proprio
 * / relatorio) e o formulário da landing que virou a conta (leads). A
 * classificação mora em perfis_dos_projetos, com a data, a fonte ("jev"), os
 * textos lidos e o hash deles; a lista aberta de categorias novas, em
 * categorias_de_perfil. As duas ficam fora do schema do Prisma (SQL cru), e
 * a leitura devolve vazio enquanto a migração não rodou.
 *
 * RECALCULADA QUANDO O NICHO MUDA: o hash dos textos é refeito a cada
 * leitura; diferente do guardado, o perfil está "desatualizado". A rota do
 * projeto chama `reclassificarSeMudou` depois de salvar nicho, público, nome
 * ou descrição, e o estudo do perfil próprio chama ao terminar.
 */

export async function tabelasDosPerfisExistem(): Promise<boolean> {
  try {
    const r = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name IN ('perfis_dos_projetos', 'categorias_de_perfil')`
    );
    return Number(r[0]?.n ?? 0) === 2;
  } catch {
    return false;
  }
}

export type ProjetoComTextos = {
  id: string;
  nome: string;
  donoId: string;
  criadoEm: string;
  textos: TextosDoPerfil;
  guardado: PerfilGuardado | null;
  situacao: SituacaoDoPerfil;
};

type LinhaDoPerfil = {
  projectId: string;
  categoria: string;
  categoriaNome: string;
  categoriaNova: boolean;
  confianca: number | null;
  negocio: string | null;
  negocioConfianca: number | null;
  pessoa: string | null;
  pessoaConfianca: number | null;
  fonte: string;
  textos: unknown;
  hashDosTextos: string;
  classificadoEm: Date;
};

export type CategoriaExtra = Categoria & { origem: string; textoDeOrigem: string | null; projetoDeOrigem: string | null; criadaEm: string };

/** Os projetos com os textos de agora e o perfil guardado. `apenas` limita a alguns ids. */
export async function lerProjetosComTextos(apenas?: string[]): Promise<{ projetos: ProjetoComTextos[]; extras: CategoriaExtra[]; tabelasProntas: boolean }> {
  const tabelasProntas = await tabelasDosPerfisExistem();
  const filtro = apenas?.length ? { id: { in: apenas } } : {};
  const [projetos, quem, leads, guardados, extras] = await Promise.all([
    prisma.project.findMany({
      where: { ...filtro, user: { roboEm: null } },
      select: { id: true, name: true, niche: true, targetAudience: true, description: true, userId: true, createdAt: true },
    }),
    prisma.$queryRawUnsafe<Array<{ projectId: string; quemE: Record<string, unknown> | null }>>(
      `SELECT "projectId", value->'quemE' AS "quemE" FROM project_memories WHERE type = 'perfil_proprio' AND key = 'relatorio'`
    ),
    prisma.lead.findMany({ where: { convertedUserId: { not: null } }, select: { convertedUserId: true, faz: true, setor: true, cargo: true }, orderBy: { createdAt: "desc" } }),
    tabelasProntas
      ? prisma.$queryRawUnsafe<LinhaDoPerfil[]>(`SELECT * FROM perfis_dos_projetos`)
      : Promise.resolve([] as LinhaDoPerfil[]),
    tabelasProntas
      ? prisma.$queryRawUnsafe<Array<{ id: string; nome: string; descricao: string | null; origem: string; textoDeOrigem: string | null; projetoDeOrigem: string | null; criadaEm: Date }>>(
          `SELECT * FROM categorias_de_perfil ORDER BY "criadaEm"`
        )
      : Promise.resolve([]),
  ]);
  const quemPorProjeto = new Map(quem.map((q) => [q.projectId, q.quemE]));
  const cadastroPorConta = new Map<string, { faz: string | null; setor: string | null; cargo: string | null }>();
  for (const l of leads) if (l.convertedUserId && !cadastroPorConta.has(l.convertedUserId)) cadastroPorConta.set(l.convertedUserId, l);
  const guardadoPorProjeto = new Map(
    guardados.map((g): [string, PerfilGuardado] => [
      g.projectId,
      {
        projectId: g.projectId,
        categoria: g.categoria,
        categoriaNome: g.categoriaNome,
        categoriaNova: Boolean(g.categoriaNova),
        confianca: g.confianca === null ? null : Number(g.confianca),
        negocio: (g.negocio as TipoDeNegocio | null) ?? null,
        negocioConfianca: g.negocioConfianca === null ? null : Number(g.negocioConfianca),
        pessoa: (g.pessoa as TipoDePessoa | null) ?? null,
        pessoaConfianca: g.pessoaConfianca === null ? null : Number(g.pessoaConfianca),
        fonte: g.fonte,
        textos: (g.textos ?? {}) as TextosDoPerfil,
        hashDosTextos: g.hashDosTextos,
        classificadoEm: new Date(g.classificadoEm).toISOString(),
      },
    ])
  );

  return {
    tabelasProntas,
    extras: extras.map((x) => ({
      id: x.id,
      nome: x.nome,
      descricao: x.descricao ?? "",
      origem: x.origem,
      textoDeOrigem: x.textoDeOrigem,
      projetoDeOrigem: x.projetoDeOrigem,
      criadaEm: new Date(x.criadaEm).toISOString(),
    })),
    projetos: projetos.map((p) => {
      const textos = textosDoPerfil({
        nome: p.name,
        nicho: p.niche,
        publico: p.targetAudience,
        descricao: p.description,
        quemE: (quemPorProjeto.get(p.id) as { pessoa?: unknown; produto?: unknown; publico?: unknown; objetivo?: unknown } | null) ?? null,
        cadastro: cadastroPorConta.get(p.userId) ?? null,
      });
      const guardado = guardadoPorProjeto.get(p.id) ?? null;
      return { id: p.id, nome: p.name, donoId: p.userId, criadoEm: p.createdAt.toISOString(), textos, guardado, situacao: situacaoDoPerfil(textos, guardado) };
    }),
  };
}

async function gravar(r: ResultadoDaClassificacao): Promise<void> {
  for (const c of r.novas) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO categorias_de_perfil (id, nome, descricao, origem, "textoDeOrigem", "projetoDeOrigem", "criadaEm")
       VALUES ($1, $2, $3, 'jev', $4, $5, now()) ON CONFLICT (id) DO NOTHING`,
      c.id,
      c.nome,
      c.descricao,
      c.textoDeOrigem,
      c.projetoDeOrigem
    );
  }
  for (const d of r.decisoes) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO perfis_dos_projetos ("projectId", categoria, "categoriaNome", "categoriaNova", confianca, negocio, "negocioConfianca",
                                        pessoa, "pessoaConfianca", fonte, textos, "hashDosTextos", "classificadoEm")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, now())
       ON CONFLICT ("projectId") DO UPDATE SET
         categoria = EXCLUDED.categoria, "categoriaNome" = EXCLUDED."categoriaNome", "categoriaNova" = EXCLUDED."categoriaNova",
         confianca = EXCLUDED.confianca, negocio = EXCLUDED.negocio, "negocioConfianca" = EXCLUDED."negocioConfianca",
         pessoa = EXCLUDED.pessoa, "pessoaConfianca" = EXCLUDED."pessoaConfianca", fonte = EXCLUDED.fonte,
         textos = EXCLUDED.textos, "hashDosTextos" = EXCLUDED."hashDosTextos", "classificadoEm" = now()`,
      d.projectId,
      d.categoria,
      d.categoriaNome,
      d.categoriaNova,
      d.confianca,
      d.negocio,
      d.negocioConfianca,
      d.pessoa,
      d.pessoaConfianca,
      d.fonte,
      JSON.stringify(d.textos),
      d.hashDosTextos
    );
  }
}

/** A pergunta de verdade: o JEV, com o custo no ai_usage (operation "jev-perfis-categoria"). */
const perguntarDeVerdade: Perguntador = (ctx, perguntas) => perguntarAoJev({ etapa: ctx.etapa, state: ctx.state, projectId: ctx.projectId ?? null }, perguntas);

export type ResumoDaRodada = {
  ligado: boolean;
  tabelasProntas: boolean;
  pendentes: number;
  classificados: number;
  emOutros: number;
  novas: string[];
  semDecisao: number;
  perguntas: number;
};

/**
 * CLASSIFICA OS PENDENTES (sem classificação ou desatualizados), até `limite`
 * projetos por rodada. Sem JEV, sem tabelas ou sem pendentes, não chama nada.
 */
export async function classificarPendentes(opcoes: { limite?: number; apenas?: string[]; perguntar?: Perguntador } = {}): Promise<ResumoDaRodada> {
  const limite = Math.max(1, Math.min(opcoes.limite ?? 60, 200));
  const ligado = jevLigado() || Boolean(opcoes.perguntar);
  const { projetos, extras, tabelasProntas } = await lerProjetosComTextos(opcoes.apenas);
  const pendentes = projetos.filter((p) => p.situacao === "sem_classificacao" || p.situacao === "desatualizado");
  const vazio: ResumoDaRodada = { ligado, tabelasProntas, pendentes: pendentes.length, classificados: 0, emOutros: 0, novas: [], semDecisao: 0, perguntas: 0 };
  if (!ligado || !tabelasProntas || !pendentes.length) return vazio;
  const r = await decidirPerfisPeloJev(
    pendentes.slice(0, limite).map((p) => ({ id: p.id, textos: p.textos })),
    extras,
    opcoes.perguntar ?? perguntarDeVerdade
  );
  await gravar(r);
  return {
    ...vazio,
    classificados: r.decisoes.length,
    emOutros: r.decisoes.filter((d) => d.categoria === OUTROS.id).length,
    novas: r.novas.map((n) => n.nome),
    semDecisao: r.semDecisao.length,
    perguntas: r.perguntas,
  };
}

/**
 * Depois de mudar o nicho (ou outro texto) de um projeto: reclassifica só se
 * os textos mudaram de verdade. Nunca lança: é chamada depois da resposta.
 */
export async function reclassificarSeMudou(projectId: string): Promise<void> {
  try {
    if (!jevLigado() || process.env.PERFIS_PELO_JEV === "0") return;
    await classificarPendentes({ apenas: [projectId], limite: 1 });
  } catch (e) {
    console.error(`[perfis] não reclassifiquei o projeto ${projectId}: ${e instanceof Error ? e.message : e}`);
  }
}

/** Todas as categorias que valem hoje: as da casa, as novas e "outros". */
export function todasAsCategorias(extras: Categoria[]): Categoria[] {
  return [...CATEGORIAS_BASE, ...extras.filter((x) => !CATEGORIAS_BASE.some((b) => b.id === x.id)), OUTROS];
}
