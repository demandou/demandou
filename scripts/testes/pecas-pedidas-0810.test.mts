// O CARD NO CALENDÁRIO NA HORA (08/10/2026): o Bruno pediu um post para
// segunda, dia 12, a campanha foi para o escritório e o quadro ficou vazio.
// Aqui: que peça aparece em que dia assim que a campanha começa, quem está com
// o card em cada etapa, quando alguém anda no escritório, e que a falha vira
// cartão com motivo. Nada aqui toca banco, IA ou tela.
// Rodar: npx tsx --test scripts/testes/pecas-pedidas-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ajudandoNaPeca,
  cardDaPeca,
  cardsNaCabeca,
  donosDasPecas,
  haProjetoAcontecendo,
  passagensDoCard,
  pecasDoRun,
  pecasEmProducaoNoDia,
  pecasPedidas,
  quemEstaComOCard,
} from "@/lib/pipeline/pecas-pedidas";

const ler = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const TRAVESSAO = new RegExp(String.fromCharCode(0x2014));

const AGORA = new Date("2026-10-08T15:00:00.000Z");
const log = (agent: string, message: string, status = "running", minutos = 0) => ({
  agent,
  message,
  status,
  timestamp: new Date(AGORA.getTime() - minutos * 60_000).toISOString(),
});

/** O post único do Bruno: segunda 12/10 às 10:00, carrossel no Instagram. */
function postUnico(logs: object[], status = "running") {
  return {
    id: "run-unico",
    status,
    topic: "O essencial bem feito",
    config: {
      campaignMode: "single",
      weekStart: "2026-10-12",
      singleDate: "2026-10-12",
      singleTime: "10:00",
      singleContentType: "carousel",
      platforms: ["instagram"],
      topicsPerDay: {},
    },
    logs,
  };
}

const NA_FILA = log("Sistema", "1 dia(s) na fila: Segunda-feira 12. A pesquisa começa agora.");

// ─── o card nasce com o pedido ───

test("o post único de segunda 12 aparece no dia 12 às 10:00, como carrossel do Instagram, assim que entra na fila", () => {
  const [p] = pecasDoRun(postUnico([NA_FILA]), [], AGORA);
  assert.ok(p, "a peça pedida existe antes de qualquer card");
  assert.equal(p.data, "2026-10-12");
  assert.equal(p.hora, "10:00");
  assert.equal(p.formato, "Carrossel");
  assert.deepEqual(p.redes, ["instagram"]);
  assert.equal(p.etapa, "pesquisa");
  assert.equal(p.agente, "roberto-radar");
  assert.equal(p.id, "pedida:run-unico:2026-10-12");
  assert.equal(pecasEmProducaoNoDia([p], "2026-10-12").length, 1);
  assert.equal(pecasEmProducaoNoDia([p], "2026-10-13").length, 0);
});

test("a semana de 5 dias que começa na quinta 08: cada dia no seu dia, a quinta em produção e as outras na fila, depois de quinta", () => {
  const run = {
    id: "run-semana",
    status: "running",
    topic: "tema da semana",
    config: {
      campaignMode: "weekly",
      weekStart: "2026-10-08",
      weeklySchedule: { "1": "text", "2": "image", "3": "carousel", "4": "free", "5": "video" },
      postingTimes: { "1": "09:00", "2": "18:30", "3": "09:00", "4": "09:00", "5": "09:00" },
      platforms: ["linkedin", "instagram"],
      topicsPerDay: { "2": "o tema da sexta" },
    },
    logs: [
      log("Sistema", "5 dia(s) na fila: Quinta-feira 8, Sexta-feira 9, Sábado 10, Domingo 11, Segunda-feira 12. A pesquisa começa agora."),
      log("Roberto Radar", "Buscando dados em tempo real no X e web..."),
      log("Roberto Radar", "Pesquisa guardada: 4 fonte(s). Os dias começam agora."),
      log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Quinta-feira 8 sobre: ..."),
    ],
  };
  const pecas = pecasDoRun(run, [], AGORA);
  assert.deepEqual(pecas.map((p) => p.data), ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"]);
  assert.deepEqual(pecas.map((p) => p.dayOfWeek), [1, 2, 3, 4, 5]);
  assert.equal(pecas[1].hora, "18:30");
  assert.equal(pecas[1].tema, "o tema da sexta");
  assert.equal(pecas[0].tema, "tema da semana");
  assert.deepEqual(pecas.map((p) => p.formato), ["Texto", "Imagem", "Carrossel", "Imagem", "Vídeo"]);
  assert.equal(pecas[0].etapa, "texto");
  assert.equal(pecas[0].agente, "lucas-linkedin");
  assert.match(pecas[0].detalhe, /Lucas escrevendo/);
  for (const p of pecas.slice(1)) {
    assert.equal(p.etapa, "fila");
    assert.equal(p.agente, null);
    assert.equal(p.detalhe, "Na fila, depois de quinta");
  }
});

test("o dia que já passou e foi para a semana seguinte cai na data certa (dia 1 na segunda 19, não na 12)", () => {
  const run = {
    id: "run-empurrado",
    status: "running",
    config: { campaignMode: "weekly", weekStart: "2026-10-12", weeklySchedule: { "1": "text", "3": "image" }, postingTimes: {}, topicsPerDay: {} },
    logs: [log("Sistema", "2 dia(s) na fila: Quarta-feira 14, Segunda-feira 19. A pesquisa começa agora.")],
  };
  const pecas = pecasDoRun(run, [], AGORA);
  assert.deepEqual(pecas.map((p) => [p.data, p.dayOfWeek, p.weekOffset]), [["2026-10-14", 3, 0], ["2026-10-19", 1, 1]]);
});

// ─── quem está com o card ───

test("o card passa de mão em mão pela esteira: Lucas (com o Xavier junto), Diana, Vera, Paulo, e vira peça pronta", () => {
  const dia = (l: object[]) => pecasDoRun(postUnico([NA_FILA, log("Roberto Radar", "Pesquisa guardada: 2 fonte(s). Os dias começam agora."), ...l]), [], AGORA)[0];
  const lucas = log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre: ...");
  const xavier = log("Xavier X", "Iniciando: Crie uma thread para X (Twitter) para Segunda-feira 12 sobre: ...");
  const xavierPronto = log("Xavier X", "Tarefa concluída.", "completed");
  const lucasPronto = log("Lucas LinkedIn", "Tarefa concluída.", "completed");
  const diana = log("Diana Design", "Roteiro do carrossel de Segunda-feira 12 pronto.");
  const lamina = log("Diana Design", "Lâmina 2/5 pronta.");
  const vera = log("Vera Veredito", "Iniciando: Revise as peças de Segunda-feira 12...");
  const paulo = log("Paulo Publicador", "1 post(s) prontos para publicação na Segunda-feira 12.");

  // Os dois redatores escrevem juntos: o card fica com o Lucas, o Xavier ajuda.
  let p = dia([lucas, xavier]);
  assert.equal(p.agente, "lucas-linkedin");
  assert.deepEqual(p.ajudantes, ["xavier-x"]);
  assert.equal(p.etapa, "texto");
  // O Xavier terminou: já não ajuda; o card não pulou para ele.
  p = dia([lucas, xavier, xavierPronto]);
  assert.equal(p.agente, "lucas-linkedin");
  assert.deepEqual(p.ajudantes, []);
  p = dia([lucas, xavier, xavierPronto, lucasPronto, diana]);
  assert.equal(p.agente, "diana-design");
  assert.equal(p.etapa, "arte");
  assert.equal(p.detalhe, "Diana criando o carrossel");
  p = dia([lucas, xavier, xavierPronto, lucasPronto, diana, lamina]);
  assert.equal(p.detalhe, "Diana: lâmina 2 de 5 pronta");
  p = dia([lucas, xavier, xavierPronto, lucasPronto, diana, lamina, vera]);
  assert.equal(p.agente, "vera-veredito");
  assert.equal(p.etapa, "revisao");
  // A Vera reprovou e o Lucas corrige: o card volta para ele (é correção, não escrita em paralelo).
  p = dia([lucas, xavier, xavierPronto, lucasPronto, diana, lamina, vera, log("Lucas LinkedIn", "Iniciando: A Vera reprovou o post do LinkedIn. Corrija...")]);
  assert.equal(p.agente, "lucas-linkedin");
  assert.deepEqual(p.ajudantes, []);
  p = dia([lucas, xavier, xavierPronto, lucasPronto, diana, lamina, vera, paulo]);
  assert.equal(p.agente, "paulo-publicador");
  assert.equal(p.etapa, "publicacao");
  // O post existe: a peça está pronta, e o quadro mostra o cartão de verdade.
  const pronta = pecasDoRun(postUnico([NA_FILA, lucas, paulo]), [{ runId: "run-unico", dayOfWeek: 1, scheduledAt: "2026-10-12T13:00:00.000Z" }], AGORA)[0];
  assert.equal(pronta.etapa, "pronta");
  assert.equal(pronta.agente, null);
  assert.equal(pecasEmProducaoNoDia([pronta], "2026-10-12").length, 0, "pronta não vira cartão em produção: o cartão real está no lugar");
});

test("o post de outra campanha no mesmo dia não entrega esta peça; o post cancelado desta entrega", () => {
  const outra = pecasDoRun(postUnico([NA_FILA]), [{ runId: "outro-run", dayOfWeek: 1, scheduledAt: "2026-10-12T13:00:00.000Z" }], AGORA)[0];
  assert.equal(outra.etapa, "pesquisa");
  const cancelado = pecasDoRun(postUnico([NA_FILA], "completed"), [{ runId: "run-unico", dayOfWeek: 1, scheduledAt: "2026-10-12T13:00:00.000Z" }], AGORA)[0];
  assert.equal(cancelado.etapa, "pronta");
});

test("a campanha quinzenal: o mesmo dia da semana nas duas semanas é duas peças, e o post de uma não entrega a outra", () => {
  const run = {
    id: "run-quinzena",
    status: "running",
    config: { campaignMode: "biweekly", weekStart: "2026-10-12", weeklySchedule: { "1": "text" }, postingTimes: { "1": "09:00" }, topicsPerDay: {} },
    logs: [log("Sistema", "2 dia(s) na fila: Segunda-feira 12, Segunda-feira 19. A pesquisa começa agora."), log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora.")],
  };
  const pecas = pecasDoRun(run, [{ runId: "run-quinzena", dayOfWeek: 1, scheduledAt: "2026-10-12T12:00:00.000Z" }], AGORA);
  assert.equal(pecas.length, 2);
  assert.equal(pecas[0].etapa, "pronta");
  assert.equal(pecas[1].etapa, "texto");
  assert.equal(pecas[1].weekOffset, 1);
});

// ─── a falha vira cartão com motivo ───

test("a tentativa que falhou mostra o motivo e que a fila repete; a última vira 'falhou' com o motivo e sem ninguém no card", () => {
  const base = [NA_FILA, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre: ...")];
  const tentando = pecasDoRun(
    postUnico([...base, log("Sistema", "O dia Segunda-feira 12 não pôde ser gerado (Segunda-feira 12 terminou sem nenhuma peça: nenhum redator entregou.).", "warning"), log("Sistema", "Tentativa 1 do dia falhou e vai repetir: Segunda-feira 12 terminou sem nenhuma peça: nenhum redator entregou.", "warning")]),
    [],
    AGORA
  )[0];
  assert.equal(tentando.etapa, "tentando");
  assert.equal(tentando.agente, null);
  assert.match(tentando.motivo ?? "", /nenhum redator entregou/);
  assert.match(tentando.detalhe, /tenta de novo sozinha/);

  // A tentativa nova retoma: o card volta para quem pegou.
  const retomou = pecasDoRun(
    postUnico([...base, log("Sistema", "Tentativa 1 do dia falhou e vai repetir: x", "warning"), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre: ...")]),
    [],
    AGORA
  )[0];
  assert.equal(retomou.etapa, "texto");
  assert.equal(retomou.agente, "lucas-linkedin");

  const falhou = pecasDoRun(
    postUnico([...base, log("Sistema", "Tentativa 3 do dia falhou e foi a última, não repete mais: a Vera caiu", "warning")], "failed"),
    [],
    AGORA
  )[0];
  assert.equal(falhou.etapa, "falhou");
  assert.equal(falhou.motivo, "a Vera caiu");
  assert.equal(falhou.agente, null);
});

test("a campanha fechada sem a peça e sem falha registrada não deixa cartão (o cliente cancelou); a cancelada não deixa nada", () => {
  assert.equal(pecasDoRun(postUnico([NA_FILA], "completed"), [], AGORA).length, 0);
  assert.equal(pecasDoRun(postUnico([NA_FILA], "cancelled"), [], AGORA).length, 0);
  const pausada = pecasDoRun(postUnico([NA_FILA], "paused"), [], AGORA)[0];
  assert.equal(pausada.etapa, "pausada");
});

test("o dia dispensado some; a semana do vídeo (esteira própria) não entra; o log sem a fila não inventa peça", () => {
  const dispensado = pecasDoRun(postUnico([NA_FILA, log("Sistema", "O dia Segunda-feira 12 não está mais na semana pedida e foi dispensado.", "warning")]), [], AGORA);
  assert.equal(dispensado.length, 0);
  const video = { id: "v", status: "running", config: { videoJobId: "job", weekStart: "2026-10-12" }, logs: [NA_FILA] };
  assert.equal(pecasDoRun(video, [], AGORA).length, 0);
  assert.equal(pecasDoRun(postUnico([log("Sistema", "Iniciando pesquisa...")]), [], AGORA).length, 0);
});

test("o vídeo da campanha, que roda ao lado do dia seguinte, não rouba o card do dia que está sendo escrito", () => {
  const run = {
    id: "run-v",
    status: "running",
    config: { campaignMode: "weekly", weekStart: "2026-10-12", weeklySchedule: { "1": "video", "2": "text" }, postingTimes: {}, topicsPerDay: {} },
    logs: [
      log("Sistema", "2 dia(s) na fila: Segunda-feira 12, Terça-feira 13. A pesquisa começa agora."),
      log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."),
      log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Terça-feira 13 sobre: ..."),
      log("Diana Design", "Vídeo de 8s: geração 1 de 2 pronta (4s). A próxima entra na fila."),
    ],
  };
  const pecas = pecasDoRun(run, [{ runId: "run-v", dayOfWeek: 1, scheduledAt: "2026-10-12T12:00:00.000Z" }], AGORA);
  assert.equal(pecas[0].etapa, "pronta");
  assert.equal(pecas[1].agente, "lucas-linkedin");
});

test("sem novidade: os minutos desde o último registro, só com a peça em produção", () => {
  const p = pecasDoRun(postUnico([NA_FILA, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora.", "running", 30), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre: ...", "running", 12)]), [], AGORA)[0];
  assert.equal(p.semNovidadeHaMin, 12);
  const fila = pecasDoRun(postUnico([NA_FILA]), [], AGORA)[0];
  assert.equal(fila.etapa, "pesquisa");
});

test("quemEstaComOCard sem redator principal conhecido cai no primeiro que pegou o dia", () => {
  const r = quemEstaComOCard([log("Igor Instagram", "Iniciando: Adapte o post..."), log("Fernanda Facebook", "Iniciando: Adapte o post...")]);
  assert.equal(r.agente, "igor-instagram");
  assert.deepEqual(r.ajudantes, ["fernanda-facebook"]);
});

// ─── o escritório ───

test("o card na cabeça é o mesmo cartão do quadro: dia, hora, formato e rede; só quem está com ele o tem", () => {
  const pecas = pecasPedidas({
    runs: [postUnico([NA_FILA, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."), log("Diana Design", "Criando imagem para Segunda-feira 12")])],
    entregas: [],
    agora: AGORA,
  });
  const cabecas = cardsNaCabeca(pecas);
  assert.deepEqual(Object.keys(cabecas), ["diana-design"]);
  assert.deepEqual(cabecas["diana-design"][0], { pecaId: "pedida:run-unico:2026-10-12", dia: "Seg 12", hora: "10:00", formato: "Carrossel", redes: ["instagram"], etapa: "arte" });
  assert.deepEqual(cardDaPeca(pecas[0]).dia, "Seg 12");
  assert.equal(haProjetoAcontecendo(pecas), true);
});

test("na pesquisa, o Roberto segura todas as peças da campanha; na fila, ninguém", () => {
  const run = {
    id: "r",
    status: "running",
    config: { campaignMode: "weekly", weekStart: "2026-10-12", weeklySchedule: { "1": "text", "2": "text" }, postingTimes: {}, topicsPerDay: {} },
    logs: [log("Sistema", "2 dia(s) na fila: Segunda-feira 12, Terça-feira 13. A pesquisa começa agora.")],
  };
  const pecas = pecasDoRun(run, [], AGORA);
  assert.equal(cardsNaCabeca(pecas)["roberto-radar"]?.length, 2);
  const depois = pecasDoRun({ ...run, logs: [...run.logs, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre")] }, [], AGORA);
  assert.equal(cardsNaCabeca(depois)["roberto-radar"], undefined);
  assert.equal(cardsNaCabeca(depois)["lucas-linkedin"]?.length, 1);
});

test("só anda quem entrega: a passagem é do dono anterior para o novo, a pronta vai para a sua mesa, a primeira leitura não anda ninguém", () => {
  const pesquisa = postUnico([NA_FILA]);
  const antes = pecasDoRun(pesquisa, [], AGORA);
  assert.deepEqual(passagensDoCard({}, antes), [], "quem abre a tela no meio não vê procissão");
  const donos = donosDasPecas(antes);
  assert.deepEqual(donos, { "pedida:run-unico:2026-10-12": "roberto-radar" });

  const escrevendo = pecasDoRun(postUnico([NA_FILA, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre")]), [], AGORA);
  const passagem = passagensDoCard(donos, escrevendo);
  assert.equal(passagem.length, 1);
  assert.equal(passagem[0].de, "roberto-radar");
  assert.equal(passagem[0].para, "lucas-linkedin");
  assert.equal(passagem[0].card.dia, "Seg 12");
  // A mesma leitura de novo: nada mudou, ninguém anda.
  assert.deepEqual(passagensDoCard(donosDasPecas(escrevendo), escrevendo), []);

  const pronta = pecasDoRun(postUnico([NA_FILA, log("Paulo Publicador", "1 post(s) prontos para publicação na Segunda-feira 12.")]), [{ runId: "run-unico", dayOfWeek: 1, scheduledAt: "2026-10-12T13:00:00.000Z" }], AGORA);
  const entrega = passagensDoCard({ "pedida:run-unico:2026-10-12": "paulo-publicador" }, pronta);
  assert.deepEqual(entrega.map((e) => [e.de, e.para]), [["paulo-publicador", "voce"]]);
  // Da falha ninguém anda: o card só some.
  const falhou = pecasDoRun(postUnico([NA_FILA, log("Sistema", "Tentativa 3 do dia falhou e foi a última, não repete mais: x", "warning")], "failed"), [], AGORA);
  assert.deepEqual(passagensDoCard({ "pedida:run-unico:2026-10-12": "lucas-linkedin" }, falhou), []);
  assert.equal(haProjetoAcontecendo(falhou), false);
});

test("quem ajuda (o Xavier na thread) aparece como ajudando na peça do Lucas, sem card", () => {
  const pecas = pecasDoRun(postUnico([NA_FILA, log("Roberto Radar", "Pesquisa guardada: 1 fonte(s). Os dias começam agora."), log("Lucas LinkedIn", "Iniciando: Escreva um post de LinkedIn para Segunda-feira 12 sobre"), log("Xavier X", "Iniciando: Crie uma thread para X (Twitter) para Segunda-feira 12 sobre")]), [], AGORA);
  assert.deepEqual(ajudandoNaPeca(pecas), { "xavier-x": "pedida:run-unico:2026-10-12" });
  assert.equal(cardsNaCabeca(pecas)["xavier-x"], undefined);
});

// ─── a prova no código ───

test("a rota de status manda os runs da semana e o quadro e o escritório leem a mesma lista", () => {
  const rota = ler("app/api/pipeline/status/route.ts");
  assert.match(rota, /runsDaSemana/);
  assert.match(rota, /entregasDaSemana/);
  const gestor = ler("components/content/content-manager.tsx");
  assert.match(gestor, /pecasPedidas\(\{/);
  assert.match(gestor, /pecasEmProducaoNoDia\(/);
  assert.match(gestor, /pecasPedidas=\{pecasPedidasDaSemana\}/);
  const quadro = ler("components/content/semana-do-quadro.tsx");
  assert.match(quadro, /CartaoDaPecaPedida/);
  assert.match(quadro, /chaveDaPecaQueFalhou\(/);
  assert.match(quadro, /data-peca-pedida=/);
  const escritorio = ler("components/escritorio/escritorio.tsx");
  assert.match(escritorio, /passagensDoCard\(/);
  assert.match(escritorio, /cardsNaCabeca\(/);
  assert.match(escritorio, /haProjetoAcontecendo\(/);
  const cena = ler("components/escritorio/escritorio-do-squad.tsx");
  // O dev não tem anel permanente; o card na cabeça; as falas apagadas; o café só ocioso.
  assert.match(cena, /semAnel/);
  assert.match(cena, /CardNaCabeca/);
  assert.match(cena, /OPACIDADE_DA_FALA/);
  assert.match(cena, /emHorarioDeTrabalho/);
  for (const arquivo of ["lib/pipeline/pecas-pedidas.ts", "scripts/testes/pecas-pedidas-0810.test.mts"]) {
    assert.doesNotMatch(ler(arquivo), TRAVESSAO, `${arquivo} sem travessão`);
  }
});
