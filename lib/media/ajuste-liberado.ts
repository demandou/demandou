import { prisma } from "@/lib/db/prisma";
import { askClaude } from "@/lib/claude";
import { CREDIT_COSTS } from "@/lib/credits/tabela";
import { pecaPublicavel } from "@/lib/pipeline/guarda-de-texto";
import { aplicarNaoCitarNaExecucao } from "@/lib/pipeline/restricoes";
import { regerarVideoDoDia } from "@/lib/media/regerar-video";
import { ajustarVideoPeloChat } from "@/lib/media/ajuste-pelo-chat";
import { abrirPedido, executarPedido, type AcaoDoPedido } from "@/lib/media/pedido-do-card";
import { lerPedidoDoCard } from "@/lib/media/pedido-do-card-estado";
import { marcarEmRevisao } from "@/lib/pipeline/revisao-do-card";
import { blocoDaMemoriaDoCliente } from "@/lib/cerebro/contexto";
import { anotarCobrancaDoVideo, devolverOQueNaoSaiu, type Mensagem, type MotivoAceito } from "@/lib/credits/ajuste-servidor";
import { acoesSemCusto, creditosNaoEntregues, type PedidoDeAjuste } from "@/lib/credits/ajuste";

/**
 * O AJUSTE LIBERADO (09/10/2026): o ÚNICO lugar por onde o chat do card gera
 * texto pago, arte ou vídeo de novo, e só com um motivo aceito na mão.
 *
 * `executarAjusteLiberado` exige o `MotivoAceito` que só
 * `confirmarMotivoDoAjuste` (lib/credits/ajuste-servidor.ts) devolve: o motivo
 * foi gravado, a conferência rodou e a cobrança (ou a cortesia) já saiu. A
 * rota do chat chama isto só no ramo do motivo; a prova estrutural
 * (scripts/testes/pedir-ajuste-0910.test.mts) confere que a rota não importa
 * nenhum gerador direto.
 *
 * `executarSemCusto` é a outra porta, e ela não gera nada: só as ações de data
 * e de rede do pedido do dia (levar para outra rede cobra no caminho dele).
 *
 * O que estava na rota antes de 09/10 (reescrever os textos do dia pelo Paulo
 * de um dia de vídeo, editar o texto de um card) mudou para cá sem mudar o
 * que faz; o que mudou é a porta.
 */

export type RespostaDoAjuste = { status: number; corpo: Record<string, unknown> };

type CardDoChat = {
  id: string;
  projectId: string;
  runId: string;
  dayOfWeek: number;
  cardType: string;
  agentId: string;
  agentName: string;
  content: string | null;
  postId: string | null;
  metadata: unknown;
  chatHistory: unknown;
  project: { name: string; voice: string | null; niche: string | null };
};

const agora = () => new Date().toISOString();

async function acrescentar(cardId: string, msgs: Mensagem[]): Promise<Mensagem[]> {
  const c = await prisma.campaignCard.findUnique({ where: { id: cardId }, select: { chatHistory: true } });
  const historico = [...(Array.isArray(c?.chatHistory) ? (c!.chatHistory as Mensagem[]) : []), ...msgs];
  await prisma.campaignCard.update({ where: { id: cardId }, data: { chatHistory: historico as never } });
  return historico;
}

/** A parte cobrada de quantos textos não saíram: volta. */
function sobraDosTextos(pedido: PedidoDeAjuste, entregues: number): number {
  return Math.max(0, pedido.creditos - CREDIT_COSTS.post_text * Math.max(0, entregues));
}

/**
 * EXECUTA O AJUSTE DEPOIS DO MOTIVO. Cada tipo roda o caminho que já existia,
 * e o que não saiu volta (`devolverOQueNaoSaiu`, uma vez só).
 */
export async function executarAjusteLiberado(args: {
  card: CardDoChat;
  userId: string;
  liberacao: MotivoAceito;
  /** Quem pediu (nome e foto) para o selo "em revisão" do card. */
  quem: { name: string | null; image: string | null } | null;
  /** Os cards marcados em revisão; a rota tira a marca no fim (`finally`). */
  emRevisao: string[];
  /** `after` do Next: o pedido do dia roda depois da resposta. */
  depois: (fn: () => Promise<void>) => void;
}): Promise<RespostaDoAjuste> {
  const { card, userId, liberacao } = args;
  const pedido = liberacao.pedido;
  const cobrado = liberacao.cobrado;
  const devolver = (naoEntregue: number, porque: string) =>
    devolverOQueNaoSaiu({ userId, projectId: card.projectId, pedido, cobrado, naoEntregue, porque, cardId: card.id }).catch((e) => {
      console.warn("[ajuste] devolução do que não saiu:", e instanceof Error ? e.message : e);
      return 0;
    });

  switch (pedido.tipo) {
    case "dia": {
      // O pedido do dia, com as ações JÁ entendidas na cotação: roda o que foi cotado.
      const aberto = await abrirPedido({ cardId: card.id, mensagem: pedido.mensagem, agenteNome: card.agentName, semMensagemNoChat: true });
      if (aberto.jaFazendo) {
        await devolver(cobrado, "havia outro pedido em andamento");
        const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: "Ainda estou fazendo o pedido anterior, então não comecei este; o que foi cobrado voltou. Mande de novo quando o outro terminar.", timestamp: agora() }]);
        return { status: 200, corpo: { jaFazendo: true, pedido: aberto.pedido, chatHistory } };
      }
      const daDiana = await prisma.campaignCard.findFirst({ where: { runId: card.runId, dayOfWeek: card.dayOfWeek, cardType: "media", NOT: { status: "archived" } }, select: { id: true } });
      await marcarEmRevisao({
        cardIds: [card.id, ...(daDiana ? [daDiana.id] : [])],
        pedido: pedido.mensagem,
        porNome: args.quem?.name ?? null,
        porImagem: args.quem?.image ?? null,
        agenteId: card.agentId,
        agenteNome: card.agentName,
      });
      const acoes = (pedido.acoes ?? []) as AcaoDoPedido[];
      args.depois(async () => {
        await executarPedido({ cardId: card.id, userId, mensagem: pedido.mensagem, slideIndex: pedido.slideIndex, acoesProntas: acoes });
        // O que não saiu (etapa que falhou, ficou igual ou esperou a identidade) volta.
        const c = await prisma.campaignCard.findUnique({ where: { id: card.id }, select: { metadata: true } });
        const etapas = lerPedidoDoCard(c?.metadata)?.etapas ?? [];
        await devolver(creditosNaoEntregues(pedido.partes, etapas), "parte do pedido não saiu");
      });
      return { status: 202, corpo: { emAndamento: true, pedido: aberto.pedido, chatHistory: liberacao.chatHistory, cobrado, saldoDepois: liberacao.saldoDepois } };
    }

    case "video_ia": {
      const r = await regerarVideoDoDia({ runId: card.runId, dayOfWeek: card.dayOfWeek, userId, cortesia: liberacao.cortesia });
      // A fila cobra na carteira de vídeo por esta referência: o admin devolve por ela se reconhecer o erro.
      if (r.ok && !liberacao.cortesia && pedido.postId) {
        await anotarCobrancaDoVideo({ postId: pedido.postId, pedidoId: pedido.id, referencia: r.referencia, creditos: r.custo }).catch((e) =>
          console.warn("[ajuste] referência do vídeo não anotada:", e instanceof Error ? e.message : e)
        );
      }
      const resposta = r.ok
        ? `Pedi o vídeo de novo para a Diana: ${r.segundos}s na qualidade ${r.qualidade === "cheio" ? "Cheia" : "Rápida"}, ${r.custo > 0 ? `${r.custo} créditos de vídeo` : "sem cobrança"}. ` +
          (r.geracoes > 1 ? `São ${r.geracoes} trechos encadeados, cada um leva de 1 a 5 minutos. ` : "Leva de 1 a 5 minutos. ") +
          "O card do dia mostra o andamento, e o vídeo entra nos posts sozinho quando ficar pronto. Se o gerador do Google falhar, eu tento de novo em 1, 2, 3 e 5 minutos e aviso aqui."
        : r.motivo;
      const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: resposta, timestamp: agora() }]);
      return { status: 200, corpo: { updatedContent: card.content, chatHistory, videoRefeito: r.ok } };
    }

    case "nao_citar": {
      const nomes = pedido.nomes ?? [];
      const aplicado = await aplicarNaoCitarNaExecucao(card.runId, nomes);
      // Cada texto distinto reescrito é um `post_text`; o que não mudou volta.
      const mudou = Math.min(aplicado.posts + aplicado.cards, Math.round(pedido.creditos / CREDIT_COSTS.post_text));
      await devolver(sobraDosTextos(pedido, mudou), "texto que não precisou mudar");
      const resposta = `Apliquei nos rascunhos desta campanha: ${aplicado.posts} post(s) reescrito(s) sem a menção (o dado que só tinha essa fonte saiu junto). Nas próximas campanhas a pesquisa já descarta essa fonte antes de escrever.`;
      const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: resposta, timestamp: agora() }]);
      return { status: 200, corpo: { updatedContent: card.content, chatHistory, aplicado } };
    }

    case "video_cenas": {
      // O Vitor gera e cobra (com a cortesia do motivo, quando é o caso).
      const fresco = await prisma.campaignCard.findUnique({ where: { id: card.id }, select: { id: true, metadata: true, chatHistory: true } });
      const r = await ajustarVideoPeloChat(
        { card: fresco ?? card, userId, mensagem: "sim" },
        { motivo: { categoria: liberacao.registrado.categoria, cortesia: liberacao.cortesia } }
      );
      const resposta = r.tratado ? r.resposta : "Não achei mais o ajuste do vídeo que esperava o motivo. Me peça de novo.";
      const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: resposta, timestamp: agora() }]);
      const salvo = await prisma.campaignCard.findUnique({ where: { id: card.id }, select: { metadata: true } });
      const { revisao: _revisao, ...metadataNovo } = (salvo?.metadata as Record<string, unknown> | null) ?? {};
      void _revisao;
      return { status: 200, corpo: { updatedContent: card.content, chatHistory, updatedMetadata: metadataNovo, refazendoCorte: r.tratado ? (r.refazendoCorte ?? false) : false, aviso: r.tratado ? r.aviso : undefined } };
    }

    case "texto_do_dia": {
      /**
       * O CARD DO PAULO NÃO TEM TEXTO PARA EDITAR: ele lista os posts do dia
       * (21/09). Uma instrução de texto vale para TODOS os posts do dia, cada
       * um reescrito na sua rede.
       */
      args.emRevisao.push(card.id);
      await marcarEmRevisao({ cardIds: [card.id], pedido: pedido.mensagem, porNome: args.quem?.name ?? null, porImagem: args.quem?.image ?? null, agenteId: card.agentId, agenteNome: card.agentName });
      const preferences = (await blocoDaMemoriaDoCliente(card.projectId, "texto", { comPedidosDoChat: true })).replace(/^\s*MEMÓRIA DO CLIENTE[^\n]*\n/, "").trim();
      const postsDoDia = await prisma.post.findMany({
        where: { runId: card.runId, dayOfWeek: card.dayOfWeek, status: { notIn: ["published", "publishing"] } },
        select: { id: true, platform: true, content: true },
      });
      const porTexto = new Map<string, string>();
      let alterados = 0;
      const textosMudados = new Set<string>();
      for (const p of postsDoDia) {
        const chave = `${p.platform}\n${p.content}`;
        let novo = porTexto.get(chave);
        if (!novo) {
          const bruto = await askClaude(
            `Você edita um post de ${p.platform} do projeto "${card.project.name}". Tom: ${card.project.voice ?? "profissional"}.
Devolva APENAS o texto final, sem comentários, sem prefixos, sem markdown. Mantenha o tamanho e as regras da rede.
REGRA DE OURO: nunca invente dados, estatísticas ou referências.${preferences ? `\nPreferências do usuário:\n${preferences}` : ""}`,
            `Texto atual:\n\n${p.content}\n\nInstrução: ${pedido.mensagem}`,
            { maxTokens: 6000, usage: { operation: "ajuste_do_dia", projectId: card.projectId, runId: card.runId } }
          );
          const peca = pecaPublicavel(bruto);
          novo = "recusado" in peca ? p.content : peca.texto;
          porTexto.set(chave, novo);
        }
        if (novo !== p.content) {
          await prisma.post.update({ where: { id: p.id }, data: { content: novo } });
          const plataformaDoCard = p.platform === "twitter" ? "post_twitter" : "post_linkedin";
          await prisma.campaignCard.updateMany({ where: { runId: card.runId, dayOfWeek: card.dayOfWeek, cardType: plataformaDoCard, content: p.content }, data: { content: novo } }).catch(() => {});
          alterados++;
          textosMudados.add(chave);
        }
      }
      const devolvido = await devolver(sobraDosTextos(pedido, textosMudados.size), "texto que não mudou");
      const resposta =
        (alterados
          ? `Pronto, mudei o texto ${alterados === 1 ? "do post" : `dos ${alterados} posts`} deste dia. Ele já aparece aqui no card.`
          : "Li o texto de novo e nada mudou com esse pedido. Me diga com outras palavras o que quer trocar.") + (devolvido > 0 && alterados ? ` O que não mudou voltou para o seu saldo: ${devolvido} créditos.` : "");
      const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: resposta, timestamp: agora() }]);
      return { status: 200, corpo: { updatedContent: card.content, chatHistory, alterados } };
    }

    case "texto": {
      // ── O texto do card do redator, com a mesma guarda da esteira ──
      args.emRevisao.push(card.id);
      await marcarEmRevisao({ cardIds: [card.id], pedido: pedido.mensagem, porNome: args.quem?.name ?? null, porImagem: args.quem?.image ?? null, agenteId: card.agentId, agenteNome: card.agentName });
      const alvoDaMemoria = card.cardType === "video_clip" || card.cardType === "video_completo" ? "video" : "texto";
      const preferences = (await blocoDaMemoriaDoCliente(card.projectId, alvoDaMemoria, { comPedidosDoChat: true })).replace(/^\s*MEMÓRIA DO CLIENTE[^\n]*\n/, "").trim();
      const historico = Array.isArray(card.chatHistory) ? (card.chatHistory as Mensagem[]) : [];
      const historyContext = historico.length > 0 ? `\n\nHistórico de ajustes:\n${historico.map((m) => `${m.role === "user" ? "Usuário" : "IA"}: ${m.content.slice(0, 200)}`).join("\n")}` : "";
      const system = `Você é um assistente de edição de conteúdo para redes sociais.
Projeto: ${card.project.name}
Plataforma: ${card.cardType === "post_linkedin" ? "LinkedIn" : card.cardType === "post_twitter" ? "X (Twitter)" : card.cardType}
Tom de voz: ${card.project.voice ?? "profissional"}
Nicho: ${card.project.niche ?? "geral"}
${preferences ? `\nPreferências do usuário:\n${preferences}` : ""}

Seu trabalho: Editar e melhorar o texto conforme a instrução do usuário.
Retorne APENAS o texto revisado, sem explicações, sem prefixos.
Mantenha o comprimento adequado para a plataforma.
Responda em português com acentuação correta.

REGRA DE OURO: Nunca invente dados, estatísticas ou referências. Use apenas fatos reais com fonte.`;
      const bruto = await askClaude(system, `Texto atual:\n\n${card.content ?? ""}\n\nInstrução: ${pedido.mensagem}${historyContext}`, { maxTokens: 6000 });
      const peca = pecaPublicavel(bruto);
      if ("recusado" in peca || peca.texto === (card.content ?? "")) {
        await devolver(cobrado, "o texto não mudou");
        const recusa = "Não consegui aplicar esse ajuste no texto desta vez, e ele ficou como estava; o que foi cobrado voltou. Pode me pedir de novo com outras palavras?";
        const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: recusa, timestamp: agora() }]);
        return { status: 200, corpo: { updatedContent: card.content, chatHistory } };
      }
      const updatedContent = peca.texto;
      await prisma.campaignCard.update({ where: { id: card.id }, data: { content: updatedContent } });
      if (card.postId && (card.cardType === "post_linkedin" || card.cardType === "post_twitter" || card.cardType === "video_clip")) {
        await prisma.post.update({ where: { id: card.postId }, data: { content: updatedContent } }).catch(() => {});
      }
      const preferenceKey = `feedback_${card.cardType}_${Date.now()}`;
      await prisma.projectMemory
        .upsert({
          where: { projectId_type_key: { projectId: card.projectId, type: "preference", key: preferenceKey } },
          create: { projectId: card.projectId, type: "preference", key: preferenceKey, value: { instruction: pedido.mensagem, cardType: card.cardType, dayOfWeek: card.dayOfWeek }, metadata: { learnedAt: agora() } },
          update: { value: { instruction: pedido.mensagem, cardType: card.cardType, dayOfWeek: card.dayOfWeek } },
        })
        .catch(() => undefined);
      const chatHistory = await acrescentar(card.id, [{ role: "assistant", content: "Pronto, mudei o texto como você pediu. A versão nova já está aqui no card.", timestamp: agora() }]);
      return { status: 200, corpo: { updatedContent, chatHistory } };
    }

    default: {
      await devolver(cobrado, "tipo de ajuste desconhecido");
      return { status: 400, corpo: { error: "Não sei fazer este ajuste por aqui; o que foi cobrado voltou." } };
    }
  }
}

/**
 * O PEDIDO DO DIA QUE NÃO GERA NADA PAGO: só data e rede. Texto e arte nunca
 * passam por aqui (são filtrados), então nada é gerado sem o motivo. Levar
 * para uma rede nova cobra no caminho dele, como sempre.
 */
export async function executarSemCusto(args: {
  card: { id: string; agentName: string };
  userId: string;
  mensagem: string;
  slideIndex: number | null;
  acoes: AcaoDoPedido[];
  depois: (fn: () => Promise<void>) => void;
}): Promise<{ jaFazendo: true; pedido: unknown } | { jaFazendo: false; pedido: unknown; chatHistory: Mensagem[] } | null> {
  const semGeracao = acoesSemCusto(args.acoes);
  if (!semGeracao.length) return null;
  const aberto = await abrirPedido({ cardId: args.card.id, mensagem: args.mensagem, agenteNome: args.card.agentName });
  if (aberto.jaFazendo) return aberto;
  args.depois(() => executarPedido({ cardId: args.card.id, userId: args.userId, mensagem: args.mensagem, slideIndex: args.slideIndex, acoesProntas: semGeracao }));
  return aberto;
}
