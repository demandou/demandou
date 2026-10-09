import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { creditar } from "@/lib/credits";
import { creditarVideo, jaCreditado } from "@/lib/credits/video";
import { custoDeRefazerPeca } from "@/lib/credits/estimativa";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { notificar, type Aviso } from "@/lib/notificacoes";
import { avisarAdmins, type AvisoAosAdmins } from "@/lib/notificacoes/aviso-aos-admins";
import { provasDaPeca } from "@/lib/credits/provas-da-peca";
import { conferirReprovacaoPeloJev, type ConferenciaDaReprovacao, type Perguntador, type ProvasDaPeca } from "@/lib/credits/reprovacao-pelo-jev";
import { OPERACAO_DA_SOBRA_DO_AJUSTE, refDoAjustePeloAdmin } from "@/lib/credits/ajuste";
import {
  NOME_DA_CATEGORIA,
  agregarMotivos,
  ajusteADevolver,
  ajusteDeVideoADevolver,
  chaveDoSinoDaReprovacao,
  classeDaCategoria,
  creditosADevolver,
  decidirReprovacao,
  fraseDaSituacao,
  lerEstadoDaReprovacao,
  refazerSemCobrar,
  validarMotivo,
  type DecisaoDoAdmin,
  type EstadoDaReprovacao,
  type MotivoDeReprovacao,
} from "@/lib/credits/reprovacao";

/**
 * A REPROVAÇÃO COM MOTIVO, NO SERVIDOR (08/10/2026). A regra mora em
 * lib/credits/reprovacao.ts (pura) e a conferência em
 * lib/credits/reprovacao-pelo-jev.ts; aqui é o fluxo com o banco, o extrato,
 * o sino e a memória do cliente. Tudo o que toca o banco passa pelo
 * `DepositoDaReprovacao`, trocável nos testes (scripts/testes/
 * reprovacao-com-motivo-0810.test.mts) por um em memória.
 *
 * A DEVOLUÇÃO É UMA LINHA POSITIVA NO EXTRATO, uma vez só: `creditar` com
 * `unico` e o refId "<post>:<reprovação>", o padrão dos estornos
 * (lib/credits/estorno-*.ts). O caminho do JEV e o do admin usam o MESMO
 * refId, então nem a corrida entre os dois devolve duas vezes. A operação não
 * começa com "estorno" de propósito: o observador do cron avisa qualquer
 * "estorno*" com a frase genérica, e esta devolução tem o aviso dela.
 *
 * A TABELA motivos_de_reprovacao fica fora do schema do Prisma (SQL cru,
 * como perfis_dos_projetos): o código antigo não cai no intervalo entre a
 * migração e o deploy, e sem a tabela a reprovação continua funcionando (o
 * estado vive em post.metadata.reprovacao e na memória do cliente; só o
 * agregado do admin fica vazio até a migração rodar).
 */

export const OPERACAO_DA_DEVOLUCAO = "reprovacao_devolucao";
export const TIPO_DA_MEMORIA = "motivo-de-reprovacao";
export const refDaDevolucao = (postId: string, reprovacaoId: string) => `${postId}:${reprovacaoId}`;

export type PecaParaReprovar = {
  id: string;
  projectId: string;
  projectUserId: string;
  platform: string;
  content: string;
  imageUrl: string | null;
  mediaType: string | null;
  metadata: unknown;
  runId: string | null;
  dayOfWeek: number | null;
  status: string;
};

export type DepositoDaReprovacao = {
  peca(postId: string): Promise<PecaParaReprovar | null>;
  podeUsar(userId: string, projeto: { id: string; userId: string }): Promise<boolean>;
  /** Grava o status e o metadata do post (status null: só o metadata). */
  gravarPeca(postId: string, dados: { status: string | null; metadata: Record<string, unknown> }): Promise<void>;
  /** Quanto a campanha (ou os refazeres) desta peça cobrou de verdade, em créditos (positivo). */
  cobradoDaPeca(p: { runId: string | null; postId: string }): Promise<number>;
  /** Quanto já voltou por reprovação nas peças desta campanha. */
  jaDevolvidoDaCampanha(p: { runId: string | null; postId: string }): Promise<number>;
  creditar(a: { userId: string; quantidade: number; refId: string; note: string }): Promise<{ duplicado: boolean }>;
  /** O que a fila do vídeo por IA cobrou de fato por esta referência (débito menos estornos), em créditos de vídeo (09/10). */
  cobradoDoVideo?(referencia: string): Promise<number>;
  /** Credita a carteira de VÍDEO, uma vez só por refId (09/10). */
  creditarVideo?(a: { userId: string; quantidade: number; refId: string; note: string }): Promise<{ duplicado: boolean }>;
  provas(peca: PecaParaReprovar): Promise<ProvasDaPeca>;
  gravarMotivo(m: MotivoDeReprovacao): Promise<void>;
  atualizarMotivo(id: string, campos: Partial<MotivoDeReprovacao>): Promise<void>;
  motivo(id: string): Promise<MotivoDeReprovacao | null>;
  memoria(projectId: string, postId: string, valor: Record<string, unknown>): Promise<void>;
  notificar(aviso: Aviso): Promise<void>;
  avisarAdmins(aviso: AvisoAosAdmins): Promise<void>;
  registrarAcaoDoAdmin(admin: { id: string; email: string }, alvo: { id: string | null; email: string }, acao: string, detalhe: unknown): Promise<void>;
  agora(): Date;
  novoId(): string;
};

let tabelaConferidaEm = 0;
let tabelaExiste = false;

/** A tabela motivos_de_reprovacao já nasceu neste banco? (conferida de minuto em minuto) */
export async function tabelaDosMotivosExiste(): Promise<boolean> {
  if (Date.now() - tabelaConferidaEm < 60_000) return tabelaExiste;
  try {
    const r = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'motivos_de_reprovacao'`
    );
    tabelaExiste = Number(r[0]?.n ?? 0) === 1;
  } catch {
    tabelaExiste = false;
  }
  tabelaConferidaEm = Date.now();
  return tabelaExiste;
}

type LinhaDoMotivo = Omit<MotivoDeReprovacao, "reprovadaEm" | "decididaEm"> & { reprovadaEm: Date; decididaEm: Date | null };

const daLinha = (l: LinhaDoMotivo): MotivoDeReprovacao => ({
  ...l,
  creditosDevolvidos: Number(l.creditosDevolvidos),
  custoDaPeca: Number(l.custoDaPeca),
  reprovadaEm: new Date(l.reprovadaEm).toISOString(),
  decididaEm: l.decididaEm ? new Date(l.decididaEm).toISOString() : null,
});

function depositoPadrao(): DepositoDaReprovacao {
  return {
    async peca(postId) {
      const p = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, projectId: true, platform: true, content: true, imageUrl: true, mediaType: true, metadata: true, runId: true, dayOfWeek: true, status: true, project: { select: { userId: true } } },
      });
      if (!p) return null;
      return { ...p, projectUserId: p.project.userId };
    },
    podeUsar: (userId, projeto) => podeUsarProjeto(userId, projeto),
    async gravarPeca(postId, dados) {
      await prisma.post.update({ where: { id: postId }, data: { ...(dados.status ? { status: dados.status } : {}), metadata: dados.metadata as Prisma.InputJsonValue } });
    },
    async cobradoDaPeca({ runId, postId }) {
      const [campanha, refazeres, sobras] = await Promise.all([
        runId ? prisma.creditTransaction.aggregate({ where: { operation: "campanha", refId: runId, amount: { lt: 0 } }, _sum: { amount: true } }) : null,
        prisma.creditTransaction.aggregate({ where: { operation: "refazer_peca", refId: { startsWith: `${postId}:` }, amount: { lt: 0 } }, _sum: { amount: true } }),
        // A parte do ajuste que não saiu já voltou (09/10): não conta como cobrada.
        prisma.creditTransaction.aggregate({ where: { operation: OPERACAO_DA_SOBRA_DO_AJUSTE, refId: { startsWith: `${postId}:` }, amount: { gt: 0 } }, _sum: { amount: true } }),
      ]);
      return Math.max(0, -((campanha?._sum.amount ?? 0) + (refazeres._sum.amount ?? 0)) - (sobras._sum.amount ?? 0));
    },
    async jaDevolvidoDaCampanha({ runId, postId }) {
      if (!(await tabelaDosMotivosExiste())) {
        const r = await prisma.creditTransaction.aggregate({ where: { operation: OPERACAO_DA_DEVOLUCAO, refId: { startsWith: `${postId}:` }, amount: { gt: 0 } }, _sum: { amount: true } });
        return r._sum.amount ?? 0;
      }
      const r = runId
        ? await prisma.$queryRawUnsafe<Array<{ n: number }>>(`SELECT COALESCE(SUM("creditosDevolvidos"), 0)::int AS n FROM motivos_de_reprovacao WHERE "runId" = $1`, runId)
        : await prisma.$queryRawUnsafe<Array<{ n: number }>>(`SELECT COALESCE(SUM("creditosDevolvidos"), 0)::int AS n FROM motivos_de_reprovacao WHERE "postId" = $1`, postId);
      return Number(r[0]?.n ?? 0);
    },
    async creditar(a) {
      const r = await creditar({ userId: a.userId, quantidade: a.quantidade, operation: OPERACAO_DA_DEVOLUCAO, refId: a.refId, note: a.note, unico: true });
      return { duplicado: r.duplicado };
    },
    async cobradoDoVideo(referencia) {
      const [debito, estornos] = await Promise.all([
        prisma.creditTransaction.aggregate({ where: { operation: "video_ia", refId: referencia, amount: { lt: 0 } }, _sum: { amount: true } }),
        prisma.creditTransaction.aggregate({ where: { operation: "estorno_video_ia", refId: { in: [referencia, `${referencia}:sobra`] }, amount: { gt: 0 } }, _sum: { amount: true } }),
      ]);
      return Math.max(0, -(debito._sum.amount ?? 0) - (estornos._sum.amount ?? 0));
    },
    async creditarVideo(a) {
      // Uma vez só: a decisão do admin já é única por reprovação, e o refId fecha a corrida.
      if (await jaCreditado(OPERACAO_DA_DEVOLUCAO, a.refId)) return { duplicado: true };
      await creditarVideo({ userId: a.userId, quantidade: a.quantidade, operation: OPERACAO_DA_DEVOLUCAO, refId: a.refId, note: a.note });
      return { duplicado: false };
    },
    provas: (peca) => provasDaPeca(peca),
    async gravarMotivo(m) {
      if (!(await tabelaDosMotivosExiste())) return;
      await prisma.$executeRawUnsafe(
        `INSERT INTO motivos_de_reprovacao (id, "postId", "projectId", "userId", "runId", categoria, texto, "vereditoDoJev", "decididoPor", provas, "decisaoDoAdmin", "adminId", "motivoDoAdmin", situacao, "creditosDevolvidos", "custoDaPeca", "reprovadaEm", "decididaEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17::timestamp, $18::timestamp)
         ON CONFLICT (id) DO NOTHING`,
        m.id, m.postId, m.projectId, m.userId, m.runId, m.categoria, m.texto, m.vereditoDoJev, m.decididoPor, JSON.stringify(m.provas ?? null), m.decisaoDoAdmin, m.adminId, m.motivoDoAdmin, m.situacao, m.creditosDevolvidos, m.custoDaPeca, m.reprovadaEm, m.decididaEm
      );
    },
    async atualizarMotivo(id, c) {
      if (!(await tabelaDosMotivosExiste())) return;
      await prisma.$executeRawUnsafe(
        `UPDATE motivos_de_reprovacao SET "decisaoDoAdmin" = $2, "adminId" = $3, "motivoDoAdmin" = $4, situacao = $5, "creditosDevolvidos" = $6, "decididaEm" = $7::timestamp, "decididoPor" = $8 WHERE id = $1`,
        id, c.decisaoDoAdmin ?? null, c.adminId ?? null, c.motivoDoAdmin ?? null, c.situacao ?? "em_analise", c.creditosDevolvidos ?? 0, c.decididaEm ?? null, c.decididoPor ?? null
      );
    },
    async motivo(id) {
      if (!(await tabelaDosMotivosExiste())) return null;
      const r = await prisma.$queryRawUnsafe<LinhaDoMotivo[]>(`SELECT * FROM motivos_de_reprovacao WHERE id = $1`, id);
      return r[0] ? daLinha(r[0]) : null;
    },
    async memoria(projectId, postId, valor) {
      await prisma.projectMemory.upsert({
        where: { projectId_type_key: { projectId, type: TIPO_DA_MEMORIA, key: postId } },
        create: { projectId, type: TIPO_DA_MEMORIA, key: postId, value: valor as Prisma.InputJsonValue },
        update: { value: valor as Prisma.InputJsonValue },
      });
    },
    async notificar(aviso) {
      await notificar(aviso);
    },
    async avisarAdmins(aviso) {
      await avisarAdmins(aviso);
    },
    async registrarAcaoDoAdmin(admin, alvo, acao, detalhe) {
      await prisma.acaoDeAdmin.create({ data: { adminId: admin.id, adminEmail: admin.email, alvoId: alvo.id, alvoEmail: alvo.email, acao, detalhe: detalhe as Prisma.InputJsonValue } });
    },
    agora: () => new Date(),
    novoId: () => randomUUID().replace(/-/g, "").slice(0, 24),
  };
}

export type FalhaAoReprovar = { erro: "nao_encontrado" } | { erro: "ja_publicado" } | { erro: "motivo_invalido"; mensagem: string };

export type ResultadoDaReprovacao = { ok: true; estado: EstadoDaReprovacao; frase: string } | ({ ok: false } & FalhaAoReprovar);

const laminasDe = (imageUrl: string | null) => (imageUrl ?? "").split("|").filter((u) => u.trim().length > 10).length;

function valorDaMemoria(m: MotivoDeReprovacao, peca: Pick<PecaParaReprovar, "platform" | "content">): Record<string, unknown> {
  const origem = (m.provas as { origem?: unknown } | null)?.origem === "ajuste" ? "ajuste" : "reprovacao";
  return {
    origem,
    categoria: m.categoria,
    categoriaNome: NOME_DA_CATEGORIA[m.categoria],
    classe: classeDaCategoria(m.categoria),
    texto: m.texto,
    situacao: m.situacao,
    vereditoDoJev: m.vereditoDoJev,
    decididoPor: m.decididoPor,
    decisaoDoAdmin: m.decisaoDoAdmin,
    creditosDevolvidos: m.creditosDevolvidos,
    rede: peca.platform,
    trecho: peca.content.slice(0, 240),
    reprovadaEm: m.reprovadaEm,
    decididaEm: m.decididaEm,
  };
}

function avisoAoCliente(peca: PecaParaReprovar, estado: EstadoDaReprovacao, userId: string): Aviso | null {
  // A página do quadro é /live (a /content dava 404 desde 08/10).
  const link = `/projects/${peca.projectId}/live`;
  const chave = chaveDoSinoDaReprovacao(estado, peca.id);
  // O motivo de um PEDIDO DE AJUSTE (09/10): a peça segue viva e é refeita agora.
  const doAjuste = estado.origem === "ajuste";
  if (estado.situacao === "devolvido") {
    return {
      userId,
      projectId: peca.projectId,
      tipo: estado.creditos > 0 ? "estorno" : "reprovacao",
      titulo: estado.creditos > 0 ? `Devolvemos ${estado.creditos.toLocaleString("pt-BR")} créditos` : doAjuste ? "Erro confirmado: o ajuste é grátis" : "Erro confirmado: refazer é grátis",
      texto: `O erro que você apontou (${NOME_DA_CATEGORIA[estado.categoria].toLowerCase()}) foi confirmado pelas provas automáticas. ${estado.creditos > 0 ? "Os créditos da peça voltaram ao seu saldo e já estão no extrato. " : ""}${doAjuste ? "O ajuste que você pediu sai sem cobrança." : "Refazer esta peça não cobra."}`,
      link,
      chave,
    };
  }
  if (estado.situacao === "em_analise") {
    return {
      userId,
      projectId: peca.projectId,
      tipo: "reprovacao",
      titulo: doAjuste ? "Recebemos o motivo do ajuste" : "Recebemos o motivo da reprovação",
      texto: doAjuste
        ? `As provas automáticas não confirmaram sozinhas o erro apontado (${NOME_DA_CATEGORIA[estado.categoria].toLowerCase()}). O ajuste foi feito e cobrado; um admin vai olhar a peça, o motivo e as provas, e se reconhecer o erro os créditos voltam. Você recebe a resposta aqui.`
        : `As provas automáticas não confirmaram sozinhas o erro apontado (${NOME_DA_CATEGORIA[estado.categoria].toLowerCase()}). Um admin vai olhar a peça, o motivo e as provas, e você recebe a resposta aqui.`,
      link,
      chave,
    };
  }
  return null;
}

/**
 * REPROVAR UMA PEÇA COM MOTIVO. Grava o status, decide (código, JEV ou fila
 * do admin), devolve quando é o caso, registra e avisa. O ato no cérebro do
 * cliente é da rota (after), para não segurar a resposta.
 */
export async function reprovarPeca(
  args: {
    postId: string;
    userId: string;
    categoria: unknown;
    texto: unknown;
    /** Para a prova: as provas já juntadas, e o JEV de mentira. */
    provas?: ProvasDaPeca;
    perguntar?: Perguntador;
    usarJev?: boolean;
    /**
     * O MOTIVO DE UM PEDIDO DE AJUSTE (09/10, lib/credits/ajuste-servidor.ts):
     * a mesma regra, conferência e devolução, mas a peça NÃO morre (o status
     * fica) e é refeita em seguida. O registro e a memória dizem "ajuste".
     */
    comoAjuste?: { pedidoId: string; pedido: string };
  },
  dep: DepositoDaReprovacao = depositoPadrao()
): Promise<ResultadoDaReprovacao> {
  const peca = await dep.peca(args.postId);
  if (!peca || !(await dep.podeUsar(args.userId, { id: peca.projectId, userId: peca.projectUserId }))) return { ok: false, erro: "nao_encontrado" };
  if (peca.status === "published" || peca.status === "publishing") return { ok: false, erro: "ja_publicado" };
  const motivo = validarMotivo({ categoria: args.categoria, texto: args.texto });
  if (!motivo.ok) return { ok: false, erro: "motivo_invalido", mensagem: motivo.erro };
  const doAjuste = Boolean(args.comoAjuste);

  const agora = dep.agora();
  const id = dep.novoId();
  const custoDaPeca = custoDeRefazerPeca({ mediaType: peca.mediaType, laminas: laminasDe(peca.imageUrl) });

  let provas: ProvasDaPeca | null = null;
  let conferencia: ConferenciaDaReprovacao | null = null;
  if (classeDaCategoria(motivo.categoria) === "erro") {
    provas = args.provas ?? (await dep.provas(peca).catch(() => null));
    if (provas) {
      conferencia = await conferirReprovacaoPeloJev({ projectId: peca.projectId, categoria: motivo.categoria, texto: motivo.texto, provas, perguntar: args.perguntar, usarJev: args.usarJev });
    } else {
      conferencia = { veredito: "sem_prova", por: "ninguem", detalhe: "as provas automáticas não puderam ser juntadas", nota: null };
    }
  }
  const decisao = decidirReprovacao({ categoria: motivo.categoria, veredito: conferencia?.veredito ?? null });

  let creditos = 0;
  if (decisao.situacao === "devolvido") {
    const [cobrado, jaDevolvido] = await Promise.all([dep.cobradoDaPeca({ runId: peca.runId, postId: peca.id }), dep.jaDevolvidoDaCampanha({ runId: peca.runId, postId: peca.id })]);
    creditos = creditosADevolver({ custoDaPeca, cobradoNaCampanha: cobrado, jaDevolvidoNaCampanha: jaDevolvido });
    if (creditos > 0) {
      const r = await dep.creditar({ userId: args.userId, quantidade: creditos, refId: refDaDevolucao(peca.id, id), note: `devolução: peça reprovada por ${NOME_DA_CATEGORIA[motivo.categoria].toLowerCase()}, erro confirmado (${conferencia?.detalhe ?? "prova automática"})` });
      if (r.duplicado) creditos = 0;
    }
  }

  const estado: EstadoDaReprovacao = {
    id,
    categoria: motivo.categoria,
    texto: motivo.texto,
    situacao: decisao.situacao,
    creditos,
    veredito: conferencia?.veredito ?? null,
    decididoPor: conferencia?.por ?? "codigo",
    motivo: decisao.situacao === "devolvido" && conferencia ? `${decisao.motivo} (${conferencia.detalhe})` : decisao.motivo,
    reprovadaEm: agora.toISOString(),
    decididaEm: decisao.situacao === "em_analise" ? null : agora.toISOString(),
    refeitaGratisEm: null,
    ...(args.comoAjuste ? { origem: "ajuste" as const, ajuste: { id: args.comoAjuste.pedidoId, cobrado: 0, devolvido: 0 } } : {}),
  };
  // O ajuste por GOSTO não apaga o refazer grátis que a peça ainda guarda de um
  // erro confirmado antes (09/10): ele continua valendo para um ajuste por erro.
  // O motivo do gosto fica no registro e na memória; o estado da peça, como estava.
  const guardaOGratis = doAjuste && classeDaCategoria(motivo.categoria) === "gosto" && refazerSemCobrar(lerEstadoDaReprovacao(peca.metadata));
  if (!guardaOGratis) {
    const metadata = { ...((peca.metadata as Record<string, unknown> | null) ?? {}), reprovacao: estado };
    // O ajuste não mata a peça: ela é refeita e volta a rascunho pelo caminho do refazer.
    await dep.gravarPeca(peca.id, { status: doAjuste ? null : "rejected", metadata });
  }

  const registro: MotivoDeReprovacao = {
    id,
    postId: peca.id,
    projectId: peca.projectId,
    userId: args.userId,
    runId: peca.runId,
    categoria: motivo.categoria,
    texto: motivo.texto,
    vereditoDoJev: conferencia?.veredito ?? null,
    decididoPor: conferencia?.por ?? "codigo",
    provas: provas
      ? { ...provas, conferencia: conferencia?.detalhe ?? null, texto: undefined, ...(args.comoAjuste ? { origem: "ajuste", pedido: args.comoAjuste.pedido.slice(0, 500) } : {}) }
      : args.comoAjuste
        ? { origem: "ajuste", pedido: args.comoAjuste.pedido.slice(0, 500) }
        : null,
    decisaoDoAdmin: null,
    adminId: null,
    motivoDoAdmin: null,
    situacao: decisao.situacao,
    creditosDevolvidos: creditos,
    custoDaPeca,
    reprovadaEm: estado.reprovadaEm,
    decididaEm: estado.decididaEm,
  };
  await dep.gravarMotivo(registro).catch((e) => console.warn("[reprovacao] motivo não gravado na tabela:", e instanceof Error ? e.message : e));
  await dep.memoria(peca.projectId, peca.id, valorDaMemoria(registro, peca)).catch((e) => console.warn("[reprovacao] memória não gravada:", e instanceof Error ? e.message : e));

  const aviso = avisoAoCliente(peca, estado, args.userId);
  if (aviso) await dep.notificar(aviso).catch(() => undefined);
  if (decisao.situacao === "em_analise") {
    await dep
      .avisarAdmins({
        chave: `reprovacao:${id}`,
        titulo: doAjuste ? "Ajuste para decidir" : "Reprovação para decidir",
        texto: `${NOME_DA_CATEGORIA[motivo.categoria]}: ${motivo.texto.slice(0, 140) || "sem texto"}. As provas não confirmaram; decida devolver ou manter.${doAjuste ? " O ajuste já foi refeito e cobrado; devolver inclui o que ele cobrou." : ""}`,
        link: "/admin/reprovacoes",
        assunto: doAjuste ? "Pedido de ajuste para decidir" : "Reprovação de peça para decidir",
        corpo: `Peça ${peca.id} do projeto ${peca.projectId}, rede ${peca.platform}.\n${doAjuste ? `Pedido de ajuste pelo chat do card: ${args.comoAjuste!.pedido.slice(0, 300)}\n` : ""}Motivo: ${NOME_DA_CATEGORIA[motivo.categoria]}.\nTexto do cliente: ${motivo.texto || "(sem texto)"}.\nConferência: ${conferencia?.detalhe ?? "sem provas"}.\nCusto da peça: ${custoDaPeca} créditos.\n\n/admin/reprovacoes`,
      })
      .catch(() => undefined);
  }
  return { ok: true, estado, frase: fraseDaSituacao(estado) };
}

export type ResultadoDaDecisao = { ok: true; estado: EstadoDaReprovacao } | { ok: false; erro: "nao_encontrada" | "ja_decidida" | "peca_sumiu" };

/**
 * A DECISÃO DO ADMIN NA FILA: devolver ou manter. Uma vez só por reprovação
 * (a segunda chamada volta "ja_decidida"), e a devolução usa o mesmo refId do
 * caminho automático, então nunca sai duas vezes.
 */
export async function decidirReprovacaoPeloAdmin(
  args: { admin: { id: string; email: string }; id: string; decisao: DecisaoDoAdmin; motivo?: string | null },
  dep: DepositoDaReprovacao = depositoPadrao()
): Promise<ResultadoDaDecisao> {
  const m = await dep.motivo(args.id);
  if (!m) return { ok: false, erro: "nao_encontrada" };
  if (m.situacao !== "em_analise") return { ok: false, erro: "ja_decidida" };
  const peca = await dep.peca(m.postId);
  if (!peca) return { ok: false, erro: "peca_sumiu" };
  const agora = dep.agora();
  const motivoDoAdmin = (args.motivo ?? "").replace(/\s+/g, " ").trim().slice(0, 500) || null;

  // O estado gravado na peça só vale se é DESTA reprovação (a peça pode ter outra, mais nova).
  const gravado = lerEstadoDaReprovacao(peca.metadata);
  const anterior = gravado?.id === m.id ? gravado : null;
  let creditos = 0;
  /** O que o ajuste cobrou e volta junto (09/10): erro reconhecido refaz de graça, e o refazer já foi feito e pago. */
  let doAjuste = 0;
  /** Os créditos de VÍDEO do ajuste do vídeo por IA que voltam (09/10). */
  let deVideo = 0;
  if (args.decisao === "devolver") {
    const [cobrado, jaDevolvido] = await Promise.all([dep.cobradoDaPeca({ runId: m.runId, postId: m.postId }), dep.jaDevolvidoDaCampanha({ runId: m.runId, postId: m.postId })]);
    creditos = creditosADevolver({ custoDaPeca: m.custoDaPeca, cobradoNaCampanha: cobrado, jaDevolvidoNaCampanha: jaDevolvido });
    if (creditos > 0) {
      const r = await dep.creditar({ userId: m.userId, quantidade: creditos, refId: refDaDevolucao(m.postId, m.id), note: `devolução decidida pelo admin: peça reprovada por ${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}${motivoDoAdmin ? ` (${motivoDoAdmin})` : ""}` });
      if (r.duplicado) creditos = 0;
    }
    const doPedido = ajusteADevolver(anterior);
    if (doPedido > 0) {
      const r = await dep.creditar({ userId: m.userId, quantidade: doPedido, refId: refDoAjustePeloAdmin(m.postId, m.id), note: `devolução decidida pelo admin: o ajuste pedido pelo chat (${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}) foi erro da plataforma` });
      if (!r.duplicado) doAjuste = doPedido;
    }
    // O VÍDEO POR IA REFEITO NO AJUSTE (09/10, decisão do Bruno): o que a fila
    // cobrou na carteira de VÍDEO volta para ela, além dos créditos do plano.
    const referencia = anterior?.ajuste?.carteira === "video" ? anterior.ajuste.referencia : null;
    if (referencia && dep.cobradoDoVideo && dep.creditarVideo) {
      const doVideo = ajusteDeVideoADevolver(anterior, await dep.cobradoDoVideo(referencia));
      if (doVideo > 0) {
        const r = await dep.creditarVideo({ userId: m.userId, quantidade: doVideo, refId: refDoAjustePeloAdmin(m.postId, m.id), note: `devolução decidida pelo admin: o vídeo refeito no ajuste (${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}) foi erro da plataforma` });
        if (!r.duplicado) deVideo = doVideo;
      }
    }
  }
  const situacao = args.decisao === "devolver" ? "devolvido" : "mantido";
  const frase =
    args.decisao === "devolver"
      ? `erro reconhecido pelo admin${motivoDoAdmin ? ` (${motivoDoAdmin})` : ""}: ${doAjuste > 0 || deVideo > 0 ? "os créditos da peça e do ajuste voltaram" : "os créditos da peça voltaram e refazer é grátis"}`
      : `o admin olhou a peça e as provas e não viu erro da plataforma${motivoDoAdmin ? ` (${motivoDoAdmin})` : ""}`;

  const estado: EstadoDaReprovacao = {
    ...(anterior ?? { id: m.id, categoria: m.categoria, texto: m.texto, veredito: m.vereditoDoJev, reprovadaEm: m.reprovadaEm, refeitaGratisEm: null }),
    id: m.id,
    situacao,
    creditos: creditos + doAjuste,
    decididoPor: "admin",
    motivo: frase,
    decididaEm: agora.toISOString(),
    // O ajuste devolvido É o refazer grátis desta reprovação: não sobra outro.
    ...((doAjuste > 0 || deVideo > 0) && anterior?.ajuste ? { refeitaGratisEm: agora.toISOString(), ajuste: { ...anterior.ajuste, devolvido: (anterior.ajuste.devolvido ?? 0) + doAjuste + deVideo } } : {}),
    ...(deVideo > 0 ? { creditosDeVideo: deVideo } : {}),
  };
  creditos += doAjuste;
  await dep.gravarPeca(peca.id, { status: null, metadata: { ...((peca.metadata as Record<string, unknown> | null) ?? {}), reprovacao: estado } });
  const campos: Partial<MotivoDeReprovacao> = { decisaoDoAdmin: args.decisao, adminId: args.admin.id, motivoDoAdmin, situacao, creditosDevolvidos: creditos, decididaEm: estado.decididaEm, decididoPor: "admin" };
  await dep.atualizarMotivo(m.id, campos).catch((e) => console.warn("[reprovacao] decisão não gravada na tabela:", e instanceof Error ? e.message : e));
  await dep.memoria(m.projectId, m.postId, valorDaMemoria({ ...m, ...campos }, peca)).catch(() => undefined);
  await dep.registrarAcaoDoAdmin(args.admin, { id: m.userId, email: "" }, `reprovacao_${args.decisao}`, { reprovacaoId: m.id, postId: m.postId, creditos, motivo: motivoDoAdmin }).catch(() => undefined);

  await dep
    .notificar({
      userId: m.userId,
      projectId: m.projectId,
      tipo: situacao === "devolvido" && creditos + deVideo > 0 ? "estorno" : "reprovacao",
      titulo:
        situacao === "devolvido"
          ? creditos > 0
            ? `Devolvemos ${creditos.toLocaleString("pt-BR")} créditos${deVideo > 0 ? ` e ${deVideo.toLocaleString("pt-BR")} de vídeo` : ""}`
            : deVideo > 0
              ? `Devolvemos ${deVideo.toLocaleString("pt-BR")} créditos de vídeo`
              : "Erro reconhecido: refazer é grátis"
          : "Reprovação analisada: os créditos ficam",
      texto:
        situacao === "devolvido"
          ? doAjuste > 0 || deVideo > 0
            ? `Um admin olhou o ajuste que você pediu (${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}) e reconheceu o erro. Os créditos da peça e o que o ajuste cobrou${deVideo > 0 ? ", inclusive os créditos de vídeo," : ""} voltaram ao seu saldo.`
            : `Um admin olhou a peça reprovada (${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}) e reconheceu o erro. ${creditos > 0 ? "Os créditos da peça voltaram ao seu saldo. " : ""}Refazer esta peça não cobra.`
          : `Um admin olhou a peça reprovada (${NOME_DA_CATEGORIA[m.categoria].toLowerCase()}), o motivo e as provas, e não viu erro da plataforma${motivoDoAdmin ? `: ${motivoDoAdmin}` : ""}. O crédito fica e refazer cobra como uma peça nova.`,
      // A página do quadro é /live (a /content dava 404 desde 08/10).
      link: `/projects/${m.projectId}/live`,
      chave: chaveDoSinoDaReprovacao(estado, m.postId),
    })
    .catch(() => undefined);
  return { ok: true, estado };
}

/**
 * MARCA O REFAZER GRÁTIS COMO USADO (lib/pipeline/refazer-peca.ts chama
 * depois de refazer sem cobrar): a mesma reprovação não paga dois refazeres.
 */
export async function marcarRefazerGratisUsado(postId: string, metadata: Record<string, unknown>, agora = new Date()): Promise<Record<string, unknown>> {
  const estado = lerEstadoDaReprovacao(metadata);
  if (!estado) return metadata;
  return { ...metadata, reprovacao: { ...estado, refeitaGratisEm: agora.toISOString() } };
}

// ── O admin: a fila e o agregado ──────────────────────────────────────────────

export type ItemDaFila = MotivoDeReprovacao & {
  peca: { content: string; imageUrl: string | null; platform: string; mediaType: string | null; projetoNome: string; donoEmail: string } | null;
};

/** A fila do admin: as reprovações em análise, com a peça e as provas. Vazia sem a tabela. */
export async function lerFilaDeReprovacoes(): Promise<{ pronta: boolean; fila: ItemDaFila[] }> {
  if (!(await tabelaDosMotivosExiste())) return { pronta: false, fila: [] };
  const linhas = await prisma.$queryRawUnsafe<LinhaDoMotivo[]>(`SELECT * FROM motivos_de_reprovacao WHERE situacao = 'em_analise' ORDER BY "reprovadaEm" ASC LIMIT 100`);
  const posts = await prisma.post.findMany({
    where: { id: { in: linhas.map((l) => l.postId) } },
    select: { id: true, content: true, imageUrl: true, platform: true, mediaType: true, project: { select: { name: true, user: { select: { email: true } } } } },
  });
  const porId = new Map(posts.map((p) => [p.id, p]));
  return {
    pronta: true,
    fila: linhas.map((l) => {
      const p = porId.get(l.postId);
      return {
        ...daLinha(l),
        peca: p ? { content: p.content, imageUrl: p.imageUrl, platform: p.platform, mediaType: p.mediaType, projetoNome: p.project.name, donoEmail: p.project.user.email } : null,
      };
    }),
  };
}

/** O agregado por categoria e por semana (as últimas `semanas`), e as últimas decididas. */
export async function lerAgregadoDeReprovacoes(semanas = 8): Promise<{ pronta: boolean; total: number; agregado: ReturnType<typeof agregarMotivos>; recentes: MotivoDeReprovacao[] }> {
  const vazio = agregarMotivos([], { semanas });
  if (!(await tabelaDosMotivosExiste())) return { pronta: false, total: 0, agregado: vazio, recentes: [] };
  const desde = new Date(Date.now() - semanas * 7 * 86_400_000);
  const linhas = await prisma.$queryRawUnsafe<LinhaDoMotivo[]>(`SELECT * FROM motivos_de_reprovacao WHERE "reprovadaEm" >= $1::timestamp ORDER BY "reprovadaEm" DESC`, desde.toISOString());
  const motivos = linhas.map(daLinha);
  return { pronta: true, total: motivos.length, agregado: agregarMotivos(motivos, { semanas }), recentes: motivos.filter((m) => m.situacao !== "em_analise").slice(0, 30) };
}

export { agregarMotivos };
