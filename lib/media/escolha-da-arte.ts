import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ModeloDoPost } from "@/lib/estilo-dos-posts/tipos";

/**
 * A ARTE ESPERA A ESCOLHA DO CLIENTE (11/10/2026, pedido do Bruno).
 *
 * "Ao invés de gerar tudo de uma vez, as artes precisam passar pela escolha
 * do usuário: seguir o design do vídeo, escolher na biblioteca, gerar a partir
 * de um modelo ou criar do zero com IA. Isso evita a IA gerar e gastar com
 * algo que o usuário não quer. E ele escolhe se os posts usam os materiais
 * dele ou não."
 *
 * Com a chave ESCOLHA_DA_ARTE=1, a semana do vídeo (pecas-da-semana.ts) cria
 * as peças com arte pelo caminho da espera que já existia para a identidade
 * (post sem imagem, card "aguardando", nada de IA de imagem), com a marca
 * `esperaEscolha`. O card abre a escolha (as portas de modelos-dos-posts.tsx);
 * escolher grava o modelo nos posts e gera só aquelas artes, pelo mesmo
 * caminho da liberação da identidade (artes-aguardando-identidade.ts).
 *
 * A arte da semana do vídeo já está no pacote do vídeo (video_roteiro e
 * video_aprovacao): gerar depois da escolha NÃO cobra de novo (`arteNoPacote`).
 * Chave desligada: tudo como antes.
 */
export function escolhaDaArteLigada(): boolean {
  return (process.env.ESCOLHA_DA_ARTE ?? "").trim() === "1";
}

export const TEXTO_ESPERANDO_ESCOLHA =
  "Escolha como quer esta arte: seguir o design do vídeo, um modelo da biblioteca ou criar o seu falando ou escrevendo. Nenhum crédito foi gasto; a arte sai depois da escolha.";

type Meta = Record<string, unknown>;
const objeto = (m: unknown): Meta => (m && typeof m === "object" && !Array.isArray(m) ? { ...(m as Meta) } : {});


/**
 * O metadata do post depois da escolha. Puro (testado).
 * - `modelo` vai para `modeloDoPost` (a arte lê dali, como na montagem da campanha);
 * - seguir o vídeo num projeto com modelo do curso grava o estilo (`arteNoModelo`),
 *   e a arte sai pela IA nesse estilo, como sai hoje sem a espera;
 * - sem materiais, a lista de fotos escolhidas fica VAZIA: a arte lê "escolheu
 *   nenhuma" e não abre a Biblioteca (marcaDaArte só lê a Biblioteca sem escolha);
 * - a peça da semana do vídeo fica marcada como já paga.
 */
export function metadataDaEscolha(meta: unknown, e: { modelo: ModeloDoPost; usarMateriais: boolean; estiloDoCurso: string | null; agora?: Date }): Meta {
  const m = objeto(meta);
  delete m.esperaEscolha;
  m.modeloDoPost = e.modelo;
  if (e.modelo.mestre && e.estiloDoCurso) m.arteNoModelo = { ...objeto(m.arteNoModelo), modelo: e.estiloDoCurso, origem: "escolha" };
  else delete m.arteNoModelo;
  if (!e.usarMateriais) m.fotosEscolhidas = [];
  m.semMateriais = !e.usarMateriais;
  if (m.origem === "video") m.arteNoPacote = true;
  m.arteEscolhida = { em: (e.agora ?? new Date()).toISOString(), porta: e.modelo.mestre ? "video" : e.modelo.designId ? "biblioteca" : e.modelo.catalogoId ? "modelo" : "outra" };
  return m;
}

/** O modelo que veio da tela: só os campos conhecidos, com id válido. Puro (testado). */
export function modeloValido(bruto: unknown): ModeloDoPost | null {
  const b = objeto(bruto);
  const id = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(v) ? v : null);
  const nome = typeof b.nome === "string" ? b.nome.slice(0, 80) : null;
  if (b.mestre === true) return { mestre: true, nome };
  if (id(b.designId)) return { designId: id(b.designId), catalogoId: id(b.catalogoId), nome };
  if (id(b.catalogoId)) return { catalogoId: id(b.catalogoId), nome };
  return null;
}

/**
 * Grava a escolha nos posts do grupo (o dia e o formato do post clicado) ou em
 * todas as artes da campanha que esperam a escolha (`todas`), marca cada um
 * como "gerando" e devolve os grupos para gerar depois da resposta.
 */
export async function aplicarEscolhaDaArte(o: {
  projectId: string;
  postId: string;
  modelo: ModeloDoPost;
  usarMateriais: boolean;
  todas: boolean;
}): Promise<{ grupos: import("@/lib/media/artes-aguardando-identidade").ArteAguardando[][]; posts: number }> {
  const base = await prisma.post.findFirst({ where: { id: o.postId, projectId: o.projectId }, select: { runId: true, dayOfWeek: true, mediaType: true } });
  if (!base) throw new Error("Essa peça não é deste projeto.");
  const alvo = await prisma.post.findMany({
    where: {
      projectId: o.projectId,
      imageUrl: null,
      status: { in: ["draft", "scheduled", "failed"] },
      metadata: { path: ["esperaEscolha"], equals: true },
      ...(o.todas && base.runId ? { runId: base.runId } : { runId: base.runId, dayOfWeek: base.dayOfWeek, mediaType: base.mediaType }),
    },
    select: { id: true, metadata: true },
  });
  if (!alvo.length) throw new Error("Esta arte não está mais esperando a escolha.");
  const { regraDaArtePeloModelo } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
  const regra = o.modelo.mestre ? await regraDaArtePeloModelo(o.projectId).catch(() => null) : null;
  const agora = new Date();
  for (const p of alvo) {
    await prisma.post.update({
      where: { id: p.id },
      data: { metadata: metadataDaEscolha(p.metadata, { modelo: o.modelo, usarMateriais: o.usarMateriais, estiloDoCurso: regra?.modelo ?? null, agora }) as Prisma.InputJsonValue },
    });
  }
  // O card da Diana do dia perde a marca: o quadro passa a "o squad está fazendo".
  const ids = new Set(alvo.map((p) => p.id));
  const cards = await prisma.campaignCard.findMany({ where: { projectId: o.projectId, postId: { in: [...ids] }, cardType: "media" }, select: { id: true, metadata: true } });
  for (const c of cards) {
    const m = objeto(c.metadata);
    delete m.esperaEscolha;
    await prisma.campaignCard.update({ where: { id: c.id }, data: { metadata: m as Prisma.InputJsonValue } });
  }
  const { iniciarGeracaoDasEscolhidas } = await import("@/lib/media/artes-aguardando-identidade");
  const grupos = await iniciarGeracaoDasEscolhidas(o.projectId, [...ids]);
  return { grupos, posts: alvo.length };
}
