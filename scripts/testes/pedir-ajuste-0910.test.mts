// O PEDIR AJUSTE DO CARD, COM MOTIVO E CRÉDITO (decisão do Bruno em
// 09/10/2026), sem banco, sem rede e sem IA de verdade: o card, a peça, o
// extrato e o JEV são dublês em memória. Prova que:
//   - a conta do ajuste é a tabela de sempre (texto por rede, arte por proporção, lâmina por lâmina);
//   - ajuste com motivo "gosto" cobra ANTES de gerar, e a peça não morre;
//   - erro confirmado devolve os créditos da peça e o ajuste sai grátis (linha de valor zero);
//   - erro não confirmado cobra agora, vai ao admin, e o admin devolve a peça E o ajuste;
//   - saldo insuficiente bloqueia: nada cobrado, nada gravado no gosto, o pedido fica;
//   - um clique só leva (dois cliques não cobram duas vezes);
//   - o que não saiu volta uma vez só, e nunca mais do que foi cobrado;
//   - o chat sem motivo não gera nada: a rota não importa gerador, e só data e rede seguem direto;
//   - o "sim" do Vitor sem motivo não gera nada pago.
// Rodar: npx tsx --test scripts/testes/pedir-ajuste-0910.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

delete process.env.TYPESAFE_API_KEY;
delete process.env.JEV_LIGADO;

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..", "..");

const {
  custoDoAjusteDoDia,
  custoDosTextos,
  custoDaArteAvulsa,
  creditosNaoEntregues,
  geraAlgoPago,
  acoesSemCusto,
  perguntaDoMotivo,
  fraseSemSaldo,
  fraseDoMotivoRecebido,
  resumoDasPartes,
  BOTOES_DO_MOTIVO,
  lerPedidoDeAjuste,
  refDoAjuste,
  refDaSobraDoAjuste,
  planoDaArtePelaLegenda,
  avisoDaArtePelaLegenda,
} = await import("@/lib/credits/ajuste");
const { CATEGORIAS_DE_REPROVACAO, ajusteADevolver, ajusteDeVideoADevolver, lerEstadoDaReprovacao, refazerSemCobrar } = await import("@/lib/credits/reprovacao");
const { reprovarPeca, decidirReprovacaoPeloAdmin } = await import("@/lib/credits/reprovacao-servidor");
const { guardarPedidoDeAjuste, confirmarMotivoDoAjuste, devolverOQueNaoSaiu, cancelarPedidoDeAjuste, avisarArteDaLegenda, anotarCobrancaDoVideo } = await import("@/lib/credits/ajuste-servidor");
const { SaldoInsuficiente } = await import("@/lib/credits");
const { CREDIT_COSTS } = await import("@/lib/credits/tabela");
const { gruposDeFormato } = await import("@/lib/media/formatos-das-redes");
const { motivoDoSim } = await import("@/lib/media/ajuste-pelo-chat");

type DepRep = NonNullable<Parameters<typeof reprovarPeca>[1]>;
type DepAj = NonNullable<Parameters<typeof confirmarMotivoDoAjuste>[1]>;
type Provas = NonNullable<Parameters<typeof reprovarPeca>[0]["provas"]>;
type Perguntador = NonNullable<Parameters<typeof reprovarPeca>[0]["perguntar"]>;

const TRAVESSAO = /[\u2014\u2013]/;

const provasLimpas = (extra: Partial<Provas> = {}): Provas => ({
  rede: "instagram",
  tipoDePeca: "image",
  texto: "Um post sobre gestão de tempo, sem números.",
  arte: { existe: true, formato: { esperado: "1080x1350 (4:5)", medido: "1080x1350", bate: true }, margem: { cortado: false, resumo: "nada cortado" }, olho: { parecer: "ok", reprovou: null }, textoEsperado: ["Gestão de tempo"] },
  lastro: { conferido: true, frasesSemNumero: [], frasesSemFonte: [] },
  conteudoProprio: { conferido: true, frasesSemProva: [] },
  identidade: { aprovada: true },
  revisora: { reprovou: false, parecer: null },
  ...extra,
});

const jevDeMentira = (noul: number): Perguntador => async (_ctx, perguntas) => {
  const saida: Awaited<ReturnType<Perguntador>> = {};
  for (const k of Object.keys(perguntas)) saida[k] = { type: "noul", noul };
  return saida;
};

/**
 * O MUNDO EM MEMÓRIA: um card (com o chat e o metadata), uma peça, o saldo e o
 * extrato, os motivos gravados e os avisos. Os dois depósitos (o do ajuste e o
 * da reprovação) enxergam a mesma peça e o mesmo extrato, como no banco.
 */
function mundo(o: { saldo?: number; saldoDeVideo?: number; cobrado?: number; provas?: Provas; status?: string; metadataDaPeca?: Record<string, unknown> } = {}) {
  let saldo = o.saldo ?? 1000;
  const sino: Array<Parameters<DepAj["notificar"]>[0]> = [];
  const extrato: Array<{ amount: number; refId: string; note: string; operation: string }> = [];
  const motivos = new Map<string, Parameters<DepRep["gravarMotivo"]>[0]>();
  const avisos: Array<Parameters<DepRep["notificar"]>[0]> = [];
  const admins: Array<Parameters<DepRep["avisarAdmins"]>[0]> = [];
  let seq = 0;
  let provasPedidas = 0;
  const peca = {
    id: "post1",
    projectId: "proj1",
    projectUserId: "dono",
    platform: "instagram",
    content: "Um post sobre gestão de tempo, sem números.",
    imageUrl: "data:image/png;base64,xxxxxxxxxxxxxxxx",
    mediaType: "image",
    metadata: { frase: "Gestão de tempo", ...(o.metadataDaPeca ?? {}) } as Record<string, unknown>,
    runId: "run1",
    dayOfWeek: 2,
    status: o.status ?? "draft",
  };
  const card = { id: "card1", projectId: "proj1", projectUserId: "dono", agentName: "Paulo Publisher", metadata: {} as Record<string, unknown>, chat: [] as Array<{ role: string; content: string; timestamp: string }> };
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

  const depRep: DepRep = {
    async peca(id) {
      return id === peca.id ? clone(peca) : null;
    },
    async podeUsar(userId, projeto) {
      return userId === projeto.userId;
    },
    async gravarPeca(id, dados) {
      assert.equal(id, peca.id);
      if (dados.status) peca.status = dados.status;
      peca.metadata = clone(dados.metadata);
    },
    async cobradoDaPeca() {
      return o.cobrado ?? 500;
    },
    async jaDevolvidoDaCampanha({ runId }) {
      return [...motivos.values()].filter((m) => m.runId === runId).reduce((s, m) => s + m.creditosDevolvidos, 0);
    },
    async creditar(a) {
      if (extrato.some((l) => l.refId === a.refId && l.amount > 0)) return { duplicado: true };
      saldo += a.quantidade;
      extrato.push({ amount: a.quantidade, refId: a.refId, note: a.note, operation: "reprovacao_devolucao" });
      return { duplicado: false };
    },
    async provas() {
      provasPedidas++;
      return o.provas ?? provasLimpas();
    },
    async gravarMotivo(m) {
      motivos.set(m.id, clone(m));
    },
    async atualizarMotivo(id, campos) {
      const m = motivos.get(id);
      if (m) motivos.set(id, { ...m, ...campos });
    },
    async motivo(id) {
      const m = motivos.get(id);
      return m ? clone(m) : null;
    },
    async memoria() {},
    async notificar(a) {
      avisos.push(a);
    },
    async avisarAdmins(a) {
      admins.push(a);
    },
    async registrarAcaoDoAdmin() {},
    agora: () => new Date("2026-10-09T12:00:00-03:00"),
    novoId: () => `rep${++seq}`,
  };

  const debitos: Array<{ quantidade: number; refId: string; cortesia: boolean }> = [];
  const dep: DepAj = {
    async card(id) {
      return id === card.id ? { id: card.id, projectId: card.projectId, projectUserId: card.projectUserId, metadata: clone(card.metadata), agentName: card.agentName } : null;
    },
    async podeUsar(userId, projeto) {
      return userId === projeto.userId;
    },
    async guardarPedido(_id, pedido) {
      card.metadata = { ...card.metadata, pedidoDeAjuste: clone(pedido) };
    },
    async tomarPedido(_id, pedidoId) {
      const p = card.metadata.pedidoDeAjuste as { id?: string } | undefined;
      if (p?.id !== pedidoId) return false;
      const { pedidoDeAjuste: _fora, ...resto } = card.metadata;
      void _fora;
      card.metadata = resto;
      return true;
    },
    async apagarPedido() {
      const { pedidoDeAjuste: _fora, ...resto } = card.metadata;
      void _fora;
      card.metadata = resto;
    },
    async acrescentarNoChat(_id, msgs) {
      card.chat.push(...msgs);
      return clone(card.chat) as never;
    },
    async peca(id) {
      return id === peca.id ? { id: peca.id, status: peca.status, metadata: clone(peca.metadata), projectId: peca.projectId } : null;
    },
    async gravarReprovacaoDaPeca(id, estado) {
      assert.equal(id, peca.id);
      peca.metadata = { ...peca.metadata, reprovacao: clone(estado) };
    },
    async carteira(_userId, qual) {
      return { saldo: qual === "video" ? saldoDeVideo : saldo, interno: false };
    },
    async fraseDoMembro() {
      return null;
    },
    async cortesiasHoje() {
      return extrato.filter((l) => l.operation === "refazer_peca" && l.amount === 0 && l.note.includes("Sem cobrança")).length;
    },
    async debitar(a) {
      debitos.push({ quantidade: a.quantidade, refId: a.refId, cortesia: Boolean(a.cortesia) });
      if (a.cortesia) {
        extrato.push({ amount: 0, refId: a.refId, note: `${a.note}. Sem cobrança (${a.cortesia.motivo}): custaria ${a.quantidade} créditos`, operation: "refazer_peca" });
        return { balance: saldo };
      }
      if (saldo < a.quantidade) throw new SaldoInsuficiente(a.quantidade, saldo);
      saldo -= a.quantidade;
      extrato.push({ amount: -a.quantidade, refId: a.refId, note: a.note, operation: "refazer_peca" });
      return { balance: saldo };
    },
    async creditar(a) {
      if (extrato.some((l) => l.refId === a.refId && l.amount > 0)) return { duplicado: true, balance: saldo };
      saldo += a.quantidade;
      extrato.push({ amount: a.quantidade, refId: a.refId, note: a.note, operation: "ajuste_devolucao" });
      return { duplicado: false, balance: saldo };
    },
    reprovar: (a) => reprovarPeca(a, depRep),
    async notificar(a) {
      sino.push(a);
    },
    agora: () => new Date("2026-10-09T12:00:00-03:00"),
    novoId: () => `aj${++seq}`,
  };
  // A CARTEIRA DE VÍDEO e o extrato da fila do vídeo por IA (09/10, ponto 4 do Bruno).
  let saldoDeVideo = o.saldoDeVideo ?? 0;
  const extratoDeVideo: Array<{ amount: number; refId: string; operation: string }> = [];
  depRep.cobradoDoVideo = async (referencia) => {
    const debito = extratoDeVideo.filter((l) => l.operation === "video_ia" && l.refId === referencia).reduce((s, l) => s - l.amount, 0);
    const estornos = extratoDeVideo.filter((l) => l.operation === "estorno_video_ia" && (l.refId === referencia || l.refId === `${referencia}:sobra`)).reduce((s, l) => s + l.amount, 0);
    return Math.max(0, debito - estornos);
  };
  depRep.creditarVideo = async (a) => {
    if (extratoDeVideo.some((l) => l.refId === a.refId && l.amount > 0 && l.operation === "reprovacao_devolucao")) return { duplicado: true };
    saldoDeVideo += a.quantidade;
    extratoDeVideo.push({ amount: a.quantidade, refId: a.refId, operation: "reprovacao_devolucao" });
    return { duplicado: false };
  };
  /** A fila cobra (e às vezes estorna parte) como lib/media/video-por-ia.ts faz. */
  const filaDoVideo = (referencia: string, debito: number, estornoDaSobra = 0) => {
    saldoDeVideo -= debito;
    extratoDeVideo.push({ amount: -debito, refId: referencia, operation: "video_ia" });
    if (estornoDaSobra > 0) {
      saldoDeVideo += estornoDaSobra;
      extratoDeVideo.push({ amount: estornoDaSobra, refId: `${referencia}:sobra`, operation: "estorno_video_ia" });
    }
  };
  return {
    dep,
    depRep,
    peca,
    card,
    extrato,
    motivos,
    avisos,
    admins,
    debitos,
    sino,
    filaDoVideo,
    saldoDeVideo: () => saldoDeVideo,
    saldo: () => saldo,
    recarregar: (n: number) => {
      saldo += n;
    },
    provasPedidas: () => provasPedidas,
  };
}

/** O plano de um ajuste da arte de uma imagem em uma proporção: 42 créditos. */
const planoDaArte = () => {
  const c = custoDoAjusteDoDia({ acoes: [{ tipo: "arte" }], textosDistintos: 1, formato: "image", redes: ["instagram"], laminasAlvo: [], temArte: true });
  return { tipo: "dia" as const, slideIndex: null, acoes: [{ tipo: "arte", instrucao: "fundo azul" }], postId: "post1", carteira: "plano" as const, creditos: c.creditos, partes: c.partes };
};

async function pedir(m: ReturnType<typeof mundo>, mensagem = "refaz a arte com o fundo azul") {
  return guardarPedidoDeAjuste({ card: { id: "card1", projectId: "proj1", projectUserId: "dono", metadata: {}, agentName: "Paulo Publisher" }, userId: "dono", mensagem, plano: planoDaArte() }, m.dep);
}

// ─── a conta, pura ───

test("a conta do ajuste é a tabela de sempre: texto por rede, arte por proporção, lâmina por lâmina", () => {
  const texto = custoDoAjusteDoDia({ acoes: [{ tipo: "texto" }], textosDistintos: 2, formato: "image", redes: ["instagram", "linkedin"], laminasAlvo: [], temArte: true });
  assert.equal(texto.creditos, CREDIT_COSTS.post_text * 2);
  assert.deepEqual(texto.partes.map((p) => p.chave), ["texto"]);

  const arte = custoDoAjusteDoDia({ acoes: [{ tipo: "arte" }], textosDistintos: 2, formato: "image", redes: ["instagram", "linkedin"], laminasAlvo: [], temArte: true });
  assert.equal(arte.creditos, CREDIT_COSTS.imagem_geracao * gruposDeFormato(["instagram", "linkedin"], "image").length, "uma geração por proporção, o recorte não paga");

  const lamina = custoDoAjusteDoDia({ acoes: [{ tipo: "arte" }], textosDistintos: 1, formato: "carousel", redes: ["instagram"], laminasAlvo: [1], temArte: true });
  assert.equal(lamina.creditos, CREDIT_COSTS.carousel_lamina);
  assert.deepEqual(lamina.partes.map((p) => p.chave), ["lamina-1"]);
  assert.equal(resumoDasPartes(lamina.partes), "a lâmina 2");

  const ambos = custoDoAjusteDoDia({ acoes: [{ tipo: "texto" }, { tipo: "arte" }], textosDistintos: 1, formato: "carousel", redes: ["instagram"], laminasAlvo: [0, 2], temArte: true });
  assert.equal(ambos.creditos, CREDIT_COSTS.post_text + 2 * CREDIT_COSTS.carousel_lamina);
  assert.equal(resumoDasPartes(ambos.partes), "o texto e as lâminas 1 e 3");

  const semArte = custoDoAjusteDoDia({ acoes: [{ tipo: "arte" }], textosDistintos: 1, formato: "text", redes: ["linkedin"], laminasAlvo: [], temArte: false });
  assert.equal(semArte.creditos, 0);
  assert.equal(geraAlgoPago(semArte.partes), false, "arte num dia sem imagem não gera nada");

  const data = custoDoAjusteDoDia({ acoes: [{ tipo: "data" }], textosDistintos: 3, formato: "image", redes: ["instagram"], laminasAlvo: [], temArte: true });
  assert.equal(geraAlgoPago(data.partes), false, "mudar a data não gera nada");

  const rede = custoDoAjusteDoDia({ acoes: [{ tipo: "rede" }], textosDistintos: 1, formato: "image", redes: ["instagram"], laminasAlvo: [], temArte: true, redesNovas: 1 });
  assert.equal(rede.creditos, 0);
  assert.deepEqual(rede.aParte, { creditos: CREDIT_COSTS.post_text, oQue: "levar a peça para a rede nova" });

  assert.equal(custoDosTextos(3).creditos, 3 * CREDIT_COSTS.post_text);
  assert.equal(custoDaArteAvulsa({ formato: "image", redes: ["instagram"], laminaAlvo: null }).creditos, CREDIT_COSTS.imagem_geracao);
});

test("o chat sem motivo só faz direto data e rede: texto e arte nunca passam pela porta sem custo", () => {
  const acoes = [{ tipo: "texto" }, { tipo: "arte" }, { tipo: "data" }, { tipo: "rede" }];
  assert.deepEqual(acoesSemCusto(acoes).map((a) => a.tipo), ["data", "rede"]);
  assert.deepEqual(acoesSemCusto([{ tipo: "arte" }]), [], "a arte com cotação zero (dia sem imagem) também não passa");
});

test("o que não saiu volta: etapa que falhou, ficou igual, esperou a identidade ou nem rodou", () => {
  const partes = [
    { chave: "texto", rotulo: "o texto", creditos: 15 },
    { chave: "lamina-0", rotulo: "a lâmina 1", creditos: 42 },
    { chave: "lamina-1", rotulo: "a lâmina 2", creditos: 42 },
  ];
  assert.equal(creditosNaoEntregues(partes, [{ chave: "texto", estado: "feito" }, { chave: "lamina-0", estado: "feito" }, { chave: "lamina-1", estado: "feito" }]), 0);
  assert.equal(creditosNaoEntregues(partes, [{ chave: "texto", estado: "feito", detalhe: "já estava assim" }, { chave: "lamina-0", estado: "falhou", detalhe: "ficou a anterior" }, { chave: "lamina-1", estado: "feito" }]), 57);
  assert.equal(creditosNaoEntregues(partes, []), 99, "nada rodou: tudo volta");
});

test("as frases do ajuste e os botões não têm travessão, e os botões são as categorias da reprovação", () => {
  assert.deepEqual(BOTOES_DO_MOTIVO.map((b) => b.id), CATEGORIAS_DE_REPROVACAO.map((c) => c.id));
  const frases = [
    perguntaDoMotivo({ resumo: "a arte", creditos: 42, carteira: "plano", saldo: 100 }),
    perguntaDoMotivo({ resumo: "o vídeo do dia", creditos: 600, carteira: "video", saldo: 100, aParte: { creditos: 15, oQue: "levar a peça para a rede nova" } }),
    perguntaDoMotivo({ resumo: "", creditos: 42, carteira: "plano", saldo: null, aindaGratis: true }),
    fraseSemSaldo({ creditos: 42, saldo: 10, carteira: "plano" }),
    fraseSemSaldo({ creditos: 600, saldo: 10, carteira: "video" }),
    fraseDoMotivoRecebido({ categoria: "gosto", situacao: "mantido", cobrado: 42, carteira: "plano", cortesia: null, creditosDevolvidos: 0, saldoDepois: 58 }),
    fraseDoMotivoRecebido({ categoria: "marca_errada", situacao: "devolvido", cobrado: 0, carteira: "plano", cortesia: "erro confirmado pelas provas", creditosDevolvidos: 57, saldoDepois: 157 }),
    fraseDoMotivoRecebido({ categoria: "outro", situacao: "em_analise", cobrado: 42, carteira: "plano", cortesia: null, creditosDevolvidos: 0, saldoDepois: 58 }),
  ];
  for (const f of frases) assert.ok(!TRAVESSAO.test(f), f);
  assert.match(frases[0], /42 créditos/);
  assert.match(frases[0], /saldo é de 100 créditos/);
});

// ─── o fluxo, com os dublês ───

test("pedir ajuste não gera nada: guarda o pedido no card e pergunta o motivo com o custo e o saldo", async () => {
  const m = mundo({ saldo: 100 });
  const r = await pedir(m);
  assert.equal(r.pedido.creditos, CREDIT_COSTS.imagem_geracao);
  assert.equal(lerPedidoDeAjuste(m.card.metadata)?.id, r.pedido.id, "o pedido fica no card");
  assert.equal(m.debitos.length, 0, "nada cobrado");
  assert.equal(m.motivos.size, 0, "nada gravado como motivo");
  assert.equal(m.card.chat.length, 2);
  assert.equal(m.card.chat[0].role, "user");
  assert.match(m.card.chat[1].content, /motivo do ajuste/);
  assert.match(m.card.chat[1].content, /42 créditos/);
  assert.match(m.card.chat[1].content, /100 créditos/);
});

test("ajuste com motivo gosto: cobra antes de gerar, a peça não morre, o motivo vira registro de ajuste", async () => {
  const m = mundo({ saldo: 100 });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.cobrado, 42);
  assert.equal(r.cortesia, null);
  assert.equal(r.saldoDepois, 58);
  assert.equal(m.saldo(), 58);
  assert.deepEqual(m.debitos, [{ quantidade: 42, refId: refDoAjuste("post1", pedido.id), cortesia: false }]);
  assert.equal(m.peca.status, "draft", "pedir ajuste não reprova a peça");
  assert.equal(m.provasPedidas(), 0, "gosto não roda as provas");
  const estado = lerEstadoDaReprovacao(m.peca.metadata)!;
  assert.equal(estado.origem, "ajuste");
  assert.equal(estado.situacao, "mantido");
  assert.deepEqual(estado.ajuste, { id: pedido.id, cobrado: 42, devolvido: 0 });
  assert.equal(refazerSemCobrar(estado), false);
  const motivo = [...m.motivos.values()][0];
  assert.equal((motivo.provas as { origem?: string }).origem, "ajuste", "o admin vê que veio de um pedido de ajuste");
  assert.equal(lerPedidoDeAjuste(m.card.metadata), null, "o pedido saiu do card");
  assert.match(m.card.chat.at(-1)!.content, /Cobrei 42 créditos/);
  assert.ok(!TRAVESSAO.test(r.frase));
});

test("erro confirmado: os créditos da peça voltam, o ajuste sai grátis com linha de valor zero, e o refazer grátis fica usado", async () => {
  const m = mundo({ saldo: 100, cobrado: 500, provas: provasLimpas({ identidade: { aprovada: false } }) });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "marca_errada" }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.registrado.situacao, "devolvido");
  assert.equal(r.registrado.creditosDevolvidos, 57, "15 de texto + 42 da arte, a tabela da peça");
  assert.equal(r.cobrado, 0);
  assert.deepEqual(r.cortesia, { motivo: "erro confirmado pelas provas" });
  assert.equal(m.saldo(), 157, "nada saiu e a peça voltou");
  assert.deepEqual(m.debitos, [{ quantidade: 42, refId: refDoAjuste("post1", pedido.id), cortesia: true }], "a linha de cortesia conta no extrato");
  const estado = lerEstadoDaReprovacao(m.peca.metadata)!;
  assert.ok(estado.refeitaGratisEm, "o refazer grátis deste erro foi usado no ajuste");
  assert.equal(refazerSemCobrar(estado), false, "não sobra outro refazer grátis");
  assert.equal(m.peca.status, "draft");
  assert.equal(m.avisos[0]?.tipo, "estorno");
  assert.match(m.avisos[0]!.texto, /ajuste que você pediu sai sem cobrança/);
});

test("o refazer grátis de um erro confirmado vale só para ajuste por erro: por gosto cobra, e o grátis continua guardado", async () => {
  const m = mundo({ saldo: 0 });
  const r0 = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "marca_errada", texto: "", provas: provasLimpas({ identidade: { aprovada: false } }) }, m.depRep);
  assert.ok(r0.ok && r0.estado.situacao === "devolvido");
  m.peca.status = "draft";
  assert.equal(m.saldo(), 57, "a peça voltou");
  // 1. Ajuste por gosto: cobra, mesmo com o refazer grátis guardado.
  const { pedido } = await pedir(m);
  assert.match(m.card.chat.at(-1)!.content, /se o motivo for erro da plataforma, este ajuste não cobra/);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.cortesia, null, "gosto não usa o refazer grátis");
  assert.equal(r.cobrado, 42);
  assert.equal(m.saldo(), 15);
  const guardado = lerEstadoDaReprovacao(m.peca.metadata)!;
  assert.equal(guardado.id, r0.estado.id, "o ajuste por gosto não apaga o estado do erro confirmado");
  assert.equal(refazerSemCobrar(guardado), true, "o refazer grátis continua valendo");
  assert.equal(m.motivos.size, 2, "o motivo do gosto fica no registro mesmo assim");
  // 2. Ajuste por erro: usa o refazer grátis guardado, mesmo sem a conferência confirmar de novo.
  const { pedido: p2 } = await pedir(m, "a arte ainda está com a cor errada");
  const r2 = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: p2.id, categoria: "outro", texto: "a arte ainda está com a cor errada" }, m.dep);
  assert.ok(r2.ok);
  assert.ok(r2.cortesia, "erro usa o refazer grátis");
  assert.equal(r2.cobrado, 0);
  assert.equal(m.saldo(), 15);
  assert.ok(lerEstadoDaReprovacao(m.peca.metadata)?.refeitaGratisEm, "e ele fica usado");
});

test("a legenda editada à mão que deixou a arte de outro assunto: aviso com custo e saldo antes, e refazer cobra como pedi diferente", async () => {
  const m = mundo({ saldo: 100 });
  const card = { id: "card1", projectId: "proj1", projectUserId: "dono", metadata: {}, agentName: "Paulo Publisher" };
  const a = await avisarArteDaLegenda({ card, userId: "dono", postId: "post1", frase: "Gestão de tempo", redes: ["instagram"], formato: "image", link: "/projects/proj1/live?card=card1" }, m.dep);
  assert.ok(a.avisado);
  const pedido = lerPedidoDeAjuste(m.card.metadata)!;
  assert.equal(pedido.motivoFixo, "pedi_diferente");
  assert.equal(pedido.origem, "legenda");
  assert.equal(pedido.creditos, CREDIT_COSTS.imagem_geracao);
  assert.equal(m.debitos.length, 0, "nada cobrado antes do toque");
  assert.equal(m.card.chat.length, 1, "só a fala do agente: a pessoa não escreveu nada");
  assert.match(m.card.chat[0].content, /42 créditos/);
  assert.match(m.card.chat[0].content, /saldo é de 100 créditos/);
  assert.equal(m.sino.length, 1);
  assert.equal(m.sino[0].link, "/projects/proj1/live?card=card1");
  assert.match(m.sino[0].chave ?? "", /^reprovacao:post1:legenda:/);
  for (const t of [m.card.chat[0].content, m.sino[0].titulo, m.sino[0].texto]) assert.ok(!TRAVESSAO.test(t), t);
  // Com um pedido esperando no card, outro aviso não passa por cima.
  const deNovo = await avisarArteDaLegenda({ card: { ...card, metadata: m.card.metadata }, userId: "dono", postId: "post1", frase: "x", redes: ["instagram"], link: "/x" }, m.dep);
  assert.deepEqual(deNovo, { avisado: false, porque: "ja_ha_pedido" });
  // Refazer: o motivo é o decidido (pedi diferente), mesmo que chegue outro.
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "marca_errada" }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.registrado.categoria, "pedi_diferente");
  assert.equal(r.cobrado, 42);
  assert.equal(m.saldo(), 58);
  assert.equal(m.provasPedidas(), 0, "pedi diferente não roda as provas");
  // O plano é o pedido do dia: a arte refeita, uma geração por proporção das redes do dia.
  const plano = planoDaArtePelaLegenda({ postId: "p", redes: ["instagram", "linkedin"] });
  assert.equal(plano.creditos, CREDIT_COSTS.imagem_geracao * gruposDeFormato(["instagram", "linkedin"], "image").length);
  assert.deepEqual((plano.acoes as Array<{ tipo: string }>).map((x) => x.tipo), ["arte"]);
  assert.ok(!TRAVESSAO.test(avisoDaArtePelaLegenda({ frase: "x", creditos: 42, saldo: null, interno: true })));
});

test("vídeo por IA refeito no ajuste: o admin que reconhece o erro devolve também a carteira de vídeo, o que a fila cobrou de fato, uma vez só", async () => {
  const m = mundo({ saldo: 100, saldoDeVideo: 1000, cobrado: 500 });
  const card = { id: "card1", projectId: "proj1", projectUserId: "dono", metadata: {}, agentName: "Paulo Publisher" };
  const { pedido } = await guardarPedidoDeAjuste(
    { card, userId: "dono", mensagem: "gere o vídeo de novo", plano: { tipo: "video_ia", slideIndex: null, postId: "post1", carteira: "video", cobradoFora: true, creditos: 390, partes: [{ chave: "video", rotulo: "o vídeo do dia", creditos: 390 }] } },
    m.dep
  );
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "outro", texto: "o vídeo saiu sem nada a ver com o post" }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.registrado.situacao, "em_analise");
  assert.equal(r.cobrado, 0, "a fila cobra, não o pedido");
  assert.equal(m.debitos.length, 0);
  // A fila cobra 390 e devolve 130 de uma geração que não saiu.
  m.filaDoVideo("post1:refeito-1", 390, 130);
  assert.ok(await anotarCobrancaDoVideo({ postId: "post1", pedidoId: pedido.id, referencia: "post1:refeito-1", creditos: 390 }, m.dep));
  const estado = lerEstadoDaReprovacao(m.peca.metadata)!;
  assert.equal(estado.ajuste?.carteira, "video");
  assert.equal(ajusteADevolver(estado), 0, "o ajuste de vídeo não volta em créditos do plano");
  assert.equal(ajusteDeVideoADevolver(estado, 260), 260);
  const d = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.registrado.reprovacaoId, decisao: "devolver" }, m.depRep);
  assert.ok(d.ok);
  assert.equal(d.estado.creditosDeVideo, 260, "o que a fila cobrou menos o que ela mesma devolveu");
  assert.equal(m.saldoDeVideo(), 1000, "a carteira de vídeo volta inteira");
  assert.equal(m.saldo(), 100 + 57, "e a peça volta no plano, como em toda reprovação");
  assert.match(m.avisos.at(-1)!.titulo, /de vídeo/);
  const deNovo = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.registrado.reprovacaoId, decisao: "devolver" }, m.depRep);
  assert.equal(deNovo.ok, false);
  assert.equal(m.saldoDeVideo(), 1000);
  assert.equal(ajusteDeVideoADevolver(lerEstadoDaReprovacao(m.peca.metadata), 260), 0, "o refazer grátis ficou usado: nada mais volta");
});

test("erro não confirmado: cobra agora, vai ao admin, e o admin que reconhece o erro devolve a peça E o ajuste, uma vez só", async () => {
  const m = mundo({ saldo: 100, cobrado: 500 });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "texto_ilegivel", perguntar: jevDeMentira(0.2), usarJev: true }, m.dep);
  assert.ok(r.ok);
  assert.equal(r.registrado.situacao, "em_analise");
  assert.equal(r.cobrado, 42);
  assert.equal(m.saldo(), 58);
  assert.equal(m.admins.length, 1);
  assert.equal(m.admins[0].titulo, "Ajuste para decidir");
  assert.match(m.avisos[0]!.texto, /O ajuste foi feito e cobrado/);
  const d = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.registrado.reprovacaoId, decisao: "devolver" }, m.depRep);
  assert.ok(d.ok);
  assert.equal(d.estado.creditos, 57 + 42, "a peça e o que o ajuste cobrou");
  assert.equal(m.saldo(), 58 + 57 + 42);
  assert.ok(d.estado.refeitaGratisEm, "o ajuste devolvido é o refazer grátis desta reprovação");
  const deNovo = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.registrado.reprovacaoId, decisao: "devolver" }, m.depRep);
  assert.equal(deNovo.ok, false);
  assert.equal(m.saldo(), 157);
});

test("saldo insuficiente bloqueia: gosto sem saldo não cobra, não grava motivo e o pedido continua no card", async () => {
  const m = mundo({ saldo: 10 });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.erro === "sem_saldo");
  assert.ok(!r.ok && r.erro === "sem_saldo" && r.necessario === 42 && r.disponivel === 10);
  assert.equal(m.debitos.length, 0);
  assert.equal(m.saldo(), 10);
  assert.equal(m.motivos.size, 0, "gosto sem saldo não vira registro");
  assert.equal(lerEstadoDaReprovacao(m.peca.metadata), null);
  assert.equal(lerPedidoDeAjuste(m.card.metadata)?.id, pedido.id, "o pedido fica para depois da compra");
  assert.match(m.card.chat.at(-1)!.content, /Não refiz nada/);
  assert.match(m.card.chat.at(-1)!.content, /faltam 32/);
  // Comprou créditos: o mesmo pedido segue.
  m.recarregar(100);
  const r2 = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(r2.ok);
  assert.equal(m.saldo(), 68);
});

test("erro em análise sem saldo: o motivo fica gravado uma vez, e o clique depois da compra não grava outro", async () => {
  const m = mundo({ saldo: 10 });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "outro", texto: "a arte saiu errada" }, m.dep);
  assert.ok(!r.ok && r.erro === "sem_saldo");
  assert.equal(m.motivos.size, 1, "o admin recebe o caso");
  assert.ok(lerPedidoDeAjuste(m.card.metadata)?.motivoRegistrado, "o pedido volta com o motivo já gravado");
  m.recarregar(100);
  const r2 = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "outro", texto: "a arte saiu errada" }, m.dep);
  assert.ok(r2.ok);
  assert.equal(m.motivos.size, 1, "nenhum segundo registro");
  assert.equal(r2.cobrado, 42);
});

test("um clique só leva: dois cliques no motivo ao mesmo tempo cobram uma vez", async () => {
  const m = mundo({ saldo: 100 });
  const { pedido } = await pedir(m);
  const [a, b] = await Promise.all([
    confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep),
    confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep),
  ]);
  assert.equal([a, b].filter((x) => x.ok).length, 1);
  assert.equal(m.debitos.length, 1);
  assert.equal(m.saldo(), 58);
});

test("motivo obrigatório e pedido aberto: sem categoria, com pedido de outro id, ou peça publicada, nada é cobrado", async () => {
  const m = mundo({ saldo: 100 });
  const { pedido } = await pedir(m);
  const semCategoria = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: undefined }, m.dep);
  assert.ok(!semCategoria.ok && semCategoria.erro === "motivo_invalido");
  assert.match(!semCategoria.ok ? semCategoria.mensagem : "", /motivo do ajuste/);
  const outroId = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: "outro", categoria: "gosto" }, m.dep);
  assert.ok(!outroId.ok && outroId.erro === "sem_pedido");
  const estranho = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "estranho", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(!estranho.ok && estranho.erro === "nao_encontrado");
  m.peca.status = "published";
  const publicada = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(!publicada.ok && publicada.erro === "ja_publicado");
  assert.equal(m.debitos.length, 0);
  assert.equal(m.saldo(), 100);
});

test("o que não saiu volta uma vez só, nunca mais do que foi cobrado, e o ajuste grátis não devolve nada", async () => {
  const m = mundo({ saldo: 100 });
  const { pedido } = await pedir(m);
  const r = await confirmarMotivoDoAjuste({ cardId: "card1", userId: "dono", pedidoId: pedido.id, categoria: "gosto" }, m.dep);
  assert.ok(r.ok);
  const volta = await devolverOQueNaoSaiu({ userId: "dono", projectId: "proj1", pedido: r.pedido, cobrado: r.cobrado, naoEntregue: 999, cardId: "card1" }, m.dep);
  assert.equal(volta, 42, "nunca mais do que o ajuste cobrou");
  assert.equal(m.saldo(), 100);
  assert.equal(m.extrato.at(-1)!.refId, refDaSobraDoAjuste("post1", pedido.id));
  const deNovo = await devolverOQueNaoSaiu({ userId: "dono", projectId: "proj1", pedido: r.pedido, cobrado: r.cobrado, naoEntregue: 42 }, m.dep);
  assert.equal(deNovo, 0, "uma vez só");
  assert.equal(lerEstadoDaReprovacao(m.peca.metadata)?.ajuste?.devolvido, 42, "o admin devolveria só o resto");
  assert.equal(await devolverOQueNaoSaiu({ userId: "dono", projectId: "proj1", pedido: r.pedido, cobrado: 0, naoEntregue: 42 }, m.dep), 0, "cortesia: nada a devolver");
});

test("cancelar tira o pedido sem gerar e sem cobrar", async () => {
  const m = mundo({ saldo: 100 });
  await pedir(m);
  const r = await cancelarPedidoDeAjuste({ cardId: "card1", userId: "dono" }, m.dep);
  assert.ok(r.ok);
  assert.equal(lerPedidoDeAjuste(m.card.metadata), null);
  assert.equal(m.debitos.length, 0);
  assert.match(m.card.chat.at(-1)!.content, /nada foi cobrado/);
});

test("o sim do Vitor sem motivo não gera nada pago; o motivo dado vale para a segunda fase", () => {
  assert.equal(motivoDoSim({ motivo: null }, {}), null);
  assert.equal(motivoDoSim(null, {}), null);
  const dado = { categoria: "gosto", cortesia: null };
  assert.deepEqual(motivoDoSim({ motivo: null }, { motivo: dado }), dado);
  assert.deepEqual(motivoDoSim({ motivo: dado }, {}), dado, "a ideia paga com motivo: o sim da segunda fase basta");
});

// ─── a porta, na estrutura: o chat sem motivo não alcança gerador nenhum ───

test("a rota do chat não importa gerador: só executa algo pago depois do motivo aceito", () => {
  const rota = readFileSync(path.join(raiz, "app", "api", "campaign-cards", "[id]", "chat", "route.ts"), "utf8");
  const importacoes = rota.split("\n").filter((l) => l.startsWith("import "));
  const GERADORES = ["@/lib/claude", "nano-banana", "arte-por-rede", "arte-com-frase", "peca-de-feed", "infographic", "regerarVideoDoDia", "aplicarNaoCitarNaExecucao", "executarPedido", "refazerCapa", "gpt-image", "video-por-ia", "askClaude"];
  for (const g of GERADORES) {
    assert.ok(!importacoes.some((l) => l.includes(g)), `a rota não pode importar ${g}`);
  }
  const usos = rota.match(/executarAjusteLiberado\(/g) ?? [];
  assert.equal(usos.length, 1, "um único ponto de execução paga");
  assert.ok(rota.indexOf("confirmarMotivoDoAjuste(") > 0 && rota.indexOf("confirmarMotivoDoAjuste(") < rota.indexOf("executarAjusteLiberado("), "o motivo vem antes da execução");
  assert.match(rota, /if \(!r\.ok\)[\s\S]{0,400}return NextResponse\.json/, "motivo recusado volta sem executar");
  // O executor exige o motivo aceito no tipo, e a porta sem custo filtra texto e arte.
  const liberado = readFileSync(path.join(raiz, "lib", "media", "ajuste-liberado.ts"), "utf8");
  assert.match(liberado, /liberacao: MotivoAceito/);
  assert.match(liberado, /acoesSemCusto\(args\.acoes\)/);
  for (const t of [rota, liberado]) assert.ok(!TRAVESSAO.test(t), "sem travessão no código novo");
});
