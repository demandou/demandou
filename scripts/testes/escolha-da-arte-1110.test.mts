// A arte espera a escolha do cliente (11/10, pedido do Bruno; lib/media/escolha-da-arte.ts).
// O que a escolha grava no post, o modelo aceito da tela e o que o card lê da espera.
// Nada toca banco, rede ou IA.
// Rodar: npx tsx --test scripts/testes/escolha-da-arte-1110.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { escolhaDaArteLigada, metadataDaEscolha, modeloValido } from "@/lib/media/escolha-da-arte";
import { esperaDaIdentidade } from "@/lib/modelos-de-arte/espera-da-identidade";

const esperando = { aguardandoIdentidade: true, esperaEscolha: true, origem: "video", frase: "Grava uma vez", fotosEscolhidas: [{ id: "f1", modelo: null }] };

test("a chave desligada deixa tudo como antes", () => {
  const antes = process.env.ESCOLHA_DA_ARTE;
  delete process.env.ESCOLHA_DA_ARTE;
  assert.equal(escolhaDaArteLigada(), false);
  process.env.ESCOLHA_DA_ARTE = "1";
  assert.equal(escolhaDaArteLigada(), true);
  if (antes === undefined) delete process.env.ESCOLHA_DA_ARTE;
  else process.env.ESCOLHA_DA_ARTE = antes;
});

test("seguir o vídeo num projeto com modelo do curso grava o estilo: a arte sai pela IA nele", () => {
  const m = metadataDaEscolha(esperando, { modelo: { mestre: true }, usarMateriais: true, estiloDoCurso: "modelo-arquivo" });
  assert.equal(m.esperaEscolha, undefined);
  assert.equal(m.aguardandoIdentidade, true, "a espera continua até a arte sair (o quadro mostra 'fazendo')");
  assert.deepEqual(m.arteNoModelo, { modelo: "modelo-arquivo", origem: "escolha" });
  assert.equal(m.arteNoPacote, true, "a arte da semana do vídeo não é cobrada de novo");
  assert.equal(m.frase, "Grava uma vez");
});

test("modelo da biblioteca vai para modeloDoPost, sem estilo do curso", () => {
  const m = metadataDaEscolha({ ...esperando, arteNoModelo: { modelo: "x" } }, { modelo: { designId: "d1", nome: "Papel" }, usarMateriais: true, estiloDoCurso: "modelo-arquivo" });
  assert.deepEqual(m.modeloDoPost, { designId: "d1", nome: "Papel" });
  assert.equal(m.arteNoModelo, undefined);
});

test("sem meus materiais: a lista de fotos fica vazia (a Biblioteca não entra)", () => {
  const m = metadataDaEscolha(esperando, { modelo: { mestre: true }, usarMateriais: false, estiloDoCurso: null });
  assert.deepEqual(m.fotosEscolhidas, []);
  const com = metadataDaEscolha(esperando, { modelo: { mestre: true }, usarMateriais: true, estiloDoCurso: null });
  assert.deepEqual(com.fotosEscolhidas, esperando.fotosEscolhidas);
});

test("modelo da tela: só mestre, design ou modelo do catálogo com id válido", () => {
  assert.deepEqual(modeloValido({ mestre: true }), { mestre: true, nome: null });
  assert.equal(modeloValido({ designId: "x; drop" }), null);
  assert.equal(modeloValido({}), null);
  assert.deepEqual(modeloValido({ catalogoId: "manifesto" }), { catalogoId: "manifesto", nome: null });
});

test("o card lê a espera da escolha com o post de referência", () => {
  const e = esperaDaIdentidade({ id: "p1", runId: "r1", imageUrl: null, metadata: esperando });
  assert.equal(e?.estado, "aguardando");
  assert.equal(e?.escolha, true);
  assert.equal(e?.postId, "p1");
  const daIdentidade = esperaDaIdentidade({ id: "p2", runId: "r1", imageUrl: null, metadata: { aguardandoIdentidade: true } });
  assert.equal(daIdentidade?.escolha, undefined);
});
