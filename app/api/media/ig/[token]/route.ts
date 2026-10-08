export const dynamic = "force-dynamic";
// A Meta busca o arquivo inteiro por aqui. Com vídeo, o padrão de segundos não
// serve: um Reels de um minuto leva mais que isso só para atravessar.
export const maxDuration = 800;

import { NextRequest, NextResponse } from "next/server";
import { abrirMidia } from "@/lib/media/storage";
import { prisma } from "@/lib/db/prisma";
import { verifyIgMediaToken } from "@/lib/oauth/instagram";
import { arteParaStory } from "@/lib/media/arte-do-story";

/**
 * Serve a imagem de um post para a Meta buscar na hora de publicar.
 *
 * Existe porque o Instagram só aceita mídia por URL https pública, e as
 * nossas imagens vivem como data URL no banco ou em Blob privado. A rota é
 * pública de propósito, e a segurança vem do token: HMAC com segredo do
 * servidor sobre (postId, índice), inviável de enumerar. Quando o post é
 * publicado e a imageUrl é limpa, a URL passa a responder 404 sozinha.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const verified = verifyIgMediaToken(token);
  if (!verified) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.post.findUnique({
    where: { id: verified.postId },
    select: { imageUrl: true, metadata: true },
  });
  // O STORY NA DIMENSÃO CERTA (08/10): o post irmão do story leva a arte do feed; a imagem
  // sai daqui em 9:16, inteira e centrada (lib/media/arte-do-story.ts). Vídeo passa como está.
  const ehStory = (post?.metadata as { formato?: unknown } | null)?.formato === "story";
  const servirImagem = async (buffer: Buffer, mime: string) => {
    const final = ehStory && mime.startsWith("image/") ? await arteParaStory(buffer) : { buffer, mime };
    return new NextResponse(new Uint8Array(final.buffer), {
      headers: {
        "Content-Type": final.mime,
        "Content-Length": String(final.buffer.length),
        "Cache-Control": "no-store",
      },
    });
  };
  const images = post?.imageUrl?.split("|").filter(Boolean) ?? [];
  const image = images[verified.index];
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (image.startsWith("data:")) {
    const comma = image.indexOf(",");
    if (comma === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const mime = image.slice(5, comma).replace(";base64", "") || "image/jpeg";
    const buffer = Buffer.from(image.slice(comma + 1), "base64");
    return servirImagem(buffer, mime);
  }

  if (image.startsWith("https://")) {
    // Proxy em vez de redirect: a URL de origem é privada, e o que prometemos
    // aqui é o arquivo em si.
    //
    // `get` do SDK do Blob, e NÃO `fetch` na URL: store privado responde 403
    // para fetch comum, inclusive do servidor. Enquanto só imagens passavam por
    // aqui isso nunca apareceu, porque elas viviam como data URL no banco. Com
    // vídeo, que vive no storage, a rota quebraria na primeira publicação.
    // Dos DOIS stores: a mídia produzida nasce no store público desde 01/09,
    // e ler uma URL pública com o token do store privado devolve 403.
    const midia = await abrirMidia(image);
    if (!midia) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (ehStory && midia.mimeType.startsWith("image/")) {
      const buffer = Buffer.from(await new Response(midia.stream).arrayBuffer());
      return servirImagem(buffer, midia.mimeType);
    }
    // Em FLUXO. Um Reels de um minuto passa de 10 MB, e a Meta busca o arquivo
    // inteiro: materializar isso na memória da função é desnecessário e, com
    // vídeo mais longo, fatal.
    return new NextResponse(midia.stream, {
      headers: {
        "Content-Type": midia.mimeType,
        "Content-Length": String(midia.size),
        "Cache-Control": "no-store",
        // A Meta pede faixas de bytes ao buscar vídeo. Sem isto ela desiste.
        "Accept-Ranges": "bytes",
      },
    });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
