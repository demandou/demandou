import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { jevLigado, perguntarAoJev, usoVazio, type ContextoDoJev, type PerguntaDoJev, type RespostaDoJev } from "@/lib/jev/cliente";
import { TIPO_DA_MEMORIA as TIPO_DAS_ESTATISTICAS, type GuardadoDaConta } from "@/lib/analytics/tipos-da-conta";
import { leituraLocalDeImpulsos } from "@/lib/analytics/impulsos-locais";
import {
  CHAVE_DAS_SUGESTOES,
  ETAPA_DO_JEV,
  IDADE_MAXIMA_H,
  IDADE_MINIMA_H,
  JANELA_DA_BASE_DIAS,
  ROTULO_DO_FORMATO,
  SISTEMA_DA_FRASE,
  TIPO_DA_BASE,
  TIPO_DAS_SUGESTOES,
  analisarPosts,
  chaveDaConta,
  conferirFrase,
  estadoDoJev,
  impulsosNaTela,
  leituraDoPostMetric,
  lerDecisao,
  lerFrases,
  marcaDaEntrada,
  montarSugestao,
  numerosQueSustentam,
  pedidoDaFrase,
  perguntasDoJev,
  permitidosDo,
  postParaImpulso,
  seguidoresDaConta,
  type AnaliseDoProjeto,
  type BaseDaConta,
  type GuardadoDoImpulso,
  type ImpulsosNaTela,
  type LeituraParaImpulso,
  type PedidoDeFrase,
  type PerfilProprio,
  type SeguidoresDaMeta,
  type Seguidores,
  type SugestaoDeImpulso,
} from "@/lib/analytics/tipos-do-impulso";

/**
 * O AGENTE DE TRÁFEGO NO SERVIDOR (09/10/2026, fase 1, só sugestão). As regras
 * e o formato moram em lib/analytics/tipos-do-impulso.ts (puro, testado).
 *
 * ONDE FICA: sem migração. A linha de base de cada conta em `project_memories`
 * (tipo "linha_de_base_do_impulso", uma linha por projeto e conta) e as
 * sugestões do projeto em `project_memories` (tipo "sugestoes_de_impulso",
 * chave "projeto"), com a fonte e a data da leitura de cada número.
 *
 * QUANDO RODA: no cron de publicação que já mede (a cada 5 minutos), depois da
 * medição. Um projeto é recalculado quando chegou leitura nova depois do
 * último cálculo, ou a cada 20 h (o post envelhece e sai da janela). Até 4
 * projetos e 20 s por passada.
 *
 * QUANDO GASTA: o JEV só é perguntado quando os candidatos mudaram (outro
 * post, outro marco, outra pontuação); a mesma entrada reaproveita a decisão.
 * O Haiku só escreve a frase do post escolhido que ainda não tem frase
 * conferida. Custo estimado: abaixo de US$ 0,01 por passada com candidatos.
 * Desliga com SUGESTOES_DE_IMPULSO=0 (sem JEV também não há sugestão).
 */

export const MODELO_DA_FRASE = "claude-haiku-4-5";
const HORA = 3600_000;
const INTERVALO_DO_RECALCULO_MS = 20 * HORA;

export function sugestoesLigadas(env: Record<string, string | undefined> = process.env): boolean {
  return env.SUGESTOES_DE_IMPULSO !== "0";
}

export type Perguntar = (ctx: ContextoDoJev, perguntas: Record<string, PerguntaDoJev>) => Promise<Record<string, RespostaDoJev>>;
export type Redigir = (sistema: string, pedido: string, ctx: { projectId: string; onCusto: (custoUsd: number) => void }) => Promise<string>;

/** A frase pelo Haiku, com o uso gravado em ai_usage (operation "impulso_frase"). */
const redigirPeloHaiku: Redigir = (sistema, pedido, ctx) =>
  askClaude(sistema, pedido, { model: MODELO_DA_FRASE, maxTokens: 4000, timeoutMs: 60_000, usage: { projectId: ctx.projectId, operation: "impulso_frase" }, onCusto: ctx.onCusto });

/* ── Carregar e analisar (só SELECT) ──────────────────────────────────── */

/** Os posts dos últimos 90 dias com as leituras, e os seguidores de cada conta. Só SELECT. */
export async function carregarProjeto(projectId: string, agora: Date) {
  const desde = new Date(agora.getTime() - JANELA_DA_BASE_DIAS * 24 * HORA);
  const linhas = await prisma.post.findMany({
    where: { projectId, publishedAt: { gte: desde, lte: agora } },
    select: {
      id: true,
      platform: true,
      mediaType: true,
      metadata: true,
      publishedAt: true,
      externalUrl: true,
      content: true,
      socialAccountId: true,
      socialAccount: { select: { accountType: true, username: true, displayName: true, platformUserId: true } },
      run: { select: { config: true } },
      metrics: true,
    },
  });
  const ids = linhas.map((l) => l.id);
  const [oks, comHistorico, proprios, estatisticas] = await Promise.all([
    prisma.leituraDeMetrica.findMany({
      where: { postId: { in: ids }, status: "ok", lidoEm: { lte: agora } },
      select: { postId: true, fonte: true, status: true, lidoEm: true, impressoes: true, alcance: true, visualizacoes: true, curtidas: true, comentarios: true, compartilhamentos: true, salvamentos: true, cliques: true },
    }),
    prisma.leituraDeMetrica.findMany({ where: { postId: { in: ids } }, distinct: ["postId"], select: { postId: true } }),
    prisma.referenciaPerfil.findMany({ where: { projectId, status: "proprio" }, select: { rede: true, perfil: true, seguidores: true, ultimaColeta: true, updatedAt: true } }),
    prisma.projectMemory.findMany({ where: { projectId, type: TIPO_DAS_ESTATISTICAS }, select: { key: true, value: true } }),
  ]);
  const leituras: LeituraParaImpulso[] = [...oks];
  const temHistorico = new Set(comHistorico.map((x) => x.postId));
  // O número gravado antes do histórico vale só para post sem nenhuma leitura (como a aba Resultados).
  for (const l of linhas) if (!temHistorico.has(l.id) && l.metrics) leituras.push(leituraDoPostMetric(l.id, l.metrics));

  const perfis: PerfilProprio[] = proprios.map((p) => ({ rede: p.rede, perfil: p.perfil, seguidores: p.seguidores, em: p.ultimaColeta ?? p.updatedAt }));
  const meta: SeguidoresDaMeta[] = [];
  for (const m of estatisticas) {
    const g = m.value as unknown as GuardadoDaConta | null;
    // A leitura de exemplo da prova local nunca entra como número.
    if (!g || g.simulado || !g.ultima?.seguidores) continue;
    meta.push({ chave: m.key, valor: g.ultima.seguidores.valor, lidoEm: g.ultima.lidoEm, rede: g.rede });
  }

  const posts = linhas.map((l) =>
    postParaImpulso(
      {
        id: l.id,
        platform: l.platform,
        mediaType: l.mediaType,
        metadata: l.metadata,
        publishedAt: l.publishedAt!,
        externalUrl: l.externalUrl,
        content: l.content,
        socialAccountId: l.socialAccountId,
        accountType: l.socialAccount?.accountType ?? null,
        username: l.socialAccount?.username ?? null,
        displayName: l.socialAccount?.displayName ?? null,
        funil: ((l.run?.config as { funnelStage?: unknown } | null)?.funnelStage as string | undefined) ?? null,
      },
      leituras
    )
  );
  const seguidores: Record<string, Seguidores | null> = {};
  for (const l of linhas) {
    const k = chaveDaConta(l.platform, l.socialAccountId);
    if (k in seguidores || !l.socialAccount) continue;
    seguidores[k] = seguidoresDaConta({ platform: l.platform, platformUserId: l.socialAccount.platformUserId, username: l.socialAccount.username, displayName: l.socialAccount.displayName }, meta, perfis);
  }
  return { posts, seguidores };
}

export async function analisarProjeto(projectId: string, agora = new Date()): Promise<AnaliseDoProjeto> {
  const { posts, seguidores } = await carregarProjeto(projectId, agora);
  return analisarPosts(posts, seguidores, agora);
}

/* ── Gravar ───────────────────────────────────────────────────────────── */

async function gravarBases(projectId: string, bases: BaseDaConta[]): Promise<void> {
  for (const b of bases) {
    const onde = { projectId_type_key: { projectId, type: TIPO_DA_BASE, key: b.conta } };
    await prisma.projectMemory.upsert({
      where: onde,
      create: { projectId, type: TIPO_DA_BASE, key: b.conta, value: b as unknown as Prisma.InputJsonValue },
      update: { value: b as unknown as Prisma.InputJsonValue },
    });
  }
}

async function gravarGuardado(projectId: string, g: GuardadoDoImpulso): Promise<void> {
  const onde = { projectId_type_key: { projectId, type: TIPO_DAS_SUGESTOES, key: CHAVE_DAS_SUGESTOES } };
  await prisma.projectMemory.upsert({
    where: onde,
    create: { projectId, type: TIPO_DAS_SUGESTOES, key: CHAVE_DAS_SUGESTOES, value: g as unknown as Prisma.InputJsonValue },
    update: { value: g as unknown as Prisma.InputJsonValue },
  });
}

export async function lerGuardadoDoImpulso(projectId: string): Promise<GuardadoDoImpulso | null> {
  const m = await prisma.projectMemory.findUnique({
    where: { projectId_type_key: { projectId, type: TIPO_DAS_SUGESTOES, key: CHAVE_DAS_SUGESTOES } },
    select: { value: true },
  });
  return (m?.value as unknown as GuardadoDoImpulso | null) ?? null;
}

/* ── Uma passada num projeto ──────────────────────────────────────────── */

/**
 * Recalcula a base, pergunta ao JEV (quando os candidatos mudaram) e pede a
 * frase ao Haiku para o que o JEV escolheu. `perguntar`, `redigir` e
 * `gravar: false` existem para a prova rodar sem gasto e sem banco de escrita.
 */
export async function atualizarImpulsos(
  projectId: string,
  opcoes: { agora?: Date; anterior?: GuardadoDoImpulso | null; perguntar?: Perguntar; redigir?: Redigir; gravar?: boolean; analise?: AnaliseDoProjeto } = {}
): Promise<GuardadoDoImpulso> {
  const agora = opcoes.agora ?? new Date();
  const gravar = opcoes.gravar ?? true;
  const anterior = opcoes.anterior !== undefined ? opcoes.anterior : await lerGuardadoDoImpulso(projectId).catch(() => null);
  const analise = opcoes.analise ?? (await analisarProjeto(projectId, agora));
  if (gravar) await gravarBases(projectId, analise.bases);

  const comum = {
    versao: 1 as const,
    calculadoEm: agora.toISOString(),
    marcaDaEntrada: marcaDaEntrada(analise.candidatos),
    candidatos: analise.candidatos.length,
    aprendendo: analise.aprendendo,
  };
  const fechar = async (g: GuardadoDoImpulso) => {
    if (gravar) await gravarGuardado(projectId, g);
    return g;
  };

  if (!analise.candidatos.length) {
    // Sem candidato não há decisão a tomar: o JEV não é perguntado.
    const estado = analise.medidos.length || !analise.aprendendo.length ? "sem_candidato" : "aprendendo";
    return fechar({ ...comum, estado, sugestoes: [], custoUsd: { jev: 0, texto: 0 }, motivo: null });
  }
  if (anterior && anterior.estado === "decidido" && !anterior.simulado && anterior.marcaDaEntrada === comum.marcaDaEntrada) {
    // Os mesmos candidatos com os mesmos números: a decisão de antes vale.
    return fechar({ ...comum, estado: "decidido", sugestoes: anterior.sugestoes, custoUsd: { jev: 0, texto: 0 }, motivo: "mesmos candidatos da passada anterior" });
  }
  if (!opcoes.perguntar && (!jevLigado() || !sugestoesLigadas())) {
    // Sem o JEV não há quem decida: nenhuma sugestão (nunca decisão por modelo de texto nem por regra fixa).
    return fechar({ ...comum, estado: "desligado", sugestoes: [], custoUsd: { jev: 0, texto: 0 }, motivo: jevLigado() ? "SUGESTOES_DE_IMPULSO=0" : "JEV desligado" });
  }

  const perguntar = opcoes.perguntar ?? perguntarAoJev;
  const uso = usoVazio();
  let respostas: Record<string, RespostaDoJev>;
  try {
    respostas = await perguntar({ projectId, etapa: ETAPA_DO_JEV, state: estadoDoJev(analise), uso }, perguntasDoJev(analise.candidatos));
  } catch (e) {
    const motivo = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    console.error(`[impulso][${projectId}] o JEV falhou, nenhuma sugestão nesta passada:`, motivo);
    return fechar({ ...comum, estado: "jev_falhou", sugestoes: [], custoUsd: { jev: uso.custoUsd, texto: 0 }, motivo });
  }

  const decisoes = lerDecisao(respostas, analise.candidatos);
  const porId = new Map(analise.candidatos.map((c) => [c.postId, c]));
  const velhas = new Map((anterior?.simulado ? [] : anterior?.sugestoes ?? []).map((s) => [`${s.postId}:${s.marco}:${s.motivo}`, s]));

  // A frase de antes vale se o post, o marco e o motivo são os mesmos e os números dela ainda conferem.
  const pedidos: PedidoDeFrase[] = [];
  const reaproveitar = new Map<string, string>();
  for (const d of decisoes) {
    const c = porId.get(d.postId)!;
    const pedido: PedidoDeFrase = { id: c.postId, rede: c.rede, formato: ROTULO_DO_FORMATO[c.formato], motivo: d.motivo, numeros: numerosQueSustentam(c, d.motivo) };
    const velha = velhas.get(`${c.postId}:${c.foto.marco}:${d.motivo}`);
    if (velha && velha.fraseDe === "haiku" && conferirFrase(velha.frase, permitidosDo(pedido)).ok) reaproveitar.set(c.postId, velha.frase);
    else pedidos.push(pedido);
  }

  let frases: Record<string, string> = {};
  let custoTexto = 0;
  if (pedidos.length) {
    try {
      const bruto = await (opcoes.redigir ?? redigirPeloHaiku)(SISTEMA_DA_FRASE, pedidoDaFrase(pedidos), { projectId, onCusto: (x) => (custoTexto += x) });
      const r = lerFrases(bruto, pedidos);
      frases = r.frases;
      const recusadas = Object.entries(r.recusadas);
      // Recusada vira a frase montada em código; o log diz por quê (é a conferência funcionando).
      if (recusadas.length) console.warn(`[impulso][${projectId}] frases do Haiku recusadas: ${recusadas.map(([id, m]) => `${id} (${m})`).join("; ")}`);
    } catch (e) {
      console.warn(`[impulso][${projectId}] o Haiku não escreveu; vale a frase em código:`, e instanceof Error ? e.message : e);
    }
  }

  const sugestoes: SugestaoDeImpulso[] = decisoes.map((d) => {
    const c = porId.get(d.postId)!;
    const texto = frases[d.postId] ?? reaproveitar.get(d.postId) ?? null;
    return montarSugestao(c, d, texto ? { texto, de: "haiku" } : null);
  });
  return fechar({ ...comum, estado: "decidido", sugestoes, custoUsd: { jev: uso.custoUsd, texto: custoTexto }, motivo: null });
}

/* ── O cron ───────────────────────────────────────────────────────────── */

/**
 * A PASSADA DO CRON: projetos ativos com post publicado entre 24 h e 7 dias
 * atrás, que receberam leitura nova depois do último cálculo (ou que não são
 * recalculados há 20 h). O que espera há mais tempo primeiro. Nunca lança.
 */
export async function sugerirImpulsos(opcoes: { orcamentoMs?: number; maxProjetos?: number } = {}): Promise<{ olhados: number; decididos: number; sugestoes: number; custoUsd: number }> {
  const inicio = Date.now();
  const orcamento = opcoes.orcamentoMs ?? 20_000;
  const agora = new Date();
  const recentes = await prisma.post.findMany({
    where: { publishedAt: { gte: new Date(agora.getTime() - IDADE_MAXIMA_H * HORA), lte: new Date(agora.getTime() - IDADE_MINIMA_H * HORA) }, project: { status: "active" } },
    distinct: ["projectId"],
    select: { projectId: true },
  });
  if (!recentes.length) return { olhados: 0, decididos: 0, sugestoes: 0, custoUsd: 0 };
  const ids = recentes.map((r) => r.projectId);
  const [ultimas, guardados] = await Promise.all([
    prisma.leituraDeMetrica.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _max: { criadoEm: true } }),
    prisma.projectMemory.findMany({ where: { projectId: { in: ids }, type: TIPO_DAS_SUGESTOES, key: CHAVE_DAS_SUGESTOES }, select: { projectId: true, value: true } }),
  ]);
  const ultimaDe = new Map(ultimas.map((u) => [u.projectId, u._max.criadoEm?.getTime() ?? 0]));
  const guardadoDe = new Map(guardados.map((g) => [g.projectId, g.value as unknown as GuardadoDoImpulso]));
  const fila = ids
    .map((id) => {
      const g = guardadoDe.get(id) ?? null;
      const calculado = g?.calculadoEm ? new Date(g.calculadoEm).getTime() : 0;
      const vencido = !g || (ultimaDe.get(id) ?? 0) > calculado || agora.getTime() - calculado >= INTERVALO_DO_RECALCULO_MS;
      return { id, g, calculado, vencido };
    })
    .filter((x) => x.vencido)
    .sort((a, b) => a.calculado - b.calculado)
    .slice(0, opcoes.maxProjetos ?? 4);

  let olhados = 0;
  let decididos = 0;
  let sugestoes = 0;
  let custoUsd = 0;
  for (const x of fila) {
    if (Date.now() - inicio > orcamento) break;
    olhados++;
    try {
      const g = await atualizarImpulsos(x.id, { agora, anterior: x.g });
      if (g.estado === "decidido") decididos++;
      sugestoes += g.sugestoes.length;
      custoUsd += g.custoUsd.jev + g.custoUsd.texto;
    } catch (e) {
      // Um projeto que falha não segura os outros; volta na próxima passada.
      console.error(`[impulso] projeto ${x.id} falhou:`, e instanceof Error ? e.message : e);
    }
  }
  return { olhados, decididos, sugestoes, custoUsd: Math.round(custoUsd * 1e6) / 1e6 };
}

/* ── O que as telas recebem ───────────────────────────────────────────── */

/**
 * As sugestões do projeto para a primeira tela e para Resultados. Só SELECT.
 * Some a sugestão do post que passou de 7 dias, que saiu do banco ou que foi
 * apagado da rede. Nunca lança: sem banco, devolve "sem leitura" e a tela não
 * mostra nada.
 */
export async function impulsosDoProjeto(projectId: string, agora = new Date()): Promise<ImpulsosNaTela> {
  const local = leituraLocalDeImpulsos(projectId);
  const g = local !== undefined ? local : await lerGuardadoDoImpulso(projectId).catch(() => null);
  const tela = impulsosNaTela(g, agora);
  if (!tela.sugestoes.length || tela.simulado) return tela;
  const vivos = await prisma.post
    .findMany({ where: { id: { in: tela.sugestoes.map((s) => s.postId) }, publishedAt: { not: null } }, select: { id: true, metadata: true } })
    .catch(() => null);
  if (!vivos) return { ...tela, sugestoes: [] };
  const noAr = new Set(vivos.filter((p) => !(p.metadata as { apagadoDaRedeEm?: unknown } | null)?.apagadoDaRedeEm).map((p) => p.id));
  return { ...tela, sugestoes: tela.sugestoes.filter((s) => noAr.has(s.postId)) };
}
