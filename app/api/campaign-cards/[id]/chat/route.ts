// O pedido composto roda depois da resposta (`after`), e o carrossel de 3
// lâminas com conferência passa de 3 minutos: o teto é o das rotas de vídeo.
export const maxDuration = 800;

import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ajustarVideoPeloChat } from "@/lib/media/ajuste-pelo-chat";
import { extrairNaoCitar, salvarNaoCitar, contarNaoCitarNaExecucao } from "@/lib/pipeline/restricoes";
import { encerrarRevisao } from "@/lib/pipeline/revisao-do-card";
import { ehPedidoDeRefazerVideo, cotarRegeracaoDoDia } from "@/lib/media/regerar-video";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { estadoDoPedido, planejarPedidoDoDia } from "@/lib/media/pedido-do-card";
import { pedidoEmCurso } from "@/lib/media/pedido-do-card-estado";
import { capturarFeedbackDoChatDoCard } from "@/lib/feedback/captura";
import { executarAjusteLiberado, executarSemCusto } from "@/lib/media/ajuste-liberado";
import { cancelarPedidoDeAjuste, confirmarMotivoDoAjuste, guardarPedidoDeAjuste, type PlanoDoAjuste } from "@/lib/credits/ajuste-servidor";
import { custoDosTextos, geraAlgoPago, lerPedidoDeAjuste } from "@/lib/credits/ajuste";

/**
 * O CHAT DO CARD, COM A PORTA DO AJUSTE (09/10/2026).
 *
 * O Bruno pediu no chat do card de um post da programação um ajuste da arte, e
 * a arte nova saiu de graça e sem motivo: era uma reprovação com outro nome, e
 * o furo que faria a Demandou rodar no prejuízo. Desde então, NENHUMA mensagem
 * do chat gera texto pago, arte ou vídeo de novo:
 *
 *   1. a mensagem (escrita ou falada, botão "Pedir ajuste") é entendida e
 *      COTADA; o pedido fica guardado no card e o agente pergunta o motivo com
 *      os botões das categorias da reprovação. Nada é gerado;
 *   2. o motivo chega neste mesmo POST ({ motivo: { pedidoId, categoria } });
 *      `confirmarMotivoDoAjuste` aplica a regra da reprovação com motivo
 *      (lib/credits/reprovacao*.ts): gosto cobra, erro confirmado devolve e o
 *      ajuste sai grátis, não confirmado cobra e vai ao admin. Só com o motivo
 *      aceito o ajuste roda (`executarAjusteLiberado`);
 *   3. o que não gera nada pago segue direto: salvar a regra de "nunca cite",
 *      mudar a data, levar para outra rede (que cobra no caminho dele), as
 *      perguntas do Vitor e o corte do vídeo gravado (o worker reprocessa a
 *      gravação, sem IA).
 *
 * Esta rota não importa nenhum gerador (modelo de texto, de imagem, de vídeo):
 * a prova estrutural em scripts/testes/pedir-ajuste-0910.test.mts confere.
 *
 * O CARD FICA "EM REVISÃO" ENQUANTO O PEDIDO ESTÁ SENDO FEITO (21/09), e o
 * `finally` tira a marca mesmo quando o pedido falha.
 */

type Mensagem = { role: "user" | "assistant"; content: string; timestamp: string };

/**
 * O ANDAMENTO DO PEDIDO (05/10): o chat gravado e as etapas da tarefa. A tela
 * consulta enquanto o pedido está sendo feito, e ao reabrir o modal. O pedido
 * de ajuste esperando o motivo vem no metadata.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const card = await prisma.campaignCard.findUnique({ where: { id }, select: { projectId: true, project: { select: { userId: true } } } });
  if (!card || !(await podeUsarProjeto(userId, { id: card.projectId, userId: card.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(await estadoDoPedido(id));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const emRevisao: string[] = [];
  // O FEEDBACK DO PRODUTO (06/10): o corpo é lido de uma cópia, e o registro sai
  // depois da resposta. O pedido composto (202) registra a si mesmo ao terminar
  // (pedido-do-card.ts); os caminhos que respondem na hora registram aqui.
  const copia = req.clone();
  const desde = new Date().toISOString();
  try {
    const resposta = await tratarChatDoCard(req, ctx, emRevisao);
    if (resposta.status === 200) {
      after(async () => {
        const [{ userId }, { id }, corpo] = await Promise.all([auth(), ctx.params, copia.json().catch(() => null) as Promise<{ message?: string } | null>]);
        if (userId && corpo?.message?.trim()) await capturarFeedbackDoChatDoCard({ cardId: id, userId, mensagem: corpo.message.trim(), desde });
      });
    }
    return resposta;
  } finally {
    if (emRevisao.length > 0) await encerrarRevisao(emRevisao);
  }
}

const DADOS_DO_CARD = { project: { select: { userId: true, name: true, voice: true, niche: true } } } as const;

/** Uma palavra inteira: "corrige" não é "cor". */
const PEDIDO_DE_MIDIA =
  /\b(imagem|imagens|fotos?|artes?|gr[aá]fic\w*|chart|infogr[aá]fic\w*|capas?|ilustra\w*|visual|design|est[ií]lo|cor|cores|layout|thumb)\b/i;

async function tratarChatDoCard(req: NextRequest, { params }: { params: Promise<{ id: string }> }, emRevisao: string[]) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const corpo = (await req.json().catch(() => ({}))) as {
    message?: string;
    slideIndex?: unknown;
    motivo?: { pedidoId?: unknown; categoria?: unknown; texto?: unknown };
    cancelarAjuste?: boolean;
  };

  const card = await prisma.campaignCard.findUnique({ where: { id }, include: DADOS_DO_CARD });
  if (!card || !(await podeUsarProjeto(userId, { id: card.projectId, userId: card.project.userId }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const cardDoAjuste = { id: card.id, projectId: card.projectId, projectUserId: card.project.userId, metadata: card.metadata, agentName: card.agentName };
  const responder = async (mensagem: string, resposta: string, extra: Record<string, unknown> = {}) => {
    const historico = [
      ...(Array.isArray(card.chatHistory) ? (card.chatHistory as Mensagem[]) : []),
      { role: "user" as const, content: mensagem, timestamp: new Date().toISOString() },
      { role: "assistant" as const, content: resposta, timestamp: new Date().toISOString() },
    ];
    await prisma.campaignCard.update({ where: { id: card.id }, data: { chatHistory: historico as never } });
    return NextResponse.json({ updatedContent: card.content, chatHistory: historico, ...extra });
  };

  // ── A. Cancelar o ajuste que esperava o motivo ────────────────────────────
  if (corpo.cancelarAjuste) {
    const r = await cancelarPedidoDeAjuste({ cardId: card.id, userId });
    // O pedido do Vitor (vídeo gravado) que esperava o motivo sai junto.
    await prisma.$executeRaw`UPDATE campaign_cards SET metadata = COALESCE(metadata, '{}'::jsonb) - 'ajustePendente' WHERE id = ${card.id}`;
    return NextResponse.json({ cancelado: r.ok, chatHistory: r.chatHistory });
  }

  // ── B. O motivo escolhido: só aqui algo pago é gerado ─────────────────────
  if (corpo.motivo) {
    const r = await confirmarMotivoDoAjuste({ cardId: card.id, userId, pedidoId: String(corpo.motivo.pedidoId ?? ""), categoria: corpo.motivo.categoria, texto: corpo.motivo.texto });
    if (!r.ok) {
      const status = r.erro === "sem_saldo" ? 402 : r.erro === "motivo_invalido" ? 400 : r.erro === "nao_encontrado" ? 404 : 409;
      return NextResponse.json({ error: r.mensagem, erro: r.erro, chatHistory: r.chatHistory, ...(r.erro === "sem_saldo" ? { necessario: r.necessario, disponivel: r.disponivel } : {}) }, { status });
    }
    const quem = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true } });
    const feito = await executarAjusteLiberado({
      card: { ...card, project: { name: card.project.name, voice: card.project.voice, niche: card.project.niche } },
      userId,
      liberacao: r,
      quem,
      emRevisao,
      depois: (fn) => after(fn),
    });
    return NextResponse.json({ ...feito.corpo, motivoAceito: { cobrado: r.cobrado, cortesia: r.cortesia?.motivo ?? null, saldoDepois: r.saldoDepois, situacao: r.registrado.situacao } }, { status: feito.status });
  }

  // ── C. A mensagem: entende, cota e pergunta o motivo, sem gerar ───────────
  const message = typeof corpo.message === "string" ? corpo.message : "";
  if (!message.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });
  const slideIndex = typeof corpo.slideIndex === "number" ? corpo.slideIndex : null;

  const guardar = async (plano: PlanoDoAjuste, opcoes: { prefixo?: string; semChat?: boolean } = {}) => {
    const g = await guardarPedidoDeAjuste({ card: cardDoAjuste, userId, mensagem: message, plano, prefixo: opcoes.prefixo, semChat: opcoes.semChat });
    return { pedido: g.pedido, chatHistory: g.chatHistory, saldo: g.saldo, interno: g.interno };
  };
  const primeiroPostDoDia = async () =>
    (await prisma.post.findFirst({ where: { runId: card.runId, dayOfWeek: card.dayOfWeek, status: { notIn: ["published", "publishing", "cancelled"] } }, select: { id: true }, orderBy: { createdAt: "asc" } }))?.id ?? null;

  /**
   * "NUNCA CITE X" É REGRA DO PROJETO (21/09): fica salva agora, de graça. Tirar
   * a menção dos rascunhos que já existem é reescrita paga: vira pedido de
   * ajuste, com o custo dito antes.
   */
  const nomesProibidos = extrairNaoCitar(message);
  if (nomesProibidos.length > 0) {
    const todos = await salvarNaoCitar(card.projectId, nomesProibidos);
    const conta = await contarNaoCitarNaExecucao(card.runId, todos);
    const regra = `Regra salva para este projeto: nunca citar ${todos.join(", ")}. Nas próximas campanhas a pesquisa já descarta essa fonte antes de escrever.`;
    if (conta.textos === 0 || !conta.postId) return responder(message, `${regra} Nenhum rascunho desta campanha cita esse nome.`, { regraSalva: todos });
    const custo = custoDosTextos(conta.textos, conta.textos === 1 ? "o rascunho que cita esse nome" : `os ${conta.textos} rascunhos que citam esse nome`);
    const g = await guardar({ tipo: "nao_citar", slideIndex: null, nomes: todos, postId: conta.postId, carteira: "plano", creditos: custo.creditos, partes: custo.partes }, { prefixo: regra });
    return NextResponse.json({ updatedContent: card.content, chatHistory: g.chatHistory, pedidoDeAjuste: g.pedido, saldo: g.saldo, regraSalva: todos });
  }

  /**
   * "GERE O VÍDEO DE NOVO" (28/09) refaz o vídeo do dia, e é geração paga: o
   * custo na carteira de vídeo e o motivo antes. O card do vídeo GRAVADO nunca
   * cai aqui: o ajuste dele é o Vitor, lá embaixo (30/09). Só o card do CORTE
   * é "do vídeo gravado" (05/10).
   */
  const doVideoGravado =
    Boolean((card.metadata as { videoJobId?: string } | null)?.videoJobId) &&
    (card.cardType === "video_clip" || card.mediaType === "video");
  if (!doVideoGravado && ehPedidoDeRefazerVideo(message)) {
    const cot = await cotarRegeracaoDoDia({ runId: card.runId, dayOfWeek: card.dayOfWeek, userId });
    if (!cot.ok) return responder(message, cot.motivo);
    const postId = cot.original.postId ?? (await primeiroPostDoDia());
    if (!postId) return responder(message, "Não achei o post deste dia para ligar o pedido, então não refiz o vídeo.");
    const g = await guardar({ tipo: "video_ia", slideIndex: null, postId, carteira: "video", cobradoFora: true, creditos: cot.custo, partes: [{ chave: "video", rotulo: "o vídeo do dia", creditos: cot.custo }] });
    return NextResponse.json({ updatedContent: card.content, chatHistory: g.chatHistory, pedidoDeAjuste: g.pedido, saldo: g.saldo });
  }

  /**
   * O PEDIDO DE UM DIA DA CAMPANHA (05/10): texto, arte, data e rede. Entendido
   * e cotado agora; o que gera (texto, arte) espera o motivo; o que não gera
   * (data, rede) segue direto como tarefa no servidor.
   */
  const ajusteDoDia = async () => {
    const emCurso = pedidoEmCurso(card.metadata);
    if (emCurso) {
      return NextResponse.json({ jaFazendo: true, pedido: emCurso, aviso: "Ainda estou fazendo o pedido anterior. Assim que terminar, eu respondo aqui; se quiser mudar mais alguma coisa, mande depois." });
    }
    const plano = await planejarPedidoDoDia({ cardId: card.id, mensagem: message.trim(), slideIndex });
    if (!plano) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!geraAlgoPago(plano.custo.partes)) {
      const sem = await executarSemCusto({ card, userId, mensagem: message.trim(), slideIndex, acoes: plano.acoes, depois: (fn) => after(fn) });
      if (!sem) {
        const pediuArte = plano.acoes.some((a) => a.tipo === "arte");
        const pediuTexto = plano.acoes.some((a) => a.tipo === "texto");
        return responder(
          message,
          pediuArte
            ? "Este dia não tem imagem, então não havia arte para refazer."
            : pediuTexto
              ? "Não achei texto para mudar neste dia: os posts dele já saíram ou foram arquivados."
              : "Não entendi o que mudar. Me diga em uma frase o que quer no texto ou na arte."
        );
      }
      if (sem.jaFazendo) return NextResponse.json({ jaFazendo: true, pedido: sem.pedido, aviso: "Ainda estou fazendo o pedido anterior." });
      return NextResponse.json({ emAndamento: true, pedido: sem.pedido, chatHistory: sem.chatHistory }, { status: 202 });
    }
    if (!plano.postId) return responder(message, "Não achei um post vivo deste dia para ajustar: os posts dele já saíram ou foram arquivados.");
    const g = await guardar({
      tipo: "dia",
      slideIndex,
      acoes: plano.acoes,
      postId: plano.postId,
      carteira: "plano",
      creditos: plano.custo.creditos,
      partes: plano.custo.partes,
      aParte: plano.custo.aParte,
    });
    return NextResponse.json({ updatedContent: card.content, chatHistory: g.chatHistory, pedidoDeAjuste: g.pedido, saldo: g.saldo });
  };
  const TIPOS_DO_DIA = ["publish", "media", "post_linkedin", "post_twitter"];
  if (!doVideoGravado && TIPOS_DO_DIA.includes(card.cardType) && card.mediaType !== "video") return ajusteDoDia();

  /**
   * O CARD DO VÍDEO GRAVADO: o Vitor entende e faz (30/09). O corte e tirar um
   * efeito saem na hora (reprocessam a gravação, sem IA nova); imagem, cena e
   * capa novas ficam guardadas e esperam o MOTIVO (09/10): o pedido de ajuste
   * espelha o do Vitor, e o motivo aceito volta a ele com a cortesia.
   */
  const metaVideo = card.metadata as { videoJobId?: string } | null;
  if (card.cardType === "video_clip" && metaVideo?.videoJobId) {
    // Uma mensagem nova troca de assunto: o pedido anterior que esperava o motivo não vale mais.
    if (lerPedidoDeAjuste(card.metadata)) await prisma.$executeRaw`UPDATE campaign_cards SET metadata = COALESCE(metadata, '{}'::jsonb) - 'pedidoDeAjuste' WHERE id = ${card.id}`;
    const r = await ajustarVideoPeloChat({ card, userId, mensagem: message });
    if (r.tratado) {
      const historicoNovo = [
        ...(Array.isArray(card.chatHistory) ? (card.chatHistory as Mensagem[]) : []),
        { role: "user" as const, content: message, timestamp: new Date().toISOString() },
        { role: "assistant" as const, content: r.resposta, timestamp: new Date().toISOString() },
      ];
      await prisma.campaignCard.update({ where: { id: card.id }, data: { chatHistory: historicoNovo as never } });
      let pedidoDeAjuste: unknown = undefined;
      if (r.precisaDeMotivo) {
        const fresco = await prisma.campaignCard.findUnique({ where: { id: card.id }, select: { metadata: true } });
        const pendente = (fresco?.metadata as { ajustePendente?: { creditos?: number; resumo?: string } } | null)?.ajustePendente;
        const postId = card.postId ?? (await primeiroPostDoDia());
        if (pendente && postId && (pendente.creditos ?? 0) > 0) {
          const creditos = Math.floor(pendente.creditos ?? 0);
          const g = await guardar(
            { tipo: "video_cenas", slideIndex: null, postId, carteira: "plano", cobradoFora: true, creditos, partes: [{ chave: "video", rotulo: pendente.resumo || "o ajuste do vídeo", creditos }], resumo: pendente.resumo || "o ajuste do vídeo" },
            { semChat: true }
          );
          pedidoDeAjuste = g.pedido;
        }
      }
      const salvo = await prisma.campaignCard.findUnique({ where: { id: card.id }, select: { metadata: true } });
      // O metadata volta junto: o card passa a mostrar "o squad está fazendo"
      // (ou o pedido esperando o motivo) sem esperar a próxima leitura do quadro.
      // Sem a marca de revisão deste pedido, que o `finally` tira em seguida.
      const { revisao: _revisao, ...metadataNovo } = (salvo?.metadata as Record<string, unknown> | null) ?? {};
      void _revisao;
      return NextResponse.json({
        updatedContent: card.content,
        chatHistory: historicoNovo,
        updatedMetadata: metadataNovo,
        refazendoCorte: r.refazendoCorte ?? false,
        aviso: r.aviso,
        ...(pedidoDeAjuste ? { pedidoDeAjuste } : {}),
      });
    }
  }

  /**
   * PEDIDO DE IMAGEM NUM CARD QUE NÃO TEM IMAGEM (18/09): o pedido vai para
   * quem faz a arte do dia. Num dia de texto (o card da pesquisa ou da revisão
   * pedindo a arte), é o mesmo pedido do dia, cotado e com motivo; até 09/10
   * ele refazia a arte da Diana de graça. Num dia de VÍDEO, a arte é o quadro
   * do vídeo, que se refaz pedindo o vídeo de novo. O conteúdo do card nunca é
   * reescrito para dizer que a imagem mudou.
   */
  if (card.cardType === "media" || (PEDIDO_DE_MIDIA.test(message) && card.cardType !== "video_clip" && !card.mediaUrl)) {
    const daDiana =
      card.cardType === "media"
        ? null
        : await prisma.campaignCard.findFirst({ where: { runId: card.runId, dayOfWeek: card.dayOfWeek, cardType: "media", NOT: { status: "archived" } }, select: { mediaType: true }, orderBy: { createdAt: "desc" } });
    if (daDiana && daDiana.mediaType !== "video" && card.mediaType !== "video") return ajusteDoDia();
    return responder(
      message,
      card.cardType === "media" || card.mediaType === "video" || daDiana?.mediaType === "video"
        ? "A imagem deste dia é o quadro de abertura do vídeo. Para trocar, peça aqui: gere o vídeo de novo. Eu mostro o custo e pergunto o motivo antes de gerar."
        : "Este card não tem imagem, e não achei peça de mídia neste dia para ajustar. Se você queria ajustar o TEXTO, me diga o que mudar nele."
    );
  }

  /**
   * O TEXTO: o do card do Paulo de um dia de vídeo (todos os posts do dia,
   * cada um na sua rede) ou o do card do redator. Reescrita paga: cotada aqui,
   * feita depois do motivo.
   */
  if (card.cardType === "publish") {
    const posts = await prisma.post.findMany({ where: { runId: card.runId, dayOfWeek: card.dayOfWeek, status: { notIn: ["published", "publishing"] } }, select: { id: true, platform: true, content: true } });
    const textos = new Set(posts.map((p) => `${p.platform}\n${p.content}`)).size;
    if (!textos) return responder(message, "Os posts deste dia já saíram, então não há texto para mudar por aqui.");
    const custo = custoDosTextos(textos, textos === 1 ? "o texto" : `o texto em ${textos} redes`);
    const g = await guardar({ tipo: "texto_do_dia", slideIndex: null, postId: posts[0].id, carteira: "plano", creditos: custo.creditos, partes: custo.partes });
    return NextResponse.json({ updatedContent: card.content, chatHistory: g.chatHistory, pedidoDeAjuste: g.pedido, saldo: g.saldo });
  }
  const postId = card.postId ?? (await primeiroPostDoDia());
  if (!postId) return responder(message, "Este card não tem post ligado, então não há texto para ajustar por aqui.");
  const custo = custoDosTextos(1);
  const g = await guardar({ tipo: "texto", slideIndex: null, postId, carteira: "plano", creditos: custo.creditos, partes: custo.partes });
  return NextResponse.json({ updatedContent: card.content, chatHistory: g.chatHistory, pedidoDeAjuste: g.pedido, saldo: g.saldo });
}
