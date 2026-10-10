// As peças da campanha no estilo do modelo do vídeo (10/10): a fala montada do
// modelo cabe no pedido do "Meu estilo" sem perder a regra da marca, e o teto
// do editor do curso é o que o Bruno liberou. Sem banco, sem rede, sem IA.
// Rodar: npx tsx --test scripts/testes/pecas-no-modelo-1010.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";

const { falaDoModeloParaAsPecas, modeloDaFala, estiloDoModelo, TETO_DA_FALA_DO_MODELO, ABERTURA_DA_FALA } = await import("@/lib/media/editor-do-curso/estilo-das-pecas");
const { MODELOS_DO_CURSO, tetoDoPlanoUsd } = await import("@/lib/media/editor-do-curso/no-corte");
const { TETO } = await import("@/lib/biblioteca-de-design/tipos");

test("todo modelo do catálogo tem estilo extraído, com cor", () => {
  for (const m of MODELOS_DO_CURSO) {
    const e = estiloDoModelo(m.id);
    assert.ok(e, `${m.id} sem estilo`);
    assert.ok(e!.cores.length > 0, `${m.id} sem cor`);
    for (const c of e!.cores) assert.match(c.hex, /^#[0-9A-F]{3,8}$/);
  }
});

test("a fala de cada modelo cabe no pedido, fecha com a regra da marca e não tem travessão", () => {
  assert.ok(TETO_DA_FALA_DO_MODELO <= TETO.pedido);
  for (const m of MODELOS_DO_CURSO) {
    const f = falaDoModeloParaAsPecas(m.id)!;
    assert.ok(f.length <= TETO.pedido, `${m.id}: ${f.length}`);
    assert.ok(f.startsWith(`${ABERTURA_DA_FALA} ${m.nome},`), m.id);
    assert.ok(f.endsWith("nunca tingindo a foto."), `${m.id} perdeu a regra da marca`);
    assert.doesNotMatch(f, /[—–]/);
    assert.equal(modeloDaFala(f), m.nome);
  }
  assert.equal(falaDoModeloParaAsPecas("modelo-que-nao-existe"), null);
  assert.equal(modeloDaFala("Quero um estilo claro e limpo"), null);
});

test("a fala só leva cor que o próprio modelo tem", () => {
  const f = falaDoModeloParaAsPecas("modelo-lousa")!;
  const doTema = new Set(estiloDoModelo("modelo-lousa")!.cores.map((c) => c.hex));
  for (const hex of f.match(/#[0-9A-F]{3,8}\b/gi) ?? []) assert.ok(doTema.has(hex.toUpperCase()), hex);
});

test("teto do editor do curso: até US$ 2 por corte (10/10), e US$ 1 por minuto acima disso", () => {
  delete process.env.EDITOR_DO_CURSO_TETO_USD;
  assert.equal(tetoDoPlanoUsd(50), 2);
  assert.equal(tetoDoPlanoUsd(90), 2);
  assert.equal(tetoDoPlanoUsd(180), 3);
  process.env.EDITOR_DO_CURSO_TETO_USD = "1.5";
  assert.equal(tetoDoPlanoUsd(50), 1.5);
  delete process.env.EDITOR_DO_CURSO_TETO_USD;
});
