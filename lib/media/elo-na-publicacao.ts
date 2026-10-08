import { prisma } from "@/lib/db/prisma";
import { fraseDoElo, lerEloDoPost, nomeDoCanal, perfisDoCliente, textoComElo, type ChamadaDoElo, type CitacaoDoElo, type EloDoPost, type PecaPublicada } from "@/lib/media/elo-da-campanha";
import { tituloNoYoutube, type ItemDoInventario } from "@/lib/analytics/tipos-do-inventario";
import { lerInventario } from "@/lib/analytics/inventario-das-redes";
import { avisoDaFraseCortada, guardarConteudoProprio, tirarFrases, type FraseCortada } from "@/lib/squad/guarda-do-conteudo-proprio";
import { frasesComFonteSemLastro, frasesComNumeroSemLastro } from "@/lib/media/lastro-do-video";
import { lerLinks } from "@/lib/projeto/links-do-cliente";
import type { perguntarAoJev } from "@/lib/jev/cliente";

/**
 * O ELO NA HORA DE PUBLICAR (08/10/2026, regra do Bruno: "se não sabe, não
 * fala").
 *
 * A chamada de uma peça para o vídeo completo e para a peça anterior só entra
 * no texto quando a peça citada está NO AR: status publicado e endereço
 * externo. Quem decide isso é esta função, em dois momentos:
 *
 *   1. NA PUBLICAÇÃO de cada peça (`prepararTextoParaPublicar`, chamada por
 *      lib/publish/oauth-post.ts antes de qualquer rede): as chamadas antigas
 *      saem, a guarda do conteúdo próprio passa no texto (o que cita conteúdo
 *      que não está no ar sai, com aviso no log da Vera) e entram só as
 *      chamadas das peças publicadas, montadas em código com o título real e
 *      o link onde a rede aceita;
 *   2. QUANDO UMA PEÇA VAI AO AR (`ligarPecasQueCitam`): os rascunhos e
 *      agendados da mesma campanha que citam essa peça recebem a chamada já no
 *      texto, para o quadro mostrar o post como ele vai sair. Era o que
 *      lib/media/cortes-com-link-do-completo.ts fazia só para os cortes e só
 *      com o completo; agora vale para todas as peças da semana.
 *
 * O que já está no ar nunca é tocado.
 */

type PostParaElo = { id: string; projectId: string; platform: string; content: string; metadata: unknown; runId?: string | null; mediaType?: string | null };

/** Busca no banco a peça que uma chamada cita, SÓ se ela estiver publicada com endereço. */
export type BuscarCitada = (projectId: string, chamada: ChamadaDoElo, redeDoPost: string) => Promise<PecaPublicada | null>;

export const buscarCitadaNoBanco: BuscarCitada = async (projectId, chamada, redeDoPost) => {
  if (chamada.tipo === "completo") {
    const p = await prisma.post.findFirst({
      where: {
        projectId,
        platform: "youtube",
        status: "published",
        externalUrl: { not: null },
        AND: [{ metadata: { path: ["videoJobId"], equals: chamada.videoJobId } }, { metadata: { path: ["gravacaoCompleta"], equals: true } }],
      },
      orderBy: { publishedAt: "desc" },
      select: { id: true, platform: true, content: true, externalUrl: true },
    });
    return p?.externalUrl ? { postId: p.id, rede: p.platform, url: p.externalUrl, titulo: tituloNoYoutube(p.content), formato: "video" } : null;
  }
  const candidatos = await prisma.post.findMany({
    where: { projectId, runId: chamada.runId, dayOfWeek: chamada.dia, status: "published", externalUrl: { not: null } },
    orderBy: { publishedAt: "asc" },
    select: { id: true, platform: true, content: true, externalUrl: true, mediaType: true, metadata: true },
  });
  // A da mesma rede primeiro: "está no meu perfil" vale para quem lê aqui.
  const p = candidatos.find((c) => c.platform === redeDoPost) ?? candidatos[0];
  if (!p?.externalUrl) return null;
  // O formato do PLANO para aquele dia ("short", "carousel"...) é o que diz
  // "o vídeo curto", "o carrossel"; o do post é reserva.
  const formato = chamada.formato || (p.metadata as { formato?: string } | null)?.formato || p.mediaType || null;
  return { postId: p.id, rede: p.platform, url: p.externalUrl, titulo: p.platform === "youtube" ? tituloNoYoutube(p.content) : null, formato };
};

/** As citações do elo que estão no ar; a que não está fica de fora. Nunca lança. */
export async function citacoesNoAr(projectId: string, elo: EloDoPost | null, redeDoPost: string, buscar: BuscarCitada = buscarCitadaNoBanco): Promise<CitacaoDoElo[]> {
  if (!elo) return [];
  const saida: CitacaoDoElo[] = [];
  for (const chamada of elo.chamadas) {
    const peca = await buscar(projectId, chamada, redeDoPost).catch(() => null);
    if (peca?.url) saida.push({ chamada, peca });
  }
  return saida;
}

/** O texto com as chamadas de agora (só as peças no ar). Puro sobre o que `buscar` devolve. */
export async function textoComEloDoPost(
  post: Pick<PostParaElo, "projectId" | "platform" | "content" | "metadata">,
  opcoes: { canal?: string | null; buscar?: BuscarCitada } = {}
): Promise<string> {
  const elo = lerEloDoPost(post.metadata);
  const citadas = await citacoesNoAr(post.projectId, elo, post.platform, opcoes.buscar);
  const frases = citadas.map((c) => fraseDoElo(c, post.platform, { corte: elo?.corte, canal: opcoes.canal })).filter((f): f is string => Boolean(f));
  return textoComElo(post.content, frases, post.platform);
}

async function canalDoProjeto(projectId: string): Promise<{ canal: string | null; permitidos: string[] }> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { config: true, socialAccounts: { where: { isActive: true }, select: { platform: true, username: true, displayName: true } } },
  });
  const contas = projeto?.socialAccounts ?? [];
  const permitidos = [
    ...lerLinks(projeto?.config).map((l) => l.url),
    ...perfisDoCliente(contas, projeto?.config).map((p) => p.url).filter((u): u is string => Boolean(u)),
  ];
  return { canal: nomeDoCanal(contas, projeto?.config), permitidos };
}

/**
 * Anota no log do run, em nome da Vera, as frases que a guarda tirou. Um
 * UPDATE só, que acrescenta ao fim da lista (os dias correm em paralelo, e
 * ler e regravar a lista perderia avisos). Nunca lança.
 */
export async function anotarCortesNoLog(runId: string | null | undefined, cortadas: FraseCortada[], onde: string): Promise<void> {
  if (!cortadas.length) return;
  for (const c of cortadas) console.warn(`[vera][guarda-do-proprio] ${avisoDaFraseCortada(c, onde)}`);
  if (!runId) return;
  const entradas = cortadas.map((c) => ({ agent: "Vera Veredito", message: avisoDaFraseCortada(c, onde), status: "warning", timestamp: new Date().toISOString() }));
  try {
    await prisma.$executeRaw`UPDATE "pipeline_runs" SET "logs" = COALESCE("logs", '[]'::jsonb) || ${JSON.stringify(entradas)}::jsonb WHERE "id" = ${runId}`;
  } catch (e) {
    console.warn("[guarda-do-proprio] o aviso não entrou no log do run:", e instanceof Error ? e.message : e);
  }
}

const DIAS = ["", "segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
const NOME_DA_REDE_NO_LOG: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", twitter: "X", tiktok: "TikTok" };

export function ondeNoLog(rede: string, dia?: number | null): string {
  const r = NOME_DA_REDE_NO_LOG[rede] ?? rede;
  return dia ? `do post de ${r} de ${DIAS[dia] ?? "outro dia"}` : `do post de ${r}`;
}

/**
 * O TEXTO GERADO ANTES DE IR AO QUADRO (08/10): a semana do vídeo e as
 * legendas dos cortes passam por aqui logo depois de escritos.
 *   1. a guarda do conteúdo próprio (código acha, JEV decide; o que cita
 *      conteúdo do cliente que não está no ar sai);
 *   2. o lastro: frase com número que não está na fala, na pesquisa do
 *      Roberto nem no material do cliente sai, e frase que cita fonte que não
 *      está na pesquisa nem na fala sai (lib/media/lastro-do-video.ts).
 * Cada frase tirada vira aviso no log da Vera. Nunca esvazia a peça: se o
 * lastro tiraria tudo, fica o texto da guarda e o aviso.
 */
export async function limparTextoGerado(p: {
  texto: string;
  rede: string;
  dia?: number | null;
  projectId: string;
  runId?: string | null;
  inventario: ItemDoInventario[];
  permitidos?: string[];
  /** A fala, a pesquisa e o material do cliente juntos; vazio pula a conferência dos números. */
  lastro?: string;
  pecaEhVideo?: boolean;
  perguntar?: typeof perguntarAoJev;
  usarJev?: boolean;
  /** Para o teste: não grava no log do run. */
  semLog?: boolean;
}): Promise<string> {
  const g = await guardarConteudoProprio({
    projectId: p.projectId,
    texto: p.texto,
    rede: p.rede,
    pecaEhVideo: p.pecaEhVideo,
    inventario: p.inventario,
    permitidos: p.permitidos,
    perguntar: p.perguntar,
    usarJev: p.usarJev,
  });
  let texto = g.texto;
  const doLastro: FraseCortada[] = [];
  if (p.lastro?.trim()) {
    for (const f of frasesComNumeroSemLastro(texto, p.lastro)) doLastro.push({ frase: f, motivo: "traz um número que não está na fala, na pesquisa do Roberto nem no material do cliente" });
    for (const f of frasesComFonteSemLastro(texto, p.lastro)) {
      if (!doLastro.some((x) => x.frase === f)) doLastro.push({ frase: f, motivo: "cita uma fonte que não está na pesquisa do Roberto nem na fala" });
    }
    if (doLastro.length) {
      const semElas = tirarFrases(texto, doLastro.map((c) => c.frase));
      if (semElas.trim()) texto = semElas;
      else doLastro.length = 0;
    }
  }
  if (!p.semLog) await anotarCortesNoLog(p.runId, [...g.cortadas, ...doLastro], ondeNoLog(p.rede, p.dia));
  return texto;
}

/**
 * O TEXTO QUE VAI AO AR. Chamado pela publicação antes de qualquer rede:
 *   1. as chamadas de elo antigas saem;
 *   2. a guarda do conteúdo próprio passa (código acha, JEV decide, o que não
 *      está comprovado no ar sai, com aviso no log da Vera);
 *   3. entram as chamadas das peças publicadas.
 * Na enquete, a introdução (que é o texto que vai ao ar) passa pela guarda
 * também. Devolve o que mudar; quem chama grava antes de publicar.
 */
export async function prepararTextoParaPublicar(post: PostParaElo & { dayOfWeek?: number | null }): Promise<{ content: string; metadata: Record<string, unknown> | null; cortadas: FraseCortada[] }> {
  const metadata = (post.metadata as Record<string, unknown> | null) ?? null;
  const [inventario, projeto] = await Promise.all([lerInventario(post.projectId).catch(() => []), canalDoProjeto(post.projectId).catch(() => ({ canal: null, permitidos: [] }))]);
  const pecaEhVideo = post.mediaType === "video";
  const guardar = (texto: string) =>
    guardarConteudoProprio({
      projectId: post.projectId,
      texto,
      rede: post.platform,
      pecaEhVideo,
      inventario,
      permitidos: projeto.permitidos,
      frasesDoCliente: Array.isArray(metadata?.frasesDoCliente) ? (metadata.frasesDoCliente as unknown[]).filter((x): x is string => typeof x === "string") : [],
    });

  const semElo = textoComElo(post.content, [], post.platform);
  const guardado = await guardar(semElo);
  const content = await textoComEloDoPost({ ...post, content: guardado.texto }, { canal: projeto.canal });

  let novaMeta: Record<string, unknown> | null = null;
  const cortadas = [...guardado.cortadas];
  const intro = typeof metadata?.intro === "string" ? metadata.intro : null;
  if (post.mediaType === "poll" && intro) {
    const g = await guardar(intro);
    if (g.texto !== intro) {
      novaMeta = { ...(metadata ?? {}), intro: g.texto };
      cortadas.push(...g.cortadas);
    }
  }
  await anotarCortesNoLog(post.runId, cortadas, ondeNoLog(post.platform, post.dayOfWeek));
  return { content, metadata: novaMeta, cortadas };
}

/**
 * UMA PEÇA FOI AO AR: os rascunhos e agendados da mesma campanha que a citam
 * recebem a chamada no texto (e o card que mostra esse texto acompanha).
 * Só as linhas do elo mudam; o resto do texto fica como está. Nunca lança.
 * Devolve quantos posts mudaram.
 */
export async function ligarPecasQueCitam(publicado: { id: string; projectId: string; runId?: string | null }): Promise<number> {
  try {
    const runId = publicado.runId ?? (await prisma.post.findUnique({ where: { id: publicado.id }, select: { runId: true } }))?.runId;
    if (!runId) return 0;
    const pendentes = await prisma.post.findMany({
      where: { projectId: publicado.projectId, runId, id: { not: publicado.id }, status: { in: ["draft", "scheduled"] } },
      select: { id: true, projectId: true, platform: true, content: true, metadata: true },
    });
    const { canal } = await canalDoProjeto(publicado.projectId);
    let ligados = 0;
    for (const p of pendentes) {
      if (!lerEloDoPost(p.metadata)) continue;
      const novo = await textoComEloDoPost(p, { canal });
      if (novo === p.content) continue;
      await prisma.post.update({ where: { id: p.id }, data: { content: novo } });
      // Só o card que mostra ESTE texto (o do redator ou o do Vitor); o da Diana descreve a arte.
      await prisma.campaignCard.updateMany({ where: { postId: p.id, content: p.content }, data: { content: novo } });
      ligados++;
    }
    if (ligados) console.log(`[elo][${publicado.id}] ${ligados} peça(s) da campanha receberam a chamada para o que acabou de ir ao ar`);
    return ligados;
  } catch (e) {
    console.warn(`[elo][${publicado.id}] as peças que citam esta ficaram sem a chamada:`, e instanceof Error ? e.message : e);
    return 0;
  }
}
