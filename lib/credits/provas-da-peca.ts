import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import type { ProvasDaPeca } from "@/lib/credits/reprovacao-pelo-jev";
import { formatoDaPeca } from "@/lib/media/formatos-das-redes";
import { bufferDeDataUri, medirMargem } from "@/lib/media/margem-de-seguranca";
import { conferirArte } from "@/lib/media/conferencia-da-arte";
import { frasesComFonteSemLastro, frasesComNumeroSemLastro, lastroDoVideo } from "@/lib/media/lastro-do-video";
import { guardarConteudoProprio } from "@/lib/squad/guarda-do-conteudo-proprio";
import { lerInventario } from "@/lib/analytics/inventario-das-redes";
import { canalDoProjeto } from "@/lib/media/elo-na-publicacao";
import { estadoDaIdentidade } from "@/lib/modelos-de-arte/identidade-aprovada";
import { lerVeredito } from "@/lib/squad/veredito";

/**
 * AS PROVAS AUTOMÁTICAS DE UMA PEÇA, juntadas pelo código (08/10/2026).
 *
 * Nada aqui decide. Cada prova é uma conferência que a esteira já faz na
 * geração, rodada de novo sobre a peça que o cliente reprovou:
 *   - a arte medida contra o formato da rede (sharp, custo zero);
 *   - a régua da margem (lib/media/margem-de-seguranca.ts, custo zero);
 *   - a conferência da arte com o olho barato (lib/media/conferencia-da-arte.ts:
 *     o Haiku descreve e o código e o JEV decidem; centavos);
 *   - o lastro de número e fonte contra a pesquisa da campanha e a fala;
 *   - a guarda do conteúdo próprio contra o inventário das redes;
 *   - a identidade visual aprovada;
 *   - o parecer da revisora (Vera) sobre o dia da peça.
 *
 * Cada prova que falha vira "não conferida" em vez de derrubar o conjunto: a
 * reprovação precisa de resposta mesmo com uma prova fora do ar.
 */

type PostParaProvas = {
  id: string;
  projectId: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  mediaType: string | null;
  metadata: unknown;
  runId: string | null;
  dayOfWeek: number | null;
};

async function imagemDaPeca(imageUrl: string): Promise<Buffer | null> {
  const primeira = imageUrl.split("|")[0]?.trim() ?? "";
  if (!primeira) return null;
  if (primeira.startsWith("data:")) return bufferDeDataUri(primeira);
  if (/^https?:\/\//.test(primeira)) {
    const r = await fetch(primeira, { signal: AbortSignal.timeout(30_000) });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  }
  return null;
}

async function provaDaArte(post: PostParaProvas): Promise<ProvasDaPeca["arte"]> {
  if (!post.imageUrl || post.imageUrl.length < 10) return { existe: false, formato: null, margem: null, olho: null, textoEsperado: null };
  const frase = (post.metadata as { frase?: unknown } | null)?.frase;
  const textoEsperado = typeof frase === "string" && frase.trim() ? [frase.trim()] : null;
  const vazio: NonNullable<ProvasDaPeca["arte"]> = { existe: true, formato: null, margem: null, olho: null, textoEsperado };
  let imagem: Buffer | null = null;
  try {
    imagem = await imagemDaPeca(post.imageUrl);
  } catch (e) {
    console.warn("[provas-da-peca] não baixei a arte:", e instanceof Error ? e.message : e);
  }
  if (!imagem) return vazio;
  const formato = formatoDaPeca(post.platform, post.mediaType ?? undefined);
  const saida = { ...vazio };
  try {
    const m = await sharp(imagem).metadata();
    if (m.width && m.height) {
      // Tolerância de 2%: o recorte por rede arredonda um pixel ou dois.
      const bate = Math.abs(m.width / m.height - formato.largura / formato.altura) <= 0.02;
      saida.formato = { esperado: `${formato.largura}x${formato.altura} (${formato.proporcao})`, medido: `${m.width}x${m.height}`, bate };
    }
  } catch (e) {
    console.warn("[provas-da-peca] não medi o formato:", e instanceof Error ? e.message : e);
  }
  try {
    const medida = await medirMargem(imagem);
    saida.margem = { cortado: medida.cortado, resumo: medida.resumo };
  } catch (e) {
    console.warn("[provas-da-peca] não medi a margem:", e instanceof Error ? e.message : e);
  }
  try {
    const jpeg = await sharp(imagem).jpeg({ quality: 85 }).toBuffer();
    const veredito = await conferirArte(`data:image/jpeg;base64,${jpeg.toString("base64")}`, {
      formato,
      textoDoPost: post.content,
      textoEsperado: textoEsperado ?? undefined,
      usarRegua: false,
      usarOlho: true,
      projectId: post.projectId,
      runId: post.runId ?? undefined,
    });
    saida.olho = { parecer: veredito.parecerDoOlho ?? null, reprovou: veredito.aprovada ? null : veredito.motivo };
  } catch (e) {
    console.warn("[provas-da-peca] a conferência da arte não rodou:", e instanceof Error ? e.message : e);
  }
  return saida;
}

async function provaDoLastro(post: PostParaProvas): Promise<ProvasDaPeca["lastro"]> {
  try {
    const run = post.runId ? await prisma.pipelineRun.findUnique({ where: { id: post.runId }, select: { pesquisa: true } }) : null;
    const pesquisa = (run?.pesquisa ?? null) as { brief?: string; bruta?: string } | null;
    const partes = [pesquisa?.bruta ?? "", pesquisa?.brief ?? ""].filter(Boolean);
    // A peça de vídeo tem a fala como lastro.
    const meta = (post.metadata as { videoJobId?: unknown; videoId?: unknown } | null) ?? null;
    const videoId = typeof meta?.videoJobId === "string" ? meta.videoJobId : typeof meta?.videoId === "string" ? meta.videoId : null;
    if (videoId) {
      const v = await prisma.videoJob.findUnique({ where: { id: videoId }, select: { transcript: true } }).catch(() => null);
      const t = v?.transcript as { text?: unknown } | string | null | undefined;
      const texto = typeof t === "string" ? t : typeof t?.text === "string" ? t.text : null;
      if (texto) partes.push(texto);
    }
    const lastro = lastroDoVideo({ transcricao: partes.join("\n") });
    if (!lastro.trim()) return { conferido: false, frasesSemNumero: [], frasesSemFonte: [] };
    return { conferido: true, frasesSemNumero: frasesComNumeroSemLastro(post.content, lastro), frasesSemFonte: frasesComFonteSemLastro(post.content, lastro) };
  } catch (e) {
    console.warn("[provas-da-peca] lastro não conferido:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function provaDoConteudoProprio(post: PostParaProvas): Promise<ProvasDaPeca["conteudoProprio"]> {
  try {
    const [inventario, canal] = await Promise.all([lerInventario(post.projectId), canalDoProjeto(post.projectId)]);
    const meta = (post.metadata as { frasesDoCliente?: unknown } | null) ?? null;
    const g = await guardarConteudoProprio({
      projectId: post.projectId,
      texto: post.content,
      rede: post.platform,
      pecaEhVideo: post.mediaType === "video",
      inventario,
      permitidos: canal.permitidos,
      frasesDoCliente: Array.isArray(meta?.frasesDoCliente) ? (meta.frasesDoCliente as unknown[]).filter((x): x is string => typeof x === "string") : [],
    });
    return { conferido: true, frasesSemProva: g.cortadas.map((c) => c.frase) };
  } catch (e) {
    console.warn("[provas-da-peca] conteúdo próprio não conferido:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function provaDaRevisora(post: PostParaProvas): Promise<ProvasDaPeca["revisora"]> {
  if (!post.runId || post.dayOfWeek === null) return null;
  try {
    const card = await prisma.campaignCard.findFirst({
      where: { runId: post.runId, dayOfWeek: post.dayOfWeek, agentId: { contains: "vera" } },
      select: { content: true },
      orderBy: { createdAt: "desc" },
    });
    if (!card) return null;
    const v = lerVeredito(card.content);
    return { reprovou: v.chave === "reprovado", parecer: v.nota ?? null };
  } catch {
    return null;
  }
}

/** Junta as provas da peça. Nunca lança. */
export async function provasDaPeca(post: PostParaProvas): Promise<ProvasDaPeca> {
  const [arte, lastro, conteudoProprio, identidade, revisora] = await Promise.all([
    provaDaArte(post).catch(() => null),
    provaDoLastro(post),
    provaDoConteudoProprio(post),
    estadoDaIdentidade(post.projectId)
      .then((e) => ({ aprovada: e.aprovada }))
      .catch(() => null),
    provaDaRevisora(post),
  ]);
  return { rede: post.platform, tipoDePeca: post.mediaType, texto: post.content, arte, lastro, conteudoProprio, identidade, revisora };
}
