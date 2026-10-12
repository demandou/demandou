import { prisma } from "@/lib/db/prisma";

/**
 * A ARTE LIVRE COM A PESSOA (12/10/2026, decisão do Bruno).
 *
 * "Deixe a IA criar, o Nano Banana Pro é o melhor modelo que temos, não podemos
 * limitá-lo, estamos estragando resultado com nossas regras." No Gemini, só com
 * uma foto dele e a descrição do post, saiu uma peça muito melhor que a colagem
 * da Demandou (recorte colado em código, frase em código, a IA só no fundo).
 *
 * Aqui é o mesmo pedido que ele fez no Gemini: a foto da pessoa (a mais nova
 * dos materiais) e o texto do post, com liberdade de cena. O ajuste do cliente
 * no refazer entra junto. Sem molde, sem cores impostas, sem recorte. A regra
 * de 11/10 ("a IA nunca recebe a pessoa") está revogada para a foto do post.
 *
 * Chave ARTE_LIVRE=0 desliga (volta ao caminho do estilo).
 */
export function arteLivreLigada(): boolean {
  return (process.env.ARTE_LIVRE ?? "1").trim() !== "0";
}

const NOME_DA_REDE: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", twitter: "X", tiktok: "TikTok", youtube: "YouTube" };

/** O pedido, como o Bruno escreveu no Gemini. Puro (testado). */
export function promptDaArteLivre(o: { texto: string; rede: string; ajuste?: string | null }): string {
  const rede = NOME_DA_REDE[o.rede] ?? "Instagram";
  const ajuste = o.ajuste?.trim() ? `\n\nO cliente pediu também: ${o.ajuste.trim()}` : "";
  return `Use esta imagem (a foto da pessoa) e crie uma imagem para um post do ${rede} com esta descrição:\n\n${o.texto.trim()}${ajuste}`;
}

/** A foto da pessoa para a arte: a mais nova dos materiais com rosto; sem ela, a foto mais nova. */
export async function fotoDaPessoaParaArte(projectId: string): Promise<{ base64: string; mime: string } | null> {
  const fotos = await prisma.materialDoCliente
    .findMany({ where: { projectId, tipo: "foto", status: "pronto" }, orderBy: { createdAt: "desc" }, take: 20, select: { url: true, etiquetas: true } })
    .catch(() => []);
  const comPessoa = fotos.find((f) => JSON.stringify(f.etiquetas ?? "").includes("pessoa")) ?? fotos[0];
  if (!comPessoa) return null;
  const { lerMidia } = await import("@/lib/media/storage");
  const bytes = await lerMidia(comPessoa.url).catch(() => null);
  if (!bytes) return null;
  const sharp = (await import("sharp")).default;
  // JPEG de até 1600 px: o Google recebe rápido e a pessoa continua nítida.
  const jpeg = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  return { base64: jpeg.toString("base64"), mime: "image/jpeg" };
}

/**
 * A arte livre de cada rede: o Nano Banana Pro primeiro (a cascata de sempre do
 * Google), uma por proporção, com a conferência só como rede de segurança
 * (texto cortado na borda); pessoa é permitida. Devolve a arte por rede.
 */
export async function arteLivre(o: { projectId: string; runId?: string | null; redes: string[]; texto: string; ajuste?: string | null; foto: { base64: string; mime: string } }): Promise<Record<string, string>> {
  const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
  const { comporNoGoogle } = await import("@/lib/media/nano-banana");
  const ctx = { projectId: o.projectId, runId: o.runId ?? undefined, operation: "arte-livre" };
  const arte = await produzirArtePorRede({
    redes: o.redes,
    contentType: "image",
    promptBase: promptDaArteLivre({ texto: o.texto, rede: o.redes[0] ?? "instagram", ajuste: o.ajuste }),
    permitirPessoas: true,
    textoDoPost: o.texto,
    projectId: o.projectId,
    runId: o.runId ?? undefined,
    desenhar: async (prompt, proporcao) => {
      const r = await comporNoGoogle(prompt, o.foto.base64, o.foto.mime, ctx, proporcao);
      if (!r) throw new Error("o Nano Banana Pro não devolveu a arte (confira o saldo do Google)");
      return r.dataUrl;
    },
  });
  if (!Object.keys(arte.porRede).length) throw new Error("a arte livre não saiu");
  return arte.porRede;
}
