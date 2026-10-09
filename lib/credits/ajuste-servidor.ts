import { prisma } from "@/lib/db/prisma";
import { creditar, debitar, SaldoInsuficiente } from "@/lib/credits";
import { saldoDeVideo } from "@/lib/credits/video";
import { carteiraDeQuemFaz, fraseDeSaldoDoMembro, podeUsarProjeto } from "@/lib/equipe/conta";
import { cortesiasDeHoje, decidirCortesia, estadoDaPecaParaCortesia } from "@/lib/credits/cortesia";
import { reprovarPeca, type ResultadoDaReprovacao } from "@/lib/credits/reprovacao-servidor";
import { NOME_DA_CATEGORIA, classeDaCategoria, lerEstadoDaReprovacao, refazerSemCobrar, validarMotivo, type EstadoDaReprovacao } from "@/lib/credits/reprovacao";
import {
  CHAVE_DO_PEDIDO_DE_AJUSTE,
  OPERACAO_DA_SOBRA_DO_AJUSTE,
  OPERACAO_DO_AJUSTE,
  fraseDaDevolucao,
  fraseDoMotivoRecebido,
  fraseSemSaldo,
  lerPedidoDeAjuste,
  pedidoVelho,
  perguntaDoMotivo,
  refDaSobraDoAjuste,
  refDoAjuste,
  resumoDasPartes,
  saldoCobre,
  type CarteiraDoAjuste,
  type MotivoRegistrado,
  type PedidoDeAjuste,
} from "@/lib/credits/ajuste";

/**
 * O PEDIDO DE AJUSTE NO SERVIDOR (09/10/2026). A conta e as frases moram em
 * lib/credits/ajuste.ts (puro); a regra do motivo, a conferência do JEV e a
 * devolução moram em lib/credits/reprovacao*.ts e são CHAMADAS daqui, nunca
 * copiadas: o motivo do ajuste é gravado por `reprovarPeca` com `comoAjuste`,
 * e o refazer grátis sai de `decidirCortesia`, a mesma política do botão
 * Refazer. Aqui fica só o fluxo do card: guardar o pedido, receber o motivo,
 * cobrar (ou não) ANTES de gerar, e devolver o que não saiu.
 *
 * Tudo o que toca o banco passa pelo `DepositoDoAjuste`, trocável na prova
 * (scripts/testes/pedir-ajuste-0910.test.mts) por um em memória.
 *
 * Um clique só leva: o pedido sai do card de forma atômica (`tomarPedido`)
 * antes de qualquer cobrança. Se algo impede de seguir (sem saldo), ele volta
 * para o card com o motivo já gravado, e o próximo clique não grava outro.
 */

export type Mensagem = { role: "user" | "assistant"; content: string; timestamp: string };

export type CardDoAjuste = { id: string; projectId: string; projectUserId: string; metadata: unknown; agentName: string };
export type PecaDoAjuste = { id: string; status: string; metadata: unknown; projectId: string };

export type DepositoDoAjuste = {
  card(cardId: string): Promise<CardDoAjuste | null>;
  podeUsar(userId: string, projeto: { id: string; userId: string }): Promise<boolean>;
  /** Grava o pedido no card (só a chave, jsonb). */
  guardarPedido(cardId: string, pedido: PedidoDeAjuste): Promise<void>;
  /** Tira o pedido do card SE ainda for este. True só para quem tirou. */
  tomarPedido(cardId: string, pedidoId: string): Promise<boolean>;
  /** Tira o pedido do card, qualquer que seja (cancelar). */
  apagarPedido(cardId: string): Promise<void>;
  acrescentarNoChat(cardId: string, msgs: Mensagem[]): Promise<Mensagem[]>;
  peca(postId: string): Promise<PecaDoAjuste | null>;
  /** Grava só `metadata.reprovacao` da peça (jsonb), sem tocar no resto. */
  gravarReprovacaoDaPeca(postId: string, estado: EstadoDaReprovacao): Promise<void>;
  carteira(userId: string, qual: CarteiraDoAjuste): Promise<{ saldo: number; interno: boolean }>;
  fraseDoMembro(userId: string, conta: { necessario: number; disponivel: number }): Promise<string | null>;
  cortesiasHoje(projectId: string): Promise<number>;
  /** Lança `SaldoInsuficiente` sem cobrar nada quando não dá. */
  debitar(a: { userId: string; quantidade: number; projectId: string; refId: string; note: string; cortesia?: { motivo: string } }): Promise<{ balance: number }>;
  creditar(a: { userId: string; quantidade: number; projectId: string; refId: string; note: string }): Promise<{ duplicado: boolean; balance: number }>;
  reprovar(a: Parameters<typeof reprovarPeca>[0]): Promise<ResultadoDaReprovacao>;
  agora(): Date;
  novoId(): string;
};

function depositoPadrao(): DepositoDoAjuste {
  return {
    async card(cardId) {
      const c = await prisma.campaignCard.findUnique({ where: { id: cardId }, select: { id: true, projectId: true, metadata: true, agentName: true, project: { select: { userId: true } } } });
      return c ? { id: c.id, projectId: c.projectId, projectUserId: c.project.userId, metadata: c.metadata, agentName: c.agentName } : null;
    },
    podeUsar: (userId, projeto) => podeUsarProjeto(userId, projeto),
    async guardarPedido(cardId, pedido) {
      const json = JSON.stringify(pedido);
      await prisma.$executeRaw`UPDATE campaign_cards SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{pedidoDeAjuste}', ${json}::jsonb, true) WHERE id = ${cardId}`;
    },
    async tomarPedido(cardId, pedidoId) {
      const n = await prisma.$executeRaw`UPDATE campaign_cards SET metadata = metadata - 'pedidoDeAjuste' WHERE id = ${cardId} AND metadata -> 'pedidoDeAjuste' ->> 'id' = ${pedidoId}`;
      return n === 1;
    },
    async apagarPedido(cardId) {
      await prisma.$executeRaw`UPDATE campaign_cards SET metadata = COALESCE(metadata, '{}'::jsonb) - 'pedidoDeAjuste' WHERE id = ${cardId}`;
    },
    async acrescentarNoChat(cardId, msgs) {
      const c = await prisma.campaignCard.findUnique({ where: { id: cardId }, select: { chatHistory: true } });
      const historico = [...(Array.isArray(c?.chatHistory) ? (c!.chatHistory as Mensagem[]) : []), ...msgs];
      await prisma.campaignCard.update({ where: { id: cardId }, data: { chatHistory: historico as never } });
      return historico;
    },
    async peca(postId) {
      return prisma.post.findUnique({ where: { id: postId }, select: { id: true, status: true, metadata: true, projectId: true } });
    },
    async gravarReprovacaoDaPeca(postId, estado) {
      const json = JSON.stringify(estado);
      await prisma.$executeRaw`UPDATE posts SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{reprovacao}', ${json}::jsonb, true) WHERE id = ${postId}`;
    },
    async carteira(userId, qual) {
      const c = await carteiraDeQuemFaz(userId);
      if (qual === "video") return { saldo: await saldoDeVideo(userId), interno: c.interno };
      return { saldo: c.saldo ?? 0, interno: c.interno };
    },
    fraseDoMembro: (userId, conta) => fraseDeSaldoDoMembro(userId, conta),
    cortesiasHoje: (projectId) => cortesiasDeHoje(projectId),
    async debitar(a) {
      const r = await debitar({ userId: a.userId, quantidade: a.quantidade, operation: OPERACAO_DO_AJUSTE, projectId: a.projectId, refId: a.refId, note: a.note, cortesia: a.cortesia });
      return { balance: r.balance };
    },
    async creditar(a) {
      const r = await creditar({ userId: a.userId, quantidade: a.quantidade, operation: OPERACAO_DA_SOBRA_DO_AJUSTE, refId: a.refId, note: a.note, unico: true, projectId: a.projectId });
      return { duplicado: r.duplicado, balance: r.balance };
    },
    reprovar: (a) => reprovarPeca(a),
    agora: () => new Date(),
    novoId: () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  };
}

const quando = (dep: DepositoDoAjuste) => dep.agora().toISOString();

// ── 1. Guardar o pedido e perguntar o motivo ──────────────────────────────────

export type PlanoDoAjuste = Omit<PedidoDeAjuste, "id" | "criadoEm" | "mensagem" | "resumo" | "motivoRegistrado"> & { resumo?: string };

/**
 * O PEDIDO VIRA PERGUNTA, NUNCA GERAÇÃO. A mensagem entra no chat, o pedido
 * (com o custo já calculado) fica guardado no card, e o agente pergunta o
 * motivo com o custo e o saldo. Nada é gerado nem cobrado aqui.
 */
export async function guardarPedidoDeAjuste(
  args: {
    card: CardDoAjuste;
    userId: string;
    mensagem: string;
    plano: PlanoDoAjuste;
    /** O que vem antes da pergunta (a regra de "nunca cite" já salva). */
    prefixo?: string;
    /** O chat já foi escrito por quem chamou (o Vitor pergunta com as palavras dele). */
    semChat?: boolean;
  },
  dep: DepositoDoAjuste = depositoPadrao()
): Promise<{ pedido: PedidoDeAjuste; chatHistory: Mensagem[]; saldo: number; interno: boolean; pergunta: string; aindaGratis: boolean }> {
  const pedido: PedidoDeAjuste = {
    ...args.plano,
    id: dep.novoId(),
    mensagem: args.mensagem.trim().slice(0, 2000),
    resumo: args.plano.resumo ?? resumoDasPartes(args.plano.partes),
    criadoEm: quando(dep),
    motivoRegistrado: null,
  };
  const [carteira, peca] = await Promise.all([dep.carteira(args.userId, pedido.carteira), pedido.postId ? dep.peca(pedido.postId) : Promise.resolve(null)]);
  // A peça com erro confirmado e refazer grátis ainda não usado: o ajuste não cobra, e a pergunta já diz.
  const aindaGratis = Boolean(peca && refazerSemCobrar(lerEstadoDaReprovacao(peca.metadata)));
  const pergunta = `${args.prefixo ? `${args.prefixo} ` : ""}${perguntaDoMotivo({ resumo: pedido.resumo, creditos: pedido.creditos, carteira: pedido.carteira, saldo: carteira.saldo, interno: carteira.interno, aParte: pedido.aParte ?? null, aindaGratis })}`;
  await dep.guardarPedido(args.card.id, pedido);
  const chatHistory = await dep.acrescentarNoChat(
    args.card.id,
    args.semChat
      ? []
      : [
          { role: "user", content: args.mensagem, timestamp: quando(dep) },
          { role: "assistant", content: pergunta, timestamp: quando(dep) },
        ]
  );
  return { pedido, chatHistory, saldo: carteira.saldo, interno: carteira.interno, pergunta, aindaGratis };
}

// ── 2. O motivo escolhido ─────────────────────────────────────────────────────

export type FalhaDoMotivo =
  | { erro: "nao_encontrado"; mensagem: string }
  | { erro: "sem_pedido"; mensagem: string }
  | { erro: "pedido_velho"; mensagem: string }
  | { erro: "motivo_invalido"; mensagem: string }
  | { erro: "ja_publicado"; mensagem: string }
  | { erro: "sem_saldo"; mensagem: string; necessario: number; disponivel: number };

export type MotivoAceito = {
  ok: true;
  pedido: PedidoDeAjuste;
  /** O que saiu da carteira agora (0 na cortesia, e no vídeo, que cobra quando o trabalho começa). */
  cobrado: number;
  cortesia: { motivo: string } | null;
  registrado: MotivoRegistrado;
  saldoDepois: number | null;
  frase: string;
  chatHistory: Mensagem[];
};

export type ResultadoDoMotivo = MotivoAceito | ({ ok: false; chatHistory?: Mensagem[] } & FalhaDoMotivo);

/**
 * RECEBE O MOTIVO, DECIDE E COBRA, ANTES DE GERAR QUALQUER COISA.
 *
 *   - gosto e "pedi diferente": cobra o custo cotado (sem saldo, não segue);
 *   - erro da plataforma: a reprovação com motivo confere (código e JEV).
 *     Confirmado: os créditos da peça voltam e o ajuste é cortesia.
 *     Não confirmado: cobra agora, e a fila do admin decide depois;
 *   - a peça que já tinha um refazer grátis (erro confirmado antes) usa ele.
 *
 * Quem chama (a rota do chat) só executa o ajuste quando isto volta `ok`.
 */
export async function confirmarMotivoDoAjuste(
  args: {
    cardId: string;
    userId: string;
    pedidoId: string;
    categoria: unknown;
    texto?: unknown;
    /** Para a prova: as provas e o JEV de mentira, repassados à reprovação. */
    provas?: Parameters<typeof reprovarPeca>[0]["provas"];
    perguntar?: Parameters<typeof reprovarPeca>[0]["perguntar"];
    usarJev?: boolean;
  },
  dep: DepositoDoAjuste = depositoPadrao()
): Promise<ResultadoDoMotivo> {
  const card = await dep.card(args.cardId);
  if (!card || !(await dep.podeUsar(args.userId, { id: card.projectId, userId: card.projectUserId }))) return { ok: false, erro: "nao_encontrado", mensagem: "Card não encontrado." };
  const pedido = lerPedidoDeAjuste(card.metadata);
  if (!pedido || pedido.id !== args.pedidoId) return { ok: false, erro: "sem_pedido", mensagem: "Este pedido de ajuste não está mais aberto. Escreva o ajuste de novo e clique em Pedir ajuste." };
  if (pedidoVelho(pedido, dep.agora().getTime())) {
    await dep.apagarPedido(card.id);
    return { ok: false, erro: "pedido_velho", mensagem: "Este pedido de ajuste ficou velho e o custo pode ter mudado. Escreva o ajuste de novo e clique em Pedir ajuste." };
  }
  // O texto do motivo é o que a pessoa disse; sem texto, o próprio pedido de ajuste.
  const textoDoMotivo = typeof args.texto === "string" && args.texto.trim() ? args.texto : pedido.mensagem;
  const motivo = validarMotivo({ categoria: args.categoria, texto: textoDoMotivo });
  if (!motivo.ok) return { ok: false, erro: "motivo_invalido", mensagem: motivo.erro.replace("da reprovação", "do ajuste") };
  if (!pedido.postId) return { ok: false, erro: "nao_encontrado", mensagem: "Este card não tem peça ligada, então não há o que ajustar por aqui." };

  // UM CLIQUE SÓ LEVA: o pedido sai do card antes de qualquer cobrança.
  if (!(await dep.tomarPedido(card.id, pedido.id))) return { ok: false, erro: "sem_pedido", mensagem: "Já recebi o motivo deste ajuste e ele está sendo feito." };
  const devolverAoCard = async (registrado: MotivoRegistrado | null) => {
    await dep.guardarPedido(card.id, { ...pedido, motivoRegistrado: registrado ?? pedido.motivoRegistrado ?? null }).catch(() => undefined);
  };

  const pecaAntes = await dep.peca(pedido.postId);
  if (!pecaAntes) {
    await dep.apagarPedido(card.id);
    return { ok: false, erro: "nao_encontrado", mensagem: "A peça deste ajuste não existe mais." };
  }
  if (pecaAntes.status === "published" || pecaAntes.status === "publishing") {
    await dep.apagarPedido(card.id);
    return { ok: false, erro: "ja_publicado", mensagem: "Esta peça já foi publicada e não pode ser ajustada. Arquive e gere outra se quiser trocar o que está no ar." };
  }

  const [carteira, cortesiasHoje] = await Promise.all([dep.carteira(args.userId, pedido.carteira), dep.cortesiasHoje(card.projectId)]);
  // O refazer grátis que a peça JÁ tinha (erro confirmado antes, ainda não usado).
  const cortesiaAntes = decidirCortesia(estadoDaPecaParaCortesia(pecaAntes), cortesiasHoje);
  const classe = classeDaCategoria(motivo.categoria);

  const semSaldo = async (registrado: MotivoRegistrado | null, mensagemDoDebito?: string | null): Promise<ResultadoDoMotivo> => {
    await devolverAoCard(registrado);
    const doMembro = mensagemDoDebito ?? (await dep.fraseDoMembro(args.userId, { necessario: pedido.creditos, disponivel: carteira.saldo }).catch(() => null));
    const mensagem = fraseSemSaldo({ creditos: pedido.creditos, saldo: carteira.saldo, carteira: pedido.carteira, doMembro });
    const chatHistory = await dep.acrescentarNoChat(card.id, [{ role: "assistant", content: mensagem, timestamp: quando(dep) }]);
    return { ok: false, erro: "sem_saldo", mensagem, necessario: pedido.creditos, disponivel: carteira.saldo, chatHistory };
  };

  let registrado: MotivoRegistrado;
  let cortesia: { motivo: string } | null;
  if (pedido.motivoRegistrado) {
    // O motivo já foi gravado num clique anterior que parou no saldo: não grava outro.
    registrado = pedido.motivoRegistrado;
    cortesia = registrado.cortesia ? { motivo: registrado.cortesia } : cortesiaAntes;
  } else {
    // Gosto sem saldo para (e sem refazer grátis): nada é gravado, o pedido volta ao card.
    if (classe === "gosto" && !cortesiaAntes && !saldoCobre({ creditos: pedido.creditos, saldo: carteira.saldo, interno: carteira.interno })) return semSaldo(null);
    const r = await dep.reprovar({
      postId: pedido.postId,
      userId: args.userId,
      categoria: motivo.categoria,
      texto: motivo.texto,
      comoAjuste: { pedidoId: pedido.id, pedido: pedido.mensagem },
      provas: args.provas,
      perguntar: args.perguntar,
      usarJev: args.usarJev,
    });
    if (!r.ok) {
      await devolverAoCard(null);
      if (r.erro === "motivo_invalido") return { ok: false, erro: "motivo_invalido", mensagem: r.mensagem };
      if (r.erro === "ja_publicado") return { ok: false, erro: "ja_publicado", mensagem: "Esta peça já foi publicada e não pode ser ajustada." };
      return { ok: false, erro: "nao_encontrado", mensagem: "Peça não encontrada." };
    }
    const pecaDepois = (await dep.peca(pedido.postId)) ?? pecaAntes;
    const cortesiaDepois = decidirCortesia(estadoDaPecaParaCortesia(pecaDepois), cortesiasHoje);
    cortesia = cortesiaDepois ?? cortesiaAntes;
    registrado = { reprovacaoId: r.estado.id, categoria: motivo.categoria, situacao: r.estado.situacao, cortesia: cortesia?.motivo ?? null, creditosDevolvidos: r.estado.creditos };
  }

  // Sem cortesia, o saldo precisa cobrir ANTES de gerar (o erro em análise também cobra agora).
  if (!cortesia && !saldoCobre({ creditos: pedido.creditos, saldo: carteira.saldo, interno: carteira.interno })) return semSaldo(registrado);

  // A COBRANÇA, antes de gerar. O vídeo por IA cobra na fila (carteira de
  // vídeo) e o Vitor cobra quando gera a cena; para o vídeo por IA, aqui fica
  // só a linha de cortesia, quando é o caso, para o extrato contar e o teto de
  // cortesias do dia valer (o Vitor escreve a dele).
  let cobrado = 0;
  let saldoDepois: number | null = null;
  const cobraAqui = pedido.carteira === "plano" && !pedido.cobradoFora;
  const nota = `Ajuste pedido no card: ${pedido.resumo || "a peça"} (${NOME_DA_CATEGORIA[motivo.categoria].toLowerCase()})`;
  try {
    if (cobraAqui && pedido.creditos > 0) {
      const d = await dep.debitar({ userId: args.userId, quantidade: pedido.creditos, projectId: card.projectId, refId: refDoAjuste(pedido.postId, pedido.id), note: nota, cortesia: cortesia ?? undefined });
      // Acesso interno grava a linha e não mexe no saldo: nada foi cobrado de verdade.
      cobrado = cortesia || carteira.interno ? 0 : pedido.creditos;
      saldoDepois = d.balance;
    } else if (pedido.carteira === "video" && cortesia && pedido.creditos > 0) {
      await dep.debitar({ userId: args.userId, quantidade: pedido.creditos, projectId: card.projectId, refId: refDoAjuste(pedido.postId, pedido.id), note: `${nota}, em créditos de vídeo`, cortesia });
    }
  } catch (e) {
    if (e instanceof SaldoInsuficiente) return semSaldo(registrado, e.equipe ? e.message : null);
    await devolverAoCard(registrado);
    throw e;
  }

  // O estado da reprovação na peça guarda o que o ajuste cobrou (o admin devolve
  // junto se reconhecer o erro) e, na cortesia, que o refazer grátis foi usado.
  const pecaAgora = await dep.peca(pedido.postId);
  const estado = pecaAgora ? lerEstadoDaReprovacao(pecaAgora.metadata) : null;
  if (estado) {
    const doAjuste = estado.id === registrado.reprovacaoId;
    await dep
      .gravarReprovacaoDaPeca(pedido.postId, {
        ...estado,
        ...(cortesia ? { refeitaGratisEm: quando(dep) } : {}),
        ...(doAjuste ? { ajuste: { id: pedido.id, cobrado, devolvido: 0 } } : {}),
      })
      .catch((e) => console.warn("[ajuste] estado da peça não gravado:", e instanceof Error ? e.message : e));
  }

  const frase = fraseDoMotivoRecebido({
    categoria: motivo.categoria,
    situacao: registrado.situacao,
    cobrado,
    carteira: pedido.carteira,
    cortesia: cortesia?.motivo ?? null,
    creditosDevolvidos: registrado.creditosDevolvidos,
    saldoDepois: carteira.interno ? null : saldoDepois,
    cobradoDepois: !cobraAqui && !cortesia,
  });
  const chatHistory = await dep.acrescentarNoChat(card.id, [
    { role: "user", content: `Motivo: ${NOME_DA_CATEGORIA[motivo.categoria]}`, timestamp: quando(dep) },
    { role: "assistant", content: frase, timestamp: quando(dep) },
  ]);
  return { ok: true, pedido: { ...pedido, motivoRegistrado: registrado }, cobrado, cortesia, registrado, saldoDepois: carteira.interno ? null : saldoDepois, frase, chatHistory };
}

// ── 3. O que não saiu volta ───────────────────────────────────────────────────

/**
 * DEVOLVE A PARTE DO AJUSTE QUE NÃO SAIU, uma vez só (refId da sobra), e nunca
 * mais do que foi cobrado. Ajuste grátis não devolve nada (nada foi cobrado).
 * Devolve quanto voltou.
 */
export async function devolverOQueNaoSaiu(
  args: { userId: string; projectId: string; pedido: PedidoDeAjuste; cobrado: number; naoEntregue: number; porque?: string; cardId?: string },
  dep: DepositoDoAjuste = depositoPadrao()
): Promise<number> {
  const quantidade = Math.min(Math.max(0, Math.floor(args.naoEntregue)), Math.max(0, Math.floor(args.cobrado)));
  if (quantidade <= 0 || !args.pedido.postId) return 0;
  const r = await dep.creditar({
    userId: args.userId,
    quantidade,
    projectId: args.projectId,
    refId: refDaSobraDoAjuste(args.pedido.postId, args.pedido.id),
    note: `devolução: parte do ajuste que não saiu${args.porque ? ` (${args.porque})` : ""}`,
  });
  if (r.duplicado) return 0;
  // A peça lembra quanto do ajuste já voltou: o admin, se reconhecer o erro, devolve só o resto.
  const peca = await dep.peca(args.pedido.postId).catch(() => null);
  const estado = peca ? lerEstadoDaReprovacao(peca.metadata) : null;
  if (estado?.ajuste && estado.ajuste.id === args.pedido.id) {
    await dep.gravarReprovacaoDaPeca(args.pedido.postId, { ...estado, ajuste: { ...estado.ajuste, devolvido: (estado.ajuste.devolvido ?? 0) + quantidade } }).catch(() => undefined);
  }
  if (args.cardId) {
    await dep.acrescentarNoChat(args.cardId, [{ role: "assistant", content: fraseDaDevolucao(quantidade), timestamp: quando(dep) }]).catch(() => undefined);
  }
  return quantidade;
}

// ── 4. Cancelar ───────────────────────────────────────────────────────────────

/** Tira o pedido do card sem gerar nada e sem cobrar. */
export async function cancelarPedidoDeAjuste(
  args: { cardId: string; userId: string },
  dep: DepositoDoAjuste = depositoPadrao()
): Promise<{ ok: boolean; chatHistory?: Mensagem[] }> {
  const card = await dep.card(args.cardId);
  if (!card || !(await dep.podeUsar(args.userId, { id: card.projectId, userId: card.projectUserId }))) return { ok: false };
  const tinha = Boolean(lerPedidoDeAjuste(card.metadata));
  await dep.apagarPedido(card.id);
  const chatHistory = tinha
    ? await dep.acrescentarNoChat(card.id, [{ role: "assistant", content: "Tudo bem, não refiz nada e nada foi cobrado. A peça continua como está.", timestamp: quando(dep) }])
    : undefined;
  return { ok: true, chatHistory };
}

export { CHAVE_DO_PEDIDO_DE_AJUSTE };
