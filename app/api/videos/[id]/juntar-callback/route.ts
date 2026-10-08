export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { despacharPasso } from "@/lib/media/piloto-do-servidor";
import { lerParaRetomar, retomarEtapa } from "@/lib/media/vigia-das-etapas";
import { apagarMidias } from "@/lib/media/faxina";
import { lerPartesDe } from "@/lib/media/partes-servidor";
import { MENSAGEM_DA_JUNCAO_FALHOU, partesPorJuntar, urlDaParteValida, type JuntadoDaGravacao } from "@/lib/media/partes-da-gravacao";

/**
 * O worker avisa que juntou as partes da gravação (08/10/2026).
 *
 * Mesmo contrato do `audio-callback`: sem sessão, autenticado pela assinatura
 * sobre o corpo inteiro, porque o corpo traz a URL do vídeo que a esteira
 * inteira vai usar dali em diante.
 *
 * Deu certo: o vídeo juntado vira a gravação (`blobUrl`), a fala dele vira o
 * `audioUrl` (a transcrição ouve só o áudio, de qualquer tamanho), o registro
 * do juntado entra em `partes.juntado`, o vídeo volta para "uploaded" e a
 * transcrição é despachada. A tentativa gasta na junção é devolvida: juntar é
 * preparo, como separar o áudio, e não uma tentativa de transcrever.
 *
 * As partes saem do storage na mesma hora (quem troca o ponteiro apaga o
 * antigo, lib/media/faxina.ts): o vídeo juntado já tem tudo, na ordem.
 */
type Corpo = {
  ok: boolean;
  erro?: string;
  reiniciado?: boolean;
  juntado?: Omit<JuntadoDaGravacao, "em"> & { partes?: unknown };
  audio?: { url: string; bytes: number } | null;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: Corpo;
  try {
    corpo = JSON.parse(corpoCru) as Corpo;
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }

  // O worker reiniciou no meio da junção (deploy): não é falha da gravação.
  // O vigia retoma na hora (volta para "uploaded" e pede a junção de novo).
  if (corpo.reiniciado) {
    const linha = await lerParaRetomar(id);
    const feito = linha && linha.status === "juntando-partes" ? await retomarEtapa(linha, "reiniciado") : "ignorado";
    return NextResponse.json({ ok: true, reiniciado: feito });
  }

  const video = await prisma.videoJob.findUnique({ where: { id }, select: { id: true, projectId: true, blobUrl: true, status: true } });
  if (!video) return NextResponse.json({ ok: true, ignorado: "vídeo não existe mais" });
  const produzidos = [corpo.juntado?.url, corpo.audio?.url].filter((u): u is string => Boolean(u));

  // Só mexe em quem ainda espera a junção: aviso repetido do worker (ele
  // insiste quando a rede soluça) não pode desfazer uma esteira que já andou.
  if (!corpo.ok || !corpo.juntado?.url || !urlDaParteValida(corpo.juntado.url, video.projectId)) {
    await prisma.videoJob.updateMany({
      where: { id, status: "juntando-partes" },
      data: { status: "failed", startedAt: null, error: MENSAGEM_DA_JUNCAO_FALHOU },
    });
    console.error(`[juntar][${id}] worker falhou: ${corpo.erro ?? "sem o vídeo juntado"}`);
    if (produzidos.length) await apagarMidias(produzidos, "juntado-recusado").catch(() => 0);
    return NextResponse.json({ ok: true });
  }

  const partes = await lerPartesDe(id);
  const juntado: JuntadoDaGravacao = {
    url: corpo.juntado.url,
    bytes: Number(corpo.juntado.bytes) || 0,
    duracaoSeg: Number(corpo.juntado.duracaoSeg) || 0,
    somaSeg: Number(corpo.juntado.somaSeg) || 0,
    diferencaSeg: Number(corpo.juntado.diferencaSeg) || 0,
    largura: Number(corpo.juntado.largura) || 0,
    altura: Number(corpo.juntado.altura) || 0,
    orientacao: String(corpo.juntado.orientacao ?? ""),
    em: new Date().toISOString(),
  };
  const pegou =
    partes && partesPorJuntar(partes)
      ? await prisma.$executeRaw`
          UPDATE video_jobs SET
            "blobUrl" = ${juntado.url},
            "audioUrl" = ${corpo.audio?.url ?? null},
            status = 'uploaded',
            "startedAt" = NULL,
            attempts = GREATEST(attempts - 1, 0),
            error = NULL,
            partes = jsonb_set(partes, '{juntado}', ${JSON.stringify(juntado)}::jsonb, true),
            "updatedAt" = now()
          WHERE id = ${id} AND status = 'juntando-partes'
            AND COALESCE(partes -> 'juntado', 'null'::jsonb) = 'null'::jsonb`
      : 0;

  if (pegou === 0) {
    // Chegou tarde (outra rodada já juntou, ou o vídeo foi cancelado): o que
    // este aviso produziu não é de ninguém, e sai do storage.
    const orfaos = produzidos.filter((u) => u !== video.blobUrl);
    if (orfaos.length) await apagarMidias(orfaos, "juntado-atrasado").catch(() => 0);
    return NextResponse.json({ ok: true, ignorado: `vídeo em "${video.status}"` });
  }

  console.log(`[juntar][${id}] ${partes!.itens.length} partes juntadas: ${juntado.duracaoSeg}s (soma ${juntado.somaSeg}s), ${juntado.largura}x${juntado.altura}`);
  await apagarMidias(partes!.itens.map((p) => p.url), "partes-juntadas").catch((e) => console.error(`[juntar][${id}] apagar as partes:`, e));
  await despacharPasso(id, "transcrever");
  return NextResponse.json({ ok: true });
}
