export const dynamic = "force-dynamic";
// Uma chamada de texto e uma de imagem por corte, em paralelo. Com 7 cortes e a
// composição de capa levando até 90s, o teto precisa ser generoso.
export const maxDuration = 800;

import { after, NextRequest, NextResponse } from "next/server";
import { acessoAoVideo } from "@/lib/media/piloto-do-servidor";
import { prisma } from "@/lib/db/prisma";
import type { Trecho } from "@/lib/media/select-clips";
import { escreverTextoDoCorte } from "@/lib/media/capa-e-titulo";
import { capasDosCortesNoEstilo, comporCapaDoCorte, fotoDoVideoSePrecisar } from "@/lib/media/capa-do-corte";
import { pedirCapasDosCortesNoModelo, regraDaCapaPeloModelo } from "@/lib/media/capa-pelo-modelo-servidor";
import { ehEstiloSobMedida } from "@/lib/media/editor-do-curso/arte-pela-ia";
import { fundirNoTrecho } from "@/lib/media/revisao-do-corte";

/**
 * Título, descrição e capa de cada corte marcado.
 *
 * Roda depois que o cliente escolheu o que sobe, e não antes: gerar texto e
 * capa para corte que ele vai desmarcar é gastar dinheiro em trabalho que
 * ninguém pediu. Com 7 cortes, gerar para todos custaria quase o dobro de quem
 * publica 4.
 *
 * A capa sai NO ESTILO ESCOLHIDO (11/10, nunca trocar o estilo sozinho): com
 * modelo do curso, pelo template do modelo no worker (a segunda tentativa, se
 * ele recusar, pela IA no mesmo estilo); com a edição sob medida, pela IA no
 * estilo da opção, depois da resposta. A que não sair fica como falha técnica
 * com "Tentar de novo" (`midia.capaFalhou`). Só o projeto SEM estilo escolhido
 * compõe a capa pelo caminho de hoje (decisão do Bruno, opção A: composição
 * sobre o quadro real; quando falha, o corte fica com o quadro real puro).
 *
 * `{ indices: [i], soCapa: true }` é o "Tentar de novo" da capa de um corte:
 * só a capa, com o texto que o corte já tem, no mesmo estilo.
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
  const pedido = (await req.json().catch(() => ({}))) as { indices?: unknown; soCapa?: unknown };
  const soCapa = pedido.soCapa === true;
  const indicesPedidos = Array.isArray(pedido.indices) ? pedido.indices.filter((n): n is number => Number.isInteger(n) && (n as number) >= 0) : null;

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
  const regra = await regraDaCapaPeloModelo(video.projectId);

  // O "TENTAR DE NOVO" DA CAPA DE UM CORTE: só a capa, no mesmo estilo, com o texto que já existe.
  if (soCapa) {
    const alvos = (indicesPedidos ?? []).filter((i) => trechos[i]?.texto?.fraseDaCapa);
    if (!alvos.length) return NextResponse.json({ error: "Esse corte ainda não tem a frase da capa." }, { status: 400 });
    if (!regra) {
      const doVideo = await fotoDoVideoSePrecisar(video.id, video.projectId, alvos.map((i) => trechos[i])).catch(() => null);
      let comArte = 0;
      for (const i of alvos) {
        const url = await comporCapaDoCorte({ videoJobId: video.id, projectId: video.projectId, nicho: video.project.niche, indice: i, trecho: trechos[i], doVideo }).catch(() => null);
        if (url) {
          await fundirNoTrecho(id, i, {}, { capaArte: { url }, capaFalhou: null });
          comArte++;
        }
      }
      return NextResponse.json({ ok: comArte > 0, comArte, peloModelo: 0, erros: [] });
    }
    // A falha sai da tela na hora (o pedido está andando); a capa nova chega depois da resposta.
    for (const i of alvos) await fundirNoTrecho(id, i, {}, { capaFalhou: null });
    after(() => capasDosCortesNoEstilo(video.id, alvos, { modelo: regra.modelo }).then((r) => console.log(`[capas][${video.id}] tentar de novo: ${r.feitas} capa(s) no estilo ${regra.modelo}, ${r.falhas} falha(s)`)).catch((e) => console.error(`[capas][${video.id}] tentar de novo falhou:`, e)));
    return NextResponse.json({ ok: true, comArte: 0, peloModelo: alvos.length, erros: [] });
  }

  const alvos = trechos
    .map((t, i) => ({ t, i }))
    .filter(({ t, i }) => t.publicar !== false && (!indicesPedidos || indicesPedidos.includes(i)));

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
  const comTexto = textos.filter((r) => r.texto);

  // O texto entra antes da capa: a capa no estilo lê a frase do corte gravada.
  for (const r of comTexto) await fundirNoTrecho(id, r.i, { texto: r.texto });

  let peloEstilo: number[] = [];
  const comArte: number[] = [];
  if (regra && comTexto.length) {
    const indices = comTexto.map((r) => r.i);
    peloEstilo = indices;
    // A EDIÇÃO SOB MEDIDA: todas pela IA no estilo da opção, duas tentativas cada.
    let pelaIa = indices;
    let tentativas = 2;
    if (!ehEstiloSobMedida(regra.modelo)) {
      // O MODELO DO CURSO: o template do modelo, num lote só; as capas chegam pelo callback das artes.
      const noModelo = await pedirCapasDosCortesNoModelo({
        videoJobId: video.id,
        projectId: video.projectId,
        modelo: regra.modelo,
        cortes: comTexto.map((r) => ({ indice: r.i, frase: r.texto!.fraseDaCapa })),
      }).catch((e) => {
        console.error(`[capas][${video.id}] o pedido ao template do ${regra.modelo} falhou; segunda tentativa no mesmo estilo pela IA:`, e);
        return [] as number[];
      });
      // O que o template não aceitou: a segunda tentativa, no mesmo estilo, pela IA.
      pelaIa = indices.filter((i) => !noModelo.includes(i));
      tentativas = 1;
    }
    if (pelaIa.length) {
      // Depois da resposta: cada capa leva de 30 a 90 s, e a tela segue para a redação.
      after(() =>
        capasDosCortesNoEstilo(video.id, pelaIa, { modelo: regra.modelo, tentativas })
          .then((r) => console.log(`[capas][${video.id}] ${r.feitas} capa(s) no estilo ${regra.modelo}, ${r.falhas} falha(s)`))
          .catch((e) => console.error(`[capas][${video.id}] as capas no estilo falharam:`, e))
      );
    }
  } else if (comTexto.length) {
    // SEM ESTILO ESCOLHIDO: a composição pelo caminho de hoje, com a regra do quadro nítido.
    const doVideo = await fotoDoVideoSePrecisar(video.id, video.projectId, comTexto.map((r) => trechos[r.i])).catch(() => null);
    await Promise.all(
      comTexto.map(async (r) => {
        const url = await comporCapaDoCorte({
          videoJobId: video.id,
          projectId: video.projectId,
          nicho: video.project.niche,
          indice: r.i,
          trecho: { ...trechos[r.i], texto: r.texto! },
          doVideo,
        }).catch((e) => {
          console.error(`[capas][${video.id}] capa do corte ${r.i}:`, e);
          return null;
        });
        await fundirNoTrecho(id, r.i, {}, { capaArte: url ? { url } : null });
        if (url) comArte.push(r.i);
      })
    );
  }

  const falhas = textos.filter((r) => r.erro);

  return NextResponse.json({
    ok: comTexto.length > 0,
    comTexto: comTexto.length,
    comArte: comArte.length,
    // As capas que saem no estilo escolhido e chegam depois (callback do template ou a IA depois da resposta).
    peloModelo: peloEstilo.length,
    // A diferença entre texto e arte importa para a tela: capa que não compôs
    // não é falha do corte, é o quadro real seguindo sem tratamento.
    erros: falhas.map((f) => `corte ${f.i}: ${f.erro}`),
  });
}
