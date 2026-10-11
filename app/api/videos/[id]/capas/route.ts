export const dynamic = "force-dynamic";
// Uma chamada de texto e uma de imagem por corte, em paralelo. Com 7 cortes e a
// composição de capa levando até 90s, o teto precisa ser generoso.
export const maxDuration = 800;

import { NextRequest, NextResponse } from "next/server";
import { acessoAoVideo } from "@/lib/media/piloto-do-servidor";
import { prisma } from "@/lib/db/prisma";
import type { Trecho } from "@/lib/media/select-clips";
import { escreverTextoDoCorte } from "@/lib/media/capa-e-titulo";
import { comporCapaDoCorte, fotoDoVideoSePrecisar } from "@/lib/media/capa-do-corte";
import { pedirCapasDosCortesNoModelo, regraDaCapaPeloModelo } from "@/lib/media/capa-pelo-modelo-servidor";
import { fundirNoTrecho } from "@/lib/media/revisao-do-corte";

/**
 * Título, descrição e capa de cada corte marcado.
 *
 * Roda depois que o cliente escolheu o que sobe, e não antes: gerar texto e
 * capa para corte que ele vai desmarcar é gastar dinheiro em trabalho que
 * ninguém pediu. Com 7 cortes, gerar para todos custaria quase o dobro de quem
 * publica 4.
 *
 * A capa é COMPOSIÇÃO sobre o quadro real (decisão do Bruno, opção A). Quando a
 * composição falha, o corte fica com o quadro real puro, que é pior mas honesto:
 * arte genérica sem o cliente dentro é exatamente o que a decisão descartou.
 */

type TrechoComTudo = Trecho & {
  publicar?: boolean;
  midia?: {
    capa?: { url: string } | null;
    capaArte?: { url: string } | null;
    recorte?: { url: string } | null;
  } | null;
  texto?: {
    titulo: string;
    descricao: string;
    fraseDaCapa: string;
    expressao?: string;
    cenario?: string;
  };
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
  // Sessão do dono OU assinatura do piloto do servidor (ver piloto-do-servidor.ts).
  const acesso = await acessoAoVideo(req, id);
  if (!acesso) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await prisma.videoJob.findFirst({
    where: acesso.where,
    select: {
      id: true,
      status: true,
      clips: true,
      capaFonteUrl: true,
      projectId: true,
      project: { select: { niche: true, targetAudience: true, voice: true } },
    },
  });
  if (!video) return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });

  if (video.status !== "cut" && video.status !== "ready") {
    return NextResponse.json(
      { error: `Vídeo está em "${video.status}". Os textos saem depois do corte.` },
      { status: 409 }
    );
  }

  const trechos = (video.clips as unknown as TrechoComTudo[]) ?? [];
  const alvos = trechos
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.publicar !== false);

  if (!alvos.length) {
    return NextResponse.json(
      { error: "Nenhum corte está marcado. Marque pelo menos um." },
      { status: 400 }
    );
  }

  const contexto = {
    nicho: video.project.niche,
    publico: video.project.targetAudience,
    voz: video.project.voice,
  };

  // Os textos de cada corte primeiro (título, descrição, frase da capa).
  const textos = await Promise.all(
    alvos.map(async ({ t, i }) => {
      try {
        return { i, texto: await escreverTextoDoCorte(t, contexto, { projectId: video.projectId }), erro: null as string | null };
      } catch (err) {
        // Um corte que falha não derruba os outros, mesma regra do worker.
        return { i, texto: null, erro: err instanceof Error ? err.message : "falhou" };
      }
    })
  );

  // A CAPA PELO MODELO DO CURSO (11/10): o projeto com modelo faz as capas
  // dos cortes pelo template do modelo (lib/media/capa-pelo-modelo-servidor.ts),
  // num lote só; elas chegam pelo callback das artes. Sem modelo, ou com o
  // worker recusando, a capa é composta aqui, pelo caminho de hoje, já com a
  // regra do quadro nítido (lib/media/capa-do-corte.ts).
  const comTexto = textos.filter((r) => r.texto);
  let peloModelo: number[] = [];
  const regra = comTexto.length ? await regraDaCapaPeloModelo(video.projectId) : null;
  if (regra) {
    peloModelo = await pedirCapasDosCortesNoModelo({
      videoJobId: video.id,
      projectId: video.projectId,
      modelo: regra.modelo,
      cortes: comTexto.map((r) => ({ indice: r.i, frase: r.texto!.fraseDaCapa })),
    }).catch((e) => {
      console.error(`[capas][${video.id}] pedido ao modelo falhou, vai pelo caminho de hoje:`, e);
      return [] as number[];
    });
  }
  const aCompor = comTexto.filter((r) => !peloModelo.includes(r.i));
  const doVideo = aCompor.length
    ? await fotoDoVideoSePrecisar(video.id, video.projectId, aCompor.map((r) => trechos[r.i])).catch(() => null)
    : null;
  const resultados = await Promise.all(
    textos.map(async (r) => {
      if (!r.texto || peloModelo.includes(r.i)) return { ...r, capaArte: null as { url: string } | null };
      const url = await comporCapaDoCorte({
        videoJobId: video.id,
        projectId: video.projectId,
        nicho: video.project.niche,
        indice: r.i,
        trecho: { ...trechos[r.i], texto: r.texto },
        doVideo,
      }).catch((e) => {
        console.error(`[capas][${video.id}] capa do corte ${r.i}:`, e);
        return null;
      });
      return { ...r, capaArte: url ? { url } : null };
    })
  );

  // Funde só o que esta rota escreve (o texto e, no caminho de hoje, a capa),
  // corte a corte: o pedido ao modelo já gravou `capaNoModelo` nos cortes dele,
  // e regravar a lista inteira lida antes apagaria isso.
  for (const r of resultados) {
    if (!r.texto) continue;
    await fundirNoTrecho(id, r.i, { texto: r.texto }, peloModelo.includes(r.i) ? {} : { capaArte: r.capaArte });
  }

  const comArte = resultados.filter((r) => r.capaArte).length;
  const falhas = resultados.filter((r) => r.erro);

  return NextResponse.json({
    ok: comTexto.length > 0,
    comTexto: comTexto.length,
    comArte,
    // As capas que vão pelo template do modelo do curso e chegam pelo callback.
    peloModelo: peloModelo.length,
    // A diferença entre texto e arte importa para a tela: capa que não compôs
    // não é falha do corte, é o quadro real seguindo sem tratamento.
    erros: falhas.map((f) => `corte ${f.i}: ${f.erro}`),
  });
}
