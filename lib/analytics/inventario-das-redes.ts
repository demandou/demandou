import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { postsDoYoutube } from "@/lib/referencias/youtube";
import { coletarReferencia } from "@/lib/referencias/coletar";
import { apifyConfigurada } from "@/lib/referencias/apify";
import { Caixa } from "@/lib/referencias/config";
import { lerRedesEscritas } from "@/lib/projeto/links-do-cliente";
import type { PostDeReferencia } from "@/lib/referencias/tipos";
import { juntarInventario, primeiraLinha, tituloNoYoutube, type ItemDoInventario } from "@/lib/analytics/tipos-do-inventario";

/**
 * O INVENTÁRIO DAS REDES DO CLIENTE (08/10/2026), o que está de fato no ar.
 *
 * Regra do Bruno depois do "vídeo que não existe": os agentes só citam
 * conteúdo próprio que está comprovado publicado, e a lista do que está
 * publicado vem daqui. Três fontes, juntas e sem repetir endereço:
 *
 *   1. POSTS NOSSOS publicados, com endereço externo (o que a Demandou
 *      publicou);
 *   2. A VARREDURA das redes do cliente, guardada em ProjectMemory (tipo
 *      "inventario_das_redes", uma chave por rede), sem migração:
 *        . YouTube pela Data API oficial (lib/referencias/youtube.ts), de
 *          graça (3 unidades da cota por leitura), no cron de publicação, no
 *          máximo uma vez a cada 20 h por projeto;
 *        . Instagram, TikTok e Facebook pela MESMA leitura do perfil público
 *          que a medição já paga (lib/analytics/fonte-apify.ts): o ator traz
 *          os posts recentes do perfil inteiro, e eles eram jogados fora
 *          depois de casar os números. Agora vão para cá. Custo novo: zero;
 *        . Instagram por uma leitura própria pela Apify (12 posts, US$ 0,0324
 *          por leitura a US$ 0,0027 o post, uma vez a cada 20 h por perfil:
 *          cerca de US$ 1 por perfil por mês). DESLIGADA: só com
 *          INVENTARIO_APIFY=1, depois do OK do Bruno para o valor. Ela soma no
 *          mesmo teto do mês da medição (METRICAS_APIFY_MES_USD);
 *   3. O ESTUDO DO PERFIL PRÓPRIO da jornada de entrada (referencias_posts do
 *      perfil "proprio"), enquanto não vence (90 dias).
 */

export const TIPO_DO_INVENTARIO = "inventario_das_redes";
const INTERVALO_DA_VARREDURA_MS = 20 * 3600_000;
const ITENS_POR_REDE = 40;
/** A leitura própria do Instagram pela Apify: quantos posts e o teto por leitura. */
const ITENS_DO_INSTAGRAM = 12;
const TETO_DA_LEITURA_DO_INSTAGRAM_USD = 0.05;

type Guardado = { itens: ItemDoInventario[]; lidoEm: string; fonte: string; perfil: string | null };

/** Os posts de uma leitura de perfil viram itens do inventário. Puro. */
export function itensDaVarredura(rede: string, posts: Array<Pick<PostDeReferencia, "url" | "legenda" | "publicadoEm" | "formato">>): ItemDoInventario[] {
  return posts
    .filter((p) => p.url)
    .map((p) => ({
      rede,
      // No YouTube a primeira linha da legenda é o título do vídeo (postsDoYoutube).
      titulo: rede === "youtube" ? tituloNoYoutube(p.legenda) : primeiraLinha(p.legenda),
      url: p.url,
      publicadoEm: p.publicadoEm ?? null,
      formato: p.formato ?? null,
      origem: "varredura" as const,
    }));
}

/**
 * Guarda o que uma leitura do perfil viu, somado ao que já estava (a leitura
 * traz só os mais recentes; o que saiu da janela continua valendo). Nunca
 * lança: inventário é apoio, e uma falha aqui não derruba a medição.
 */
export async function guardarVarredura(projectId: string, rede: string, perfil: string | null, posts: Array<Pick<PostDeReferencia, "url" | "legenda" | "publicadoEm" | "formato">>, fonte: string): Promise<void> {
  try {
    const onde = { projectId_type_key: { projectId, type: TIPO_DO_INVENTARIO, key: rede } };
    const atual = await prisma.projectMemory.findUnique({ where: onde, select: { value: true } });
    const antigos = ((atual?.value as Guardado | null)?.itens ?? []).filter((i) => i && typeof i === "object");
    const itens = juntarInventario(itensDaVarredura(rede, posts), antigos).slice(0, ITENS_POR_REDE);
    const valor: Guardado = { itens, lidoEm: new Date().toISOString(), fonte, perfil };
    await prisma.projectMemory.upsert({
      where: onde,
      create: { projectId, type: TIPO_DO_INVENTARIO, key: rede, value: valor as unknown as Prisma.InputJsonValue },
      update: { value: valor as unknown as Prisma.InputJsonValue },
    });
  } catch (e) {
    console.warn(`[inventario][${projectId}] não guardei a leitura de ${rede}:`, e instanceof Error ? e.message : e);
  }
}

/**
 * O INVENTÁRIO DO PROJETO, o mais recente primeiro. É a única lista de
 * conteúdo próprio que um texto pode citar. Nunca lança: sem banco, devolve
 * vazio (e vazio quer dizer "não cite nada").
 */
export async function lerInventario(projectId: string): Promise<ItemDoInventario[]> {
  const [nossos, varreduras, proprios] = await Promise.all([
    prisma.post
      .findMany({
        where: { projectId, status: "published", externalUrl: { not: null } },
        orderBy: { publishedAt: "desc" },
        take: 80,
        select: { platform: true, content: true, externalUrl: true, publishedAt: true, mediaType: true, metadata: true },
      })
      .catch(() => []),
    prisma.projectMemory.findMany({ where: { projectId, type: TIPO_DO_INVENTARIO }, select: { value: true } }).catch(() => []),
    prisma.referenciaPost
      .findMany({
        where: { projectId, perfil: { status: "proprio" } },
        orderBy: { publicadoEm: "desc" },
        take: 60,
        select: { rede: true, url: true, legenda: true, publicadoEm: true, formato: true },
      })
      .catch(() => []),
  ]);
  const deNossos: ItemDoInventario[] = nossos.map((p) => ({
    rede: p.platform,
    titulo: p.platform === "youtube" ? tituloNoYoutube(p.content) : primeiraLinha(p.content),
    url: p.externalUrl,
    publicadoEm: p.publishedAt?.toISOString() ?? null,
    formato: ((p.metadata as { formato?: string } | null)?.formato ?? p.mediaType) || null,
    origem: "demandou",
  }));
  const daVarredura = varreduras.flatMap((m) => ((m.value as Guardado | null)?.itens ?? []).filter((i) => i && typeof i === "object" && typeof i.rede === "string"));
  const doEstudo: ItemDoInventario[] = proprios.map((p) => ({
    rede: p.rede,
    titulo: p.rede === "youtube" ? tituloNoYoutube(p.legenda) : primeiraLinha(p.legenda),
    url: p.url,
    publicadoEm: p.publicadoEm?.toISOString() ?? null,
    formato: p.formato,
    origem: "varredura",
  }));
  return juntarInventario(deNossos, daVarredura, doEstudo);
}

/** O canal do YouTube do cliente para a Data API: o id da conta conectada, o @, ou o que ele escreveu. */
export async function canalDoYoutube(projectId: string): Promise<string | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { config: true, socialAccounts: { where: { platform: "youtube", isActive: true }, select: { platformUserId: true, username: true } } },
  });
  for (const c of projeto?.socialAccounts ?? []) {
    if (c.platformUserId && /^UC[\w-]{20,}$/.test(c.platformUserId)) return c.platformUserId;
    if (c.username?.trim().startsWith("@")) return c.username.trim();
  }
  const escrito = lerRedesEscritas(projeto?.config).youtube;
  if (escrito) return escrito.replace(/^channel\//, "");
  const estudo = await prisma.referenciaPerfil.findFirst({ where: { projectId, rede: "youtube", status: "proprio" }, select: { perfil: true } });
  return estudo?.perfil ?? null;
}

/** O @ do Instagram do cliente: o que ele escreveu, ou o da conta conectada. */
async function perfilDoInstagram(projectId: string): Promise<string | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { config: true, socialAccounts: { where: { platform: "instagram", isActive: true }, select: { username: true } } },
  });
  const escrito = lerRedesEscritas(projeto?.config).instagram;
  if (escrito) return escrito;
  const conta = projeto?.socialAccounts.find((c) => /^@?[A-Za-z0-9._]{1,30}$/.test((c.username ?? "").trim()));
  return conta?.username?.trim().replace(/^@/, "") ?? null;
}

type Situacao = "lido" | "recente" | "sem-perfil" | "sem-api" | "desligado" | "sem-orcamento" | "erro";

async function lidoHaPouco(projectId: string, rede: string): Promise<boolean> {
  const m = await prisma.projectMemory.findUnique({ where: { projectId_type_key: { projectId, type: TIPO_DO_INVENTARIO, key: rede } }, select: { updatedAt: true } });
  return Boolean(m && Date.now() - m.updatedAt.getTime() < INTERVALO_DA_VARREDURA_MS);
}

/** O YouTube do cliente pela API oficial (sem custo em dinheiro). */
export async function varrerYoutube(projectId: string, opcoes: { forcar?: boolean } = {}): Promise<Situacao> {
  try {
    if (!opcoes.forcar && (await lidoHaPouco(projectId, "youtube"))) return "recente";
    const canal = await canalDoYoutube(projectId);
    if (!canal) {
      // Marca a tentativa: sem canal, não pergunta de novo a cada 5 minutos.
      await guardarVarredura(projectId, "youtube", null, [], "sem-canal");
      return "sem-perfil";
    }
    const posts = await postsDoYoutube(canal, 25);
    if (!posts) return "sem-api";
    await guardarVarredura(projectId, "youtube", canal, posts, "api:youtube");
    return "lido";
  } catch (e) {
    console.warn(`[inventario][${projectId}] leitura do YouTube falhou:`, e instanceof Error ? e.message : e);
    return "erro";
  }
}

/** Ligada só com INVENTARIO_APIFY=1 (custo novo; espera o OK do Bruno). */
export function leituraPropriaDoInstagramLigada(env: Record<string, string | undefined> = process.env): boolean {
  return env.INVENTARIO_APIFY === "1";
}

/**
 * O Instagram do cliente por uma leitura própria pela Apify. DESLIGADA por
 * padrão (custo novo, ver o topo). Soma no teto do mês da medição.
 */
export async function varrerInstagramPelaApify(projectId: string, opcoes: { forcar?: boolean } = {}): Promise<Situacao> {
  if (!leituraPropriaDoInstagramLigada() || !apifyConfigurada()) return "desligado";
  try {
    if (!opcoes.forcar && (await lidoHaPouco(projectId, "instagram"))) return "recente";
    const perfil = await perfilDoInstagram(projectId);
    if (!perfil) return "sem-perfil";
    const inicio = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const gasto = (await prisma.coletaDeMetrica.aggregate({ where: { criadoEm: { gte: inicio } }, _sum: { custoUsd: true } }))._sum.custoUsd ?? 0;
    const tetoDoMes = Number(process.env.METRICAS_APIFY_MES_USD ?? 3) || 3;
    if (tetoDoMes - gasto < TETO_DA_LEITURA_DO_INSTAGRAM_USD) return "sem-orcamento";
    const r = await coletarReferencia("instagram", perfil, { maxItens: ITENS_DO_INSTAGRAM, caixa: new Caixa(TETO_DA_LEITURA_DO_INSTAGRAM_USD) });
    // Fonte própria: a medição não confunde esta leitura com a dela (a trava de 20 h e a de 7 dias olham "apify:instagram").
    await prisma.coletaDeMetrica.create({
      data: { projectId, fonte: "apify:instagram:inventario", perfil, status: r.status, erro: r.erro?.slice(0, 300) ?? null, itens: r.posts.length, casados: 0, custoUsd: r.custoUsd },
    });
    if (r.status !== "ok" && r.status !== "vazio") return "erro";
    await guardarVarredura(projectId, "instagram", perfil, r.posts, "apify:instagram:inventario");
    return "lido";
  } catch (e) {
    console.warn(`[inventario][${projectId}] leitura do Instagram falhou:`, e instanceof Error ? e.message : e);
    return "erro";
  }
}

/**
 * A VARREDURA PERIÓDICA, no cron de publicação (a cada 5 minutos), depois da
 * medição: projetos com post criado nos últimos 14 dias, o que esperou mais
 * primeiro, com teto de tempo por passada. Nenhum cron novo.
 */
export async function varrerInventarios(opcoes: { orcamentoMs?: number; maxProjetos?: number } = {}): Promise<{ olhados: number; lidos: number }> {
  const inicio = Date.now();
  const orcamento = opcoes.orcamentoMs ?? 20_000;
  const ativos = await prisma.post.groupBy({
    by: ["projectId"],
    where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 3600_000) } },
    _max: { createdAt: true },
  });
  if (!ativos.length) return { olhados: 0, lidos: 0 };
  const ids = ativos.map((a) => a.projectId);
  const lidos = await prisma.projectMemory.findMany({
    where: { projectId: { in: ids }, type: TIPO_DO_INVENTARIO, key: "youtube" },
    select: { projectId: true, updatedAt: true },
  });
  const ultima = new Map(lidos.map((l) => [l.projectId, l.updatedAt.getTime()]));
  const fila = ids
    .filter((id) => Date.now() - (ultima.get(id) ?? 0) >= INTERVALO_DA_VARREDURA_MS)
    .sort((a, b) => (ultima.get(a) ?? 0) - (ultima.get(b) ?? 0))
    .slice(0, opcoes.maxProjetos ?? 4);
  let olhados = 0;
  let feitos = 0;
  for (const projectId of fila) {
    if (Date.now() - inicio > orcamento) break;
    olhados++;
    if ((await varrerYoutube(projectId)) === "lido") feitos++;
    if ((await varrerInstagramPelaApify(projectId)) === "lido") feitos++;
  }
  return { olhados, lidos: feitos };
}
