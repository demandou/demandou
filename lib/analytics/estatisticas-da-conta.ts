import crypto from "crypto";
import type { Prisma, SocialAccount } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveSocialAccountAccessToken } from "@/lib/publish/oauth-post";
import { chaveDoAvisoDeEstatisticas } from "@/lib/avisos/chaves";
import { leituraLocalDeEstatisticas } from "@/lib/analytics/estatisticas-locais";
import {
  METRICAS_DA_MIDIA,
  METRICAS_DO_FACEBOOK,
  METRICAS_DO_INSTAGRAM,
  REDES_SEM_LEITURA_DA_CONTA,
  TIPO_DA_MEMORIA,
  causaDaReconexao,
  classificarErroDaMeta,
  divisaoPorSeguimento,
  divisaoPorTipo,
  estadoNaTela,
  janelasDaLeitura,
  legendaCurta,
  principaisConteudos,
  prioridadeDaLeitura,
  problemaDaTentativa,
  proximoGuardado,
  quebraDaMetrica,
  segundos,
  seguidoresGanhos,
  somaDosDias,
  tipoDaMidia,
  totalDaMetrica,
  type ConteudoPrincipal,
  type ContaNaTela,
  type ErroDaMeta,
  type EstadoDaTentativa,
  type EstatisticasDoProjeto,
  type GuardadoDaConta,
  type Janela,
  type JanelaLida,
  type JanelasDaLeitura,
  type LeituraDaConta,
  type NumeroComFonte,
  type RedeDaConta,
  type RespostaDeInsights,
} from "@/lib/analytics/tipos-da-conta";

/**
 * AS ESTATÍSTICAS DA CONTA, no servidor (09/10/2026): a leitura na Meta, o
 * registro e o que as telas recebem. O formato e as regras moram em
 * lib/analytics/tipos-da-conta.ts (puro, testado).
 *
 * ONDE FICA: sem migração. Os números vão para `project_memories` (tipo
 * "estatisticas_da_conta", uma linha por projeto e conta, o mesmo desenho do
 * inventário das redes), com a fonte de cada número dentro do registro; e cada
 * tentativa vira uma linha em `coletas_de_metrica` (fonte
 * "api:instagram:conta" ou "api:facebook:conta", custo zero), o mesmo livro
 * das coletas da Apify. As travas da Apify filtram pela fonte delas e o teto
 * do mês soma custo, que aqui é zero: nada se mistura.
 *
 * QUANDO RODA: no cron de publicação (a cada 5 minutos), com teto de tempo
 * por passada, e cada conta é lida no máximo uma vez a cada 20 horas. A conta
 * reconectada depois de uma recusa entra na frente (o token mudou).
 *
 * CUSTO: zero. As APIs da Meta não cobram por chamada.
 */

const IG = "https://graph.instagram.com/v23.0";
const FB = "https://graph.facebook.com/v23.0";
/** Quantas mídias da janela têm o número lido, por leitura. */
const MIDIAS_POR_LEITURA = 25;

/** Um resumo do token (nunca o token): muda quando a conta é reconectada. */
export function marcaDoToken(token: string | null | undefined): string {
  return crypto.createHash("sha256").update(token ?? "").digest("hex").slice(0, 16);
}

const chaveDaConta = (rede: string, platformUserId: string | null) => `${rede}:${platformUserId ?? "sem-id"}`;

class RecusaDaMeta extends Error {
  constructor(public estado: EstadoDaTentativa, mensagem: string) {
    super(mensagem);
  }
}

/** A chamada sem o token, para a fonte de cada número. */
function fonteDa(base: string, caminho: string, params: URLSearchParams): string {
  const host = base.replace(/^https:\/\//, "");
  return `GET ${host}/${caminho}?${params.toString()}`;
}

async function getMeta(base: string, caminho: string, params: URLSearchParams, token: string, prazo: number): Promise<Record<string, unknown>> {
  const resta = Math.max(2_000, Math.min(15_000, prazo - Date.now()));
  const url = `${base}/${caminho}?${params.toString()}&access_token=${encodeURIComponent(token)}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(resta) });
  } catch (e) {
    throw new RecusaDaMeta("erro", `A Meta não respondeu (${e instanceof Error ? e.message : String(e)}).`);
  }
  const corpo = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: ErroDaMeta };
  if (!res.ok || corpo.error) {
    const msg = corpo.error?.message ?? `HTTP ${res.status}`;
    throw new RecusaDaMeta(classificarErroDaMeta(res.status, corpo.error), `${msg}${corpo.error?.code ? ` (código ${corpo.error.code})` : ""}`.slice(0, 300));
  }
  return corpo;
}

const ehRecusaDaConta = (e: unknown) => e instanceof RecusaDaMeta && (e.estado === "sem_permissao" || e.estado === "token_invalido");

/* ── Instagram ────────────────────────────────────────────────────────── */

function paramsDaJanela(j: Janela, extra: Record<string, string>): URLSearchParams {
  return new URLSearchParams({ ...extra, period: "day", metric_type: "total_value", since: String(segundos(j.desde)), until: String(segundos(j.ate)) });
}

/** Os totais de uma janela; se a chamada junta falhar por outro motivo que não a conta, uma por uma. */
async function totaisDoInstagram(token: string, id: string, j: Janela, metricas: string[], prazo: number, faltas: string[]): Promise<Record<string, NumeroComFonte | null>> {
  const saida: Record<string, NumeroComFonte | null> = {};
  const p = paramsDaJanela(j, { metric: metricas.join(",") });
  try {
    const r = (await getMeta(IG, `${id}/insights`, p, token, prazo)) as RespostaDeInsights;
    for (const m of metricas) {
      const v = totalDaMetrica(r, m);
      saida[m] = v === null ? null : { valor: v, fonte: fonteDa(IG, `${id}/insights`, p) };
    }
    return saida;
  } catch (e) {
    if (ehRecusaDaConta(e) || metricas.length === 1) throw e;
  }
  for (const m of metricas) {
    const p1 = paramsDaJanela(j, { metric: m });
    try {
      const r = (await getMeta(IG, `${id}/insights`, p1, token, prazo)) as RespostaDeInsights;
      const v = totalDaMetrica(r, m);
      saida[m] = v === null ? null : { valor: v, fonte: fonteDa(IG, `${id}/insights`, p1) };
    } catch (e) {
      if (ehRecusaDaConta(e)) throw e;
      saida[m] = null;
      faltas.push(`A Meta não devolveu ${m}: ${e instanceof Error ? e.message : e}`);
    }
  }
  return saida;
}

/** Uma quebra; devolve o mapa e a chamada, ou null com a falta anotada. */
async function quebraDoInstagram(token: string, id: string, j: Janela, metrica: string, dimensoes: string[], prazo: number, faltas: string[], rotulo: string) {
  let ultimoErro = "";
  // A referência lista `follower_type` na linha de views e `follow_type` na
  // lista de quebras: tenta a da lista primeiro e a outra só se a primeira
  // for recusada como parâmetro.
  for (const dim of dimensoes) {
    const p = paramsDaJanela(j, { metric: metrica, breakdown: dim });
    try {
      const r = (await getMeta(IG, `${id}/insights`, p, token, prazo)) as RespostaDeInsights;
      const mapa = quebraDaMetrica(r, metrica, dim);
      if (mapa) return { mapa, fonte: fonteDa(IG, `${id}/insights`, p) };
      ultimoErro = "a resposta veio sem a quebra";
    } catch (e) {
      if (ehRecusaDaConta(e)) throw e;
      ultimoErro = e instanceof Error ? e.message : String(e);
    }
  }
  faltas.push(`${rotulo}: a Meta não devolveu (${ultimoErro}).`);
  return null;
}

type MidiaDaMeta = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; thumbnail_url?: string; media_url?: string; timestamp?: string };

function valorDaMidia(r: RespostaDeInsights, nome: string): number | null {
  const item = r.data?.find((d) => d.name === nome);
  const v = item?.values?.[0]?.value ?? item?.total_value?.value;
  return typeof v === "number" ? v : null;
}

async function emLotes<T, R>(itens: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const saida: R[] = [];
  for (let i = 0; i < itens.length; i += n) saida.push(...(await Promise.all(itens.slice(i, i + n).map(fn))));
  return saida;
}

/** Os publicados na janela, com as visualizações e o alcance de cada um (insights da mídia). */
async function principaisDoInstagram(token: string, id: string, j: Janela, prazo: number, faltas: string[]): Promise<ConteudoPrincipal[]> {
  const p = new URLSearchParams({ fields: "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp", limit: "50" });
  let lista: MidiaDaMeta[] = [];
  try {
    lista = (((await getMeta(IG, `${id}/media`, p, token, prazo)) as { data?: MidiaDaMeta[] }).data ?? []);
  } catch (e) {
    if (ehRecusaDaConta(e)) throw e;
    faltas.push(`Principais conteúdos: a lista de publicações não veio (${e instanceof Error ? e.message : e}).`);
    return [];
  }
  const desde = new Date(j.desde).getTime();
  const naJanela = lista.filter((m) => m.timestamp && new Date(m.timestamp).getTime() >= desde).slice(0, MIDIAS_POR_LEITURA);
  let falhas = 0;
  const itens = await emLotes(naJanela, 4, async (m): Promise<ConteudoPrincipal> => {
    const pm = new URLSearchParams({ metric: METRICAS_DA_MIDIA.join(",") });
    let visualizacoes: number | null = null;
    let alcance: number | null = null;
    if (Date.now() < prazo) {
      try {
        const r = (await getMeta(IG, `${m.id}/insights`, pm, token, prazo)) as RespostaDeInsights;
        visualizacoes = valorDaMidia(r, "views");
        alcance = valorDaMidia(r, "reach");
      } catch (e) {
        if (ehRecusaDaConta(e)) throw e;
        falhas++;
      }
    }
    return {
      id: m.id,
      legenda: legendaCurta(m.caption),
      tipo: tipoDaMidia(m.media_product_type, m.media_type),
      link: m.permalink ?? null,
      miniatura: m.thumbnail_url ?? (m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url ?? null : null),
      publicadoEm: m.timestamp ?? null,
      visualizacoes,
      alcance,
      fonte: fonteDa(IG, `${m.id}/insights`, pm),
    };
  });
  if (falhas) faltas.push(`Principais conteúdos: ${falhas} de ${naJanela.length} publicações sem número da Meta.`);
  return principaisConteudos(itens, 5);
}

async function lerInstagram(token: string, id: string, janelas: JanelasDaLeitura, lerAntes: boolean, prazo: number): Promise<{ leitura: LeituraDaConta; antes: JanelaLida | null }> {
  const faltas: string[] = [];
  const M = METRICAS_DO_INSTAGRAM;
  // A primeira chamada decide: recusa por permissão ou token derruba a leitura inteira.
  const totais = await totaisDoInstagram(token, id, janelas.atual, [M.visualizacoes, M.alcance, M.contasComInteracao, M.interacoes], prazo, faltas);

  const seguimento = await quebraDoInstagram(token, id, janelas.atual, M.visualizacoes, ["follow_type", "follower_type"], prazo, faltas, "Seguidores e não seguidores");
  const tipo = await quebraDoInstagram(token, id, janelas.atual, M.visualizacoes, ["media_product_type"], prazo, faltas, "Por formato");
  const ganhos = await quebraDoInstagram(token, id, janelas.atual, M.seguidoresGanhos, ["follow_type"], prazo, faltas, "Seguidores ganhos");

  const anteriores = await totaisDoInstagram(token, id, janelas.anterior, [M.visualizacoes, M.alcance], prazo, faltas).catch((e) => {
    if (ehRecusaDaConta(e)) throw e;
    faltas.push(`Os 30 dias anteriores não vieram (${e instanceof Error ? e.message : e}).`);
    return null;
  });

  let antes: JanelaLida | null = null;
  if (lerAntes && janelas.antes) {
    const a = await totaisDoInstagram(token, id, janelas.antes, [M.visualizacoes, M.alcance], prazo, faltas).catch(() => null);
    if (a && (a[M.visualizacoes] || a[M.alcance])) antes = { janela: janelas.antes, visualizacoes: a[M.visualizacoes] ?? null, alcance: a[M.alcance] ?? null };
  }

  const pPerfil = new URLSearchParams({ fields: "followers_count" });
  const seguidores = await getMeta(IG, id, pPerfil, token, prazo)
    .then((r) => (typeof r.followers_count === "number" ? { valor: r.followers_count, fonte: fonteDa(IG, id, pPerfil) } : null))
    .catch(() => null);

  const principais = await principaisDoInstagram(token, id, janelas.atual, prazo, faltas);

  return {
    leitura: {
      lidoEm: new Date().toISOString(),
      atual: { janela: janelas.atual, visualizacoes: totais[M.visualizacoes] ?? null, alcance: totais[M.alcance] ?? null },
      anterior: anteriores ? { janela: janelas.anterior, visualizacoes: anteriores[M.visualizacoes] ?? null, alcance: anteriores[M.alcance] ?? null } : null,
      contasComInteracao: totais[M.contasComInteracao] ?? null,
      interacoes: totais[M.interacoes] ?? null,
      porSeguimento: seguimento ? divisaoPorSeguimento(seguimento.mapa, seguimento.fonte) : null,
      porTipo: tipo ? divisaoPorTipo(tipo.mapa, tipo.fonte) : null,
      seguidoresGanhos: ganhos ? seguidoresGanhos(ganhos.mapa, ganhos.fonte) : null,
      seguidores,
      principais,
      faltas,
    },
    antes,
  };
}

/* ── Facebook (página) ────────────────────────────────────────────────── */

async function visualizacoesDaPagina(token: string, pageId: string, j: Janela, prazo: number): Promise<NumeroComFonte | null> {
  const p = new URLSearchParams({ metric: METRICAS_DO_FACEBOOK.visualizacoes, period: "day", since: String(segundos(j.desde)), until: String(segundos(j.ate)) });
  const r = (await getMeta(FB, `${pageId}/insights`, p, token, prazo)) as RespostaDeInsights;
  const v = somaDosDias(r, METRICAS_DO_FACEBOOK.visualizacoes);
  return v === null ? null : { valor: v, fonte: `${fonteDa(FB, `${pageId}/insights`, p)} (soma dos dias)` };
}

async function lerFacebook(token: string, pageId: string, janelas: JanelasDaLeitura, lerAntes: boolean, prazo: number): Promise<{ leitura: LeituraDaConta; antes: JanelaLida | null }> {
  const faltas: string[] = ["No Facebook, a Demandou lê por enquanto as visualizações da página e o total de seguidores."];
  const atual = await visualizacoesDaPagina(token, pageId, janelas.atual, prazo);
  const anterior = await visualizacoesDaPagina(token, pageId, janelas.anterior, prazo).catch((e) => {
    if (ehRecusaDaConta(e)) throw e;
    return null;
  });
  let antes: JanelaLida | null = null;
  if (lerAntes && janelas.antes) {
    const v = await visualizacoesDaPagina(token, pageId, janelas.antes, prazo).catch(() => null);
    if (v) antes = { janela: janelas.antes, visualizacoes: v, alcance: null };
  }
  const pPagina = new URLSearchParams({ fields: "followers_count" });
  const seguidores = await getMeta(FB, pageId, pPagina, token, prazo)
    .then((r) => (typeof r.followers_count === "number" ? { valor: r.followers_count, fonte: fonteDa(FB, pageId, pPagina) } : null))
    .catch(() => null);
  return {
    leitura: {
      lidoEm: new Date().toISOString(),
      atual: { janela: janelas.atual, visualizacoes: atual, alcance: null },
      anterior: anterior ? { janela: janelas.anterior, visualizacoes: anterior, alcance: null } : null,
      contasComInteracao: null,
      interacoes: null,
      porSeguimento: null,
      porTipo: null,
      seguidoresGanhos: null,
      seguidores,
      principais: [],
      faltas,
    },
    antes,
  };
}

/* ── Uma conta: ler e devolver o próximo registro (sem gravar) ─────────── */

export type ContaParaLer = Pick<SocialAccount, "id" | "projectId" | "platform" | "platformUserId" | "username" | "displayName" | "createdAt">;

/**
 * Lê uma conta e devolve o próximo registro, SEM gravar nada: quem grava é
 * `gravarLeitura`. A separação existe para a prova local ler a API de verdade
 * sem tocar no banco.
 */
export async function lerUmaConta(conta: ContaParaLer, token: string, anterior: GuardadoDaConta | null, opcoes: { agora?: Date; prazo?: number } = {}): Promise<GuardadoDaConta> {
  const agora = opcoes.agora ?? new Date();
  const prazo = opcoes.prazo ?? Date.now() + 20_000;
  const rede = conta.platform as RedeDaConta;
  const janelas = janelasDaLeitura(agora, conta.createdAt, rede);
  const lerAntes = !(anterior?.antes && anterior.conectadaEm === conta.createdAt.toISOString());
  const base = {
    rede,
    contaId: conta.id,
    perfil: rede === "instagram" ? (conta.username ? `@${conta.username.replace(/^@/, "")}` : null) : conta.displayName ?? conta.username ?? null,
    conectadaEm: conta.createdAt.toISOString(),
  };
  const id = conta.platformUserId ?? "";
  try {
    const r = rede === "instagram" ? await lerInstagram(token, id, janelas, lerAntes, prazo) : await lerFacebook(token, id, janelas, lerAntes, prazo);
    const antesMotivo = janelas.antes ? (r.antes ? null : "A Meta não devolveu os 30 dias antes da conexão.") : janelas.antesMotivo;
    return proximoGuardado({ anterior, base, tentativa: { em: agora.toISOString(), estado: "ok", motivo: r.leitura.faltas.length ? r.leitura.faltas.join(" ").slice(0, 600) : null, marcaDoToken: marcaDoToken(token) }, leitura: r.leitura, antes: r.antes, antesMotivo });
  } catch (e) {
    const estado: EstadoDaTentativa = e instanceof RecusaDaMeta ? e.estado : "erro";
    const motivo = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    return proximoGuardado({ anterior, base, tentativa: { em: agora.toISOString(), estado, motivo, marcaDoToken: marcaDoToken(token) }, leitura: null, antes: null, antesMotivo: janelas.antesMotivo });
  }
}

/** Quantos números a tentativa trouxe (para a linha da coleta). */
function numerosLidos(l: LeituraDaConta | null): number {
  if (!l) return 0;
  return [l.atual.visualizacoes, l.atual.alcance, l.anterior?.visualizacoes, l.contasComInteracao, l.interacoes, l.seguidores].filter(Boolean).length + (l.porSeguimento ? 1 : 0) + (l.porTipo ? 1 : 0) + (l.seguidoresGanhos ? 1 : 0);
}

/** Grava o registro (project_memories) e a tentativa (coletas_de_metrica). */
export async function gravarLeitura(conta: ContaParaLer, guardado: GuardadoDaConta): Promise<void> {
  const onde = { projectId_type_key: { projectId: conta.projectId, type: TIPO_DA_MEMORIA, key: chaveDaConta(conta.platform, conta.platformUserId) } };
  await prisma.projectMemory.upsert({
    where: onde,
    create: { projectId: conta.projectId, type: TIPO_DA_MEMORIA, key: onde.projectId_type_key.key, value: guardado as unknown as Prisma.InputJsonValue },
    update: { value: guardado as unknown as Prisma.InputJsonValue },
  });
  const t = guardado.tentativa;
  const veioAgora = t?.estado === "ok";
  await prisma.coletaDeMetrica.create({
    data: {
      projectId: conta.projectId,
      fonte: `api:${conta.platform}:conta`,
      perfil: guardado.perfil,
      status: t?.estado ?? "erro",
      erro: t?.motivo?.slice(0, 300) ?? null,
      itens: veioAgora ? numerosLidos(guardado.ultima) : 0,
      casados: veioAgora ? guardado.ultima?.principais.length ?? 0 : 0,
      custoUsd: 0,
    },
  });
}

async function lerGuardado(projectId: string, rede: string, platformUserId: string | null): Promise<GuardadoDaConta | null> {
  const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO_DA_MEMORIA, key: chaveDaConta(rede, platformUserId) } }, select: { value: true } });
  return (m?.value as GuardadoDaConta | null) ?? null;
}

/**
 * Registra as permissões que a Meta concedeu na conexão (o callback do
 * Instagram chama). Nunca lança: a conexão vale mais que este registro.
 */
export async function registrarPermissoesDaConexao(conta: ContaParaLer, permissoes: string[] | null): Promise<void> {
  try {
    if (conta.platform !== "instagram" && conta.platform !== "facebook") return;
    const anterior = await lerGuardado(conta.projectId, conta.platform, conta.platformUserId);
    const registro: GuardadoDaConta = anterior
      ? { ...anterior, permissoes: permissoes ? { lista: permissoes, em: new Date().toISOString() } : null }
      : {
          versao: 1,
          rede: conta.platform as RedeDaConta,
          contaId: conta.id,
          perfil: conta.username ? `@${conta.username.replace(/^@/, "")}` : null,
          conectadaEm: conta.createdAt.toISOString(),
          tentativa: null,
          permissoes: permissoes ? { lista: permissoes, em: new Date().toISOString() } : null,
          ultima: null,
          antes: null,
          antesMotivo: null,
          historico: [],
        };
    const key = chaveDaConta(conta.platform, conta.platformUserId);
    await prisma.projectMemory.upsert({
      where: { projectId_type_key: { projectId: conta.projectId, type: TIPO_DA_MEMORIA, key } },
      create: { projectId: conta.projectId, type: TIPO_DA_MEMORIA, key, value: registro as unknown as Prisma.InputJsonValue },
      update: { value: registro as unknown as Prisma.InputJsonValue },
    });
  } catch (e) {
    console.warn("[estatisticas] não registrei as permissões da conexão:", e instanceof Error ? e.message : e);
  }
}

/* ── O cron ───────────────────────────────────────────────────────────── */

/**
 * A PASSADA DO CRON: as contas de Instagram e Facebook ativas, de projeto
 * ativo, que estão vencidas (prioridadeDaLeitura), a que espera há mais tempo
 * primeiro, com teto de tempo e de contas por passada. Nunca lança.
 */
export async function lerEstatisticasVencidas(opcoes: { orcamentoMs?: number; maxContas?: number } = {}): Promise<{ olhadas: number; lidas: number; recusadas: number }> {
  const inicio = Date.now();
  const orcamento = opcoes.orcamentoMs ?? 25_000;
  const agora = new Date();
  const contas = await prisma.socialAccount.findMany({
    where: { platform: { in: ["instagram", "facebook"] }, isActive: true, accessToken: { not: null }, platformUserId: { not: null }, project: { status: "active" } },
  });
  if (!contas.length) return { olhadas: 0, lidas: 0, recusadas: 0 };
  const memorias = await prisma.projectMemory.findMany({
    where: { type: TIPO_DA_MEMORIA, projectId: { in: [...new Set(contas.map((c) => c.projectId))] } },
    select: { projectId: true, key: true, value: true },
  });
  const guardados = new Map(memorias.map((m) => [`${m.projectId}|${m.key}`, m.value as unknown as GuardadoDaConta]));
  const fila = contas
    .map((c) => {
      const g = guardados.get(`${c.projectId}|${chaveDaConta(c.platform, c.platformUserId)}`) ?? null;
      return { c, g, prioridade: prioridadeDaLeitura(g, marcaDoToken(c.accessToken), agora), em: g?.tentativa ? new Date(g.tentativa.em).getTime() : 0 };
    })
    .filter((x) => x.prioridade !== null)
    .sort((a, b) => a.prioridade! - b.prioridade! || a.em - b.em)
    .slice(0, opcoes.maxContas ?? 4);

  let olhadas = 0;
  let lidas = 0;
  let recusadas = 0;
  for (const { c, g } of fila) {
    if (Date.now() - inicio > orcamento) break;
    olhadas++;
    try {
      // Instagram: o token longo renova aqui quando falta pouco para vencer
      // (o mesmo caminho da publicação). Facebook: o token da página não vence.
      const token = c.platform === "instagram" ? (await resolveSocialAccountAccessToken(c)).accessToken : c.accessToken!;
      const prazo = Math.min(inicio + orcamento, Date.now() + 20_000);
      const novo = await lerUmaConta(c, token, g, { agora, prazo });
      await gravarLeitura(c, novo);
      if (novo.tentativa?.estado === "ok") lidas++;
      else recusadas++;
    } catch (e) {
      console.error(`[estatisticas] conta ${c.id} (${c.platform}) falhou:`, e instanceof Error ? e.message : e);
    }
  }
  return { olhadas, lidas, recusadas };
}

/* ── O que as telas recebem ───────────────────────────────────────────── */

/**
 * As estatísticas do projeto para a primeira tela e para Resultados. Só
 * SELECT. Nunca lança: sem banco, devolve as contas sem leitura (e a tela diz
 * que não sabe, sem número).
 */
export async function estatisticasDoProjeto(projectId: string): Promise<EstatisticasDoProjeto> {
  const [contas, memorias] = await Promise.all([
    prisma.socialAccount
      .findMany({
        where: { projectId, isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, platform: true, platformUserId: true, username: true, displayName: true, avatarUrl: true, accountType: true },
      })
      .catch(() => []),
    prisma.projectMemory.findMany({ where: { projectId, type: TIPO_DA_MEMORIA }, select: { key: true, value: true } }).catch(() => []),
  ]);
  const porChave = new Map(memorias.map((m) => [m.key, m.value as unknown as GuardadoDaConta]));
  let simulacao = false;
  const lista: ContaNaTela[] = [];
  for (const c of contas) {
    if (c.platform !== "instagram" && c.platform !== "facebook") continue;
    const chave = chaveDaConta(c.platform, c.platformUserId);
    // A prova local (só fora de produção, ver estatisticas-locais.ts).
    const local = leituraLocalDeEstatisticas(projectId, chave);
    const g = local !== undefined ? local : porChave.get(chave) ?? null;
    if (g?.simulado) simulacao = true;
    const estado = estadoNaTela(g);
    const problema = problemaDaTentativa(g);
    const avisa = estado === "reconectar" || estado === "aguardando_meta" || estado === "erro" ? estado : problema;
    lista.push({
      contaId: c.id,
      rede: c.platform,
      perfil: g?.perfil ?? (c.platform === "instagram" ? (c.username ? `@${c.username.replace(/^@/, "")}` : null) : c.displayName ?? c.username ?? null),
      avatarUrl: c.avatarUrl,
      accountType: c.accountType,
      estado,
      problema,
      causa: causaDaReconexao(g),
      motivo: g?.tentativa?.motivo ?? null,
      chaveDoAviso: avisa ? chaveDoAvisoDeEstatisticas(c.id, avisa, g?.tentativa?.em ?? g?.permissoes?.em ?? "sem-tentativa") : null,
      guardado: g,
    });
  }
  const outrasRedes: EstatisticasDoProjeto["outrasRedes"] = [];
  for (const c of contas) {
    if (!REDES_SEM_LEITURA_DA_CONTA.includes(c.platform)) continue;
    const ja = outrasRedes.find((o) => o.rede === c.platform);
    if (ja) ja.contas++;
    else outrasRedes.push({ rede: c.platform, perfil: c.displayName ?? c.username ?? null, avatarUrl: c.avatarUrl, contas: 1 });
  }
  // O Instagram primeiro (é a conta do print e a que mais mede), depois a página.
  lista.sort((a, b) => Number(a.rede !== "instagram") - Number(b.rede !== "instagram"));
  return { contas: lista, outrasRedes, simulacao };
}
