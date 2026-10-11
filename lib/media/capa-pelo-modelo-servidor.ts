import { prisma } from "@/lib/db/prisma";
import {
  capaAindaEspera,
  capasDoCallback,
  chaveDoLoteDaCapa,
  pecasDaCapaDoCompleto,
  pecasDasCapasDosCortes,
  PRAZO_DA_CAPA_NO_MODELO_MS,
  type CapaPendente,
  type FotoDaCapa,
  type RetornoDaCapa,
} from "@/lib/media/capa-pelo-modelo";
import type { CapasDoCompleto, ExpressaoDaCapa, OpcaoDeCapa } from "@/lib/media/estilos-de-capa";
import type { CallbackDaArte } from "@/lib/media/editor-do-curso/arte-pelo-modelo";

/**
 * O LADO DO SERVIDOR DAS CAPAS PELO MODELO DO CURSO (11/10/2026). As decisões
 * puras estão em capa-pelo-modelo.ts; aqui, a foto da capa, o pedido ao
 * worker, o callback nas capas e o vigia do lote que não voltou.
 */

export type { FotoDaCapa } from "@/lib/media/capa-pelo-modelo";

/** O registro da capa sem as marcas de tentativa que falhou ("reserva", "templateFalhou"): a capa saiu no estilo. */
function semReserva<T extends { reserva?: unknown; templateFalhou?: unknown }>(p: T): Omit<T, "reserva" | "templateFalhou"> {
  const { reserva: _r, templateFalhou: _t, ...resto } = p;
  void _r;
  void _t;
  return resto;
}

/**
 * A FOTO DA CAPA: o quadro NÍTIDO da gravação (o crivo do worker, com o
 * destino da capa); sem quadro bom, a foto da pessoa da Biblioteca de
 * materiais; sem as duas, nenhuma (a capa sai só com a tipografia). Nunca o
 * quadro-fonte antigo nem o quadro fixo do trecho, que não passaram por crivo
 * nenhum.
 */
export async function fotoDaCapa(videoJobId: string, projectId: string, alvo: { largura: number; altura: number }): Promise<FotoDaCapa> {
  const { quadrosNitidosDoVideo } = await import("@/lib/media/quadros-nitidos");
  const [quadro] = await quadrosNitidosDoVideo(videoJobId, { quantos: 1, alvo, chave: `cortes/${videoJobId}/capa-nitida` });
  if (quadro) return { url: quadro.url, recorteUrl: quadro.recorteUrl ?? null, origem: "quadro" };
  try {
    const { materiaisDaMarca } = await import("@/lib/materiais/escolha");
    const { materiaisDaPessoa, menosUsado } = await import("@/lib/media/referencia-da-pessoa");
    const foto = menosUsado(materiaisDaPessoa(await materiaisDaMarca(projectId)));
    if (foto?.url) return { url: foto.url, recorteUrl: null, origem: "biblioteca" };
  } catch {
    // sem Biblioteca legível: segue sem foto
  }
  return { url: null, recorteUrl: null, origem: "nenhuma" };
}

/** A regra do projeto para as capas: a mesma das artes (modelo do curso, trava ligada, sem estilo próprio). */
export async function regraDaCapaPeloModelo(projectId: string): Promise<{ modelo: string } | null> {
  const { regraDaArtePeloModelo } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
  const r = await regraDaArtePeloModelo(projectId).catch(() => null);
  return r ? { modelo: r.modelo } : null;
}

/**
 * A CAPA DO COMPLETO PELO MODELO: as duas frases como duas peças "capa" em
 * 16:9, a pessoa do quadro nítido ao lado (ou a da Biblioteca, ou nenhuma) e o
 * logo. Devolve o `noModelo` para gravar nas capas, ou null quando o worker
 * não aceitou (quem chama faz a segunda tentativa no mesmo estilo, pela IA).
 */
export async function pedirCapaDoCompletoNoModelo(o: {
  videoJobId: string;
  projectId: string;
  modelo: string;
  frases: Array<{ frase: string; expressao: ExpressaoDaCapa }>;
}): Promise<NonNullable<CapasDoCompleto["noModelo"]> | null> {
  const { baseDoPedido, enviarLoteAoWorker } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
  const pecas = pecasDaCapaDoCompleto(o.frases.map((f) => f.frase));
  const [foto, base] = await Promise.all([
    fotoDaCapa(o.videoJobId, o.projectId, { largura: 1280, altura: 720 }),
    baseDoPedido(o.projectId, null),
  ]);
  const chave = chaveDoLoteDaCapa("completo", o.videoJobId);
  // A capa deitada desenha o texto sem pessoa no template; a pessoa entra ao lado, recortada no worker.
  const r = await enviarLoteAoWorker({
    chave,
    projectId: o.projectId,
    runId: null,
    modelo: o.modelo,
    pecas,
    base: { ...base, fotoUrl: null, fotos: [] },
    pessoaUrl: foto.url,
    retorno: { alvo: "completo", videoJobId: o.videoJobId },
  });
  if (!r.ok) {
    console.warn(`[capa-no-modelo][${o.videoJobId}] o worker não aceitou a capa do completo; segunda tentativa no mesmo estilo, pela IA: ${r.erro}`);
    return null;
  }
  console.log(`[capa-no-modelo][${o.videoJobId}] capa do completo no ${o.modelo} (lote ${chave}, foto: ${foto.origem})`);
  return { lote: chave, pendente: true, desde: new Date().toISOString(), modelo: o.modelo, foto: foto.origem, frases: o.frases.slice(0, pecas.length) };
}

/**
 * AS CAPAS DOS CORTES PELO MODELO: uma peça "capa" 9:16 por corte, com a frase
 * da capa, o quadro nítido onde o modelo põe a pessoa e o logo. Grava em cada
 * corte `midia.capaNoModelo` (o lote e a peça). Devolve os cortes que foram,
 * ou [] quando o worker não aceitou (quem chama faz a segunda tentativa no mesmo estilo, pela IA).
 */
export async function pedirCapasDosCortesNoModelo(o: {
  videoJobId: string;
  projectId: string;
  modelo: string;
  cortes: Array<{ indice: number; frase: string | null | undefined }>;
}): Promise<number[]> {
  const { pecas, cortes } = pecasDasCapasDosCortes(o.cortes);
  if (!pecas.length) return [];
  const { baseDoPedido, enviarLoteAoWorker } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo-servidor");
  const [foto, base] = await Promise.all([fotoDaCapa(o.videoJobId, o.projectId, { largura: 1080, altura: 1920 }), baseDoPedido(o.projectId, null)]);
  const chave = chaveDoLoteDaCapa("cortes", o.videoJobId);
  const r = await enviarLoteAoWorker({
    chave,
    projectId: o.projectId,
    runId: null,
    modelo: o.modelo,
    pecas,
    base: { ...base, fotoUrl: foto.url, fotos: [] },
    retorno: { alvo: "cortes", videoJobId: o.videoJobId, cortes },
  });
  if (!r.ok) {
    console.warn(`[capa-no-modelo][${o.videoJobId}] o worker não aceitou as capas dos cortes; segunda tentativa no mesmo estilo, pela IA: ${r.erro}`);
    return [];
  }
  const { fundirNoTrecho } = await import("@/lib/media/revisao-do-corte");
  const desde = new Date().toISOString();
  for (const [k, indice] of cortes.entries()) {
    const pendente: CapaPendente & { peca: number } = { lote: chave, pendente: true, desde, modelo: o.modelo, foto: foto.origem, peca: k + 1 };
    await fundirNoTrecho(o.videoJobId, indice, {}, { capaNoModelo: pendente }).catch(() => {});
  }
  console.log(`[capa-no-modelo][${o.videoJobId}] ${cortes.length} capa(s) de corte no ${o.modelo} (lote ${chave}, foto: ${foto.origem})`);
  return cortes;
}

/**
 * O CALLBACK DAS CAPAS: no completo, as opções novas entram (as fotos da
 * Biblioteca que o cliente pôs ficam) e a primeira vai para o card e o post do
 * YouTube, se o cliente não tinha escolhido uma foto; nos cortes, cada capa vai
 * para o seu corte. O que faltou volta em `reserva` para a segunda tentativa no mesmo estilo.
 */
export async function concluirCapaNoModelo(cb: CallbackDaArte, ret: RetornoDaCapa): Promise<{ reserva: { completo: boolean; cortes: number[] }; motivo: string | null }> {
  const video = await prisma.videoJob.findUnique({ where: { id: ret.videoJobId }, select: { id: true, projectId: true, capas: true, clips: true } });
  if (!video) return { reserva: { completo: false, cortes: [] }, motivo: null };
  const agora = new Date().toISOString();
  if (ret.alvo === "completo") {
    const capas = video.capas as CapasDoCompleto | null;
    const pend = capas?.noModelo;
    // Só o lote que a capa ainda espera: um callback velho não troca as opções de um pedido mais novo.
    if (!capas || !pend || pend.lote !== ret.lote || !pend.pendente) return { reserva: { completo: false, cortes: [] }, motivo: null };
    const { urls, faltam } = cb.ok ? capasDoCallback(cb.pecas, ret, pend.frases.length) : { urls: [], faltam: [1] };
    if (!urls.length || faltam.length === pend.frases.length) {
      const motivo = cb.erro ?? "o worker não devolveu a capa";
      await prisma.videoJob.update({ where: { id: video.id }, data: { capas: { ...capas, noModelo: { ...pend, pendente: false, templateFalhou: motivo.slice(0, 300) } } as never } });
      return { reserva: { completo: true, cortes: [] }, motivo };
    }
    const novas = cb.pecas
      .filter((p) => p.formato === "16:9")
      .sort((a, b) => a.indice - b.indice)
      .map((p): OpcaoDeCapa => ({ url: p.url, frase: pend.frases[p.indice - 1]?.frase ?? "", expressao: pend.frases[p.indice - 1]?.expressao ?? "confiante" }));
    const daBiblioteca = capas.opcoes.filter((op) => op.materialId);
    const fotoEscolhida = capas.opcoes[capas.escolhida]?.materialId;
    const opcoes = [...novas, ...daBiblioteca];
    const escolhida = fotoEscolhida ? Math.max(0, opcoes.findIndex((op) => op.materialId === fotoEscolhida)) : 0;
    const atualizadas: CapasDoCompleto = { ...capas, opcoes, escolhida, geradaEm: agora, noModelo: { ...semReserva(pend), pendente: false, feitoEm: agora, caminho: "template" }, falha: null };
    await prisma.videoJob.update({ where: { id: video.id }, data: { capas: atualizadas as never } });
    if (!fotoEscolhida) {
      const { apontarCapaDoCompleto } = await import("@/lib/media/capas-do-completo");
      await apontarCapaDoCompleto(video.id, video.projectId, opcoes[0].url).catch((e) => console.error(`[capa-no-modelo][${video.id}] apontar a capa falhou:`, e));
    }
    return { reserva: { completo: false, cortes: [] }, motivo: null };
  }
  // Os cortes: cada um que ainda espera este lote recebe a sua capa; o que faltou vai à segunda tentativa no mesmo estilo.
  const clips = (video.clips as Array<{ midia?: { capaNoModelo?: CapaPendente & { peca?: number } } | null }> | null) ?? [];
  const esperando = ret.cortes.filter((i) => clips[i]?.midia?.capaNoModelo?.lote === ret.lote && clips[i]?.midia?.capaNoModelo?.pendente);
  const { porCorte } = cb.ok ? capasDoCallback(cb.pecas, ret, ret.cortes.length) : { porCorte: new Map<number, string>() };
  const { fundirNoTrecho } = await import("@/lib/media/revisao-do-corte");
  const faltaram: number[] = [];
  for (const i of esperando) {
    const pend = clips[i]!.midia!.capaNoModelo!;
    const url = porCorte.get(i);
    if (!url) {
      faltaram.push(i);
      await fundirNoTrecho(video.id, i, {}, { capaNoModelo: { ...pend, pendente: false, templateFalhou: (cb.erro ?? "faltou a capa deste corte").slice(0, 300) } }).catch(() => {});
      continue;
    }
    await fundirNoTrecho(video.id, i, {}, { capaArte: { url }, capaNoModelo: { ...semReserva(pend), pendente: false, feitoEm: agora, caminho: "template" }, capaFalhou: null }).catch(() => {});
  }
  return { reserva: { completo: false, cortes: faltaram }, motivo: faltaram.length ? cb.erro ?? "faltaram capas" : null };
}

/**
 * A SEGUNDA TENTATIVA NO MESMO ESTILO (11/10, nunca trocar o estilo sozinho):
 * o que o template do modelo não entregou sai pela IA de imagem com o prompt
 * de estilo do MESMO modelo (uma tentativa: o template foi a primeira). Não
 * saiu: a capa para como falha técnica com "Tentar de novo". Nunca o caminho de
 * antes. Roda depois da resposta do callback (ou no vigia).
 */
export async function reservaDasCapas(videoJobId: string, r: { completo: boolean; cortes: number[] }): Promise<void> {
  if (r.completo) {
    const { gerarCapasDoCompleto } = await import("@/lib/media/capas-do-completo");
    await gerarCapasDoCompleto(videoJobId, { segundaTentativa: true }).catch((e) => console.error(`[capa-no-modelo][${videoJobId}] a segunda tentativa da capa do completo falhou:`, e));
  }
  if (r.cortes.length) {
    const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { projectId: true } });
    const regra = video ? await regraDaCapaPeloModelo(video.projectId) : null;
    if (!regra) {
      console.warn(`[capa-no-modelo][${videoJobId}] o projeto não tem mais estilo escolhido; as capas dos cortes ${r.cortes.join(",")} ficam como estavam`);
      return;
    }
    const { capasDosCortesNoEstilo } = await import("@/lib/media/capa-do-corte");
    await capasDosCortesNoEstilo(videoJobId, r.cortes, { modelo: regra.modelo, tentativas: 1 }).catch((e) => console.error(`[capa-no-modelo][${videoJobId}] a segunda tentativa das capas dos cortes falhou:`, e));
  }
}

/**
 * O VIGIA DAS CAPAS QUE NÃO VOLTARAM (cron da fila): pedido de capa pendente
 * além do prazo. Antes de desistir, pergunta ao worker; rodando ou na fila, o
 * prazo vale de novo a partir de agora; fora do worker, vai à segunda tentativa no mesmo estilo.
 */
export async function vigiarCapasNoModelo(o: { maximo?: number } = {}): Promise<{ olhados: number; reserva: number }> {
  const { aindaEsperaOWorker } = await import("@/lib/media/montagem-no-worker");
  const agora = Date.now();
  const desde = new Date(agora - 3 * 24 * 60 * 60 * 1000);
  // Só os vídeos mexidos nos últimos 3 dias com pedido de capa pendente (na capa do completo ou num corte).
  const ids = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM video_jobs
    WHERE "updatedAt" >= ${desde}
      AND (capas -> 'noModelo' ->> 'pendente' = 'true' OR clips::text LIKE '%"capaNoModelo"%"pendente": true%' OR clips::text LIKE '%"capaNoModelo"%"pendente":true%')
    LIMIT 30`.catch(() => [] as Array<{ id: string }>);
  const videos = ids.length
    ? await prisma.videoJob.findMany({ where: { id: { in: ids.map((x) => x.id) } }, select: { id: true, capas: true, clips: true } }).catch(() => [] as Array<{ id: string; capas: unknown; clips: unknown }>)
    : [];
  let olhados = 0;
  let reserva = 0;
  for (const v of videos) {
    if (reserva >= (o.maximo ?? 2)) break;
    const pend = (v.capas as CapasDoCompleto | null)?.noModelo;
    const vencidoCompleto = pend?.pendente && !capaAindaEspera(pend, agora) ? pend : null;
    const clips = (v.clips as Array<{ midia?: { capaNoModelo?: CapaPendente } | null }> | null) ?? [];
    const cortesVencidos = clips.map((c, i) => ({ i, p: c?.midia?.capaNoModelo })).filter((x) => x.p?.pendente && !capaAindaEspera(x.p, agora));
    if (!vencidoCompleto && !cortesVencidos.length) continue;
    olhados++;
    const lotes = [...new Set([vencidoCompleto?.lote, ...cortesVencidos.map((x) => x.p!.lote)].filter(Boolean) as string[])];
    let algumVivo = false;
    for (const lote of lotes) {
      const d = Date.parse((vencidoCompleto?.lote === lote ? vencidoCompleto.desde : cortesVencidos.find((x) => x.p!.lote === lote)?.p?.desde) ?? "");
      if (await aindaEsperaOWorker(lote, lote, Number.isFinite(d) ? agora - d : PRAZO_DA_CAPA_NO_MODELO_MS)) algumVivo = true;
    }
    if (algumVivo) continue;
    reserva++;
    const { fundirNoTrecho } = await import("@/lib/media/revisao-do-corte");
    if (vencidoCompleto) {
      await prisma.videoJob.update({ where: { id: v.id }, data: { capas: { ...(v.capas as CapasDoCompleto), noModelo: { ...vencidoCompleto, pendente: false, templateFalhou: "a capa do modelo não voltou no prazo" } } as never } });
    }
    for (const x of cortesVencidos) await fundirNoTrecho(v.id, x.i, {}, { capaNoModelo: { ...x.p, pendente: false, templateFalhou: "a capa do modelo não voltou no prazo" } }).catch(() => {});
    console.warn(`[capa-no-modelo][${v.id}] lote sem callback no prazo e fora do worker: segunda tentativa no mesmo estilo`);
    await reservaDasCapas(v.id, { completo: Boolean(vencidoCompleto), cortes: cortesVencidos.map((x) => x.i) });
  }
  return { olhados, reserva };
}
