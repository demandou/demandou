export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { descartarGravacaoRecusada, fraseDoEstouro, registrarGravacao } from "@/lib/limites-do-plano";
import { projetoVisivel } from "@/lib/equipe/conta";
import { validarPartes } from "@/lib/media/partes-da-gravacao";
import { registrarGravacaoEmPartes } from "@/lib/media/partes-servidor";

/** Lista os vídeos de um projeto. */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId é obrigatório" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projetoVisivel(userId) },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const videos = await prisma.videoJob.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      originalName: true,
      durationSec: true,
      clips: true,
      error: true,
      creditsCharged: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ videos });
}

/**
 * Registra um vídeo já enviado ao storage.
 *
 * Existe porque o callback do storage (onUploadCompleted) não alcança o
 * localhost em desenvolvimento. Em produção as duas coisas acontecem, e é isso
 * que produzia registro duplicado até 22/08: as duas escritas são concorrentes.
 * A garantia de "um arquivo, um registro" está na restrição única do banco.
 */
/** https e host do Vercel Blob; o resto é recusado antes de virar registro. */
function urlDoNossoStorage(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, blobUrl, originalName, sizeBytes, partes: partesBrutas, criterio } = await req.json();
  if (!projectId || (!blobUrl && partesBrutas === undefined)) {
    return NextResponse.json(
      { error: "projectId e blobUrl são obrigatórios" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projetoVisivel(userId) },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  // `upsert` e não "procura, e se não achar cria": as duas rotas que registram
  // um vídeo (esta e o aviso do storage) leem antes de qualquer uma escrever,
  // então a checagem na aplicação não decidia nada e as duas criavam. Desde
  // 30/09 quem resolve a corrida é a trava de `registrarGravacao`, que também
  // confere a COTA DE GRAVAÇÕES: até aqui esta rota registrava qualquer arquivo
  // sem cota, e era a porta aberta do limite de 4 gravações do Starter.
  // A GRAVAÇÃO EM PARTES (08/10): a lista vem na ordem que a pessoa
  // confirmou, e continua sendo UMA gravação na cota. A primeira parte é a
  // chave do registro (a mesma que o aviso da última parte usa).
  if (partesBrutas !== undefined) {
    const conferida = validarPartes(partesBrutas, projectId);
    if (!conferida.ok) return NextResponse.json({ error: conferida.erro }, { status: 400 });
    const itens = conferida.itens;
    let registroDasPartesFeito: Awaited<ReturnType<typeof registrarGravacao>>;
    try {
      registroDasPartesFeito = await registrarGravacaoEmPartes({ userId, projectId, itens, criterio });
    } catch (e) {
      console.error(`[partes][${projectId}] registro falhou:`, e);
      return NextResponse.json(
        { error: "Não consegui registrar as partes da gravação agora. Elas já subiram: tente enviar de novo em alguns minutos." },
        { status: 500 }
      );
    }
    if (!registroDasPartesFeito.ok) {
      for (const p of itens) await descartarGravacaoRecusada(p.url, projectId);
      return NextResponse.json(
        { error: fraseDoEstouro(registroDasPartesFeito.estouro), limite: registroDasPartesFeito.estouro },
        { status: 403 }
      );
    }
    return NextResponse.json({ video: registroDasPartesFeito.video, partes: itens.length });
  }

  // Só o nosso storage (08/10): a URL vai para o worker baixar, e uma URL
  // livre era pedir ao worker que buscasse qualquer endereço (inclusive o
  // arquivo privado de outro cliente, para quem soubesse a URL dele).
  if (!urlDoNossoStorage(blobUrl)) {
    return NextResponse.json({ error: "blobUrl precisa apontar para o storage da Demandou" }, { status: 400 });
  }

  const registro = await registrarGravacao({ userId, projectId, blobUrl, originalName, sizeBytes });
  if (!registro.ok) {
    await descartarGravacaoRecusada(blobUrl, projectId);
    return NextResponse.json(
      { error: fraseDoEstouro(registro.estouro), limite: registro.estouro },
      { status: 403 }
    );
  }

  return NextResponse.json({ video: registro.video });
}
