import { prisma } from "@/lib/db/prisma";
import type { Trecho } from "@/lib/media/select-clips";
import { podeTerCardDeCorte } from "@/lib/media/decisao-dos-cortes";
import { lerDecisaoDosCortes } from "@/lib/media/decisao-dos-cortes-banco";
import { destinoPorId } from "@/lib/media/destinos";
import { diaDoTrecho, diaDoTrechoNoPlano } from "@/lib/media/quadro-do-video";
import { dataDoDia, DESTINO_DE_CORTE_DA_REDE, diaDoCorte, diasDeVideoCurto, planoDoRun } from "@/lib/media/semana-do-video";
import { descricaoDoCorte, eloDaPeca, nomeDoCanal, perfisDoCliente } from "@/lib/media/elo-da-campanha";
import { lerLinks } from "@/lib/projeto/links-do-cliente";
import { tituloNoYoutube } from "@/lib/analytics/tipos-do-inventario";
import { lerInventario } from "@/lib/analytics/inventario-das-redes";
import { limparTextoGerado } from "@/lib/media/elo-na-publicacao";
import { lastroDoVideo } from "@/lib/media/lastro-do-video";

/**
 * Faz o Gestor de Conteúdo ESPELHAR a seleção da aba Vídeo.
 *
 * Achado do Bruno em 01/09: "selecionei somente um corte, mas no Gestor ficam
 * todos, inclusive o que não selecionei; as telas não se conversam". A causa:
 * o piloto agenda com tudo marcado (o padrão), e desmarcar depois não removia
 * nada. Esta função reconcilia nas duas direções, com uma regra de segurança:
 * só cria o que está pendente e só remove card pendente com post em rascunho.
 * O que o cliente já aprovou ou publicou nunca é tocado.
 *
 * Também mantém a ESTEIRA: todo dia com corte no quadro ganha o card da Vera
 * (prévia por rede) e o do Paulo (publicação), que era o fim de linha que
 * faltava ("não passa para os agentes Vera nem Paulo").
 *
 * DESDE 30/09 O PLANO MANDA NO DIA E NA REDE DOS CORTES. Com dia de "Vídeo
 * curto" no plano congelado no run, o primeiro corte aprovado vai no
 * primeiro desses dias, nas redes marcadas nele, o segundo no segundo, e
 * assim por diante; corte a mais volta a esses mesmos dias, em rodízio,
 * porque o cliente disse em que dias quer corte e nenhum corte pode cair num
 * dia que ele deixou sem post. Sem dia de vídeo curto vale o jeito de antes
 * (as redes marcadas em cada corte), espalhado pelos dias do plano.
 */

type TrechoDoQuadro = Trecho & {
  publicar?: boolean;
  destinos?: string[];
  /**
   * Destinos que o cliente acrescentou a ESTE corte no card do dia (30/09),
   * além das redes do plano. Campo à parte, e não `destinos`, porque com dia
   * de vídeo curto no plano `destinos` é ignorado (o plano manda), e a rede
   * marcada no card sumiria na sincronização seguinte.
   */
  destinosDoCard?: string[];
  posts?: { linkedin?: string; x?: string; instagram?: string };
  texto?: { titulo?: string; descricao?: string };
  midia?: { vertical?: { url: string } | null } | null;
};

function legendaDoDestino(t: TrechoDoQuadro, plataforma: string): string {
  const generica =
    [t.texto?.titulo, t.texto?.descricao].filter(Boolean).join("\n\n") || t.titulo || "";
  if (plataforma === "twitter") return t.posts?.x || generica;
  if (plataforma === "linkedin") return t.posts?.linkedin || generica;
  // TikTok usa a legenda do Instagram: é o mesmo registro (curta, gancho na
  // primeira linha, hashtags), e o redator do vídeo não escreve uma própria.
  if (plataforma === "instagram" || plataforma === "facebook" || plataforma === "tiktok") {
    return t.posts?.instagram || generica;
  }
  return generica;
}

export async function sincronizarQuadroDoVideo(videoJobId: string): Promise<void> {
  const video = await prisma.videoJob.findUnique({
    where: { id: videoJobId },
    select: {
      id: true,
      projectId: true,
      clips: true,
      durationSec: true,
      originalName: true,
      radar: true,
      // A fala: a legenda do corte só leva número que está nela (08/10).
      transcript: true,
      // O título do completo, os links e as redes do cliente: a descrição de
      // cada corte convida para o completo e fecha com o bloco de links (05/10).
      project: {
        select: {
          name: true,
          config: true,
          socialAccounts: { where: { isActive: true }, select: { platform: true, username: true, displayName: true } },
        },
      },
    },
  });
  if (!video) return;

  const run = await prisma.pipelineRun.findFirst({
    where: {
      projectId: video.projectId,
      archived: false,
      config: { path: ["videoJobId"], equals: video.id },
    },
    select: { id: true, weekStart: true, config: true },
  });
  if (!run) return; // ainda não foi ao quadro; nada a espelhar

  // ZERO CORTES APROVADO É ZERO CORTES (06/10): com "só o completo" gravado
  // no roteiro, nenhum trecho pede card de corte (e o card pendente que
  // tenha nascido sem pedido sai na remoção abaixo, junto do rascunho).
  const decisao = await lerDecisaoDosCortes(video.id).catch(() => null);
  const trechos = podeTerCardDeCorte(decisao) ? ((video.clips as unknown as TrechoDoQuadro[]) ?? []) : [];
  const plano = planoDoRun(run.config);
  const alvo = { inicio: plano.inicio, weekStart: run.weekStart };
  const diasDeCorte = diasDeVideoCurto(plano);
  // A posição de cada corte aprovado (0, 1, 2...), que escolhe o dia de vídeo
  // curto dele. A conta mora em `diaDoCorte` (08/10): a montagem usa a mesma
  // para achar o estilo de edição escolhido para o dia do corte.
  const diaDoPlano = (indice: number) => diaDoCorte(trechos, indice, diasDeCorte);

  const cards = await prisma.campaignCard.findMany({
    where: { runId: run.id, cardType: "video_clip" },
    select: { id: true, status: true, postId: true, dayOfWeek: true, metadata: true },
  });

  // O vídeo completo que os cortes chamam (05/10). DESDE 08/10 o convite só
  // entra com o completo NO AR (status publicado e link): título real e link.
  // Antes disso o corte nasce sem convite, com `metadata.elo`, e a publicação
  // põe a chamada quando o completo estiver publicado
  // (lib/media/elo-na-publicacao.ts). Nada de "no meu canal" antes da hora.
  const postDoCompleto = await prisma.post.findFirst({
    where: {
      projectId: video.projectId,
      platform: "youtube",
      status: "published",
      externalUrl: { not: null },
      AND: [{ metadata: { path: ["videoJobId"], equals: video.id } }, { metadata: { path: ["gravacaoCompleta"], equals: true } }],
    },
    select: { content: true, externalUrl: true },
  });
  const completo = {
    titulo: tituloNoYoutube(postDoCompleto?.content),
    url: postDoCompleto?.externalUrl ?? null,
    canal: nomeDoCanal(video.project?.socialAccounts ?? [], video.project?.config),
    links: lerLinks(video.project?.config),
    contas: video.project?.socialAccounts ?? [],
    // O @ do canal no YouTube que o cliente escreveu (06/10).
    config: video.project?.config,
  };

  // O que a seleção PEDE: um card por (trecho marcado x destino de vídeo).
  // Com dia de vídeo curto no plano, os destinos são as redes daquele dia.
  const esperados = new Map<string, { t: TrechoDoQuadro; indice: number; destinoId: string }>();
  trechos.forEach((t, indice) => {
    if (t.publicar === false || !t.midia?.vertical) return;
    const doPlano = diaDoPlano(indice);
    const doDia = doPlano ? doPlano.redes.map((r) => DESTINO_DE_CORTE_DA_REDE[r]) : t.destinos ?? [];
    // As redes do dia MAIS as que o cliente acrescentou a este corte no card
    // do dia (30/09): sem somar, o LinkedIn marcado lá seria apagado aqui, na
    // próxima sincronização, por não estar no plano.
    const destinos = [...new Set([...doDia, ...(t.destinosDoCard ?? [])])];
    for (const d of destinos) {
      const destino = destinoPorId(d);
      if (destino?.publicaVideo) esperados.set(`${indice}:${d}`, { t, indice, destinoId: d });
    }
  });

  // O que o quadro TEM (cards de corte; o completo fica de fora).
  const existentes = new Map<string, (typeof cards)[number]>();
  for (const c of cards) {
    const meta = c.metadata as { trechoIndice?: number; destino?: string; completo?: boolean } | null;
    if (meta?.completo) continue;
    if (typeof meta?.trechoIndice !== "number" || !meta.destino) continue;
    existentes.set(`${meta.trechoIndice}:${meta.destino}`, c);
  }

  // Remove o que o cliente desmarcou (só pendente + rascunho).
  for (const [chave, card] of existentes) {
    if (esperados.has(chave) || card.status !== "pending") continue;
    if (card.postId) {
      const post = await prisma.post.findUnique({
        where: { id: card.postId },
        select: { status: true },
      });
      if (post && post.status !== "draft") continue;
    }
    await prisma.campaignCard.delete({ where: { id: card.id } });
    if (card.postId) {
      await prisma.post.deleteMany({ where: { id: card.postId, status: "draft" } });
    }
  }

  // A GUARDA DAS LEGENDAS (08/10), lida só quando há corte novo para criar:
  // o inventário do que está no ar, os links do próprio cliente e a fala.
  let guarda: { inventario: Awaited<ReturnType<typeof lerInventario>>; permitidos: string[]; lastro: string } | null = null;
  const guardaDasLegendas = async () => {
    guarda ??= {
      inventario: await lerInventario(video.projectId).catch(() => []),
      permitidos: [
        ...completo.links.map((l) => l.url),
        ...perfisDoCliente(completo.contas, completo.config).map((p) => p.url).filter((u): u is string => Boolean(u)),
      ],
      lastro: lastroDoVideo({ transcricao: (video.transcript as { text?: string } | null)?.text ?? "", material: [video.project?.name] }),
    };
    return guarda;
  };

  // Cria o que o cliente marcou depois do agendamento.
  for (const [chave, pedido] of esperados) {
    if (existentes.has(chave)) continue;
    const destino = destinoPorId(pedido.destinoId)!;
    const irmao = [...existentes.values()].find((c) => {
      const m = c.metadata as { trechoIndice?: number } | null;
      return m?.trechoIndice === pedido.indice;
    });
    // O mesmo dia do irmão (outro destino do mesmo corte), ou o dia que o
    // espalhamento uniforme dá a este corte. Desde 04/09 os cards do Vitor
    // nascem AQUI (o agendar só abre o quadro e chama a sincronização), então
    // esta conta é a que decide a semana inteira, e não só o corte marcado
    // depois. Desde 30/09: o dia de vídeo curto do plano, quando há; senão o
    // espalhamento dentro dos dias do plano (ou da semana, em run antigo).
    const dayOfWeek =
      irmao?.dayOfWeek ??
      diaDoPlano(pedido.indice)?.dia ??
      (plano.inicio ? diaDoTrechoNoPlano(trechos, pedido.indice, plano.inicio) : diaDoTrecho(trechos, pedido.indice));
    const data = dataDoDia(alvo, dayOfWeek);
    // A legenda do redator (passada pela guarda do conteúdo próprio e pelo
    // lastro, 08/10), o convite ao completo (só com ele no ar) e o bloco de
    // links da rede.
    const g = await guardaDasLegendas();
    const legendaConferida = await limparTextoGerado({
      texto: legendaDoDestino(pedido.t, destino.plataforma),
      rede: destino.plataforma,
      dia: dayOfWeek,
      projectId: video.projectId,
      runId: run.id,
      inventario: g.inventario,
      permitidos: g.permitidos,
      lastro: g.lastro,
      pecaEhVideo: true,
    });
    const legenda = descricaoDoCorte({ ...completo, rede: destino.plataforma, legenda: legendaConferida });
    const post = await prisma.post.create({
      data: {
        projectId: video.projectId,
        platform: destino.plataforma,
        content: legenda,
        mediaType: "video",
        imageUrl: pedido.t.midia!.vertical!.url,
        status: "draft",
        dayOfWeek,
        scheduledAt: data,
        runId: run.id,
        metadata: {
          origem: "video",
          videoJobId: video.id,
          trechoIndice: pedido.indice,
          destino: destino.id,
          // Quem o corte chama: o completo, só quando ele estiver no ar (08/10).
          elo: eloDaPeca({ videoJobId: video.id, runId: run.id, dia: dayOfWeek, pecas: [], corte: true }),
        },
      },
      select: { id: true },
    });
    await prisma.campaignCard.create({
      data: {
        runId: run.id,
        projectId: video.projectId,
        agentId: "vitor-video",
        agentName: "Vitor Vídeo",
        dayOfWeek,
        scheduledDate: data,
        cardType: "video_clip",
        mediaType: "video",
        content: legenda,
        mediaUrl: `/api/videos/${video.id}/midia?trecho=${pedido.indice}&tipo=vertical`,
        status: "pending",
        postId: post.id,
        metadata: {
          destino: destino.id,
          destinoRotulo: destino.rotulo,
          titulo: pedido.t.texto?.titulo ?? pedido.t.titulo,
          videoJobId: video.id,
          trechoIndice: pedido.indice,
          thumb: `/api/videos/${video.id}/midia?trecho=${pedido.indice}&tipo=capa-arte`,
        },
      },
    });
  }

  // ── A esteira: Vera e Paulo em todo dia que tem conteúdo do vídeo ──
  const cardsAtuais = await prisma.campaignCard.findMany({
    where: { runId: run.id },
    select: { id: true, agentId: true, dayOfWeek: true, status: true, cardType: true, postId: true },
  });
  // O carrossel da Diana só conta quando virou post (mídia gerada); antes
  // disso é só um briefing e não há nada para a Vera revisar nem o Paulo publicar.
  const diasComConteudo = new Set(
    cardsAtuais
      .filter(
        (c) =>
          c.agentId === "vitor-video" ||
          c.cardType === "post_linkedin" ||
          c.cardType === "post_twitter" ||
          (c.cardType === "media" && c.postId)
      )
      .map((c) => c.dayOfWeek)
  );
  const esteira = [
    {
      agentId: "vera-veredito",
      agentName: "Vera Veredito",
      cardType: "preview",
      hora: 13,
      // Texto de espera: `revisarDiasDoVideo` troca pelo veredito de verdade.
      content:
        "Vera está revisando os posts deste dia. O veredito, com o que está bom e o que precisa mudar, aparece aqui em instantes.",
    },
    {
      agentId: "paulo-publicador",
      agentName: "Paulo Publicador",
      cardType: "publish",
      hora: 14,
      content: "Publicação do dia: revise a prévia de cada rede e publique daqui.",
    },
  ];
  for (const dia of diasComConteudo) {
    for (const e of esteira) {
      const ja = cardsAtuais.find((c) => c.agentId === e.agentId && c.dayOfWeek === dia);
      if (ja) continue;
      const data = dataDoDia(alvo, dia, e.hora);
      await prisma.campaignCard.create({
        data: {
          runId: run.id,
          projectId: video.projectId,
          agentId: e.agentId,
          agentName: e.agentName,
          dayOfWeek: dia,
          scheduledDate: data,
          cardType: e.cardType,
          mediaType: "text",
          content: e.content,
          status: "pending",
          metadata: { origem: "video", videoJobId: video.id },
        },
      });
    }
  }
  // Vera/Paulo de dia que ficou vazio saem (só pendentes).
  for (const c of cardsAtuais) {
    if ((c.agentId === "vera-veredito" || c.agentId === "paulo-publicador") &&
        c.status === "pending" && !diasComConteudo.has(c.dayOfWeek)) {
      await prisma.campaignCard.delete({ where: { id: c.id } }).catch(() => {});
    }
  }
}
