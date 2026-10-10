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
import { existsSync, readFileSync } from "node:fs";

const raiz = new URL("../../", import.meta.url);
const B = await import(new URL("worker/src/modelo/blocos-do-plano.mjs", raiz).href);
const { conferirPlano } = await import(new URL("worker/modelos/modelo-manifesto-16x9/template/scripts/conferir.mjs", raiz).href);
const { instrucaoDoBloco } = await import("@/lib/media/editor-do-curso/escrever-plano");
const { caminhoDoCompleto, versaoDeitadaDoModelo, VERSOES_DEITADAS, tetoDoPlanoUsd, prazoDoCompletoNoModeloMs } = await import("@/lib/media/editor-do-curso/no-corte");
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

test("curso ou reserva: trava, modelo, versão deitada, desistência e gravação em pé", () => {
  const base = { ligado: true, modelo: "modelo-manifesto" };
  assert.deepEqual(caminhoDoCompleto(base), { caminho: "curso", modelo: "modelo-manifesto", versao: "modelo-manifesto-16x9" });
  assert.equal(caminhoDoCompleto({ ...base, ligado: false }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, modelo: null }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, modelo: "modelo-viral" }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, desistiu: "o render falhou" }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, quadro: { largura: 1080, altura: 1920 } }).caminho, "reserva");
  assert.equal(caminhoDoCompleto({ ...base, quadro: { largura: 1920, altura: 1080 } }).caminho, "curso");
  for (const r of [caminhoDoCompleto({ ...base, ligado: false }), caminhoDoCompleto({ ...base, modelo: "modelo-viral" })]) {
    if (r.caminho === "reserva") assert.doesNotMatch(r.motivo, TRAVESSAO);
  }
  assert.equal(versaoDeitadaDoModelo("modelo-lousa"), null);
});

test("toda versão deitada da lista existe no worker, é 16:9 e vem do modelo certo", () => {
  for (const [id, versao] of Object.entries(VERSOES_DEITADAS)) {
    const m = new URL(`worker/modelos/${versao}/template/modelo.json`, raiz);
    assert.ok(existsSync(m), versao);
    const j = JSON.parse(readFileSync(m, "utf8"));
    assert.equal(j.formato, "16:9");
    assert.equal(j.variante?.de, id);
    assert.ok(existsSync(new URL(`worker/modelos/${id}/template/src/plano.ts`, raiz)), id);
  }
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

test("o prazo do app para o completo no modelo cabe no teto da espera", () => {
  assert.ok(prazoDoCompletoNoModeloMs(20 * 60) < TETO_DA_ESPERA_MS);
  assert.ok(prazoDoCompletoNoModeloMs(20 * 60) > prazoDoCompletoNoModeloMs(5 * 60));
});
