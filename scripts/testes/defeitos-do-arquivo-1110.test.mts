// Os defeitos do teste de ponta a ponta no modelo Arquivo (11/10 noite, vídeo do Ygor):
// o infográfico saía com um homem na "foto de arquivo" do estilo e com "module module module"
// escrito; o revisor reprovava 3 vezes e a arte parava. Nada toca banco, rede ou IA.
// Rodar: npx tsx --test scripts/testes/defeitos-do-arquivo-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { linguagemDoInfografico, promptDeEstiloDoModelo } from "@/lib/media/editor-do-curso/arte-pela-ia";

test("infográfico no Arquivo (estilo sem apresentador) proíbe pessoa", () => {
  const s = promptDeEstiloDoModelo("modelo-arquivo");
  assert.ok(s, "o Arquivo tem prompt de estilo");
  assert.match(linguagemDoInfografico(s!).evitar, /No people, faces or silhouettes/);
});

test("worker: o /editar-no-modelo pede o plano no planoUrl, nunca no cenaUrl do editor avançado (d368b43 quebrou os 79 modelos)", async () => {
  const { readFileSync } = await import("node:fs");
  const fonte = readFileSync(new URL("../../worker/src/index.mjs", import.meta.url), "utf8");
  const inicio = fonte.indexOf('const { editarNoModelo } = await import("./modelo/editar-no-modelo.mjs");');
  assert.ok(inicio > 0, "achei o caminho dos modelos do curso");
  const fim = fonte.indexOf("const e = await editarNoModelo(", inicio);
  const pedirPlano = fonte.slice(inicio, fim);
  assert.match(pedirPlano, /fetch\(pedido\.planoUrl/);
  assert.doesNotMatch(pedirPlano, /pedido.cenaUrl/);
});
