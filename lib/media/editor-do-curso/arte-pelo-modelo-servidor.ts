import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { assinarCorpo, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { aindaEsperaOWorker } from "@/lib/media/montagem-no-worker";
import { chaveDoGrupo, marcarFalha, marcarGerando, semEspera } from "@/lib/modelos-de-arte/espera-da-identidade";
import { modeloGravadoNosPosts } from "@/lib/estilo-dos-posts/tipos";
import { fotosGravadasNosPosts } from "@/lib/materiais/material-da-campanha";
import {
  arteDoModeloLigada,
  arteNoModeloDe,
  decidirArtePeloModelo,
  diaVaiPeloModelo,
  formatoNoModelo,
  legendaComCreditos,
  marcasDoModelo,
  planoDoCallback,
  tetoDoLoteUsd,
  textoDoInfograficoNoModelo,
  type CallbackDaArte,
  type ColetaDoModelo,
  type PecaDoLote,
  type PostDoLote,
} from "@/lib/media/editor-do-curso/arte-pelo-modelo";
import { arteDoModeloPelaIa, promptDeEstiloDoModelo } from "@/lib/media/editor-do-curso/arte-pela-ia";

/**
 * O LADO DO SERVIDOR DAS ARTES PELO MODELO DO CURSO (10/10/2026). As decisões
 * puras estão em arte-pelo-modelo.ts; aqui, o que lê e grava: a regra do
 * projeto, o pedido ao worker, o callback nos posts, a reserva (o caminho de
 * hoje) e o vigia do lote que não voltou.
 */

const PENDENTE = ["draft", "scheduled", "failed"];

export type RegraDoProjeto = { modelo: string; modo: "mestre" | "por-post" };

/**
 * A regra do projeto (ARTE_PELO_MODELO=1, modelo do curso que serve às artes e
 * nenhum estilo próprio do cliente na frente) e o padrão dos posts. Null:
 * vale o caminho de hoje.
 */
export async function regraDaArtePeloModelo(projectId: string): Promise<RegraDoProjeto | null> {
  const ligada = arteDoModeloLigada();
  if (!ligada) return null;
  const { modeloDoCursoDoProjeto } = await import("@/lib/media/editor-do-curso/no-corte");
  const modelo = await modeloDoCursoDoProjeto(projectId).catch(() => null);
  if (!modelo) return null;
  // O "Meu estilo" confirmado que não saiu do modelo é o estilo próprio do cliente: ele manda.
  // Só se confirmado depois da escolha do modelo (10/10, noite).
  const { estiloProprioValeSobreOModelo } = await import("@/lib/media/editor-do-curso/no-corte");
  const estiloProprio = await estiloProprioValeSobreOModelo(projectId).catch(() => false);
  const r = decidirArtePeloModelo({ ligada, modelo, estiloProprio });
  if (!r.usa) {
    console.log(`[arte-no-modelo][${projectId}] caminho de hoje: ${r.motivo}`);
    return null;
  }
  const { lerModoDosPosts } = await import("@/lib/estilo-dos-posts/design-mestre");
  const modo = await lerModoDosPosts(projectId).catch(() => "mestre" as const);
  return { modelo: r.modelo, modo };
}

/** O que todo pedido do projeto leva: cores da marca, quem fala, nicho, a foto da pessoa e o logo. */
export type BaseDoPedido = {
  cores: { fundo: string; titulo: string; destaque: string } | null;
  marca: { nome: string; area: string };
  nicho: string | null;
  fotoUrl: string | null;
  logo: { claro: string; proporcao: number; pastilha: string | null; proporcaoDaPastilha: number | null } | null;
  /**
   * Sem foto na Biblioteca (11/10, teste do Bruno no Estúdio: a janela da
   * pessoa saía vazia): quadros NÍTIDOS da própria gravação, um diferente por
   * peça. A foto da Biblioteca, quando há, continua na frente.
   */
  fotos?: string[];
  /** Os blocos que o corte do mesmo vídeo usou no modelo (referência para o redator). */
  referenciaDoCorte?: string | null;
};

/**
 * O logo das artes de hoje (logoParaArte, a mesma origem e o mesmo tratamento)
 * e a versão na pastilha clara que a `Assinatura` usa em fundo escuro (folga de
 * 28% da altura, cantos de 35%), em PNG. O worker escolhe pela cor do canto.
 */
async function logoDoProjeto(logoUrl: string | null | undefined): Promise<BaseDoPedido["logo"]> {
  if (!logoUrl) return null;
  const { lerMidia } = await import("@/lib/media/storage");
  const { logoParaArte } = await import("@/lib/modelos-de-arte/compor");
  const logo = await logoParaArte(await lerMidia(logoUrl).catch(() => null));
  if (!logo) return null;
  try {
    const sharp = (await import("sharp")).default;
    const png = Buffer.from(logo.src.replace(/^data:image\/png;base64,/, ""), "base64");
    const meta = await sharp(png).metadata();
    const w = meta.width ?? 1;
    const h = meta.height ?? 1;
    const pad = Math.round(h * 0.28);
    const W = w + 2 * pad;
    const H = h + 2 * pad;
    const raio = Math.round(h * 0.35);
    const fundo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${raio}" ry="${raio}" fill="#ffffff"/></svg>`);
    const pastilha = await sharp(fundo).composite([{ input: png, left: pad, top: pad }]).png().toBuffer();
    return { claro: logo.src, proporcao: logo.proporcao, pastilha: `data:image/png;base64,${pastilha.toString("base64")}`, proporcaoDaPastilha: W / H };
  } catch {
    return { claro: logo.src, proporcao: logo.proporcao, pastilha: null, proporcaoDaPastilha: null };
  }
}

export async function baseDoPedido(projectId: string, runId?: string | null, o: { videoJobId?: string | null; quantas?: number } = {}): Promise<BaseDoPedido> {
  const { coresDaMarcaParaOModelo, quemFalaNoProjeto } = await import("@/lib/media/editor-do-curso/no-corte");
  const { materiaisDaMarca } = await import("@/lib/materiais/escolha");
  const { materiaisDaPessoa, menosUsado } = await import("@/lib/media/referencia-da-pessoa");
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { niche: true, logoUrl: true } });
  const [cores, marca, materiais, logo] = await Promise.all([
    coresDaMarcaParaOModelo(projectId).catch(() => null),
    quemFalaNoProjeto(projectId).catch(() => ({ nome: "", area: "" })),
    materiaisDaMarca(projectId, runId ?? undefined).catch(() => []),
    logoDoProjeto(p?.logoUrl).catch(() => null),
  ]);
  // Onde o modelo põe a pessoa: a foto dela da Biblioteca (a menos usada) na
  // frente; sem ela, quadros nítidos da gravação, um por peça (11/10); sem
  // nenhum que preste, nada (o fundo liso na cor da marca).
  const foto = menosUsado(materiaisDaPessoa(materiais));
  const extras = o.videoJobId ? await extrasDoVideo(o.videoJobId, { semFoto: !foto, quantas: o.quantas ?? 1 }).catch(() => ({ fotos: [], referenciaDoCorte: null })) : { fotos: [], referenciaDoCorte: null };
  return { cores, marca, nicho: p?.niche ?? null, fotoUrl: foto?.url ?? null, logo, ...extras };
}

/**
 * O que o vídeo dá às peças (11/10): sem foto na Biblioteca, quadros nítidos da
 * gravação, um por peça (o mesmo crivo da capa: olho aberto, rosto inteiro, sem
 * borrão, sem ampliar mais de 2x para o 9:16); e os blocos que os cortes do
 * vídeo usaram no modelo, como referência do que ficou bom.
 */
async function extrasDoVideo(videoJobId: string, o: { semFoto: boolean; quantas: number }): Promise<{ fotos: string[]; referenciaDoCorte: string | null }> {
  const { quadrosNitidosDoVideo } = await import("@/lib/media/quadros-nitidos");
  const { referenciaDosCortes } = await import("@/lib/media/capa-pelo-modelo");
  const [quadros, video] = await Promise.all([
    o.semFoto ? quadrosNitidosDoVideo(videoJobId, { quantos: Math.max(1, Math.min(10, o.quantas)), alvo: { largura: 1080, altura: 1920 } }) : Promise.resolve([]),
    prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { clips: true } }).catch(() => null),
  ]);
  const cortes = ((video?.clips as Array<{ montagem?: { curso?: { tipos?: Array<{ tipo: string; vezes: number; exemplo?: string }>; mapa?: string } | null } | null }> | null) ?? []).map((c) => c?.montagem?.curso ?? null);
  // Os cortes editados antes de 11/10 não guardam os blocos; o mapa editorial deles diz o mesmo em texto.
  const mapa = cortes.find((c) => typeof c?.mapa === "string" && c.mapa.trim())?.mapa ?? null;
  const referencia = referenciaDosCortes(cortes) ?? (mapa ? `O mapa editorial de um corte deste vídeo (trecho):\n${mapa.replace(/[—–]/g, ",").slice(0, 1500)}` : null);
  return { fotos: quadros.map((q) => q.url), referenciaDoCorte: referencia };
}

/**
 * Manda um lote ao worker (POST /arte-no-modelo, assinado). 202 é aceito; o resto é recusa.
 * `pessoaUrl` (11/10): a pessoa da capa deitada (16:9), recortada no worker.
 * `retorno` extra: o que o callback precisa além do lote (a capa leva o vídeo e o alvo).
 */
export async function enviarLoteAoWorker(o: { chave: string; projectId: string; runId: string | null; modelo: string; pecas: PecaDoLote[]; base: BaseDoPedido; pessoaUrl?: string | null; retorno?: Record<string, unknown> }): Promise<{ ok: true } | { ok: false; erro: string }> {
  const worker = (process.env.VIDEO_WORKER_URL ?? "").replace(/\/$/, "");
  if (!worker) return { ok: false, erro: "VIDEO_WORKER_URL não configurado" };
  const app = (process.env.NEXT_PUBLIC_APP_URL ?? "https://demandou.com").replace(/\/$/, "");
  // Uma foto por peça (11/10): sem foto da Biblioteca, os quadros nítidos da
  // gravação vão um em cada peça, sem repetir enquanto houver diferente.
  const fotos = !o.base.fotoUrl && o.base.fotos?.length ? o.base.fotos : [];
  const pecas = fotos.length ? o.pecas.map((p, i) => (p.fotoUrl ? p : { ...p, fotoUrl: fotos[i % fotos.length] })) : o.pecas;
  const corpo = JSON.stringify({
    chave: o.chave,
    // O /vivo do worker acha o trabalho por este id (o vigia pergunta antes de desistir).
    videoJobId: o.chave,
    projectId: o.projectId,
    runId: o.runId,
    modelo: o.modelo,
    pecas,
    cores: o.base.cores,
    fotoUrl: o.base.fotoUrl,
    ...(fotos.length ? { fotosDaGravacao: true } : {}),
    ...(o.base.referenciaDoCorte ? { referenciaDoCorte: o.base.referenciaDoCorte } : {}),
    ...(o.pessoaUrl ? { pessoaUrl: o.pessoaUrl } : {}),
    marca: o.base.marca,
    nicho: o.base.nicho,
    logo: o.base.logo,
    tetoUsd: tetoDoLoteUsd(o.pecas.length),
    voltas: 3,
    planoUrl: `${app}/api/editor-do-curso/plano`,
    callbackUrl: `${app}/api/editor-do-curso/arte-callback`,
    retorno: { ...(o.retorno ?? {}), lote: o.chave, projectId: o.projectId },
  });
  try {
    const r = await fetch(`${worker}/arte-no-modelo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CABECALHO_ASSINATURA]: assinarCorpo(corpo) },
      body: corpo,
      signal: AbortSignal.timeout(30_000),
    });
    if (r.status === 202) return { ok: true };
    return { ok: false, erro: `HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Manda a coleta de uma execução ao worker: um pedido por lote (normalmente
 * um só). Lote recusado, ou a base do pedido que não saiu, vai para o caminho
 * de hoje na hora: o post não fica esperando um trabalho que não existe.
 */
export async function despacharColeta(o: { projectId: string; runId: string | null; modelo: string; coleta: ColetaDoModelo; videoJobId?: string | null }): Promise<{ enviados: number; reserva: number }> {
  const lotes = o.coleta.lotes.filter((l) => l.pecas.length);
  if (!lotes.length) return { enviados: 0, reserva: 0 };
  // PELA IA DE IMAGEM (11/10): o modelo com prompt de estilo não vai ao template
  // do worker. As artes saem numa função à parte do app (a rota tem o prazo dela
  // e a esteira não espera os minutos das imagens); a rota fora do ar desenha aqui.
  if (arteDoModeloPelaIa() && promptDeEstiloDoModelo(o.modelo)) {
    let enviados = 0;
    for (const lote of lotes) {
      const r = await pedirArtesPelaIa(o.projectId, lote.chave);
      if (r.ok) {
        enviados++;
        console.log(`[arte-no-modelo][${o.projectId}] lote ${lote.chave} (${lote.pecas.length} peças) pela IA no estilo de ${o.modelo}`);
        continue;
      }
      console.warn(`[arte-no-modelo][${o.projectId}] a rota das artes pela IA não aceitou o lote ${lote.chave} (${r.erro}); desenho aqui`);
      await desenharLotePelaIa(o.projectId, lote.chave);
    }
    return { enviados, reserva: 0 };
  }
  let base: BaseDoPedido | null = null;
  let erroDaBase: string | null = null;
  try {
    base = await baseDoPedido(o.projectId, o.runId, { videoJobId: o.videoJobId ?? null, quantas: Math.max(...lotes.map((l) => l.pecas.length)) });
  } catch (e) {
    erroDaBase = e instanceof Error ? e.message : String(e);
  }
  let enviados = 0;
  let reserva = 0;
  for (const lote of lotes) {
    const r = base ? await enviarLoteAoWorker({ chave: lote.chave, projectId: o.projectId, runId: o.runId, modelo: o.modelo, pecas: lote.pecas, base }) : { ok: false as const, erro: `o pedido não montou (${erroDaBase})` };
    if (r.ok) {
      enviados++;
      console.log(`[arte-no-modelo][${o.projectId}] lote ${lote.chave} (${lote.pecas.length} peças) no worker`);
      continue;
    }
    reserva++;
    console.error(`[arte-no-modelo][${o.projectId}] lote ${lote.chave} recusado, vai pelo caminho de hoje: ${r.erro}`);
    await reservaDoLote(o.projectId, lote.chave, `o worker não aceitou as peças (${r.erro.slice(0, 120)})`);
  }
  return { enviados, reserva };
}

/**
 * Pede à rota das artes pela IA (app/api/editor-do-curso/arte-pela-ia) que
 * desenhe um lote depois de responder: uma função nova, com o prazo dela.
 * Assinado como o pedido ao worker. 202 é aceito.
 */
async function pedirArtesPelaIa(projectId: string, lote: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  const app = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!app) return { ok: false, erro: "NEXT_PUBLIC_APP_URL não configurado" };
  const corpo = JSON.stringify({ projectId, lote });
  try {
    const r = await fetch(`${app}/api/editor-do-curso/arte-pela-ia`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CABECALHO_ASSINATURA]: assinarCorpo(corpo) },
      body: corpo,
      signal: AbortSignal.timeout(20_000),
    });
    if (r.status === 202) return { ok: true };
    return { ok: false, erro: `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

/** Desenha os posts que ainda esperam um lote, pela IA (o que ela não fizer, pelo caminho de hoje). */
export async function desenharLotePelaIa(projectId: string, lote: string): Promise<{ feitos: number; falhas: number }> {
  const posts = (await postsDoLote(lote, projectId)).filter((p) => arteNoModeloDe(p.metadata)?.pendente && !p.imageUrl);
  if (!posts.length) return { feitos: 0, falhas: 0 };
  return desenharPeloCaminhoDeHoje(projectId, posts.map((p) => p.id), "a arte pela IA não saiu");
}

const SELECT_DO_POST = { id: true, projectId: true, platform: true, mediaType: true, imageUrl: true, runId: true, dayOfWeek: true, metadata: true, content: true, status: true } as const;

async function postsDoLote(lote: string, projectId?: string | null) {
  return prisma.post.findMany({
    where: { ...(projectId ? { projectId } : {}), metadata: { path: ["arteNoModelo", "lote"], equals: lote } },
    select: SELECT_DO_POST,
    take: 60,
  });
}

/** O `arteNoModelo` do post fechado (não pendente), com o que aconteceu. */
function fecharArte(meta: unknown, extra: Record<string, unknown>): Record<string, unknown> {
  const m = (meta && typeof meta === "object" ? { ...(meta as Record<string, unknown>) } : {}) as Record<string, unknown>;
  const arte = (m.arteNoModelo && typeof m.arteNoModelo === "object" ? m.arteNoModelo : {}) as Record<string, unknown>;
  return { ...m, arteNoModelo: { ...arte, pendente: false, ...extra } };
}

/** Os posts pendentes de um lote vão todos para o caminho de hoje (lote recusado, ou falha geral). */
async function reservaDoLote(projectId: string, lote: string, motivo: string): Promise<void> {
  const posts = (await postsDoLote(lote, projectId)).filter((p) => arteNoModeloDe(p.metadata)?.pendente && !p.imageUrl);
  if (!posts.length) return;
  await marcarReserva(posts.map((p) => p.id), motivo);
  await desenharPeloCaminhoDeHoje(projectId, posts.map((p) => p.id), motivo);
}

/**
 * O post vai para a reserva: o motivo fica gravado (um callback repetido não
 * manda o mesmo post duas vezes ao caminho de hoje) e o "fazendo" ganha 30 min.
 * Continua pendente até a reserva sair: se a reserva morrer no meio (a função
 * que roda depois da resposta tem teto), o vigia a refaz depois do prazo.
 */
export async function marcarReserva(postIds: string[], motivo: string): Promise<void> {
  for (const id of postIds) {
    const p = await prisma.post.findUnique({ where: { id }, select: { metadata: true } });
    if (!p) continue;
    const m = marcarGerando(p.metadata, new Date(), { prazoMs: 30 * 60_000 });
    const arte = (m.arteNoModelo && typeof m.arteNoModelo === "object" ? m.arteNoModelo : {}) as Record<string, unknown>;
    const meta = { ...m, arteNoModelo: { ...arte, pendente: true, reserva: motivo.slice(0, 300) } };
    await prisma.post.update({ where: { id }, data: { metadata: meta as Prisma.InputJsonValue } }).catch(() => {});
  }
}

/**
 * O CALLBACK NOS POSTS: cada post pendente do lote recebe a imagem das suas
 * peças (o carrossel, as lâminas na ordem), a legenda ganha os créditos das
 * fotos de banco, a espera sai, e o card da Diana do dia mostra a arte. O que
 * faltou volta em `reserva`, para a rota desenhar pelo caminho de hoje depois
 * de responder (cada grupo leva minutos).
 */
export async function concluirArteNoModelo(cb: CallbackDaArte): Promise<{ projectId: string | null; preenchidos: number; reserva: Array<{ postIds: string[]; motivo: string }>; ignorados: number }> {
  const posts = await postsDoLote(cb.lote, cb.projectId);
  const projectId = cb.projectId ?? posts[0]?.projectId ?? null;
  const plano = planoDoCallback(posts as PostDoLote[], cb);
  const porId = new Map(posts.map((p) => [p.id, p]));
  const agora = new Date().toISOString();
  const custoPorPost = plano.preencher.length ? +(cb.custoUsd / plano.preencher.length).toFixed(4) : 0;
  const feitos: Array<{ postId: string; imageUrl: string; post: (typeof posts)[number] }> = [];
  for (const f of plano.preencher) {
    const p = porId.get(f.postId)!;
    const content = legendaComCreditos(p.content, f.creditos, p.platform);
    const meta = fecharArte(semEspera(p.metadata), { feitoEm: agora, reserva: null, custoUsd: custoPorPost, ...(f.creditos.length ? { creditos: f.creditos } : {}) });
    // Só o post que ainda espera (sem arte): outro caminho que já preencheu ganha.
    const r = await prisma.post.updateMany({ where: { id: p.id, imageUrl: null }, data: { imageUrl: f.imageUrl, content, metadata: meta as Prisma.InputJsonValue } });
    if (!r.count) continue;
    const refazer = arteNoModeloDe(p.metadata)?.origem === "refazer";
    await atualizarCards(p.id, { imagem: f.imageUrl, conteudo: content !== p.content ? content : null, refazer });
    if (!refazer) feitos.push({ postId: p.id, imageUrl: f.imageUrl, post: p });
  }
  // A arte principal do dia no card da Diana: a 4:5 do Instagram quando o dia tem Instagram, como hoje.
  // O refazer de uma peça não mexe no card do dia (refazer o Instagram não redesenha o LinkedIn).
  await cardsDaDianaDoLote(feitos);
  for (const r of plano.reserva) await marcarReserva(r.postIds, r.motivo);
  if (cb.custoUsd) console.log(`[arte-no-modelo][${projectId}] lote ${cb.lote}: US$ ${cb.custoUsd.toFixed(3)} de IA (gravados no uso de IA como "arte-no-modelo"), ${plano.preencher.length} post(s) preenchido(s), ${plano.reserva.length} grupo(s) na reserva`);
  return { projectId, preenchidos: plano.preencher.length, reserva: plano.reserva, ignorados: plano.ignorados.length };
}

/**
 * O card do redator do post acompanha a legenda (com os créditos) e, no
 * refazer, a arte nova (como o refazer de hoje faz); a espera sai dos cards do post.
 */
async function atualizarCards(postId: string, o: { imagem: string; conteudo: string | null; refazer?: boolean }): Promise<void> {
  const cards = await prisma.campaignCard.findMany({ where: { postId }, select: { id: true, cardType: true, metadata: true } }).catch(() => []);
  for (const c of cards) {
    const data: Prisma.CampaignCardUpdateInput = { metadata: semEspera(c.metadata) as Prisma.InputJsonValue };
    if (c.cardType !== "media" && o.conteudo) data.content = o.conteudo;
    if (c.cardType !== "media" && o.refazer) data.mediaUrl = o.imagem;
    await prisma.campaignCard.update({ where: { id: c.id }, data }).catch(() => {});
  }
}

/** O card da Diana de cada dia preenchido mostra a arte principal do dia. */
async function cardsDaDianaDoLote(feitos: Array<{ postId: string; imageUrl: string; post: { platform: string; runId: string | null; dayOfWeek: number | null; mediaType: string | null } }>): Promise<void> {
  const { artePrincipal } = await import("@/lib/media/arte-por-rede");
  const porDia = new Map<string, typeof feitos>();
  for (const f of feitos) {
    if (!f.post.runId || !f.post.dayOfWeek) continue;
    const k = `${f.post.runId}:${f.post.dayOfWeek}`;
    porDia.set(k, [...(porDia.get(k) ?? []), f]);
  }
  for (const grupo of porDia.values()) {
    const principal = artePrincipal(Object.fromEntries(grupo.map((g) => [g.post.platform, g.imageUrl])));
    if (!principal) continue;
    const cards = await prisma.campaignCard
      .findMany({ where: { runId: grupo[0].post.runId!, dayOfWeek: grupo[0].post.dayOfWeek!, cardType: "media" }, select: { id: true, metadata: true } })
      .catch(() => []);
    for (const c of cards) await prisma.campaignCard.update({ where: { id: c.id }, data: { mediaUrl: principal, metadata: semEspera(c.metadata) as Prisma.InputJsonValue } }).catch(() => {});
  }
}

/**
 * A RESERVA: o caminho de hoje para os posts que a arte do modelo não
 * preencheu, o MESMO desenho da semana do vídeo (`arteDoDia` com a frase e as
 * lâminas gravadas no post, e o infográfico pelo Nano Banana com o conteúdo
 * gravado), sem cobrar de novo (a arte da semana já estava no pacote; o refazer
 * já cobrou). Um grupo por dia; o que não sair fica com a falha e o "Tentar de
 * novo" do quadro, nunca em "fazendo" eterno.
 */
export async function desenharPeloCaminhoDeHoje(projectId: string, postIds: string[], motivo: string): Promise<{ feitos: number; falhas: number }> {
  const posts = await prisma.post.findMany({ where: { id: { in: postIds }, projectId, imageUrl: null, status: { in: PENDENTE } }, select: { ...SELECT_DO_POST, imagePrompt: true } });
  const grupos = new Map<string, typeof posts>();
  for (const p of posts) {
    const k = chaveDoGrupo({ postId: p.id, runId: p.runId, dayOfWeek: p.dayOfWeek, mediaType: p.mediaType ?? "image" });
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  let feitos = 0;
  let falhas = 0;
  // Três dias por vez (11/10): pela IA cada dia leva de 1 a 3 minutos, e a semana em fila passaria do prazo da função.
  const fila = [...grupos.values()];
  const um = async (grupo: (typeof fila)[number]) => {
    try {
      await desenharGrupo(projectId, grupo, motivo);
      feitos++;
    } catch (e) {
      falhas++;
      const erro = e instanceof Error ? e.message : String(e);
      console.error(`[arte-no-modelo][${projectId}] a reserva de ${grupo.map((p) => p.id).join(",")} falhou: ${erro}`);
      // A falha que o quadro mostra, com o "Tentar de novo"; o lote fecha (o vigia não insiste).
      for (const p of grupo) {
        const atual = await prisma.post.findUnique({ where: { id: p.id }, select: { metadata: true } });
        if (atual) await prisma.post.update({ where: { id: p.id }, data: { metadata: fecharArte(marcarFalha(atual.metadata, erro), { reservaFalhou: erro.slice(0, 300) }) as Prisma.InputJsonValue } }).catch(() => {});
      }
    }
  };
  const trabalhador = async () => {
    for (let g = fila.shift(); g; g = fila.shift()) await um(g);
  };
  await Promise.all([1, 2, 3].map(trabalhador));
  return { feitos, falhas };
}

type PostDaReserva = { id: string; platform: string; mediaType: string | null; runId: string | null; dayOfWeek: number | null; metadata: unknown; content: string; imagePrompt: string | null };

/**
 * O GRUPO PELA IA DE IMAGEM (11/10, arte-pela-ia.ts): o post cujo projeto tem
 * modelo do curso com prompt de estilo sai do Nano Banana Pro no estilo do
 * modelo, com o texto exato e as cores da marca. True quando preencheu; false
 * quando a IA não vale ou não saiu (o caminho de hoje desenha em seguida).
 */
async function desenharGrupoPelaIa(projectId: string, posts: PostDaReserva[], nicho: string | null): Promise<boolean> {
  const base = posts[0];
  const meta = (base.metadata ?? {}) as { frase?: string; slides?: unknown; infografico?: unknown; arteNoModelo?: { modelo?: string; origem?: string } };
  const modelo = meta.arteNoModelo?.modelo;
  if (!arteDoModeloPelaIa() || !promptDeEstiloDoModelo(modelo)) return false;
  const tipo = base.mediaType === "carousel" || base.mediaType === "infographic" ? base.mediaType : "image";
  // O refazer de carrossel é uma imagem só (a manchete), como hoje.
  const refazer = meta.arteNoModelo?.origem === "refazer";
  const mediaType = tipo === "carousel" && refazer ? "image" : tipo;
  try {
    const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
    const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
    const marca = await marcaDaArte(projectId, { runId: base.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts(posts) });
    const porRede = await desenharPelaIa({
      projectId,
      runId: base.runId,
      modelo: modelo!,
      mediaType,
      redes: posts.map((p) => p.platform),
      frase: typeof meta.frase === "string" ? meta.frase : null,
      slides: Array.isArray(meta.slides) ? meta.slides.filter((s): s is string => typeof s === "string") : null,
      infografico: (meta.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined) ?? null,
      textoDoPost: base.content,
      dia: base.dayOfWeek,
      nicho,
      marca,
    });
    const agora = new Date().toISOString();
    for (const p of posts) {
      const nova = porRede[p.platform];
      if (!nova) continue;
      const metaNova = fecharArte(semEspera(p.metadata), { feitoEm: agora, reserva: null, pelaIa: true });
      await prisma.post.updateMany({ where: { id: p.id, imageUrl: null }, data: { imageUrl: nova, metadata: metaNova as Prisma.InputJsonValue } });
      await atualizarCards(p.id, { imagem: nova, conteudo: null, refazer });
    }
    if (!refazer && base.runId && base.dayOfWeek) {
      const { artePrincipal } = await import("@/lib/media/arte-por-rede");
      const principal = artePrincipal(porRede);
      if (principal) {
        const cards = await prisma.campaignCard.findMany({ where: { runId: base.runId, dayOfWeek: base.dayOfWeek, cardType: "media" }, select: { id: true, metadata: true } }).catch(() => []);
        for (const c of cards) await prisma.campaignCard.update({ where: { id: c.id }, data: { mediaUrl: principal, metadata: semEspera(c.metadata) as Prisma.InputJsonValue } }).catch(() => {});
      }
    }
    console.log(`[arte-no-modelo][${projectId}] ${posts.length} post(s) ${base.mediaType} pela IA no estilo de ${modelo}`);
    return true;
  } catch (e) {
    // Sem saldo não troca de caminho calado: o erro sobe (a fila espera o saldo), como toda arte.
    const { ehSemSaldoDaOpenAI } = await import("@/lib/media/gpt-image");
    if (ehSemSaldoDaOpenAI(e)) throw e;
    console.warn(`[arte-no-modelo][${projectId}] a IA não desenhou ${posts.map((p) => p.id).join(",")} (vai pelo caminho de hoje): ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

async function desenharGrupo(projectId: string, posts: PostDaReserva[], motivo: string): Promise<void> {
  const base = posts[0];
  const meta = (base.metadata ?? {}) as { videoJobId?: string; frase?: string; slides?: unknown; infografico?: unknown; arteNoModelo?: { origem?: string } };
  const runId = base.runId;
  const projeto = await prisma.project.findUnique({ where: { id: projectId }, select: { niche: true } });
  const nicho = projeto?.niche ?? null;
  if (await desenharGrupoPelaIa(projectId, posts, nicho)) return;
  const run = runId ? await prisma.pipelineRun.findUnique({ where: { id: runId }, select: { config: true } }).catch(() => null) : null;
  const { direcaoDaPeca } = await import("@/lib/media/direcao-de-arte");
  const { marcaDaArte, marcaDaLaminaComFoto } = await import("@/lib/media/arte-com-frase");
  const { formatoDaPeca } = await import("@/lib/media/formatos-das-redes");
  const { artePrincipal } = await import("@/lib/media/arte-por-rede");
  const direcao =
    runId && base.dayOfWeek
      ? await direcaoDaPeca({ projectId, runId, dayOfWeek: base.dayOfWeek, infografico: base.mediaType === "infographic", preferido: (run?.config as { mediaStyle?: string } | null)?.mediaStyle }).catch(() => null)
      : null;
  const estilo = direcao?.styleHint ?? base.imagePrompt ?? "";
  // A marca da semana: o modelo e as fotos gravados no post (o mestre aprova o post).
  const marca = await marcaDaArte(projectId, { runId: runId ?? undefined, modeloDoPost: modeloGravadoNosPosts(posts), fotosDoPost: fotosGravadasNosPosts(posts) });
  const video = { id: meta.videoJobId, projectId, project: { niche: nicho } };
  const ctx = { projectId, runId: runId ?? "" };
  const porRede: Record<string, string> = {};
  const refazer = meta.arteNoModelo?.origem === "refazer";
  if (base.mediaType === "infographic") {
    const conteudo = meta.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined;
    if (!conteudo?.title) throw new Error("o infográfico não tem o conteúdo gravado no post");
    const { produzirArtePorRede } = await import("@/lib/media/arte-por-rede");
    const { pedidoDoInfografico } = await import("@/lib/media/infographic");
    const arte = await produzirArtePorRede({
      redes: posts.map((p) => p.platform),
      textoDoPost: base.content,
      projectId,
      runId: runId ?? undefined,
      ...pedidoDoInfografico(conteudo, { estilo: direcao?.estilo.prompt ?? "", paleta: direcao?.paleta ?? "", marca }, { nicho, ctx: { projectId, runId: runId ?? undefined, operation: "infografico" } }),
    });
    Object.assign(porRede, arte.porRede);
  } else if (base.mediaType === "carousel" && !refazer) {
    const { arteDoDia } = await import("@/lib/media/pecas-da-semana");
    const slides = Array.isArray(meta.slides) ? meta.slides.filter((s): s is string => typeof s === "string" && s.trim().length > 0) : [];
    if (!slides.length) throw new Error("o carrossel não tem as frases das lâminas gravadas");
    const formato = formatoDaPeca(base.platform, "carousel");
    const urls = await Promise.all(slides.map((frase, i) => arteDoDia(video, frase, estilo, formato, ctx, slides[0], marcaDaLaminaComFoto(marca, i, slides.length))));
    for (const p of posts) porRede[p.platform] = urls.join("|");
  } else {
    const { arteDoDia } = await import("@/lib/media/pecas-da-semana");
    const frase = typeof meta.frase === "string" && meta.frase.trim() ? meta.frase.trim() : null;
    if (!frase) throw new Error("a foto do dia não tem a frase gravada no post");
    // Uma geração por proporção; as redes da mesma proporção recebem a mesma arte (o refazer de carrossel: uma imagem, como hoje).
    const tipo = base.mediaType === "carousel" ? "carousel" : "image";
    const porProporcao = new Map<string, Promise<string>>();
    for (const p of posts) {
      const f = formatoDaPeca(p.platform, tipo);
      if (!porProporcao.has(f.proporcao)) porProporcao.set(f.proporcao, arteDoDia(video, frase, estilo, f, ctx, undefined, marca));
      porRede[p.platform] = await porProporcao.get(f.proporcao)!;
    }
  }
  const agora = new Date().toISOString();
  for (const p of posts) {
    const nova = porRede[p.platform];
    if (!nova) continue;
    const metaNova = fecharArte(semEspera(p.metadata), { reserva: motivo.slice(0, 300), reservaFeitaEm: agora });
    await prisma.post.updateMany({ where: { id: p.id, imageUrl: null }, data: { imageUrl: nova, metadata: metaNova as Prisma.InputJsonValue } });
    await atualizarCards(p.id, { imagem: nova, conteudo: null, refazer });
  }
  if (!refazer && runId && base.dayOfWeek) {
    const principal = artePrincipal(porRede);
    if (principal) {
      const cards = await prisma.campaignCard.findMany({ where: { runId, dayOfWeek: base.dayOfWeek, cardType: "media" }, select: { id: true, metadata: true } }).catch(() => []);
      for (const c of cards) await prisma.campaignCard.update({ where: { id: c.id }, data: { mediaUrl: principal, metadata: semEspera(c.metadata) as Prisma.InputJsonValue } }).catch(() => {});
    }
  }
  console.log(`[arte-no-modelo][${projectId}] reserva desenhada (${posts.length} post(s), ${base.mediaType}): ${motivo.slice(0, 160)}`);
}

/**
 * O VIGIA DOS LOTES QUE NÃO VOLTARAM (cron da fila): post pendente cujo prazo
 * passou. Antes de desistir, pergunta ao worker (`/vivo` com a chave do lote):
 * rodando ou esperando a vez, o prazo cresce 30 min (até o teto de 6 h);
 * ausente ou fora do ar, o lote vai para o caminho de hoje. Poucos lotes por
 * passada: cada reserva leva minutos.
 */
export async function vigiarArtesNoModelo(o: { maximo?: number } = {}): Promise<{ olhados: number; estendidos: number; reserva: number }> {
  const posts = await prisma.post.findMany({
    where: { imageUrl: null, status: { in: PENDENTE }, metadata: { path: ["arteNoModelo", "pendente"], equals: true } },
    select: { id: true, projectId: true, metadata: true },
    take: 80,
  });
  const agora = Date.now();
  const porLote = new Map<string, { projectId: string; ids: string[]; desde: number; naReserva: boolean }>();
  for (const p of posts) {
    const a = arteNoModeloDe(p.metadata);
    const ate = Date.parse(String((p.metadata as { gerandoArte?: { ate?: unknown } } | null)?.gerandoArte?.ate ?? ""));
    // Sem prazo legível, conta como vencido: "fazendo" sem fim é o que este vigia existe para impedir.
    if (!a || ate >= agora) continue;
    const l = porLote.get(a.lote) ?? { projectId: p.projectId, ids: [], desde: Date.parse(a.desde) || agora, naReserva: false };
    l.ids.push(p.id);
    // A reserva que já tinha começado e não terminou (a função que roda depois da resposta morreu): refaz direto.
    if (a.reserva) l.naReserva = true;
    porLote.set(a.lote, l);
  }
  let estendidos = 0;
  let reserva = 0;
  for (const [lote, l] of [...porLote.entries()].slice(0, o.maximo ?? 2)) {
    if (!l.naReserva && (await aindaEsperaOWorker(lote, lote, agora - l.desde))) {
      for (const id of l.ids) {
        const p = await prisma.post.findUnique({ where: { id }, select: { metadata: true } });
        if (!p) continue;
        const m = p.metadata as Record<string, unknown>;
        const g = (m.gerandoArte ?? {}) as Record<string, unknown>;
        await prisma.post.update({ where: { id }, data: { metadata: { ...m, gerandoArte: { ...g, ate: new Date(agora + 30 * 60_000).toISOString() } } as Prisma.InputJsonValue } }).catch(() => {});
      }
      estendidos++;
      continue;
    }
    reserva++;
    console.warn(`[arte-no-modelo][${l.projectId}] lote ${lote} sem callback no prazo e fora do worker: caminho de hoje`);
    await marcarReserva(l.ids, "a arte do modelo não voltou no prazo");
    await desenharPeloCaminhoDeHoje(l.projectId, l.ids, "a arte do modelo não voltou no prazo");
  }
  return { olhados: porLote.size, estendidos, reserva };
}

/**
 * O REFAZER DE UMA PEÇA (lib/pipeline/refazer-peca.ts) pelo modelo: a peça da
 * semana do vídeo que segue a regra vai ao worker num lote de UMA peça (a
 * manchete do texto novo; o infográfico, o conteúdo extraído dele). Devolve o
 * metadata do post já marcado "gerando", ou null para o refazer seguir o
 * caminho de hoje (regra que não vale, worker que não aceitou).
 */
export async function refazerArteNoModelo(o: {
  post: { id: string; projectId: string; platform: string; mediaType: string | null; runId: string | null; metadata: unknown; imagePrompt: string | null };
  texto: string;
  nicho: string | null;
}): Promise<{ metadata: Record<string, unknown>; imagem?: string } | null> {
  if (!arteDoModeloLigada()) return null;
  const meta = (o.post.metadata ?? {}) as Record<string, unknown>;
  if (meta.origem !== "video") return null;
  const formato = o.post.mediaType ?? "";
  if (!["image", "carousel", "infographic"].includes(formato)) return null;
  const regra = await regraDaArtePeloModelo(o.post.projectId);
  if (!regra) return null;
  const fotos = fotosGravadasNosPosts([o.post]);
  if (!diaVaiPeloModelo({ formato, modeloDoDia: modeloGravadoNosPosts([o.post]), modo: regra.modo, fotosDoDia: fotos?.length ?? 0 })) return null;
  let peca: PecaDoLote;
  let extra: Record<string, unknown>;
  const formatoDoPost = formatoNoModelo(o.post.platform, formato);
  if (formato === "infographic") {
    const chave = process.env.GEMINI_API_KEY;
    if (!chave) return null;
    const { extrairConteudoDoInfografico } = await import("@/lib/media/infographic");
    const conteudo = await extrairConteudoDoInfografico(o.texto, o.nicho ?? "negocios", chave, { projectId: o.post.projectId });
    peca = { tipo: "infografico", texto: textoDoInfograficoNoModelo(conteudo), formatos: [formatoDoPost] };
    extra = { infografico: conteudo };
  } else {
    const { mancheteDaPeca } = await import("@/lib/media/peca-de-feed");
    const m = await mancheteDaPeca({ textoDoPost: o.texto, estiloVisual: o.post.imagePrompt ?? "", nicho: o.nicho, projectId: o.post.projectId, runId: o.post.runId ?? undefined });
    peca = { tipo: formato === "carousel" ? "capa" : "post", texto: m.manchete, formatos: [formatoDoPost] };
    extra = { frase: m.manchete };
  }
  // PELA IA (11/10): o refazer de UMA peça desenha aqui mesmo (uma imagem, um a
  // dois minutos), e o post sai do refazer já com a arte. Não saiu: o caminho de hoje.
  if (arteDoModeloPelaIa() && promptDeEstiloDoModelo(regra.modelo)) {
    try {
      const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
      const { desenharPelaIa } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
      const marca = await marcaDaArte(o.post.projectId, { runId: o.post.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts([o.post]) });
      const porRede = await desenharPelaIa({
        projectId: o.post.projectId,
        runId: o.post.runId,
        modelo: regra.modelo,
        mediaType: formato === "infographic" ? "infographic" : "image",
        redes: [o.post.platform],
        frase: typeof extra.frase === "string" ? extra.frase : null,
        infografico: (extra.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined) ?? null,
        textoDoPost: o.texto,
        dia: (o.post as { dayOfWeek?: number | null }).dayOfWeek ?? null,
        nicho: o.nicho,
        marca,
      });
      const imagem = porRede[o.post.platform];
      if (imagem) {
        const agora = new Date().toISOString();
        const { arteNoModelo: _antiga, ...resto } = { ...meta, ...extra } as Record<string, unknown>;
        void _antiga;
        return { metadata: { ...resto, arteNoModelo: { lote: `refazer-${o.post.id}`, indices: [1], formato: formatoDoPost, modelo: regra.modelo, pendente: false, origem: "refazer", desde: agora, feitoEm: agora, pelaIa: true } }, imagem };
      }
    } catch (e) {
      console.warn(`[arte-no-modelo][${o.post.projectId}] o refazer de ${o.post.id} pela IA não saiu (vai pelo caminho de hoje): ${e instanceof Error ? e.message : e}`);
      return null;
    }
  }
  const chave = `refazer-${o.post.id}-${Date.now().toString(36)}`;
  const base = await baseDoPedido(o.post.projectId, o.post.runId, { videoJobId: typeof meta.videoJobId === "string" ? meta.videoJobId : null, quantas: 3 });
  const r = await enviarLoteAoWorker({ chave, projectId: o.post.projectId, runId: o.post.runId, modelo: regra.modelo, pecas: [peca], base });
  if (!r.ok) {
    console.warn(`[arte-no-modelo][${o.post.projectId}] o refazer de ${o.post.id} vai pelo caminho de hoje: ${r.erro}`);
    return null;
  }
  return { metadata: marcasDoModelo({ ...meta, ...extra }, { lote: chave, indices: [1], formato: formatoDoPost, modelo: regra.modelo, origem: "refazer" }) };
}
