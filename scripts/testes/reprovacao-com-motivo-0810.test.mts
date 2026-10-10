// A REPROVAÇÃO COM MOTIVO E A DEVOLUÇÃO POR ERRO VERIFICADO (decisão do
// Bruno em 08/10/2026), sem banco, sem rede e sem JEV de verdade: o depósito
// é um em memória e o JEV é uma função de mentira injetada. Prova que:
//   - o motivo é obrigatório (categoria da lista; texto em "outro");
//   - gosto e "pedi diferente" não devolvem, e refazer cobra;
//   - erro confirmado (pelo código ou pelo JEV) devolve UMA vez e refazer é grátis;
//   - não confirmado (ou sem prova) vai ao admin, e o cliente é avisado;
//   - a decisão do admin devolve ou mantém, uma vez só;
//   - nunca saldo negativo: a devolução nunca passa do que a campanha cobrou;
//   - o agregado por categoria e por semana conta certo.
// Rodar: npx tsx --test scripts/testes/reprovacao-com-motivo-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";

delete process.env.TYPESAFE_API_KEY;
delete process.env.JEV_LIGADO;

const { CATEGORIAS_DE_REPROVACAO, agregarMotivos, chaveDoAvisoDaReprovacao, creditosADevolver, decidirReprovacao, fraseDaSituacao, lerEstadoDaReprovacao, refazerSemCobrar, validarMotivo } = await import("@/lib/credits/reprovacao");
const { conferirReprovacaoPeloJev, perguntasDaReprovacao, provaPeloCodigo } = await import("@/lib/credits/reprovacao-pelo-jev");
const { decidirReprovacaoPeloAdmin, reprovarPeca, refDaDevolucao, OPERACAO_DA_DEVOLUCAO } = await import("@/lib/credits/reprovacao-servidor");
const { decidirCortesia, CORTESIAS_POR_DIA } = await import("@/lib/credits/cortesia");
const { ehChaveDasTelas, ehChaveDeAviso } = await import("@/lib/avisos/chaves");

type Dep = NonNullable<Parameters<typeof reprovarPeca>[1]>;
type Peca = Awaited<ReturnType<Dep["peca"]>>;
type Provas = Parameters<typeof conferirReprovacaoPeloJev>[0]["provas"];
type Perguntador = NonNullable<Parameters<typeof conferirReprovacaoPeloJev>[0]["perguntar"]>;

const TRAVESSAO = /[—–]/;

const provasLimpas = (extra: Partial<Provas> = {}): Provas => ({
  rede: "linkedin",
  tipoDePeca: "image",
  texto: "Um post sobre gestão de tempo, sem números.",
  arte: { existe: true, formato: { esperado: "1200x627 (16:9)", medido: "1200x627", bate: true }, margem: { cortado: false, resumo: "nada cortado" }, olho: { parecer: "ok", reprovou: null }, textoEsperado: ["Gestão de tempo"] },
  lastro: { conferido: true, frasesSemNumero: [], frasesSemFonte: [] },
  conteudoProprio: { conferido: true, frasesSemProva: [] },
  identidade: { aprovada: true },
  revisora: { reprovou: false, parecer: null },
  ...extra,
});

const jevDeMentira = (noul: number | null): Perguntador => async (_ctx, perguntas) => {
  const saida: Awaited<ReturnType<Perguntador>> = {};
  for (const k of Object.keys(perguntas)) if (noul !== null) saida[k] = { type: "noul", noul };
  return saida;
};

/** O depósito em memória: uma peça, um extrato, os motivos, a memória e os avisos. */
function depositoEmMemoria(o: { saldo?: number; cobrado?: number; provas?: Provas; peca?: Partial<NonNullable<Peca>> } = {}) {
  let saldo = o.saldo ?? 1000;
  const extrato: Array<{ amount: number; refId: string; note: string }> = [];
  const motivos = new Map<string, Parameters<Dep["gravarMotivo"]>[0]>();
  const memoria: Array<{ projectId: string; postId: string; valor: Record<string, unknown> }> = [];
  const avisos: Array<Parameters<Dep["notificar"]>[0]> = [];
  const admins: Array<Parameters<Dep["avisarAdmins"]>[0]> = [];
  const acoes: Array<{ acao: string; detalhe: unknown }> = [];
  let seq = 0;
  const peca: NonNullable<Peca> = {
    id: "post1",
    projectId: "proj1",
    projectUserId: "dono",
    platform: "linkedin",
    content: "Um post sobre gestão de tempo, sem números.",
    imageUrl: "data:image/png;base64,xxxxxxxxxxxxxxxx",
    mediaType: "image",
    metadata: { frase: "Gestão de tempo" },
    runId: "run1",
    dayOfWeek: 2,
    status: "draft",
    ...(o.peca ?? {}),
  };
  const dep: Dep = {
    async peca(id) {
      return id === peca.id ? { ...peca } : null;
    },
    async podeUsar(userId, projeto) {
      return userId === projeto.userId || userId === "membro";
    },
    async gravarPeca(id, dados) {
      assert.equal(id, peca.id);
      if (dados.status) peca.status = dados.status;
      peca.metadata = dados.metadata;
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
      extrato.push({ amount: a.quantidade, refId: a.refId, note: a.note });
      return { duplicado: false };
    },
    async provas() {
      return o.provas ?? provasLimpas();
    },
    async gravarMotivo(m) {
      motivos.set(m.id, { ...m });
    },
    async atualizarMotivo(id, campos) {
      const m = motivos.get(id);
      if (m) motivos.set(id, { ...m, ...campos });
    },
    async motivo(id) {
      const m = motivos.get(id);
      return m ? { ...m } : null;
    },
    async memoria(projectId, postId, valor) {
      memoria.push({ projectId, postId, valor });
    },
    async notificar(a) {
      avisos.push(a);
    },
    async avisarAdmins(a) {
      admins.push(a);
    },
    async registrarAcaoDoAdmin(_admin, _alvo, acao, detalhe) {
      acoes.push({ acao, detalhe });
    },
    agora: () => new Date("2026-10-08T15:00:00-03:00"),
    novoId: () => `rep${++seq}`,
  };
  return { dep, peca, extrato, motivos, memoria, avisos, admins, acoes, saldo: () => saldo };
}

// ─── a regra pura ───

test("a lista curta: gosto e pedi diferente são gosto; o resto é erro da plataforma, sem travessão", () => {
  const gosto = CATEGORIAS_DE_REPROVACAO.filter((c) => c.classe === "gosto").map((c) => c.id);
  assert.deepEqual(gosto, ["gosto", "pedi_diferente"]);
  const erro = CATEGORIAS_DE_REPROVACAO.filter((c) => c.classe === "erro").map((c) => c.id);
  assert.deepEqual(erro, ["texto_ilegivel", "formato_errado", "dado_inventado", "conteudo_proprio_inventado", "marca_errada", "outro"]);
  for (const c of CATEGORIAS_DE_REPROVACAO) {
    assert.ok(!TRAVESSAO.test(c.nome), c.nome);
    assert.ok(!TRAVESSAO.test(c.dica), c.dica);
  }
});

test("motivo obrigatório: sem categoria recusa; outro sem texto recusa; texto é aparado", () => {
  assert.deepEqual(validarMotivo({}), { ok: false, erro: "Escolha o motivo da reprovação." });
  assert.equal(validarMotivo({ categoria: "inventada", texto: "x" }).ok, false);
  assert.equal(validarMotivo({ categoria: "outro", texto: "  " }).ok, false);
  assert.equal(validarMotivo({ categoria: "outro", texto: "abc" }).ok, false, "outro pede pelo menos 5 letras");
  const ok = validarMotivo({ categoria: "gosto", texto: "  ficou   sem  graça \n mesmo " });
  assert.deepEqual(ok, { ok: true, categoria: "gosto", texto: "ficou sem graça mesmo" });
  const longo = validarMotivo({ categoria: "outro", texto: "a".repeat(5000) });
  assert.ok(longo.ok && longo.texto.length === 2000);
});

test("decidir: gosto mantém; erro confirmado devolve; não confirmado e sem prova vão ao admin", () => {
  assert.equal(decidirReprovacao({ categoria: "gosto", veredito: "confirmado" }).situacao, "mantido", "gosto nunca devolve, nem com veredito");
  assert.equal(decidirReprovacao({ categoria: "pedi_diferente", veredito: null }).situacao, "mantido");
  assert.equal(decidirReprovacao({ categoria: "formato_errado", veredito: "confirmado" }).situacao, "devolvido");
  assert.equal(decidirReprovacao({ categoria: "formato_errado", veredito: "nao_confirmado" }).situacao, "em_analise");
  assert.equal(decidirReprovacao({ categoria: "outro", veredito: "sem_prova" }).situacao, "em_analise");
  assert.equal(decidirReprovacao({ categoria: "outro", veredito: null }).situacao, "em_analise");
});

test("creditosADevolver: nunca negativo, nunca mais do que a campanha cobrou menos o que já voltou", () => {
  assert.equal(creditosADevolver({ custoDaPeca: 57, cobradoNaCampanha: 500, jaDevolvidoNaCampanha: 0 }), 57);
  assert.equal(creditosADevolver({ custoDaPeca: 57, cobradoNaCampanha: 500, jaDevolvidoNaCampanha: 480 }), 20, "sobra só o que ainda não voltou");
  assert.equal(creditosADevolver({ custoDaPeca: 57, cobradoNaCampanha: 0, jaDevolvidoNaCampanha: 0 }), 0, "peça não cobrada não devolve");
  assert.equal(creditosADevolver({ custoDaPeca: 57, cobradoNaCampanha: 100, jaDevolvidoNaCampanha: 200 }), 0, "já voltou mais que o cobrado: zero, nunca negativo");
  assert.equal(creditosADevolver({ custoDaPeca: -5, cobradoNaCampanha: 100, jaDevolvidoNaCampanha: 0 }), 0);
});

test("as chaves do card e do sino têm prefixo aceito, e a frase do card não tem travessão", () => {
  const estado = { id: "rep1", situacao: "em_analise" as const, categoria: "outro" as const, texto: "x", creditos: 0, veredito: null, decididoPor: null, motivo: "m", reprovadaEm: "2026-10-08", decididaEm: null };
  const chave = chaveDoAvisoDaReprovacao(estado, "post1");
  assert.equal(chave, "reprovacao-peca:post1:rep1:em_analise");
  assert.ok(ehChaveDasTelas(chave), "a rota dos descartes aceita a chave do card");
  assert.ok(ehChaveDeAviso("reprovacao:post1:rep1:devolvido"), "o sino aceita o prefixo da resposta");
  for (const s of ["em_analise", "devolvido", "mantido"] as const) assert.ok(!TRAVESSAO.test(fraseDaSituacao({ ...estado, situacao: s, creditos: 57 })));
  assert.equal(lerEstadoDaReprovacao({ reprovacao: estado })?.id, "rep1");
  assert.equal(lerEstadoDaReprovacao({ reprovacao: { id: 1 } }), null);
  assert.equal(lerEstadoDaReprovacao(null), null);
});

// ─── a conferência: código, JEV, ninguém ───

test("o código confirma pela medida: formato que não bate, margem cortada, lastro, conteúdo próprio, identidade, revisora", () => {
  assert.equal(provaPeloCodigo("formato_errado", provasLimpas()), null);
  assert.match(provaPeloCodigo("formato_errado", provasLimpas({ arte: { ...provasLimpas().arte!, formato: { esperado: "1080x1350 (4:5)", medido: "1200x627", bate: false } } }))!, /1200x627/);
  assert.match(provaPeloCodigo("texto_ilegivel", provasLimpas({ arte: { ...provasLimpas().arte!, margem: { cortado: true, resumo: "topo cortado" } } }))!, /topo cortado/);
  assert.match(provaPeloCodigo("texto_ilegivel", provasLimpas({ arte: { ...provasLimpas().arte!, olho: { parecer: "x", reprovou: "Linicar fora do permitido" } } }))!, /Linicar/);
  assert.match(provaPeloCodigo("dado_inventado", provasLimpas({ lastro: { conferido: true, frasesSemNumero: ["61% das empresas falham."], frasesSemFonte: [] } }))!, /61%/);
  assert.equal(provaPeloCodigo("dado_inventado", provasLimpas({ lastro: { conferido: false, frasesSemNumero: [], frasesSemFonte: [] } })), null, "lastro não conferido não confirma");
  assert.match(provaPeloCodigo("conteudo_proprio_inventado", provasLimpas({ conteudoProprio: { conferido: true, frasesSemProva: ["Assista ao vídeo completo no meu canal."] } }))!, /canal/);
  assert.match(provaPeloCodigo("marca_errada", provasLimpas({ identidade: { aprovada: false } }))!, /identidade/);
  assert.equal(provaPeloCodigo("marca_errada", provasLimpas()), null);
  assert.match(provaPeloCodigo("outro", provasLimpas({ revisora: { reprovou: true, parecer: "número sem fonte" } }))!, /revisora/);
  assert.equal(provaPeloCodigo("outro", provasLimpas()), null);
});

test("o JEV decide a leitura: sim firme confirma, não firme nega, dúvida e JEV fora viram sem prova", async () => {
  const base = { categoria: "outro" as const, texto: "a arte não tem nada a ver com o texto", provas: provasLimpas(), usarJev: true };
  assert.equal((await conferirReprovacaoPeloJev({ ...base, perguntar: jevDeMentira(0.9) })).veredito, "confirmado");
  assert.equal((await conferirReprovacaoPeloJev({ ...base, perguntar: jevDeMentira(0.9) })).por, "jev");
  assert.equal((await conferirReprovacaoPeloJev({ ...base, perguntar: jevDeMentira(0.1) })).veredito, "nao_confirmado");
  assert.equal((await conferirReprovacaoPeloJev({ ...base, perguntar: jevDeMentira(0.5) })).veredito, "sem_prova");
  assert.equal((await conferirReprovacaoPeloJev({ ...base, perguntar: jevDeMentira(null) })).veredito, "sem_prova");
  const fora = await conferirReprovacaoPeloJev({ ...base, usarJev: false });
  assert.equal(fora.veredito, "sem_prova");
  assert.equal(fora.por, "ninguem");
  const quebrado = await conferirReprovacaoPeloJev({ ...base, perguntar: async () => { throw new Error("529"); } });
  assert.equal(quebrado.veredito, "sem_prova");
  // Gosto não vai ao JEV.
  let chamadas = 0;
  const g = await conferirReprovacaoPeloJev({ ...base, categoria: "gosto", perguntar: async (c, p) => { chamadas++; return jevDeMentira(0.9)(c, p); } });
  assert.equal(chamadas, 0);
  assert.equal(g.veredito, "nao_confirmado");
  // A medida vence: com o código confirmando, o JEV nem é chamado.
  const m = await conferirReprovacaoPeloJev({ ...base, categoria: "marca_errada", provas: provasLimpas({ identidade: { aprovada: false } }), perguntar: async (c, p) => { chamadas++; return jevDeMentira(0.1)(c, p); } });
  assert.equal(chamadas, 0);
  assert.equal(m.por, "codigo");
  const perguntas = perguntasDaReprovacao("outro");
  assert.ok(!TRAVESSAO.test(String(perguntas.erro.instructions)));
});

// ─── o fluxo inteiro, com o depósito em memória ───

test("motivo obrigatório na reprovação: sem categoria nada muda", async () => {
  const b = depositoEmMemoria();
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: undefined, texto: "" }, b.dep);
  assert.deepEqual(r, { ok: false, erro: "motivo_invalido", mensagem: "Escolha o motivo da reprovação." });
  assert.equal(b.peca.status, "draft");
  assert.equal(b.motivos.size, 0);
  const outro = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "outro", texto: "" }, b.dep);
  assert.equal(outro.ok, false);
});

test("quem não é do projeto não reprova; peça publicada não se reprova", async () => {
  const b = depositoEmMemoria();
  assert.deepEqual(await reprovarPeca({ postId: "post1", userId: "estranho", categoria: "gosto", texto: "" }, b.dep), { ok: false, erro: "nao_encontrado" });
  const p = depositoEmMemoria({ peca: { status: "published" } });
  assert.deepEqual(await reprovarPeca({ postId: "post1", userId: "dono", categoria: "gosto", texto: "" }, p.dep), { ok: false, erro: "ja_publicado" });
});

test("gosto não devolve: a peça vira reprovada, o crédito fica, o registro e a memória existem, e refazer cobra", async () => {
  const b = depositoEmMemoria({ saldo: 100 });
  let provasPedidas = 0;
  b.dep.provas = async () => { provasPedidas++; return provasLimpas(); };
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "gosto", texto: "ficou sem graça" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "mantido");
  assert.equal(r.estado.creditos, 0);
  assert.equal(b.saldo(), 100);
  assert.equal(b.extrato.length, 0);
  assert.equal(provasPedidas, 0, "gosto não roda as provas");
  assert.equal(b.peca.status, "rejected");
  const gravado = lerEstadoDaReprovacao(b.peca.metadata);
  assert.equal(gravado?.categoria, "gosto");
  assert.equal(b.motivos.size, 1);
  assert.equal([...b.motivos.values()][0].situacao, "mantido");
  assert.equal(b.memoria.length, 1);
  assert.equal(b.memoria[0].valor.classe, "gosto");
  assert.equal(b.avisos.length, 0, "gosto não precisa de resposta no sino: o card já diz");
  assert.equal(b.admins.length, 0);
  assert.equal(refazerSemCobrar(gravado), false);
  assert.equal(decidirCortesia({ status: "rejected", reprovacao: gravado }, 0), null, "reprovada por gosto: refazer cobra");
  assert.ok(!TRAVESSAO.test(r.frase));
});

test("erro confirmado pelo código: devolve uma vez, avisa o cliente, e refazer é grátis uma vez só", async () => {
  const b = depositoEmMemoria({ saldo: 100, cobrado: 500, provas: provasLimpas({ lastro: { conferido: true, frasesSemNumero: ["61% das empresas falham."], frasesSemFonte: [] } }) });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "dado_inventado", texto: "esse 61% não existe" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "devolvido");
  assert.equal(r.estado.decididoPor, "codigo");
  assert.equal(r.estado.creditos, 57, "a tabela da peça: 15 de texto + 42 da arte");
  assert.equal(b.saldo(), 157);
  assert.deepEqual(b.extrato.map((l) => l.refId), [refDaDevolucao("post1", "rep1")]);
  assert.equal(OPERACAO_DA_DEVOLUCAO.startsWith("estorno"), false, "o observador do cron não avisa esta operação com a frase genérica");
  assert.equal(b.avisos.length, 1);
  assert.equal(b.avisos[0].tipo, "estorno");
  assert.equal(b.avisos[0].chave, "reprovacao:post1:rep1:devolvido");
  assert.equal(b.admins.length, 0);
  const gravado = lerEstadoDaReprovacao(b.peca.metadata)!;
  assert.equal(refazerSemCobrar(gravado), true);
  assert.deepEqual(decidirCortesia({ status: "rejected", reprovacao: gravado }, 0), { motivo: "erro confirmado pelas provas" });
  assert.equal(decidirCortesia({ status: "rejected", reprovacao: gravado }, CORTESIAS_POR_DIA), null, "o teto do dia continua");
  // O refazer grátis usado: a segunda vez cobra.
  const { marcarRefazerGratisUsado } = await import("@/lib/credits/reprovacao-servidor");
  const depois = await marcarRefazerGratisUsado("post1", b.peca.metadata as Record<string, unknown>);
  assert.equal(decidirCortesia({ status: "draft", reprovacao: lerEstadoDaReprovacao(depois) }, 0), null);
  // Reprovar de novo a mesma peça (outra ocorrência) nunca devolve a mesma linha duas vezes.
  const r2 = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "dado_inventado", texto: "ainda errado" }, b.dep);
  assert.ok(r2.ok);
  assert.equal(r2.estado.id, "rep2");
  assert.equal(b.extrato.length, 2, "outra reprovação é outra ocorrência, com outro refId");
  assert.equal(b.saldo(), 214);
  // A trava do refId: a mesma ocorrência creditada de novo é duplicada e não soma.
  const dup = await b.dep.creditar({ userId: "dono", quantidade: 57, refId: refDaDevolucao("post1", "rep1"), note: "de novo" });
  assert.equal(dup.duplicado, true);
  assert.equal(b.saldo(), 214);
});

test("erro confirmado pelo JEV: devolve; o status antigo (rejected) sozinho não dá cortesia", async () => {
  const b = depositoEmMemoria({ saldo: 0, cobrado: 500 });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "outro", texto: "a arte fala de outro assunto", perguntar: jevDeMentira(0.95), usarJev: true }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "devolvido");
  assert.equal(r.estado.decididoPor, "jev");
  assert.equal(b.saldo(), 57);
  assert.equal(decidirCortesia({ status: "rejected" }, 0), null, "desde 08/10 o status reprovado não é prova");
  assert.equal(decidirCortesia({ status: "rejected", reprovadaPelaRevisora: true }, 0), null, "a revisora é prova da conferência, não cortesia direta");
});

test("nunca negativo: a peça não cobrada confirma o erro mas devolve zero, e refazer continua grátis", async () => {
  const b = depositoEmMemoria({ saldo: 10, cobrado: 0, provas: provasLimpas({ identidade: { aprovada: false } }) });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "marca_errada", texto: "" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "devolvido");
  assert.equal(r.estado.creditos, 0);
  assert.equal(b.saldo(), 10);
  assert.equal(b.extrato.length, 0, "sem crédito não há linha");
  assert.equal(b.avisos[0].tipo, "reprovacao");
  assert.match(b.avisos[0].titulo, /refazer é grátis/);
  assert.equal(refazerSemCobrar(lerEstadoDaReprovacao(b.peca.metadata)), true);
});

test("a devolução nunca passa do que a campanha cobrou: a quarta peça do dia devolve só o que sobrou", async () => {
  // Campanha cobrou 150; três peças já devolveram 57 cada (171 > 150 não acontece: a terceira já ficou em 36).
  const b = depositoEmMemoria({ saldo: 0, cobrado: 150, provas: provasLimpas({ identidade: { aprovada: false } }) });
  const devolvidos: number[] = [];
  for (let i = 0; i < 4; i++) {
    const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "marca_errada", texto: "" }, b.dep);
    assert.ok(r.ok);
    devolvidos.push(r.estado.creditos);
  }
  assert.deepEqual(devolvidos, [57, 57, 36, 0]);
  assert.equal(b.saldo(), 150);
});

test("não confirmado vai ao admin: em análise, cliente avisado, admins avisados, nada devolvido", async () => {
  const b = depositoEmMemoria({ saldo: 100, cobrado: 500 });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "texto_ilegivel", texto: "a letra está estranha", perguntar: jevDeMentira(0.2), usarJev: true }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "em_analise");
  assert.equal(r.estado.veredito, "nao_confirmado");
  assert.equal(r.estado.decididaEm, null);
  assert.equal(b.saldo(), 100);
  assert.equal(b.avisos.length, 1);
  assert.equal(b.avisos[0].tipo, "reprovacao");
  assert.match(b.avisos[0].titulo, /Recebemos o motivo/);
  assert.equal(b.admins.length, 1);
  assert.equal(b.admins[0].link, "/admin/reprovacoes");
  assert.ok(!TRAVESSAO.test(b.admins[0].texto + b.admins[0].corpo + b.avisos[0].texto));
  assert.equal([...b.motivos.values()][0].situacao, "em_analise");
  assert.equal(refazerSemCobrar(lerEstadoDaReprovacao(b.peca.metadata)), false, "em análise ainda não refaz grátis");
});

test("sem JEV e sem medida: sem prova, vai ao admin também (ninguém nega no escuro)", async () => {
  const b = depositoEmMemoria({ saldo: 100 });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "outro", texto: "saiu tudo errado" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "em_analise");
  assert.equal(r.estado.veredito, "sem_prova");
  assert.equal(b.admins.length, 1);
});

test("as provas que não puderam ser juntadas não travam: vai ao admin", async () => {
  const b = depositoEmMemoria({ saldo: 100 });
  b.dep.provas = async () => { throw new Error("sharp caiu"); };
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "formato_errado", texto: "" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "em_analise");
});

test("o admin devolve: uma vez só, com o mesmo refId; a segunda decisão é recusada", async () => {
  const b = depositoEmMemoria({ saldo: 100, cobrado: 500 });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "outro", texto: "saiu tudo errado" }, b.dep);
  assert.ok(r.ok && r.estado.situacao === "em_analise");
  const admin = { id: "adm", email: "bruno@demandou.com" };
  const d = await decidirReprovacaoPeloAdmin({ admin, id: r.estado.id, decisao: "devolver", motivo: "a arte saiu cortada mesmo" }, b.dep);
  assert.ok(d.ok);
  assert.equal(d.estado.situacao, "devolvido");
  assert.equal(d.estado.creditos, 57);
  assert.equal(d.estado.decididoPor, "admin");
  assert.equal(b.saldo(), 157);
  assert.deepEqual(b.extrato.map((l) => l.refId), [refDaDevolucao("post1", "rep1")]);
  const m = [...b.motivos.values()][0];
  assert.equal(m.decisaoDoAdmin, "devolver");
  assert.equal(m.adminId, "adm");
  assert.equal(m.creditosDevolvidos, 57);
  assert.equal(b.acoes.length, 1);
  assert.equal(b.acoes[0].acao, "reprovacao_devolver");
  assert.equal(b.avisos.length, 2, "o cliente é avisado da resposta");
  assert.equal(b.avisos[1].tipo, "estorno");
  assert.equal(b.avisos[1].chave, "reprovacao:post1:rep1:devolvido", "outra chave que a do em análise: a resposta aparece mesmo depois do descarte");
  assert.equal(b.memoria.length, 2);
  assert.equal(b.memoria[1].valor.situacao, "devolvido");
  const gravado = lerEstadoDaReprovacao(b.peca.metadata)!;
  assert.deepEqual(decidirCortesia({ status: "rejected", reprovacao: gravado }, 0), { motivo: "erro reconhecido pelo admin" });
  // Nunca duas vezes.
  const de_novo = await decidirReprovacaoPeloAdmin({ admin, id: r.estado.id, decisao: "devolver" }, b.dep);
  assert.deepEqual(de_novo, { ok: false, erro: "ja_decidida" });
  assert.equal(b.saldo(), 157);
  assert.deepEqual(await decidirReprovacaoPeloAdmin({ admin, id: "nao-existe", decisao: "manter" }, b.dep), { ok: false, erro: "nao_encontrada" });
});

test("o admin mantém: nada devolvido, cliente avisado com o motivo, refazer cobra", async () => {
  const b = depositoEmMemoria({ saldo: 100, cobrado: 500 });
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "outro", texto: "não gostei da cor" }, b.dep);
  assert.ok(r.ok);
  const d = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.estado.id, decisao: "manter", motivo: "a cor é a da sua paleta" }, b.dep);
  assert.ok(d.ok);
  assert.equal(d.estado.situacao, "mantido");
  assert.equal(d.estado.creditos, 0);
  assert.equal(b.saldo(), 100);
  assert.equal(b.extrato.length, 0);
  assert.equal(b.avisos[1].tipo, "reprovacao");
  assert.match(b.avisos[1].texto, /a cor é a da sua paleta/);
  assert.match(fraseDaSituacao(d.estado), /^Mantido, motivo: /);
  assert.equal(decidirCortesia({ status: "rejected", reprovacao: lerEstadoDaReprovacao(b.peca.metadata) }, 0), null);
  assert.equal(await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "a@b" }, id: r.estado.id, decisao: "devolver" }, b.dep).then((x) => x.ok), false, "mantido não vira devolvido depois");
});

test("o membro da equipe reprova, e a devolução volta para a conta pela regra do creditar (userId de quem fez)", async () => {
  const b = depositoEmMemoria({ saldo: 0, cobrado: 500, provas: provasLimpas({ identidade: { aprovada: false } }) });
  const r = await reprovarPeca({ postId: "post1", userId: "membro", categoria: "marca_errada", texto: "" }, b.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.creditos, 57);
  assert.equal([...b.motivos.values()][0].userId, "membro");
});

// ─── o agregado do admin ───

test("agregarMotivos: por categoria (mais frequente primeiro) e por semana (a última termina hoje)", () => {
  const agora = new Date("2026-10-08T15:00:00-03:00");
  const dia = (d: number) => new Date(agora.getTime() - d * 86_400_000).toISOString();
  const linhas = [
    { categoria: "gosto" as const, situacao: "mantido" as const, creditosDevolvidos: 0, reprovadaEm: dia(0) },
    { categoria: "dado_inventado" as const, situacao: "devolvido" as const, creditosDevolvidos: 57, reprovadaEm: dia(1) },
    { categoria: "dado_inventado" as const, situacao: "em_analise" as const, creditosDevolvidos: 0, reprovadaEm: dia(8) },
    { categoria: "formato_errado" as const, situacao: "devolvido" as const, creditosDevolvidos: 42, reprovadaEm: dia(9) },
    { categoria: "outro" as const, situacao: "mantido" as const, creditosDevolvidos: 0, reprovadaEm: dia(100) },
  ];
  const a = agregarMotivos(linhas, { semanas: 2, agora });
  assert.deepEqual(a.porCategoria.map((c) => [c.categoria, c.total, c.devolvidos, c.mantidos, c.emAnalise, c.creditos]), [
    ["dado_inventado", 2, 1, 0, 1, 57],
    ["gosto", 1, 0, 1, 0, 0],
    ["formato_errado", 1, 1, 0, 0, 42],
    ["outro", 1, 0, 1, 0, 0],
  ]);
  assert.equal(a.porSemana.length, 2);
  assert.deepEqual(a.porSemana.map((s) => [s.gosto, s.erro, s.devolvidos]), [[0, 2, 1], [1, 1, 1]]);
  assert.equal(a.porSemana[1].rotulo, "02/10");
  assert.match(a.porSemana[1].dica, /^semana de 02\/10 a 08\/10$/);
  for (const s of a.porSemana) assert.ok(!TRAVESSAO.test(s.dica));
});

// ─── a peça de vídeo (10/10): o corte e o completo, do editor de antes ou do modelo do curso ───

test("a conta da peça de vídeo: a parte da edição, com teto na peça (todas as redes) e no vídeo", async () => {
  const { contaDaPecaDeVideo, alvoDaPecaDeVideo } = await import("@/lib/credits/reprovacao-servidor");
  const { creditosDaParteNaoEntregue } = await import("@/lib/credits/estorno-da-edicao");
  // a parte do corte é a montagem dele, a mesma da edição não entregue
  const parteDoCorte = creditosDaParteNaoEntregue({ alvo: 0, duracaoSeg: 600, precoAntigo: false, comAbertura: false });
  assert.equal(parteDoCorte, 200);
  const nada = { estornadoNoVideo: 0, estornadoNaPeca: 0, devolvidoNoVideo: 0, devolvidoNaPeca: 0 };
  const devolver = (c: { custo: number; cobrado: number; jaDevolvido: number }) => creditosADevolver({ custoDaPeca: c.custo, cobradoNaCampanha: c.cobrado, jaDevolvidoNaCampanha: c.jaDevolvido });
  assert.equal(devolver(contaDaPecaDeVideo({ parte: parteDoCorte, cobradoNoVideo: 1000, ...nada })), 200);
  // o mesmo corte reprovado em outra rede: o que já voltou dele zera a peça
  assert.equal(devolver(contaDaPecaDeVideo({ parte: parteDoCorte, cobradoNoVideo: 1000, ...nada, devolvidoNoVideo: 200, devolvidoNaPeca: 200 })), 0);
  // a montagem que já voltou por não ter sido entregue não volta de novo
  assert.equal(contaDaPecaDeVideo({ parte: parteDoCorte, cobradoNoVideo: 1000, ...nada, estornadoNoVideo: 200, estornadoNaPeca: 200 }).custo, 0);
  // o teto do vídeo: nunca mais do que a aprovação cobrou menos o que já voltou dele
  assert.equal(devolver(contaDaPecaDeVideo({ parte: parteDoCorte, cobradoNoVideo: 500, ...nada, estornadoNoVideo: 200, devolvidoNoVideo: 220 })), 80);
  // vídeo não cobrado (conta interna): nada volta
  assert.equal(devolver(contaDaPecaDeVideo({ parte: parteDoCorte, cobradoNoVideo: 0, ...nada })), 0);
  // de quem é a peça
  assert.deepEqual(alvoDaPecaDeVideo({ videoJobId: "v1", trechoIndice: 2 }), { videoId: "v1", alvo: 2, chave: "corte:v1:2" });
  assert.deepEqual(alvoDaPecaDeVideo({ videoJobId: "v1", gravacaoCompleta: true }), { videoId: "v1", alvo: "completo", chave: "completo:v1" });
  assert.equal(alvoDaPecaDeVideo({ frase: "texto do dia" }), null);
});

test("corte com texto cortado: confirmado pelo código devolve a montagem; sem prova vai ao admin, que devolve", async () => {
  const pecaDoCorte = { mediaType: "video", imageUrl: "https://blob/cortes/v1/curso-0.mp4", metadata: { videoJobId: "v1", trechoIndice: 0 } };
  const comConta = (b: ReturnType<typeof depositoEmMemoria>) => {
    b.dep.contaDoVideo = async (p) => {
      if (!(p.metadata as { videoJobId?: string } | null)?.videoJobId) return null;
      const devolvido = b.extrato.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
      return { custo: Math.max(0, 200 - devolvido), cobrado: 1000, jaDevolvido: devolvido };
    };
    // a conta da campanha não vale para a peça de vídeo
    b.dep.cobradoDaPeca = async () => {
      throw new Error("a peça de vídeo não usa a conta da campanha");
    };
  };
  // 1. a margem medida acusa o texto cortado: devolve na hora
  const a = depositoEmMemoria({ saldo: 0, peca: pecaDoCorte, provas: provasLimpas({ tipoDePeca: "video", arte: { ...provasLimpas().arte!, margem: { cortado: true, resumo: "legenda cortada na borda" } } }) });
  comConta(a);
  const r = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "texto_ilegivel", texto: "a palavra saiu cortada" }, a.dep);
  assert.ok(r.ok);
  assert.equal(r.estado.situacao, "devolvido");
  assert.equal(r.estado.creditos, 200);
  assert.equal(a.saldo(), 200);
  assert.equal([...a.motivos.values()][0].custoDaPeca, 200, "o custo da peça é a montagem do corte, não o texto do post");
  // a mesma peça de novo (outra rede, outra ocorrência): já voltou, não volta de novo
  const r2 = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "texto_ilegivel", texto: "de novo" }, a.dep);
  assert.ok(r2.ok);
  assert.equal(r2.estado.creditos, 0);
  assert.equal(a.saldo(), 200);
  // 2. sem medida no vídeo: vai ao admin; o admin vê o erro e devolve a montagem
  const b = depositoEmMemoria({ saldo: 0, peca: pecaDoCorte, provas: provasLimpas({ tipoDePeca: "video", arte: { existe: true, formato: null, margem: null, olho: null, textoEsperado: [] } }) });
  comConta(b);
  const e = await reprovarPeca({ postId: "post1", userId: "dono", categoria: "texto_ilegivel", texto: "a palavra saiu cortada" }, b.dep);
  assert.ok(e.ok);
  assert.equal(e.estado.situacao, "em_analise");
  assert.equal(b.saldo(), 0);
  const d = await decidirReprovacaoPeloAdmin({ admin: { id: "adm", email: "bruno@demandou.com" }, id: e.estado.id, decisao: "devolver", motivo: "a legenda saiu cortada" }, b.dep);
  assert.ok(d.ok);
  assert.equal(d.estado.situacao, "devolvido");
  assert.equal(d.estado.creditos, 200);
  assert.equal(b.saldo(), 200);
});

test("a fila do admin mostra o vídeo da peça de vídeo", async () => {
  const { readFileSync } = await import("node:fs");
  const pagina = readFileSync(new URL("../../app/(app)/admin/reprovacoes/page.tsx", import.meta.url), "utf8");
  assert.match(pagina, /m\.peca\.mediaType === "video" \?[\s\S]{0,200}<video src=\{m\.peca\.imageUrl\} controls/);
});
