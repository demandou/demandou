/**
 * As versões de cada modelo por formato (10/10): o versoes.json sai do disco
 * (worker/modelos/versoes.mjs), cada pasta listada existe e roda o fluxo do
 * curso no formato da chave, o modelo vale no formato nativo dele e o gerador
 * deixa de fora a pasta pela metade. Sem banco, sem rede, sem IA.
 *   npx tsx --test scripts/testes/versoes-dos-modelos-1010.test.mts
 * Depois de criar ou mudar uma pasta <id>-16x9 ou <id>-9x16: npm run modelos:versoes
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = new URL("../../", import.meta.url);
const V = await import(new URL("worker/modelos/versoes.mjs", raiz).href);
const { MODELOS_DO_CURSO, VERSOES_DOS_MODELOS, versaoNoFormato } = await import("@/lib/media/editor-do-curso/no-corte");

const lerJson = (f: string) => JSON.parse(readFileSync(new URL(f, raiz), "utf8"));
const formatoDaPasta = (pasta: string) => (lerJson(`worker/modelos/${pasta}/template/modelo.json`).formato === "16:9" ? "16:9" : "9:16");

test("o versoes.json está em dia com o disco (senão: npm run modelos:versoes)", () => {
  const { versoes } = V.versoesDoDisco(fileURLToPath(new URL("worker/modelos/", raiz)));
  assert.deepEqual(lerJson("lib/media/editor-do-curso/versoes.json"), versoes, "o versoes.json não bate com worker/modelos: rode npm run modelos:versoes");
});

test("cada pasta da lista existe, roda o fluxo do curso e está no formato da chave", () => {
  for (const [id, porFormato] of Object.entries(VERSOES_DOS_MODELOS)) {
    for (const [formato, pasta] of Object.entries(porFormato) as Array<[string, string]>) {
      for (const arq of ["referencias/SKILL.md", "template/modelo.json", "template/src/plano.ts", "template/scripts/render.mjs", "template/scripts/conferir.mjs"]) {
        assert.ok(existsSync(new URL(`worker/modelos/${pasta}/${arq}`, raiz)), `${pasta}: falta ${arq}`);
      }
      assert.equal(formatoDaPasta(pasta), formato, `${pasta} não é ${formato}`);
      if (pasta === id) continue;
      assert.equal(pasta, `${id}-${formato.replace(":", "x")}`, `${pasta}: o nome da versão`);
      const de = lerJson(`worker/modelos/${pasta}/template/modelo.json`).variante?.de;
      if (de) assert.equal(de, id, `${pasta}: versão de outro modelo`);
    }
  }
});

test("todo modelo do catálogo vale no formato nativo dele, e versão nenhuma vira modelo no catálogo", () => {
  assert.deepEqual(Object.keys(VERSOES_DOS_MODELOS).sort(), MODELOS_DO_CURSO.map((m) => m.id).sort());
  for (const m of MODELOS_DO_CURSO) {
    assert.equal(VERSOES_DOS_MODELOS[m.id]?.[m.formato], m.id, m.id);
    assert.ok(!V.ehVersao(m.id), `${m.id} é uma versão, não um modelo`);
  }
  const indice = lerJson("worker/modelos/indice.json") as Array<{ id: string }>;
  assert.deepEqual(indice.map((m) => m.id), MODELOS_DO_CURSO.map((m) => m.id));
});

test("versaoNoFormato: o nativo é o próprio modelo, o outro vem da lista, fora do catálogo é null", () => {
  assert.equal(versaoNoFormato("modelo-manifesto", "9:16"), "modelo-manifesto");
  assert.equal(versaoNoFormato("modelo-manifesto", "16:9"), "modelo-manifesto-16x9");
  assert.equal(versaoNoFormato("modelo-aula", "16:9"), "modelo-aula");
  assert.equal(versaoNoFormato("modelo-aula", "9:16"), VERSOES_DOS_MODELOS["modelo-aula"]?.["9:16"] ?? null);
  assert.equal(versaoNoFormato("modelo-manifesto-16x9", "16:9"), null, "a versão não é id de modelo");
  assert.equal(versaoNoFormato(null, "9:16"), null);
  assert.equal(versaoNoFormato("modelo-que-nao-existe", "9:16"), null);
});

test("o worker escolhe a pasta nos dois sentidos, conferindo no disco", async () => {
  const pasta = mkdtempSync(join(tmpdir(), "modelos-"));
  const antes = process.env.PASTA_DOS_MODELOS;
  try {
    const criar = (nome: string, modeloJson: Record<string, unknown>) => {
      mkdirSync(join(pasta, nome, "template", "src"), { recursive: true });
      writeFileSync(join(pasta, nome, "template", "src", "plano.ts"), "//");
      writeFileSync(join(pasta, nome, "template", "modelo.json"), JSON.stringify(modeloJson));
    };
    criar("modelo-a", {});
    criar("modelo-a-16x9", { formato: "16:9", variante: { de: "modelo-a", formato: "16:9" } });
    criar("modelo-b", { formato: "16:9" });
    criar("modelo-b-9x16", { variante: { de: "modelo-b", formato: "9:16" } });
    criar("modelo-c", {});
    criar("modelo-c-16x9", {}); // diz 9:16: não vale como deitada
    process.env.PASTA_DOS_MODELOS = pasta;
    const W = await import(`${new URL("worker/src/modelo/editar-no-modelo.mjs", raiz).href}?pasta=${Date.now()}`);
    assert.equal(W.modeloNoFormato("modelo-a"), "modelo-a");
    assert.equal(W.modeloNoFormato("modelo-a", "9:16"), "modelo-a");
    assert.equal(W.modeloNoFormato("modelo-a", "16:9"), "modelo-a-16x9");
    assert.equal(W.modeloNoFormato("modelo-b", "9:16"), "modelo-b-9x16");
    assert.equal(W.modeloNoFormato("modelo-b", "16:9"), "modelo-b");
    assert.equal(W.modeloNoFormato("modelo-a-16x9", "9:16"), "modelo-a", "da versão de volta ao modelo");
    assert.equal(W.modeloNoFormato("modelo-b-9x16", "16:9"), "modelo-b");
    assert.throws(() => W.modeloNoFormato("modelo-c", "16:9"), /modelo-c ainda não tem a versão deitada \(16:9\)/);
    assert.throws(() => W.modeloNoFormato("modelo-a", "4:5"), /formato desconhecido/);
    assert.equal(W.modeloDeBase("modelo-b-9x16"), "modelo-b");
    assert.equal(W.modeloDeBase("modelo-a"), "modelo-a");
  } finally {
    if (antes === undefined) delete process.env.PASTA_DOS_MODELOS;
    else process.env.PASTA_DOS_MODELOS = antes;
    rmSync(pasta, { recursive: true, force: true });
  }
});

test("o gerador deixa de fora a pasta pela metade, o formato trocado e a versão de outro modelo", () => {
  const pasta = mkdtempSync(join(tmpdir(), "versoes-"));
  try {
    const criar = (nome: string, modeloJson: Record<string, unknown>, sem: string[] = []) => {
      for (const arq of ["referencias/SKILL.md", "template/src/plano.ts", "template/scripts/render.mjs", "template/scripts/conferir.mjs"]) {
        if (sem.includes(arq)) continue;
        mkdirSync(join(pasta, nome, arq, ".."), { recursive: true });
        writeFileSync(join(pasta, nome, arq), "//");
      }
      mkdirSync(join(pasta, nome, "template"), { recursive: true });
      writeFileSync(join(pasta, nome, "template", "modelo.json"), JSON.stringify(modeloJson));
    };
    criar("modelo-a", {});
    criar("modelo-a-16x9", { formato: "16:9", variante: { de: "modelo-a", formato: "16:9" } });
    criar("modelo-b", {});
    criar("modelo-b-16x9", { formato: "16:9" }, ["template/scripts/render.mjs"]);
    criar("modelo-c", {});
    criar("modelo-c-16x9", {});
    criar("modelo-d", { formato: "16:9" });
    criar("modelo-d-9x16", { variante: { de: "modelo-x" } });
    criar("modelo-d-16x9", { formato: "16:9" });
    criar("modelo-e", { formato: "16:9" });
    criar("modelo-e-9x16", { formato: "9:16", variante: { de: "modelo-e", formato: "9:16" } });
    criar("modelo-z-16x9", { formato: "16:9" });
    const { versoes, avisos } = V.versoesDoDisco(pasta);
    assert.deepEqual(versoes, {
      "modelo-a": { "9:16": "modelo-a", "16:9": "modelo-a-16x9" },
      "modelo-b": { "9:16": "modelo-b" },
      "modelo-c": { "9:16": "modelo-c" },
      "modelo-d": { "16:9": "modelo-d" },
      "modelo-e": { "9:16": "modelo-e-9x16", "16:9": "modelo-e" },
    });
    for (const nome of ["modelo-b-16x9", "modelo-c-16x9", "modelo-d-9x16", "modelo-d-16x9", "modelo-z-16x9"]) {
      assert.ok(avisos.some((a: string) => a.startsWith(`${nome}:`)), `${nome} sem aviso`);
    }
    for (const a of avisos) assert.doesNotMatch(a, /[—–]/);
    const destino = join(pasta, "saida", "versoes.json");
    const r = V.gravarVersoes({ pasta, destino });
    assert.deepEqual(JSON.parse(readFileSync(destino, "utf8")), versoes);
    assert.deepEqual([r.modelos, r.nosDois, r.deitados, r.emPe], [5, 2, 3, 4]);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});
