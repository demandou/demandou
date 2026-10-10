// As estatísticas da CONTA (09/10/2026), pedido do Bruno com o print do Painel
// Profissional do @prdonaire: "isso tem que estar na primeira tela da Demandou".
//   - as janelas de 30 dias, a anterior e o "antes da Demandou" dentro dos 90
//     dias que a Meta guarda;
//   - a leitura das respostas da Meta (total, quebras, soma dos dias), com
//     "não veio" nulo e nunca zero;
//   - o 403 código 10 medido em 09/10 vira "falta permissão";
//   - o estado da tela: reconectar, aguardando a Meta, aguardando a leitura,
//     número; a leitura boa sobrevive à tentativa que falha depois;
//   - o escopo novo no login do Instagram (com a chave para desligar), o
//     read_insights do Facebook, a chave do aviso e nenhum travessão.
// Nada aqui toca banco, IA ou rede.
// Rodar: npx tsx --test scripts/testes/estatisticas-da-conta-0910.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  causaDaReconexao,
  classificarErroDaMeta,
  comparacaoComAntesValida,
  divisaoPorSeguimento,
  divisaoPorTipo,
  estadoNaTela,
  fraseDoEstado,
  janelasDaLeitura,
  legendaCurta,
  parte,
  principaisConteudos,
  prioridadeDaLeitura,
  problemaDaTentativa,
  proximoGuardado,
  quebraDaMetrica,
  seguidoresGanhos,
  somaDosDias,
  tipoDaMidia,
  totalDaMetrica,
  variacaoPct,
  METRICAS_DO_INSTAGRAM,
  TETO_DO_HISTORICO,
  type GuardadoDaConta,
  type LeituraDaConta,
  type Tentativa,
} from "@/lib/analytics/tipos-da-conta";
import { escoposDoInstagram, permissoesDaResposta, ESCOPO_DE_ESTATISTICAS } from "@/lib/oauth/instagram";
import { FACEBOOK_SCOPES } from "@/lib/oauth/facebook";
import { chaveDoAvisoDeEstatisticas, ehChaveDasTelas } from "@/lib/avisos/chaves";
import { leituraLocalDeEstatisticas } from "@/lib/analytics/estatisticas-locais";

const TRAVESSAO = /[—–]/;
const DIA = 24 * 3600_000;
const AGORA = new Date("2026-10-09T18:40:12Z");

const tentativa = (estado: Tentativa["estado"], em = "2026-10-09T15:40:00.000Z", marcaDoToken = "aaa"): Tentativa => ({ em, estado, motivo: estado === "ok" ? null : "Application does not have permission for this action (código 10)", marcaDoToken });

function leitura(visualizacoes: number, lidoEm = "2026-10-09T18:00:00.000Z", desde = "2026-09-09T18:00:00.000Z"): LeituraDaConta {
  return {
    lidoEm,
    atual: { janela: { desde, ate: lidoEm }, visualizacoes: { valor: visualizacoes, fonte: "GET x" }, alcance: { valor: 772, fonte: "GET x" } },
    anterior: { janela: { desde: "2026-08-10T18:00:00.000Z", ate: desde }, visualizacoes: { valor: 1200, fonte: "GET y" }, alcance: null },
    contasComInteracao: null,
    interacoes: null,
    porSeguimento: null,
    porTipo: null,
    seguidoresGanhos: null,
    seguidores: { valor: 2100, fonte: "GET z" },
    principais: [],
    faltas: [],
  };
}

const base = { rede: "instagram" as const, contaId: "c1", perfil: "@prdonaire", conectadaEm: "2026-09-15T02:23:03.634Z" };

function guardado(extra: Partial<GuardadoDaConta> = {}): GuardadoDaConta {
  return { versao: 1, ...base, tentativa: tentativa("sem_permissao"), permissoes: null, ultima: null, antes: null, antesMotivo: null, historico: [], ...extra };
}

/* ── As janelas ── */

test("as janelas: 30 dias até a hora cheia, os 30 anteriores colados e o antes da conexão", () => {
  const j = janelasDaLeitura(AGORA, new Date(base.conectadaEm));
  assert.equal(j.atual.ate, "2026-10-09T18:00:00.000Z");
  assert.equal(new Date(j.atual.ate).getTime() - new Date(j.atual.desde).getTime(), 30 * DIA);
  assert.equal(j.anterior.ate, j.atual.desde);
  assert.equal(new Date(j.anterior.ate).getTime() - new Date(j.anterior.desde).getTime(), 30 * DIA);
  assert.ok(j.antes, "conectada em 15/09: os 30 dias antes ainda estão nos 90 da Meta");
  assert.equal(j.antes!.ate, base.conectadaEm);
  assert.equal(new Date(j.antes!.ate).getTime() - new Date(j.antes!.desde).getTime(), 30 * DIA);
  assert.equal(j.antesMotivo, null);
  assert.equal(j.comparacaoCompletaEm, new Date(new Date(base.conectadaEm).getTime() + 30 * DIA).toISOString());
});

test("o antes que já saiu dos 90 dias do Instagram não é lido, e diz por quê; no Facebook (dois anos) ainda é", () => {
  const conexao = new Date("2026-07-01T12:00:00Z");
  const ig = janelasDaLeitura(AGORA, conexao, "instagram");
  assert.equal(ig.antes, null);
  assert.match(ig.antesMotivo!, /90 dias/);
  assert.ok(!TRAVESSAO.test(ig.antesMotivo!));
  const fb = janelasDaLeitura(AGORA, conexao, "facebook");
  assert.ok(fb.antes);
});

/* ── As respostas da Meta ── */

const EXEMPLO_DA_DOC = {
  data: [
    {
      name: "reach",
      period: "day",
      total_value: {
        value: 224,
        breakdowns: [{ dimension_keys: ["media_product_type"], results: [{ dimension_values: ["CAROUSEL_CONTAINER"], value: 100 }, { dimension_values: ["POST"], value: 124 }] }],
      },
    },
  ],
};

test("o total e a quebra saem da resposta do exemplo da referência da Meta", () => {
  assert.equal(totalDaMetrica(EXEMPLO_DA_DOC, "reach"), 224);
  assert.deepEqual(quebraDaMetrica(EXEMPLO_DA_DOC, "reach", "media_product_type"), { CAROUSEL_CONTAINER: 100, POST: 124 });
  const t = divisaoPorTipo(quebraDaMetrica(EXEMPLO_DA_DOC, "reach", "media_product_type"), "GET x")!;
  assert.equal(t.publicacoes, 224, "carrossel e post são os dois do feed");
});

test("métrica que não veio é nula, nunca zero (a Meta devolve vazio, não 0)", () => {
  assert.equal(totalDaMetrica({ data: [] }, "views"), null);
  assert.equal(totalDaMetrica(null, "views"), null);
  assert.equal(quebraDaMetrica({ data: [{ name: "views", total_value: { value: 10 } }] }, "views", "follow_type"), null);
  assert.equal(divisaoPorSeguimento(null, "x"), null);
  assert.equal(divisaoPorSeguimento({}, "x"), null);
  assert.equal(somaDosDias({ data: [{ name: "page_media_view", values: [] }] }, "page_media_view"), null);
});

test("as proporções do print do Bruno: 68,8% seguidores, Reels 61,9%, Histórias 19,2%, Publicações 18,9%", () => {
  const s = divisaoPorSeguimento({ FOLLOWER: 2586, NON_FOLLOWER: 1173 }, "GET x")!;
  const total = s.seguidores + s.naoSeguidores + s.desconhecido;
  assert.equal(total, 3759);
  assert.equal(parte(s.seguidores, total), 68.8);
  assert.equal(parte(s.naoSeguidores, total), 31.2);
  const t = divisaoPorTipo({ REEL: 2327, STORY: 722, POST: 500, CAROUSEL_CONTAINER: 210 }, "GET x")!;
  const tt = t.reels + t.stories + t.publicacoes;
  assert.equal(parte(t.reels, tt), 61.9);
  assert.equal(parte(t.stories, tt), 19.2);
  assert.equal(parte(t.publicacoes, tt), 18.9);
});

test("tipos que a Meta escreve de dois jeitos e os desconhecidos aparecem em outros", () => {
  const t = divisaoPorTipo({ REELS: 5, REEL: 5, AD: 3, LIVE: 2 }, "x")!;
  assert.equal(t.reels, 10);
  assert.equal(t.anuncios, 3);
  assert.equal(t.outros, 2);
  assert.equal(tipoDaMidia("REELS", "VIDEO"), "reels");
  assert.equal(tipoDaMidia("FEED", "CAROUSEL_ALBUM"), "carrossel");
  assert.equal(tipoDaMidia("FEED", "IMAGE"), "publicacao");
  assert.equal(tipoDaMidia("STORY", "VIDEO"), "story");
});

test("seguidores ganhos: FOLLOWER seguiram, NON_FOLLOWER deixaram; páginas somam os dias", () => {
  assert.deepEqual(seguidoresGanhos({ FOLLOWER: 40, NON_FOLLOWER: 7 }, "x"), { seguiram: 40, deixaram: 7, fonte: "x" });
  assert.equal(somaDosDias({ data: [{ name: "page_media_view", values: [{ value: 10 }, { value: 5 }, { value: 0 }] }] }, "page_media_view"), 15);
});

test("os nomes das métricas são os da referência oficial", () => {
  assert.deepEqual(Object.values(METRICAS_DO_INSTAGRAM).sort(), ["accounts_engaged", "follows_and_unfollows", "reach", "total_interactions", "views"]);
});

test("principais por visualização: sem número fica de fora (não é zero), e no máximo N", () => {
  const item = (id: string, v: number | null) => ({ id, legenda: id, tipo: "reels", link: null, miniatura: null, publicadoEm: null, visualizacoes: v, alcance: null, fonte: "x" });
  const r = principaisConteudos([item("a", 10), item("b", null), item("c", 300), item("d", 50)], 2);
  assert.deepEqual(r.map((x) => x.id), ["c", "d"]);
  assert.equal(legendaCurta("\n  Primeira linha  \nsegunda"), "Primeira linha");
  assert.equal(legendaCurta("x".repeat(200), 10).length, 10);
});

/* ── Os erros da Meta ── */

test("o 403 código 10 medido em 09/10 é falta de permissão; 190 é token; 4 é limite", () => {
  assert.equal(classificarErroDaMeta(403, { message: "Application does not have permission for this action", code: 10 }), "sem_permissao");
  assert.equal(classificarErroDaMeta(400, { message: "(#200) Requires read_insights permission", code: 200 }), "sem_permissao");
  assert.equal(classificarErroDaMeta(400, { message: "Error validating access token: Session has expired", code: 190 }), "token_invalido");
  assert.equal(classificarErroDaMeta(400, { message: "Application request limit reached", code: 4 }), "limite");
  assert.equal(classificarErroDaMeta(400, { message: "(#100) Invalid parameter", code: 100 }), "erro");
});

/* ── O estado da tela ── */

test("sem registro, a tela espera a primeira leitura (e não mostra número)", () => {
  assert.equal(estadoNaTela(null), "aguardando_leitura");
  assert.equal(estadoNaTela(guardado({ tentativa: null })), "aguardando_leitura");
});

test("recusa por permissão sem saber o que a conexão concedeu: reconectar", () => {
  assert.equal(estadoNaTela(guardado()), "reconectar");
  assert.equal(estadoNaTela(guardado({ tentativa: tentativa("token_invalido") })), "reconectar");
});

test("a conexão devolveu a lista SEM a permissão: a Meta não liberou para o app, reconectar de novo não muda", () => {
  const g = guardado({ permissoes: { lista: ["instagram_business_basic", "instagram_business_content_publish"], em: "2026-10-09T15:00:00.000Z" } });
  assert.equal(estadoNaTela(g), "aguardando_meta");
});

test("reconectou depois da recusa: espera a leitura com o token novo, sem convite", () => {
  const g = guardado({ permissoes: { lista: ["instagram_business_basic", ESCOPO_DE_ESTATISTICAS], em: "2026-10-09T16:00:00.000Z" } });
  assert.equal(estadoNaTela(g), "aguardando_leitura");
});

test("o login ainda não pede a leitura (10/10): aguardando a Meta, nunca reconectar, mesmo sem registro da conexão", () => {
  assert.equal(estadoNaTela(guardado(), { pedimosNoInstagram: false }), "aguardando_meta");
  // O token morto continua pedindo reconexão: aí reconectar resolve.
  assert.equal(estadoNaTela(guardado({ tentativa: tentativa("token_invalido") }), { pedimosNoInstagram: false }), "reconectar");
});

test("a conexão é de quando a Demandou não pedia a leitura e agora pede: reconectar resolve", () => {
  const g = guardado({ permissoes: { lista: ["instagram_business_basic"], em: "2026-10-09T15:00:00.000Z", pedidas: ["instagram_business_basic", "instagram_business_content_publish"] } });
  assert.equal(estadoNaTela(g, { pedimosNoInstagram: true }), "reconectar");
  const pediu = guardado({ permissoes: { lista: ["instagram_business_basic"], em: "2026-10-09T15:00:00.000Z", pedidas: ["instagram_business_basic", ESCOPO_DE_ESTATISTICAS] } });
  assert.equal(estadoNaTela(pediu, { pedimosNoInstagram: true }), "aguardando_meta");
});

test("com leitura, a tela mostra número, e o problema da tentativa mais nova vem junto", () => {
  const g = guardado({ ultima: leitura(3759) });
  assert.equal(estadoNaTela(g), "numeros");
  assert.equal(problemaDaTentativa(g), "reconectar");
  assert.equal(problemaDaTentativa(guardado({ ultima: leitura(3759), tentativa: tentativa("ok") })), null);
  assert.equal(problemaDaTentativa(guardado({ ultima: leitura(3759), tentativa: tentativa("limite") })), null);
  assert.equal(estadoNaTela(guardado({ tentativa: tentativa("erro") })), "erro");
});

test("as frases dizem o porquê, sem número e sem travessão", () => {
  for (const estado of ["reconectar", "aguardando_meta", "aguardando_leitura", "erro"] as const) {
    for (const rede of ["instagram", "facebook"]) {
      for (const causa of ["permissao", "conexao", null] as const) {
        const f = fraseDoEstado({ estado, rede, perfil: "@prdonaire", motivo: "falhou", causa });
        assert.ok(f.length > 20, `${estado} ${rede}`);
        assert.ok(!TRAVESSAO.test(f));
        assert.ok(!/\d{2,}/.test(f.replace("@prdonaire", "")), "sem número na frase");
      }
    }
  }
});

test("token invalidado pela Meta (190) não é falta de permissão: a frase diz que a conexão caiu", () => {
  const g = guardado({ tentativa: tentativa("token_invalido") });
  assert.equal(causaDaReconexao(g), "conexao");
  assert.equal(causaDaReconexao(guardado()), "permissao");
  assert.equal(causaDaReconexao(null), null);
  const f = fraseDoEstado({ estado: "reconectar", rede: "facebook", perfil: "Demandou", motivo: null, causa: "conexao" });
  assert.match(f, /conexão com Demandou caiu/);
  assert.doesNotMatch(f, /permissão/);
});

/* ── O registro ── */

test("a leitura boa sobrevive à tentativa que falha depois; o histórico cresce e tem teto", () => {
  let g = proximoGuardado({ anterior: null, base, tentativa: tentativa("ok"), leitura: leitura(3000, "2026-10-08T18:00:00.000Z"), antes: { janela: { desde: "2026-08-16T02:23:03.634Z", ate: base.conectadaEm }, visualizacoes: { valor: 900, fonte: "GET a" }, alcance: null }, antesMotivo: null });
  assert.equal(g.historico.length, 1);
  g = proximoGuardado({ anterior: g, base, tentativa: tentativa("sem_permissao", "2026-10-09T18:00:00.000Z"), leitura: null, antes: null, antesMotivo: null });
  assert.equal(g.ultima?.atual.visualizacoes?.valor, 3000, "a leitura de ontem continua na tela, com a data dela");
  assert.equal(g.tentativa?.estado, "sem_permissao");
  assert.equal(g.antes?.visualizacoes?.valor, 900, "o antes lido uma vez fica");
  for (let i = 0; i < TETO_DO_HISTORICO + 10; i++) g = proximoGuardado({ anterior: g, base, tentativa: tentativa("ok"), leitura: leitura(i), antes: null, antesMotivo: null });
  assert.equal(g.historico.length, TETO_DO_HISTORICO);
  assert.equal(g.historico.at(-1)?.visualizacoes, TETO_DO_HISTORICO + 9);
});

test("conectada de novo do zero (outra data de conexão): o antes antigo não vale mais", () => {
  const g1 = proximoGuardado({ anterior: null, base, tentativa: tentativa("ok"), leitura: leitura(10), antes: { janela: { desde: "a", ate: "b" }, visualizacoes: { valor: 5, fonte: "x" }, alcance: null }, antesMotivo: null });
  const g2 = proximoGuardado({ anterior: g1, base: { ...base, conectadaEm: "2026-10-09T10:00:00.000Z" }, tentativa: tentativa("ok"), leitura: leitura(11), antes: null, antesMotivo: "motivo" });
  assert.equal(g2.antes, null);
  assert.equal(g2.antesMotivo, "motivo");
  assert.equal(g2.historico.length, 1);
});

test("a comparação com antes da Demandou só vale com a janela atual inteira depois da conexão", () => {
  const antes = { janela: { desde: "2026-08-16T02:23:03.634Z", ate: base.conectadaEm }, visualizacoes: { valor: 900, fonte: "x" }, alcance: null };
  assert.equal(comparacaoComAntesValida({ conectadaEm: base.conectadaEm, antes, ultima: leitura(10, "2026-10-09T18:00:00.000Z", "2026-09-09T18:00:00.000Z") }), false);
  assert.equal(comparacaoComAntesValida({ conectadaEm: base.conectadaEm, antes, ultima: leitura(10, "2026-10-20T18:00:00.000Z", "2026-09-20T18:00:00.000Z") }), true);
  assert.equal(comparacaoComAntesValida({ conectadaEm: base.conectadaEm, antes: null, ultima: leitura(10) }), false);
  assert.ok(Math.abs(variacaoPct(3759, 1200)! - 213.25) < 1e-9);
  assert.equal(variacaoPct(10, 0), null);
});

/* ── Quando ler ── */

test("quando ler: nunca lida primeiro; reconectada depois da recusa; uma vez a cada 20 h", () => {
  assert.equal(prioridadeDaLeitura(null, "m", AGORA), 0);
  assert.equal(prioridadeDaLeitura({ tentativa: null }, "m", AGORA), 0);
  const recente = { tentativa: tentativa("ok", new Date(AGORA.getTime() - 2 * 3600_000).toISOString(), "m") };
  assert.equal(prioridadeDaLeitura(recente, "m", AGORA), null);
  assert.equal(prioridadeDaLeitura(recente, "outro-token", AGORA), null, "token renovado depois de leitura boa não antecipa");
  const recusada = { tentativa: tentativa("sem_permissao", new Date(AGORA.getTime() - 2 * 3600_000).toISOString(), "m") };
  assert.equal(prioridadeDaLeitura(recusada, "m", AGORA), null);
  assert.equal(prioridadeDaLeitura(recusada, "token-novo", AGORA), 0, "reconectou: lê já");
  assert.equal(prioridadeDaLeitura({ tentativa: tentativa("ok", new Date(AGORA.getTime() - 21 * 3600_000).toISOString(), "m") }, "m", AGORA), 2);
  assert.equal(prioridadeDaLeitura({ tentativa: tentativa("limite", new Date(AGORA.getTime() - 2 * 3600_000).toISOString(), "m") }, "m", AGORA), 1);
});

/* ── O login, a chave, a prova local ── */

test("o login do Instagram pede a permissão de estatísticas, e a variável desliga só ela", () => {
  assert.ok(escoposDoInstagram({}).split(",").includes(ESCOPO_DE_ESTATISTICAS));
  assert.equal(ESCOPO_DE_ESTATISTICAS, "instagram_business_manage_insights");
  const sem = escoposDoInstagram({ INSTAGRAM_ESTATISTICAS_NO_LOGIN: "0" }).split(",");
  assert.deepEqual(sem, ["instagram_business_basic", "instagram_business_content_publish"]);
  assert.ok(FACEBOOK_SCOPES.split(",").includes("read_insights"));
  assert.ok(FACEBOOK_SCOPES.split(",").includes("pages_read_engagement"));
});

test("as permissões da troca do código: texto, lista, aninhada ou ausente (null é não sabemos)", () => {
  assert.deepEqual(permissoesDaResposta({ permissions: "instagram_business_basic, instagram_business_manage_insights" }), ["instagram_business_basic", "instagram_business_manage_insights"]);
  assert.deepEqual(permissoesDaResposta({ permissions: ["a", "b"] }), ["a", "b"]);
  assert.deepEqual(permissoesDaResposta({ data: [{ permissions: "a,b" }] }), ["a", "b"]);
  assert.equal(permissoesDaResposta({ access_token: "x" }), null);
});

test("a chave do aviso é das telas e muda com a tentativa", () => {
  const a = chaveDoAvisoDeEstatisticas("c1", "reconectar", "2026-10-09T15:40:00.000Z");
  const b = chaveDoAvisoDeEstatisticas("c1", "reconectar", "2026-10-10T15:40:00.000Z");
  assert.ok(a && ehChaveDasTelas(a));
  assert.notEqual(a, b);
  assert.equal(chaveDoAvisoDeEstatisticas("c1", "reconectar", null), null);
});

test("a prova local nunca vale em produção", () => {
  const antes = { NODE_ENV: process.env.NODE_ENV, ESTATISTICAS_LOCAIS: process.env.ESTATISTICAS_LOCAIS };
  const arquivo = path.join(process.cwd(), "scripts", "testes", ".estatisticas-locais-teste.json");
  fs.writeFileSync(arquivo, JSON.stringify({ p1: { "instagram:1": { ...guardado(), simulado: true } } }));
  try {
    process.env.ESTATISTICAS_LOCAIS = arquivo;
    (process.env as Record<string, string>).NODE_ENV = "development";
    assert.equal(leituraLocalDeEstatisticas("p1", "instagram:1")?.simulado, true);
    assert.equal(leituraLocalDeEstatisticas("p1", "instagram:2"), undefined);
    (process.env as Record<string, string>).NODE_ENV = "production";
    assert.equal(leituraLocalDeEstatisticas("p1", "instagram:1"), undefined);
  } finally {
    fs.unlinkSync(arquivo);
    (process.env as Record<string, string | undefined>).NODE_ENV = antes.NODE_ENV;
    if (antes.ESTATISTICAS_LOCAIS === undefined) delete process.env.ESTATISTICAS_LOCAIS;
    else process.env.ESTATISTICAS_LOCAIS = antes.ESTATISTICAS_LOCAIS;
  }
});

test("nenhum travessão nos arquivos novos", () => {
  for (const f of ["lib/analytics/tipos-da-conta.ts", "lib/analytics/estatisticas-da-conta.ts", "lib/analytics/estatisticas-locais.ts", "components/analytics/estatisticas-da-conta.tsx"]) {
    const texto = fs.readFileSync(path.join(process.cwd(), f), "utf8");
    assert.ok(!TRAVESSAO.test(texto), f);
  }
});
