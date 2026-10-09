export const dynamic = 'force-dynamic'

import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const runId = req.nextUrl.searchParams.get("runId");
  const projectId = req.nextUrl.searchParams.get("projectId");
  const weekStart = req.nextUrl.searchParams.get("weekStart"); // ISO date of Monday

  // Fetch specific run by ID
  if (runId) {
    const run = await prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        cards: {
          orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
        },
        project: { select: { userId: true } },
      },
    });
    // A campanha é de quem pode usar o projeto dela (08/10). Até aqui bastava
    // estar logado: qualquer conta lia a campanha inteira de outro cliente
    // pelo id, com pesquisa, textos e cards. Mesma regra do pipeline/runs/[id].
    if (!run || !(await podeUsarProjeto(userId, { id: run.projectId, userId: run.project.userId }))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { project: _dono, ...resto } = run;
    void _dono;
    return NextResponse.json({ ...resto, logs: Array.isArray(run.logs) ? run.logs : [] });
  }

  if (!projectId) return NextResponse.json({ error: "runId or projectId required" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !(await podeUsarProjeto(userId, project))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If weekStart provided, return all cards for that week
  if (weekStart) {
    const weekStartDate = new Date(weekStart + "T00:00:00.000Z");
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6); // always UTC to avoid DST/tz issues
    weekEndDate.setUTCHours(23, 59, 59, 999);

    const cards = await prisma.campaignCard.findMany({
      where: {
        projectId,
        scheduledDate: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
        run: { archived: false },
        NOT: { status: "archived" },
      },
      orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
    });

    const weekRun = await prisma.pipelineRun.findFirst({
      where: {
        projectId,
        archived: false,
        weekStart: {
          gte: weekStartDate,
          lte: new Date(weekStartDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Os posts da semana vao junto: e deles que o quadro deriva o estado do
    // card do Paulo (publicado, agendado, rascunho, falhou). Ate 10/09 o card
    // mostrava um texto gravado na geracao, que nao mudava nunca.
    const posts = await prisma.post.findMany({
      where: {
        projectId,
        status: { not: "cancelled" },
        OR: [
          { scheduledAt: { gte: weekStartDate, lte: weekEndDate } },
          { publishedAt: { gte: weekStartDate, lte: weekEndDate } },
          { scheduledAt: null, run: { weekStart: { gte: weekStartDate, lte: weekEndDate } } },
        ],
      },
      select: {
        id: true, platform: true, mediaType: true, status: true, scheduledAt: true,
        publishedAt: true, externalUrl: true, socialAccountId: true, metadata: true, dayOfWeek: true, runId: true,
        // A arte (05/10): o quadro lê a espera da identidade visual com ela.
        imageUrl: true,
      },
    });
    // OS PLANOS DE VÍDEO QUE TOCAM ESTA SEMANA (05/10): o run de vídeo guarda o
    // plano congelado (config.semana), e é dele que o quadro tira os dias de
    // "Vídeo curto" para guardar o lugar do corte que ainda não chegou. O plano
    // começa no dia do envio e atravessa para a semana seguinte, então entra
    // também o run que começou na semana anterior.
    const runsDoVideo = await prisma.pipelineRun.findMany({
      where: {
        projectId,
        archived: false,
        weekStart: {
          gte: new Date(weekStartDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(weekStartDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startedAt: "desc" },
      select: { id: true, weekStart: true, config: true },
    });
    const planosDoVideo = runsDoVideo.flatMap((r) => {
      const videoJobId = (r.config as { videoJobId?: unknown } | null)?.videoJobId;
      if (typeof videoJobId !== "string") return [];
      return [{ runId: r.id, videoJobId, weekStart: r.weekStart?.toISOString() ?? null, config: r.config }];
    });

    /**
     * AS CAMPANHAS QUE TOCAM ESTA SEMANA, para o quadro mostrar a PEÇA PEDIDA
     * desde o minuto do pedido (08/10, lib/pipeline/pecas-pedidas.ts). O
     * `weekRun` acima só acha a campanha cujo início cai na segunda; a que
     * começa na quinta, a quinzenal da semana passada e o dia empurrado para
     * a semana seguinte ficavam invisíveis até o card do redator nascer. Vão
     * com o config, o log e as ENTREGAS (os posts de cada run, de qualquer
     * status), que é o que diz se a peça já virou card de verdade.
     */
    const runsDaSemana = await prisma.pipelineRun.findMany({
      where: {
        projectId,
        archived: false,
        status: { not: "cancelled" },
        weekStart: {
          gte: new Date(weekStartDate.getTime() - 21 * 24 * 60 * 60 * 1000),
          lte: weekEndDate,
        },
      },
      orderBy: { startedAt: "desc" },
      take: 12,
      select: { id: true, status: true, topic: true, config: true, logs: true },
    });
    const entregasDaSemana = runsDaSemana.length
      ? await prisma.post.findMany({
          where: { runId: { in: runsDaSemana.map((r) => r.id) } },
          select: { runId: true, dayOfWeek: true, scheduledAt: true },
        })
      : [];

    return NextResponse.json({ cards, run: weekRun, posts, planosDoVideo, runsDaSemana, entregasDaSemana, fuso: project.timezone ?? null });
  }

  const latestRun = await prisma.pipelineRun.findFirst({
    where: { projectId, archived: false },
    orderBy: { startedAt: "desc" },
    include: {
      cards: {
        orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return NextResponse.json({ run: latestRun });
}
