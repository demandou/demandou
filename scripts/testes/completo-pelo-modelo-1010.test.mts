/**
 * O completo no modelo do curso (10/10): o plano em blocos cortados na pausa,
 * a junção dos blocos no tempo do vídeo, a conferência do curso que aponta só
 * os blocos com defeito, o teto de gasto, as partes do render e a escolha
 * entre o caminho do curso e a reserva. Sem banco, sem rede, sem IA.
 *   npx tsx --test scripts/testes/completo-pelo-modelo-1010.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const raiz = new URL("../../", import.meta.url);
const B = await import(new URL("worker/src/modelo/blocos-do-plano.mjs", raiz).href);
const { conferirPlano } = await import(new URL("worker/modelos/modelo-manifesto-16x9/template/scripts/conferir.mjs", raiz).href);
const { instrucaoDoBloco } = await import("@/lib/media/editor-do-curso/escrever-plano");
const { caminhoDoCompleto, versaoDeitadaDoModelo, VERSOES_DOS_MODELOS, MODELOS_DO_CURSO, tetoDoPlanoUsd, prazoDoCompletoNoModeloMs } = await import("@/lib/media/editor-do-curso/no-corte");
const { TETO_DA_ESPERA_MS } = await import("@/lib/media/montagem-no-worker");

const TRAVESSAO = /[—–]/;
type Palavra = { em: number; ate: number; w: string };

/** Fala sintética: uma palavra a cada 0,4 s, com pausas longas nos instantes pedidos. */
function falaCom(duracao: number, pausas: Record<number, number> = {}): Palavra[] {
  const ps: Palavra[] = [];
  let t = 0.2;
  let k = 0;
  while (t < duracao - 0.5) {
    ps.push({ em: +t.toFixed(3), ate: +(t + 0.3).toFixed(3), w: k % 12 === 11 ? "fim." : `p${k}` });
    t += 0.4;
    for (const [em, dur] of Object.entries(pausas)) if (Math.abs(t - Number(em)) < 0.2) t += dur;
    k++;
  }
  return ps;
}

test("vídeo curto fica num bloco só (abaixo do limiar, o fluxo de sempre)", () => {
  const ps = falaCom(180);
  const bs = B.blocosDoPlano(ps, 180);
  assert.equal(bs.length, 1);
  assert.deepEqual([bs[0].inicio, bs[0].fim, bs[0].de, bs[0].ate], [0, 180, 0, ps.length - 1]);
  assert.ok(B.LIMIAR_DOS_BLOCOS_SEG > 150 && B.LIMIAR_DOS_BLOCOS_SEG >= 200);
});

test("os blocos são cortados na maior pausa perto de 150 s, sem palavra perdida nem repetida", () => {
  const dur = 620;
  const ps = falaCom(dur, { 140: 1.8, 300: 0.9, 455: 2.2 });
  const bs = B.blocosDoPlano(ps, dur);
  assert.ok(bs.length >= 3 && bs.length <= 5, `blocos: ${bs.length}`);
  // a primeira borda cai na pausa longa perto de 140 s (a maior da faixa de 110 a 190 s)
  const borda = bs[1].inicio;
  const antes = ps[bs[1].de - 1];
  const depois = ps[bs[1].de];
  assert.ok(depois.em - antes.ate > 1.5, "a borda não caiu na pausa longa");
  assert.ok(borda > antes.ate && borda < depois.em, "a borda fica no meio da pausa");
  // cobertura: contíguos, do zero ao fim, cada palavra em exatamente um bloco
  assert.equal(bs[0].inicio, 0);
  assert.equal(bs.at(-1).fim, dur);
  for (let i = 1; i < bs.length; i++) {
    assert.equal(bs[i].inicio, bs[i - 1].fim);
    assert.equal(bs[i].de, bs[i - 1].ate + 1);
  }
  assert.equal(bs.at(-1).ate, ps.length - 1);
  for (const b of bs) for (const p of ps.slice(b.de, b.ate + 1)) assert.ok(p.em >= b.inicio && p.em < b.fim);
});

test("o trecho na grade de quadros: pedaços no quadro, palavras levadas junto, nada de deriva", () => {
  const manter = [
    { de: 1.012, ate: 4.987 },
    { de: 5.31, ate: 5.315 }, // menos de um quadro: sai
    { de: 6.004, ate: 9.519 },
    { de: 12.49, ate: 20.011 },
  ];
  // as palavras no tempo do trecho de antes (a soma dos pedaços originais)
  const dur = (m: { de: number; ate: number }) => m.ate - m.de;
  const C = [0, dur(manter[0]), dur(manter[0]) + dur(manter[1]), dur(manter[0]) + dur(manter[1]) + dur(manter[2])];
  const naGravacao = [1.5, 4.9, 5.312, 6.2, 9.4, 12.6, 19.9];
  const pedacoDe = [0, 0, 1, 2, 2, 3, 3];
  const palavras = naGravacao.map((w, i) => ({ em: +(C[pedacoDe[i]] + (w - manter[pedacoDe[i]].de)).toFixed(3), ate: +(C[pedacoDe[i]] + (w - manter[pedacoDe[i]].de) + 0.08).toFixed(3), w: `p${i}` }));
  const a = B.alinharAosQuadros(manter, palavras, 30, 100.0);
  assert.equal(a.manter.length, 3);
  for (const m of a.manter) {
    assert.ok(Math.abs((100 + m.de) * 30 - Math.round((100 + m.de) * 30)) < 1e-3, "começo fora da grade");
    assert.ok(Math.abs((100 + m.ate) * 30 - Math.round((100 + m.ate) * 30)) < 1e-3, "fim fora da grade");
  }
  // cada palavra fica no mesmo lugar da gravação dentro do pedaço novo
  const C2 = [0, dur(a.manter[0]), dur(a.manter[0]) + dur(a.manter[1])];
  const novo = [0, 0, null, 1, 1, 2, 2];
  a.palavras.forEach((p: { em: number }, i: number) => {
    const k = novo[i];
    if (k === null) {
      assert.ok(Math.abs(p.em - C2[1]) < 0.002, "a palavra do pedaço que saiu vai ao começo do seguinte");
      return;
    }
    assert.ok(Math.abs(p.em - (C2[k] + (naGravacao[i] - a.manter[k].de))) < 0.002, `palavra ${i}: ${p.em}`);
  });
  assert.ok(a.ajusteMaxSeg < 0.1);
  const semFps = B.alinharAosQuadros(manter, palavras, null);
  assert.equal(semFps.manter, manter);
  assert.equal(semFps.fps, null);
});

test("deslocar tempos mexe só em de, ate, em, ...Em e batidas", () => {
  const m = {
    tipo: "cartaz",
    de: 1,
    ate: 5,
    campo: "papel",
    topo: [{ em: 1.2, texto: "OI", tamanho: 96 }],
    janela: { em: 2, linhas: ["EU"], batidas: [3, 4], zoom: 1.2 },
    negacoes: [{ em: 2.5, palavra: "X", riscoEm: 3.1 }],
    marcas: { de: 1.5, ate: 4.5, quantas: 12 },
  };
  const d = B.deslocarTempos(m, 100);
  assert.deepEqual([d.de, d.ate, d.topo[0].em, d.janela.em, d.negacoes[0].riscoEm, d.marcas.de, d.marcas.ate], [101, 105, 101.2, 102, 103.1, 101.5, 104.5]);
  assert.deepEqual(d.janela.batidas, [103, 104]);
  assert.deepEqual([d.topo[0].tamanho, d.janela.zoom, d.marcas.quantas, d.campo], [96, 1.2, 12, "papel"]);
  assert.deepEqual(B.deslocarTempos(d, -100), m);
});

test("os planos dos blocos voltam ao tempo do vídeo: cortados na borda, em ordem, correções somadas", () => {
  const blocos = [
    { indice: 0, de: 0, ate: 9, inicio: 0, fim: 150 },
    { indice: 1, de: 10, ate: 19, inicio: 150, fim: 300 },
  ];
  const planos = [
    { marca: { nome: "Ana", area: "Vendas" }, correcoes: { "Cloud": "Claude" }, semLegenda: [{ de: 10, ate: 11 }], momentos: [{ tipo: "frase", de: 140, ate: 160, texto: "A" }, { tipo: "cartaz", de: 2, ate: 6, janela: { em: 3, linhas: ["EU"] } }] },
    { marca: { nome: "Outro", area: "X" }, correcoes: { "né": "" }, momentos: [{ tipo: "destaque", de: 0.5, ate: 4, em: 1, texto: "B" }, { tipo: "frase", de: 151, ate: 155, texto: "fora" }] },
  ];
  const j = B.juntarPlanos(blocos, planos);
  assert.deepEqual(j.marca, { nome: "Ana", area: "Vendas" });
  assert.deepEqual(j.correcoes, { "Cloud": "Claude", "né": "" });
  assert.deepEqual(j.momentos.map((m: { tipo: string; de: number; ate: number }) => [m.tipo, m.de, m.ate]), [["cartaz", 2, 6], ["frase", 140, 150], ["destaque", 150.5, 154]]);
  assert.equal(j.momentos[2].em, 151);
  assert.deepEqual(j.semLegenda, [{ de: 10, ate: 11 }]);
  // ida e volta: o plano de um bloco tirado do junto é o que foi escrito (no tempo do bloco)
  const doBloco = B.planoDoBloco({ ...j, palavras: [], duracao: 300 }, blocos[1]);
  assert.deepEqual(doBloco.momentos.map((m: { tipo: string; de: number }) => [m.tipo, m.de]), [["destaque", 0.5]]);
});

test("o esqueleto do bloco é um corte que começa no zero", () => {
  const ps = falaCom(400, { 150: 1.5 });
  const esq = { video: "base.mp4", fps: 30, largura: 1920, altura: 1080, duracao: 400, rosto: { x: 0.5, y: 0.36 }, cortesEm: [12, 151, 160, 390], palavras: ps };
  const [b0, b1] = B.blocosDoPlano(ps, 400);
  const e1 = B.esqueletoDoBloco(esq, b1);
  assert.equal(e1.duracao, +(b1.fim - b1.inicio).toFixed(3));
  assert.ok(e1.palavras[0].em >= 0 && e1.palavras[0].em < 1.5);
  assert.equal(e1.palavras.length, b1.ate - b1.de + 1);
  assert.ok(e1.cortesEm.every((c: number) => c > 0 && c < e1.duracao));
  assert.deepEqual([e1.rosto, e1.largura, e1.fps], [esq.rosto, 1920, 30]);
  assert.equal(B.esqueletoDoBloco(esq, b0).palavras[0].em, ps[0].em);
});

// Um plano de 16:9 com N blocos de 150 s, cada um com momentos que passam na conferência do modelo.
function planoQuePassa(blocos: number) {
  const dur = blocos * 150;
  const palavras = falaCom(dur);
  const momentos: Record<string, unknown>[] = [];
  const tipos = ["cartaz", "frase", "escalada", "destaque", "selo", "topicos"];
  for (let t = 0, k = 0; t < dur - 6; t += 7, k++) {
    const em = palavras.find((p) => p.em >= t + 0.3)!.em;
    const tipo = tipos[k % tipos.length];
    const base = { tipo, de: t, ate: t + 5 };
    if (tipo === "cartaz") momentos.push({ ...base, janela: { em, linhas: ["EU"] } });
    else if (tipo === "frase") momentos.push({ ...base, texto: "uma frase", em });
    else if (tipo === "escalada") momentos.push({ ...base, degraus: [{ em, texto: "VAI" }], final: { em: em + 2, linhas: ["JÁ"] } });
    else if (tipo === "destaque") momentos.push({ ...base, texto: "X", em });
    else if (tipo === "selo") momentos.push({ ...base, itens: [{ em, texto: "1 ANO" }] });
    else momentos.push({ ...base, itens: [{ texto: "a", em }, { texto: "b", em: em + 2 }] });
  }
  return { video: "base.mp4", fps: 30, largura: 1920, altura: 1080, duracao: dur, rosto: { x: 0.5, y: 0.36 }, cortesEm: [], palavras, momentos };
}
const modelo16x9 = JSON.parse(readFileSync(new URL("worker/modelos/modelo-manifesto-16x9/template/modelo.json", raiz), "utf8"));
const tiposDoModelo = new Set([...readFileSync(new URL("worker/modelos/modelo-manifesto-16x9/template/src/plano.ts", raiz), "utf8").matchAll(/tipo\s*:\s*"([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]));

test("conferência em blocos: plano bom passa inteiro; vão longo vai só ao bloco dele", () => {
  const plano = planoQuePassa(3);
  const blocos = B.blocosDoPlano(plano.palavras, plano.duracao);
  assert.equal(blocos.length, 3);
  const bom = B.conferirEmBlocos({ plano, blocos, conferirPlano, modelo: modelo16x9, tipos: tiposDoModelo });
  assert.equal(bom.ok, true, bom.geral.erros.join("\n"));
  assert.ok(bom.porBloco.every((p: { erros: string[] }) => !p.erros.length));
  // tira 20 s de momentos no meio do bloco 2 (de 200 a 220 s)
  const ruim = { ...plano, momentos: plano.momentos.filter((m) => (m.de as number) < 196 || (m.de as number) > 222) };
  const r = B.conferirEmBlocos({ plano: ruim, blocos, conferirPlano, modelo: modelo16x9, tipos: tiposDoModelo });
  assert.equal(r.ok, false);
  assert.deepEqual(r.porBloco.map((p: { erros: string[] }) => p.erros.length > 0), [false, true, false]);
  // a mensagem vem no tempo do bloco: o vão começa uns segundos antes de 196 s do vídeo
  const de = Number(r.porBloco[1].erros.join(" ").match(/De (\d+),(\d) s/)?.slice(1).join("."));
  const esperado = 196 - blocos[1].inicio;
  assert.ok(de > esperado - 8 && de <= esperado, `${de} contra ${esperado}`);
  assert.match(B.textoDaConferencia(r.porBloco[1].erros), /^Conferência deste trecho[\s\S]*REPROVADO\./);
});

test("conferência em blocos: o vão que atravessa a emenda vai aos dois blocos", () => {
  const plano = planoQuePassa(2);
  const blocos = B.blocosDoPlano(plano.palavras, plano.duracao);
  const borda = blocos[1].inicio;
  // 5 s sem momento antes da borda e 5 s depois: cada lado passa, a soma (10 s) não
  const cortado = { ...plano, momentos: plano.momentos.filter((m) => (m.ate as number) < borda - 5 || (m.de as number) > borda + 5) };
  const r = B.conferirEmBlocos({ plano: cortado, blocos, conferirPlano, modelo: modelo16x9, tipos: tiposDoModelo });
  assert.equal(r.ok, false);
  assert.ok(r.porBloco[0].erros.some((e: string) => /emenda|vizinho/.test(e)));
  assert.ok(r.porBloco[1].erros.some((e: string) => /emenda|vizinho/.test(e)));
});

test("regra geral do bloco só conta quando o plano inteiro também falha nela", () => {
  assert.equal(B.regraGeral("Só 2 tipo(s) de bloco (frase, cartaz); use pelo menos 4 diferentes para o vídeo não ficar repetitivo."), "variedade");
  assert.equal(B.regraGeral("Só 31% do vídeo tem momento na tela (mínimo 50%). Transforme mais trechos da fala em blocos."), "cobertura");
  assert.equal(B.regraGeral('O momento "frase" em 3,0 s: falta "texto" (veja references/plano.md).'), null);
});

test("o fim do bloco anterior vai ao seguinte sem tempo, com os tipos usados", () => {
  const c = B.caudaDoBloco(
    { momentos: [{ tipo: "frase", de: 1, ate: 3, texto: "um" }, { tipo: "cartaz", de: 5, ate: 9, campo: "preto", topo: [{ em: 5, texto: "NADA" }], janela: { em: 6, linhas: ["VO", "CÊ"] } }, { tipo: "frase", de: 10, ate: 12, texto: "dois" }, { tipo: "selo", de: 13, ate: 15, itens: [{ em: 13, texto: "1 ANO" }] }] },
    "# Mapa\n1. linha um\n2. linha dois\n"
  );
  assert.deepEqual(c.ultimos.map((m: { tipo: string }) => m.tipo), ["cartaz", "frase", "selo"]);
  assert.equal(c.ultimos[0].campo, "preto");
  assert.match(c.ultimos[0].texto, /NADA/);
  assert.match(c.ultimos[0].texto, /VOCÊ/);
  assert.doesNotMatch(JSON.stringify(c.ultimos), /"de"|"em"/);
  assert.deepEqual(c.tipos, { frase: 2, cartaz: 1, selo: 1 });
  assert.equal(c.mapa, "1. linha um\n2. linha dois");
  assert.equal(B.caudaDoBloco(null, ""), null);
});

test("a instrução do trecho: abertura só no primeiro, fecho só no último, sem travessão", () => {
  const cauda = { ultimos: [{ tipo: "cartaz", texto: "EU" }], mapa: "linha", tipos: { cartaz: 3, frase: 1 } };
  const primeiro = instrucaoDoBloco({ indice: 0, total: 3, inicio: 0, fim: 150 }, 150);
  const meio = instrucaoDoBloco({ indice: 1, total: 3, inicio: 150, fim: 300, cauda }, 150);
  const ultimo = instrucaoDoBloco({ indice: 2, total: 3, inicio: 300, fim: 420, cauda }, 120);
  assert.match(primeiro, /TRECHO 1 DE 3/);
  assert.match(primeiro, /COMEÇO do vídeo/);
  assert.match(primeiro, /NÃO é o fim/);
  assert.match(meio, /NÃO é o começo/);
  assert.match(meio, /cartaz \(3\)/);
  assert.match(ultimo, /FIM do vídeo/);
  assert.match(ultimo, /termina em 120,0 s/);
  for (const t of [primeiro, meio, ultimo]) assert.doesNotMatch(t, TRAVESSAO);
});

test("teto do completo: US$ 1 por minuto, mínimo US$ 2 (o mesmo do corte)", () => {
  delete process.env.EDITOR_DO_CURSO_TETO_USD;
  assert.equal(tetoDoPlanoUsd(90), 2);
  assert.equal(tetoDoPlanoUsd(7 * 60), 7);
  assert.equal(tetoDoPlanoUsd(20 * 60), 20);
});

test("as partes do render cobrem todos os quadros, em ordem, e o paralelismo cabe na fatia", () => {
  for (const [dur, fps] of [[1200, 30], [455.3, 30], [151, 30], [20, 25]]) {
    const total = Math.round(dur * fps);
    const ps = B.partesDoRender(dur, fps);
    assert.equal(ps[0][0], 0);
    assert.equal(ps.at(-1)[1], total - 1);
    for (let i = 1; i < ps.length; i++) assert.equal(ps[i][0], ps[i - 1][1] + 1);
    for (const [a, b] of ps.slice(0, -1)) assert.equal(b - a + 1, 150 * fps);
    if (ps.length > 1) assert.ok(ps.at(-1)[1] - ps.at(-1)[0] + 1 >= 0.4 * 150 * fps);
  }
  assert.equal(B.partesDoRender(1200, 30).length, 8);
  assert.deepEqual(B.paralelismoDoRender({ remotion: 4, rendersDoCompleto: 2 }, 8), { paralelas: 2, concorrencia: 2 });
  assert.deepEqual(B.paralelismoDoRender({ remotion: 12, rendersDoCompleto: 4 }, 3), { paralelas: 3, concorrencia: 4 });
  assert.deepEqual(B.paralelismoDoRender({ remotion: 1, rendersDoCompleto: 2 }, 5), { paralelas: 1, concorrencia: 1 });
});

test("os quadros da revisão: dois por momento, dentro do vídeo", () => {
  const plano = planoQuePassa(1);
  const ts = B.instantesDaRevisao(plano);
  assert.ok(ts.length <= plano.momentos.length * 2 && ts.length >= plano.momentos.length);
  assert.ok(ts.every((t: number) => t >= 0 && t < plano.duracao));
  assert.deepEqual(ts, [...ts].sort((a: number, b: number) => a - b));
});

test("curso ou reserva: trava, modelo, desistência e o formato da gravação", () => {
  const base = { ligado: true, modelo: "modelo-manifesto" };
  const deitada = { largura: 1920, altura: 1080 };
  const emPe = { largura: 1080, altura: 1920 };
  assert.deepEqual(caminhoDoCompleto({ ...base, quadro: deitada }), { caminho: "curso", modelo: "modelo-manifesto", versao: "modelo-manifesto-16x9", formato: "16:9" });
  // gravação em pé: o completo sai no próprio modelo vertical (10/10), e não mais na reserva
  assert.deepEqual(caminhoDoCompleto({ ...base, quadro: emPe }), { caminho: "curso", modelo: "modelo-manifesto", versao: "modelo-manifesto", formato: "9:16" });
  // sem a medida do quadro: a deitada quando existe (o worker mede a gravação e troca se for em pé)
  assert.deepEqual(caminhoDoCompleto(base), { caminho: "curso", modelo: "modelo-manifesto", versao: "modelo-manifesto-16x9", formato: "16:9" });
  assert.equal(caminhoDoCompleto({ ...base, ligado: false }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, modelo: null }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, desistiu: "o render falhou" }).caminho, "reserva");
  // um vertical sem a versão deitada: em pé vai pelo curso; deitada fica na reserva até a versão existir
  const lista = VERSOES_DOS_MODELOS as Record<string, Record<string, string>>;
  const antes = { ...lista["modelo-viral"] };
  try {
    delete lista["modelo-viral"]["16:9"];
    assert.deepEqual(caminhoDoCompleto({ ...base, modelo: "modelo-viral", quadro: emPe }), { caminho: "curso", modelo: "modelo-viral", versao: "modelo-viral", formato: "9:16" });
    const r = caminhoDoCompleto({ ...base, modelo: "modelo-viral", quadro: deitada });
    assert.equal(r.caminho, "reserva");
    if (r.caminho === "reserva") assert.match(r.motivo, /versão deitada \(16:9\)/);
    // sem medida e sem a deitada: vai na em pé, e o worker confere a gravação
    assert.deepEqual(caminhoDoCompleto({ ...base, modelo: "modelo-viral" }), { caminho: "curso", modelo: "modelo-viral", versao: "modelo-viral", formato: "9:16" });
    lista["modelo-viral"]["16:9"] = "modelo-viral-16x9";
    assert.deepEqual(caminhoDoCompleto({ ...base, modelo: "modelo-viral", quadro: deitada }), { caminho: "curso", modelo: "modelo-viral", versao: "modelo-viral-16x9", formato: "16:9" });
  } finally {
    lista["modelo-viral"] = antes;
  }
  // o Aula (nasce 16:9): deitada é ele mesmo; em pé precisa da versão <id>-9x16
  const aula = { ...lista["modelo-aula"] };
  try {
    delete lista["modelo-aula"]["9:16"];
    assert.deepEqual(caminhoDoCompleto({ ...base, modelo: "modelo-aula", quadro: deitada }), { caminho: "curso", modelo: "modelo-aula", versao: "modelo-aula", formato: "16:9" });
    const r = caminhoDoCompleto({ ...base, modelo: "modelo-aula", quadro: emPe });
    assert.equal(r.caminho, "reserva");
    if (r.caminho === "reserva") assert.match(r.motivo, /em pé \(9:16\)/);
    lista["modelo-aula"]["9:16"] = "modelo-aula-9x16";
    assert.deepEqual(caminhoDoCompleto({ ...base, modelo: "modelo-aula", quadro: emPe }), { caminho: "curso", modelo: "modelo-aula", versao: "modelo-aula-9x16", formato: "9:16" });
  } finally {
    lista["modelo-aula"] = aula;
  }
  for (const r of [caminhoDoCompleto({ ...base, ligado: false }), caminhoDoCompleto({ ...base, modelo: null }), caminhoDoCompleto({ ...base, modelo: "modelo-aula", quadro: emPe })]) {
    if (r.caminho === "reserva") assert.doesNotMatch(r.motivo, TRAVESSAO);
  }
  assert.equal(versaoDeitadaDoModelo("modelo-lousa"), VERSOES_DOS_MODELOS["modelo-lousa"]?.["16:9"] ?? null);
});

test("toda versão deitada da lista (versoes.json) existe no worker, é 16:9 e vem do modelo certo", () => {
  for (const m of MODELOS_DO_CURSO.filter((x) => x.formato === "9:16")) {
    const versao = versaoDeitadaDoModelo(m.id);
    if (!versao) continue;
    const arquivo = new URL(`worker/modelos/${versao}/template/modelo.json`, raiz);
    assert.ok(existsSync(arquivo), versao);
    const j = JSON.parse(readFileSync(arquivo, "utf8"));
    assert.equal(j.formato, "16:9");
    if (j.variante?.de) assert.equal(j.variante.de, m.id);
    assert.ok(existsSync(new URL(`worker/modelos/${m.id}/template/src/plano.ts`, raiz)), m.id);
  }
  assert.equal(versaoDeitadaDoModelo("modelo-manifesto"), "modelo-manifesto-16x9");
});

test("a folha do exemplo 16:9 é dela, não a do vertical", () => {
  const hash = (f: string) => createHash("sha256").update(readFileSync(new URL(f, raiz))).digest("hex");
  assert.notEqual(hash("worker/modelos/modelo-manifesto-16x9/referencias/exemplo/quadros.jpg"), hash("worker/modelos/modelo-manifesto/referencias/exemplo/quadros.jpg"));
  const comentado = readFileSync(new URL("worker/modelos/modelo-manifesto-16x9/referencias/exemplo/plano-comentado.md", raiz), "utf8");
  assert.match(comentado, /quadro deitado \(1920×1080\)/);
  assert.doesNotMatch(comentado, TRAVESSAO);
  const plano = JSON.parse(readFileSync(new URL("worker/modelos/modelo-manifesto-16x9/referencias/exemplo/plano.json", raiz), "utf8"));
  assert.equal(plano.largura, 1920);
  assert.equal(plano.palavras, undefined);
  const r = conferirPlano({ ...plano, palavras: [] }, modelo16x9, tiposDoModelo);
  // sem as palavras só a regra do "parado" palavra por palavra muda; os tipos e campos passam
  assert.ok(!r.erros.some((e: string) => /que este modelo não tem|falta|precisa de/.test(e)), r.erros.join("\n"));
});

test("gravação em pé: o plano em blocos e a conferência em blocos não dependem de ser 16:9", async () => {
  const vertical = await import(new URL("worker/modelos/modelo-manifesto/template/scripts/conferir.mjs", raiz).href);
  const modelo916 = JSON.parse(readFileSync(new URL("worker/modelos/modelo-manifesto/template/modelo.json", raiz), "utf8"));
  const tipos916 = new Set([...readFileSync(new URL("worker/modelos/modelo-manifesto/template/src/plano.ts", raiz), "utf8").matchAll(/tipo\s*:\s*"([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]));
  const deitado = planoQuePassa(3);
  const emPe = { ...deitado, largura: 1080, altura: 1920 };
  const blocos = B.blocosDoPlano(emPe.palavras, emPe.duracao);
  assert.deepEqual(blocos, B.blocosDoPlano(deitado.palavras, deitado.duracao), "os blocos saem da fala, não do quadro");
  const e1 = B.esqueletoDoBloco(emPe, blocos[1]);
  assert.deepEqual([e1.largura, e1.altura], [1080, 1920]);
  const a = B.conferirEmBlocos({ plano: emPe, blocos, conferirPlano: vertical.conferirPlano, modelo: modelo916, tipos: tipos916 });
  const b = B.conferirEmBlocos({ plano: deitado, blocos, conferirPlano: vertical.conferirPlano, modelo: modelo916, tipos: tipos916 });
  assert.deepEqual(a.porBloco, b.porBloco);
  assert.equal(a.ok, b.ok);
  // as partes do render saem da duração e do fps
  assert.deepEqual(B.partesDoRender(emPe.duracao, 30), B.partesDoRender(deitado.duracao, 30));
});

test("todo modelo tem o que o render em partes usa (comum.mjs, conferirPlano, tiposDoModelo e a composição Edicao)", () => {
  const indice = JSON.parse(readFileSync(new URL("worker/modelos/indice.json", raiz), "utf8")) as Array<{ id: string }>;
  for (const { id } of indice) {
    const t = `worker/modelos/${id}/template`;
    assert.ok(existsSync(new URL(`${t}/scripts/comum.mjs`, raiz)), `${id}: comum.mjs`);
    const conferir = readFileSync(new URL(`${t}/scripts/conferir.mjs`, raiz), "utf8");
    assert.match(conferir, /export (async )?function conferirPlano|export const conferirPlano|export \{[^}]*conferirPlano/, `${id}: conferirPlano`);
    assert.match(conferir, /tiposDoModelo/, `${id}: tiposDoModelo`);
  }
});

test("o completo pede ao worker o formato da gravação e deixa o worker trocar de versão pela medida", () => {
  const src = readFileSync(new URL("lib/media/montagem-do-completo.ts", raiz), "utf8");
  const envio = src.slice(src.indexOf("async function enviarCompletoAoModelo"), src.indexOf("async function desistirDoModeloNoCompleto"));
  assert.match(envio, /\s+formato,\s+formatoPelaGravacao: true,\s+completo: true,/);
  assert.doesNotMatch(envio, /formato: "16:9",/, "o formato não é mais fixo no deitado");
  assert.match(src, /enviarCompletoAoModelo\(v, m, curso\.modelo, curso\.versao, curso\.formato\)/);
  const worker = readFileSync(new URL("worker/src/modelo/editar-no-modelo.mjs", raiz), "utf8");
  const fluxo = worker.slice(worker.indexOf("export async function editarNoModelo"), worker.indexOf("const projeto = criarProjeto(modelo, pasta);"));
  assert.match(fluxo, /pedido\.formatoPelaGravacao[\s\S]*quadroDoArquivo\(trecho\)[\s\S]*modelo = modeloNoFormato\(pedido\.modelo, daGravacao\)/);
});

test("o quadro do arquivo: em pé, deitado e girado pelo celular", { skip: spawnSync("ffprobe", ["-version"]).status !== 0 && "sem ffprobe" }, async () => {
  const W = await import(new URL("worker/src/modelo/editar-no-modelo.mjs", raiz).href);
  const pasta = mkdtempSync(join(tmpdir(), "quadro-"));
  try {
    const gerar = (nome: string, tamanho: string, extra: string[] = []) => {
      const saida = join(pasta, nome);
      const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...extra, "-f", "lavfi", "-i", `color=c=gray:s=${tamanho}:r=10`, "-t", "0.2", "-c:v", "libx264", "-pix_fmt", "yuv420p", saida]);
      assert.equal(r.status, 0, String(r.stderr));
      return saida;
    };
    assert.deepEqual(W.quadroDoArquivo(gerar("em-pe.mp4", "64x112")), { largura: 64, altura: 112 });
    assert.deepEqual(W.quadroDoArquivo(gerar("deitado.mp4", "112x64")), { largura: 112, altura: 64 });
    const girado = join(pasta, "girado.mp4");
    const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-display_rotation:v:0", "90", "-i", join(pasta, "deitado.mp4"), "-c", "copy", girado]);
    if (r.status === 0) assert.deepEqual(W.quadroDoArquivo(girado), { largura: 64, altura: 112 });
    assert.equal(W.quadroDoArquivo(join(pasta, "nao-existe.mp4")), null);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("o prazo do app para o completo no modelo cabe no teto da espera", () => {
  assert.ok(prazoDoCompletoNoModeloMs(20 * 60) < TETO_DA_ESPERA_MS);
  assert.ok(prazoDoCompletoNoModeloMs(20 * 60) > prazoDoCompletoNoModeloMs(5 * 60));
});
