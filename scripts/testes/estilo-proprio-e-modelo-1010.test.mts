/**
 * O "Meu estilo" antigo não vence o modelo escolhido depois dele (10/10,
 * noite): o Torre escolhido antes do envio e as artes saindo no estilo de
 * 09/10. Rodar: npx tsx --test scripts/testes/estilo-proprio-e-modelo-1010.test.mts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { estiloProprioDepoisDoModelo } = await import("@/lib/media/editor-do-curso/no-corte");

test("estilo próprio confirmado ANTES da escolha do modelo não vence o modelo", () => {
  assert.equal(estiloProprioDepoisDoModelo("2026-10-09T14:51:25Z", "2026-10-10T23:02:21Z"), false);
});

test("estilo próprio confirmado DEPOIS da escolha do modelo vence (o cliente pediu de forma explícita)", () => {
  assert.equal(estiloProprioDepoisDoModelo("2026-10-11T10:00:00Z", "2026-10-10T23:02:21Z"), true);
});

test("sem data da escolha do modelo, vale o estilo confirmado; sem data da confirmação, vale o modelo", () => {
  assert.equal(estiloProprioDepoisDoModelo("2026-10-09T14:51:25Z", null), true);
  assert.equal(estiloProprioDepoisDoModelo(null, "2026-10-10T23:02:21Z"), false);
});

test("as duas regras das artes usam a mesma conferência", () => {
  const raiz = new URL("../../", import.meta.url);
  for (const f of ["lib/media/editor-do-curso/arte-pelo-modelo-servidor.ts", "lib/media/arte-com-frase.tsx"]) {
    assert.match(readFileSync(new URL(f, raiz), "utf8"), /estiloProprioValeSobreOModelo\(projectId\)/, f);
  }
});

test("a chave das artes pelo modelo liga com o valor gravado com quebra de linha (o PowerShell manda \"1\r\n\")", async () => {
  const { arteDoModeloLigada } = await import("@/lib/media/editor-do-curso/arte-pelo-modelo");
  assert.equal(arteDoModeloLigada({ ARTE_PELO_MODELO: "1\r\n" }), true);
  assert.equal(arteDoModeloLigada({ ARTE_PELO_MODELO: " 1 " }), true);
  assert.equal(arteDoModeloLigada({ ARTE_PELO_MODELO: "0" }), false);
  assert.equal(arteDoModeloLigada({}), false);
});
