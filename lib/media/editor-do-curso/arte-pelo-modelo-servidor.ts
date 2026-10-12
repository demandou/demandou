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
  metadataComMudancas,
  planoDoCallback,
  VOLTAS_DO_VIGIA,
  tetoDoLoteUsd,
  textoDoInfograficoNoModelo,
  type CallbackDaArte,
  type ColetaDoModelo,
  type PecaDoLote,
  type PostDoLote,
} from "@/lib/media/editor-do-curso/arte-pelo-modelo";
import { ehEstiloSobMedida, estiloDasArtesDoProjeto, estiloVaiPelaIa, promptDeEstiloDoModelo } from "@/lib/media/editor-do-curso/arte-pela-ia";
import { TENTATIVAS_NO_ESTILO } from "@/lib/media/editor-do-curso/arte-pela-ia-servidor";
import { fontesDoPost, infograficoSoComAFala, lastroDaArte } from "@/lib/media/lastro-do-video";
import type { FonteDoNumero, LastroDaArte } from "@/lib/media/dados-da-arte";

/**
 * O LADO DO SERVIDOR DAS ARTES PELO MODELO DO CURSO (10/10/2026). As decisões
 * puras estão em arte-pelo-modelo.ts; aqui, o que lê e grava: a regra do
 * projeto, o pedido ao worker, o callback nos posts, a segunda tentativa no
 * mesmo estilo (nunca o caminho de antes) e o vigia do lote que não voltou.
 */

const PENDENTE = ["draft", "scheduled", "failed"];

export type RegraDoProjeto = { modelo: string; modo: "mestre" | "por-post" };

/**
 * A regra do projeto (ARTE_PELO_MODELO=1, modelo do curso que serve às artes e
 * nenhum estilo próprio do cliente na frente) e o padrão dos posts. Null: o
 * projeto não tem estilo escolhido, e vale o caminho de hoje.
 */
export async function regraDaArtePeloModelo(projectId: string): Promise<RegraDoProjeto | null> {
  const ligada = arteDoModeloLigada();
  if (!ligada) return null;
  const { modeloDoCursoDoProjeto, escolhaDoEditorDoProjeto, estiloProprioValeSobreOModelo } = await import("@/lib/media/editor-do-curso/no-corte");
  // A EDIÇÃO SOB MEDIDA ESCOLHIDA MANDA NAS ARTES E NAS CAPAS (11/10): a opção
  // (Maquete 3D, Recorte, Gráficos, ou a genérica), sempre pela IA, com o
  // prompt dela. NUNCA o modelo de reserva gravado junto (em 11/10 a Maquete 3D
  // saiu Anatomia): nem com a IA desligada, nem com o modelo de reserva servindo.
  const escolha = await escolhaDoEditorDoProjeto(projectId).catch(() => ({ escolhido: null, reserva: null }));
  const sobMedida = estiloDasArtesDoProjeto(escolha.escolhido);
  // O "Meu estilo" confirmado que não saiu do modelo é o estilo próprio do cliente: ele manda.
  // Só se confirmado depois da escolha do modelo (10/10, noite).
  const estiloProprio = await estiloProprioValeSobreOModelo(projectId).catch(() => false);
  const { lerModoDosPosts } = await import("@/lib/estilo-dos-posts/design-mestre");
  if (sobMedida) {
    if (estiloProprio) return null;
    return { modelo: sobMedida, modo: await lerModoDosPosts(projectId).catch(() => "mestre" as const) };
  }
  // O MODELO DO CURSO ESCOLHIDO. Pela IA (o padrão), o estilo dele desenha toda
  // peça, inclusive o modelo que pede material ou entradas de fora: o prompt de
  // estilo não depende delas, e trocar para o caminho de antes seria trocar o
  // estilo sozinho (11/10). Pelo template do worker, só o modelo que serve às artes.
  const escolhido = escolha.escolhido;
  const pelaIa = estiloVaiPelaIa(escolhido);
  const modelo = pelaIa ? escolhido : await modeloDoCursoDoProjeto(projectId).catch(() => null);
  if (!modelo) return null;
  if (pelaIa) {
    if (estiloProprio) return null;
    return { modelo, modo: await lerModoDosPosts(projectId).catch(() => "mestre" as const) };
  }
  const r = decidirArtePeloModelo({ ligada, modelo, estiloProprio });
  if (!r.usa) {
    console.log(`[arte-no-modelo][${projectId}] caminho de hoje: ${r.motivo}`);
    return null;
  }
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
  // A OPÇÃO SOB MEDIDA NUNCA VAI AO WORKER (11/10): ela não tem template lá, e
  // o lote ficaria esperando um retorno que não vem. Quem chama cai na IA no
  // mesmo estilo (a recusa é o caminho da segunda tentativa).
  if (ehEstiloSobMedida(o.modelo)) return { ok: false, erro: `a opção ${o.modelo} é desenhada pela IA, não pelo template do worker` };
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
 * um só). Lote recusado, ou a base do pedido que não saiu, vai na hora à
 * segunda tentativa no MESMO estilo (pela IA): o post não fica esperando um
 * trabalho que não existe, e nunca cai no caminho de antes.
 */
export async function despacharColeta(o: { projectId: string; runId: string | null; modelo: string; coleta: ColetaDoModelo; videoJobId?: string | null }): Promise<{ enviados: number; reserva: number }> {
  const lotes = o.coleta.lotes.filter((l) => l.pecas.length);
  if (!lotes.length) return { enviados: 0, reserva: 0 };
  // PELA IA DE IMAGEM (11/10): o modelo com prompt de estilo não vai ao template
  // do worker (a edição sob medida, sempre). As artes saem numa função à parte do
  // app (a rota tem o prazo dela e a esteira não espera os minutos das imagens);
  // a rota fora do ar desenha aqui.
  if (estiloVaiPelaIa(o.modelo)) {
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
    console.error(`[arte-no-modelo][${o.projectId}] lote ${lote.chave} recusado; segunda tentativa no mesmo estilo, pela IA: ${r.erro}`);
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

/** Desenha os posts que ainda esperam um lote, pela IA no estilo (duas tentativas; o que não sair fica como falha técnica). */
export async function desenharLotePelaIa(projectId: string, lote: string): Promise<{ feitos: number; falhas: number }> {
  const posts = (await postsDoLote(lote, projectId)).filter((p) => arteNoModeloDe(p.metadata)?.pendente && !p.imageUrl);
  if (!posts.length) return { feitos: 0, falhas: 0 };
  return desenharNoMesmoEstilo(projectId, posts.map((p) => p.id), "a arte pela IA não saiu", { tentativas: TENTATIVAS_NO_ESTILO });
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
  const fechado: Record<string, unknown> = { ...arte, pendente: false, ...extra };
  // O campo pedido como null SAI (11/10): "reserva" e "reservaFalhou" só existem enquanto valem.
  for (const [k, v] of Object.entries(extra)) if (v === null) delete fechado[k];
  return { ...m, arteNoModelo: fechado };
}

/** Os posts pendentes de um lote recusado vão todos à segunda tentativa no MESMO estilo (pela IA). */
async function reservaDoLote(projectId: string, lote: string, motivo: string): Promise<void> {
  const posts = (await postsDoLote(lote, projectId)).filter((p) => arteNoModeloDe(p.metadata)?.pendente && !p.imageUrl);
  if (!posts.length) return;
  await marcarReserva(posts.map((p) => p.id), motivo);
  await desenharNoMesmoEstilo(projectId, posts.map((p) => p.id), motivo, { tentativas: 1 });
}

/**
 * O post vai para a segunda tentativa no mesmo estilo: o motivo fica gravado
 * (um callback repetido não manda o mesmo post duas vezes) e o "fazendo" ganha 30 min.
 * Continua pendente até a reserva sair: se a reserva morrer no meio (a função
 * que roda depois da resposta tem teto), o vigia a refaz depois do prazo.
 */
export async function marcarReserva(postIds: string[], motivo: string, o: { doVigia?: boolean } = {}): Promise<void> {
  for (const id of postIds) {
    const p = await prisma.post.findUnique({ where: { id }, select: { metadata: true } });
    if (!p) continue;
    const m = marcarGerando(p.metadata, new Date(), { prazoMs: 30 * 60_000 });
    const arte = (m.arteNoModelo && typeof m.arteNoModelo === "object" ? m.arteNoModelo : {}) as Record<string, unknown>;
    // As voltas do vigia (11/10) contam: passado o teto, a peça para como falha técnica, nunca "fazendo" para sempre.
    const voltas = (Number(arte.voltasDoVigia) || 0) + (o.doVigia ? 1 : 0);
    const meta = { ...m, arteNoModelo: { ...arte, pendente: true, reserva: motivo.slice(0, 300), ...(voltas ? { voltasDoVigia: voltas } : {}) } };
    await prisma.post.update({ where: { id }, data: { metadata: meta as Prisma.InputJsonValue } }).catch(() => {});
  }
}

/**
 * O CALLBACK NOS POSTS: cada post pendente do lote recebe a imagem das suas
 * peças (o carrossel, as lâminas na ordem), a legenda ganha os créditos das
 * fotos de banco, a espera sai, e o card da Diana do dia mostra a arte. O que
 * faltou volta em `reserva`, para a rota desenhar no MESMO estilo (pela IA) depois
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

/** A frase do cliente para a arte no estilo escolhido que não saiu (o quadro junta "Nada foi cobrado."). */
export const MOTIVO_DA_ARTE_QUE_PAROU = "A arte no estilo que você escolheu não saiu desta vez. Toque em Tentar de novo: ela recomeça no mesmo estilo";

/**
 * NUNCA TROCAR O ESTILO SOZINHO (11/10, regra do Bruno). Os posts que a arte
 * do modelo não preencheu (o template que recusou, o lote que falhou ou não
 * voltou no prazo, a IA que não desenhou) saem no MESMO estilo pela IA de
 * imagem, `tentativas` vezes (1 quando o template do worker já foi a primeira;
 * 2 quando a IA é o caminho). O que não sair fica como falha técnica, com o
 * "Tentar de novo" do quadro e sem cobrança (a arte da semana já estava no
 * pacote; o refazer cobra a arte só quando ela sai). O caminho de antes (a arte
 * genérica da direção de arte) e o modelo de reserva não entram mais. Um grupo
 * por dia; três dias por vez (pela IA cada dia leva de 1 a 3 minutos).
 */
export async function desenharNoMesmoEstilo(projectId: string, postIds: string[], motivo: string, o: { tentativas?: number } = {}): Promise<{ feitos: number; falhas: number }> {
  const posts = await prisma.post.findMany({ where: { id: { in: postIds }, projectId, imageUrl: null, status: { in: PENDENTE } }, select: { ...SELECT_DO_POST, imagePrompt: true } });
  const grupos = new Map<string, typeof posts>();
  for (const p of posts) {
    const k = chaveDoGrupo({ postId: p.id, runId: p.runId, dayOfWeek: p.dayOfWeek, mediaType: p.mediaType ?? "image" });
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  const projeto = await prisma.project.findUnique({ where: { id: projectId }, select: { niche: true } });
  const nicho = projeto?.niche ?? null;
  let feitos = 0;
  let falhas = 0;
  const fila = [...grupos.values()];
  const um = async (grupo: (typeof fila)[number]) => {
    try {
      await desenharGrupoNoEstilo(projectId, grupo, nicho, { tentativas: o.tentativas });
      feitos++;
    } catch (e) {
      falhas++;
      const erro = e instanceof Error ? e.message : String(e);
      console.error(`[arte-no-modelo][${projectId}] ${grupo.map((p) => p.id).join(",")} não saiu no estilo escolhido (${motivo.slice(0, 120)}; ${erro}); para como falha técnica, sem trocar o estilo`);
      // A falha que o quadro mostra, com o "Tentar de novo"; o lote fecha (o vigia não insiste).
      for (const p of grupo) {
        const atual = await prisma.post.findUnique({ where: { id: p.id }, select: { metadata: true } });
        if (atual) await prisma.post.update({ where: { id: p.id }, data: { metadata: fecharArte(marcarFalha(atual.metadata, MOTIVO_DA_ARTE_QUE_PAROU), { reservaFalhou: erro.slice(0, 300) }) as Prisma.InputJsonValue } }).catch(() => {});
      }
    }
  };
  const trabalhador = async () => {
    for (let g = fila.shift(); g; g = fila.shift()) await um(g);
  };
  await Promise.all([1, 2, 3].map(trabalhador));
  return { feitos, falhas };
}

/**
 * O "TENTAR DE NOVO" DO QUADRO para a arte no estilo que parou
 * (lib/media/artes-aguardando-identidade.ts): o grupo volta ao MESMO estilo,
 * com duas tentativas. Devolve quantos posts receberam a arte; lança quando
 * não sai (quem chama grava a falha de novo).
 */
export async function redesenharNoEstilo(projectId: string, postIds: string[]): Promise<number> {
  const posts = await prisma.post.findMany({ where: { id: { in: postIds }, projectId, imageUrl: null, status: { in: PENDENTE } }, select: { ...SELECT_DO_POST, imagePrompt: true } });
  if (!posts.length) return 0;
  const projeto = await prisma.project.findUnique({ where: { id: projectId }, select: { niche: true } });
  return desenharGrupoNoEstilo(projectId, posts, projeto?.niche ?? null, { tentativas: TENTATIVAS_NO_ESTILO });
}

/**
 * A FRASE NOVA NO ESTILO DO POST (11/10, a correção da Vera): quando a Vera
 * aponta a frase de uma imagem que tem estilo (modelo do curso ou opção sob
 * medida), a Diana redesenha NO MESMO estilo, pela IA, com duas tentativas.
 * Antes ia pelo caminho antigo (arteDoDia), trocando o estilo sozinho. Devolve
 * a imagem (data URI); lança quando não sai, e quem chama mantém a arte e a
 * frase de antes.
 */
export async function arteNoEstiloComFrase(o: {
  projectId: string;
  post: { id: string; platform: string; runId: string | null; dayOfWeek: number | null; metadata: unknown; content: string };
  frase: string;
  nicho: string | null;
}): Promise<string> {
  const modelo = estiloGravadoNoPost(o.post.metadata);
  if (!modelo || !promptDeEstiloDoModelo(modelo)) throw new Error(`o estilo ${modelo ?? "(nenhum gravado no post)"} não tem o prompt de estilo`);
  const meta = (o.post.metadata ?? {}) as { videoJobId?: unknown };
  const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
  const { desenharPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const marca = await marcaDaArte(o.projectId, { runId: o.post.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts([o.post]) });
  const doVideo = await falaEFotoDoVideo(typeof meta.videoJobId === "string" ? meta.videoJobId : null, Boolean(promptDeEstiloDoModelo(modelo)?.pessoa));
  return noMesmoEstilo(
    async () => {
      const porRede = await desenharPelaIa({ projectId: o.projectId, runId: o.post.runId, modelo, mediaType: "image", redes: [o.post.platform], frase: o.frase, textoDoPost: o.post.content, dia: o.post.dayOfWeek, nicho: o.nicho, marca, ...doVideo });
      const img = porRede[o.post.platform];
      if (!img) throw new Error("a IA não devolveu a arte desta rede");
      return img;
    },
    { tentativas: TENTATIVAS_NO_ESTILO, rotulo: `correção ${o.post.id} no ${modelo}` }
  );
}

/**
 * O AJUSTE DA ARTE PELO CHAT NO MESMO ESTILO (12/10, o pedido do Bruno que
 * saiu errado: "troca a minha foto pela que acabei de subir nos materiais,
 * diminui um pouco, faz um efeito de luz, e um recorte de papel com o globo no
 * canto de cima à direita"). O chat refazia pelo caminho antigo, lia "papel"
 * como "estilo de colagem" e trocava o estilo sozinho. Agora a peça com estilo
 * gravado é refeita NELE: o pedido vira direção de arte (pedido-da-arte.ts), a
 * pessoa sai da foto mais nova dos materiais quando foi isso que ele pediu, com
 * a escala e a luz pedidas, e o JEV confere se cada item apareceu (uma segunda
 * volta só com o que faltou). Devolve a arte por rede e o que não saiu.
 */
export async function refazerNoEstiloComPedido(o: {
  projectId: string;
  posts: Array<{ id: string; platform: string; runId: string | null; dayOfWeek: number | null; metadata: unknown; content: string | null; mediaType: string | null }>;
  pedido: string;
  nicho: string | null;
}): Promise<{ porRede: Record<string, string>; modelo: string; itens: string[]; faltaram: string[]; fotoNova: boolean }> {
  const base = o.posts.find((p) => estiloGravadoNoPost(p.metadata)) ?? o.posts[0];
  const modelo = estiloGravadoNoPost(base?.metadata);
  const estilo = modelo ? promptDeEstiloDoModelo(modelo) : null;
  if (!base || !modelo || !estilo) throw new Error("a peça não tem estilo gravado");
  const meta = (base.metadata ?? {}) as { frase?: string; slides?: unknown; infografico?: unknown; videoJobId?: string };
  const tipo = base.mediaType === "carousel" || base.mediaType === "infographic" ? base.mediaType : "image";
  const frase = typeof meta.frase === "string" && meta.frase.trim() ? meta.frase.trim() : null;
  const { reescreverPedidoDaArte, itensQueFaltaram } = await import("@/lib/media/editor-do-curso/pedido-da-arte");
  const reescrito = await reescreverPedidoDaArte({ pedido: o.pedido, frase, estilo: estilo.nomeDoEstilo, formato: tipo, projectId: o.projectId, runId: base.runId });
  const direcao = reescrito?.direcao ?? o.pedido;
  const itens = reescrito?.itens ?? [];

  // A pessoa: a foto que ele acabou de subir nos materiais, quando pediu; senão a da gravação.
  let recorteDaPessoa: string | null = null;
  let fotoNova = false;
  if (reescrito?.fotoNovaDosMateriais && estilo.pessoa) {
    const foto = await prisma.materialDoCliente.findFirst({ where: { projectId: o.projectId, tipo: "foto", status: "pronto" }, orderBy: { createdAt: "desc" }, select: { id: true, url: true, recorteUrl: true } }).catch(() => null);
    if (foto) {
      const { recorteDaPessoaParaOEstilo } = await import("@/lib/media/capa-pela-ia");
      recorteDaPessoa = await recorteDaPessoaParaOEstilo(modelo, { quadroUrl: foto.url, recorteUrl: foto.recorteUrl, chave: `materiais/${foto.id}/recorte-para-arte.png` }).catch(() => null);
      fotoNova = Boolean(recorteDaPessoa);
    }
  }
  const doVideo = await falaEFotoDoVideo(meta.videoJobId ?? null, Boolean(estilo.pessoa) && !recorteDaPessoa);
  const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
  const { desenharPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  const marca = await marcaDaArte(o.projectId, { runId: base.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts(o.posts), fotosDoPost: fotosGravadasNosPosts(o.posts) });
  const redes = [...new Set(o.posts.map((p) => p.platform))];
  const desenhar = (ajuste: string) =>
    noMesmoEstilo(
      () =>
        desenharPelaIa({
          projectId: o.projectId,
          runId: base.runId,
          modelo,
          mediaType: tipo,
          redes,
          frase,
          slides: Array.isArray(meta.slides) ? (meta.slides as string[]) : null,
          infografico: (meta.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined) ?? null,
          textoDoPost: base.content,
          dia: base.dayOfWeek,
          nicho: o.nicho,
          marca,
          fontesDosNumeros: fontesDoPost(base.metadata),
          ...doVideo,
          ...(recorteDaPessoa ? { recorteDaPessoa } : {}),
          ajuste,
          pessoa: reescrito?.pessoa ?? null,
        }),
      { tentativas: TENTATIVAS_NO_ESTILO, rotulo: `ajuste pelo chat ${base.id} no ${modelo}` }
    );
  let porRede = await desenhar(direcao);
  const principal = () => porRede[redes[0]]?.split("|")[0] ?? Object.values(porRede)[0]?.split("|")[0] ?? "";
  let faltaram = (await itensQueFaltaram({ arte: principal(), itens, projectId: o.projectId, runId: base.runId })) ?? [];
  // A volta a mais só com a chave (12/10, corte de custo: no máximo 2 imagens por arte).
  if (faltaram.length && process.env.AJUSTE_VOLTA_EXTRA === "1") {
    // Uma volta a mais, só com o que faltou na frente.
    porRede = await desenhar(`${direcao} MOST IMPORTANT, it was missing last time: ${faltaram.join("; ")}.`);
    faltaram = (await itensQueFaltaram({ arte: principal(), itens: faltaram, projectId: o.projectId, runId: base.runId })) ?? [];
  }
  return { porRede, modelo, itens, faltaram, fotoNova };
}

/** O estilo gravado no post (o modelo do curso ou a opção sob medida da semana), ou null. */
export function estiloGravadoNoPost(meta: unknown): string | null {
  const m = (meta ?? {}) as { arteNoModelo?: { modelo?: unknown } };
  return typeof m.arteNoModelo?.modelo === "string" && m.arteNoModelo.modelo ? m.arteNoModelo.modelo : null;
}

type PostDaReserva = { id: string; platform: string; mediaType: string | null; runId: string | null; dayOfWeek: number | null; metadata: unknown; content: string; imagePrompt: string | null };

/**
 * O que o vídeo dá à arte pela IA (11/10): a transcrição (o assunto de cada peça
 * sai do trecho dela) e, no estilo que põe a pessoa, o RECORTE REAL dela
 * (PNG com alfa) do quadro nítido da gravação, que o worker já devolve no
 * /melhor-quadro (ou faz no /recortar). Colado em código, nunca enviado à IA
 * de imagem (11/10). Sem vídeo, nada; falha não derruba a arte (sai sem pessoa).
 */
export async function falaEFotoDoVideo(videoJobId: string | null | undefined, querFoto: boolean): Promise<{ fala: string | null; recorteDaPessoa: string | null }> {
  if (!videoJobId) return { fala: null, recorteDaPessoa: null };
  const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { transcript: true } }).catch(() => null);
  const t = video?.transcript as { text?: unknown } | string | null | undefined;
  const fala = typeof t === "string" ? t : typeof t?.text === "string" ? t.text : null;
  let recorteDaPessoa: string | null = null;
  if (querFoto) {
    try {
      const { quadrosNitidosDoVideo } = await import("@/lib/media/quadros-nitidos");
      const { recorteDaPessoaEmDataUri } = await import("@/lib/media/capa-pela-ia");
      const chave = `cortes/${videoJobId}/arte-recorte-${Date.now().toString(36)}`;
      const [q] = await quadrosNitidosDoVideo(videoJobId, { quantos: 1, alvo: { largura: 1080, altura: 1350 }, chave });
      recorteDaPessoa = await recorteDaPessoaEmDataUri({ quadroUrl: q?.url ?? null, recorteUrl: q?.recorteUrl ?? null, chave: `${chave}-r.png` });
    } catch (e) {
      console.warn(`[arte-no-modelo] o recorte da pessoa não veio (a arte sai sem pessoa): ${e instanceof Error ? e.message : e}`);
    }
  }
  return { fala, recorteDaPessoa };
}

/**
 * O LASTRO DE UM NÚMERO DESENHADO numa arte do vídeo (11/10, decisão do Bruno):
 * a fala, o material do cliente e os dados da pesquisa com fonte rastreável que
 * o JEV disse que complementam o tema (lib/media/dados-da-arte.ts). Null sem
 * vídeo ou sem fala: aí vale o que a semana já gravou no post.
 */
export async function lastroDaArteDoVideo(videoJobId: string | null | undefined, projectId: string, nicho: string | null): Promise<LastroDaArte | null> {
  if (!videoJobId) return null;
  const video = await prisma.videoJob.findUnique({ where: { id: videoJobId }, select: { transcript: true, radar: true } }).catch(() => null);
  const t = video?.transcript as { text?: unknown } | string | null | undefined;
  const fala = typeof t === "string" ? t : typeof t?.text === "string" ? t.text : null;
  if (!fala) return null;
  const { dadosDaArteNoTema } = await import("@/lib/media/dados-da-arte");
  const dados = await dadosDaArteNoTema({ projectId, radar: video?.radar as Parameters<typeof dadosDaArteNoTema>[0]["radar"] }).catch(() => []);
  return lastroDaArte({ transcricao: fala, material: [nicho], dados });
}

/**
 * O GRUPO NO ESTILO PELA IA DE IMAGEM (11/10, arte-pela-ia.ts): o post sai do
 * Nano Banana Pro no estilo gravado nele (o modelo do curso ou a opção sob
 * medida), com o texto exato e as cores da marca, `tentativas` vezes. Devolve
 * quantos posts receberam a arte; lança quando não sai, nunca troca o estilo.
 */
async function desenharGrupoNoEstilo(projectId: string, posts: PostDaReserva[], nicho: string | null, o: { tentativas?: number } = {}): Promise<number> {
  const base = posts[0];
  const meta = (base.metadata ?? {}) as { frase?: string; slides?: unknown; infografico?: unknown; videoJobId?: string; arteNoModelo?: { modelo?: string; origem?: string } };
  const modelo = estiloGravadoNoPost(base.metadata);
  if (!modelo || !promptDeEstiloDoModelo(modelo)) throw new Error(`o estilo ${modelo ?? "(nenhum gravado no post)"} não tem o prompt de estilo para a IA desenhar`);
  const tipo = base.mediaType === "carousel" || base.mediaType === "infographic" ? base.mediaType : "image";
  // O refazer de carrossel é uma imagem só (a manchete), como hoje.
  const refazer = meta.arteNoModelo?.origem === "refazer";
  const mediaType = tipo === "carousel" && refazer ? "image" : tipo;
  const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
  const { desenharPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
  // As fotos gravadas no post (11/10, a escolha da arte): "sem meus materiais" grava a lista vazia e a Biblioteca não entra.
  const marca = await marcaDaArte(projectId, { runId: base.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts(posts), fotosDoPost: fotosGravadasNosPosts(posts) });
  const doVideo = await falaEFotoDoVideo(meta.videoJobId, Boolean(promptDeEstiloDoModelo(modelo)?.pessoa));
  // O refazer que parou (11/10) não guarda a frase velha: a peça sai da legenda nova do post.
  let frase = typeof meta.frase === "string" && meta.frase.trim() ? meta.frase : null;
  let infografico = (meta.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined) ?? null;
  const novo: Record<string, unknown> = {};
  if (mediaType === "image" && !frase) {
    const { mancheteDaPeca } = await import("@/lib/media/peca-de-feed");
    frase = (await mancheteDaPeca({ textoDoPost: base.content, estiloVisual: base.imagePrompt ?? "", nicho, projectId, runId: base.runId ?? undefined })).manchete;
    novo.frase = frase;
  }
  if (mediaType === "infographic" && !infografico?.title) {
    const chave = process.env.GEMINI_API_KEY;
    if (!chave) throw new Error("GEMINI_API_KEY não configurada");
    const { extrairConteudoDoInfografico } = await import("@/lib/media/infographic");
    // Número só com lastro de arte (11/10): a fala, o material, ou a pesquisa com fonte e no tema.
    const lastro = await lastroDaArteDoVideo(meta.videoJobId, projectId, nicho);
    const extraido = await extrairConteudoDoInfografico(base.content, nicho ?? "negocios", chave, { projectId, ...(lastro ? { numerosSoDaFala: lastro } : {}) });
    const limpo = lastro ? infograficoSoComAFala(extraido, lastro) : null;
    infografico = limpo?.conteudo ?? extraido;
    novo.infografico = infografico;
    novo.fontesDosNumeros = limpo?.fontes ?? [];
  }
  const fontesDosNumeros = (novo.fontesDosNumeros as FonteDoNumero[] | undefined) ?? fontesDoPost(base.metadata);
  const porRede = await noMesmoEstilo(
    () =>
      desenharPelaIa({
        projectId,
        runId: base.runId,
        modelo,
        mediaType,
        redes: posts.map((p) => p.platform),
        frase,
        slides: Array.isArray(meta.slides) ? meta.slides.filter((s): s is string => typeof s === "string") : null,
        infografico,
        fontesDosNumeros,
        textoDoPost: base.content,
        dia: base.dayOfWeek,
        nicho,
        marca,
        ...doVideo,
      }),
    { tentativas: o.tentativas, rotulo: `arte ${posts.map((p) => p.id).join(",")} no ${modelo}` }
  );
  if (!posts.some((p) => porRede[p.platform])) throw new Error("a IA não devolveu a arte de nenhuma rede do dia");
  const agora = new Date().toISOString();
  let gravados = 0;
  for (const p of posts) {
    const nova = porRede[p.platform];
    if (!nova) continue;
    const metaNova = fecharArte({ ...semEspera(p.metadata), ...novo }, { feitoEm: agora, reserva: null, reservaFalhou: null, pelaIa: true });
    const r = await prisma.post.updateMany({ where: { id: p.id, imageUrl: null }, data: { imageUrl: nova, metadata: metaNova as Prisma.InputJsonValue } });
    gravados += r.count;
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
  return gravados;
}


/**
 * O VIGIA DOS LOTES QUE NÃO VOLTARAM (cron da fila): post pendente cujo prazo
 * passou. O lote do template pergunta antes ao worker (`/vivo` com a chave do
 * lote): rodando ou esperando a vez, o prazo cresce 30 min (até o teto de 6 h).
 * O lote pela IA (11/10) não tem o que perguntar ao worker: refaz direto no
 * MESMO estilo. Cada volta do vigia conta; passado VOLTAS_DO_VIGIA, a peça para
 * como falha técnica com "Tentar de novo" (nunca "fazendo" para sempre, nunca
 * outro estilo). Poucos lotes por passada: cada tentativa leva minutos.
 *
 * E o conserto do estado que sobreviveu ao fato (11/10): post COM arte e
 * `arteNoModelo.pendente` ainda true (uma escrita velha por cima da arte que
 * já tinha saído) fecha aqui, sem desenhar de novo.
 */
export async function vigiarArtesNoModelo(o: { maximo?: number } = {}): Promise<{ olhados: number; estendidos: number; reserva: number; falhas: number; consertados: number }> {
  const consertados = await fecharPendentesComArte();
  const posts = await prisma.post.findMany({
    where: { imageUrl: null, status: { in: PENDENTE }, metadata: { path: ["arteNoModelo", "pendente"], equals: true } },
    select: { id: true, projectId: true, metadata: true },
    take: 80,
  });
  const agora = Date.now();
  const porLote = new Map<string, { projectId: string; ids: string[]; desde: number; naReserva: boolean; pelaIa: boolean; voltas: number }>();
  for (const p of posts) {
    const a = arteNoModeloDe(p.metadata);
    const ate = Date.parse(String((p.metadata as { gerandoArte?: { ate?: unknown } } | null)?.gerandoArte?.ate ?? ""));
    // Sem prazo legível, conta como vencido: "fazendo" sem fim é o que este vigia existe para impedir.
    if (!a || ate >= agora) continue;
    const l = porLote.get(a.lote) ?? { projectId: p.projectId, ids: [], desde: Date.parse(a.desde) || agora, naReserva: false, pelaIa: estiloVaiPelaIa(estiloGravadoNoPost(p.metadata)), voltas: 0 };
    l.ids.push(p.id);
    // A reserva que já tinha começado e não terminou (a função que roda depois da resposta morreu): refaz direto.
    if (a.reserva) l.naReserva = true;
    l.voltas = Math.max(l.voltas, Number((a as { voltasDoVigia?: unknown }).voltasDoVigia) || 0);
    porLote.set(a.lote, l);
  }
  let estendidos = 0;
  let reserva = 0;
  let falhas = 0;
  for (const [lote, l] of [...porLote.entries()].slice(0, o.maximo ?? 2)) {
    if (!l.pelaIa && !l.naReserva && (await aindaEsperaOWorker(lote, lote, agora - l.desde))) {
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
    if (l.voltas >= VOLTAS_DO_VIGIA) {
      falhas++;
      console.error(`[arte-no-modelo][${l.projectId}] lote ${lote}: ${l.voltas} voltas do vigia sem a arte sair; para como falha técnica, sem trocar o estilo`);
      await pararComoFalha(l.ids, `o desenho no estilo não terminou depois de ${l.voltas} voltas do vigia`);
      continue;
    }
    reserva++;
    const motivo = l.pelaIa ? "o desenho pela IA não terminou no prazo" : "a arte do modelo não voltou no prazo";
    console.warn(`[arte-no-modelo][${l.projectId}] lote ${lote}: ${motivo}; de novo no mesmo estilo (volta ${l.voltas + 1} de ${VOLTAS_DO_VIGIA})`);
    await marcarReserva(l.ids, motivo, { doVigia: true });
    await desenharNoMesmoEstilo(l.projectId, l.ids, motivo, { tentativas: l.pelaIa ? TENTATIVAS_NO_ESTILO : 1 });
  }
  return { olhados: porLote.size, estendidos, reserva, falhas, consertados };
}

/** A falha técnica no quadro ("Tentar de novo", "Nada foi cobrado"), com o lote fechado. */
async function pararComoFalha(postIds: string[], erro: string): Promise<void> {
  for (const id of postIds) {
    const atual = await prisma.post.findUnique({ where: { id }, select: { metadata: true, imageUrl: true } });
    if (!atual || atual.imageUrl) continue;
    await prisma.post.update({ where: { id }, data: { metadata: fecharArte(marcarFalha(atual.metadata, MOTIVO_DA_ARTE_QUE_PAROU), { reservaFalhou: erro.slice(0, 300) }) as Prisma.InputJsonValue } }).catch(() => {});
  }
}

/** Os posts com arte e o lote ainda pendente: o estado velho que uma escrita deixou (11/10). Fecha, sem desenhar. */
async function fecharPendentesComArte(): Promise<number> {
  const posts = await prisma.post.findMany({
    where: { imageUrl: { not: null }, status: { in: PENDENTE }, metadata: { path: ["arteNoModelo", "pendente"], equals: true } },
    select: { id: true, metadata: true },
    take: 80,
  });
  let n = 0;
  for (const p of posts) {
    const r = await prisma.post.updateMany({
      where: { id: p.id, imageUrl: { not: null } },
      data: { metadata: metadataComMudancas(p.metadata, {}, { arteNovaNoEstilo: true }) as Prisma.InputJsonValue },
    });
    n += r.count;
  }
  if (n) console.warn(`[arte-no-modelo] ${n} post(s) com arte e o lote ainda pendente: fechados (a arte já tinha saído)`);
  return n;
}

/**
 * O REFAZER DE UMA PEÇA (lib/pipeline/refazer-peca.ts) no ESTILO ESCOLHIDO: a
 * peça da semana do vídeo que segue a regra sai no mesmo estilo (a manchete do
 * texto novo; o infográfico, o conteúdo extraído dele). Pela IA (o padrão, e
 * sempre na edição sob medida), aqui mesmo, com duas tentativas; pelo template,
 * num lote de UMA peça no worker (recusado, a segunda tentativa pela IA).
 *
 * Devolve null SÓ quando a peça não segue estilo nenhum (regra que não vale):
 * aí o refazer desenha pelo caminho de hoje. Com estilo, nunca: a arte que não
 * sair volta em `falhou`, com o metadata da falha técnica ("Tentar de novo" no
 * quadro, `cobrarAoSair`: o refazer cobra só o texto, e a arte quando sair).
 */
export async function refazerArteNoModelo(o: {
  post: { id: string; projectId: string; platform: string; mediaType: string | null; runId: string | null; metadata: unknown; imagePrompt: string | null };
  texto: string;
  nicho: string | null;
}): Promise<{ metadata: Record<string, unknown>; imagem?: string; falhou?: string } | null> {
  if (!arteDoModeloLigada()) return null;
  const meta = (o.post.metadata ?? {}) as Record<string, unknown>;
  if (meta.origem !== "video") return null;
  const formato = o.post.mediaType ?? "";
  if (!["image", "carousel", "infographic"].includes(formato)) return null;
  const regra = await regraDaArtePeloModelo(o.post.projectId);
  if (!regra) return null;
  const fotos = fotosGravadasNosPosts([o.post]);
  if (!diaVaiPeloModelo({ formato, modeloDoDia: modeloGravadoNosPosts([o.post]), modo: regra.modo, fotosDoDia: fotos?.length ?? 0 })) return null;
  const formatoDoPost = formatoNoModelo(o.post.platform, formato);
  let extra: Record<string, unknown> = {};
  // A peça que não saiu no estilo: a falha técnica, sem a frase velha (o "Tentar de novo" tira a manchete do texto novo).
  const comFalha = (erro: unknown): { metadata: Record<string, unknown>; falhou: string } => {
    const motivo = (erro instanceof Error ? erro.message : String(erro)).slice(0, 300);
    console.error(`[arte-no-modelo][${o.post.projectId}] o refazer de ${o.post.id} não saiu no estilo ${regra.modelo} (${motivo}); para como falha técnica, sem trocar o estilo`);
    const { arteNoModelo: _antiga, frase: _frase, infografico: _info, ...resto } = meta;
    void _antiga;
    void _frase;
    void _info;
    const agora = new Date().toISOString();
    const base = { ...resto, ...extra, arteNoModelo: { lote: `refazer-${o.post.id}`, indices: [1], formato: formatoDoPost, modelo: regra.modelo, pendente: false, origem: "refazer", desde: agora, reservaFalhou: motivo, cobrarAoSair: true } };
    return { metadata: marcarFalha(base, MOTIVO_DA_ARTE_QUE_PAROU), falhou: motivo };
  };
  let peca: PecaDoLote;
  try {
    if (formato === "infographic") {
      const chave = process.env.GEMINI_API_KEY;
      if (!chave) throw new Error("GEMINI_API_KEY não configurada");
      const { extrairConteudoDoInfografico } = await import("@/lib/media/infographic");
      const lastro = await lastroDaArteDoVideo(typeof meta.videoJobId === "string" ? meta.videoJobId : null, o.post.projectId, o.nicho);
      const extraido = await extrairConteudoDoInfografico(o.texto, o.nicho ?? "negocios", chave, { projectId: o.post.projectId, ...(lastro ? { numerosSoDaFala: lastro } : {}) });
      const limpo = lastro ? infograficoSoComAFala(extraido, lastro) : null;
      if (limpo?.refazer) throw new Error("o título do infográfico só tinha número sem lastro");
      const conteudo = limpo?.conteudo ?? extraido;
      peca = { tipo: "infografico", texto: textoDoInfograficoNoModelo(conteudo), formatos: [formatoDoPost] };
      extra = { infografico: conteudo, fontesDosNumeros: limpo?.fontes ?? [] };
    } else {
      const { mancheteDaPeca } = await import("@/lib/media/peca-de-feed");
      const m = await mancheteDaPeca({ textoDoPost: o.texto, estiloVisual: o.post.imagePrompt ?? "", nicho: o.nicho, projectId: o.post.projectId, runId: o.post.runId ?? undefined });
      peca = { tipo: formato === "carousel" ? "capa" : "post", texto: m.manchete, formatos: [formatoDoPost] };
      extra = { frase: m.manchete };
    }
  } catch (e) {
    return comFalha(e);
  }
  // PELA IA (11/10): o refazer de UMA peça desenha aqui mesmo (uma imagem, um a
  // dois minutos), e o post sai do refazer já com a arte. A edição sob medida vai sempre por aqui.
  const desenharAqui = async (tentativas: number): Promise<{ metadata: Record<string, unknown>; imagem: string }> => {
    const { marcaDaArte } = await import("@/lib/media/arte-com-frase");
    const { desenharPelaIa, noMesmoEstilo } = await import("@/lib/media/editor-do-curso/arte-pela-ia-servidor");
    const marca = await marcaDaArte(o.post.projectId, { runId: o.post.runId ?? undefined, modeloDoPost: modeloGravadoNosPosts([o.post]) });
    const doVideo = await falaEFotoDoVideo(typeof meta.videoJobId === "string" ? meta.videoJobId : null, Boolean(promptDeEstiloDoModelo(regra.modelo)?.pessoa));
    const imagem = await noMesmoEstilo(
      async () => {
        const porRede = await desenharPelaIa({
          projectId: o.post.projectId,
          runId: o.post.runId,
          modelo: regra.modelo,
          mediaType: formato === "infographic" ? "infographic" : "image",
          redes: [o.post.platform],
          frase: typeof extra.frase === "string" ? extra.frase : null,
          infografico: (extra.infografico as import("@/lib/media/infographic").ConteudoDoInfografico | undefined) ?? null,
          fontesDosNumeros: (extra.fontesDosNumeros as FonteDoNumero[] | undefined) ?? [],
          textoDoPost: o.texto,
          dia: (o.post as { dayOfWeek?: number | null }).dayOfWeek ?? null,
          nicho: o.nicho,
          marca,
          ...doVideo,
        });
        const img = porRede[o.post.platform];
        if (!img) throw new Error("a IA não devolveu a arte desta rede");
        return img;
      },
      { tentativas, rotulo: `refazer ${o.post.id} no ${regra.modelo}` }
    );
    const agora = new Date().toISOString();
    const { arteNoModelo: _antiga, ...resto } = { ...meta, ...extra } as Record<string, unknown>;
    void _antiga;
    return { metadata: semEspera({ ...resto, arteNoModelo: { lote: `refazer-${o.post.id}`, indices: [1], formato: formatoDoPost, modelo: regra.modelo, pendente: false, origem: "refazer", desde: agora, feitoEm: agora, pelaIa: true } }), imagem };
  };
  if (estiloVaiPelaIa(regra.modelo)) {
    try {
      return await desenharAqui(TENTATIVAS_NO_ESTILO);
    } catch (e) {
      return comFalha(e);
    }
  }
  // PELO TEMPLATE DO WORKER (ARTE_PELO_MODELO_IA=0): a primeira tentativa; recusado, a segunda pela IA no mesmo estilo.
  const chave = `refazer-${o.post.id}-${Date.now().toString(36)}`;
  try {
    const base = await baseDoPedido(o.post.projectId, o.post.runId, { videoJobId: typeof meta.videoJobId === "string" ? meta.videoJobId : null, quantas: 3 });
    const r = await enviarLoteAoWorker({ chave, projectId: o.post.projectId, runId: o.post.runId, modelo: regra.modelo, pecas: [peca], base });
    if (!r.ok) throw new Error(r.erro);
  } catch (e) {
    console.warn(`[arte-no-modelo][${o.post.projectId}] o template não aceitou o refazer de ${o.post.id} (${e instanceof Error ? e.message : e}); segunda tentativa no mesmo estilo, pela IA`);
    try {
      return await desenharAqui(1);
    } catch (e2) {
      return comFalha(e2);
    }
  }
  return { metadata: marcasDoModelo({ ...meta, ...extra }, { lote: chave, indices: [1], formato: formatoDoPost, modelo: regra.modelo, origem: "refazer" }) };
}
